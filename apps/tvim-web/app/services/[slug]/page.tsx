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
import { Breadcrumb, type Company } from "@repo/ui";
import BrandListSlider from "@/app/components/BrandListSlider/brand-list-slider";
import { Footer } from "@/app/components/Footer/footer";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { LogoutToast } from "@/app/components/LogoutToast/logout-toast";
import { RequestForm } from "@/app/components/RequestForm/request-form";
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
import type { RequestFormSubmitConfig } from "@repo/types/types";

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

type MenuDetailData = {
    menu?: {
        type?: string;
        view_type?: string;
        name?: string;
        title?: string | null;
        description?: string | null;
        seo?: {
            meta_keywords?: string | string[];
        };
    };
    data?: {
        submit?: {
            method?: string;
            path?: string;
            route?: string;
        };
    };
    included_items?: any[];
};

type StaticServiceContent = {
    title: string;
    pageTitle?: string;
    introTitle?: string;
    introText?: string;
    detailsTitle?: string;
    details: string[];
    bannerImage?: string;
};

const STATIC_SERVICE_CONTENT: Record<string, StaticServiceContent> = {
    "bonus-kartlari": {
        title: "Bonus kartları",
        pageTitle: "Bonus cards",
        introTitle: "Earn More from Your Shopping with Our Bonus Cards!",
        introText:
            "Bonus kartları ilə alış-veriş etdikcə əlavə üstünlüklər qazanın. Hər alışda bonus toplayın, növbəti sifarişlərdə istifadə edin və daha sərfəli alış imkanlarından yararlanın.",
        detailsTitle: "Bonus kartının üstünlükləri",
        details: [
            "Hər alışda bonus faizi toplanır və növbəti sifarişlərdə istifadə edilir.",
            "Bonuslar bütün TVİM mağazalarında və uyğun məhsul qruplarında keçərlidir.",
            "Xüsusi kampaniya günlərində bonus qazanma faizi daha yüksək olur.",
        ],
        bannerImage: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1920&q=80",
    },
    "pulsuz-catdirilma": {
        title: "Pulsuz çatdırılma",
        pageTitle: "Free delivery",
        introTitle: "Pulsuz çatdırılma xidməti",
        introText:
            "200 AZN və yuxarı sifarişlər üçün pulsuz çatdırılma xidməti təqdim olunur. Sifarişiniz operativ şəkildə ünvanınıza çatdırılır.",
        detailsTitle: "Şərtlər",
        details: [
            "Minimum sifariş məbləği: 200 AZN.",
            "Çatdırılma vaxtı bölgədən asılı olaraq dəyişə bilər.",
            "Bəzi iri həcmli məhsullar üçün əlavə logistika qaydaları tətbiq edilə bilər.",
            "Çatdırılma zamanı məhsulun bütövlüyü və sifariş uyğunluğu komanda tərəfindən yoxlanılır.",
        ],
        bannerImage: "https://images.unsplash.com/photo-1614018453562-77f6180d18da?auto=format&fit=crop&w=1920&q=80",
    },
    geriqaytarma: {
        title: "Geriqaytarma",
        pageTitle: "Returns",
        introTitle: "14 gün geri qaytarma imkanı",
        introText:
            "Məhsulu təhvil aldıqdan sonra 14 gün ərzində müəyyən şərtlərlə geri qaytarmaq mümkündür.",
        detailsTitle: "Qaydalar",
        details: [
            "Məhsul istifadə olunmamış və ilkin vəziyyətdə olmalıdır.",
            "Qablaşdırma və qəbz mütləq təqdim edilməlidir.",
            "Qaytarma qərarı yoxlanışdan sonra təsdiqlənir.",
            "Texniki məhsullarda geri qaytarma istehsalçı qaydalarına uyğun olaraq qiymətləndirilir.",
        ],
        bannerImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1920&q=80",
    },
    "korporativ-satis": {
        title: "Korporativ satış",
        pageTitle: "Corporate sales",
        introTitle: "Korporativ müştərilər üçün xüsusi həllər",
        introText:
            "Şirkətlər üçün fərdi qiymət təklifləri, toplu alış üstünlükləri və uzunmüddətli əməkdaşlıq modelləri təqdim edilir.",
        detailsTitle: "Nələr təqdim olunur",
        details: [
            "Toplu alış üçün fərdi qiymətləndirmə.",
            "Müqavilə əsasında davamlı tədarük.",
            "Sürətli logistika və satış sonrası dəstək.",
            "Layihə yönümlü sifarişlər üçün fərdi menecer dəstəyi.",
        ],
        bannerImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80",
    },
};

