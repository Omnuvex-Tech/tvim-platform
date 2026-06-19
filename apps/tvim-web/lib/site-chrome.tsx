import type {
    HeaderCategoriesResponseData,
    HeaderCategoryItem,
    Language,
    MenuItem,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import type { NavbarMenuItem } from "@repo/ui";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { config } from "@/config";
import {
    extractHeaderCategories,
    extractHeaderItems,
    isCategoriesMenuType,
    isHeaderEnabledItem,
    resolveHeaderMenuHref,
    resolveHeaderMenuLabel,
} from "@/lib/header-navigation";
import { resolveProjectSettings, resolveSettingsApiLocale } from "@/lib/settings";

export type SiteChromeData = {
    footerMenus: MenuItem[];
    initialCatalogItems: HeaderCategoryItem[];
    languages: Language[];
    locale: string;
    logo?: ReactNode;
    menuItems: NavbarMenuItem[];
    phone?: string;
    projectSettings?: ProjectSettingsData;
};

export async function getSiteChromeData(incomingLocale: string): Promise<SiteChromeData> {
    const locale = incomingLocale.trim().toLowerCase();

    const [langResponse, menusResponse, settingsResponse, categoriesResponse] = await Promise.all([
        api.get<Language[]>(config.endpoints.languages.list),
        api.get<any>(config.endpoints.menus.list, {
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
    ]);

    const languages = langResponse.success && Array.isArray(langResponse.data)
        ? langResponse.data
        : [];

    const rawMenusData = menusResponse.success && menusResponse.data ? menusResponse.data : null;
    const headerItems = extractHeaderItems(rawMenusData);

    const menuItems = headerItems
        .filter((item) => !isCategoriesMenuType(item))
        .map((item) => ({
            label: resolveHeaderMenuLabel(item),
            href: resolveHeaderMenuHref(item, locale),
        }))
        .filter((item) => item.label);

    let initialCatalogItems: HeaderCategoryItem[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const items = extractHeaderCategories(categoriesResponse.data);
        const filtered = items.filter(isHeaderEnabledItem);
        initialCatalogItems = filtered.length > 0 ? filtered : items;
    } else {
        initialCatalogItems = headerItems.filter(isCategoriesMenuType);
    }

    const footerMenus: MenuItem[] =
        rawMenusData && Array.isArray(rawMenusData.footer)
            ? rawMenusData.footer as MenuItem[]
            : [];

    let projectSettings: ProjectSettingsData | undefined;
    if (settingsResponse.success && settingsResponse.data) {
        projectSettings = resolveProjectSettings(settingsResponse.data);
    }

    const logo = projectSettings?.general.images.logo ? (
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

    const phone = projectSettings?.general.phones.find(
        (item) => item.is_whatsapp && item.number.trim().startsWith("+994")
    )?.number;

    return {
        footerMenus,
        initialCatalogItems,
        languages,
        locale,
        logo,
        menuItems,
        phone,
        projectSettings,
    };
}
