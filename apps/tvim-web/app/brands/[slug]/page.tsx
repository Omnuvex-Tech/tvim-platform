import { cookies } from "next/headers";
import type {
    FooterMenusData,
    HeaderCategoriesResponseData,
    HeaderMenuResponseData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
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
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";
import { ProductStrip } from "@/app/components/ProductStrip/product-strip";
import { PendingLink, PendingNavProvider, PendingOverlay } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";

type ProductListApiResponse = {
    menu?: {
        id?: number;
        name?: string;
        meta_title?: string | null;
    };
    items?: Array<{
        product_id?: number;
        variation_id?: number;
        uuid?: string;
        variation?: {
            id?: number;
            uuid?: string;
            name?: string;
            slug?: string;
            price?: number;
            old_price?: number | null;
            discount_price?: number | null;
            main_image?: string | null;
        };
        name?: string;
        slug?: string;
        price?: number;
        old_price?: number | null;
        main_image?: string | null;
    }>;
    sort_options?: Array<{ key?: string; label?: string }>;
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

type LiveSearchBrandItem = {
    id?: number | string;
    filter_id?: number | string;
    name?: string;
    slug?: string;
    link?: string;
    image?: string;
};

type LiveSearchResponseData = {
    brands?: {
        name?: string;
        items?: LiveSearchBrandItem[];
    };
    categories?: unknown;
    products?: unknown;
};

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
};

const normalizeSlugText = (value: string) => {
    const decoded = decodeURIComponent(String(value ?? "")).trim();
    return decoded.replace(/[-_]+/g, " ").trim();
};

const slugify = (value: string) => String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\?.*$/, "")
    .replace(/#.*$/, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const parsePageNumber = (value: string | string[] | undefined) => {
    const raw = Array.isArray(value) ? value[0] : value;
    const numeric = Number(raw ?? 1);
    if (!Number.isFinite(numeric) || numeric < 1) return 1;
    return Math.floor(numeric);
};

const buildPaginationTokens = (currentPage: number, lastPage: number) => {
    if (lastPage <= 1) return [1] as Array<number | "ellipsis">;
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1) as Array<number | "ellipsis">;
    }

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

    if (start > 2) {
        tokens.push("ellipsis");
    }

    for (let page = start; page <= end; page += 1) {
        if (page > 1 && page < lastPage) {
            tokens.push(page);
        }
    }

    if (end < lastPage - 1) {
        tokens.push("ellipsis");
    }

    tokens.push(lastPage);
    return tokens;
};

