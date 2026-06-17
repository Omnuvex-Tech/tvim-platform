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
import { buildSeoMetadata, resolveRequestOrigin } from "@/lib/seo";
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
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { ProductDetailTabs } from "@/app/components/ProductDetailTabs/product-detail-tabs";
import { ProductDetailActions } from "@/app/components/ProductDetailActions/product-detail-actions";
import type { ProductComment } from "@/lib/product-comments/client";
import { ProductSpecLink } from "@/app/components/ProductSpecLink/product-spec-link";

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
    slug?: string;
    link?: string;
    url?: string;
    href?: string;
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
    sku?: string | null;
    model?: string | null;
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

type ProductDetailComments = {
    items?: unknown[];
    pagination?: {
        total?: number;
    };
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
        sku?: string | null;
        model?: string | null;
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
    comments?: ProductDetailComments;
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

function toBreadcrumbSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/ə/g, "e")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ç/g, "c")
        .replace(/ş/g, "s")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function resolveBreadcrumbHref(crumb: ProductDetailBreadcrumb, locale: string) {
    const rawHref = String(crumb.href ?? crumb.link ?? crumb.url ?? "").trim();
    const rawSlug = String(crumb.slug ?? "").trim();
    const candidate = rawHref || rawSlug;

    if (candidate) {
        if (/^https?:\/\//i.test(candidate)) {
            return candidate;
        }

        const cleanCandidate = candidate.replace(/^\/+/, "");
        const firstSegment = cleanCandidate.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
        if (["az", "en", "ru"].includes(firstSegment)) {
            return `/${cleanCandidate}`;
        }

        return `/${locale}/${cleanCandidate}`;
    }

    const nameSlug = toBreadcrumbSlug(String(crumb.name ?? ""));
    return nameSlug ? `/${locale}/${nameSlug}` : undefined;
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
        const requestOrigin = await resolveRequestOrigin();
        const canonicalSlug = String(active?.slug ?? product?.slug ?? itemSlug).trim() || itemSlug;

        return buildSeoMetadata({
            title,
            description,
            keywords: active?.meta_keywords ?? product?.meta_keywords ?? undefined,
            locale: normalizedLocale,
            canonicalPath: `${normalizedLocale}/products/${canonicalSlug}`,
            siteUrl: requestOrigin ?? config.project.url,
            locales: [normalizedLocale],
            defaultLocale: normalizedLocale,
            image: resolveAssetUrl(active?.main_image_path),
            imageAlt: title,
        });
    }

    const menuDetail = await getMenuDetail(slug, normalizedLocale);
    if (!menuDetail) return {};

    const item = resolveItemBySlug(menuDetail.data.items || [], itemSlug, normalizedLocale);
    if (!item) return {};

    const fallbackDescription = stripHtml(item.content).slice(0, 170);
    const title = item.seo?.meta_title || item.name || menuDetail.menu.title || menuDetail.menu.name;
    const description = item.seo?.meta_description || fallbackDescription;
    const requestOrigin = await resolveRequestOrigin();

    return buildSeoMetadata({
        title,
        description,
        keywords: item.seo?.meta_keywords,
        locale: normalizedLocale,
        canonicalPath: `${normalizedLocale}/${slug}/${itemSlug}`,
        siteUrl: requestOrigin ?? config.project.url,
        locales: [normalizedLocale],
        defaultLocale: normalizedLocale,
        image: resolveAssetUrl(item.banner || item.main_photo),
        imageAlt: title,
    });
}

