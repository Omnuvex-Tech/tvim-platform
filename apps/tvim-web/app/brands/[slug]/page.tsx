import Link from "next/link";
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

type ProductListApiResponse = {
    menu?: {
        id?: number;
        name?: string;
        meta_title?: string | null;
    };
    items?: Array<{
        product_id?: number;
        variation_id?: number;
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

type BrandProductCard = {
    id: string;
    name: string;
    slug: string;
    price: number;
    oldPrice?: number;
    imageUrl?: string;
};

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
};

const toAbsoluteAssetUrl = (value: string | null | undefined) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
        return trimmed;
    }

    try {
        const apiOrigin = new URL(config.api.url).origin;

        if (trimmed.startsWith("//")) {
            return `https:${trimmed}`;
        }

        if (trimmed.startsWith("/")) {
            return `${apiOrigin}${trimmed}`;
        }

        return `${apiOrigin}/${trimmed.replace(/^\/+/, "")}`;
    } catch {
        return trimmed;
    }
};

const formatPrice = (value: number | null | undefined) => {
    const parsed = typeof value === "number" ? value : Number(value ?? 0);
    return `${parsed.toFixed(2)}₼`;
};

const normalizeSlugText = (value: string) => {
    const decoded = decodeURIComponent(String(value ?? "")).trim();
    return decoded.replace(/[-_]+/g, " ").trim();
};

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

const mapBrandCards = (payload: ProductListApiResponse | null): BrandProductCard[] => {
    if (!payload) return [];

    const cards: BrandProductCard[] = [];

    (payload.items ?? []).forEach((item, index) => {
        const variation = item?.variation && typeof item.variation === "object" ? item.variation : null;
        const slug = String(variation?.slug ?? item?.slug ?? "").trim();
        if (!slug) return;

        const regularPrice = Number(variation?.price ?? item?.price ?? 0);
        const discountPriceRaw = variation?.discount_price;
        const discountPrice = typeof discountPriceRaw === "number" ? discountPriceRaw : null;
        const finalPrice = discountPrice ?? regularPrice;
        const oldPriceRaw = variation?.old_price ?? item?.old_price;
        const oldPrice = typeof oldPriceRaw === "number"
            ? oldPriceRaw
            : (discountPrice !== null && regularPrice > discountPrice ? regularPrice : undefined);

        cards.push({
            id: `item-${String(variation?.id ?? item.variation_id ?? item.product_id ?? slug ?? index)}`,
            name: String(variation?.name ?? item?.name ?? "Məhsul"),
            slug,
            price: Number(finalPrice ?? 0),
            oldPrice,
            imageUrl: toAbsoluteAssetUrl(variation?.main_image ?? item?.main_image),
        });
    });

    const unique = new Map<string, BrandProductCard>();
    cards.forEach((item) => {
        if (!item.slug || unique.has(item.slug)) return;
        unique.set(item.slug, item);
    });

    return Array.from(unique.values());
};

