import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type {
    FooterMenusData,
    HeaderCategoriesResponseData,
    HeaderMenuResponseData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb, type Company } from "@repo/ui";
import BrandListSlider from "@/app/components/BrandListSlider/brand-list-slider";
import { config } from "@/config";
import { api } from "@/lib/api";
import {
    extractHeaderCategories,
    extractHeaderItems,
    isCategoriesMenuType,
    isHeaderEnabledItem,
    isTopLevelHeaderItem,
    resolveHeaderMenuHref,
    resolveHeaderMenuLabel,
} from "@/lib/header-navigation";
import { Footer } from "@/app/components/Footer/footer";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { ProductStrip } from "@/app/components/ProductStrip/product-strip";
import { DrawerScrollLock, FiltersDebugLogger, PendingLink, PendingNavProvider, PendingOverlay } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";

type MenuDetailData = {
    type: string;
    menu: {
        id: number;
        uuid: string;
        type: string;
        view_type: string;
        name: string;
        title: string | null;
        description: string | null;
        link: string;
        multi_links: Record<string, string>;
        seo: any;
        meta_keywords?: any;
    };
    data: {
        mode?: string;
        submit?: {
            method: string;
            path: string;
            route: string;
        };
        fields?: any[];
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

async function getMenuDetail(slug: string, locale: string) {
    try {
        const response = await api.get<MenuDetailData>(config.endpoints.menus.detail(slug), {
            locale,
        });
        if (response.success && response.data) {
            return response.data;
        }
        return null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, locale } = await params;
    const detail = await getMenuDetail(slug, locale);

    if (!detail) return {};

    const { seo } = detail.menu;

    // Keywords may come from multiple places depending on CMS shape.
    // Support: seo.meta_keywords, detail.data.meta_keywords, detail.data.meta?.meta_keywords
    let rawKeywords: any = seo?.meta_keywords ?? detail.data?.meta_keywords ?? detail.data?.meta?.meta_keywords ?? detail.menu?.meta_keywords;
    if (rawKeywords && typeof rawKeywords === "string") {
        rawKeywords = rawKeywords.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    return {
        title: seo?.meta_title || detail.menu.name,
        description: seo?.meta_description,
        keywords: rawKeywords,
        alternates: {
            canonical: seo?.canonical,
            languages: seo?.alternates?.reduce((acc: any, alt: any) => {
                acc[alt.locale] = alt.url;
                return acc;
            }, {}),
        },
        openGraph: seo?.open_graph ? {
            title: seo.open_graph.title,
            description: seo.open_graph.description,
            url: seo.open_graph.url,
            siteName: seo.open_graph.site_name,
            images: [
                {
                    url: seo.open_graph.image,
                    width: seo.open_graph.image_width,
                    height: seo.open_graph.image_height,
                    alt: seo.open_graph.image_alt,
                },
            ],
            locale: seo.open_graph.locale,
            type: "website",
        } : undefined,
    };
}

export default async function DynamicMenuPage({ params, searchParams }: Props) {
    const { locale, slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const normalizedLocale = locale.toLowerCase();

    const [
        menuDetail,
        langResponse,
        headerMenuResponse,
        footerMenuResponse,
        settingsResponse,
        categoriesResponse,
    ] = await Promise.all([
        getMenuDetail(slug, normalizedLocale),
        api.get<{ data: Language[] }>(config.endpoints.languages.list),
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

    if (!menuDetail) {
        notFound();
    }

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
    const headerItems = extractHeaderItems(rawHeaderData);
    const headerTopLevel = headerItems.filter(isTopLevelHeaderItem);

    const headerMenuItems = headerTopLevel
        .filter((item) => !isCategoriesMenuType(item))
        .map((item) => ({
            label: resolveHeaderMenuLabel(item),
            href: resolveHeaderMenuHref(item, normalizedLocale),
        }))
        .filter((item) => item.label);

    let headerCategoryItems: any[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const items = extractHeaderCategories(categoriesResponse.data);
        const filtered = items.filter(isHeaderEnabledItem);
        headerCategoryItems = filtered.length > 0 ? filtered : items;
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

    const languages = langResponse.success && langResponse.data ? langResponse.data.data : [];

    const { menu, data: pageData } = menuDetail;

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

    const isContentView = menu.view_type === "content" || menu.type === "content";

    const includedItems: any[] = menuDetail.included_items || [];
    const gridItems = Array.isArray(pageData?.items) ? pageData.items : [];
    const isGridView = menu.type === "grids" || (pageData?.mode === "list" && gridItems.length > 0);

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
                        : `/brands/news/${String(v.slug)}`)
                    : (v?.url ?? v?.link ?? v?.website ?? "").toString().trim() || undefined,
            }))
            .filter((c) => Boolean(c.name));
    }

    function stripHtml(input?: string | null) {
        if (!input) return "";
        return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

    const includedItemsSection = includedItems.length > 0 ? (
        <div className="mt-4 w-full">
            <div className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2">
                {includedItems.map((inc: any, idx: number) => {
                    if (inc.included_type === "menu" && inc.type === "form") {
                        return (
                            <div key={idx} className="mt-4 lg:mt-6">
                                <RequestForm submitConfig={inc.data.submit} fields={inc.data?.fields ?? inc.data?.data?.fields} />
                            </div>
                        );
                    }

                    if (inc.included_type === "brand" && inc.data?.values) {
                        const companies = mapIncludedValuesToCompanies(inc.data.values);
                        if (companies.length === 0) return null;
                        return (
                            <div key={idx} className="mt-4 lg:mt-6">
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
                            <section key={idx} className="mt-6 lg:mt-8">
                                <h2 className="mb-4 text-[24px] font-semibold text-[#111827] lg:mb-5 lg:text-[30px]">
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

    const isCategoriesView = (() => {
        const t = String(menu.type ?? "").trim().toLowerCase();
        const vt = String(menu.view_type ?? "").trim().toLowerCase();
        return t === "categories" || vt === "categories" || vt === "catalog" || vt === "product-list";
    })();

    if (isCategoriesView) {
        const cookieStore = await cookies();
        const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);

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
            if (key === "sort") return true;
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

        const headers: Record<string, string> = {
            Accept: "application/json",
            "Content-Language": normalizedLocale,
        };

        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        }

        let productListPayload: ProductListApiResponse | null = null;
        try {
            const response = await fetch(listUrl.toString(), {
                method: "GET",
                cache: "no-store",
                headers,
            });
            const json = (await response.json()) as unknown;
            if (json && typeof json === "object") {
                productListPayload = json as ProductListApiResponse;
            } else {
                productListPayload = null;
            }
        } catch {
            productListPayload = null;
        }

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

        const sortOptions = Array.isArray(productList?.sort_options) ? productList!.sort_options! : [];
        const activeSort = String(productList?.applied?.sort ?? currentUiParams.get("sort") ?? "").trim() || "newest";

        const currentPage = Math.max(1, Number(productList?.pagination?.current_page ?? parsePageNumber(resolvedSearchParams.page)));
        const lastPage = Math.max(1, Number(productList?.pagination?.last_page ?? 1));
        const paginationTokens = buildPaginationTokens(currentPage, lastPage);

        const hasFilters = Array.isArray(productList?.filters) && productList.filters.length > 0;
        const drawerId = `filters-drawer-${String(slug).replace(/[^a-z0-9_-]/gi, "-")}`;

        const filtersBody = (
            <>
                {hasFilters ? (
                    <>
                        {productList!.filters!.map((filter) => {
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
                                                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                                                    selected ? "border-[#0f57d6] bg-[#0f57d6]" : "border-[#cfd7e3] bg-white"
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
                                        {String(filter?.name ?? "").trim() || "Filter"}
                                    </div>
                                    <div className="space-y-1">
                                        {visible.map(renderRow)}
                                    </div>
                                    {rest.length > 0 ? (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer select-none px-3 py-2 text-[14px] font-medium text-[#0f57d6] hover:underline">
                                                Əlavə {rest.length} ədəd göstər
                                            </summary>
                                            <div className="mt-1 space-y-1">
                                                {rest.map(renderRow)}
                                            </div>
                                        </details>
                                    ) : null}
                                </div>
                            );
                        })}
                    </>
                ) : null}

                {productListPayload && productListPayload.success === false ? (
                    <div className="rounded-[16px] border border-[#eee] bg-white p-5 text-[15px] text-[#4b5565] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                        {productListPayload.message || "Məhsullar yüklənmədi."}
                    </div>
                ) : null}
            </>
        );

        return (
            <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
                <NavbarWrapper
                    logo={navbarLogo}
                    phone={navbarPhone}
                    locale={normalizedLocale}
                    languages={languages}
                    menuItems={headerMenuItems}
                    initialCatalogItems={headerCategoryItems}
                />

                <Breadcrumb
                    items={[
                        { label: normalizedLocale === "en" ? "Home" : "Ana səhifə", href: `/${normalizedLocale}` },
                        { label: menu.name, isCurrent: true },
                    ]}
                    className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                    showTitle
                    pageTitle={menu.title || menu.name}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <section className="mx-auto w-full max-w-[1280px] !px-1 pt-6 pb-10 lg:!px-2 lg:pb-12">
                    <PendingNavProvider>
                        <input id={drawerId} type="checkbox" className="peer hidden" />
                        <DrawerScrollLock checkboxId={drawerId} />
                        <FiltersDebugLogger filters={productList?.filters} />
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
                            <aside className="hidden space-y-5 self-start lg:block lg:sticky lg:top-6">
                                {filtersBody}
                            </aside>

                            <div>
                                {hasFilters ? (
                                    <label
                                        htmlFor={drawerId}
                                        className="mb-4 flex w-full items-center justify-between rounded-full bg-[#ffd500] px-5 py-3 text-[15px] font-semibold text-[#111318] lg:hidden"
                                    >
                                        <span>Filtr</span>
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
                                                        {sub?.name ?? sub?.title ?? "Alt kateqoriya"}
                                                    </PendingLink>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}

                            {(() => {
                                const perPageRaw = Number(currentUiParams.get("per_page") ?? productList?.pagination?.per_page ?? 20);
                                const perPage = Number.isFinite(perPageRaw) ? Math.min(60, Math.max(1, perPageRaw)) : 20;
                                const perPageOptions = [20, 40, 60];

                                const labelByKey: Record<string, string> = {
                                    newest: "Yenilər: üstdə",
                                    name_asc: "Ad (A-Z)",
                                    name_desc: "Ad (Z-A)",
                                    price_asc: "Qiymət (artan)",
                                    price_desc: "Qiymət (azalan)",
                                    popular: "Reytinq",
                                    most_sale: "Model",
                                };

                                return (
                                    <div className="relative z-30 mb-4 flex min-h-[64px] flex-wrap items-center gap-3 rounded-[16px] border border-[#eee] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                                        {sortOptions.map((opt) => {
                                            const key = String(opt?.key ?? "").trim();
                                            if (!key) return null;
                                            const next = new URLSearchParams(currentUiParams.toString());
                                            next.set("page", "1");
                                            next.set("sort", key);
                                            const isActive = key === activeSort;
                                            return (
                                                <PendingLink
                                                    key={key}
                                                    href={buildHrefWithParams(next)}
                                                    className={`rounded-[9px] px-4 py-2 text-[14px] transition-colors ${
                                                        isActive
                                                            ? "bg-[#0f57d6] font-semibold text-white"
                                                            : "bg-[#f7f8fa] font-medium text-[#4b5565] hover:bg-[#eef1f5]"
                                                    }`}
                                                >
                                                    {labelByKey[key] ?? opt?.label ?? key}
                                                </PendingLink>
                                            );
                                        })}

                                        <details className="relative ml-auto z-40">
                                            <summary className="list-none cursor-pointer rounded-[10px] bg-[#f7f8fa] px-4 py-2 text-[14px] font-medium text-[#111318]">
                                                {perPage}
                                                <span className="ml-2 inline-block text-[#6b7280]">▾</span>
                                            </summary>
                                            <div className="absolute right-0 z-50 mt-2 w-[120px] overflow-hidden rounded-[16px] border border-[#eee] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                                                {perPageOptions.map((opt) => {
                                                    const next = new URLSearchParams(currentUiParams.toString());
                                                    next.set("page", "1");
                                                    next.set("per_page", String(opt));
                                                    const href = buildHrefWithParams(next);
                                                    return (
                                                        <PendingLink
                                                            key={opt}
                                                            href={href}
                                                            className={`block px-4 py-2 text-[14px] ${
                                                                opt === perPage ? "bg-[#e7efff] text-[#0f57d6]" : "text-[#111318] hover:bg-[#f5f7fb]"
                                                            }`}
                                                        >
                                                            {opt}
                                                        </PendingLink>
                                                    );
                                                })}
                                            </div>
                                        </details>
                                    </div>
                                );
                            })()}

                            <div className="relative min-h-[360px]">
                                <PendingOverlay />

                                {listItems.length > 0 ? (
                                    <ProductStrip items={listItems} variant="selected" layout="grid" showHeader={false} />
                                ) : (
                                    <div className="rounded-[16px] border border-[#eee] bg-white p-5 text-[15px] text-[#4b5565] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                                        Məhsul tapılmadı.
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
                                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111318] transition-colors sm:h-10 sm:w-10 ${
                                                            currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"
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
                                                                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors sm:h-10 sm:w-10 sm:text-[14px] ${
                                                                    isActive
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
                                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111318] transition-colors sm:h-10 sm:w-10 ${
                                                            currentPage >= lastPage ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"
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
                        <>
                            <label
                                htmlFor={drawerId}
                                className="fixed inset-0 z-40 bg-black/30 opacity-0 pointer-events-none transition-opacity duration-300 ease-out peer-checked:opacity-100 peer-checked:pointer-events-auto lg:hidden"
                                aria-label="close-filters-overlay"
                            />
                            <div className="fixed inset-y-0 left-0 z-50 w-full -translate-x-full bg-white transition-transform duration-300 ease-out transform-gpu will-change-transform peer-checked:translate-x-0 lg:hidden">
                                <div className="flex h-full flex-col overflow-y-auto p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="text-[16px] font-bold text-[#111318]">Filtrlər</div>
                                        <label
                                            htmlFor={drawerId}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eee] bg-white text-[#111318]"
                                            aria-label="close-filters"
                                        >
                                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                                        </label>
                                    </div>
                                    <div className="space-y-5">
                                        {filtersBody}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                    </PendingNavProvider>
                </section>

                {includedItemsSection}

                <LogoutToast />

                <div className="mt-auto w-full pt-12 lg:pt-20">
                    <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
                </div>
            </div>
        );
    }

    if (isGridView) {
        return (
            <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
                <NavbarWrapper
                    logo={navbarLogo}
                    phone={navbarPhone}
                    locale={normalizedLocale}
                    languages={languages}
                    menuItems={headerMenuItems}
                    initialCatalogItems={headerCategoryItems}
                />

                <Breadcrumb
                    items={[
                        { label: normalizedLocale === "en" ? "Home" : "Ana səhifə", href: `/${normalizedLocale}` },
                        { label: menu.name, isCurrent: true },
                    ]}
                    className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                    showTitle
                    pageTitle={menu.title || menu.name}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <section className="mx-auto w-full max-w-[1280px] !px-1 pt-6 pb-10 lg:!px-2 lg:pt-7 lg:pb-12">
                    {gridItems.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {gridItems.map((item, index) => {
                                const href = resolveGridItemHref(item);
                                const image = item.banner || item.main_photo || null;
                                const summary = stripHtml(item.content).slice(0, 170);
                                return (
                                    <Link
                                        key={item.id ?? `${item.slug ?? "grid-item"}-${index}`}
                                        href={href}
                                        className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-[#edf1f6] bg-white shadow-[0_8px_24px_-18px_rgba(15,23,42,0.5)] transition hover:-translate-y-[2px] hover:shadow-[0_14px_30px_-18px_rgba(15,23,42,0.55)]"
                                    >
                                        <div className="h-[210px] w-full overflow-hidden bg-[#f5f7fb]">
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={item.name || menu.name}
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[14px] text-[#8a96a8]">
                                                    TVIM
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col p-4">
                                            <h3 className="line-clamp-2 text-[18px] leading-[1.3] font-semibold text-[#111827]">
                                                {item.name || menu.name}
                                            </h3>
                                            {item.datetime1 ? (
                                                <p className="mt-2 text-[13px] text-[#8a96a8]">{item.datetime1}</p>
                                            ) : null}
                                            {summary ? (
                                                <p className="mt-3 line-clamp-3 text-[14px] leading-[1.45] text-[#4b5563]">{summary}</p>
                                            ) : null}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-[12px] border border-dashed border-[#d9e0ea] bg-[#fafcff] px-4 py-10 text-center text-[15px] text-[#6b7280]">
                            Bu bölmədə hələ kontent yoxdur.
                        </div>
                    )}
                </section>

                {includedItemsSection}

                <LogoutToast />

                <div className="mt-auto w-full pt-12 lg:pt-20">
                    <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
                </div>
            </div>
        );
    }

    if (menu.view_type === "contact") {
        const firstPhone = projectSettings?.general.phones[0]?.number ?? "+994 (50) 828-08-88";
        const email = projectSettings?.general.email || "Info@tvim.az";
        const address = projectSettings?.general.address || "Bakı, Süleyman Sani Axundov 225b";

        return (
            <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
                <NavbarWrapper
                    logo={navbarLogo}
                    phone={navbarPhone}
                    locale={normalizedLocale}
                    languages={languages}
                    menuItems={headerMenuItems}
                    initialCatalogItems={headerCategoryItems}
                />

                <Breadcrumb
                items={[
                    { label: normalizedLocale === "en" ? "Home" : "Ana səhifə", href: `/${normalizedLocale}` },
                    { label: menu.name, isCurrent: true },
                ]}
                className="!max-w-[1280px] mx-auto w-full !px-1 lg:!px-2"
                showTitle
                pageTitle={menu.title || menu.name}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

                <section className="mx-auto w-full max-w-[1280px] pt-6 pb-10 lg:pt-7 lg:pb-12">
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                                <i className="fas fa-phone-alt text-[14px] transform scale-x-[-1]" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#8496ab]">
                                    {normalizedLocale === "en" ? "Call us" : "Bizə zəng edin"}
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
                                    Email
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
                                    {normalizedLocale === "en" ? "Address" : "Ünvan"}
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
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.1477464366063!2d49.82902267657685!3d40.42775615430342!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x403087f978e8741b%3A0x6a1a1b8e4e0d4e5c!2sS%C3%BCleyman%20Sani%20Axundov%2C%20Baku!5e0!3m2!1sen!2saz!4v1715600000000!5m2!1sen!2saz"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>

            
                </section>

                    {includedItems.length > 0 && (
                        <div className="mt-4 w-full">
                            <div className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2">
                                        {includedItems.map((inc: any, idx: number) => {
                                    if (inc.included_type === "menu" && inc.type === "form") {
                                        return (
                                            <div key={idx} className="mt-4 lg:mt-6">
                                                <RequestForm submitConfig={inc.data.submit} fields={inc.data?.fields ?? inc.data?.data?.fields} />
                                            </div>
                                        );
                                    }

                                    if (inc.included_type === "brand" && inc.data?.values) {
                                        const companies = mapIncludedValuesToCompanies(inc.data.values);
                                        if (companies.length === 0) return null;
                                        return (
                                            <div key={idx} className="mt-4 lg:mt-6">
                                                <BrandListSlider companies={companies} />
                                            </div>
                                        );
                                    }

                                    return null;
                                })}
                            </div>
                        </div>
                    )}

                    

                <LogoutToast />

                {keywordsArr.length > 0 && (
                    <div className="mx-auto mt-40 w-full max-w-[1280px]">
                        <div className="w-[calc(100%-56px)] border-t border-[#e5e9ef]" />
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
                )}

                <div className="mt-auto w-full pt-12 lg:pt-20">
                    <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
                </div>
            </div>
        );
    }

    // Default view type (fallback for content and others)
    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={normalizedLocale}
                languages={languages}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <Breadcrumb
                items={[
                    { label: normalizedLocale === "en" ? "Home" : "Ana səhifə", href: `/${normalizedLocale}` },
                    { label: menu.name, isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle
                pageTitle={menu.title || menu.name}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            {keywordsArr.length > 0 && (
                null
            )}

            <section className="mx-auto w-full max-w-[1280px] !px-1 pt-2 pb-10 lg:!px-2 lg:pt-3 lg:pb-12">
                <div className="prose max-w-none">
                    {menu.description && (
                        <div dangerouslySetInnerHTML={{ __html: menu.description }} />
                    )}
                </div>

                {pageData?.submit && (
                    <div className="mt-8 lg:mt-12">
                        <RequestForm submitConfig={pageData.submit} />
                    </div>
                )}
            </section>

            {includedItemsSection}

            

            <LogoutToast />

            {keywordsArr.length > 0 && (
                <div className="mx-auto mt-40 w-full max-w-[1280px]">
                    <div className="w-[calc(100%-56px)] border-t border-[#e5e9ef]" />
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
            )}

            <div className="mt-auto w-full pt-12 lg:pt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
            </div>
        </div>
    );
}
