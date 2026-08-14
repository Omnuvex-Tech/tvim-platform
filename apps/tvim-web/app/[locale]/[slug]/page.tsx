import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { Roboto } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Breadcrumb, type Company } from "@repo/ui";
import { RemoteImage } from "@repo/ui";
import BrandListSlider from "@/app/components/BrandListSlider/brand-list-slider";
import { config } from "@/config";
import { buildHomeMetadata, resolveSettingsApiLocale } from "@/lib/settings";
import { htmlToText } from "@repo/shared/utils";
import { getPublicMenuDetail, getPublicMenuList } from "@/lib/public-data";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { ProductGrid } from "@/app/components/ProductGrid/product-grid";
import { Pagination } from "@/app/components/Pagination/pagination";
import { DrawerScrollLock, PendingLink, PendingNavProvider, PendingOverlay } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { LocalizedLinks } from "@/app/components/SiteChrome/localized-links";
import { resolveRequestFormSubmitConfig } from "@/lib/request-form";
import { getSiteChromeData } from "@/lib/site-chrome";
import { resolveLegacyFlatSlugTarget } from "@/lib/legacy-flat-urls";
import { normalizeProductSort, sortProductItems } from "@/lib/product-sort";
import { ProductSortBar } from "@/app/components/ProductSortBar/product-sort-bar";
import { isSupportedLocale } from "@/lib/site-locales";
import { getTranslations } from "@/lib/i18n";
import { resolveMapEmbedUrl } from "@/lib/map";

type MenuDetailData = {
    type: string;
    menu: {
        id: number;
        uuid: string;
        parent_id?: number | null;
        type: string;
        view_type: string;
        name: string;
        title: string | null;
        description: string | null;
        link: string;
        multi_links: Record<string, string>;
        icon?: {
            text?: string | null;
            image?: string | null;
            image_url?: string | null;
        } | null;
        seo: any;
        meta_keywords?: any;
    };
    data: {
        description?: string;
        mode?: string;
        submit?: {
            method: string;
            path: string;
            route: string;
        };
        fields?: any[];
        categories?: Array<{
            id?: number | string;
            name?: string;
            slug?: string;
            icon?: string | null;
            logo?: string | null;
        }>;
        items?: Array<{
            id?: number | string;
            slug?: string;
            multi_slugs?: Record<string, string>;
            name?: string;
            content?: string;
            banner?: string | null;
            main_photo?: string | null;
            datetime1?: string | null;
        }>;
        meta_keywords?: any;
        meta?: {
            page?: number;
            per_page?: number;
            total?: number;
            last_page?: number;
            meta_keywords?: any;
        };
        seo?: any;
    };
    included_items?: any[];
};