function resolveStaticServiceContent(slug: string): StaticServiceContent | undefined {
    const exact = STATIC_SERVICE_CONTENT[slug];
    if (exact) return exact;

    const normalized = slug
        .toLowerCase()
        .replace(/ə/g, "e")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ğ/g, "g")
        .replace(/ş/g, "s")
        .replace(/ç/g, "c");

    if (normalized.includes("bonus") || normalized.includes("kart")) {
        return STATIC_SERVICE_CONTENT["bonus-kartlari"];
    }

    if (normalized.includes("catdir")) {
        return STATIC_SERVICE_CONTENT["pulsuz-catdirilma"];
    }

    if (normalized.includes("geri") || normalized.includes("qaytar") || normalized.includes("deyisdir")) {
        return STATIC_SERVICE_CONTENT.geriqaytarma;
    }

    if (normalized.includes("korporativ") || normalized.includes("satis")) {
        return STATIC_SERVICE_CONTENT["korporativ-satis"];
    }

    return undefined;
}

function normalizeSubmitConfig(value: any): RequestFormSubmitConfig | undefined {
    if (!value || typeof value !== "object") return undefined;
    const path = typeof value.path === "string" ? value.path.trim() : "";
    if (!path) return undefined;
    return {
        path,
        method: typeof value.method === "string" ? value.method : undefined,
    };
}

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number])
        ? normalized
        : config.project.defLang;
};

async function getMenuDetail(slug: string, locale: string) {
    try {
        const response = await api.get<any>(config.endpoints.menus.detail(slug), { locale });
        if (!response.success || !response.data) return null;

        const payload = response.data;
        if (payload && typeof payload === "object" && payload.menu) {
            return payload as MenuDetailData;
        }

        if (payload && typeof payload === "object" && payload.data?.menu) {
            return payload.data as MenuDetailData;
        }

        return null;
    } catch {
        return null;
    }
}

function mapIncludedValuesToCompanies(values: any[]) {
    const arr = Array.isArray(values) ? values : [];
    return arr
        .map((v: any, i: number): Company => ({
            id: String(v?.value_id ?? v?.id ?? `company-${i}`),
            name: v?.name ?? v?.title ?? "",
            logo: v?.image ?? v?.image_url ?? v?.logo ?? null,
            url: v?.slug
                ? `/brands/news/${String(v.slug)}`
                : (v?.url ?? v?.link ?? v?.website ?? "").toString().trim() || undefined,
        }))
        .filter((c) => Boolean(c.name));
}

