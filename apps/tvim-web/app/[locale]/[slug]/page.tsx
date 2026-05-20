import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type {
    FooterMenusData,
    HeaderCategoriesResponseData,
    HeaderMenuResponseData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb, type Company } from "@repo/ui";
import BrandListSlider from "@/app/components/BrandListSlider/brand-list-slider";
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
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";

type MenuDetailData = {
    type: string;
    menu: {
        id: number;
        uuid: string;
        type: string;
        view_type: string;
        name: string;
        title: string | null;
        description: string | null;
        link: string;
        multi_links: Record<string, string>;
        seo: any;
        meta_keywords?: any;
    };
    data: {
        mode?: string;
        submit?: {
            method: string;
            path: string;
            route: string;
        };
        fields?: any[];
        items?: Array<{
            id?: number | string;
            slug?: string;
            multi_slugs?: Record<string, string>;
            name?: string;
            content?: string;
            banner?: string | null;
            main_photo?: string | null;
            datetime1?: string | null;
        }>;
        meta_keywords?: any;
        meta?: {
            page?: number;
            per_page?: number;
            total?: number;
            last_page?: number;
            meta_keywords?: any;
        };
        seo?: any;
    };
    included_items?: any[];
};

type Props = {
    params: Promise<{ locale: string; slug: string }>;
};