type Props = {
    params: Promise<{ locale: string; slug: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 300;
export const dynamicParams = true;

type ProductListFilterValue = {
    value_id?: number;
    name?: string;
    slug?: string;
    count?: number;
    color?: string | null;
    background?: string | null;
    background_image?: string | null;
};

type ProductListFilter = {
    filter_id?: number;
    name?: string;
    slug?: string;
    input_type?: string;
    is_color_filter?: boolean;
    values?: ProductListFilterValue[];
};

type ProductListItem = {
    product_id?: number;
    variation_id?: number;
    name?: string;
    slug?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: any;
    price?: number;
    old_price?: number;
    discount_price?: number;
    stock?: number;
    is_new?: boolean;
    is_popular?: boolean;
    most_sale?: boolean;
    main_image?: string;
};

type ProductListData = {
    menu?: {
        id?: number;
        name?: string;
        meta_title?: string | null;
        meta_description?: string | null;
        meta_keywords?: any;
    };
    breadcrumbs?: Array<{
        id?: number;
        name?: string;
    }>;
    subcategories?: Array<{
        id?: number;
        name?: string;
        slug?: string;
        link?: string;
    }>;
    applied?: {
        main_category_id?: number | string | null;
        q?: string | null;
        sort?: string | null;
        is_new?: boolean | null;
        is_popular?: boolean | null;
        most_sale?: boolean | null;
        price_min?: number | null;
        price_max?: number | null;
        filters?: Record<string, number[]>;
    };
    price?: {
        available_min?: number;
        available_max?: number;
        filtered_min?: number;
        filtered_max?: number;
    };
    sort_options?: Array<{ key?: string; label?: string }>;
    filters?: ProductListFilter[];
    items?: ProductListItem[];
    pagination?: {
        current_page?: number;
        per_page?: number;
        total?: number;
        last_page?: number;
        from?: number;
        to?: number;
        has_more?: boolean;
    };
};

type ProductListApiResponse = {
    success?: boolean;
    message?: string;
    data?: ProductListData;
};

const getCachedProductListPayload = unstable_cache(
    async (requestUrl: string, locale: string) => {
        try {
            const response = await fetch(requestUrl, {
                method: "GET",
                cache: "force-cache",
                headers: {
                    Accept: "application/json",
                    "Content-Language": locale,
                },
            });

            const json = (await response.json()) as unknown;
            if (!json || typeof json !== "object") {
                return null;
            }

            return json as ProductListApiResponse;
        } catch {
            return null;
        }
    },
    ["public-product-list-payload"],
    { revalidate: 300, tags: ["public-product-list-payload"] }
);

async function getMenuDetail(slug: string, locale: string, page?: number) {
    return await getPublicMenuDetail<MenuDetailData>(slug, locale, undefined, page);
}

const roboto = Roboto({
    subsets: ["latin", "latin-ext", "cyrillic"],
    weight: ["400", "500", "700", "900"],
    display: "swap",
});

const formatBlogDate = (value?: string | null) => {
    const matched = String(value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    return matched ? `${matched[3]}/${matched[2]}/${matched[1]}` : "";
};

type BlogCategoryTile = {
    id?: number | string;
    name: string;
    slug: string;
    icon: string;
};

const readMenuNodeSlug = (node: any, locale: string) =>
    String(node?.multi_links?.[locale] ?? node?.link ?? "").trim().replace(/^\/+|\/+$/g, "");

async function getBlogCategoryTiles(parentId: unknown, locale: string) {
    const targetId = Number(parentId);
    if (!Number.isFinite(targetId) || targetId <= 0) return { parent: null as any, tiles: [] as BlogCategoryTile[] };

    const menus = await getPublicMenuList(locale);
    if (!menus) return { parent: null as any, tiles: [] as BlogCategoryTile[] };

    const stack: any[] = [menus];
    let parent: any = null;

    while (stack.length > 0) {
        const node = stack.shift();
        if (!node || typeof node !== "object") continue;
        if (!Array.isArray(node) && Number(node.id) === targetId && Array.isArray(node.children)) {
            parent = node;
            break;
        }
        for (const value of Object.values(node)) {
            if (value && typeof value === "object") stack.push(value);
        }
    }

    const children = Array.isArray(parent?.children) ? parent.children : [];
    const tiles: BlogCategoryTile[] = children
        .map((child: any) => ({
            id: child?.id,
            name: String(child?.name ?? "").trim(),
            slug: readMenuNodeSlug(child, locale),
            icon: String(child?.icon?.image_url ?? "").trim(),
        }))
        .filter((tile: BlogCategoryTile) => tile.name && tile.slug);

    return { parent, tiles };
}

const decodeSlugParam = (slug: string) => {
    try {
        return decodeURIComponent(slug);
    } catch {
        return slug;
    }
};

const getCanonicalPath = (canonical: unknown) => {
    if (typeof canonical !== "string" || !canonical.trim()) return "";

    try {
        return new URL(canonical).pathname.replace(/^\/+/, "");
    } catch {
        return canonical.replace(/^\/+/, "");
    }
};

/**
 * Menus whose CMS content uses <hr> as a light separator and needs the
 * `.prose-soft-hr` rule from globals.css. 347 = Geriqaytarma / Qaytarma və
 * dəyişmə.
 */
const SOFT_HR_MENU_IDS = new Set([347]);

const readSearchParamValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

const hasListingSeoRefinement = (searchParams: Record<string, string | string[] | undefined>) => {
    const page = Number(readSearchParamValue(searchParams.page) ?? 1);
    const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const q = String(readSearchParamValue(searchParams.q) ?? "").trim();
    const sort = String(readSearchParamValue(searchParams.sort) ?? "").trim();
    const perPage = String(readSearchParamValue(searchParams.per_page) ?? "").trim();
    const hasFilter = Object.keys(searchParams).some((key) => key.startsWith("filters["));

    return {
        page: normalizedPage,
        hasRefinement: Boolean(q || sort || perPage || hasFilter || normalizedPage > 1),
    };
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { slug: rawSlug, locale } = await params;
    const slug = decodeSlugParam(rawSlug);
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const normalizedLocale = locale.trim().toLowerCase();

    if (!isSupportedLocale(normalizedLocale)) return {};

    const detail = await getMenuDetail(slug, normalizedLocale);

    if (!detail) return {};

    const seo = detail.data?.seo ?? detail.menu.seo;
    const multiLinks = detail.menu.multi_links ?? {};
    const seoCanonicalPath = getCanonicalPath(seo?.canonical);
    const currentLink = multiLinks[normalizedLocale] || multiLinks[normalizedLocale.toUpperCase()] || detail.menu.link || slug;
    const currentPath = seoCanonicalPath || `${normalizedLocale}/${String(currentLink).replace(/^\/+/, "")}`;
    const alternatePathByLocale = ["az", "en", "ru"].reduce<Record<string, string>>((acc, alternateLocale) => {
        const link = multiLinks[alternateLocale] || multiLinks[alternateLocale.toUpperCase()] || detail.menu.link || slug;
        acc[alternateLocale] = `${alternateLocale}/${String(link).replace(/^\/+/, "")}`;
        return acc;
    }, {});

    const menuType = String(detail.menu.type ?? "").trim().toLowerCase();
    const viewType = String(detail.menu.view_type ?? "").trim().toLowerCase();
    const isListingPage =
        menuType === "categories" ||
        viewType === "categories" ||
        viewType === "catalog" ||
        viewType === "product-list";
    const listingSeoState = hasListingSeoRefinement(resolvedSearchParams || {});

    const metadata = buildHomeMetadata(
        {
            meta_title: seo?.meta_title || detail.menu.title || detail.menu.name,
            meta_description: seo?.meta_description || detail.menu.description || detail.data?.description,
            meta_keywords: seo?.meta_keywords ?? detail.data?.meta_keywords ?? detail.data?.meta?.meta_keywords ?? detail.menu?.meta_keywords,
            canonical: seo?.canonical,
            alternates: seo?.alternates,
            x_default: seo?.x_default,
            twitter: seo?.twitter,
            open_graph: seo?.open_graph,
        },
        normalizedLocale,
        {
            canonicalPath: currentPath,
            alternatePathByLocale,
            siteUrl: config.project.siteUrl,
            useProjectFallbacks: false,
        },
    );

    return isListingPage && listingSeoState.hasRefinement
        ? {
            ...metadata,
            robots: {
                index: false,
                follow: true,
            },
        }
        : metadata;
}

export default async function DynamicMenuPage({ params, searchParams }: Props) {
    const { locale, slug: rawSlug } = await params;
    const slug = decodeSlugParam(rawSlug);
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const normalizedLocale = locale.trim().toLowerCase();

    // Without this the catch-all answers any prefix (/xx/haqqimizda), which the
    // API resolves to its default language and turns into an unbounded set of
    // duplicate urls.
    if (!isSupportedLocale(normalizedLocale)) {
        notFound();
    }

    const t = getTranslations(normalizedLocale);

    const requestedPage = (() => {
        const raw = Number(readSearchParamValue(resolvedSearchParams.page) ?? 1);
        return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
    })();

    const [menuDetail, chrome] = await Promise.all([
        getMenuDetail(slug, normalizedLocale, requestedPage),
        getSiteChromeData(normalizedLocale),
    ]);

    if (!menuDetail) {
        const legacyTarget = await resolveLegacyFlatSlugTarget(slug, normalizedLocale);
        if (legacyTarget) {
            permanentRedirect(legacyTarget);
        }

        notFound();
    }

    const projectSettings = chrome.projectSettings;
    const headerCategoryItems = chrome.initialCatalogItems;

    const { menu, data: pageData } = menuDetail;
    const localizedLinks = menu.multi_links ?? {};

    // The cms resolves another language's slug and answers in the requested
    // language, so this url can be reached under a slug this locale does not
    // serve. Move it onto the localized one — 20 of 29 menu nodes differ per
    // language, so this is the common case rather than the exception.
    const localizedSlug = String(localizedLinks[normalizedLocale] ?? "").trim().replace(/^\/+|\/+$/g, "");
    if (localizedSlug && localizedSlug !== slug) {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(resolvedSearchParams)) {
            if (value == null) continue;
            for (const entry of Array.isArray(value) ? value : [value]) {
                const trimmed = String(entry ?? "").trim();
                if (trimmed) query.append(key, trimmed);
            }
        }
        const suffix = query.toString();
        permanentRedirect(
            `/${normalizedLocale}/${encodeURIComponent(localizedSlug)}${suffix ? `?${suffix}` : ""}`,
        );
    }

    // Normalize keywords for UI and metadata usage
    function normalizeKeywords(raw: any): string[] {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
        if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
        if (typeof raw === "object") {
            if (raw.meta_keywords) return normalizeKeywords(raw.meta_keywords);
            if (raw.keywords) return normalizeKeywords(raw.keywords);
        }
        return [];
    }

    const rawKeywordsSource = menu.seo?.meta_keywords ?? pageData?.meta_keywords ?? pageData?.meta?.meta_keywords ?? menu.meta_keywords;
    const keywordsArr = normalizeKeywords(rawKeywordsSource);

    const includedItems: any[] = menuDetail.included_items || [];
    const gridItems = Array.isArray(pageData?.items) ? pageData.items : [];
    const isGridView = menu.type === "grids" || (pageData?.mode === "list" && gridItems.length > 0);
    const pageSubmitConfig = resolveRequestFormSubmitConfig(pageData?.submit ?? pageData);
    const pageDescriptionHtml = String(
        pageData?.description ??
        (pageData as { content?: string | null } | undefined)?.content ??
        menu.description ??
        "",
    ).trim();

    function mapIncludedValuesToCompanies(values: any[]) {
        const arr = Array.isArray(values) ? values : [];
        return arr
            .map((v: any, i: number): Company => ({
                id: String(v?.value_id ?? v?.id ?? `company-${i}`),
                name: v?.name ?? v?.title ?? "",
                logo: v?.image ?? v?.image_url ?? v?.logo ?? null,
                url: v?.slug
                    ? (isGridView
                        ? `/${normalizedLocale}/${slug}/${String(v.slug)}`
                        : `/${normalizedLocale}/brands/news/${String(v.slug)}`)
                    : (v?.url ?? v?.link ?? v?.website ?? "").toString().trim() || undefined,
            }))
            .filter((c) => Boolean(c.name));
    }

    function resolveGridItemHref(item: {
        slug?: string;
        multi_slugs?: Record<string, string>;
    }) {
        const localizedSlug = item.multi_slugs?.[normalizedLocale] || item.slug || "";
        const cleanSlug = String(localizedSlug).trim().replace(/^\/+|\/+$/g, "");
        if (!cleanSlug) return "#";
        return `/${normalizedLocale}/${slug}/${cleanSlug}`;
    }

    function resolveIncludedMenuLink(menuItem: any) {
        const localizedLink = menuItem?.multi_links?.[normalizedLocale] || menuItem?.link || "";
        return String(localizedLink).trim().replace(/^\/+|\/+$/g, "");
    }

    const hasSelfIncludedItem = includedItems.some((inc: any) => inc?.included_type === "self");

    const renderIncludedItems = (selfContent?: ReactNode) => includedItems.length > 0 ? (
        <div className="mt-8 w-full lg:mt-10">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-1 lg:gap-10 lg:px-2">
                {includedItems.map((inc: any, idx: number) => {
                    if (inc.included_type === "self") {
                        return selfContent ? <div key={idx}>{selfContent}</div> : null;
                    }

                    if (inc.included_type === "menu" && inc.type === "form") {
                        const submitConfig = resolveRequestFormSubmitConfig(inc?.data?.submit ?? inc?.data ?? inc);
                        const fields = inc.data?.fields ?? inc.data?.data?.fields;
                        const formHeading = String(inc?.menu?.title ?? inc?.menu?.name ?? "").trim();
                        const formSubheading = htmlToText(inc?.menu?.description ?? inc?.data?.description ?? "");

                        return (
                            <div key={idx}>
                                <RequestForm submitConfig={submitConfig} fields={fields} heading={formHeading} subheading={formSubheading} />
                            </div>
                        );
                    }

                    if (inc.included_type === "brand" && inc.data?.values) {
                        const companies = mapIncludedValuesToCompanies(inc.data.values);
                        if (companies.length === 0) return null;
                        return (
                            <div key={idx}>
                                <BrandListSlider companies={companies} />
                            </div>
                        );
                    }

                    if (
                        inc.included_type === "menu" &&
                        inc.type === "grids" &&
                        inc.menu?.view_type === "brand-news" &&
                        Array.isArray(inc.data?.items)
                    ) {
                        const items = inc.data.items as Array<{
                            id?: number | string;
                            slug?: string;
                            multi_slugs?: Record<string, string>;
                            name?: string;
                            content?: string;
                            banner?: string | null;
                            main_photo?: string | null;
                            datetime1?: string | null;
                        }>;

                        const includedMenuLink = resolveIncludedMenuLink(inc.menu);

                        const companies: Company[] = items
                            .map((item, itemIndex) => {
                                const localizedSlug = item.multi_slugs?.[normalizedLocale] || item.slug || "";
                                const cleanSlug = String(localizedSlug).trim().replace(/^\/+|\/+$/g, "");
                                const href = cleanSlug && includedMenuLink
                                    ? `/${normalizedLocale}/${includedMenuLink}/${cleanSlug}`
                                    : "#";
                                const logo = item.main_photo || item.banner || null;
                                return {
                                    id: String(item.id ?? `brand-news-item-${itemIndex}`),
                                    name: item.name || "Brand News",
                                    logo,
                                    url: href,
                                };
                            })
                            .filter((company) => Boolean(company.logo));

                        if (companies.length === 0) return null;

                        return (
                            <section key={idx}>
                                <h2 className="mb-1 text-[24px] font-semibold text-[#111827] lg:mb-2 lg:text-[30px]">
                                    {inc.menu?.title || inc.menu?.name || "Brand News"}
                                </h2>
                                <BrandListSlider companies={companies} />
                            </section>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    ) : null;

    const includedItemsSection = renderIncludedItems();

    // The menu id is the same in every locale; the slug is not.
    const contentProseClassName = SOFT_HR_MENU_IDS.has(Number(menu.id))
        ? "prose prose-soft-hr max-w-none"
        : "prose max-w-none";

    const pageContentBody = (
        <>
            <div className={contentProseClassName}>
                {pageDescriptionHtml && (
                    <div dangerouslySetInnerHTML={{ __html: pageDescriptionHtml }} />
                )}
            </div>

            {pageSubmitConfig && (
                <div className="mt-8 lg:mt-12">
                    <RequestForm submitConfig={pageSubmitConfig} fields={pageData?.fields} heading={String(menu.title ?? menu.name ?? "").trim()} subheading={htmlToText(menu.description ?? "")} />
                </div>
            )}
        </>
    );

    const pageContentSection = (
        <section className="mx-auto w-full max-w-[1280px] px-1 pt-2 pb-10 lg:px-2 lg:pt-3 lg:pb-12">
            {pageContentBody}
        </section>
    );

    const footerSpacer = keywordsArr.length > 0 ? null : <div className="h-10 lg:h-14" />;

    const keywordsSection = keywordsArr.length > 0 ? (
        <div className="mx-auto mt-20 mb-10 w-full max-w-[1280px] px-1 lg:mt-24 lg:mb-14 lg:px-2">
            <div className="w-full border-t border-[#e5e9ef]" />
            <div className="pt-4">
                <div className="flex flex-wrap justify-start gap-2">
                    {keywordsArr.map((kw, i) => (
                        <span
                            key={i}
                            className="inline-block rounded-[20px] border border-[#ddd] bg-[#f8f8f8] px-[12px] py-[6px] text-[14px] leading-none font-normal text-[#333] transition-all duration-200 ease-in-out cursor-default"
                        >
                            {kw}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    ) : null;

    const isCategoriesView = (() => {
        const t = String(menu.type ?? "").trim().toLowerCase();
        const vt = String(menu.view_type ?? "").trim().toLowerCase();
        return t === "categories" || vt === "categories" || vt === "catalog" || vt === "product-list";
    })();

    if (isCategoriesView) {
        const apiBase = (config.api.url || "https://admin.tvim.az/api/v1").trim().replace(/\/+$/, "");
        const listUrl = new URL(`${apiBase}${config.endpoints.products.paginatedList}`);
        const outgoingParams = new URLSearchParams();

        const findCategoryByLink = (items: any[], targetLink: string): any | null => {
            const cleanTarget = String(targetLink || "").trim().replace(/^\/+|\/+$/g, "");
            if (!cleanTarget) return null;
            const stack = Array.isArray(items) ? [...items] : [];
            while (stack.length > 0) {
                const node = stack.shift();
                if (!node || typeof node !== "object") continue;
                const linkValue = String(node.multi_links?.[normalizedLocale] ?? node.link ?? "").trim().replace(/^\/+|\/+$/g, "");
                if (linkValue && linkValue === cleanTarget) return node;
                const children = Array.isArray(node.children) ? node.children : [];
                for (const child of children) stack.push(child);
            }
            return null;
        };

        const findCategoryById = (items: any[], id: number): any | null => {
            const stack = Array.isArray(items) ? [...items] : [];
            while (stack.length > 0) {
                const node = stack.shift();
                if (!node || typeof node !== "object") continue;
                if (Number(node.id) === id) return node;
                const children = Array.isArray(node.children) ? node.children : [];
                for (const child of children) stack.push(child);
            }
            return null;
        };

        const categoryNode =
            findCategoryByLink(headerCategoryItems as any[], slug) ??
            findCategoryById(headerCategoryItems as any[], Number(menu.id));

        const mainCategoryId = (() => {
            const idFromTree = Number(categoryNode?.id);
            if (Number.isFinite(idFromTree) && idFromTree > 0) return String(idFromTree);
            const uuid = String(menu.uuid ?? "").trim();
            if (uuid) return uuid;
            return String(menu.id);
        })();

        outgoingParams.set("main_category_id", mainCategoryId);

        const allowKey = (key: string) => {
            if (key === "page") return true;
            if (key === "per_page") return true;
            if (key === "q") return true;
            // `sort` is intentionally not forwarded: sorting is applied on the frontend.
            if (key === "is_new") return true;
            if (key === "is_popular") return true;
            if (key === "most_sale") return true;
            if (key === "price_min") return true;
            if (key === "price_max") return true;
            return /^filters\[\d+\](\[\])?$/.test(key);
        };

        for (const [key, value] of Object.entries(resolvedSearchParams)) {
            if (!allowKey(key)) continue;
            if (value == null) continue;
            if (Array.isArray(value)) {
                for (const v of value) {
                    const trimmed = String(v ?? "").trim();
                    if (trimmed) outgoingParams.append(key, trimmed);
                }
            } else {
                const trimmed = String(value ?? "").trim();
                if (trimmed) outgoingParams.set(key, trimmed);
            }
        }

        listUrl.search = outgoingParams.toString();

        const productListPayload = await getCachedProductListPayload(listUrl.toString(), normalizedLocale);

        const productList = productListPayload?.success ? productListPayload.data : undefined;
        const listItems = Array.isArray(productList?.items) ? productList!.items! : [];

        const parsePageNumber = (value: string | string[] | undefined) => {
            const raw = Array.isArray(value) ? value[0] : value;
            const numeric = Number(raw ?? 1);
            if (!Number.isFinite(numeric) || numeric < 1) return 1;
            return Math.floor(numeric);
        };

        const buildPaginationTokens = (currentPage: number, lastPage: number) => {
            if (lastPage <= 1) return [1] as Array<number | "ellipsis">;
            if (lastPage <= 7) return Array.from({ length: lastPage }, (_, index) => index + 1) as Array<number | "ellipsis">;
            const tokens: Array<number | "ellipsis"> = [1];
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(lastPage - 1, currentPage + 1);
            if (currentPage <= 3) {
                start = 2;
                end = 4;
            }
            if (currentPage >= lastPage - 2) {
                start = lastPage - 3;
                end = lastPage - 1;
            }
            if (start > 2) tokens.push("ellipsis");
            for (let page = start; page <= end; page += 1) tokens.push(page);
            if (end < lastPage - 1) tokens.push("ellipsis");
            tokens.push(lastPage);
            return tokens;
        };

        const subcategoriesFromTree = Array.isArray(categoryNode?.children) ? categoryNode.children : [];
        const subcategoriesFromApi = Array.isArray(productList?.subcategories) ? productList!.subcategories! : [];
        const effectiveSubcategories = subcategoriesFromTree.length > 0 ? subcategoriesFromTree : subcategoriesFromApi;

        const currentUiParams = new URLSearchParams();
        for (const [key, value] of Object.entries(resolvedSearchParams)) {
            if (value == null) continue;
            if (Array.isArray(value)) {
                for (const v of value) {
                    const trimmed = String(v ?? "").trim();
                    if (trimmed) currentUiParams.append(key, trimmed);
                }
            } else {
                const trimmed = String(value ?? "").trim();
                if (trimmed) currentUiParams.set(key, trimmed);
            }
        }

        const appliedFilters = productList?.applied?.filters ?? {};
        const selectedPairs = new Set<string>();
        for (const [filterId, values] of Object.entries(appliedFilters)) {
            const arr = Array.isArray(values) ? values : [];
            for (const valueId of arr) {
                selectedPairs.add(`${filterId}:${String(valueId)}`);
            }
        }

        const buildHrefWithParams = (nextParams: URLSearchParams) => {
            const qs = nextParams.toString();
            return qs ? `/${normalizedLocale}/${slug}?${qs}` : `/${normalizedLocale}/${slug}`;
        };

        const toggleFilterHref = (filterId: number, valueId: number) => {
            const keyWithArr = `filters[${filterId}][]`;
            const keyPlain = `filters[${filterId}]`;
            const next = new URLSearchParams(currentUiParams.toString());
            next.set("page", "1");
            const current = [...next.getAll(keyWithArr), ...next.getAll(keyPlain)]
                .map((v) => v.trim())
                .filter(Boolean);
            const valueText = String(valueId);
            const isSelected = selectedPairs.has(`${String(filterId)}:${valueText}`) || current.includes(valueText);
            const updated = isSelected ? current.filter((v) => v !== valueText) : [...current, valueText];
            next.delete(keyWithArr);
            next.delete(keyPlain);
            const unique = Array.from(new Set(updated));
            for (const v of unique) next.append(keyWithArr, v);
            if (unique.length === 0) {
                next.delete(keyWithArr);
                next.delete(keyPlain);
            }
            return buildHrefWithParams(next);
        };

        const activeSort = normalizeProductSort(currentUiParams.get("sort"));
        const sortedListItems = sortProductItems(listItems, activeSort, normalizedLocale);

        const currentPage = Math.max(1, Number(productList?.pagination?.current_page ?? parsePageNumber(resolvedSearchParams.page)));
        const lastPage = Math.max(1, Number(productList?.pagination?.last_page ?? 1));
        const paginationTokens = buildPaginationTokens(currentPage, lastPage);

        const hasFilters = Array.isArray(productList?.filters) && productList.filters.length > 0;
        const drawerId = `filters-drawer-${String(slug).replace(/[^a-z0-9_-]/gi, "-")}`;

        // One filter list serves both breakpoints: an off-canvas drawer below lg,
        // the static sidebar from lg up. Rendering it twice doubled the HTML of
        // every category, and on the big ones the filters are most of the page.
        //
        // The open state comes from the checkbox below, which is not a sibling of
        // the panel, so `peer-checked` cannot reach it. The `filters-toggle` /
        // `filters-panel` pair in globals.css bridges that gap.
        const filtersPanelClassName = hasFilters
            ? "filters-panel space-y-5"
            : "hidden space-y-5 self-start lg:block";

        const filterCopy = getTranslations(normalizedLocale).filters;
        const showMoreFiltersText = filterCopy.showMore;
        const showLessFiltersText = filterCopy.showLess;

        const filtersBody = (
            <>
                {hasFilters ? (() => {
                    const filterGroups = productList!.filters!.map((filter) => {
                        const filterId = Number(filter?.filter_id);
                        if (!Number.isFinite(filterId) || filterId <= 0) return null;
                        const values = Array.isArray(filter?.values) ? filter!.values! : [];
                        if (values.length === 0) return null;

                        const visible = values.slice(0, 5);
                        const rest = values.slice(5);

                        const renderRow = (v: any, idx: number) => {
                            const valueId = Number(v?.value_id);
                            if (!Number.isFinite(valueId) || valueId <= 0) return null;
                            const selected = selectedPairs.has(`${String(filterId)}:${String(valueId)}`);
                            const countText = typeof v?.count === "number" ? String(v.count) : "";

                            return (
                                <PendingLink
                                    key={`${valueId}-${idx}`}
                                    href={toggleFilterHref(filterId, valueId)}
                                    className="flex items-center justify-between rounded-[12px] px-3 py-2 transition-colors hover:bg-[#f5f7fb]"
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span
                                            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${selected ? "border-[#0f57d6] bg-[#0f57d6]" : "border-[#cfd7e3] bg-white"
                                                }`}
                                            aria-hidden="true"
                                        >
                                            {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                                        </span>
                                        <span className="min-w-0 truncate text-[14px] text-[#111318]">{String(v?.name ?? "").trim() || `#${valueId}`}</span>
                                    </span>
                                    {countText ? (
                                        <span className="ml-3 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f6] px-2 text-[12px] font-medium text-[#4b5565]">
                                            {countText}
                                        </span>
                                    ) : null}
                                </PendingLink>
                            );
                        };

                        return (
                            <div
                                key={filterId}
                                className="rounded-[16px] border border-[#eee] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                            >
                                <div className="mb-3 border-b border-[#eee] pb-3 text-[13px] font-bold uppercase text-[#111318]">
                                    {String(filter?.name ?? "").trim() || filterCopy.filterFallback}
                                </div>
                                <div className="space-y-1">
                                    {visible.map(renderRow)}
                                </div>
                                {rest.length > 0 ? (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer select-none px-3 py-2 text-[14px] font-medium text-[#0f57d6] hover:underline">
                                            {filterCopy.showMoreCount.replace("{count}", String(rest.length))}
                                        </summary>
                                        <div className="mt-1 space-y-1">
                                            {rest.map(renderRow)}
                                        </div>
                                    </details>
                                ) : null}
                            </div>
                        );
                    }).filter(Boolean);

                    const visibleGroups = filterGroups.slice(0, 5);
                    const restGroups = filterGroups.slice(5);

                    return (
                        <>
                            {visibleGroups}
                            {restGroups.length > 0 ? (
                                <details className="group">
                                    <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-2 rounded-[16px] border border-dashed border-[#cfd7e3] bg-white px-5 py-3 text-[14px] font-semibold text-[#0f57d6] transition-colors hover:bg-[#f5f7fb] [&::-webkit-details-marker]:hidden">
                                        <span className="group-open:hidden">{showMoreFiltersText}</span>
                                        <span className="hidden group-open:inline">{showLessFiltersText}</span>
                                        <i
                                            className="fa-solid fa-chevron-down text-[12px] transition-transform duration-200 group-open:rotate-180"
                                            aria-hidden="true"
                                        />
                                    </summary>
                                    <div className="mt-5 space-y-5">
                                        {restGroups}
                                    </div>
                                </details>
                            ) : null}
                        </>
                    );
                })() : null}

                {productListPayload && productListPayload.success === false ? (
                    <div className="rounded-[16px] border border-[#eee] bg-white p-5 text-[15px] text-[#4b5565] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                        {productListPayload.message || filterCopy.loadFailed}
                    </div>
                ) : null}
            </>
        );

        const categoryDescriptionHtml = String(menu.description ?? "").trim();
        const categoryIconUrl = String(menu.icon?.image_url ?? "").trim();

        const categoryAboutSection = categoryDescriptionHtml ? (
            <section className="mt-8 w-full lg:mt-10">
                <div className="mx-auto w-full max-w-[1280px] px-1 lg:px-2">
                    <div className="flex flex-col gap-4 rounded-[16px] bg-[#f5f7fb] p-5 sm:flex-row sm:items-start sm:gap-6 lg:p-7">
                        {categoryIconUrl ? (
                            <div className="flex size-[96px] shrink-0 items-center justify-center rounded-[12px] bg-white p-3">
                                <RemoteImage
                                    src={categoryIconUrl}
                                    alt={menu.title || menu.name}
                                    width={192}
                                    height={192}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        ) : null}
                        <div
                            className="max-w-none text-[14px] leading-[1.7] text-[#4b5565] lg:text-[15px] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_b]:font-semibold [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_*]:!text-inherit [&_*]:!text-[length:inherit]"
                            dangerouslySetInnerHTML={{ __html: categoryDescriptionHtml }}
                        />
                    </div>
                </div>
            </section>
        ) : null;

        return (
            <SitePageShell chrome={chrome} includeLogoutToast>
                <LocalizedLinks value={localizedLinks} />
                <Breadcrumb
                    items={[
                        { label: t.common.home, href: `/${normalizedLocale}` },
                        { label: menu.name, isCurrent: true },
                    ]}
                    className="mx-auto w-full max-w-[1280px] px-1 lg:px-2"
                    showTitle
                    pageTitle={menu.title || menu.name}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <section className="mx-auto w-full max-w-[1280px] px-1 pt-6 pb-10 lg:px-2 lg:pb-12">
                    <PendingNavProvider>
                        <input id={drawerId} type="checkbox" className="filters-toggle peer hidden" />
                        <DrawerScrollLock checkboxId={drawerId} />
                        <PendingOverlay className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20" />
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                            <aside className={filtersPanelClassName}>
                                {hasFilters ? (
                                    <div className="flex items-center justify-between lg:hidden">
                                        <div className="text-[16px] font-bold text-[#111318]">{filterCopy.title}</div>
                                        <label
                                            htmlFor={drawerId}
                                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#eee] bg-white text-[#111318]"
                                            aria-label="close-filters"
                                        >
                                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                                        </label>
                                    </div>
                                ) : null}
                                {filtersBody}
                            </aside>

                            <div>
                                {hasFilters ? (
                                    <label
                                        htmlFor={drawerId}
                                        className="mb-4 flex w-full cursor-pointer items-center justify-between rounded-full bg-[#ffd500] px-5 py-3 text-[15px] font-semibold text-[#111318] lg:hidden"
                                    >
                                        <span>{filterCopy.button}</span>
                                        <i className="fa-solid fa-sliders text-[16px]" aria-hidden="true" />
                                    </label>
                                ) : null}
                                {effectiveSubcategories.length > 0 ? (
                                    <div className="mb-6 rounded-[16px] border border-[#eee] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                                        <div className="grid grid-cols-2 gap-y-7 gap-x-10 sm:grid-cols-3 lg:grid-cols-4">
                                            {effectiveSubcategories.map((sub: any) => {
                                                const linkValue = String(
                                                    sub?.multi_links?.[normalizedLocale] ??
                                                    sub?.link ??
                                                    sub?.slug ??
                                                    ""
                                                )
                                                    .trim()
                                                    .replace(/^\/+|\/+$/g, "");
                                                const href = linkValue ? `/${normalizedLocale}/${linkValue}` : "#";
                                                return (
                                                    <PendingLink
                                                        key={String(sub?.id ?? linkValue ?? sub?.name)}
                                                        href={href}
                                                        className="text-[14px] font-semibold text-[#111318] hover:underline"
                                                    >
                                                        {sub?.name ?? sub?.title ?? filterCopy.subcategoryFallback}
                                                    </PendingLink>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}

                                <ProductSortBar
                                    locale={normalizedLocale}
                                    activeSort={activeSort}
                                    currentParams={currentUiParams.toString()}
                                    basePath={`/${normalizedLocale}/${slug}`}
                                />

                                <div className="relative min-h-[360px]">
                                    {sortedListItems.length > 0 ? (
                                        <ProductGrid items={sortedListItems} locale={normalizedLocale} />
                                    ) : (
                                        <div className="rounded-[16px] border border-[#eee] bg-white p-5 text-[15px] text-[#4b5565] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                                            {filterCopy.noProducts}
                                        </div>
                                    )}

                                    {lastPage > 1 ? (
                                        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                                            {(() => {
                                                const prevParams = new URLSearchParams(currentUiParams.toString());
                                                prevParams.set("page", String(Math.max(1, currentPage - 1)));
                                                const nextParams = new URLSearchParams(currentUiParams.toString());
                                                nextParams.set("page", String(Math.min(lastPage, currentPage + 1)));

                                                return (
                                                    <>
                                                        <PendingLink
                                                            href={buildHrefWithParams(prevParams)}
                                                            aria-disabled={currentPage <= 1}
                                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111318] transition-colors sm:h-10 sm:w-10 ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"
                                                                }`}
                                                        >
                                                            <i className="fa-solid fa-chevron-left text-[12px]" />
                                                        </PendingLink>

                                                        {paginationTokens.map((token, idx) => {
                                                            if (token === "ellipsis") {
                                                                return (
                                                                    <span key={`ellipsis-${idx}`} className="inline-flex h-9 w-9 items-center justify-center text-[16px] text-[#8b97a9] sm:h-10 sm:w-10">
                                                                        ...
                                                                    </span>
                                                                );
                                                            }

                                                            const next = new URLSearchParams(currentUiParams.toString());
                                                            next.set("page", String(token));
                                                            const href = buildHrefWithParams(next);
                                                            const isActive = token === currentPage;

                                                            return (
                                                                <PendingLink
                                                                    key={`page-${token}`}
                                                                    href={href}
                                                                    aria-current={isActive ? "page" : undefined}
                                                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors sm:h-10 sm:w-10 sm:text-[14px] ${isActive
                                                                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                                                                            : "border-[#e5e7eb] bg-white text-[#111318] hover:bg-[#f5f7fb]"
                                                                        }`}
                                                                >
                                                                    {token}
                                                                </PendingLink>
                                                            );
                                                        })}

                                                        <PendingLink
                                                            href={buildHrefWithParams(nextParams)}
                                                            aria-disabled={currentPage >= lastPage}
                                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111318] transition-colors sm:h-10 sm:w-10 ${currentPage >= lastPage ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"
                                                                }`}
                                                        >
                                                            <i className="fa-solid fa-chevron-right text-[12px]" />
                                                        </PendingLink>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {hasFilters ? (
                            <label
                                htmlFor={drawerId}
                                className="fixed inset-0 z-40 cursor-pointer bg-black/30 opacity-0 pointer-events-none transition-opacity duration-300 ease-out peer-checked:opacity-100 peer-checked:pointer-events-auto lg:hidden"
                                aria-label="close-filters-overlay"
                            />
                        ) : null}
                    </PendingNavProvider>
                </section>

                {includedItemsSection}
                {categoryAboutSection}
                {keywordsSection}
                {footerSpacer}
            </SitePageShell>
        );
    }

    if (isGridView) {
        const isBlogView = String(menu.view_type ?? "").trim().toLowerCase() === "blog";
        const ownCategories: BlogCategoryTile[] = (Array.isArray(pageData?.categories) ? pageData.categories : [])
            .map((category) => ({
                id: category?.id,
                name: String(category?.name ?? "").trim(),
                slug: String(category?.slug ?? "").trim().replace(/^\/+|\/+$/g, ""),
                icon: String(category?.icon ?? category?.logo ?? "").trim(),
            }))
            .filter((category) => category.slug && category.name);

        const siblings = isBlogView && ownCategories.length === 0
            ? await getBlogCategoryTiles(menu.parent_id, normalizedLocale)
            : { parent: null, tiles: [] as BlogCategoryTile[] };

        const blogCategories = ownCategories.length > 0 ? ownCategories : siblings.tiles;
        const blogRoot = siblings.parent
            ? { name: String(siblings.parent.name ?? "").trim(), slug: readMenuNodeSlug(siblings.parent, normalizedLocale) }
            : ownCategories.length > 0
                ? { name: String(menu.name ?? "").trim(), slug }
                : null;

        const gridCurrentPage = Math.max(1, Number(pageData?.meta?.page ?? requestedPage));
        const gridLastPage = Math.max(1, Number(pageData?.meta?.last_page ?? 1));

        const buildGridPageHref = (page: number) => {
            const next = new URLSearchParams();
            for (const [key, value] of Object.entries(resolvedSearchParams)) {
                if (key === "page" || value == null) continue;
                if (Array.isArray(value)) {
                    for (const entry of value) {
                        const trimmed = String(entry ?? "").trim();
                        if (trimmed) next.append(key, trimmed);
                    }
                } else {
                    const trimmed = String(value).trim();
                    if (trimmed) next.set(key, trimmed);
                }
            }
            if (page > 1) next.set("page", String(page));
            const query = next.toString();
            return query ? `/${normalizedLocale}/${slug}?${query}` : `/${normalizedLocale}/${slug}`;
        };

        return (
            <SitePageShell chrome={chrome} includeLogoutToast>
                <LocalizedLinks value={localizedLinks} />
                {/* The breadcrumb stays outside the Roboto wrapper below, which
                    would otherwise shrink its type the way no other page does. */}
                <Breadcrumb
                    items={[
                        { label: t.common.home, href: `/${normalizedLocale}` },
                        ...(blogRoot?.slug && blogRoot.name && blogRoot.slug !== slug
                            ? [{ label: blogRoot.name, href: `/${normalizedLocale}/${blogRoot.slug}` }]
                            : []),
                        { label: menu.name, isCurrent: true },
                    ]}
                    className="mx-auto w-full max-w-[1280px] px-1 lg:px-2"
                    showTitle
                    pageTitle={menu.title || menu.name}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <div className={`${roboto.className} w-full text-[14px] leading-[1.42857143]`}>
                <section className="mx-auto w-full max-w-[1280px] px-1 pt-6 lg:px-2">
                    <div className="-mx-[10px] flex flex-wrap">
                        <div className="w-full px-[10px]">
                            {blogCategories.length > 0 ? (
                                <div className="-mx-[10px] mb-[25px] flex flex-wrap">
                                    {blogCategories.map((category) => (
                                        <div
                                            key={category.id ?? category.slug}
                                            className="mb-[20px] w-1/2 px-[10px] min-[768px]:w-1/3 min-[992px]:w-1/4 min-[1200px]:w-1/6"
                                        >
                                            <Link
                                                href={`/${normalizedLocale}/${category.slug}`}
                                                aria-current={category.slug === slug ? "page" : undefined}
                                                title={category.name}
                                                className="flex h-full w-full flex-wrap items-start justify-center rounded-[20px] border border-black/[0.06] bg-white bg-clip-padding p-[15px] text-center text-[13.3px] font-medium text-black transition-shadow duration-100 ease-linear min-[992px]:hover:shadow-[0_5px_15px_rgba(0,0,0,0.12)]"
                                            >
                                                {category.icon ? (
                                                    <RemoteImage
                                                        src={category.icon}
                                                        alt={category.name}
                                                        width={220}
                                                        height={220}
                                                        className="mx-auto block h-auto max-w-full rounded-t-[4px]"
                                                    />
                                                ) : null}
                                                <span className="w-full p-[15px]">{category.name}</span>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {gridItems.length > 0 ? (
                                <div className="-mx-[10px] mb-[10px] flex flex-wrap">
                                    {gridItems.map((item, index) => {
                                        const href = resolveGridItemHref(item);
                                        // The banner is a wide hero image; the main photo is the one
                                        // meant for thumbnails, so it wins when the item has both.
                                        const image = item.main_photo || item.banner || null;
                                        const postedOn = formatBlogDate(item.datetime1);

                                        return (
                                            <div
                                                key={item.id ?? `${item.slug ?? "grid-item"}-${index}`}
                                                className="flex w-full px-[10px] min-[768px]:w-1/2"
                                            >
                                                <Link
                                                    href={href}
                                                    className="mb-[20px] flex w-full items-stretch overflow-hidden rounded-[20px] bg-white p-[15px] transition-shadow duration-100 ease-linear min-[992px]:hover:shadow-[0_5px_15px_rgba(0,0,0,0.12)]"
                                                >
                                                    {/* The square thumb sets the card's minimum height, so cards
                                                        with short titles stay as tall as the rest. */}
                                                    <div className="aspect-square w-2/5 shrink-0">
                                                        {image ? (
                                                            <RemoteImage
                                                                src={image}
                                                                alt={item.name || menu.name}
                                                                width={320}
                                                                height={320}
                                                                className="h-full w-full rounded-t-[4px] object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center rounded-t-[4px] bg-[#f5f7fb] text-[13px] text-[#8a96a8]">
                                                                TVIM
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-3/5 p-[15px]">
                                                        {/* Always rendered so an item without a date does not end
                                                            up shorter than the others. */}
                                                        <div className="mb-[10px] flex min-h-[17px] items-center text-[#888]">
                                                            {postedOn ? (
                                                                <span className="mr-[15px] flex items-center gap-[5px] text-[12px]">
                                                                    <i className="far fa-clock" aria-hidden="true" />
                                                                    {postedOn}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        {/* No `block` here: it would override the display the line
                                                            clamp relies on and let long titles grow the card. */}
                                                        <span className="mb-[10px] line-clamp-4 text-[16px] leading-[23px] font-medium text-black">
                                                            {item.name || menu.name}
                                                        </span>
                                                    </div>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-[4px] bg-[#f7f7f7] p-[20px] text-[15px] text-[#888]">
                                    Bu bölmədə hələ kontent yoxdur.
                                </div>
                            )}

                        </div>
                    </div>
                </section>
                </div>

                {/* Outside the Roboto wrapper as well, so the page numbers are
                    set in the same face as every other paginated page. */}
                <div className="mx-auto w-full max-w-[1280px] px-1 pb-10 lg:px-2 lg:pb-12">
                    <Pagination
                        currentPage={gridCurrentPage}
                        lastPage={gridLastPage}
                        buildHref={buildGridPageHref}
                    />
                </div>

                {includedItemsSection}
                {footerSpacer}
            </SitePageShell>
        );
    }

    if (menu.view_type === "contact") {
        const contactCopy = getTranslations(normalizedLocale).common;
const whatsappPhone = projectSettings?.general.phones.find((phone) => phone.is_whatsapp);
const azPhone = projectSettings?.general.phones.find((phone) =>
    phone.number.replace(/\s/g, "").startsWith("+994")
);
const firstPhone =
    whatsappPhone?.number ??
    azPhone?.number ??
    projectSettings?.general.phones[0]?.number ??
    "+994 (50) 828-08-88";
        const email = projectSettings?.general.email || "Info@tvim.az";
        const address = projectSettings?.general.address || "Bakı, Süleyman Sani Axundov 225b";

        return (
            <SitePageShell chrome={chrome} includeLogoutToast>
                <LocalizedLinks value={localizedLinks} />
                <Breadcrumb
                    items={[
                        { label: t.common.home, href: `/${normalizedLocale}` },
                        { label: menu.name, isCurrent: true },
                    ]}
                    className="mx-auto w-full max-w-[1280px] px-1 lg:px-2"
                    showTitle
                    pageTitle={menu.title || menu.name}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <section className="mx-auto w-full max-w-[1280px] px-1 pt-6 pb-10 lg:px-2 lg:pt-7 lg:pb-12">
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                                <i className="fas fa-phone-alt text-[14px] transform scale-x-[-1]" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#8496ab]">
                                    {contactCopy.callUs}
                                </span>
                                <a className="text-[18px] lg:text-[22px] font-semibold text-black hover:underline" href={`tel:${firstPhone.replace(/[^\d+]/g, "")}`}>
                                    {firstPhone}
                                </a>
                            </div>
                        </article>

                        <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                                <i className="fas fa-envelope text-[14px]" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#8496ab]">
                                    {contactCopy.email}
                                </span>
                                <a className="text-[18px] lg:text-[22px] font-semibold text-black hover:underline" href={`mailto:${email}`}>
                                    {email}
                                </a>
                            </div>
                        </article>

                        <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                                <i className="fas fa-map-marker-alt text-[14px]" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#8496ab]">
                                    {contactCopy.address}
                                </span>
                                <span className="text-[18px] lg:text-[22px] font-semibold text-black leading-tight">
                                    {address}
                                </span>
                            </div>
                        </article>
                    </div>

                    <div className="mt-8 lg:mt-12">
                        <div className="h-[300px] w-full overflow-hidden rounded-[20px] lg:h-[400px]">
                        <iframe
        src={resolveMapEmbedUrl(projectSettings?.general.map_iframe)}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps"
      />
                        </div>
                    </div>


                </section>

                {includedItems.length > 0 && (
                    <div className="mt-8 w-full lg:mt-10">
                        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-1 lg:gap-10 lg:px-2">
                            {includedItems.map((inc: any, idx: number) => {
                                if (inc.included_type === "menu" && inc.type === "form") {
                                    const submitConfig = resolveRequestFormSubmitConfig(inc?.data?.submit ?? inc?.data ?? inc);
                                    const fields = inc.data?.fields ?? inc.data?.data?.fields;
                        const formHeading = String(inc?.menu?.title ?? inc?.menu?.name ?? "").trim();
                        const formSubheading = htmlToText(inc?.menu?.description ?? inc?.data?.description ?? "");

                                    return (
                                        <div key={idx}>
                                            <RequestForm submitConfig={submitConfig} fields={fields} heading={formHeading} subheading={formSubheading} />
                                        </div>
                                    );
                                }

                                if (inc.included_type === "brand" && inc.data?.values) {
                                    const companies = mapIncludedValuesToCompanies(inc.data.values);
                                    if (companies.length === 0) return null;
                                    return (
                                        <div key={idx}>
                                            <BrandListSlider companies={companies} />
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>
                )}

                {keywordsSection}
                {footerSpacer}
            </SitePageShell>
        );
    }

    // Default view type (fallback for content and others)
    return (
        <SitePageShell chrome={chrome} includeLogoutToast>
                <LocalizedLinks value={localizedLinks} />
            <Breadcrumb
                items={[
                    { label: t.common.home, href: `/${normalizedLocale}` },
                    { label: menu.name, isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] px-1 lg:px-2"
                showTitle
                pageTitle={menu.title || menu.name}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            {keywordsArr.length > 0 && (
                null
            )}

            {!hasSelfIncludedItem && pageContentSection}

            {renderIncludedItems(pageContentBody)}

            {keywordsSection}
            {footerSpacer}
        </SitePageShell>
    );
}