export default async function BrandSlugPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ page?: string | string[]; per_page?: string | string[]; sort?: string | string[] }>;
}) {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const currentUiParams = new URLSearchParams();
    if (resolvedSearchParams) {
        for (const [key, value] of Object.entries(resolvedSearchParams)) {
            const v = Array.isArray(value) ? value[0] : value;
            if (typeof v === "string" && v.trim()) currentUiParams.set(key, v);
        }
    }

    const requestedPage = parsePageNumber(resolvedSearchParams?.page);
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value ?? "";
    const locale = normalizeLocale(cookieLocale || config.project.defLang);

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    const [
        brandLookupResponse,
        headerMenuResponse,
        footerMenuResponse,
        settingsResponse,
        categoriesResponse,
    ] = await Promise.all([
        api.get<LiveSearchResponseData>("/product/live-search", {
            params: { q: String(slug ?? "").trim() || normalizeSlugText(slug) },
            locale,
            cache: "no-store",
        }),
        api.get<HeaderMenuResponseData>(config.endpoints.menus.list, {
            params: { in_header: "1" },
            locale,
        }),
        api.get<FooterMenusData>(config.endpoints.menus.list, {
            params: { in_footer: "1" },
            locale,
        }),
        api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            locale,
        }),
        api.get<HeaderCategoriesResponseData>("/product/categories", {
            params: { in_header: "1" },
            locale,
        }),
    ]);

    const brandLookupPayload = brandLookupResponse.success && brandLookupResponse.data ? brandLookupResponse.data : null;
    const brandItems = Array.isArray(brandLookupPayload?.brands?.items) ? brandLookupPayload.brands.items : [];
    const desiredSlug = slugify(slug);
    const matchedBrand = brandItems.find((item) => slugify(String(item?.slug ?? "")) === desiredSlug)
        ?? brandItems.find((item) => slugify(String(item?.name ?? "")) === desiredSlug)
        ?? brandItems[0];

    const brandFilterId = Number(matchedBrand?.filter_id);
    const brandValueId = Number(matchedBrand?.id);
    const hasBrandFilter = Number.isFinite(brandFilterId) && brandFilterId > 0 && Number.isFinite(brandValueId) && brandValueId > 0;

    const perPageRaw = Number(currentUiParams.get("per_page") ?? "20");
    const perPage = Number.isFinite(perPageRaw) ? Math.min(60, Math.max(1, perPageRaw)) : 20;
    const sort = String(currentUiParams.get("sort") ?? "").trim();

    const productListResponse = await api.get<ProductListApiResponse>(config.endpoints.products.paginatedList, {
        params: {
            page: String(requestedPage),
            per_page: String(perPage),
            ...(sort ? { sort } : null),
            ...(hasBrandFilter ? { [`filters[${brandFilterId}][]`]: String(brandValueId) } : { q: String(slug ?? "").trim() }),
        },
        locale,
        cache: "no-store",
    });

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
    const headerItems = extractHeaderItems(rawHeaderData);
    const headerTopLevel = headerItems.filter(isTopLevelHeaderItem);

    const headerMenuItems = headerTopLevel
        .filter((item) => !isCategoriesMenuType(item))
        .map((item) => ({
            label: resolveHeaderMenuLabel(item),
            href: resolveHeaderMenuHref(item, locale),
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

    const footerMenus = footerMenuResponse.success && footerMenuResponse.data
        ? footerMenuResponse.data.footer
        : [];

    let projectSettings: ProjectSettingsData | undefined;
    if (settingsResponse.success && settingsResponse.data) {
        projectSettings = settingsResponse.data.data;
    }

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

    const detailData = productListResponse.success && productListResponse.data ? productListResponse.data : null;
    const fallbackPageName = normalizeSlugText(slug) || slug;
    const pageName = String(matchedBrand?.name ?? detailData?.menu?.name ?? fallbackPageName).trim() || fallbackPageName;
    const breadcrumbItems = [
        { label: locale === "en" ? "Home" : "Ana səhifə", href: `/${locale}` },
        { label: "Brend" },
        { label: pageName, isCurrent: true as const },
    ];

    const listItems = Array.isArray(detailData?.items) ? detailData.items : [];
    const pagination = detailData?.pagination;
    const lastPage = Math.max(1, Number(pagination?.last_page ?? 1));
    const currentPage = Math.max(1, Math.min(Number(pagination?.current_page ?? requestedPage), lastPage));
    const paginationTokens = buildPaginationTokens(currentPage, lastPage);

    const buildHrefWithParams = (params: URLSearchParams) => {
        const qs = params.toString();
        return qs ? `/brands/${slug}?${qs}` : `/brands/${slug}`;
    };

    const sortOptions = Array.isArray(detailData?.sort_options) ? detailData.sort_options : [];
    const sortOptionsFallback = [
        { key: "newest", label: "Yenilər: üstdə" },
        { key: "name_asc", label: "Ad (A-Z)" },
        { key: "name_desc", label: "Ad (Z-A)" },
        { key: "price_asc", label: "Qiymət (artan)" },
        { key: "price_desc", label: "Qiymət (azalan)" },
        { key: "popular", label: "Reytinq" },
        { key: "most_sale", label: "Model" },
    ];
    const effectiveSortOptions = sortOptions.length > 0 ? sortOptions : sortOptionsFallback;
    const activeSort = String(sort || "newest").trim() || "newest";
    const perPageOptions = [20, 40, 60];

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
                items={breadcrumbItems}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle
                pageTitle={pageName}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            <section className="mx-auto w-full max-w-[1280px] !px-1 pt-6 pb-10 lg:!px-2 lg:pb-12">
                <PendingNavProvider>
                    <PendingOverlay className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20" />

                    <div className="relative z-30 mb-4 flex min-h-[64px] flex-wrap items-center gap-3 rounded-[16px] border border-[#eee] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                        {effectiveSortOptions.map((opt) => {
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
                                    {opt?.label ?? key}
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

                    <div className="relative min-h-[360px]">
                        {listItems.length > 0 ? (
                            <ProductStrip
                                items={listItems}
                                variant="selected"
                                layout="grid"
                                showHeader={false}
                                gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5"
                            />
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
                                                        <span
                                                            key={`ellipsis-${idx}`}
                                                            className="inline-flex h-9 w-9 items-center justify-center text-[16px] text-[#8b97a9] sm:h-10 sm:w-10"
                                                        >
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
                </PendingNavProvider>
            </section>


            <LogoutToast />

            <div className="mt-16 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
            </div>
        </div>
    );
}
