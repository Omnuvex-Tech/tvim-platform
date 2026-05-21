import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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

type NewsVariation = {
    variation_id?: number;
    name?: string;
    slug?: string;
    price?: string | number | null;
    main_image_url?: string | null;
};

type NewsRelatedProduct = {
    id?: number;
    variation?: NewsVariation;
};

type NewsItem = {
    id?: number;
    slug?: string;
    multi_slugs?: Record<string, string>;
    name?: string;
    content?: string;
    banner?: string | null;
    main_photo?: string | null;
    files?: Array<{ url?: string; is_main?: boolean }>;
    related_products?: NewsRelatedProduct[];
};

type MenuDetailData = {
    menu?: {
        name?: string;
        title?: string | null;
        description?: string | null;
    };
    data?: {
        item?: NewsItem;
        items?: NewsItem[];
        content?: string;
        banner?: string | null;
        main_photo?: string | null;
        related_products?: NewsRelatedProduct[];
    };
};

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
};

const normalizeSlug = (value: string) => decodeURIComponent(String(value ?? "")).trim().toLowerCase().replace(/^\/+|\/+$/g, "");

const normalizeSlugText = (value: string) => decodeURIComponent(String(value ?? "")).trim().replace(/[-_]+/g, " ").trim();

async function getMenuDetail(slug: string, locale: string) {
    const normalizedSlug = normalizeSlug(slug);

    const tryResolveFromPayload = (payload: any): MenuDetailData | null => {
        if (!payload || typeof payload !== "object") return null;

        if (Array.isArray(payload.header)) {
            const headerMenus = payload.header as Array<any>;

            for (const menuEntry of headerMenus) {
                const items = Array.isArray(menuEntry?.data?.items) ? menuEntry.data.items : [];
                const matchedItem = items.find((item: any) => {
                    const localized = item?.multi_slugs?.[locale] || item?.slug || "";
                    return normalizeSlug(localized) === normalizedSlug;
                });

                if (matchedItem) {
                    return {
                        menu: menuEntry,
                        data: {
                            ...menuEntry.data,
                            item: matchedItem,
                        },
                    } as MenuDetailData;
                }
            }
        }

        if (payload && typeof payload === "object" && payload.menu) {
            return payload as MenuDetailData;
        }

        if (payload && typeof payload === "object" && payload.data?.menu) {
            return payload.data as MenuDetailData;
        }

        return null;
    };

    const tryDeepFindItem = (root: any): NewsItem | null => {
        const queue: any[] = [root];
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current || typeof current !== "object") continue;

            if (Array.isArray(current)) {
                for (const v of current) queue.push(v);
                continue;
            }

            const localized = current.multi_slugs?.[locale] || current.slug || "";
            if (normalizeSlug(localized) === normalizedSlug && (current.content || current.banner || current.main_photo || current.related_products)) {
                return current as NewsItem;
            }

            for (const value of Object.values(current)) {
                if (value && typeof value === "object") queue.push(value);
            }
        }
        return null;
    };

    try {
        const responseList = await api.get<any>(config.endpoints.menus.list, {
            params: { detail: slug },
            locale,
        });
        if (responseList.success && responseList.data) {
            const fromList = tryResolveFromPayload(responseList.data);
            if (fromList) return fromList;

            const deepItem = tryDeepFindItem(responseList.data);
            if (deepItem) {
                return {
                    menu: { name: deepItem.name ?? normalizeSlugText(slug), title: deepItem.name ?? normalizeSlugText(slug) },
                    data: { item: deepItem },
                };
            }
        }

        const responseDetail = await api.get<any>(config.endpoints.menus.detail(slug), { locale });
        if (responseDetail.success && responseDetail.data) {
            const fromDetail = tryResolveFromPayload(responseDetail.data);
            if (fromDetail) return fromDetail;
        }

        const absoluteUrl = `https://admin.tvim.az/api/v1/menus?detail=${encodeURIComponent(slug)}`;
        const absoluteResponse = await fetch(absoluteUrl, {
            headers: {
                Accept: "application/json",
                "Content-Language": locale,
            },
            cache: "no-store",
        });

        if (absoluteResponse.ok) {
            const absoluteJson = await absoluteResponse.json();
            const absoluteData = absoluteJson?.data ?? absoluteJson;
            const fromAbsolute = tryResolveFromPayload(absoluteData);
            if (fromAbsolute) return fromAbsolute;

            const deepItem = tryDeepFindItem(absoluteData);
            if (deepItem) {
                return {
                    menu: { name: deepItem.name ?? normalizeSlugText(slug), title: deepItem.name ?? normalizeSlugText(slug) },
                    data: { item: deepItem },
                };
            }
        }

        return null;
    } catch {
        return null;
    }
}

