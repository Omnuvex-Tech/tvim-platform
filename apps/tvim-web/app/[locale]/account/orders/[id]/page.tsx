import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb, RemoteImage } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/guest/session";
import { getSiteChromeData } from "@/lib/site-chrome";
import { normalizeLocale } from "@/lib/site-locales";
import { AccountNavigation } from "../../account-navigation";
import { localizedHref } from "@/lib/routes";
import { getTranslations } from "@/lib/i18n";
import { statusLabel } from "@/lib/order-status";

type OrderStatus = {
    code?: string | null;
    text?: string | null;
};

type OrderTotals = {
    subtotal?: number | string | null;
    discount_hour_discount?: number | string | null;
    promo_discount?: number | string | null;
    delivery_price?: number | string | null;
    total?: number | string | null;
    initial_payment?: number | string | null;
    remaining_installment_total?: number | string | null;
    monthly_amount?: number | string | null;
    payable_total?: number | string | null;
};

type OrderDetailItem = {
    id?: number;
    product_id?: number | null;
    product_variation_id?: number | null;
    sku?: string | null;
    product_name?: string | null;
    variation_name?: string | null;
    image?: string | null;
    qty?: number | null;
    original_unit_price?: number | string | null;
    unit_price?: number | string | null;
    line_subtotal?: number | string | null;
    line_discount_hour?: number | string | null;
    line_total?: number | string | null;
};

