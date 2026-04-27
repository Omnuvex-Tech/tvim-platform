import type { Language, Slider, Translation, FooterMenusData, ProjectSettingsData, ProjectSettingsResponseData } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { HomeSlider } from "./components/HomeSlider/home-slider";
import { CategoryStrip, type CategoryStripItem } from "./components/CategoryStrip/category-strip";
import { RequestForm } from "./components/RequestForm/request-form";
import { NavbarWrapper } from "./components/Navbar/navbar-wrapper";
import { Footer } from "./components/Footer/footer";
import { BenefitsStrip } from "./components/BenefitsStrip/benefits-strip";
import { CompanyCarousel } from "./components/CompanyCarousel";
import { toHref } from "@repo/shared/utils";
import { SpecialDiscountsStrip } from "./components/SpecialDiscountsStrip/special-discounts-strip";
import { SelectedForYouStrip } from "./components/SelectedForYouStrip/selected-for-you-strip";
import { LatestProductsStrip } from "./components/LatestProductsStrip/latest-products-strip";

type MainPageCategoryRawItem = {
    menu: {
        name?: string;
        link?: string;
        icon?: {
            text?: string | null;
            image_url?: string | null;
        };
    };
};

type MainPageBlock = {
    data?: {
        items?: MainPageCategoryRawItem[];
    };
};

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

    const sliderResponse = await api.get<Slider[]>(config.endpoints.sliders.list, {
        locale: siteDefaultLocale,
    });

    const translationResponse = await api.get<Translation[]>(config.endpoints.translations.list, {
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

    let categoryItems: CategoryStripItem[] = [];

    if (mainPageResponse.success && mainPageResponse.data && mainPageResponse.data.length > 1) {
        const secondBlockItems = mainPageResponse.data[1]?.data?.items ?? [];

        categoryItems = secondBlockItems
            .map((item) => {
                const label = item.menu.name?.trim() ?? "";
                const link = item.menu.link?.trim() ?? "";

                if (!label || !link) {
                    return null;
                }

                return {
                    label,
                    href: toHref(link),
                    iconClass: item.menu.icon?.text ?? undefined,
                    iconImageUrl: item.menu.icon?.image_url ?? undefined,
                };
            })
            .filter(Boolean) as CategoryStripItem[];
    }

    const partnerCompanies = [
        { id: "1", name: "Mitreapel", logo: "/images/mitreapel-logo.jpg" },
        { id: "2", name: "Mitreapel", logo: "/images/mitreapel-logo.jpg" },
        { id: "3", name: "Mitreapel", logo: "/images/mitreapel-logo.jpg" },
        { id: "4", name: "Mitreapel", logo: "/images/mitreapel-logo.jpg" },
        { id: "5", name: "Mitreapel", logo: "/images/mitreapel-logo.jpg" },
        { id: "6", name: "Mitreapel", logo: "/images/mitreapel-logo.jpg" },
        { id: "7", name: "Mitreapel", logo: "/images/mitreapel-logo.jpg" },
        { id: "8", name: "Mitreapel", logo: "/images/mitreapel-logo.jpg" },
    ];

    return (
            <div className="flex min-h-svh w-full flex-col items-center justify-start gap-6 pt-0 pb-8">
                <NavbarWrapper 
                    logo={navbarLogo} 
                    phone={navbarPhone} 
                    locale={siteDefaultLocale}
                    languages={langResponse.data}
                />

                <HomeSlider slides={sliderResponse.data ?? []} />

                <CategoryStrip items={categoryItems} />

                <BenefitsStrip />

                <SpecialDiscountsStrip />

                <SelectedForYouStrip />

                <LatestProductsStrip />

                <CompanyCarousel companies={partnerCompanies} />

                <RequestForm />

                <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
            </div>
        );
}