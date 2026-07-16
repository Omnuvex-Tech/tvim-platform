import type { Metadata } from "next";
import { Breadcrumb, type Company } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { buildSeoMetadata } from "@/lib/seo";
import { normalizeLocale } from "@/lib/site-locales";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { Pagination } from "@/app/components/Pagination/pagination";
import BrandListSlider from "@/app/components/BrandListSlider/brand-list-slider";
import { PendingNavProvider, PendingOverlay } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";
import { getSiteChromeData } from "@/lib/site-chrome";

type ProductBrandsResponseData = {
    filter_id?: number;
    name?: string;
    slug?: string;
    input_type?: string;
    is_color_filter?: boolean;
    show_in_sidebar?: boolean;
    is_required?: boolean;
    is_clickable?: boolean;
    image?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    values?: ProductBrandValue[];
};

type ProductBrandValue = {
    value_id?: number;
    name?: string;
    slug?: string;
    count?: number;
    color?: string | null;
    image?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
};

type RenderProductBrandsPageProps = {
    locale: string;
    searchParams?: Promise<ProductBrandsPageSearchParams>;
};

type ProductBrandsPageSearchParams = {
    page?: string | string[];
};

const copyByLocale = (locale: string) => {
    if (locale === "ru") {
        return {
            home: "Главная",
            brands: "Бренды",
            pageTitle: "Бренды",
            empty: "Активные бренды не найдены.",
            fallbackError: "Не удалось загрузить список брендов.",
            countSuffix: "товаров",
        };
    }

    if (locale === "en") {
        return {
            home: "Home",
            brands: "Brands",
            pageTitle: "Brands",
            empty: "No active brands were found.",
            fallbackError: "Failed to load the brand list.",
            countSuffix: "products",
        };
    }

    return {
        home: "Ana səhifə",
        brands: "Brendlər",
        pageTitle: "Brendlər",
        empty: "Aktiv brend tapılmadı.",
        fallbackError: "Brend siyahısını yükləmək olmadı.",
        countSuffix: "məhsul",
    };
};

const buildBrandHref = (locale: string, slug?: string) => {
    const cleanSlug = String(slug ?? "").trim().replace(/^\/+|\/+$/g, "");
    if (!cleanSlug) return "#";
    return `/${locale}/brands/${cleanSlug}`;
};

const resolveBrandImageUrl = (value: string | null | undefined) => {
    const trimmed = String(value ?? "").trim().replace(/^`+|`+$/g, "").trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
        return trimmed;
    }

    try {
        const apiOrigin = new URL(config.api.url).origin;

        if (trimmed.startsWith("//")) {
            return `https:${trimmed}`;
        }

        if (trimmed.startsWith("/storage/")) {
            return `${apiOrigin}${trimmed}`;
        }

        if (trimmed.startsWith("/")) {
            return `${apiOrigin}${trimmed}`;
        }

        if (trimmed.startsWith("storage/")) {
            return `${apiOrigin}/${trimmed.replace(/^\/+/, "")}`;
        }

        return `${apiOrigin}/storage/${trimmed.replace(/^\/+/, "")}`;
    } catch {
        return trimmed;
    }
};

const parsePageNumber = (value: string | string[] | undefined) => {
    const raw = Array.isArray(value) ? value[0] : value;
    const numeric = Number(raw ?? 1);
    if (!Number.isFinite(numeric) || numeric < 1) return 1;
    return Math.floor(numeric);
};

const BRANDS_PER_PAGE = 15;

export async function renderProductBrandsPage({
    locale: incomingLocale,
    searchParams,
}: RenderProductBrandsPageProps) {
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
    const t = copyByLocale(locale);

    const [chrome, brandsResponse] = await Promise.all([
        getSiteChromeData(locale),
        api.get<ProductBrandsResponseData>("/product/brands", {
            locale,
            cache: "no-store",
        }),
    ]);

    if (chrome.languages.length === 0) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">Dil melumatlari yuklenmedi.</p>
            </div>
        );
    }

    const brandsPayload = brandsResponse.success && brandsResponse.data ? brandsResponse.data : null;
    const brandItems = Array.isArray(brandsPayload?.values) ? brandsPayload.values : [];
    const lastPage = Math.max(1, Math.ceil(brandItems.length / BRANDS_PER_PAGE));
    const currentPage = Math.max(1, Math.min(requestedPage, lastPage));
    const paginatedBrandItems = brandItems.slice((currentPage - 1) * BRANDS_PER_PAGE, currentPage * BRANDS_PER_PAGE);
    const paginatedCompanies: Company[] = paginatedBrandItems
        .map((brand, index) => {
            const brandName = String(brand?.name ?? "").trim();
            if (!brandName) return null;

            return {
                id: String(brand?.value_id ?? brand?.slug ?? `brand-${index}`),
                name: brandName,
                logo: resolveBrandImageUrl(brand?.image),
                url: buildBrandHref(locale, brand?.slug),
            };
        })
        .filter(Boolean) as Company[];
    const infoMessage = brandsResponse.success
        ? brandItems.length === 0
            ? t.empty
            : ""
        : brandsResponse.message || t.fallbackError;
    const buildHrefWithParams = (page: number) => {
        const nextParams = new URLSearchParams(currentUiParams.toString());
        if (page <= 1) {
            nextParams.delete("page");
        } else {
            nextParams.set("page", String(page));
        }

        const qs = nextParams.toString();
        const basePath = `/${locale}/product/brands`;
        return qs ? `${basePath}?${qs}` : basePath;
    };

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: t.home, href: `/${locale}` },
                    { label: t.brands, isCurrent: true as const },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle
                pageTitle={t.pageTitle}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            <section className="mx-auto w-full max-w-[1280px] !px-1 pt-6 pb-10 lg:!px-2 lg:pb-12">
                <PendingNavProvider>
                    <PendingOverlay className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20" />

                    {brandItems.length > 0 ? (
                        <>
                            <BrandListSlider companies={paginatedCompanies} />

                            <Pagination
                                currentPage={currentPage}
                                lastPage={lastPage}
                                buildHref={buildHrefWithParams}
                            />
                        </>
                    ) : (
                        <div className="rounded-[16px] border border-[#eee] bg-white p-5 text-[15px] text-[#4b5565] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                            {infoMessage}
                        </div>
                    )}
                </PendingNavProvider>
            </section>

        </SitePageShell>
    );
}

export async function generateProductBrandsMetadata({
    locale: incomingLocale,
    searchParams,
}: RenderProductBrandsPageProps): Promise<Metadata> {
    const locale = normalizeLocale(incomingLocale || config.project.defLang);
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const requestedPage = parsePageNumber(resolvedSearchParams?.page);
    const t = copyByLocale(locale);

    return buildSeoMetadata({
        title: `${t.pageTitle} | TVIM`,
        description: `${t.pageTitle} uzre secilmis brendleri ve mehsullari TVIM daxilinde kesf edin.`,
        keywords: [t.pageTitle, "brands", "tvim"],
        locale,
        canonicalPath: `${locale}/product/brands`,
        siteUrl: config.project.url,
        locales: [locale],
        defaultLocale: locale,
        robots: requestedPage > 1
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
