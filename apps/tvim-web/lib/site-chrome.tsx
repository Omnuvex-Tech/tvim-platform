import type {
    HeaderCategoriesResponseData,
    HeaderCategoryItem,
    Language,
    MenuItem,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import type { NavbarMenuItem } from "@repo/ui";
import { RemoteImage } from "@repo/ui";
import type { ReactNode } from "react";
import { config } from "@/config";
import {
    extractHeaderCategories,
    extractHeaderItems,
    isCategoriesMenuType,
    isHeaderEnabledItem,
    resolveHeaderMenuHref,
    resolveHeaderMenuLabel,
} from "@/lib/header-navigation";
import { getPublicHeaderCategories, getPublicLanguages, getPublicMenuList, getPublicProjectSettingsResponse } from "@/lib/public-data";
import { resolveProjectSettings } from "@/lib/settings";

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

    const [languages, rawMenusData, settingsResponse, categoriesResponse] = await Promise.all([
        getPublicLanguages(),
        getPublicMenuList(locale),
        getPublicProjectSettingsResponse(locale),
        getPublicHeaderCategories(locale),
    ]);
    const rawMenus = rawMenusData as { footer?: unknown } | null;

    const headerItems = extractHeaderItems(rawMenusData);

    const menuItems = headerItems
        .filter((item) => !isCategoriesMenuType(item))
        .map((item) => ({
            label: resolveHeaderMenuLabel(item, locale),
            href: resolveHeaderMenuHref(item, locale),
        }))
        .filter((item) => item.label);

    let initialCatalogItems: HeaderCategoryItem[] = [];
    if (categoriesResponse) {
        const items = extractHeaderCategories(categoriesResponse as HeaderCategoriesResponseData);
        const filtered = items.filter(isHeaderEnabledItem);
        initialCatalogItems = filtered.length > 0 ? filtered : items;
    } else {
        initialCatalogItems = headerItems.filter(isCategoriesMenuType);
    }

    const footerMenus: MenuItem[] =
        rawMenus && Array.isArray(rawMenus.footer)
            ? rawMenus.footer as MenuItem[]
            : [];

    let projectSettings: ProjectSettingsData | undefined;
    if (settingsResponse) {
        projectSettings = resolveProjectSettings(settingsResponse as ProjectSettingsResponseData);
    }

    const logo = projectSettings?.general.images.logo ? (
        <RemoteImage
            src={projectSettings.general.images.logo}
            alt={projectSettings.general.site_title}
            width={224}
            height={64}
            priority
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
