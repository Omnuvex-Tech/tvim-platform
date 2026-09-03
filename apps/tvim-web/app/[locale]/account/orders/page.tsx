import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb, RemoteImage } from "@repo/ui";
import { ChevronUp } from "lucide-react";
import { config } from "@/config";
import { api } from "@/lib/api";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { getSiteChromeData } from "@/lib/site-chrome";
import { AccountNavigation } from "../account-navigation";
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

type OrderItem = {
    id?: number;
    product_name?: string | null;
    variation_name?: string | null;
    sku?: string | null;
    image?: string | null;
    qty?: number | null;
    original_unit_price?: number | string | null;
    unit_price?: number | string | null;
    line_total?: number | string | null;
    line_subtotal?: number | string | null;
    line_discount_hour?: number | string | null;
};

type OrderDetail = {
    id?: number;
    uuid?: string | null;
    number?: string | null;
    status?: OrderStatus | null;
    payment_status?: OrderStatus | null;
    currency?: string | null;
    totals?: OrderTotals | null;
    placed_at?: string | null;
    items?: OrderItem[] | null;
    payment_method?: {
        name?: string | null;
        description?: string | null;
        icon_path?: string | null;
        selected_installment?: {
            month?: number | null;
            percent?: number | string | null;
            initial_payment?: number | string | null;
            monthly_amount?: number | string | null;
            remaining_total_with_interest?: number | string | null;
        } | null;
    } | null;
    payments?: Array<{
        id?: number;
        method_code?: string | null;
        status?: OrderStatus | null;
        amount?: number | string | null;
        currency?: string | null;
        paid_at?: string | null;
        provider_reference?: string | null;
        provider_payment_id?: string | null;
        payment_installment?: {
            month?: number | null;
            initial_payment?: number | string | null;
            monthly_amount?: number | string | null;
        } | null;
    }> | null;
};

type Order = {
    id: number;
    uuid?: string | null;
    number?: string | null;
    status?: OrderStatus | null;
    payment_status?: OrderStatus | null;
    currency?: string | null;
    totals?: OrderTotals | null;
    placed_at?: string | null;
    items?: OrderItem[] | null;
    payment_method?: OrderDetail["payment_method"] | null;
    payments?: OrderDetail["payments"] | null;
};

type OrdersApiPayload = {
    data?: Order[] | { items?: Order[]; data?: Order[]; orders?: Order[] } | null;
    items?: Order[] | null;
    orders?: Order[] | null;
};

const extractOrders = (payload: unknown): Order[] => {
    if (Array.isArray(payload)) return payload as Order[];
    if (!payload || typeof payload !== "object") return [];

    const source = payload as OrdersApiPayload;
    if (Array.isArray(source.data)) return source.data;
    if (Array.isArray(source.items)) return source.items;
    if (Array.isArray(source.orders)) return source.orders;

    if (source.data && typeof source.data === "object") {
        const nested = source.data;
        if (Array.isArray(nested.data)) return nested.data;
        if (Array.isArray(nested.items)) return nested.items;
        if (Array.isArray(nested.orders)) return nested.orders;
    }

    return [];
};

const formatAmount = (value: unknown) => {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return "";
    return numeric.toFixed(2).replace(/\.00$/, "");
};

/** Dates follow the visitor's language, not a fixed az-AZ format. */
const DATE_LOCALES: Record<"az" | "ru" | "en", string> = { az: "az-AZ", ru: "ru-RU", en: "en-GB" };

const formatDate = (value: string | null | undefined, locale: "az" | "ru" | "en") => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(DATE_LOCALES[locale], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

const normalizeLocale = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return (["az", "ru", "en"].includes(normalized) ? normalized : "az") as "az" | "ru" | "en";
};

