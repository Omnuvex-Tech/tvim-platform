import type { Metadata } from "next";
import { Breadcrumb } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { buildSeoMetadata } from "@/lib/seo";
import { normalizeLocale } from "@/lib/site-locales";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { PendingLink, PendingNavProvider, PendingOverlay } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";
import { ProductStrip } from "@/app/components/ProductStrip/product-strip";
import { getSiteChromeData } from "@/lib/site-chrome";

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

type BrandSlugPageSearchParams = {
    page?: string | string[];
    per_page?: string | string[];
    sort?: string | string[];
};

type RenderBrandSlugPageProps = {
    slug: string;
    locale: string;
    searchParams?: Promise<BrandSlugPageSearchParams>;
};

const buildBrandBasePath = (locale: string, slug: string) =>
    `${locale}/brands/${String(slug ?? "").trim().replace(/^\/+|\/+$/g, "")}`;

const hasListingQuery = (searchParams: BrandSlugPageSearchParams | undefined) => {
    const page = parsePageNumber(searchParams?.page);
    const perPage = String(Array.isArray(searchParams?.per_page) ? searchParams?.per_page[0] : searchParams?.per_page ?? "")
        .trim();
    const sort = String(Array.isArray(searchParams?.sort) ? searchParams?.sort[0] : searchParams?.sort ?? "").trim();

    return {
        page,
        hasCustomPage: page > 1,
        hasRefinement: Boolean(perPage || sort),
    };
};

export async function generateBrandSlugMetadata({
    slug,
    locale: incomingLocale,
    searchParams,
}: RenderBrandSlugPageProps): Promise<Metadata> {
    const locale = normalizeLocale(incomingLocale || config.project.defLang);
    const resolvedSearchParams = searchParams ? await searchParams : undefined;

    const brandLookupResponse = await api.get<LiveSearchResponseData>("/product/live-search", {
        params: { q: String(slug ?? "").trim() || normalizeSlugText(slug) },
        locale,
        cache: "force-cache",
    });

    const brandItems = Array.isArray(brandLookupResponse.data?.brands?.items)
        ? brandLookupResponse.data?.brands?.items
        : [];
    const desiredSlug = slugify(slug);
    const matchedBrand = brandItems.find((item) => slugify(String(item?.slug ?? "")) === desiredSlug)
        ?? brandItems.find((item) => slugify(String(item?.name ?? "")) === desiredSlug)
        ?? brandItems[0];

    const pageName = String(matchedBrand?.name ?? normalizeSlugText(slug) ?? slug).trim() || "Brand";
    const seoState = hasListingQuery(resolvedSearchParams);
    const canonicalPath = buildBrandBasePath(locale, slug);

    return buildSeoMetadata({
        title: `${pageName} | TVIM`,
        description: `${pageName} brandina aid mehsullar ve teklifleri TVIM daxilinde kesf edin.`,
        keywords: [pageName, "brand", "brands", "tvim"],
        locale,
        canonicalPath,
        siteUrl: config.project.url,
        locales: [locale],
        defaultLocale: locale,
        robots: seoState.hasCustomPage || seoState.hasRefinement
            ? {
                index: false,
                follow: true,
            }
            : {
                index: true,
                follow: true,
            },
    });
}

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

