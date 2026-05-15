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

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
};

const normalizeSlugText = (value: string) => decodeURIComponent(String(value ?? "")).trim().replace(/[-_]+/g, " ").trim();

type StaticBrandNews = {
    title: string;
    sectionTitle: string;
    description: string;
    bannerImage?: string;
    contentImage?: string;
    blocks?: Array<{
        title: string;
        description: string;
        image?: string;
        imageOnLeft?: boolean;
    }>;
};

const STATIC_BRAND_NEWS: Record<string, StaticBrandNews> = {
    knauf: {
        title: "Knauf",
        sectionTitle: "Knauf",
        description:
            "Knauf tikinti materialları və tikinti sistemlərinin dünya üzrə aparıcı istehsalçısıdır. Bu səhifə korporativ təqdimat üçün statik hazırlanıb və brendin keyfiyyət, innovasiya və dayanıqlılıq yanaşmasını vurğulayır.",
        bannerImage: "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1800&q=80",
        contentImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    },
    "mr-fix": {
        title: "Mr. Fix",
        sectionTitle: "Mr. Fix",
        description:
            "Mr. Fix məhsul xətti üzrə bu statik korporativ səhifə brend haqqında ümumi məlumatı təqdim edir. Burada mərkəzdə brendin etibarlılığı, məhsul keyfiyyəti və tərəfdaşlıq dəyərləri vurğulanır.",
        bannerImage: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1800&q=80",
        contentImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    },
    metak: {
        title: "Metak",
        sectionTitle: "Metak",
        description:
            "Metak tikinti materialları və interyer həlləri istiqamətində fəaliyyət göstərən brenddir. Şirkət keyfiyyət, dayanıqlılıq və praktik həllərə fokuslanaraq peşəkar layihələr üçün geniş məhsul seçimi təqdim edir.",
        bannerImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80",
        contentImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
        blocks: [
            {
                title: "Fəaliyyət sahəsi",
                description:
                    "Metak əsasən interyer və tikinti yönümlü layihələrdə istifadə olunan materiallarla tanınır. Brend həm korporativ, həm də fərdi müştərilər üçün funksional və etibarlı məhsullar təqdim edir.",
                image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
                imageOnLeft: true,
            },
            {
                title: "Keyfiyyət yanaşması",
                description:
                    "Brendin məhsul xətti seçilərkən material keyfiyyəti, uzunömürlülük və montaj rahatlığı əsas meyar kimi götürülür. Bu yanaşma Metak-ın bazarda stabil və etibarlı mövqeyini gücləndirir.",
                image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
                imageOnLeft: false,
            },
        ],
    },
};

export default async function BrandNewsSlugPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const normalizedSlug = decodeURIComponent(String(slug ?? "")).trim().toLowerCase().replace(/^\/+|\/+$/g, "");

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

    const [headerMenuResponse, footerMenuResponse, settingsResponse, categoriesResponse] = await Promise.all([
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

    const fallbackTitle = normalizeSlugText(normalizedSlug) || "Brand";
    const staticEntry = STATIC_BRAND_NEWS[normalizedSlug] ?? {
        title: fallbackTitle,
        sectionTitle: fallbackTitle,
        description:
            `${fallbackTitle} üçün korporativ məlumat səhifəsi statik formada hazırlanıb. Burada brendin ümumi təsviri, təqdimatı və əsas dəyərləri göstərilir.`,
        blocks: [
            {
                title: "Fəaliyyət sahəsi",
                description:
                    `${fallbackTitle} üzrə fəaliyyət sahəsi haqqında məlumat bu bölmədə göstərilir. Brendin əsas istiqamətləri, məhsul yanaşması və bazar təqdimatı məhz bu hissədə toplanır.`,
                image: "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1200&q=80",
                imageOnLeft: true,
            },
        ],
    };

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

            <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] pt-2">
                <div className="relative w-full overflow-hidden rounded-none bg-[#1f2937]">
                    {staticEntry.bannerImage ? (
                        <img src={staticEntry.bannerImage} alt={staticEntry.title} className="h-[220px] w-full object-cover lg:h-[320px]" />
                    ) : (
                        <div className="h-[220px] w-full bg-gradient-to-r from-[#243447] via-[#31465d] to-[#4a5f74] lg:h-[320px]" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-[#0f172abf] via-[#0f172a66] to-[#0f172a33]" />

                    <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2">
                        <div className="flex items-center px-6 lg:px-10">
                            <div className="text-white">
                                <p className="text-[24px] leading-none font-bold lg:text-[50px]">tvim.</p>
                                <p className="mt-2 text-[34px] leading-none font-extrabold tracking-[-0.02em] uppercase lg:text-[78px]">{staticEntry.title}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Breadcrumb
                items={[
                    { label: locale === "en" ? "Home" : "Ana səhifə", href: `/${locale}` },
                    { label: "Korporativ" },
                    { label: staticEntry.title, isCurrent: true as const },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2 [&_ul.breadcrumb]:!mb-0 [&_ul.breadcrumb]:!pb-0"
                showTitle
                pageTitle={staticEntry.title}
                titleClassName="mb-0 !text-left !w-full !text-[39px] !font-[700] !leading-[39px] !text-[rgba(15,15,15,1)]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-7 pb-12 lg:px-2">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
                    <div>
                        <h2 className="text-[34px] leading-[1.2] font-semibold text-[#0f172a]">{staticEntry.sectionTitle}</h2>
                        <p className="mt-5 text-[22px] leading-[1.5] text-[#111827]">{staticEntry.description}</p>
                    </div>

                    <div className="overflow-hidden rounded-[6px] bg-[#eef2f7]">
                        {staticEntry.contentImage ? (
                            <img src={staticEntry.contentImage} alt={staticEntry.title} className="h-full min-h-[260px] w-full object-cover" />
                        ) : (
                            <div className="flex min-h-[260px] items-center justify-center text-[18px] font-medium text-[#64748b]">
                                {staticEntry.title}
                            </div>
                        )}
                    </div>
                </div>

                {(staticEntry.blocks ?? []).map((block, index) => {
                    const imageFirst = block.imageOnLeft !== false;

                    return (
                        <div key={`${block.title}-${index}`} className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {imageFirst ? (
                                <>
                                    <div className="overflow-hidden rounded-[6px] bg-[#eef2f7]">
                                        {block.image ? (
                                            <img src={block.image} alt={block.title} className="h-full min-h-[260px] w-full object-cover" />
                                        ) : (
                                            <div className="flex min-h-[260px] items-center justify-center text-[18px] font-medium text-[#64748b]">
                                                {block.title}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-[42px] leading-[1.15] font-semibold text-[#0f172a]">{block.title}</h3>
                                        <p className="mt-5 text-[20px] leading-[1.55] text-[#111827]">{block.description}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="text-[42px] leading-[1.15] font-semibold text-[#0f172a]">{block.title}</h3>
                                        <p className="mt-5 text-[20px] leading-[1.55] text-[#111827]">{block.description}</p>
                                    </div>
                                    <div className="overflow-hidden rounded-[6px] bg-[#eef2f7]">
                                        {block.image ? (
                                            <img src={block.image} alt={block.title} className="h-full min-h-[260px] w-full object-cover" />
                                        ) : (
                                            <div className="flex min-h-[260px] items-center justify-center text-[18px] font-medium text-[#64748b]">
                                                {block.title}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </section>

            <LogoutToast />

            <div className="mt-16 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
            </div>
        </div>
    );
}
