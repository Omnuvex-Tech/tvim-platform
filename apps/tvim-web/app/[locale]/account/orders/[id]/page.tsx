import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { FooterMenusData, Language, ProjectSettingsData, ProjectSettingsResponseData } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/guest/session";

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

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
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

const formatDateTime = (raw?: string | null) => {
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString("az-AZ", {
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

    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const guestToken = decodeGuestTokenFromCookie(cookieStore.get(GUEST_TOKEN_COOKIE)?.value);

    if (!authToken && !guestToken) {
        redirect(`/${locale}/signin`);
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

    const [footerMenuResponse, settingsResponse, headerMenuResponse, categoriesResponse, orderResponse] = await Promise.all([
        api.get<FooterMenusData>(config.endpoints.menus.list, {
            params: { in_footer: "1" },
            locale,
        }),
        api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            locale,
        }),
        api.get<any>(config.endpoints.menus.list, {
            params: { in_header: "1" },
            locale,
        }),
        api.get<any>("/product/categories", {
            params: { in_header: "1" },
            locale,
        }),
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

    const rawOrder = orderResponse.success ? orderResponse.data : null;
    if (!rawOrder) {
        notFound();
    }

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
    const headerItems = Array.isArray(rawHeaderData)
        ? rawHeaderData
        : rawHeaderData && typeof rawHeaderData === "object"
            ? (Array.isArray((rawHeaderData as any).header)
                ? (rawHeaderData as any).header
                : Array.isArray((rawHeaderData as any).menus)
                    ? (rawHeaderData as any).menus
                    : Array.isArray((rawHeaderData as any).items)
                        ? (rawHeaderData as any).items
                        : Array.isArray((rawHeaderData as any).data)
                            ? (rawHeaderData as any).data
                            : Array.isArray((rawHeaderData as any).footer)
                                ? (rawHeaderData as any).footer
                                : [])
            : [];

    const headerTopLevel = headerItems.filter((item: any) => !item || !item.parent_id || Number(item.parent_id) === 0).filter(Boolean);
    const headerMenuItems = headerTopLevel
        .filter((item: any) => (((item.type ?? "") + "").toString().toLowerCase() !== "categories"))
        .map((item: any) => {
            const hrefPart = (item.multi_links && item.multi_links[locale]) || item.link || "";
            const path = hrefPart ? `/${locale}/${String(hrefPart).replace(/^\/+/, "")}` : "#";
            return { label: item.name ?? item.title ?? item.link ?? "", href: path };
        });

    let headerCategoryItems: any[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const raw = categoriesResponse.data;
        let items: any[] = [];
        if (Array.isArray(raw)) items = raw;
        else if (Array.isArray(raw.data)) items = raw.data;
        else if (Array.isArray(raw.items)) items = raw.items;
        else if (raw && typeof raw === "object") {
            const arr = Object.values(raw).find((value) => Array.isArray(value));
            if (Array.isArray(arr)) items = arr as any[];
        }

        const filtered = items.filter(
            (item) => !!item && (item.in_header === true || item.in_header === 1 || item.in_header === "1" || item.in_header === "true")
        );
        headerCategoryItems = filtered.length > 0 ? filtered : items;
    } else {
        headerCategoryItems = headerTopLevel.filter((item: any) => (((item.type ?? "") + "").toLowerCase() === "categories"));
    }

    const footerMenus = footerMenuResponse.success && footerMenuResponse.data ? footerMenuResponse.data.footer : [];
    const projectSettings = settingsResponse.success ? settingsResponse.data?.data : undefined;

    const navbarLogo = projectSettings?.general.images.logo ? (
        <img
            src={projectSettings.general.images.logo}
            alt={projectSettings.general.site_title}
            className="h-10 w-auto object-contain sm:h-12 lg:h-14"
        />
    ) : projectSettings?.general.site_title ? (
        <div className="text-[32px] leading-none font-semibold tracking-[-0.02em] text-[#111318]">
            {projectSettings.general.site_title}
        </div>
    ) : undefined;

    const navbarPhone = projectSettings?.general.phones.find(
        (phone) => phone.is_whatsapp && phone.number.trim().startsWith("+994")
    )?.number;

    const order = rawOrder;
    const items = Array.isArray(order.items) ? order.items : [];
    const history = Array.isArray(order.status_histories) ? order.status_histories : [];
    const payments = Array.isArray(order.payments) ? order.payments : [];
    const firstPayment = payments[0] ?? null;
    const selectedInstallment = order.payment_method?.selected_installment ?? firstPayment?.payment_installment ?? null;
    const promoDiscount = Number(order.totals?.promo_discount ?? order.promo?.discount ?? 0);
    const hourDiscount = Number(order.totals?.discount_hour_discount ?? 0);

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={locale}
                languages={langResponse.data}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <Breadcrumb
                items={[
                    { label: "Ana s\u0259hif\u0259", href: `/${locale}` },
                    { label: "Sifari\u015f tarix\u00e7\u0259si", href: `/${locale}/account/orders` },
                    { label: order.number || order.uuid || `#${order.id}`, isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle={order.number || order.uuid || `#${order.id}`}
                titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-5 pb-12 lg:px-2 lg:pt-6 lg:pb-14">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
                    <div className="space-y-6">
                        <div className="rounded-[20px] bg-white p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-[13px] font-medium text-[#6b7280]">Sifariş nömrəsi</p>
                                    <h2 className="mt-1 text-[28px] leading-none font-semibold text-[#111826]">
                                        {order.number || order.uuid || `#${order.id}`}
                                    </h2>
                                    {order.placed_at ? <p className="mt-2 text-[14px] text-[#667085]">{formatDateTime(order.placed_at)}</p> : null}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {order.status?.text ? (
                                        <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-[13px] font-semibold text-[#0d47ff]">
                                            {order.status.text}
                                        </span>
                                    ) : null}
                                    {order.payment_status?.text ? (
                                        <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-[13px] font-semibold text-[#364152]">
                                            {order.payment_status.text}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-[20px] bg-white p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">Müştəri</h3>
                                <div className="mt-4 space-y-2 text-[15px] text-[#344054]">
                                    <p><span className="font-medium text-[#111826]">Ad:</span> {order.customer?.name || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">E-poçt:</span> {order.customer?.email || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">Telefon:</span> {order.customer?.phone || "-"}</p>
                                </div>
                            </div>

                            <div className="rounded-[20px] bg-white p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">Çatdırılma</h3>
                                <div className="mt-4 space-y-2 text-[15px] text-[#344054]">
                                    <p><span className="font-medium text-[#111826]">Etiket:</span> {order.address?.label || order.address?.type || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">Ad:</span> {order.address?.recipient_name || [order.address?.name, order.address?.surname].filter(Boolean).join(" ") || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">Telefon:</span> {order.address?.phone || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">Ünvan:</span> {[order.address?.region, order.address?.city, order.address?.address_line1].filter(Boolean).join(", ") || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">Əlavə ünvan:</span> {order.address?.address_line2 || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">İndeks:</span> {order.address?.postal_code || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">Ölkə:</span> {order.address?.country?.name || "-"}</p>
                                    <p><span className="font-medium text-[#111826]">Qeyd:</span> {order.address?.note || "-"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[20px] bg-white p-5">
                            <h3 className="text-[18px] font-semibold text-[#111826]">Məhsullar</h3>
                            <div className="mt-4 space-y-3">
                                {items.map((item, index) => {
                                    const qty = Number(item.qty ?? 0);
                                    const unit = Number(item.unit_price ?? 0);
                                    const total = Number(item.line_total ?? unit * qty);
                                    return (
                                        <div key={item.id ?? `${item.product_variation_id ?? "item"}-${index}`} className="flex gap-4 rounded-[16px] bg-[#f7f8fb] p-4">
                                            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px] bg-white">
                                                {item.image ? <img src={item.image} alt={item.product_name || "Məhsul"} className="h-full w-full object-contain" /> : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[16px] font-semibold text-[#111826]">{item.product_name || "-"}</p>
                                                <p className="mt-1 text-[14px] text-[#667085]">{item.variation_name || item.sku || ""}</p>
                                                <div className="mt-3 flex flex-wrap gap-3 text-[14px] text-[#344054]">
                                                    <span>Say: {qty}</span>
                                                    <span>Vahid: {formatAmount(unit)} AZN</span>
                                                    <span>Cəmi: {formatAmount(total)} AZN</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-[20px] bg-white p-5">
                            <h3 className="text-[18px] font-semibold text-[#111826]">Ödəniş</h3>
                            <div className="mt-4 grid gap-2 text-[15px] text-[#344054]">
                                <p><span className="font-medium text-[#111826]">Metod:</span> {order.payment_method?.name || "-"}</p>
                                {order.payment_method?.icon_path ? (
                                    <div className="flex items-center gap-3">
                                        <img src={order.payment_method.icon_path} alt={order.payment_method.name || "Ödəniş metodu"} className="h-8 w-auto object-contain" />
                                        <span className="text-[14px] text-[#667085]">{order.payment_method.description || ""}</span>
                                    </div>
                                ) : null}
                                {selectedInstallment ? (
                                    <p>
                                        <span className="font-medium text-[#111826]">Hissə:</span> {selectedInstallment.month ?? "-"} ay
                                    </p>
                                ) : null}
                                {selectedInstallment ? (
                                    <>
                                        <p><span className="font-medium text-[#111826]">İlkin ödəniş:</span> {formatAmount(selectedInstallment.initial_payment)} {order.currency || "AZN"}</p>
                                        <p><span className="font-medium text-[#111826]">Aylıq məbləğ:</span> {formatAmount(selectedInstallment.monthly_amount)} {order.currency || "AZN"}</p>
                                        <p><span className="font-medium text-[#111826]">Faiz:</span> {formatAmount(selectedInstallment.percent)}%</p>
                                        <p><span className="font-medium text-[#111826]">Qalan məbləğ:</span> {formatAmount(selectedInstallment.remaining_total_with_interest)} {order.currency || "AZN"}</p>
                                    </>
                                ) : null}
                                {firstPayment ? (
                                    <>
                                        <p><span className="font-medium text-[#111826]">İlk ödəniş:</span> {formatAmount(firstPayment.amount)} {firstPayment.currency || "AZN"}</p>
                                        <p><span className="font-medium text-[#111826]">Ödəniş statusu:</span> {firstPayment.status?.text || "-"}</p>
                                        <p><span className="font-medium text-[#111826]">Gateway:</span> {firstPayment.provider_reference || firstPayment.provider_payment_id || "-"}</p>
                                    </>
                                ) : null}
                                {order.comment ? <p><span className="font-medium text-[#111826]">Şərh:</span> {order.comment}</p> : null}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-[20px] bg-white p-5">
                            <h3 className="text-[18px] font-semibold text-[#111826]">Yekun</h3>
                            <div className="mt-4 space-y-3 text-[15px] text-[#344054]">
                                <div className="flex items-center justify-between gap-4"><span>Aralıq cəm</span><span>{formatAmount(order.totals?.subtotal)} AZN</span></div>
                                {hourDiscount > 0 ? <div className="flex items-center justify-between gap-4"><span>Saat endirimi</span><span>-{formatAmount(hourDiscount)} AZN</span></div> : null}
                                {promoDiscount > 0 ? <div className="flex items-center justify-between gap-4"><span>Promo endirimi</span><span>-{formatAmount(promoDiscount)} AZN</span></div> : null}
                                <div className="flex items-center justify-between gap-4"><span>Çatdırılma</span><span>{formatAmount(order.totals?.delivery_price)} AZN</span></div>
                                {order.totals?.initial_payment ? <div className="flex items-center justify-between gap-4"><span>İlkin ödəniş</span><span>{formatAmount(order.totals.initial_payment)} AZN</span></div> : null}
                                {order.totals?.remaining_installment_total ? <div className="flex items-center justify-between gap-4"><span>Qalan hissə</span><span>{formatAmount(order.totals.remaining_installment_total)} AZN</span></div> : null}
                                <div className="border-t border-[#e7ebf2] pt-3 flex items-center justify-between gap-4 text-[16px] font-semibold text-[#111826]">
                                    <span>Ödəniləcək</span>
                                    <span>{formatAmount(order.totals?.payable_total ?? order.totals?.total)} AZN</span>
                                </div>
                            </div>
                        </div>

                        {order.promo?.code ? (
                            <div className="rounded-[20px] bg-white p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">Promo</h3>
                                <div className="mt-4 space-y-2 text-[15px] text-[#344054]">
                                    <p><span className="font-medium text-[#111826]">Kod:</span> {order.promo.code}</p>
                                    <p><span className="font-medium text-[#111826]">Endirim:</span> {formatAmount(order.promo.discount)} AZN</p>
                                </div>
                            </div>
                        ) : null}

                        {payments.length > 0 ? (
                            <div className="rounded-[20px] bg-white p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">Ödənişlər</h3>
                                <div className="mt-4 space-y-3">
                                    {payments.map((payment) => (
                                        <div key={payment.id ?? payment.provider_payment_id ?? payment.provider_reference} className="rounded-[14px] bg-[#f7f8fb] p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[14px] font-semibold text-[#111826]">{payment.status?.text || payment.method_code || "-"}</p>
                                                    <p className="mt-1 text-[13px] text-[#667085]">{payment.method_code || "-"}</p>
                                                </div>
                                                <div className="text-right text-[14px] text-[#344054]">
                                                    <p>{formatAmount(payment.amount)} {payment.currency || order.currency || "AZN"}</p>
                                                    {payment.paid_at ? <p className="mt-1 text-[12px] text-[#98a2b3]">{formatDateTime(payment.paid_at)}</p> : null}
                                                </div>
                                            </div>
                                            {payment.payment_installment ? (
                                                <div className="mt-3 grid gap-1 text-[13px] text-[#667085]">
                                                    <p>Hissə: {payment.payment_installment.month ?? "-"} ay</p>
                                                    <p>İlkin ödəniş: {formatAmount(payment.payment_installment.initial_payment)} AZN</p>
                                                    <p>Aylıq: {formatAmount(payment.payment_installment.monthly_amount)} AZN</p>
                                                </div>
                                            ) : null}
                                            {payment.events?.length ? (
                                                <div className="mt-3 space-y-2">
                                                    {payment.events.map((event) => (
                                                        <div key={event.id ?? `${event.event_type}-${event.occurred_at ?? event.created_at ?? ""}`} className="rounded-[12px] bg-white p-3 text-[13px] text-[#344054]">
                                                            <p className="font-medium text-[#111826]">{event.event_type || "-"}</p>
                                                            <p className="mt-1 text-[#667085]">{event.provider || "-"}</p>
                                                            {event.occurred_at ? <p className="mt-1 text-[#98a2b3]">{formatDateTime(event.occurred_at)}</p> : null}
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
                            <div className="rounded-[20px] bg-white p-5">
                                <h3 className="text-[18px] font-semibold text-[#111826]">Status tarixçəsi</h3>
                                <div className="mt-4 space-y-3">
                                    {history.map((entry, index) => (
                                        <div key={entry.id ?? index} className="rounded-[14px] bg-[#f7f8fb] p-4">
                                            <p className="text-[14px] font-semibold text-[#111826]">{entry.to_status?.text || "-"}</p>
                                            {entry.from_status?.text ? <p className="mt-1 text-[13px] text-[#667085]">Dəyişdi: {entry.from_status.text} → {entry.to_status?.text || "-"}</p> : null}
                                            {entry.changed_by?.name ? <p className="mt-1 text-[13px] text-[#667085]">Kim tərəfindən: {entry.changed_by.name}</p> : null}
                                            {entry.note ? <p className="mt-1 text-[13px] text-[#667085]">{entry.note}</p> : null}
                                            {entry.created_at ? <p className="mt-2 text-[12px] text-[#98a2b3]">{formatDateTime(entry.created_at)}</p> : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </aside>
                </div>
            </section>

            <div className="mt-auto w-full pt-12 lg:pt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
            </div>
        </div>
    );
}
