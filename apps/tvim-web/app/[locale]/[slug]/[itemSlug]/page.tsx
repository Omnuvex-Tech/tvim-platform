import { notFound, permanentRedirect, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { getPublicMenuDetail } from "@/lib/public-data";
import { buildSeoMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { ProductStrip } from "@/app/components/ProductStrip/product-strip";
import { ProductDetailTabs } from "@/app/components/ProductDetailTabs/product-detail-tabs";
import { ProductDetailActions } from "@/app/components/ProductDetailActions/product-detail-actions";
import { ProductSpecLink } from "@/app/components/ProductSpecLink/product-spec-link";
import { generateServiceMetadata, renderServiceSlugPage } from "@/app/services/[slug]/page";
import type { ProductComment } from "@/lib/product-comments/client";
import { getSiteChromeData } from "@/lib/site-chrome";
import { localizedHref } from "@/lib/routes";
import { isSupportedLocale } from "@/lib/site-locales";
import { getTranslations } from "@/lib/i18n";
import { getProductSlugsByLocale } from "@/lib/product-slugs";

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

export const revalidate = 300;
export const dynamicParams = true;

type MenuDetailData = {
    menu: {
        name: string;
        title: string | null;
        type: string;
        multi_links?: Record<string, string>;
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
    return await getPublicMenuDetail<MenuDetailData>(slug, locale);
}

const decodeSlugParam = (slug: string) => {
    try {
        return decodeURIComponent(slug);
    } catch {
        return slug;
    }
};

function resolveItemBySlug(items: GridItem[], itemSlug: string, locale: string) {
    const normalizedTarget = decodeSlugParam(itemSlug).trim().toLowerCase();

    const matchesLocale = items.find((item) => {
        const localized = item.multi_slugs?.[locale] || item.slug || "";
        return String(localized).trim().toLowerCase() === normalizedTarget;
    });

    if (matchesLocale) return matchesLocale;

    // The item exists but was asked for under another language's slug. Finding
    // it here lets the caller redirect to this locale's url rather than 404 on
    // what is really the same page.
    return items.find((item) => {
        const candidates = [...Object.values(item.multi_slugs ?? {}), item.slug];
        return candidates.some(
            (candidate) => String(candidate ?? "").trim().toLowerCase() === normalizedTarget,
        );
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

async function getProductDetailBySlug(slug: string, locale: string) {
    try {
        const response = await api.get<ProductDetailData>(config.endpoints.products.detailBySlug(slug), {
            locale,
            cache: "force-cache",
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
    const normalizedLocale = locale.trim().toLowerCase();

    if (!isSupportedLocale(normalizedLocale)) return {};

    if (slug.trim().toLowerCase() === "services") {
        return await generateServiceMetadata({ slug: itemSlug, locale: normalizedLocale });
    }
    if (slug.trim().toLowerCase() === "brand-news") {
        return {};
    }

    if (isProductSlug(slug)) {
        const productResult = await getProductDetailBySlug(itemSlug, normalizedLocale);
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
        const canonicalSlug = String(active?.slug ?? product?.slug ?? itemSlug).trim() || itemSlug;

        // Each language serves this product under its own slug, so alternates
        // have to be looked up rather than derived from the locale prefix.
        const slugsByLocale = await getProductSlugsByLocale(itemSlug);
        const alternatePathByLocale = Object.entries(slugsByLocale).reduce<Record<string, string>>(
            (acc, [localeCode, localeSlug]) => {
                acc[localeCode] = `${localeCode}/products/${localeSlug}`;
                return acc;
            },
            {},
        );
        const alternateLocales = Object.keys(alternatePathByLocale);

        return buildSeoMetadata({
            title,
            description,
            keywords: active?.meta_keywords ?? product?.meta_keywords ?? undefined,
            locale: normalizedLocale,
            canonicalPath: `${normalizedLocale}/products/${canonicalSlug}`,
            siteUrl: config.project.siteUrl,
            ...(alternateLocales.length > 0 ? { alternatePathByLocale, locales: alternateLocales } : null),
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
    return buildSeoMetadata({
        title,
        description,
        keywords: item.seo?.meta_keywords,
        locale: normalizedLocale,
        canonicalPath: `${normalizedLocale}/${slug}/${itemSlug}`,
        siteUrl: config.project.siteUrl,
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
    const normalizedLocale = locale.trim().toLowerCase();
    const t = getTranslations(normalizedLocale).product;

    // Mirrors the guard on the two-segment catch-all: an unknown prefix must
    // 404 rather than serve the api's default language.
    if (!isSupportedLocale(normalizedLocale)) {
        notFound();
    }

    if (slug.trim().toLowerCase() === "services") {
        return await renderServiceSlugPage({ slug: itemSlug, locale: normalizedLocale });
    }
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const sourceParamRaw = resolvedSearchParams?.source;
    const sourceParam = Array.isArray(sourceParamRaw) ? sourceParamRaw[0] : sourceParamRaw;
    const isDiscountSource = String(sourceParam ?? "").trim().toLowerCase() === "discount";
    if (slug.trim().toLowerCase() === "brand-news") {
        redirect(`/${normalizedLocale}/brands/news/${itemSlug}`);
    }

    const chrome = await getSiteChromeData(normalizedLocale);
    const projectSettings = chrome.projectSettings;
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
        const productResult = await getProductDetailBySlug(itemSlug, normalizedLocale);
        if (!productResult.ok) {
            const msg = String(productResult.message ?? "").toLowerCase();
            if (msg.includes("unauth") || msg.includes("unauthorized")) {
                redirect(localizedHref("signin", normalizedLocale));
            }
            notFound();
        }

        const detail = productResult.data;
        const active = detail.active_variation;
        if (!active) notFound();

        // The api resolves any language's slug, so a url can carry another
        // locale's slug under this prefix. Move it onto the one this locale
        // serves so a page has a single address per language.
        const canonicalSlug = String(active.slug ?? detail.product?.slug ?? "").trim();
        if (canonicalSlug && canonicalSlug !== decodeSlugParam(itemSlug)) {
            permanentRedirect(`/${normalizedLocale}/products/${encodeURIComponent(canonicalSlug)}`);
        }

        // Feeds the language switcher, which otherwise keeps this locale's slug
        // under the next language's prefix.
        const productSlugsByLocale = await getProductSlugsByLocale(itemSlug);
        const productLocalizedLinks = Object.entries(productSlugsByLocale).reduce<Record<string, string>>(
            (acc, [localeCode, localeSlug]) => {
                acc[localeCode] = `products/${localeSlug}`;
                return acc;
            },
            {},
        );

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
        const resolvedName = String(active.name ?? product?.name ?? "").trim() || t.productFallback;
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
        const stockText = typeof active.stock === "number" && active.stock > 0 ? `✓ ${t.inStock}` : t.outOfStock;
        // Alış düyməsi stok əsasında qərarlaşır (kartlardakı mavi/sarı qayda ilə eyni),
        // gəldiyi linkdəki `source=discount` parametrindən asılı deyil.
        const isPurchasable = !(typeof active.stock === "number" && active.stock <= 0);
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
                author: String(item.fullname ?? item.customer_name ?? item.name ?? t.userFallback).trim() || t.userFallback,
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
            <SitePageShell chrome={chrome} includeLogoutToast localizedLinks={productLocalizedLinks}>
                <Breadcrumb
                    items={breadcrumbItems as any}
                    className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                    showTitle={false}
                    pageTitle={resolvedName}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <main className="mx-auto w-full max-w-[1280px] !px-1 pt-1 pb-10 lg:!px-2 lg:pb-12">
                    <h1 className="mb-3 text-[34px] leading-tight font-bold tracking-[-0.02em] text-[#111318] max-lg:text-[22px] lg:mb-6">
                        {resolvedName}
                    </h1>

                    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] lg:hidden">
                        <span className="text-[#77839b]">{t.productCode}: {productCode || "-"}</span>
                        <span className="font-semibold text-[#ff3030]">{stockText}</span>
                    </div>

                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-16">
                        <div className="w-full">
                            <div className="relative flex min-h-[300px] items-center justify-center lg:min-h-[540px]">
                                {typeof discountPercent === "number" ? (
                                    <span className="absolute top-3 right-3 z-10 inline-flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#ff2e43] text-[16px] font-bold leading-none text-white lg:top-5 lg:right-5 lg:h-[84px] lg:w-[84px] lg:text-[18px]">
                                        <span className="-translate-y-[1px]">-{discountPercent}%</span>
                                    </span>
                                ) : null}
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

                        <div className="w-full pt-0 lg:pt-2 lg:pl-6">
                            {isDiscountSource ? (
                                <div className="flex items-start">
                                    <div className="relative ml-2 -mt-3 max-lg:ml-0 max-lg:mt-0">
                                        {hasDiscount && oldPrice ? (
                                            <div className="text-[1.05em] font-medium text-[#9aa3b4] line-through">
                                                {t.price}: {oldPrice.toFixed(2)}₼
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
                                            {t.price}: {oldPrice.toFixed(2)}₼
                                        </div>
                                    ) : null}
                                    {hasDiscount && oldPrice ? (
                                        <div className="text-[52px] leading-none font-bold text-[#ff0000] max-lg:text-[42px]">
                                            {currentPrice.toFixed(2)}₼
                                        </div>
                                    ) : (
                                        <div className="text-[1.8em] leading-none font-bold text-[#2a2a2d]">
                                            {t.price}: {currentPrice.toFixed(2)}₼
                                        </div>
                                    )}
                                </>
                            )}

                            <ProductDetailActions
                                productVariationId={productVariationId}
                                stock={active.stock}
                                variant={isPurchasable ? "discount" : "order"}
                                productTitle={resolvedName}
                                productCode={productCode}
                            />

                            {navbarPhone ? (
                                <a
                                    href={`tel:${navbarPhone.replace(/\s|\(|\)|-/g, "")}`}
                                    className={`hidden w-fit cursor-pointer items-center gap-2 py-2 font-[family-name:var(--font-inter)] text-[17px] leading-none font-bold text-[#12151d] lg:flex ${
                                        isDiscountSource ? "mt-6" : "mt-7"
                                    }`}
                                >
                                    <i className="fas fa-phone-volume size-[18px] text-[#12151D]" aria-hidden="true" />
                                    <span>{navbarPhone}</span>
                                </a>
                            ) : null}

                            <div className="mt-6 hidden h-px w-full bg-[#dce3ef] lg:block" />

                            <div className="mt-6 hidden flex-wrap items-center gap-x-6 gap-y-2 text-[15px] lg:flex">
                                <span className="text-[#77839b]">{t.productCode}: {productCode || "-"}</span>
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

                </main>

                {related.length > 0 ? (
                    <section className="mx-auto mt-6 w-full max-w-[1280px] px-1 lg:mt-8 lg:px-2">
                        <ProductStrip items={related as any} variant="latest" title={t.relatedProducts} layout="carousel" cardsTopSpacingClassName="pt-3 pb-4 lg:pt-3 lg:pb-6" />
                    </section>
                ) : null}

            </SitePageShell>
        );
    }

    const menuDetail = await getMenuDetail(slug, normalizedLocale);
    if (!menuDetail) notFound();

    const items = menuDetail.data.items || [];
    const item = resolveItemBySlug(items, itemSlug, normalizedLocale);
    if (!item) notFound();

    // Both segments are localized independently — the parent menu through
    // multi_links and the item through multi_slugs — so either can arrive in
    // another language. Put the whole path onto this locale's wording.
    const localizedMenuSlug = String(menuDetail.menu.multi_links?.[normalizedLocale] ?? "")
        .trim()
        .replace(/^\/+|\/+$/g, "");
    const localizedItemSlug = String(item.multi_slugs?.[normalizedLocale] ?? item.slug ?? "")
        .trim()
        .replace(/^\/+|\/+$/g, "");
    const targetMenuSlug = localizedMenuSlug || slug;
    const targetItemSlug = localizedItemSlug || decodeSlugParam(itemSlug);

    if (targetMenuSlug !== slug || targetItemSlug !== decodeSlugParam(itemSlug)) {
        permanentRedirect(
            `/${normalizedLocale}/${encodeURIComponent(targetMenuSlug)}/${encodeURIComponent(targetItemSlug)}`,
        );
    }

    // Feeds the language switcher with the fully localized path for both
    // segments rather than a locale-prefix swap.
    const itemLocalizedLinks = Object.entries(item.multi_slugs ?? {}).reduce<Record<string, string>>(
        (acc, [localeCode, localeSlug]) => {
            const cleanItemSlug = String(localeSlug ?? "").trim().replace(/^\/+|\/+$/g, "");
            const cleanMenuSlug = String(menuDetail.menu.multi_links?.[localeCode] ?? "")
                .trim()
                .replace(/^\/+|\/+$/g, "");
            if (cleanItemSlug && cleanMenuSlug) acc[localeCode] = `${cleanMenuSlug}/${cleanItemSlug}`;
            return acc;
        },
        {},
    );

    const image = item.banner || item.main_photo || null;

    return (
        <SitePageShell chrome={chrome} includeLogoutToast localizedLinks={itemLocalizedLinks}>
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
        </SitePageShell>
    );
}