async function getMenuDetail(slug: string, locale: string) {
    try {
        const response = await api.get<MenuDetailData>(config.endpoints.menus.detail(slug), {
            locale,
        });
        if (response.success && response.data) {
            return response.data;
        }
        return null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, locale } = await params;
    const detail = await getMenuDetail(slug, locale);

    if (!detail) return {};

    const { seo } = detail.menu;

    // Keywords may come from multiple places depending on CMS shape.
    // Support: seo.meta_keywords, detail.data.meta_keywords, detail.data.meta?.meta_keywords
    let rawKeywords: any = seo?.meta_keywords ?? detail.data?.meta_keywords ?? detail.data?.meta?.meta_keywords ?? detail.menu?.meta_keywords;
    if (rawKeywords && typeof rawKeywords === "string") {
        rawKeywords = rawKeywords.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    return {
        title: seo?.meta_title || detail.menu.name,
        description: seo?.meta_description,
        keywords: rawKeywords,
        alternates: {
            canonical: seo?.canonical,
            languages: seo?.alternates?.reduce((acc: any, alt: any) => {
                acc[alt.locale] = alt.url;
                return acc;
            }, {}),
        },
        openGraph: seo?.open_graph ? {
            title: seo.open_graph.title,
            description: seo.open_graph.description,
            url: seo.open_graph.url,
            siteName: seo.open_graph.site_name,
            images: [
                {
                    url: seo.open_graph.image,
                    width: seo.open_graph.image_width,
                    height: seo.open_graph.image_height,
                    alt: seo.open_graph.image_alt,
                },
            ],
            locale: seo.open_graph.locale,
            type: "website",
        } : undefined,
    };
}

export default async function DynamicMenuPage({ params }: Props) {
    const { locale, slug } = await params;
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
        api.get<{ data: Language[] }>(config.endpoints.languages.list),
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

    if (!menuDetail) {
        notFound();
    }

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

    let headerCategoryItems: any[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const items = extractHeaderCategories(categoriesResponse.data);
        const filtered = items.filter(isHeaderEnabledItem);
        headerCategoryItems = filtered.length > 0 ? filtered : items;
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

    const languages = langResponse.success && langResponse.data ? langResponse.data.data : [];

    const { menu, data: pageData } = menuDetail;

    // Normalize keywords for UI and metadata usage
    function normalizeKeywords(raw: any): string[] {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
        if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
        if (typeof raw === "object") {
            if (raw.meta_keywords) return normalizeKeywords(raw.meta_keywords);
            if (raw.keywords) return normalizeKeywords(raw.keywords);
        }
        return [];
    }

    const rawKeywordsSource = menu.seo?.meta_keywords ?? pageData?.meta_keywords ?? pageData?.meta?.meta_keywords ?? menu.meta_keywords;
    const keywordsArr = normalizeKeywords(rawKeywordsSource);

    const isContentView = menu.view_type === "content" || menu.type === "content";

    const includedItems: any[] = menuDetail.included_items || [];
    const gridItems = Array.isArray(pageData?.items) ? pageData.items : [];
    const isGridView = menu.type === "grids" || (pageData?.mode === "list" && gridItems.length > 0);

    function mapIncludedValuesToCompanies(values: any[]) {
        const arr = Array.isArray(values) ? values : [];
        return arr
            .map((v: any, i: number): Company => ({
                id: String(v?.value_id ?? v?.id ?? `company-${i}`),
                name: v?.name ?? v?.title ?? "",
                logo: v?.image ?? v?.image_url ?? v?.logo ?? null,
                url: v?.slug
                    ? (isGridView
                        ? `/${normalizedLocale}/${slug}/${String(v.slug)}`
                        : `/brands/news/${String(v.slug)}`)
                    : (v?.url ?? v?.link ?? v?.website ?? "").toString().trim() || undefined,
            }))
            .filter((c) => Boolean(c.name));
    }

    function stripHtml(input?: string | null) {
        if (!input) return "";
        return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }

    function resolveGridItemHref(item: {
        slug?: string;
        multi_slugs?: Record<string, string>;
    }) {
        const localizedSlug = item.multi_slugs?.[normalizedLocale] || item.slug || "";
        const cleanSlug = String(localizedSlug).trim().replace(/^\/+|\/+$/g, "");
        if (!cleanSlug) return "#";
        return `/${normalizedLocale}/${slug}/${cleanSlug}`;
    }

    function resolveIncludedMenuLink(menuItem: any) {
        const localizedLink = menuItem?.multi_links?.[normalizedLocale] || menuItem?.link || "";
        return String(localizedLink).trim().replace(/^\/+|\/+$/g, "");
    }

    const includedItemsSection = includedItems.length > 0 ? (
        <div className="mt-4 w-full">
            <div className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2">
                {includedItems.map((inc: any, idx: number) => {
                    if (inc.included_type === "menu" && inc.type === "form") {
                        return (
                            <div key={idx} className="mt-4 lg:mt-6">
                                <RequestForm submitConfig={inc.data.submit} fields={inc.data?.fields ?? inc.data?.data?.fields} />
                            </div>
                        );
                    }

                    if (inc.included_type === "brand" && inc.data?.values) {
                        const companies = mapIncludedValuesToCompanies(inc.data.values);
                        if (companies.length === 0) return null;
                        return (
                            <div key={idx} className="mt-4 lg:mt-6">
                                <BrandListSlider companies={companies} />
                            </div>
                        );
                    }

                    if (
                        inc.included_type === "menu" &&
                        inc.type === "grids" &&
                        inc.menu?.view_type === "brand-news" &&
                        Array.isArray(inc.data?.items)
                    ) {
                        const items = inc.data.items as Array<{
                            id?: number | string;
                            slug?: string;
                            multi_slugs?: Record<string, string>;
                            name?: string;
                            content?: string;
                            banner?: string | null;
                            main_photo?: string | null;
                            datetime1?: string | null;
                        }>;

                        const includedMenuLink = resolveIncludedMenuLink(inc.menu);

                        const companies: Company[] = items
                            .map((item, itemIndex) => {
                                const localizedSlug = item.multi_slugs?.[normalizedLocale] || item.slug || "";
                                const cleanSlug = String(localizedSlug).trim().replace(/^\/+|\/+$/g, "");
                                const href = cleanSlug && includedMenuLink
                                    ? `/${normalizedLocale}/${includedMenuLink}/${cleanSlug}`
                                    : "#";
                                const logo = item.main_photo || item.banner || null;
                                return {
                                    id: String(item.id ?? `brand-news-item-${itemIndex}`),
                                    name: item.name || "Brand News",
                                    logo,
                                    url: href,
                                };
                            })
                            .filter((company) => Boolean(company.logo));

                        if (companies.length === 0) return null;

                        return (
                            <section key={idx} className="mt-6 lg:mt-8">
                                <h2 className="mb-4 text-[24px] font-semibold text-[#111827] lg:mb-5 lg:text-[30px]">
                                    {inc.menu?.title || inc.menu?.name || "Brand News"}
                                </h2>
                                <BrandListSlider companies={companies} />
                            </section>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    ) : null;

    if (isGridView) {
        return (
            <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
                <NavbarWrapper
                    logo={navbarLogo}
                    phone={navbarPhone}
                    locale={normalizedLocale}
                    languages={languages}
                    menuItems={headerMenuItems}
                    initialCatalogItems={headerCategoryItems}
                />

                <Breadcrumb
                    items={[
                        { label: normalizedLocale === "en" ? "Home" : "Ana səhifə", href: `/${normalizedLocale}` },
                        { label: menu.name, isCurrent: true },
                    ]}
                    className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                    showTitle
                    pageTitle={menu.title || menu.name}
                    titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
                />

                <section className="mx-auto w-full max-w-[1280px] !px-1 pt-6 pb-10 lg:!px-2 lg:pt-7 lg:pb-12">
                    {gridItems.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {gridItems.map((item, index) => {
                                const href = resolveGridItemHref(item);
                                const image = item.banner || item.main_photo || null;
                                const summary = stripHtml(item.content).slice(0, 170);
                                return (
                                    <Link
                                        key={item.id ?? `${item.slug ?? "grid-item"}-${index}`}
                                        href={href}
                                        className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-[#edf1f6] bg-white shadow-[0_8px_24px_-18px_rgba(15,23,42,0.5)] transition hover:-translate-y-[2px] hover:shadow-[0_14px_30px_-18px_rgba(15,23,42,0.55)]"
                                    >
                                        <div className="h-[210px] w-full overflow-hidden bg-[#f5f7fb]">
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={item.name || menu.name}
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[14px] text-[#8a96a8]">
                                                    TVIM
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col p-4">
                                            <h3 className="line-clamp-2 text-[18px] leading-[1.3] font-semibold text-[#111827]">
                                                {item.name || menu.name}
                                            </h3>
                                            {item.datetime1 ? (
                                                <p className="mt-2 text-[13px] text-[#8a96a8]">{item.datetime1}</p>
                                            ) : null}
                                            {summary ? (
                                                <p className="mt-3 line-clamp-3 text-[14px] leading-[1.45] text-[#4b5563]">{summary}</p>
                                            ) : null}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-[12px] border border-dashed border-[#d9e0ea] bg-[#fafcff] px-4 py-10 text-center text-[15px] text-[#6b7280]">
                            Bu bölmədə hələ kontent yoxdur.
                        </div>
                    )}
                </section>

                {includedItemsSection}

                <LogoutToast />

                <div className="mt-auto w-full pt-12 lg:pt-20">
                    <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
                </div>
            </div>
        );
    }

    if (menu.view_type === "contact") {
        const firstPhone = projectSettings?.general.phones[0]?.number ?? "+994 (50) 828-08-88";
        const email = projectSettings?.general.email || "Info@tvim.az";
        const address = projectSettings?.general.address || "Bakı, Süleyman Sani Axundov 225b";

        return (
            <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
                <NavbarWrapper
                    logo={navbarLogo}
                    phone={navbarPhone}
                    locale={normalizedLocale}
                    languages={languages}
                    menuItems={headerMenuItems}
                    initialCatalogItems={headerCategoryItems}
                />

                <Breadcrumb
                items={[
                    { label: normalizedLocale === "en" ? "Home" : "Ana səhifə", href: `/${normalizedLocale}` },
                    { label: menu.name, isCurrent: true },
                ]}
                className="!max-w-[1280px] mx-auto w-full !px-1 lg:!px-2"
                showTitle
                pageTitle={menu.title || menu.name}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

                <section className="mx-auto w-full max-w-[1280px] pt-6 pb-10 lg:pt-7 lg:pb-12">
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                                <i className="fas fa-phone-alt text-[14px] transform scale-x-[-1]" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#8496ab]">
                                    {normalizedLocale === "en" ? "Call us" : "Bizə zəng edin"}
                                </span>
                                <a className="text-[18px] lg:text-[22px] font-semibold text-black hover:underline" href={`tel:${firstPhone.replace(/[^\d+]/g, "")}`}>
                                    {firstPhone}
                                </a>
                            </div>
                        </article>

                        <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                                <i className="fas fa-envelope text-[14px]" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#8496ab]">
                                    Email
                                </span>
                                <a className="text-[18px] lg:text-[22px] font-semibold text-black hover:underline" href={`mailto:${email}`}>
                                    {email}
                                </a>
                            </div>
                        </article>

                        <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                                <i className="fas fa-map-marker-alt text-[14px]" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-[#8496ab]">
                                    {normalizedLocale === "en" ? "Address" : "Ünvan"}
                                </span>
                                <span className="text-[18px] lg:text-[22px] font-semibold text-black leading-tight">
                                    {address}
                                </span>
                            </div>
                        </article>
                    </div>

                    <div className="mt-8 lg:mt-12">
                        <div className="h-[300px] w-full overflow-hidden rounded-[20px] lg:h-[400px]">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.1477464366063!2d49.82902267657685!3d40.42775615430342!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x403087f978e8741b%3A0x6a1a1b8e4e0d4e5c!2sS%C3%BCleyman%20Sani%20Axundov%2C%20Baku!5e0!3m2!1sen!2saz!4v1715600000000!5m2!1sen!2saz"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>

            
                </section>

                    {includedItems.length > 0 && (
                        <div className="mt-4 w-full">
                            <div className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2">
                                        {includedItems.map((inc: any, idx: number) => {
                                    if (inc.included_type === "menu" && inc.type === "form") {
                                        return (
                                            <div key={idx} className="mt-4 lg:mt-6">
                                                <RequestForm submitConfig={inc.data.submit} fields={inc.data?.fields ?? inc.data?.data?.fields} />
                                            </div>
                                        );
                                    }

                                    if (inc.included_type === "brand" && inc.data?.values) {
                                        const companies = mapIncludedValuesToCompanies(inc.data.values);
                                        if (companies.length === 0) return null;
                                        return (
                                            <div key={idx} className="mt-4 lg:mt-6">
                                                <BrandListSlider companies={companies} />
                                            </div>
                                        );
                                    }

                                    return null;
                                })}
                            </div>
                        </div>
                    )}

                    

                <LogoutToast />

                {keywordsArr.length > 0 && (
                    <div className="mx-auto mt-40 w-full max-w-[1280px]">
                        <div className="w-[calc(100%-56px)] border-t border-[#e5e9ef]" />
                        <div className="pt-4">
                            <div className="flex flex-wrap justify-start gap-2">
                            {keywordsArr.map((kw, i) => (
                                <span
                                    key={i}
                                    className="inline-block rounded-[20px] border border-[#ddd] bg-[#f8f8f8] px-[12px] py-[6px] text-[14px] leading-none font-normal text-[#333] transition-all duration-200 ease-in-out cursor-default"
                                >
                                    {kw}
                                </span>
                            ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-auto w-full pt-12 lg:pt-20">
                    <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
                </div>
            </div>
        );
    }

    // Default view type (fallback for content and others)
    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={normalizedLocale}
                languages={languages}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <Breadcrumb
                items={[
                    { label: normalizedLocale === "en" ? "Home" : "Ana səhifə", href: `/${normalizedLocale}` },
                    { label: menu.name, isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle
                pageTitle={menu.title || menu.name}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            {keywordsArr.length > 0 && (
                null
            )}

            <section className="mx-auto w-full max-w-[1280px] !px-1 pt-2 pb-10 lg:!px-2 lg:pt-3 lg:pb-12">
                <div className="prose max-w-none">
                    {menu.description && (
                        <div dangerouslySetInnerHTML={{ __html: menu.description }} />
                    )}
                </div>

                {pageData?.submit && (
                    <div className="mt-8 lg:mt-12">
                        <RequestForm submitConfig={pageData.submit} />
                    </div>
                )}
            </section>

            {includedItemsSection}

            

            <LogoutToast />

            {keywordsArr.length > 0 && (
                <div className="mx-auto mt-40 w-full max-w-[1280px]">
                    <div className="w-[calc(100%-56px)] border-t border-[#e5e9ef]" />
                    <div className="pt-4">
                        <div className="flex flex-wrap justify-start gap-2">
                            {keywordsArr.map((kw, i) => (
                                <span
                                    key={i}
                                    className="inline-block rounded-[20px] border border-[#ddd] bg-[#f8f8f8] px-[12px] py-[6px] text-[14px] leading-none font-normal text-[#333] transition-all duration-200 ease-in-out cursor-default"
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-auto w-full pt-12 lg:pt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={normalizedLocale} />
            </div>
        </div>
    );
}
