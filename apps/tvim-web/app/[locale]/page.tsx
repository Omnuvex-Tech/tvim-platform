import type {
    FooterMenusData,
    HeaderCategoriesResponseData,
    HeaderMenuResponseData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { getMainPageBlocks } from "@/lib/main-page";
import {
    buildHomeMetadata,
    resolveProjectSettings,
    resolveSettingsApiLocale,
    resolveSettingsSeo,
    resolveSiteUrlWithFallbacks,
} from "@/lib/settings";
import {
    extractHeaderCategories,
    extractHeaderItems,
    isCategoriesMenuType,
    isHeaderEnabledItem,
    isTopLevelHeaderItem,
    resolveHeaderMenuHref,
    resolveHeaderMenuLabel,
} from "@/lib/header-navigation";
import { config } from "@/config";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";
import { MainPageBlocks } from "@/app/components/MainPageBlocks/main-page-blocks";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";

export const dynamic = "force-dynamic";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();
    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        params: { lang: normalizedLocale },
        locale: resolveSettingsApiLocale(normalizedLocale),
        cache: "no-store",
    });

    const requestOrigin = await (async () => {
        try {
            const h = await headers();
            const forwardedProto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
            const forwardedHost = h.get("x-forwarded-host")?.split(",")[0]?.trim();
            const host = forwardedHost || h.get("host")?.trim();
            if (!host) return undefined;
            const proto = forwardedProto || "https";
            return `${proto}://${host}`;
        } catch {
            return undefined;
        }
    })();

    const siteUrl = resolveSiteUrlWithFallbacks({
        settingsResponse: settingsResponse.success ? settingsResponse.data : undefined,
        requestOrigin,
        configUrl: config.project.url,
    });

    return buildHomeMetadata(
        settingsResponse.success ? resolveSettingsSeo(settingsResponse.data) : undefined,
        normalizedLocale,
        {
            canonicalPath: normalizedLocale,
            siteUrl,
        },
    );
}

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code.toLowerCase() === normalizedLocale)) {
        notFound();
    }

    const [footerMenuResponse, settingsResponse, mainPageBlocks, headerMenuResponse, categoriesResponse] = await Promise.all([
        api.get<FooterMenusData>(config.endpoints.menus.list, {
            params: { in_footer: "1" },
            locale: normalizedLocale,
        }),
        api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            params: { lang: normalizedLocale },
            locale: resolveSettingsApiLocale(normalizedLocale),
            cache: "no-store",
        }),
        getMainPageBlocks(normalizedLocale),
        api.get<HeaderMenuResponseData>(config.endpoints.menus.list, {
            params: { in_header: "1" },
            locale: normalizedLocale,
        }),
        api.get<HeaderCategoriesResponseData>("/product/categories", {
            params: { in_header: "1" },
            locale: normalizedLocale,
        }),
    ]);

    const footerMenus =
        footerMenuResponse.success && footerMenuResponse.data
            ? footerMenuResponse.data.footer
            : [];

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

    let headerCategoryItems = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const items = extractHeaderCategories(categoriesResponse.data);
        const filtered = items.filter(isHeaderEnabledItem);
        headerCategoryItems = filtered.length > 0 ? filtered : items;
    } else {
        headerCategoryItems = headerTopLevel.filter(isCategoriesMenuType);
    }

    let projectSettings: ProjectSettingsData | undefined;

    if (settingsResponse.success && settingsResponse.data) {
        projectSettings = resolveProjectSettings(settingsResponse.data);
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

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-6 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={normalizedLocale}
                languages={langResponse.data}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <MainPageBlocks blocks={mainPageBlocks} locale={normalizedLocale} />
            <LogoutToast />

            <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
        </div>
    );
}
