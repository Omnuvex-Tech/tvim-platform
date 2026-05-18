import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type {
    FooterMenusData,
    HeaderCategoriesResponseData,
    HeaderMenuResponseData,
    Language,
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
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";

type GridItem = {
    id?: number | string;
    slug?: string;
    multi_slugs?: Record<string, string>;
    name?: string;
    content?: string;
    banner?: string | null;
    main_photo?: string | null;
    datetime1?: string | null;
    seo?: {
        meta_title?: string;
        meta_description?: string;
        meta_keywords?: string | string[];
    };
};

type MenuDetailResponse = {
    success: boolean;
    data: {
        menu: {
            name: string;
            title: string | null;
            type: string;
            seo?: any;
        };
        data: {
            items?: GridItem[];
        };
    };
};

async function getMenuDetail(slug: string, locale: string) {
    try {
        const response = await api.get<MenuDetailResponse>(config.endpoints.menus.detail(slug), {
            locale,
        });
        if (response.success && response.data) return response.data;
        return null;
    } catch {
        return null;
    }
}

function resolveItemBySlug(items: GridItem[], itemSlug: string, locale: string) {
    const normalizedTarget = decodeURIComponent(itemSlug).trim().toLowerCase();

    return items.find((item) => {
        const localized = item.multi_slugs?.[locale] || item.slug || "";
        return String(localized).trim().toLowerCase() === normalizedTarget;
    });
}

function stripHtml(input?: string | null) {
    if (!input) return "";
    return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getHomeLabel(locale: string) {
    return locale === "en" ? "Home" : "Ana sehife";
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string; itemSlug: string }>;
}): Promise<Metadata> {
    const { locale, slug, itemSlug } = await params;
    const normalizedLocale = locale.toLowerCase();

    const menuDetail = await getMenuDetail(slug, normalizedLocale);
    if (!menuDetail) return {};

    const item = resolveItemBySlug(menuDetail.data.items || [], itemSlug, normalizedLocale);
    if (!item) return {};

    const fallbackDescription = stripHtml(item.content).slice(0, 170);

    return {
        title: item.seo?.meta_title || item.name || menuDetail.menu.title || menuDetail.menu.name,
        description: item.seo?.meta_description || fallbackDescription,
        keywords: item.seo?.meta_keywords,
    };
}

export default async function GridDetailPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string; itemSlug: string }>;
}) {
    const { locale, slug, itemSlug } = await params;
    const normalizedLocale = locale.toLowerCase();

    const [
        menuDetail,
        langResponse,
        headerMenuResponse,
        footerMenuResponse,
        settingsResponse,
        categoriesResponse,
    ] = await Promise.all([
        getMenuDetail(slug, normalizedLocale),
        api.get<Language[]>(config.endpoints.languages.list),
        api.get<HeaderMenuResponseData>(config.endpoints.menus.list, {
            params: { in_header: "1" },
            locale: normalizedLocale,
        }),
        api.get<FooterMenusData>(config.endpoints.menus.list, {
            params: { in_footer: "1" },
            locale: normalizedLocale,
        }),
        api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            locale: normalizedLocale,
        }),
        api.get<HeaderCategoriesResponseData>("/product/categories", {
            params: { in_header: "1" },
            locale: normalizedLocale,
        }),
    ]);

    if (!menuDetail) notFound();

    const items = menuDetail.data.items || [];
    const item = resolveItemBySlug(items, itemSlug, normalizedLocale);
    if (!item) notFound();

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
    const headerItems = extractHeaderItems(rawHeaderData);
    const headerTopLevel = headerItems.filter(isTopLevelHeaderItem);

    const headerMenuItems = headerTopLevel
        .filter((menuItem) => !isCategoriesMenuType(menuItem))
        .map((menuItem) => ({
            label: resolveHeaderMenuLabel(menuItem),
            href: resolveHeaderMenuHref(menuItem, normalizedLocale),
        }))
        .filter((menuItem) => menuItem.label);

    let headerCategoryItems: any[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const categoryItems = extractHeaderCategories(categoriesResponse.data);
        const filtered = categoryItems.filter(isHeaderEnabledItem);
        headerCategoryItems = filtered.length > 0 ? filtered : categoryItems;
    } else {
        headerCategoryItems = headerTopLevel.filter(isCategoriesMenuType);
    }

    const footerMenus = footerMenuResponse.success && footerMenuResponse.data ? footerMenuResponse.data.footer : [];
    const projectSettings = settingsResponse.success ? settingsResponse.data?.data : undefined;

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

    const image = item.banner || item.main_photo || null;

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={normalizedLocale}
                languages={langResponse.success && langResponse.data ? langResponse.data : []}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <Breadcrumb
                items={[
                    { label: getHomeLabel(normalizedLocale), href: `/${normalizedLocale}` },
                    { label: menuDetail.menu.title || menuDetail.menu.name, href: `/${normalizedLocale}/${slug}` },
                    { label: item.name || "Detail", isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle={false}
                pageTitle={item.name || menuDetail.menu.title || menuDetail.menu.name}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            <article className="news_page mx-auto w-full max-w-[1280px] !px-1 pt-0 pb-10 lg:!px-2 lg:pb-12">
                {image ? (
                    <div className="blog_h mb-8 overflow-hidden rounded-[14px] lg:rounded-[24px]">
                        <img
                            src={image}
                            alt={item.name || "Grid item"}
                            className="blog_h__img w-full object-cover"
                        />
                        <div className="blog_h__content">
                            <div className="breadcrumb-h1">
                            <h1>
                                {item.name || menuDetail.menu.title || menuDetail.menu.name}
                            </h1>
                            </div>
                            {item.datetime1 ? (
                                <div className="news-page__posted mt-5 flex items-center">
                                    <i className="fa-regular fa-clock" aria-hidden="true" />
                                    <p>{item.datetime1}</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="mx-auto w-full">
                    {item.content ? (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                    ) : (
                        <p className="text-[16px] text-[#4b5563]">Kontent tapilmadi.</p>
                    )}

                </div>
            </article>

            <LogoutToast />

            <div className="mt-auto w-full pt-12 lg:pt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
            </div>
        </div>
    );
}