type OrderDetailResponse = {
    id?: number;
    uuid?: string | null;
    number?: string | null;
    customer?: {
        id?: number;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
    } | null;
    status?: OrderStatus | null;
    payment_status?: OrderStatus | null;
    currency?: string | null;
    totals?: OrderTotals | null;
    promo?: {
        id?: number | null;
        code?: string | null;
        discount?: number | string | null;
    } | null;
    delivery?: {
        delivery_price_id?: number | null;
        name?: string | null;
        price?: number | string | null;
    } | null;
    payment_method?: {
        key?: string | null;
        name?: string | null;
        description?: string | null;
        type?: string | null;
        is_online?: boolean | null;
        requires_redirect?: boolean | null;
        gateway_code?: string | null;
        icon_path?: string | null;
        selected_installment?: {
            id?: number | null;
            month?: number | null;
            percent?: number | string | null;
            initial_payment?: number | string | null;
            interest_amount?: number | string | null;
            remaining_total_with_interest?: number | string | null;
            total_with_interest?: number | string | null;
            monthly_amount?: number | string | null;
        } | null;
    } | null;
    payments?: Array<{
        id?: number;
        method_code?: string | null;
        status?: OrderStatus | null;
        amount?: number | string | null;
        currency?: string | null;
        provider_reference?: string | null;
        provider_payment_id?: string | null;
        redirect_url?: string | null;
        provider_session?: unknown[] | null;
        provider_payload?: Record<string, unknown> | null;
        paid_at?: string | null;
        failed_at?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        payment_installment?: {
            id?: number | null;
            month?: number | null;
            percent?: number | string | null;
            initial_payment?: number | string | null;
            interest_amount?: number | string | null;
            monthly_amount?: number | string | null;
            remaining_total_with_interest?: number | string | null;
            total_with_interest?: number | string | null;
        } | null;
        events?: Array<{
            id?: number;
            event_type?: string | null;
            provider?: string | null;
            payload?: Record<string, unknown> | null;
            occurred_at?: string | null;
            created_at?: string | null;
        }> | null;
    }> | null;
    comment?: string | null;
    placed_at?: string | null;
    paid_at?: string | null;
    cancelled_at?: string | null;
    address?: {
        type?: string | null;
        label?: string | null;
        name?: string | null;
        surname?: string | null;
        passport_fin?: string | null;
        recipient_name?: string | null;
        phone?: string | null;
        country_id?: number | null;
        country?: {
            id?: number | null;
            name?: string | null;
            code?: string | null;
        } | null;
        region?: string | null;
        city?: string | null;
        postal_code?: string | null;
        address_line1?: string | null;
        address_line2?: string | null;
        company?: string | null;
        note?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
    } | null;
    items?: OrderDetailItem[] | null;
    status_histories?: Array<{
        id?: number;
        from_status?: OrderStatus | null;
        to_status?: OrderStatus | null;
        changed_by?: {
            id?: number;
            name?: string | null;
            email?: string | null;
        } | null;
        note?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
    }> | null;
    created_at?: string | null;
    updated_at?: string | null;
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const formatAmount = (value: unknown) => {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return "";
    return numeric.toFixed(2).replace(/\.00$/, "");
};

/** Dates follow the visitor's language, not a fixed az-AZ format. */
const DATE_LOCALES: Record<string, string> = { az: "az-AZ", ru: "ru-RU", en: "en-GB" };

const formatDateTime = (raw: string | null | undefined, locale: string) => {
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString(DATE_LOCALES[locale] ?? DATE_LOCALES.az, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale: routeLocale, id } = await params;
    const locale = normalizeLocale(routeLocale);
    const account = getTranslations(locale).account;
    const t = account.orderDetail;
    const homePageMeta = config.pages.home[locale];
    const orderHistoryPageMeta = config.pages.orderHistory[locale];
    const orderDetailPageMeta = config.pages.orderDetail[locale];

    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const guestToken = decodeGuestTokenFromCookie(cookieStore.get(GUEST_TOKEN_COOKIE)?.value);

    if (!authToken && !guestToken) {
        redirect(localizedHref("signin", locale));
    }

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);
    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code.toLowerCase() === locale)) {
        notFound();
    }

    const [chrome, orderResponse] = await Promise.all([
        getSiteChromeData(locale),
        api.get<OrderDetailResponse>(`/order/orders/${encodeURIComponent(id)}`, {
            locale,
            cache: "no-store",
            headers: authToken
                ? { Authorization: `Bearer ${authToken}` }
                : guestToken
                    ? { "X-Guest-Token": guestToken }
                    : undefined,
        }),
    ]);

    if (!orderResponse.success && orderResponse.status === 404) {
        notFound();
    }

    const orderLoadError = !orderResponse.success
        ? {
            status: orderResponse.status ?? 500,
            message: orderResponse.message || "Server Error",
        }
        : null;

    const rawOrder = orderResponse.success ? orderResponse.data : null;
    if (!rawOrder && !orderLoadError) {
        notFound();
    }

    if (orderLoadError || !rawOrder) {
        return (
            <SitePageShell chrome={chrome}>
                <Breadcrumb
                    items={[
                        { label: homePageMeta.name, href: homePageMeta.url },
                        { label: orderHistoryPageMeta.name, href: orderHistoryPageMeta.url },
                        { label: orderDetailPageMeta.name, isCurrent: true },
                    ]}
                    className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                    showTitle
                    pageTitle={orderDetailPageMeta.title}
                    titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
                />

                <section className="mx-auto w-full max-w-[1280px] px-1 pt-5 pb-12 lg:px-2 lg:pt-6 lg:pb-14">
                    <div className="rounded-[20px] bg-[#fff5f5] p-6 text-[#7f1d1d]">
                        <p className="text-[18px] font-semibold">
                            {t.loadFailed}
                        </p>
                        <p className="mt-2 text-[14px]">
                            {t.statusCode}: {orderLoadError?.status ?? 500}
                        </p>
                    </div>
                </section>
            </SitePageShell>
        );
    }

    const order = rawOrder;
    const items = Array.isArray(order.items) ? order.items : [];
    const history = Array.isArray(order.status_histories) ? order.status_histories : [];
    const payments = Array.isArray(order.payments) ? order.payments : [];
    const firstPayment = payments[0] ?? null;
    const orderStatusText = statusLabel(order.status, account.orderStatuses);
    const paymentStatusText = statusLabel(order.payment_status, account.paymentStatuses);
    const selectedInstallment = order.payment_method?.selected_installment ?? firstPayment?.payment_installment ?? null;
    const promoDiscount = Number(order.totals?.promo_discount ?? order.promo?.discount ?? 0);
    const hourDiscount = Number(order.totals?.discount_hour_discount ?? 0);
    const activeHref = "/account/orders";

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: orderHistoryPageMeta.name, href: orderHistoryPageMeta.url },
                    { label: order.number || order.uuid || `#${order.id}`, isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle={order.number || order.uuid || `#${order.id}`}
                titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-5 pb-12 lg:px-2 lg:pt-6 lg:pb-14">
                <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
                    <AccountNavigation locale={locale} activeHref={activeHref} />

                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
                        <div className="space-y-6">
                        <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-[13px] font-medium text-[#6b7280]">{t.orderNumber}</p>
                                    <h2 className="mt-1 text-[28px] leading-none font-semibold text-[#111826]">
                                        {order.number || order.uuid || `#${order.id}`}
                                    </h2>
                                    {order.placed_at ? <p className="mt-2 text-[14px] text-[#667085]">{formatDateTime(order.placed_at, locale)}</p> : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {orderStatusText ? (
                                        <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-[13px] font-semibold text-[#0d47ff]">
                                            {orderStatusText}
                                        </span>
                                    ) : null}
                                    {paymentStatusText ? (
                                        <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-[13px] font-semibold text-[#364152]">
                                            {paymentStatusText}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">{t.customer}</h3>
                                <div className="mt-4 space-y-2 text-[15px] text-[#344054]">
                                    <p><span className="font-medium text-[#111826]">{t.name}:</span> {order.customer?.name || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.emailLabel}:</span> {order.customer?.email || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.phoneLabel}:</span> {order.customer?.phone || "-"}</p>
                                </div>
                            </div>

                            <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">{t.delivery}</h3>
                                <div className="mt-4 space-y-2 text-[15px] text-[#344054]">
                                    <p><span className="font-medium text-[#111826]">{t.tag}:</span> {order.address?.label || order.address?.type || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.name}:</span> {order.address?.recipient_name || [order.address?.name, order.address?.surname].filter(Boolean).join(" ") || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.phoneLabel}:</span> {order.address?.phone || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.addressLabel}:</span> {[order.address?.region, order.address?.city, order.address?.address_line1].filter(Boolean).join(", ") || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.addressExtra}:</span> {order.address?.address_line2 || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.postalCode}:</span> {order.address?.postal_code || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.country}:</span> {order.address?.country?.name || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">{t.note}:</span> {order.address?.note || "-"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                            <h3 className="text-[18px] font-semibold text-[#111826]">{t.products}</h3>
                            <div className="mt-4 space-y-3">
                                {items.map((item, index) => {
                                    const qty = Number(item.qty ?? 0);
                                    const unit = Number(item.unit_price ?? 0);
                                    const total = Number(item.line_total ?? unit * qty);
                                    return (
                                        <div key={item.id ?? `${item.product_variation_id ?? "item"}-${index}`} className="flex gap-4 rounded-[16px] bg-[#f7f8fb] p-4">
                                            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px] bg-white">
                                                {item.image ? <RemoteImage src={item.image} alt={item.product_name || t.products} width={144} height={144} className="h-full w-full object-contain" /> : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[16px] font-semibold text-[#111826]">{item.product_name || "-"}</p>
                                                <p className="mt-1 text-[14px] text-[#667085]">{item.variation_name || item.sku || ""}</p>
                                                <div className="mt-3 flex flex-wrap gap-3 text-[14px] text-[#344054]">
                                                    <span>{t.quantity}: {qty}</span>
                                                    <span>{t.unitPrice}: {formatAmount(unit)} AZN</span>
                                                    <span>{t.lineTotal}: {formatAmount(total)} AZN</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                            <h3 className="text-[18px] font-semibold text-[#111826]">{t.payment}</h3>
                            <div className="mt-4 grid gap-2 text-[15px] text-[#344054]">
                                <p><span className="font-medium text-[#111826]">{t.method}:</span> {order.payment_method?.name || "-"}</p>
                                {order.payment_method?.icon_path ? (
                                    <div className="flex items-center gap-3">
                                        <RemoteImage src={order.payment_method.icon_path} alt={order.payment_method.name || t.payment} width={128} height={64} className="h-8 w-auto object-contain" />
                                        <span className="text-[14px] text-[#667085]">{order.payment_method.description || ""}</span>
                                    </div>
                                ) : null}
                                {selectedInstallment ? (
                                    <p>
                                        <span className="font-medium text-[#111826]">{t.installment}:</span> {selectedInstallment.month ?? "-"} {t.monthsSuffix}
                                    </p>
                                ) : null}
                                {selectedInstallment ? (
                                    <>
                                        <p><span className="font-medium text-[#111826]">{t.initialPayment}:</span> {formatAmount(selectedInstallment.initial_payment)} {order.currency || "AZN"}</p>
                                        <p><span className="font-medium text-[#111826]">{t.monthlyAmount}:</span> {formatAmount(selectedInstallment.monthly_amount)} {order.currency || "AZN"}</p>
                                        <p><span className="font-medium text-[#111826]">{t.percent}:</span> {formatAmount(selectedInstallment.percent)}%</p>
                                        <p><span className="font-medium text-[#111826]">{t.remainingAmount}:</span> {formatAmount(selectedInstallment.remaining_total_with_interest)} {order.currency || "AZN"}</p>
                                    </>
                                ) : null}
                                {firstPayment ? (
                                    <>
                                        <p><span className="font-medium text-[#111826]">{t.firstPayment}:</span> {formatAmount(firstPayment.amount)} {firstPayment.currency || "AZN"}</p>
                                        <p><span className="font-medium text-[#111826]">{t.paymentStatus}:</span> {statusLabel(firstPayment.status, account.paymentStatuses) || "-"}</p>
                                        <p><span className="font-medium text-[#111826]">{t.gateway}:</span> {firstPayment.provider_reference || firstPayment.provider_payment_id || "-"}</p>
                                    </>
                                ) : null}
                                {order.comment ? <p><span className="font-medium text-[#111826]">{t.comment}:</span> {order.comment}</p> : null}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                            <h3 className="text-[18px] font-semibold text-[#111826]">{t.summary}</h3>
                            <div className="mt-4 space-y-3 text-[15px] text-[#344054]">
                                <div className="flex items-center justify-between gap-4"><span>{t.subtotal}</span><span>{formatAmount(order.totals?.subtotal)} AZN</span></div>
                                {hourDiscount > 0 ? <div className="flex items-center justify-between gap-4"><span>{t.hourDiscount}</span><span>-{formatAmount(hourDiscount)} AZN</span></div> : null}
                                {promoDiscount > 0 ? <div className="flex items-center justify-between gap-4"><span>{t.promoDiscount}</span><span>-{formatAmount(promoDiscount)} AZN</span></div> : null}
                                <div className="flex items-center justify-between gap-4"><span>{t.delivery}</span><span>{formatAmount(order.totals?.delivery_price)} AZN</span></div>
                                {order.totals?.initial_payment ? <div className="flex items-center justify-between gap-4"><span>{t.initialPayment}</span><span>{formatAmount(order.totals.initial_payment)} AZN</span></div> : null}
                                {order.totals?.remaining_installment_total ? <div className="flex items-center justify-between gap-4"><span>{t.remainingPart}</span><span>{formatAmount(order.totals.remaining_installment_total)} AZN</span></div> : null}
                                <div className="border-t border-[#e7ebf2] pt-3 flex items-center justify-between gap-4 text-[16px] font-semibold text-[#111826]">
                                    <span>{t.payable}</span>
                                    <span>{formatAmount(order.totals?.payable_total ?? order.totals?.total)} AZN</span>
                                </div>
                            </div>
                        </div>

                        {order.promo?.code ? (
                            <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">{t.promo}</h3>
                                <div className="mt-4 space-y-2 text-[15px] text-[#344054]">
                                    <p><span className="font-medium text-[#111826]">{t.code}:</span> {order.promo.code}</p>
                                    <p><span className="font-medium text-[#111826]">{t.discount}:</span> {formatAmount(order.promo.discount)} AZN</p>
                                </div>
                            </div>
                        ) : null}

                        {payments.length > 0 ? (
                            <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">{t.payments}</h3>
                                <div className="mt-4 space-y-3">
                                    {payments.map((payment) => (
                                        <div key={payment.id ?? payment.provider_payment_id ?? payment.provider_reference} className="rounded-[14px] bg-[#f7f8fb] p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[14px] font-semibold text-[#111826]">{statusLabel(payment.status, account.paymentStatuses) || payment.method_code || "-"}</p>
                                                    <p className="mt-1 text-[13px] text-[#667085]">{payment.method_code || "-"}</p>
                                                </div>
                                                <div className="text-right text-[14px] text-[#344054]">
                                                    <p>{formatAmount(payment.amount)} {payment.currency || order.currency || "AZN"}</p>
                                                    {payment.paid_at ? <p className="mt-1 text-[12px] text-[#98a2b3]">{formatDateTime(payment.paid_at, locale)}</p> : null}
                                                </div>
                                            </div>
                                            {payment.payment_installment ? (
                                                <div className="mt-3 grid gap-1 text-[13px] text-[#667085]">
                                                    <p>{t.installment}: {payment.payment_installment.month ?? "-"} {t.monthsSuffix}</p>
                                                    <p>{t.initialPayment}: {formatAmount(payment.payment_installment.initial_payment)} AZN</p>
                                                    <p>{t.monthly}: {formatAmount(payment.payment_installment.monthly_amount)} AZN</p>
                                                </div>
                                            ) : null}
                                            {payment.events?.length ? (
                                                <div className="mt-3 space-y-2">
                                                    {payment.events.map((event) => (
                                                        <div key={event.id ?? `${event.event_type}-${event.occurred_at ?? event.created_at ?? ""}`} className="rounded-[12px] bg-white p-3 text-[13px] text-[#344054]">
                                                            <p className="font-medium text-[#111826]">{event.event_type || "-"}</p>
                                                            <p className="mt-1 text-[#667085]">{event.provider || "-"}</p>
                                                            {event.occurred_at ? <p className="mt-1 text-[#98a2b3]">{formatDateTime(event.occurred_at, locale)}</p> : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {history.length > 0 ? (
                            <div className="rounded-[20px] bg-white px-0 py-5 sm:p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">{t.statusHistory}</h3>
                                <div className="mt-4 space-y-3">
                                    {history.map((entry, index) => {
                                        const toStatusText = statusLabel(entry.to_status, account.orderStatuses);
                                        const fromStatusText = statusLabel(entry.from_status, account.orderStatuses);

                                        return (
                                        <div key={entry.id ?? index} className="rounded-[14px] bg-[#f7f8fb] p-4">
                                            <p className="text-[14px] font-semibold text-[#111826]">{toStatusText || "-"}</p>
                                            {fromStatusText ? <p className="mt-1 text-[13px] text-[#667085]">{t.changedFrom}: {fromStatusText} → {toStatusText || "-"}</p> : null}
                                            {entry.changed_by?.name ? <p className="mt-1 text-[13px] text-[#667085]">{t.changedBy}: {entry.changed_by.name}</p> : null}
                                            {entry.note ? <p className="mt-1 text-[13px] text-[#667085]">{entry.note}</p> : null}
                                            {entry.created_at ? <p className="mt-2 text-[12px] text-[#98a2b3]">{formatDateTime(entry.created_at, locale)}</p> : null}
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </aside>
                </div>
                </div>
            </section>
        </SitePageShell>
    );
}
