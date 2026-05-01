import type { Language, Slider, Translation, FooterMenusData, ProjectSettingsData, ProjectSettingsResponseData } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { HomeSlider } from "./components/HomeSlider/home-slider";
import { CategoryStrip, type CategoryStripItem } from "./components/CategoryStrip/category-strip";
import { RequestForm } from "./components/RequestForm/request-form";
import { NavbarWrapper } from "./components/Navbar/navbar-wrapper";
import { Footer } from "./components/Footer/footer";
import { BenefitsStrip } from "./components/BenefitsStrip/benefits-strip";
import { CompanyCarousel } from "@repo/ui";
import mitreapelLogo from "../public/images/mitreapel-logo.jpg";
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
    id?: number;
    title?: string;
    source_type?: string | null;
    source_reference?: string | number | null;
    data?: any;
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
        const secondBlockItems = (mainPageResponse.data[1]?.data?.items ?? []) as MainPageCategoryRawItem[];

        categoryItems = secondBlockItems
            .map((item: MainPageCategoryRawItem) => {
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

    // Default fallback companies (used when API doesn't provide brands)
    let partnerCompanies: { id: string; name: string; logo: any }[] = [
        { id: "1", name: "Mitreapel", logo: mitreapelLogo },
        { id: "2", name: "Mitreapel", logo: mitreapelLogo },
        { id: "3", name: "Mitreapel", logo: mitreapelLogo },
        { id: "4", name: "Mitreapel", logo: mitreapelLogo },
        { id: "5", name: "Mitreapel", logo: mitreapelLogo },
        { id: "6", name: "Mitreapel", logo: mitreapelLogo },
        { id: "7", name: "Mitreapel", logo: mitreapelLogo },
        { id: "8", name: "Mitreapel", logo: mitreapelLogo },
    ];

    // Try to find a brands block in the main page API response and map it
    if (mainPageResponse.success && mainPageResponse.data) {
        const brandsBlock = (mainPageResponse.data as MainPageBlock[]).find((b) =>
            b?.source_type === "brand" ||
            (typeof b?.title === "string" && b.title.toLowerCase().includes("brand")) ||
            b?.data?.filter?.slug === "brand"
        );

        const items = brandsBlock?.data?.items ?? [];

        if (Array.isArray(items) && items.length > 0) {
            partnerCompanies = items
                .map((it: any, idx: number) => ({
                    id: String(it.value_id ?? it.id ?? `company-${idx}`),
                    name: it.name ?? it.title ?? "",
                    logo: it.image ?? mitreapelLogo,
                }))
                .filter((c) => c.name)
                .slice(0, 20);
        }
    }

    // Map product blocks from main page response to pass into product strips
    const productBlocks = (mainPageResponse.success && mainPageResponse.data)
        ? (mainPageResponse.data as MainPageBlock[]).filter((b) => b?.source_type === "product_block")
        : [];

    const specialDiscountBlock = productBlocks.find((b) => String(b?.source_reference) === "1") ??
        productBlocks.find((b) => b?.data?.block?.only_discount_products) ??
        productBlocks.find((b) => typeof b?.title === "string" && b.title.toLowerCase().includes("discount"));

    const selectedBlock = productBlocks.find((b) => String(b?.source_reference) === "2") ??
        productBlocks.find((b) => b?.data?.block?.product_scope === "selected") ??
        productBlocks.find((b) => typeof b?.title === "string" && b.title.toLowerCase().includes("special for you"));

    const latestBlock = productBlocks.find((b) => String(b?.source_reference) === "3") ??
        productBlocks.find((b) => b?.data?.block?.only_new_products) ??
        productBlocks.find((b) => typeof b?.title === "string" && b.title.toLowerCase().includes("latest"));

    const specialDiscountItems = specialDiscountBlock?.data?.items ?? [];
    const selectedItems = selectedBlock?.data?.items ?? [];
    const latestItems = latestBlock?.data?.items ?? [];

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

                {/* Find services block (source_type: show_on_main_page_services) and pass items */}
                <BenefitsStrip items={(mainPageResponse.success && mainPageResponse.data)
                    ? (mainPageResponse.data as MainPageBlock[]).find(b => b?.source_type === 'show_on_main_page_services')?.data?.items
                    : undefined
                } />

                <SpecialDiscountsStrip items={specialDiscountItems} />

                <SelectedForYouStrip items={selectedItems} />

                <LatestProductsStrip items={latestItems} />

                <CompanyCarousel companies={partnerCompanies} />

                <RequestForm />

                <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
            </div>
        );
}