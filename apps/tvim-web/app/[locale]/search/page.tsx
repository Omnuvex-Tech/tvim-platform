import Link from "next/link";
import { Breadcrumb } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { getTranslations } from "@/lib/i18n";
import { getSiteChromeData } from "@/lib/site-chrome";
import { PendingLink, PendingNavProvider, PendingOverlay } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { ProductGrid } from "@/app/components/ProductGrid/product-grid";

type LiveSearchEntry = {
    id?: number | string;
    product_id?: number | string;
    slug?: string;
    link?: string;
    name?: string;
    model?: string;
    sku?: string;
    discount_price?: number | string;
    price?: number | string;
    old_price?: number | string;
    image?: string;
};

type LiveSearchSectionPayload = {
    name?: string;
    items?: LiveSearchEntry[];
};

type LiveSearchPayload = {
    categories?: LiveSearchSectionPayload;
    products?: LiveSearchSectionPayload;
    brands?: LiveSearchSectionPayload;
};

type LiveSearchResponseData = {
    data?: LiveSearchPayload;
} & LiveSearchPayload;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const readSearchParamValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

type ProductListItem = Record<string, unknown>;

type ProductListData = {
    items?: ProductListItem[];
    applied?: {
        sort?: string | null;
    };
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

type ProductListApiPayload = {
    success?: boolean;
    message?: string;
    data?: ProductListData;
};

function toLocalizedHref(rawLink: unknown, localeCode: string) {
    if (typeof rawLink !== "string" || !rawLink.trim()) return "#";
    const link = rawLink.trim();
    if (/^https?:\/\//i.test(link)) return link;
    const normalizedLink = link.startsWith("/") ? link : `/${link}`;
    const firstSegment = normalizedLink.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
    if (firstSegment === localeCode) return normalizedLink;
    if (["az", "en", "ru"].includes(firstSegment)) return normalizedLink;
    return `/${localeCode}${normalizedLink}`;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function SearchPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();
    const t = getTranslations(normalizedLocale);
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const query = String(readSearchParamValue(resolvedSearchParams.q) ?? "").trim();

    const chrome = await getSiteChromeData(normalizedLocale);

    const liveSearchPayload = await (async () => {
        if (!query) return null;
        const response = await api.get<LiveSearchResponseData>("/product/live-search", {
            params: { q: query },
            locale: normalizedLocale,
            cache: "no-store",
        });
        if (!response.success || !response.data) return null;
        const raw = isRecord(response.data.data) ? response.data.data : response.data;
        return isRecord(raw) ? (raw as LiveSearchPayload) : null;
    })();

    const categories = Array.isArray(liveSearchPayload?.categories?.items) ? liveSearchPayload!.categories!.items! : [];

    const productListPayload = await (async (): Promise<ProductListApiPayload | null> => {
        if (!query) return null;

        const apiBase = (config.api.url || "https://admin.tvim.az/api/v1").trim().replace(/\/+$/, "");
        const listUrl = new URL(`${apiBase}${config.endpoints.products.paginatedList}`);
        const outgoingParams = new URLSearchParams();

        outgoingParams.set("q", query);

        const allowKey = (key: string) => {
            if (key === "page") return true;
            if (key === "per_page") return true;
            if (key === "sort") return true;
            if (key === "is_new") return true;
            if (key === "is_popular") return true;
            if (key === "most_sale") return true;
            if (key === "price_min") return true;
            if (key === "price_max") return true;
            return false;
        };

        for (const [key, value] of Object.entries(resolvedSearchParams)) {
            if (key === "q") continue;
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

        try {
            const response = await fetch(listUrl.toString(), {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    "Content-Language": normalizedLocale,
                    "Accept-Language": normalizedLocale,
                },
            });
            const json = (await response.json()) as unknown;
            if (json && typeof json === "object") return json as ProductListApiPayload;
            return null;
        } catch {
            return null;
        }
    })();

    const productList = productListPayload?.success ? productListPayload.data : undefined;
    const listItems = Array.isArray(productList?.items) ? productList!.items! : [];

    const currentUiParams = new URLSearchParams();
    if (query) currentUiParams.set("q", query);
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
        if (key === "q") continue;
        if (value == null) continue;
        const allowKey = (k: string) => {
            if (k === "page") return true;
            if (k === "per_page") return true;
            if (k === "sort") return true;
            if (k === "is_new") return true;
            if (k === "is_popular") return true;
            if (k === "most_sale") return true;
            if (k === "price_min") return true;
            if (k === "price_max") return true;
            return false;
        };
        if (!allowKey(key)) continue;

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

    const buildHrefWithParams = (nextParams: URLSearchParams) => {
        const qs = nextParams.toString();
        return qs ? `/${normalizedLocale}/search?${qs}` : `/${normalizedLocale}/search`;
    };

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

    const currentPage = Math.max(1, Number(productList?.pagination?.current_page ?? parsePageNumber(resolvedSearchParams.page)));
    const lastPage = Math.max(1, Number(productList?.pagination?.last_page ?? 1));
    const paginationTokens = buildPaginationTokens(currentPage, lastPage);
    const sortOptions = Array.isArray(productList?.sort_options) ? productList!.sort_options! : [];
    const activeSort = String(productList?.applied?.sort ?? currentUiParams.get("sort") ?? "").trim() || "newest";

    return (
        <SitePageShell chrome={chrome} includeLogoutToast>
            <Breadcrumb
                items={[
                    { label: t.common.home, href: `/${normalizedLocale}` },
                    { label: t.search.title, isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] px-1 lg:px-2"
                showTitle
                pageTitle={t.search.title}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-6 pb-10 lg:px-2 lg:pb-12">
                <form action={`/${normalizedLocale}/search`} method="GET" className="mb-6">
                    {Object.entries(resolvedSearchParams).map(([key, value]) => {
                        if (key === "q" || key === "page") return null;
                        if (value == null) return null;

                        if (Array.isArray(value)) {
                            return value.map((itemValue, index) => {
                                const trimmed = String(itemValue ?? "").trim();
                                if (!trimmed) return null;
                                return <input key={`${key}-${trimmed}-${index}`} type="hidden" name={key} value={trimmed} />;
                            });
                        }

                        const trimmed = String(value ?? "").trim();
                        if (!trimmed) return null;
                        return <input key={key} type="hidden" name={key} value={trimmed} />;
                    })}

                    <div className="flex items-center gap-2 rounded-[20px] bg-[#ecf4fc] px-4 py-2">
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder={t.common.searchPlaceholder}
                            aria-label={t.common.searchPlaceholder}
                            className="h-10 w-full bg-transparent text-[14px] text-[#343943] outline-none placeholder:text-[#8b91a0]"
                        />
                        <button
                            type="submit"
                            aria-label={t.common.searchPlaceholder}
                            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#8b91a0] transition-colors hover:bg-white/60 hover:text-[#343943]"
                        >
                            <i className="fa-solid fa-magnifying-glass text-[14px]" aria-hidden="true" />
                        </button>
                    </div>
                </form>

                {!query ? (
                    <div className="text-[15px] text-[#4b5565]">{t.search.emptyQuery}</div>
                ) : (
                    <>
                        {categories.length > 0 ? (
                            <div className="mb-6 px-1 sm:px-2">
                                <div className="grid grid-cols-2 gap-y-7 gap-x-10 sm:grid-cols-3 lg:grid-cols-4">
                                    {categories.map((item) => {
                                        const href = toLocalizedHref(item.link ?? item.slug, normalizedLocale);
                                        const key = String(item.id ?? item.link ?? item.slug ?? item.name ?? href);
                                        const isExternal = /^https?:\/\//i.test(href);
                                        return (
                                            isExternal ? (
                                                <a
                                                    key={key}
                                                    href={href}
                                                    className="text-[14px] font-semibold text-[#111318] hover:underline"
                                                >
                                                    {item.name ?? "Kateqoriya"}
                                                </a>
                                            ) : (
                                                <Link
                                                    key={key}
                                                    href={href}
                                                    className="text-[14px] font-semibold text-[#111318] hover:underline"
                                                >
                                                    {item.name ?? t.search.categoryFallback}
                                                </Link>
                                            )
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        <PendingNavProvider>
                            <PendingOverlay className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20" />

                            <div className="relative min-h-[360px]">
                                {(() => {
                                    const labelByKey: Record<string, string> = {
                                        newest: t.search.sort.newest,
                                        name_asc: t.search.sort.nameAsc,
                                        name_desc: t.search.sort.nameDesc,
                                        price_asc: t.search.sort.priceAsc,
                                        price_desc: t.search.sort.priceDesc,
                                        popular: t.search.sort.popular,
                                        most_sale: t.search.sort.mostSale,
                                    };

                                    const sortOptionsFallback = [
                                        { key: "newest", label: t.search.sort.newest },
                                        { key: "name_asc", label: t.search.sort.nameAsc },
                                        { key: "name_desc", label: t.search.sort.nameDesc },
                                        { key: "price_asc", label: t.search.sort.priceAsc },
                                        { key: "price_desc", label: t.search.sort.priceDesc },
                                        { key: "popular", label: t.search.sort.popular },
                                        { key: "most_sale", label: t.search.sort.mostSale },
                                    ];

                                    const effectiveSortOptions = sortOptions.length > 0 ? sortOptions : sortOptionsFallback;

                                    return (
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
                                                        {labelByKey[key] ?? opt?.label ?? key}
                                                    </PendingLink>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                                {listItems.length > 0 ? (
                                    <ProductGrid items={listItems} locale={normalizedLocale} />
                                ) : (
                                    <div className="text-[15px] text-[#4b5565]">{t.search.noResults}</div>
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
                        </PendingNavProvider>
                    </>
                )}
            </section>
        </SitePageShell>
    );
}