export async function renderBrandSlugPage({
    slug,
    locale: incomingLocale,
    searchParams,
}: RenderBrandSlugPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const currentUiParams = new URLSearchParams();
    if (resolvedSearchParams) {
        for (const [key, value] of Object.entries(resolvedSearchParams)) {
            const v = Array.isArray(value) ? value[0] : value;
            if (typeof v === "string" && v.trim()) currentUiParams.set(key, v);
        }
    }

    const requestedPage = parsePageNumber(resolvedSearchParams?.page);
    const locale = normalizeLocale(incomingLocale || config.project.defLang);

    const [
        brandLookupResponse,
        chrome,
    ] = await Promise.all([
        api.get<LiveSearchResponseData>("/product/live-search", {
            params: { q: String(slug ?? "").trim() || normalizeSlugText(slug) },
            locale,
            cache: "force-cache",
        }),
        getSiteChromeData(locale),
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
        cache: "force-cache",
    });

    const detailData = productListResponse.success && productListResponse.data ? productListResponse.data : null;
    const fallbackPageName = normalizeSlugText(slug) || slug;
    const pageName = String(matchedBrand?.name ?? detailData?.menu?.name ?? fallbackPageName).trim() || fallbackPageName;
    const breadcrumbItems = [
        { label: locale === "en" ? "Home" : "Ana s\u0259hif\u0259", href: `/${locale}` },
        { label: locale === "ru" ? "Бренды" : locale === "en" ? "Brands" : "Brendlər", href: `/${locale}/product/brands` },
        { label: pageName, isCurrent: true as const },
    ];

    const listItems = Array.isArray(detailData?.items) ? detailData.items : [];
    const pagination = detailData?.pagination;
    const lastPage = Math.max(1, Number(pagination?.last_page ?? 1));
    const currentPage = Math.max(1, Math.min(Number(pagination?.current_page ?? requestedPage), lastPage));
    const paginationTokens = buildPaginationTokens(currentPage, lastPage);

    const buildHrefWithParams = (params: URLSearchParams) => {
        const qs = params.toString();
        const basePath = `/${locale}/brands/${slug}`;
        return qs ? `${basePath}?${qs}` : basePath;
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
    const sortedItems = (() => {
        if (listItems.length <= 1) return listItems;

        const readName = (item: any) => {
            const vName = typeof item?.variation?.name === "string" ? item.variation.name : "";
            const iName = typeof item?.name === "string" ? item.name : "";
            return String(vName || iName || "").trim();
        };

        const readPrice = (item: any) => {
            const candidate =
                item?.variation?.discount_price ??
                item?.variation?.price ??
                item?.discount_price ??
                item?.price ??
                item?.old_price;
            const parsed = typeof candidate === "number" ? candidate : Number(String(candidate ?? "").replace(",", "."));
            return Number.isFinite(parsed) ? parsed : null;
        };

        const readFlag = (item: any, key: "is_new" | "is_popular" | "most_sale") => {
            const raw = item?.[key] ?? item?.variation?.[key];
            if (raw === true || raw === 1 || raw === "1" || raw === "true") return 1;
            return 0;
        };

        const readId = (item: any) => {
            const raw = item?.variation_id ?? item?.product_id ?? item?.id ?? item?.variation?.id ?? item?.variation?.uuid ?? item?.uuid ?? 0;
            const parsed = typeof raw === "number" ? raw : Number(raw ?? 0);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        const localeForCompare = locale || "az";
        const dir = activeSort;
        const next = [...listItems];

        next.sort((a: any, b: any) => {
            if (dir === "price_asc" || dir === "price_desc") {
                const pa = readPrice(a);
                const pb = readPrice(b);
                const na = pa == null ? Number.POSITIVE_INFINITY : pa;
                const nb = pb == null ? Number.POSITIVE_INFINITY : pb;
                if (na !== nb) return dir === "price_asc" ? na - nb : nb - na;
                return readId(b) - readId(a);
            }

            if (dir === "name_asc" || dir === "name_desc") {
                const na = readName(a).toLowerCase();
                const nb = readName(b).toLowerCase();
                const cmp = na.localeCompare(nb, localeForCompare);
                if (cmp !== 0) return dir === "name_asc" ? cmp : -cmp;
                return readId(b) - readId(a);
            }

            if (dir === "popular") {
                const fa = readFlag(a, "is_popular");
                const fb = readFlag(b, "is_popular");
                if (fa !== fb) return fb - fa;
                return readId(b) - readId(a);
            }

            if (dir === "most_sale") {
                const fa = readFlag(a, "most_sale");
                const fb = readFlag(b, "most_sale");
                if (fa !== fb) return fb - fa;
                return readId(b) - readId(a);
            }

            if (dir === "newest") {
                const fa = readFlag(a, "is_new");
                const fb = readFlag(b, "is_new");
                if (fa !== fb) return fb - fa;
                return readId(b) - readId(a);
            }

            return 0;
        });

        return next;
    })();

    return (
        <SitePageShell chrome={chrome}>
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

                    <div className="relative z-30 mb-4 flex min-h-[64px] flex-nowrap items-center gap-3 overflow-x-auto rounded-[16px] border border-[#eee] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                                    className={`inline-flex shrink-0 items-center justify-center rounded-[9px] px-4 py-2 text-center text-[14px] transition-colors ${
                                        isActive
                                            ? "bg-[#0f57d6] font-semibold text-white"
                                            : "bg-[#f7f8fa] font-medium text-[#4b5565] hover:bg-[#eef1f5]"
                                    }`}
                                >
                                    {opt?.label ?? key}
                                </PendingLink>
                            );
                        })}

                    </div>

                    <div className="relative min-h-[360px]">
                        {sortedItems.length > 0 ? (
                            <ProductStrip
                                items={sortedItems}
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

        </SitePageShell>
    );
}