const extractFirstImageFromHtml = (html: string | null | undefined) => {
    const source = String(html ?? "");
    const match = source.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1]?.trim() ?? "";
};

const resolveMainItem = (detail: MenuDetailData, slug: string, locale: string): NewsItem | null => {
    const direct = detail.data?.item;
    if (direct) return direct;

    const items = Array.isArray(detail.data?.items) ? detail.data.items : [];
    const found = items.find((item) => {
        const localized = item.multi_slugs?.[locale] || item.slug || "";
        return normalizeSlug(localized) === slug;
    });

    return found ?? (items[0] ?? null);
};

export default async function BrandNewsSlugPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const normalizedSlug = normalizeSlug(slug);

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

    const [menuDetail, headerMenuResponse, footerMenuResponse, settingsResponse, categoriesResponse] = await Promise.all([
        getMenuDetail(normalizedSlug, locale),
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

    if (!menuDetail?.menu) {
        notFound();
    }

    const mainItem = resolveMainItem(menuDetail, normalizedSlug, locale);

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

    const fallbackTitle = normalizeSlugText(normalizedSlug) || "Brand";
    const pageTitle = String(mainItem?.name ?? menuDetail.menu.title ?? menuDetail.menu.name ?? fallbackTitle).trim() || fallbackTitle;
    const pageDescriptionHtml = String(mainItem?.content ?? menuDetail.menu.description ?? menuDetail.data?.content ?? "");

    const bannerImage =
        String(mainItem?.banner ?? mainItem?.main_photo ?? menuDetail.data?.banner ?? menuDetail.data?.main_photo ?? "").trim() ||
        String(mainItem?.files?.find((f) => f?.is_main)?.url ?? mainItem?.files?.[0]?.url ?? "").trim() ||
        extractFirstImageFromHtml(pageDescriptionHtml);

    const relatedProducts = Array.isArray(mainItem?.related_products)
        ? mainItem.related_products
        : (Array.isArray(menuDetail.data?.related_products) ? menuDetail.data.related_products : []);

    return (
        <div className="flex min-h-svh w-full flex-col items-stretch justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={locale}
                languages={langResponse.data}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-2 lg:px-2">
                <div className="relative w-full overflow-hidden rounded-[16px] bg-[#1f2937]">
                    {bannerImage ? (
                        <img src={bannerImage} alt={pageTitle} className="h-[clamp(120px,25vw,300px)] w-full object-cover" />
                    ) : (
                        <div className="h-[clamp(120px,25vw,300px)] w-full bg-gradient-to-r from-[#243447] via-[#31465d] to-[#4a5f74]" />
                    )}

                </div>
            </section>

            <Breadcrumb
                items={[
                    { label: locale === "en" ? "Home" : "Ana sehife", href: `/${locale}` },
                    { label: "Korporativ" },
                    { label: pageTitle, isCurrent: true as const },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2 [&_ul.breadcrumb]:!mb-0 [&_ul.breadcrumb]:!pb-0"
                showTitle
                pageTitle={pageTitle}
                titleClassName="mb-0 !text-left !w-full !text-[39px] !font-[700] !leading-[39px] !text-[rgba(15,15,15,1)]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-7 pb-12 lg:px-2">
                <div className="prose max-w-none">
                    {pageDescriptionHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: pageDescriptionHtml }} />
                    ) : (
                        <p>{pageTitle}</p>
                    )}
                </div>

                {relatedProducts.length > 0 ? (
                    <div className="mt-10">
                        <h3 className="text-[28px] font-semibold leading-tight text-[#0f172a]">Elaqeli mehsullar</h3>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedProducts.map((item, index) => {
                                const variation = item?.variation;
                                const name = variation?.name || `Mehsul ${index + 1}`;
                                const image = variation?.main_image_url || null;
                                const price = variation?.price;
                                return (
                                    <article key={item?.id ?? index} className="overflow-hidden rounded-[12px] border border-[#e6ebf2] bg-white p-4">
                                        {image ? (
                                            <img src={image} alt={name} className="h-[180px] w-full rounded-[8px] object-cover" />
                                        ) : null}
                                        <h4 className="mt-3 text-[16px] font-semibold text-[#0f172a]">{name}</h4>
                                        {price !== undefined && price !== null ? (
                                            <p className="mt-1 text-[15px] text-[#334155]">{String(price)} AZN</p>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </section>

            <LogoutToast />

            <div className="mt-16 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
            </div>
        </div>
    );
}