export default async function GridDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; slug: string; itemSlug: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { locale, slug, itemSlug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const sourceParamRaw = resolvedSearchParams?.source;
    const sourceParam = Array.isArray(sourceParamRaw) ? sourceParamRaw[0] : sourceParamRaw;
    const isDiscountSource = String(sourceParam ?? "").trim().toLowerCase() === "discount";
    const normalizedLocale = locale.toLowerCase();
    if (slug.trim().toLowerCase() === "brand-news") {
        redirect(`/${normalizedLocale}/brands/news/${itemSlug}`);
    }

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
    const generalSettings = projectSettings?.general;
    const navbarLogoSrc = generalSettings?.images?.logo ?? null;
    const navbarSiteTitle = String(generalSettings?.site_title ?? "").trim();
    const navbarPhones = Array.isArray(generalSettings?.phones) ? generalSettings.phones : [];

    const navbarLogo = navbarLogoSrc ? (
        <img
            src={navbarLogoSrc}
            alt={navbarSiteTitle}
            className="h-10 w-auto object-contain sm:h-12 lg:h-14"
        />
    ) : navbarSiteTitle ? (
        <div className="text-[32px] leading-none font-semibold tracking-[-0.02em] text-[#111318]">
            {navbarSiteTitle}
        </div>
    ) : undefined;

    const navbarPhone = (
        navbarPhones.find((phone) => phone.is_whatsapp && phone.number.trim().startsWith("+994"))?.number ??
        navbarPhones.find((phone) => phone.number.trim().startsWith("+994"))?.number ??
        navbarPhones[0]?.number ??
        "+994 (50) 828-08-88"
    ).trim();

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
        const activeVariationId = Number(active.id);
        const productVariationId = Number.isFinite(activeVariationId) && activeVariationId > 0 ? activeVariationId : null;

        const variations = Array.isArray(detail.variations) ? detail.variations : [];
        const related = Array.isArray(detail.related) ? detail.related : [];
        const labels = Array.isArray(detail.labels) ? detail.labels : [];
        const readText = (value: unknown) => String(value ?? "").trim();
        const getValueTexts = (raw: unknown): string[] => {
            if (Array.isArray(raw)) {
                return raw
                    .flatMap((entry) => {
                        if (typeof entry === "string" || typeof entry === "number") {
                            const text = readText(entry);
                            return text ? [text] : [];
                        }

                        if (entry && typeof entry === "object") {
                            const obj = entry as Record<string, unknown>;
                            const text =
                                readText(obj.name) ||
                                readText(obj.label) ||
                                readText(obj.title) ||
                                readText(obj.value) ||
                                readText(obj.text) ||
                                readText(obj.slug) ||
                                readText(obj.id);
                            return text ? [text] : [];
                        }

                        return [];
                    })
                    .filter(Boolean);
            }

            if (raw && typeof raw === "object") {
                const obj = raw as Record<string, unknown>;
                const text =
                    readText(obj.name) ||
                    readText(obj.label) ||
                    readText(obj.title) ||
                    readText(obj.value) ||
                    readText(obj.text) ||
                    readText(obj.slug) ||
                    readText(obj.id);
                return text ? [text] : [];
            }

            const text = readText(raw);
            return text ? [text] : [];
        };

        const normalizeFilter = (rawFilter: unknown) => {
            if (!rawFilter || typeof rawFilter !== "object") return null;
            const filter = rawFilter as Record<string, unknown>;

            const label =
                readText(filter.name) ||
                readText(filter.label) ||
                readText(filter.title) ||
                readText(filter.key) ||
                readText(filter.slug) ||
                readText(filter.filter_id);
            if (!label) return null;

            const values = [
                ...getValueTexts(filter.values),
                ...getValueTexts(filter.options),
                ...getValueTexts(filter.items),
                ...getValueTexts(filter.value),
            ].filter(Boolean);

            const uniqueValues = Array.from(new Set(values));
            const key =
                readText(filter.filter_id) ||
                readText(filter.value_id) ||
                readText(filter.slug) ||
                label.toLowerCase();

            return { key, label, values: uniqueValues };
        };

        const rawFilterCandidates: unknown[] = [
            ...(Array.isArray(detail.filters) ? detail.filters : []),
            ...(Array.isArray(active.filters) ? active.filters : []),
            ...(Array.isArray((detail.product as any)?.filters) ? (detail.product as any).filters : []),
            ...(Array.isArray((active as any)?.attributes) ? (active as any).attributes : []),
            ...(Array.isArray((detail as any)?.attributes) ? (detail as any).attributes : []),
        ];

        const normalizedFilterMap = new Map<string, { key: string; label: string; values: string[] }>();

        rawFilterCandidates.forEach((rawFilter) => {
            const normalized = normalizeFilter(rawFilter);
            if (!normalized) return;

            const existing = normalizedFilterMap.get(normalized.key);
            if (!existing) {
                normalizedFilterMap.set(normalized.key, normalized);
                return;
            }

            if (normalized.values.length > existing.values.length) {
                normalizedFilterMap.set(normalized.key, normalized);
            }
        });
        const productCode = String(
            active.sku ??
            active.model ??
            product?.sku ??
            product?.model ??
            active.slug ??
            active.id ??
            product?.id ??
            ""
        ).trim();
        const stockText = typeof active.stock === "number" && active.stock > 0 ? "✓ Məhdud saydadır" : "Stokda yoxdur";
        const allSpecRows = Array.from(normalizedFilterMap.values())
            .map((filter) => {
                const label = filter.label;
                const value = filter.values.join(", ");
                if (!label || !value) return null;
                return { label, value };
            })
            .filter((entry): entry is { label: string; value: string } => Boolean(entry));
        const specRows = allSpecRows.slice(0, 3);
        const detailCommentsCount =
            typeof detail.comments?.pagination?.total === "number" && detail.comments.pagination.total >= 0
                ? detail.comments.pagination.total
                : Array.isArray(detail.comments?.items)
                ? detail.comments.items.length
                : 0;
        const initialComments: ProductComment[] = [];
        (Array.isArray(detail.comments?.items) ? detail.comments.items : []).forEach((entry, idx) => {
            if (!entry || typeof entry !== "object") return;
            const item = entry as Record<string, unknown>;

            const comment = String(item.comment ?? item.message ?? item.text ?? "").trim();
            if (!comment) return;

            const ratingValue = Number(item.rating ?? item.rate ?? item.star ?? 0);
            const rating = Number.isFinite(ratingValue) ? Math.max(0, Math.min(5, ratingValue)) : 0;

            initialComments.push({
                id: String(item.id ?? `${idx + 1}`),
                author: String(item.fullname ?? item.customer_name ?? item.name ?? "İstifadəçi").trim() || "İstifadəçi",
                comment,
                rating,
                status: String(item.status ?? "").trim() || undefined,
                createdAt: String(item.created_at ?? "").trim() || undefined,
            });
        });

        const breadcrumbItems = [
            { label: getHomeLabel(normalizedLocale), href: `/${normalizedLocale}` },
            ...(Array.isArray(detail.breadcrumbs)
                ? detail.breadcrumbs
                      .map((crumb) => ({
                          label: String(crumb?.name ?? "").trim(),
                          href: resolveBreadcrumbHref(crumb, normalizedLocale),
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
                    className="mx-auto w-full max-w-[1280px] !px-4 lg:!px-2"
                    showTitle={false}
                    pageTitle={resolvedName}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <main className="mx-auto w-full max-w-[1280px] !px-4 pt-1 pb-10 lg:!px-2 lg:pb-12">
                    <h1 className="mb-3 text-[34px] leading-tight font-bold tracking-[-0.02em] text-[#111318] max-lg:text-[22px] lg:mb-6">
                        {resolvedName}
                    </h1>

                    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] lg:hidden">
                        <span className="text-[#77839b]">Məhsul kodu: {productCode || "-"}</span>
                        <span className="font-semibold text-[#ff3030]">{stockText}</span>
                    </div>

                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-12">
                        <div className="w-full">
                            <div className="flex min-h-[300px] items-center justify-center lg:min-h-[540px]">
                                {images[0] ? (
                                    <img
                                        src={images[0]}
                                        alt={resolvedName}
                                        className="max-h-[320px] w-full object-contain lg:max-h-[500px]"
                                    />
                                ) : (
                                    <div className="h-[300px] w-full lg:h-[420px]" />
                                )}
                            </div>

                            {images.length > 1 ? (
                                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                                    {images.slice(0, 12).map((src, idx) => (
                                        <div
                                            key={`${src}-${idx}`}
                                            className="overflow-hidden rounded-[10px] border border-[#e2e6ef] bg-white"
                                        >
                                            <img src={src} alt={resolvedName} className="h-[66px] w-full object-contain" />
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="w-full pt-0 lg:pt-2">
                            {isDiscountSource ? (
                                <div className="flex items-start">
                                    <div className="relative ml-2 -mt-3 max-lg:ml-0 max-lg:mt-0">
                                        {typeof discountPercent === "number" ? (
                                            <span className="absolute top-[2.8rem] right-full mr-16 inline-flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[#ff2e43] text-[18px] font-bold leading-none text-white max-lg:hidden">
                                                -{discountPercent}%
                                            </span>
                                        ) : null}

                                        {hasDiscount && oldPrice ? (
                                            <div className="text-[1.05em] font-medium text-[#9aa3b4] line-through">
                                                Qiymət: {oldPrice.toFixed(2)}₼
                                            </div>
                                        ) : null}
                                        <div className="text-[35px] leading-none font-bold text-[#ff0000] max-lg:text-[35px]">
                                            {currentPrice.toFixed(2)}₼
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {hasDiscount && oldPrice ? (
                                        <div className="text-[24px] font-semibold text-[#9aa3b4] line-through max-lg:text-[22px]">
                                            Qiymət: {oldPrice.toFixed(2)}₼
                                        </div>
                                    ) : null}
                                    {hasDiscount && oldPrice ? (
                                        <div className="text-[52px] leading-none font-bold text-[#ff0000] max-lg:text-[42px]">
                                            {currentPrice.toFixed(2)}₼
                                        </div>
                                    ) : (
                                        <div className="text-[1.8em] leading-none font-bold text-[#2a2a2d]">
                                            Qiymət: {currentPrice.toFixed(2)}₼
                                        </div>
                                    )}
                                </>
                            )}

                            {isDiscountSource ? (
                                <ProductDetailActions
                                    productVariationId={productVariationId}
                                    stock={active.stock}
                                    variant="discount"
                                    productTitle={resolvedName}
                                    productCode={productCode}
                                />
                            ) : (
                                <ProductDetailActions
                                    productVariationId={productVariationId}
                                    stock={active.stock}
                                    variant="order"
                                    productTitle={resolvedName}
                                    productCode={productCode}
                                />
                            )}

                            {navbarPhone ? (
                                <a
                                    href={`tel:${navbarPhone.replace(/\s|\(|\)|-/g, "")}`}
                                    className={`hidden w-fit cursor-pointer items-center gap-2 font-[family-name:var(--font-inter)] text-[17px] leading-none font-bold text-[#12151d] lg:flex ${
                                        isDiscountSource ? "mt-5" : "mt-6"
                                    }`}
                                >
                                    <i className="fas fa-phone-volume size-[18px] text-[#12151D]" aria-hidden="true" />
                                    <span>{navbarPhone}</span>
                                </a>
                            ) : null}

                            <div className="mt-6 hidden h-px w-full bg-[#dce3ef] lg:block" />

                            <div className="mt-6 hidden flex-wrap items-center gap-x-6 gap-y-2 text-[15px] lg:flex">
                                <span className="text-[#77839b]">Məhsul kodu: {productCode || "-"}</span>
                                <span className="font-semibold text-[#ffcc00]">{stockText}</span>
                            </div>
<div className="mt-5 hidden space-y-2 text-[16px] lg:block">
    {specRows.map((row, idx) => (
        <div key={row.label} className="flex items-center gap-2">
            <span className="min-w-[92px] text-[#2a2a2d]">{row.label}:</span>
            <span className="h-px flex-1 bg-[#dce3ef]" aria-hidden="true" />
            <span className={idx === 0 ? "text-[#003dff]" : "text-[#2a2a2d]"}>{row.value}</span>
        </div>
    ))}
    {allSpecRows.length > 0 ? <ProductSpecLink /> : null}
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

                            {labels.length > 0 ? (
                                <div className="mt-4 flex flex-wrap items-center gap-2">
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
                                </div>
                            ) : null}

                        </div>
                    </section>

                    <ProductDetailTabs
                        descriptionHtml={product?.description ?? null}
                        allSpecRows={allSpecRows}
                        commentsCount={detailCommentsCount}
                        productVariationId={productVariationId}
                        comments={initialComments}
                    />

                    {related.length > 0 ? (
                        <section className="mt-8 lg:mt-10">
                            <ProductStrip items={related as any} variant="latest" title="Oxşar məhsullar" layout="carousel" cardsTopSpacingClassName="py-8 lg:py-16" />
                        </section>
                    ) : null}
                </main>

                <div className="mx-auto mt-12 w-full max-w-[1280px] px-4 lg:mt-14 lg:px-0">
                    <RequestForm />
                </div>

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