export default async function ServiceSlugPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const normalizedSlug = decodeURIComponent(String(slug ?? ""))
        .trim()
        .toLowerCase()
        .replace(/^\/+|\/+$/g, "");

    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value ?? "";
    const locale = normalizeLocale(cookieLocale || config.project.defLang);

    const [
        menuDetail,
        langResponse,
        headerMenuResponse,
        footerMenuResponse,
        settingsResponse,
        categoriesResponse,
    ] = await Promise.all([
        getMenuDetail(normalizedSlug, locale),
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
            locale,
        }),
        api.get<HeaderCategoriesResponseData>("/product/categories", {
            params: { in_header: "1" },
            locale,
        }),
    ]);

    const staticContent = resolveStaticServiceContent(normalizedSlug);

    if ((!menuDetail?.menu && !staticContent) || !langResponse.success || !langResponse.data) {
        notFound();
    }

    const menu = menuDetail?.menu;
    const pageData = menuDetail?.data;
    const includedItems = Array.isArray(menuDetail?.included_items) ? menuDetail.included_items : [];
    const pageSubmitConfig = normalizeSubmitConfig(pageData?.submit);

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

    const pageTitle = staticContent?.pageTitle || staticContent?.title || menu?.title || menu?.name || "Service";
    const keywordsRaw = menu?.seo?.meta_keywords;
    const keywords = Array.isArray(keywordsRaw)
        ? keywordsRaw.filter(Boolean).map(String)
        : typeof keywordsRaw === "string"
            ? keywordsRaw.split(",").map((item) => item.trim()).filter(Boolean)
            : [];

    const fallbackTitle = normalizedSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const currentTitle = staticContent?.title || menu?.name || fallbackTitle;

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
                    { label: locale === "en" ? "Home" : "Ana səhifə", href: `/${locale}` },
                    { label: locale === "en" ? "Services" : "Xidmətlər" },
                    { label: currentTitle || "Service", isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle
                pageTitle={pageTitle}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[40px]"
            />

            <section className="mx-auto w-full max-w-[1280px] !px-1 pt-2 pb-10 lg:!px-2 lg:pt-3 lg:pb-12">
                {staticContent ? (
                    <div className="space-y-7">
                        <div className="overflow-hidden rounded-[8px] bg-[#1236d6]">
                            {staticContent.bannerImage ? (
                                <img src={staticContent.bannerImage} alt={staticContent.title} className="h-[260px] w-full object-cover lg:h-[520px]" />
                            ) : (
                                <div className="flex h-[260px] w-full items-center bg-gradient-to-r from-[#1432c9] via-[#1a41ef] to-[#2944c6] px-8 lg:h-[520px]">
                                    <div>
                                        <p className="text-[24px] leading-none font-bold text-white lg:text-[42px]">tvim.</p>
                                        <p className="mt-3 text-[30px] leading-tight font-extrabold text-[#ffe044] uppercase lg:text-[68px]">{staticContent.title}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {staticContent.introTitle ? (
                            <h2 className="text-[24px] leading-[1.25] font-bold text-[#111827] lg:text-[36px]">{staticContent.introTitle}</h2>
                        ) : null}

                        {staticContent.introText ? (
                            <p className="max-w-none text-[16px] leading-[1.65] text-[#1f2937] lg:text-[20px]">{staticContent.introText}</p>
                        ) : null}

                        <div className="border-t border-[#e5e7eb] pt-5">
                            <h3 className="text-[22px] leading-[1.25] font-bold text-[#111827] lg:text-[32px]">{staticContent.detailsTitle}</h3>
                            <ul className="mt-4 space-y-3">
                                {staticContent.details.map((item, index) => (
                                    <li key={index} className="relative pl-7 text-[16px] leading-[1.6] text-[#1f2937] lg:text-[18px]">
                                        <span className="absolute top-[10px] left-0 h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="prose max-w-none">
                        {menu?.description ? (
                            <div dangerouslySetInnerHTML={{ __html: menu.description }} />
                        ) : (
                            <p>Xidmət haqqında məlumat tezliklə əlavə olunacaq.</p>
                        )}
                    </div>
                )}

                {(staticContent || pageSubmitConfig) ? (
                    <div className="mt-8 lg:mt-12">
                        <RequestForm submitConfig={pageSubmitConfig} />
                    </div>
                ) : null}
            </section>

            {includedItems.length > 0 ? (
                <div className="mt-4 w-full">
                    <div className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2">
                        {includedItems.map((inc: any, idx: number) => {
                            const includedSubmitConfig = normalizeSubmitConfig(inc?.data?.submit);

                            if (inc.included_type === "menu" && inc.type === "form" && includedSubmitConfig) {
                                return (
                                    <div key={idx} className="mt-4 lg:mt-6">
                                        <RequestForm submitConfig={includedSubmitConfig} />
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
            ) : null}

            <LogoutToast />

            {keywords.length > 0 ? (
                <div className="mx-auto mt-40 w-full max-w-[1280px]">
                    <div className="w-[calc(100%-56px)] border-t border-[#e5e9ef]" />
                    <div className="pt-4">
                        <div className="flex flex-wrap justify-start gap-2">
                            {keywords.map((kw, i) => (
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
            ) : null}

            <div className="mt-12 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
            </div>
        </div>
    );
}