export default async function BrandSlugPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ page?: string | string[] }>;
}) {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
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
        productListResponse,
        headerMenuResponse,
        footerMenuResponse,
        settingsResponse,
        categoriesResponse,
    ] = await Promise.all([
        api.get<ProductListApiResponse>(config.endpoints.products.paginatedList, {
            params: {
                page: String(requestedPage),
                per_page: "20",
            },
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
    const pageName = String(detailData?.menu?.name ?? fallbackPageName).trim() || fallbackPageName;
    const breadcrumbItems = [
        { label: locale === "en" ? "Home" : "Ana səhifə", href: `/${locale}` },
        { label: "Brend" },
        { label: pageName, isCurrent: true as const },
    ];

    const cards = mapBrandCards(detailData);
    const pagination = detailData?.pagination;
    const lastPage = Math.max(1, Number(pagination?.last_page ?? 1));
    const currentPage = Math.min(requestedPage, lastPage);
    const paginationTokens = buildPaginationTokens(currentPage, lastPage);

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
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2 [&_ul.breadcrumb]:!mb-0 [&_ul.breadcrumb]:!pb-0 [&_ul.breadcrumb]:!leading-none [&_ul.breadcrumb]:!flex [&_ul.breadcrumb]:!items-center [&_ul.breadcrumb_li]:!inline-flex [&_ul.breadcrumb_li]:!items-center [&_ul.breadcrumb_li]:!leading-none [&_ul.breadcrumb_li]:!text-[16px] [&_ul.breadcrumb_li]:!font-normal [&_.breadcrumb-previous]:!inline-flex [&_.breadcrumb-previous]:!items-center [&_.breadcrumb-previous]:!leading-none [&_.breadcrumb-previous]:!font-normal [&_.breadcrumb-previous]:!text-[#8ea0b4] [&_.breadcrumb-current]:!inline-flex [&_.breadcrumb-current]:!items-center [&_.breadcrumb-current]:!leading-none [&_.breadcrumb-current]:!font-medium [&_.breadcrumb-current]:!text-[13px] [&_.breadcrumb-current]:!text-[rgba(132,150,171,1)] [&_ul.breadcrumb_li+li::before]:!inline-flex [&_ul.breadcrumb_li+li::before]:!items-center [&_ul.breadcrumb_li+li::before]:!leading-none [&_ul.breadcrumb_li+li::before]:!align-middle [&_ul.breadcrumb_li+li::before]:!text-[#d2dae3] [&_ul.breadcrumb_li:first-child_.breadcrumb-previous]:!text-[13px] [&_ul.breadcrumb_li:first-child_.breadcrumb-previous]:!text-[rgba(132,150,171,1)] [&_ul.breadcrumb_li:first-child_.breadcrumb-previous]:!cursor-pointer [&_ul.breadcrumb_li:first-child_.breadcrumb-previous:hover]:!no-underline [&_ul.breadcrumb_li:first-child_.breadcrumb-previous:hover]:!text-[rgba(132,150,171,1)] [&_ul.breadcrumb_li:nth-child(2)_.breadcrumb-previous]:!text-[13px] [&_ul.breadcrumb_li:nth-child(2)_.breadcrumb-previous]:!text-[rgba(132,150,171,1)] [&_ul.breadcrumb_li:nth-child(2)_.breadcrumb-previous]:!cursor-pointer [&_ul.breadcrumb_li:nth-child(2)_.breadcrumb-previous:hover]:!no-underline [&_ul.breadcrumb_li:nth-child(2)_.breadcrumb-previous:hover]:!text-[rgba(132,150,171,1)]"
                showTitle
                pageTitle={pageName}
                titleClassName="mb-0 !text-left !w-full !text-[39px] !font-[700] !leading-[39px] !text-[rgba(15,15,15,1)]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-5 pb-12 lg:px-2">
                <div className="mb-4 flex min-h-[64px] flex-wrap items-center gap-3 rounded-[16px] bg-white px-4 py-3 shadow-[0_0_16px_-10px_rgba(15,23,42,0.26)]">
                    <button type="button" className="rounded-[9px] bg-[#f7f8fa] px-4 py-2 text-[14px] font-medium text-[#4b5565]">Əsas</button>
                    <button type="button" className="rounded-[9px] bg-[#f7f8fa] px-4 py-2 text-[14px] font-medium text-[#4b5565]">Ad</button>
                    <button type="button" className="rounded-[9px] bg-[#0f57d6] px-4 py-2 text-[14px] font-semibold text-white">Qiymət</button>
                    <button type="button" className="rounded-[9px] bg-[#f7f8fa] px-4 py-2 text-[14px] font-medium text-[#4b5565]">Reytinq</button>
                    <button type="button" className="rounded-[9px] bg-[#f7f8fa] px-4 py-2 text-[14px] font-medium text-[#4b5565]">Model</button>
                </div>

                {cards.length === 0 ? (
                    <div className="rounded-[16px] border border-[#e6ebf2] bg-[#f9fafc] px-5 py-4 text-[15px] text-[#4b5565]">
                        Məhsul tapılmadı.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {cards.map((item) => (
                                <article key={item.id} className="group rounded-[14px] border border-[#e7ebf1] bg-white p-4 transition-shadow hover:shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)]">
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <button type="button" className="text-[#8a96a8] hover:text-[#0f57d6]" aria-label="favorite">
                                            <i className="fa-regular fa-heart text-[14px]" />
                                        </button>
                                        <button type="button" className="text-[#8a96a8] hover:text-[#0f57d6]" aria-label="compare">
                                            <i className="fa-solid fa-arrow-right-arrow-left text-[12px]" />
                                        </button>
                                    </div>

                                    <Link href={`/product/${item.slug}`} className="block">
                                        <div className="mb-3 flex h-[160px] items-center justify-center overflow-hidden rounded-[10px] bg-[#fbfcfe] p-2">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="max-h-full w-auto object-contain" />
                                            ) : (
                                                <div className="text-[13px] text-[#8a96a8]">No image</div>
                                            )}
                                        </div>
                                        <h3 className="line-clamp-2 min-h-[44px] text-[15px] leading-[1.35] font-medium text-[#1f2328]">{item.name}</h3>
                                    </Link>

                                    <div className="mt-3">
                                        {typeof item.oldPrice === "number" && item.oldPrice > item.price ? (
                                            <p className="text-[13px] text-[#9aa4b2] line-through">{formatPrice(item.oldPrice)}</p>
                                        ) : null}
                                        <p className="text-[30px] leading-none font-bold text-[#111318]">{formatPrice(item.price)}</p>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {lastPage > 1 ? (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                                <Link
                                    href={{ pathname: `/brands/${slug}`, query: { page: String(Math.max(1, currentPage - 1)) } }}
                                    aria-disabled={currentPage <= 1}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111318] transition-colors sm:h-10 sm:w-10 ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"}`}
                                >
                                    <i className="fa-solid fa-chevron-left text-[12px]" />
                                </Link>

                                {paginationTokens.map((token, index) => {
                                    if (token === "ellipsis") {
                                        return (
                                            <span key={`ellipsis-${index}`} className="inline-flex h-9 w-9 items-center justify-center text-[16px] text-[#8b97a9] sm:h-10 sm:w-10">
                                                ...
                                            </span>
                                        );
                                    }

                                    const isActive = token === currentPage;
                                    return (
                                        <Link
                                            key={`page-${token}`}
                                            href={{ pathname: `/brands/${slug}`, query: { page: String(token) } }}
                                            aria-current={isActive ? "page" : undefined}
                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors sm:h-10 sm:w-10 sm:text-[14px] ${isActive ? "border-[#0f57d6] bg-[#0f57d6] text-white" : "border-[#e5e7eb] bg-white text-[#111318] hover:bg-[#f5f7fb]"}`}
                                        >
                                            {token}
                                        </Link>
                                    );
                                })}

                                <Link
                                    href={{ pathname: `/brands/${slug}`, query: { page: String(Math.min(lastPage, currentPage + 1)) } }}
                                    aria-disabled={currentPage >= lastPage}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111318] transition-colors sm:h-10 sm:w-10 ${currentPage >= lastPage ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"}`}
                                >
                                    <i className="fa-solid fa-chevron-right text-[12px]" />
                                </Link>
                            </div>
                        ) : null}
                    </>
                )}
            </section>


            <LogoutToast />

            <div className="mt-16 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
            </div>
        </div>
    );
}
