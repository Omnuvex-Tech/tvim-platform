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
import { config } from "@/config";
import { api } from "@/lib/api";
import { resolveProjectSettings, resolveSettingsApiLocale } from "@/lib/settings";
import {
    extractHeaderCategories,
    extractHeaderItems,
    isCategoriesMenuType,
    isHeaderEnabledItem,
    isTopLevelHeaderItem,
    resolveHeaderMenuHref,
    resolveHeaderMenuLabel,
} from "@/lib/header-navigation";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { Footer } from "@/app/components/Footer/footer";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";
import { Pagination } from "@/app/components/Pagination/pagination";
import BrandListSlider from "@/app/components/BrandListSlider/brand-list-slider";
import { PendingNavProvider, PendingOverlay } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";

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

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
};

const copyByLocale = (locale: string) => {
    if (locale === "ru") {
        return {
            home: "Главная",
            brands: "Бренды",
            pageTitle: "Бренды",
            empty: "Активные бренды не найдены.",
            authRequired: "Для просмотра списка брендов требуется авторизация.",
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
            authRequired: "Authentication is required to view the brand list.",
            fallbackError: "Failed to load the brand list.",
            countSuffix: "products",
        };
    }

    return {
        home: "Ana səhifə",
        brands: "Brendlər",
        pageTitle: "Brendlər",
        empty: "Aktiv brend tapılmadı.",
        authRequired: "Brend siyahısını görmək üçün giriş tələb olunur.",
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
    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);

    const [
        langResponse,
        headerMenuResponse,
        footerMenuResponse,
        settingsResponse,
        categoriesResponse,
        brandsResponse,
    ] = await Promise.all([
        api.get<Language[]>(config.endpoints.languages.list),
        api.get<HeaderMenuResponseData>(config.endpoints.menus.list, {
            params: { in_header: "1" },
            locale,
        }),
        api.get<FooterMenusData>(config.endpoints.menus.list, {
            params: { in_footer: "1" },
            locale,
        }),
        api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            params: { lang: locale },
            locale: resolveSettingsApiLocale(locale),
            cache: "no-store",
        }),
        api.get<HeaderCategoriesResponseData>("/product/categories", {
            params: { in_header: "1" },
            locale,
        }),
        api.get<ProductBrandsResponseData>("/product/brands", {
            locale,
            cache: "no-store",
            ...(authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : null),
        }),
    ]);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

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

    const footerMenus = footerMenuResponse.success && footerMenuResponse.data ? footerMenuResponse.data.footer : [];

    let projectSettings: ProjectSettingsData | undefined;
    if (settingsResponse.success && settingsResponse.data) {
        projectSettings = resolveProjectSettings(settingsResponse.data);
    }

    const fallbackLocale = normalizeLocale(config.project.defLang);
    if ((footerMenus.length === 0 || !projectSettings) && fallbackLocale !== locale) {
        const [fallbackFooterMenuResponse, fallbackSettingsResponse] = await Promise.all([
            footerMenus.length === 0
                ? api.get<FooterMenusData>(config.endpoints.menus.list, {
                    params: { in_footer: "1" },
                    locale: fallbackLocale,
                })
                : Promise.resolve(null),
            !projectSettings
                ? api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
                    params: { lang: fallbackLocale },
                    locale: resolveSettingsApiLocale(fallbackLocale),
                    cache: "no-store",
                })
                : Promise.resolve(null),
        ]);

        if (footerMenus.length === 0 && fallbackFooterMenuResponse?.success && fallbackFooterMenuResponse.data) {
            footerMenus.push(...fallbackFooterMenuResponse.data.footer);
        }

        if (!projectSettings && fallbackSettingsResponse?.success && fallbackSettingsResponse.data) {
            projectSettings = resolveProjectSettings(fallbackSettingsResponse.data);
        }
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
    const isUnauthorized = !authToken || brandsResponse.status === 401 || brandsResponse.status === 403;
    const infoMessage = brandsResponse.success
        ? brandItems.length === 0
            ? t.empty
            : ""
        : isUnauthorized
            ? t.authRequired
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

            <LogoutToast />

            <div className="mt-16 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
            </div>
        </div>
    );
}
