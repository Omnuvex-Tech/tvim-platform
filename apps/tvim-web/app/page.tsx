import type { Language, FooterMenusData, ProjectSettingsData, ProjectSettingsResponseData } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { NavbarWrapper } from "./components/Navbar/navbar-wrapper";
import { Footer } from "./components/Footer/footer";
import { MainPageBlocks, type MainPageBlock } from "./components/MainPageBlocks/main-page-blocks";

export default async function Home() {
    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    const siteDefaultLocale =
        langResponse.data.find((language) => language.is_default_site)?.code ??
        config.project.defLang;

    const footerMenuResponse = await api.get<FooterMenusData>(config.endpoints.menus.list, {
        params: { in_footer: "1" },
        locale: siteDefaultLocale,
    });

    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        locale: siteDefaultLocale,
    });

    const mainPageResponse = await api.get<MainPageBlock[]>(config.endpoints.mainPage.list, {
        locale: siteDefaultLocale,
    });

    const footerMenus =
        footerMenuResponse.success && footerMenuResponse.data
            ? footerMenuResponse.data.footer
            : [];

    // Fetch header menus (for top navigation + catalog seed)
    const headerMenuResponse = await api.get<any>(config.endpoints.menus.list, {
        params: { in_header: "1" },
        locale: siteDefaultLocale,
    });

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;

    let headerItems: any[] = [];
    if (Array.isArray(rawHeaderData)) headerItems = rawHeaderData;
    else if (rawHeaderData) {
        if (Array.isArray(rawHeaderData.header)) headerItems = rawHeaderData.header;
        else if (Array.isArray(rawHeaderData.menus)) headerItems = rawHeaderData.menus;
        else if (Array.isArray(rawHeaderData.items)) headerItems = rawHeaderData.items;
        else if (Array.isArray(rawHeaderData.data)) headerItems = rawHeaderData.data;
        else if (Array.isArray(rawHeaderData.footer)) headerItems = rawHeaderData.footer;
    }

    const headerTopLevel = headerItems.filter((it: any) => !it || !it.parent_id || Number(it.parent_id) === 0).filter(Boolean);

    const headerMenuItems = headerTopLevel
        .filter((it: any) => (((it.type ?? "") + "").toString().toLowerCase() !== "categories"))
        .map((it: any) => {
            const hrefPart = (it.multi_links && it.multi_links[siteDefaultLocale.toLowerCase()]) || it.link || "";
            const path = hrefPart ? `/${siteDefaultLocale.toLowerCase()}/${String(hrefPart).replace(/^\/+/, "")}` : "#";
            return { label: it.name ?? it.title ?? it.link ?? "", href: path };
        });

    // Prefer fetching real product categories for the catalog rather than
    // attempting to reuse menu entries that are only typed as "categories".
    // This endpoint returns proper category objects used by the catalog UI.
    const categoriesResponse = await api.get<any>("/product/categories", {
        params: { in_header: "1" },
        locale: siteDefaultLocale,
    });

    let headerCategoryItems: any[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const raw = categoriesResponse.data;
        let items: any[] = [];
        if (Array.isArray(raw)) items = raw;
        else if (Array.isArray(raw.data)) items = raw.data;
        else if (Array.isArray(raw.items)) items = raw.items;
        else if (raw && typeof raw === "object") {
            const arr = Object.values(raw).find((v) => Array.isArray(v));
            if (Array.isArray(arr)) items = arr as any[];
        }

        const filtered = items.filter((it) => !!it && (it.in_header === true || it.in_header === 1 || it.in_header === "1" || it.in_header === "true"));
        headerCategoryItems = filtered.length > 0 ? filtered : items;
    } else {
        // Fallback: if product categories endpoint failed, fall back to menu-marked categories
        headerCategoryItems = headerTopLevel.filter((it: any) => (((it.type ?? "") + "").toString().toLowerCase() === "categories"));
    }

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

    const mainPageBlocks =
        mainPageResponse.success && Array.isArray(mainPageResponse.data)
            ? (mainPageResponse.data as MainPageBlock[])
            : [];

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-6 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={siteDefaultLocale}
                languages={langResponse.data}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <MainPageBlocks blocks={mainPageBlocks} />

            <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
        </div>
    );
}