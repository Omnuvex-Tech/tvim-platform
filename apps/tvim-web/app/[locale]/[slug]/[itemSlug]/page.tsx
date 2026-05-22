import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import type {
    FooterMenusData,
    HeaderCategoriesResponseData,
    HeaderMenuResponseData,
    Language,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import {
    extractHeaderCategories,
    extractHeaderItems,
    isCategoriesMenuType,
    isHeaderEnabledItem,
    isTopLevelHeaderItem,
    resolveHeaderMenuHref,
    resolveHeaderMenuLabel,
} from "@/lib/header-navigation";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";
import { ProductStrip } from "@/app/components/ProductStrip/product-strip";

type GridItem = {
    id?: number | string;
    slug?: string;
    multi_slugs?: Record<string, string>;
    name?: string;
    content?: string;
    banner?: string | null;
    main_photo?: string | null;
    datetime1?: string | null;
    seo?: {
        meta_title?: string;
        meta_description?: string;
        meta_keywords?: string | string[];
    };
};

type MenuDetailData = {
    menu: {
        name: string;
        title: string | null;
        type: string;
        seo?: any;
    };
    data: {
        items?: GridItem[];
    };
};

type ProductDetailBreadcrumb = {
    id?: number;
    name?: string;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
};

type ProductDetailFilterValue = {
    value_id?: number;
    name?: string;
    slug?: string;
    count?: number;
    color?: string | null;
    image?: string | null;
};

type ProductDetailFilter = {
    filter_id?: number;
    name?: string;
    slug?: string;
    input_type?: string;
    is_color_filter?: boolean;
    is_clickable?: boolean;
    tag?: string | null;
    values?: ProductDetailFilterValue[];
};

type ProductDetailVariationGalleryItem = {
    id?: number;
    path?: string;
    sort_order?: number;
    is_main?: boolean;
};

type ProductDetailVariation = {
    id?: number;
    name?: string;
    slug?: string;
    stock?: number;
    price?: number;
    old_price?: number | null;
    discount_price?: number | null;
    current_price?: number;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    main_image_path?: string | null;
    gallery?: ProductDetailVariationGalleryItem[];
    filters?: ProductDetailFilter[];
};

type ProductDetailPaymentInstallment = {
    id?: number;
    month?: number;
    percent?: number;
    sort_order?: number;
    base_total?: number;
    interest_amount?: number;
    total_with_interest?: number;
    monthly_amount?: number;
};

type ProductDetailPaymentMethod = {
    key?: string;
    name?: string;
    description?: string | null;
    type?: string;
    is_online?: boolean;
    requires_redirect?: boolean;
    gateway_code?: string | null;
    icon_path?: string | null;
    installments?: ProductDetailPaymentInstallment[];
};

type ProductDetailLabel = {
    id?: number;
    name?: string;
    slug?: string;
    color?: string | null;
    background?: string | null;
};

type ProductDetailRelatedItem = {
    product_id?: number;
    variation_id?: number;
    name?: string;
    slug?: string;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    price?: number;
    old_price?: number | null;
    discount_price?: number | null;
    current_price?: number;
    stock?: number;
    is_new?: boolean;
    is_popular?: boolean;
    most_sale?: boolean;
    main_image?: string | null;
};

type ProductDetailData = {
    menu?: {
        id?: number;
        name?: string;
        meta_title?: string | null;
        meta_description?: string | null;
        meta_keywords?: string | null;
    };
    breadcrumbs?: ProductDetailBreadcrumb[];
    subcategories?: Array<{
        id?: number;
        name?: string;
        meta_title?: string | null;
        meta_description?: string | null;
        meta_keywords?: string | null;
    }>;
    product?: {
        id?: number;
        name?: string;
        description?: string | null;
        slug?: string;
        is_new?: boolean;
        is_popular?: boolean;
        most_sale?: boolean;
        tags?: unknown[];
        published_at?: string | null;
        meta_title?: string | null;
        meta_description?: string | null;
        meta_keywords?: string | null;
    };
    filters?: ProductDetailFilter[];
    active_variation?: ProductDetailVariation | null;
    variations?: ProductDetailVariation[];
    payment_methods?: ProductDetailPaymentMethod[];
    labels?: ProductDetailLabel[];
    related?: ProductDetailRelatedItem[];
};

async function getMenuDetail(slug: string, locale: string) {
    try {
        const response = await api.get<MenuDetailData>(config.endpoints.menus.detail(slug), {
            locale,
        });
        if (response.success && response.data) return response.data;
        return null;
    } catch {
        return null;
    }
}

function resolveItemBySlug(items: GridItem[], itemSlug: string, locale: string) {
    const normalizedTarget = decodeURIComponent(itemSlug).trim().toLowerCase();

    return items.find((item) => {
        const localized = item.multi_slugs?.[locale] || item.slug || "";
        return String(localized).trim().toLowerCase() === normalizedTarget;
    });
}

function stripHtml(input?: string | null) {
    if (!input) return "";
    return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const isProductSlug = (slug: string) => {
    const normalized = String(slug ?? "").trim().toLowerCase();
    return normalized === "products" || normalized === "product";
};

const resolveAssetUrl = (value: string | null | undefined) => {
    const cleaned = String(value ?? "").trim().replace(/^`+|`+$/g, "").trim();
    if (!cleaned) return "";
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    if (cleaned.startsWith("/")) {
        try {
            const origin = new URL(config.api.url).origin;
            return `${origin}${cleaned}`;
        } catch {
            return cleaned;
        }
    }
    return cleaned;
};

async function getProductDetailBySlug(slug: string, locale: string, authToken: string | null) {
    try {
        const response = await api.get<ProductDetailData>(config.endpoints.products.detailBySlug(slug), {
            locale,
            cache: "no-store",
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        if (response.success && response.data) return { ok: true as const, data: response.data };
        return { ok: false as const, message: response.message };
    } catch {
        return { ok: false as const, message: "Server Error" };
    }
}

function getHomeLabel(locale: string) {
    return locale === "en" ? "Home" : "Ana sehife";
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string; itemSlug: string }>;
}): Promise<Metadata> {
    const { locale, slug, itemSlug } = await params;
    if (slug.trim().toLowerCase() === "brand-news") {
        return {};
    }
    const normalizedLocale = locale.toLowerCase();

    if (isProductSlug(slug)) {
        const cookieStore = await cookies();
        const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value ?? undefined);
        const productResult = await getProductDetailBySlug(itemSlug, normalizedLocale, authToken);
        if (!productResult.ok) return {};

        const active = productResult.data.active_variation;
        const product = productResult.data.product;
        const title =
            String(active?.meta_title ?? "").trim() ||
            String(product?.meta_title ?? "").trim() ||
            String(active?.name ?? "").trim() ||
            String(product?.name ?? "").trim() ||
            undefined;
        const description =
            String(active?.meta_description ?? "").trim() ||
            String(product?.meta_description ?? "").trim() ||
            stripHtml(product?.description).slice(0, 170) ||
            undefined;

        return {
            title,
            description,
            keywords: active?.meta_keywords ?? product?.meta_keywords ?? undefined,
        };
    }

    const menuDetail = await getMenuDetail(slug, normalizedLocale);
    if (!menuDetail) return {};

    const item = resolveItemBySlug(menuDetail.data.items || [], itemSlug, normalizedLocale);
    if (!item) return {};

    const fallbackDescription = stripHtml(item.content).slice(0, 170);

    return {
        title: item.seo?.meta_title || item.name || menuDetail.menu.title || menuDetail.menu.name,
        description: item.seo?.meta_description || fallbackDescription,
        keywords: item.seo?.meta_keywords,
    };
}

export default async function GridDetailPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string; itemSlug: string }>;
}) {
    const { locale, slug, itemSlug } = await params;
    if (slug.trim().toLowerCase() === "brand-news") {
        redirect(`/brands/news/${itemSlug}`);
    }
    const normalizedLocale = locale.toLowerCase();

    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value ?? undefined);

    const [langResponse, headerMenuResponse, footerMenuResponse, settingsResponse, categoriesResponse] =
        await Promise.all([
            api.get<Language[]>(config.endpoints.languages.list),
            api.get<HeaderMenuResponseData>(config.endpoints.menus.list, {
                params: { in_header: "1" },
                locale: normalizedLocale,
            }),
            api.get<FooterMenusData>(config.endpoints.menus.list, {
                params: { in_footer: "1" },
                locale: normalizedLocale,
            }),
            api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
                locale: normalizedLocale,
            }),
            api.get<HeaderCategoriesResponseData>("/product/categories", {
                params: { in_header: "1" },
                locale: normalizedLocale,
            }),
        ]);

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
    const headerItems = extractHeaderItems(rawHeaderData);
    const headerTopLevel = headerItems.filter(isTopLevelHeaderItem);

    const headerMenuItems = headerTopLevel
        .filter((menuItem) => !isCategoriesMenuType(menuItem))
        .map((menuItem) => ({
            label: resolveHeaderMenuLabel(menuItem),
            href: resolveHeaderMenuHref(menuItem, normalizedLocale),
        }))
        .filter((menuItem) => menuItem.label);

    let headerCategoryItems: any[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const categoryItems = extractHeaderCategories(categoriesResponse.data);
        const filtered = categoryItems.filter(isHeaderEnabledItem);
        headerCategoryItems = filtered.length > 0 ? filtered : categoryItems;
    } else {
        headerCategoryItems = headerTopLevel.filter(isCategoriesMenuType);
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

    if (isProductSlug(slug)) {
        const productResult = await getProductDetailBySlug(itemSlug, normalizedLocale, authToken);
        if (!productResult.ok) {
            const msg = String(productResult.message ?? "").toLowerCase();
            if (msg.includes("unauth") || msg.includes("unauthorized")) {
                redirect(`/${normalizedLocale}/signin`);
            }
            notFound();
        }

        const detail = productResult.data;
        const active = detail.active_variation;
        if (!active) notFound();

        const product = detail.product;
        const rawGallery = Array.isArray(active.gallery) ? active.gallery : [];
        const images = [
            resolveAssetUrl(active.main_image_path),
            ...rawGallery.map((entry) => resolveAssetUrl(entry?.path)),
        ].filter(Boolean);

        const currentPrice = typeof active.current_price === "number"
            ? active.current_price
            : typeof active.discount_price === "number"
            ? active.discount_price
            : typeof active.price === "number"
            ? active.price
            : 0;

        const oldPrice = typeof active.old_price === "number" ? active.old_price : null;
        const hasDiscount = typeof oldPrice === "number" && oldPrice > currentPrice;
        const discountPercent = hasDiscount ? Math.round((1 - currentPrice / oldPrice) * 100) : null;
        const resolvedName = String(active.name ?? product?.name ?? "").trim() || "Məhsul";

        const variations = Array.isArray(detail.variations) ? detail.variations : [];
        const paymentMethods = Array.isArray(detail.payment_methods) ? detail.payment_methods : [];
        const related = Array.isArray(detail.related) ? detail.related : [];
        const labels = Array.isArray(detail.labels) ? detail.labels : [];

        const breadcrumbItems = [
            { label: getHomeLabel(normalizedLocale), href: `/${normalizedLocale}` },
            ...(Array.isArray(detail.breadcrumbs)
                ? detail.breadcrumbs
                      .map((crumb) => ({
                          label: String(crumb?.name ?? "").trim(),
                      }))
                      .filter((crumb) => crumb.label)
                : []),
            { label: resolvedName, isCurrent: true },
        ];

        return (
            <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
                <NavbarWrapper
                    logo={navbarLogo}
                    phone={navbarPhone}
                    locale={normalizedLocale}
                    languages={langResponse.success && langResponse.data ? langResponse.data : []}
                    menuItems={headerMenuItems}
                    initialCatalogItems={headerCategoryItems}
                />

                <Breadcrumb
                    items={breadcrumbItems as any}
                    className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                    showTitle={false}
                    pageTitle={resolvedName}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <main className="mx-auto w-full max-w-[1280px] !px-1 pt-2 pb-10 lg:!px-2 lg:pb-12">
                    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
                        <div className="w-full">
                            <div className="overflow-hidden rounded-[16px] border border-[#e2e6ef] bg-white">
                                {images[0] ? (
                                    <img
                                        src={images[0]}
                                        alt={resolvedName}
                                        className="h-[320px] w-full object-contain sm:h-[420px] lg:h-[520px]"
                                    />
                                ) : (
                                    <div className="h-[320px] w-full bg-[#f7f7f7] sm:h-[420px] lg:h-[520px]" />
                                )}
                            </div>

                            {images.length > 1 ? (
                                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                                    {images.slice(0, 12).map((src, idx) => (
                                        <div
                                            key={`${src}-${idx}`}
                                            className="overflow-hidden rounded-[12px] border border-[#e2e6ef] bg-white"
                                        >
                                            <img src={src} alt={resolvedName} className="h-[72px] w-full object-contain" />
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="w-full">
                            <div className="rounded-[16px] border border-[#e2e6ef] bg-white p-4 sm:p-6">
                                <h1 className="text-[22px] leading-tight font-semibold text-[#111318] sm:text-[26px]">
                                    {resolvedName}
                                </h1>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {labels.map((label) => {
                                        const text = String(label?.name ?? "").trim();
                                        if (!text) return null;
                                        const color = String(label?.color ?? "").trim() || "#ffffff";
                                        const background = String(label?.background ?? "").trim() || "#ff0000";
                                        return (
                                            <span
                                                key={label?.id ?? text}
                                                className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                                                style={{ color, background }}
                                            >
                                                {text}
                                            </span>
                                        );
                                    })}
                                    {typeof discountPercent === "number" ? (
                                        <span className="inline-flex items-center rounded-full bg-[#ff2e43] px-3 py-1 text-[12px] font-semibold text-white">
                                            -{discountPercent}%
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mt-4">
                                    {hasDiscount && oldPrice ? (
                                        <div className="text-[16px] font-medium text-[#7b8596] line-through">
                                            {oldPrice.toFixed(2)}₼
                                        </div>
                                    ) : null}
                                    <div className="text-[30px] font-bold text-[#111318] sm:text-[36px]">
                                        {currentPrice.toFixed(2)}₼
                                    </div>
                                    <div className="mt-1 text-[14px] text-[#4b5563]">
                                        {typeof active.stock === "number" && active.stock > 0
                                            ? `Stokda var: ${active.stock}`
                                            : "Stokda yoxdur"}
                                    </div>
                                </div>

                                {variations.length > 1 ? (
                                    <div className="mt-6">
                                        <div className="text-[14px] font-semibold text-[#111318]">Variantlar</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {variations.map((variation) => {
                                                const vSlug = String(variation?.slug ?? "").trim();
                                                if (!vSlug) return null;
                                                const vName = String(variation?.name ?? "").trim() || vSlug;
                                                const isActive = String(active.slug ?? "").trim() === vSlug;
                                                return (
                                                    <a
                                                        key={vSlug}
                                                        href={`/${normalizedLocale}/products/${encodeURIComponent(vSlug)}`}
                                                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
                                                            isActive
                                                                ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                                                                : "border-[#e2e6ef] bg-white text-[#111318] hover:border-[#0f57d6]"
                                                        }`}
                                                    >
                                                        {vName}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}

                                {product?.description ? (
                                    <div className="mt-6">
                                        <div className="text-[14px] font-semibold text-[#111318]">Təsvir</div>
                                        <div
                                            className="prose mt-2 max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            {paymentMethods.length > 0 ? (
                                <section className="mt-6 rounded-[16px] border border-[#e2e6ef] bg-white p-4 sm:p-6">
                                    <h2 className="text-[16px] font-semibold text-[#111318]">Ödəniş üsulları</h2>
                                    <div className="mt-4 space-y-4">
                                        {paymentMethods.map((method) => {
                                            const title = String(method?.name ?? "").trim() || String(method?.key ?? "").trim();
                                            if (!title) return null;
                                            const icon = resolveAssetUrl(method?.icon_path ?? null);
                                            const installments = Array.isArray(method?.installments) ? method.installments : [];
                                            return (
                                                <div key={method?.key ?? title} className="rounded-[14px] border border-[#e2e6ef] p-4">
                                                    <div className="flex items-center gap-3">
                                                        {icon ? (
                                                            <img
                                                                src={icon}
                                                                alt={title}
                                                                className="h-8 w-8 object-contain"
                                                            />
                                                        ) : null}
                                                        <div className="flex-1">
                                                            <div className="text-[14px] font-semibold text-[#111318]">{title}</div>
                                                            {method?.description ? (
                                                                <div className="mt-1 text-[13px] text-[#4b5563]">
                                                                    {method.description}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    {installments.length > 0 ? (
                                                        <div className="mt-3 overflow-hidden rounded-[12px] border border-[#e2e6ef]">
                                                            <table className="w-full border-collapse text-left text-[13px]">
                                                                <thead className="bg-[#f7f7f7] text-[#111318]">
                                                                    <tr>
                                                                        <th className="px-3 py-2 font-semibold">Ay</th>
                                                                        <th className="px-3 py-2 font-semibold">Faiz</th>
                                                                        <th className="px-3 py-2 font-semibold">Aylıq</th>
                                                                        <th className="px-3 py-2 font-semibold">Cəmi</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {installments.map((inst) => (
                                                                        <tr key={inst?.id ?? `${method?.key}-${inst?.month}`}>
                                                                            <td className="px-3 py-2">{inst?.month ?? "-"}</td>
                                                                            <td className="px-3 py-2">
                                                                                {typeof inst?.percent === "number"
                                                                                    ? `${inst.percent}%`
                                                                                    : "-"}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {typeof inst?.monthly_amount === "number"
                                                                                    ? `${inst.monthly_amount.toFixed(2)}₼`
                                                                                    : "-"}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {typeof inst?.total_with_interest === "number"
                                                                                    ? `${inst.total_with_interest.toFixed(2)}₼`
                                                                                    : "-"}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ) : null}
                        </div>
                    </section>

                    {related.length > 0 ? (
                        <section className="mt-10">
                            <h2 className="text-[20px] font-bold text-[#111318]">Oxşar məhsullar</h2>
                            <div className="mt-4">
                                <ProductStrip items={related as any} layout="grid" gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4" />
                            </div>
                        </section>
                    ) : null}
                </main>

                <LogoutToast />

                <div className="mt-auto w-full pt-12 lg:pt-20">
                    <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
                </div>
            </div>
        );
    }

    const menuDetail = await getMenuDetail(slug, normalizedLocale);
    if (!menuDetail) notFound();

    const items = menuDetail.data.items || [];
    const item = resolveItemBySlug(items, itemSlug, normalizedLocale);
    if (!item) notFound();

    const image = item.banner || item.main_photo || null;

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={normalizedLocale}
                languages={langResponse.success && langResponse.data ? langResponse.data : []}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <Breadcrumb
                items={[
                    { label: getHomeLabel(normalizedLocale), href: `/${normalizedLocale}` },
                    { label: menuDetail.menu.title || menuDetail.menu.name, href: `/${normalizedLocale}/${slug}` },
                    { label: item.name || "Detail", isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle={false}
                pageTitle={item.name || menuDetail.menu.title || menuDetail.menu.name}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            <article className="news_page mx-auto w-full max-w-[1280px] !px-1 pt-0 pb-10 lg:!px-2 lg:pb-12">
                {image ? (
                    <div className="blog_h mb-8 overflow-hidden rounded-[14px] lg:rounded-[24px]">
                        <img
                            src={image}
                            alt={item.name || "Grid item"}
                            className="blog_h__img w-full object-cover"
                        />
                        <div className="blog_h__content">
                            <div className="breadcrumb-h1">
                            <h1>
                                {item.name || menuDetail.menu.title || menuDetail.menu.name}
                            </h1>
                            </div>
                            {item.datetime1 ? (
                                <div className="news-page__posted mt-5 flex items-center">
                                    <i className="fa-regular fa-clock" aria-hidden="true" />
                                    <p>{item.datetime1}</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="mx-auto w-full">
                    {item.content ? (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                    ) : (
                        <p className="text-[16px] text-[#4b5563]">Kontent tapilmadi.</p>
                    )}

                </div>
            </article>

            <LogoutToast />

            <div className="mt-auto w-full pt-12 lg:pt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
            </div>
        </div>
    );
}