export default async function OrdersPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ per_page?: string; page?: string; status?: string; q?: string }>;
}) {
    const { locale: routeLocale } = await params;
    const locale = normalizeLocale(routeLocale);
    const t = getTranslations(locale).account;
    const homePageMeta = config.pages.home[locale];
    const accountPageMeta = config.pages.account[locale];
    const orderHistoryPageMeta = config.pages.orderHistory[locale];

    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);

    if (!authToken) {
        redirect(localizedHref("signin", locale));
    }

    const query = await searchParams;
    const status = typeof query.status === "string" ? query.status.trim() : "";
    const q = typeof query.q === "string" ? query.q.trim() : "";
    const page = typeof query.page === "string" ? query.page.trim() : "";
    const perPage = typeof query.per_page === "string" ? query.per_page.trim() : "";

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

    const orderParams: Record<string, string> = {};
    if (status) orderParams.status = status;
    if (q) orderParams.q = q;
    if (page) orderParams.page = page;
    if (perPage) orderParams.per_page = perPage;

    const [chrome, ordersResponse] = await Promise.all([
        getSiteChromeData(locale),
        api.get<OrdersApiPayload>("/customer/orders", {
            locale,
            cache: "no-store",
            headers: { Authorization: `Bearer ${authToken}` },
            params: orderParams,
        }),
    ]);

    const orders = ordersResponse.success ? extractOrders(ordersResponse.data) : [];

    const detailEntries = await Promise.all(
        orders.map(async (order) => {
            const lookupId = order.uuid || String(order.id);
            const response = await api.get<OrderDetail>(`/order/orders/${encodeURIComponent(lookupId)}`, {
                locale,
                cache: "no-store",
                headers: { Authorization: `Bearer ${authToken}` },
            });
            return [lookupId, response.success ? response.data : null] as const;
        })
    );

    const detailMap = new Map<string, OrderDetail>();
    detailEntries.forEach(([key, value]) => {
        if (value) detailMap.set(key, value);
    });

    const tabs = [
        { label: t.orders.all, value: "" },
        { label: t.orders.processing, value: "processing" },
        { label: t.orders.delivered, value: "completed" },
        { label: t.orders.cancelled, value: "canceled" },
    ];
    const ordersPageUrl = localizedHref("orders", locale);
    const activeHref = "/account/orders";

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: accountPageMeta.name, href: accountPageMeta.url },
                    { label: orderHistoryPageMeta.name, isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle={orderHistoryPageMeta.title}
                titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-5 pb-12 lg:px-2 lg:pt-6 lg:pb-14">
                <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
                    <AccountNavigation locale={locale} activeHref={activeHref} />

                    <section className="w-full rounded-[20px] bg-white px-0 py-6 sm:px-7 sm:py-8">
                        <div className="flex items-center gap-4 overflow-x-auto text-[13px] font-medium text-[#8A97AB] sm:text-[14px]">
                            {tabs.map((tab) => {
                                const active = tab.value === status;
                                const href = tab.value ? `${ordersPageUrl}?status=${encodeURIComponent(tab.value)}` : ordersPageUrl;
                                return (
                                    <Link
                                        key={tab.label}
                                        href={href}
                                        className={`whitespace-nowrap transition-colors ${
                                            active ? "font-semibold text-[#0D47FF]" : "text-[#8A97AB] hover:text-[#0D47FF]"
                                        }`}
                                    >
                                        {tab.label}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
                            {!ordersResponse.success ? (
                                <div className="rounded-[18px] bg-[#f7f8fb] p-5 text-[14px] font-medium text-[#b42318]">
                                    {t.orders.loadFailed}
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="rounded-[18px] bg-[#f7f8fb] p-5 text-[14px] font-medium text-[#202938]">
                                    {t.orders.empty}
                                </div>
                            ) : (
                                orders.map((order, index) => {
                                    const detail = detailMap.get(order.uuid || String(order.id)) || null;
                                    const orderData = detail ?? order;
                                    const items = Array.isArray(orderData.items) ? orderData.items : [];
                                    const statusText = statusLabel(orderData.status ?? order.status, t.orderStatuses);
                                    const paymentStatusText = statusLabel(orderData.payment_status ?? order.payment_status, t.paymentStatuses);
                                    const orderNumber = orderData.number || order.number || `#${order.id}`;
                                    const placedAt = formatDate(orderData.placed_at || order.placed_at, locale);
                                    const currency = (orderData.currency || order.currency || "AZN").toString();
                                    const payableTotal = formatAmount(
                                        orderData.totals?.payable_total ?? orderData.totals?.total ?? order.totals?.payable_total ?? order.totals?.total
                                    );
                                    const paymentMethodName = orderData.payment_method?.name || "-";
                                    const itemTotal = (item: OrderItem) => formatAmount(item.line_total ?? item.unit_price ?? item.original_unit_price ?? 0);
                                    const itemImage = (item: OrderItem) => item.image || "";
                                    const mainItem = items[0] || null;

                                    return (
                                        <details key={order.id} className="group border-b border-[#D8E1EC] pb-5 sm:pb-6" open={index === 0}>
                                            <summary className="flex list-none cursor-pointer items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                                                <div className="flex min-w-0 flex-wrap items-center gap-x-10 gap-y-2">
                                                    <div className="text-[15px] font-semibold text-[#0D47FF] sm:text-[16px]">
                                                        {t.orders.orderNumber}: {orderNumber}
                                                    </div>
                                                    {placedAt ? (
                                                        <div className="text-[13px] font-semibold text-[#0D47FF] sm:text-[14px]">{placedAt}</div>
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    {statusText ? (
                                                        <span className="rounded-full bg-[#FFD400] px-4 py-2 text-[12px] font-semibold text-[#0F131A] sm:text-[13px]">
                                                            {statusText}
                                                        </span>
                                                    ) : null}
                                                    <ChevronUp className="size-5 shrink-0 text-[#0D47FF] transition-transform duration-200 group-open:rotate-180" />
                                                </div>
                                            </summary>

                                            <div className="border-t border-[#D8E1EC] py-6 sm:py-8">
                                                {items.length > 0 ? (
                                                    <div className="space-y-6">
                                                        {items.map((item, itemIndex) => (
                                                            <Link
                                                                key={item.id ?? `${order.id}-${itemIndex}`}
                                                                href={`${ordersPageUrl}/${encodeURIComponent(order.uuid || String(order.id))}`}
                                                                className="flex items-start justify-between gap-4 transition-opacity hover:opacity-90 sm:gap-6"
                                                            >
                                                                <div className="flex min-w-0 items-start gap-4">
                                                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#F7F8FB] sm:h-24 sm:w-24">
                                                                        {itemImage(item) ? (
                                                                            <RemoteImage src={itemImage(item)} alt={item.product_name || t.orders.productAlt} width={192} height={192} className="h-full w-full object-contain" />
                                                                        ) : null}
                                                                    </div>

                                                                    <div className="min-w-0 pt-1">
                                                                        <p className="text-[13px] text-[#8A97AB] sm:text-[14px]">{t.orders.model}: {item.sku || item.variation_name || "-"}</p>
                                                                        <p className="mt-1 text-[13px] font-semibold text-[#0F131A] sm:text-[14px]">{t.orders.quantity}: {item.qty ?? 0}</p>
                                                                        <p className="mt-2 text-[16px] font-semibold leading-tight text-[#0F131A] sm:text-[18px]">
                                                                            {item.product_name || "-"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="pt-7 text-[18px] font-semibold leading-none text-[#0F131A] sm:pt-8 sm:text-[22px]">
                                                                    {itemTotal(item)}
                                                                    <span className="ml-0.5 text-[14px] font-semibold sm:text-[16px]">
                                                                        {currency === "AZN" ? "₼" : currency}
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ) : mainItem ? (
                                                    <div className="flex items-start justify-between gap-4 sm:gap-6">
                                                        <div className="flex min-w-0 items-start gap-4">
                                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#F7F8FB] sm:h-24 sm:w-24">
                                                                {mainItem.image ? (
                                                                    <RemoteImage src={mainItem.image} alt={mainItem.product_name || t.orders.productAlt} width={192} height={192} className="h-full w-full object-contain" />
                                                                ) : null}
                                                            </div>
                                                            <div className="min-w-0 pt-1">
                                                                <p className="text-[13px] text-[#8A97AB] sm:text-[14px]">{t.orders.model}: {mainItem.sku || mainItem.variation_name || "-"}</p>
                                                                <p className="mt-1 text-[13px] font-semibold text-[#0F131A] sm:text-[14px]">{t.orders.quantity}: {mainItem.qty ?? 0}</p>
                                                                <p className="mt-2 text-[16px] font-semibold leading-tight text-[#0F131A] sm:text-[18px]">{mainItem.product_name || "-"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="pt-7 text-[18px] font-semibold leading-none text-[#0F131A] sm:pt-8 sm:text-[22px]">
                                                            {itemTotal(mainItem)}
                                                            <span className="ml-0.5 text-[14px] font-semibold sm:text-[16px]">
                                                                {currency === "AZN" ? "₼" : currency}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="border-t border-[#D8E1EC] pt-6">
                                                <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                                                    <div className="text-[14px] font-semibold leading-tight text-[#0F131A] sm:self-center sm:text-[16px]">
                                                        {t.orders.paymentMethod}: {paymentMethodName}
                                                    </div>
                                                    <div className="flex flex-col items-start gap-1 sm:items-end">
                                                        <div className="text-[14px] font-semibold leading-tight text-[#0F131A] sm:text-[16px]">
                                                            {t.orders.amount}: {payableTotal}
                                                            <span className="ml-0.5">{currency === "AZN" ? "₼" : currency}</span>
                                                        </div>
                                                        {paymentStatusText ? (
                                                            <div className="text-[12px] text-[#8A97AB] sm:text-[13px]">{paymentStatusText}</div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>
            </section>
        </SitePageShell>
    );
}
