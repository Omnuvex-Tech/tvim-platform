import type { SiteLocale } from "@/lib/site-locales";

export type PaymentOutcome = "success" | "error";

/**
 * Where a finished payment lands. These two paths are what the admin's payment
 * section points the gateway at, so they are spelled out in one place: renaming
 * a segment here without changing the admin would send every shopper to a 404.
 *
 * The unprefixed form is the one the admin stores. A gateway returns the
 * browser to a single fixed url, so the language cannot be baked into it — the
 * pages behind these read the visitor's own locale and forward to the language
 * the shopper was shopping in.
 *
 * Both outcomes have a screen of their own. The shared thank-you screen stays
 * where every other completed form ends: it confirms that a submission was
 * sent, which is not what a shopper who just paid needs to read.
 */
export const PAYMENT_RESULT_ENTRY: Record<PaymentOutcome, string> = {
    success: "/payment/success",
    error: "/payment/error",
};

export const paymentResultPath = (outcome: PaymentOutcome, locale: SiteLocale) =>
    `/${locale}${PAYMENT_RESULT_ENTRY[outcome]}`;

const normalize = (value: unknown) =>
    String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

/**
 * Word statuses. Kapital Bank reports `FullyPaid` / `Declined` / `Canceled`,
 * Payriff `APPROVED` / `DECLINED`; the rest are the spellings the api uses for
 * the same states on the order itself.
 */
const STATUS_KEYS = ["status", "state", "result", "paymentstatus", "orderstatus", "transactionstatus"];

const STATUS_SUCCESS = new Set([
    "success",
    "successful",
    "succeeded",
    "approved",
    "paid",
    "fullypaid",
    "completed",
    "complete",
    "ok",
]);

const STATUS_FAILURE = new Set([
    "error",
    "fail",
    "failed",
    "failure",
    "declined",
    "denied",
    "rejected",
    "cancel",
    "cancelled",
    "canceled",
    "expired",
    "timeout",
    "unpaid",
    "refunded",
    "voided",
]);

/**
 * Numeric result codes, where zero is the approval. Kept apart from the boolean
 * keys below on purpose: `resultCode=0` is a payment that went through, while
 * `success=0` is one that did not, and a single table cannot mean both.
 */
const CODE_KEYS = ["resultcode", "rc", "responsecode", "code", "errorcode"];
const CODE_SUCCESS = new Set(["0", "00", "000", "0000"]);

/** Plain booleans. */
const BOOLEAN_KEYS = ["success", "approved", "paid", "issuccess"];
const BOOLEAN_TRUE = new Set(["1", "true", "yes", "y"]);
const BOOLEAN_FALSE = new Set(["0", "false", "no", "n"]);

const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;

const readFromRecord = (record: Record<string, unknown> | null): PaymentOutcome | null => {
    if (!record) return null;

    // The gateway picks the casing and separators, so entries are matched on a
    // flattened key rather than an exact one.
    const flattened = new Map<string, unknown>();
    for (const [key, value] of Object.entries(record)) {
        flattened.set(normalize(key), value);
    }

    for (const key of STATUS_KEYS) {
        if (!flattened.has(key)) continue;
        const token = normalize(flattened.get(key));
        if (STATUS_SUCCESS.has(token)) return "success";
        if (STATUS_FAILURE.has(token)) return "error";
    }

    for (const key of CODE_KEYS) {
        if (!flattened.has(key)) continue;
        const token = normalize(flattened.get(key));
        if (!token) continue;
        return CODE_SUCCESS.has(token) ? "success" : "error";
    }

    for (const key of BOOLEAN_KEYS) {
        if (!flattened.has(key)) continue;
        const raw = flattened.get(key);
        if (typeof raw === "boolean") return raw ? "success" : "error";
        const token = normalize(raw);
        if (BOOLEAN_TRUE.has(token)) return "success";
        if (BOOLEAN_FALSE.has(token)) return "error";
    }

    return null;
};

/**
 * The verdict for a returning shopper, read from the gateway's own query string
 * first and then from whatever the api made of its callback.
 *
 * This only decides which screen to show — the server-to-server webhook is what
 * settles the order. An unreadable result is treated as a failure on purpose:
 * both mistakes are bad, but only one of them tells someone their payment went
 * through when nobody has confirmed that it did.
 */
export const resolvePaymentOutcome = (
    searchParams: URLSearchParams | null,
    payload: unknown
): PaymentOutcome => {
    if (searchParams) {
        const fromQuery = readFromRecord(Object.fromEntries(searchParams.entries()));
        if (fromQuery) return fromQuery;
    }

    const root = asRecord(payload);
    if (root) {
        const data = asRecord(root.data);

        for (const source of [asRecord(data?.payment), asRecord(data?.order), data, root]) {
            const outcome = readFromRecord(source);
            if (outcome) return outcome;
        }
    }

    return "error";
};

/**
 * Keys that only a payment gateway leaves on a return url. A form in this app
 * sends the shopper to the thank-you screen with a bare path, so anything
 * carrying one of these arrived from a bank rather than from a submitted form.
 */
const RETURN_MARKER_KEYS = [
    ...STATUS_KEYS,
    ...CODE_KEYS,
    ...BOOLEAN_KEYS,
    "id",
    "orderid",
    "order",
    "orderno",
    "ordernumber",
    "paymentid",
    "transactionid",
    "sessionid",
    "invoiceuuid",
    "payload",
];

/**
 * The verdict for a browser landing on a page that is not the payment callback
 * — in practice the thank-you screen, which is where the gateway's stored
 * return url still points for orders placed before that setting is changed.
 *
 * `null` means the request carries no trace of a payment at all: a plain form
 * submission, which belongs on the thank-you screen and is left there.
 *
 * A return that is recognisably a payment but states no verdict is reported as
 * a failure, the same way `resolvePaymentOutcome` treats an unreadable one: the
 * webhook is what settles the order, and of the two possible mistakes only one
 * tells a shopper their payment went through when nobody has confirmed it.
 */
export const readPaymentReturn = (
    searchParams: URLSearchParams | null
): PaymentOutcome | null => {
    if (!searchParams) return null;

    const verdict = readPaymentVerdict(searchParams);
    if (verdict) return verdict;

    const present = new Set([...searchParams.keys()].map(normalize));
    return RETURN_MARKER_KEYS.some((key) => present.has(key)) ? "error" : null;
};

/**
 * The verdict a return url states outright, and `null` when it states none.
 *
 * The success entry reads this before trusting its own address: a gateway that
 * keeps one return url for both outcomes would otherwise confirm a declined
 * payment. The failure entry does not, on purpose — a query string is
 * whatever the shopper's browser was handed, so it may turn a payment down but
 * never wave one through.
 */
export const readPaymentVerdict = (
    searchParams: URLSearchParams | null
): PaymentOutcome | null =>
    searchParams ? readFromRecord(Object.fromEntries(searchParams.entries())) : null;
