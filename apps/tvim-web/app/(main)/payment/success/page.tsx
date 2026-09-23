import { redirect } from "next/navigation";
import { resolveRootLocale } from "@/lib/root-locale";
import { paymentResultPath, readPaymentVerdict } from "@/lib/payments/result";
import { toSearchParams, type RouteSearchParams } from "@/lib/search-params";

// The unprefixed address the admin's payment section hands to the gateway as
// its success url. A gateway stores one url per outcome, so the language
// cannot live in it — the visitor's own locale is resolved here and they are
// forwarded to the confirmation written in it.
export const dynamic = "force-dynamic";

export default async function PaymentSuccessEntryPage({
    searchParams,
}: {
    searchParams: Promise<RouteSearchParams>;
}) {
    const { locale } = await resolveRootLocale();

    // Reaching this address is the gateway calling the payment good. A gateway
    // configured with one url for both outcomes would arrive here on a decline
    // too, so an explicit verdict in the query string is believed over the
    // address; anything else keeps the success this url stands for.
    const verdict = readPaymentVerdict(toSearchParams(await searchParams));

    redirect(paymentResultPath(verdict ?? "success", locale));
}
