import type {
    FooterMenusData,
    HeaderCategoriesResponseData,
    HeaderMenuResponseData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { notFound } from "next/navigation";
import { Footer } from "@/app/components/Footer/footer";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { config } from "@/config";
import {
    extractHeaderCategories,
    extractHeaderItems,
    isCategoriesMenuType,
    isHeaderEnabledItem,
    isTopLevelHeaderItem,
    resolveHeaderMenuHref,
    resolveHeaderMenuLabel,
} from "@/lib/header-navigation";
import { api } from "@/lib/api";

const contactCopy = {
    az: {
        home: "Ana səhifə",
        page: "Əlaqə",
        callLabel: "Bizə zəng edin",
    },
    ru: {
        home: "Главная",
        page: "Контакты",
        callLabel: "Позвоните нам",
    },
    en: {
        home: "Home",
        page: "Contact",
        callLabel: "Call us",
    },
} as const;

export default async function ContactPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code.toLowerCase() === normalizedLocale)) {
        notFound();
    }

    const footerMenuResponse = await api.get<FooterMenusData>(config.endpoints.menus.list, {
        params: { in_footer: "1" },
        locale: normalizedLocale,
    });

    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        locale: normalizedLocale,
    });

    const headerMenuResponse = await api.get<HeaderMenuResponseData>(config.endpoints.menus.list, {
        params: { in_header: "1" },
        locale: normalizedLocale,
    });

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

    const categoriesResponse = await api.get<HeaderCategoriesResponseData>("/product/categories", {
        params: { in_header: "1" },
        locale: normalizedLocale,
    });

    let headerCategoryItems = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const items = extractHeaderCategories(categoriesResponse.data);
        const filtered = items.filter(isHeaderEnabledItem);
        headerCategoryItems = filtered.length > 0 ? filtered : items;
    } else {
        headerCategoryItems = headerTopLevel.filter(isCategoriesMenuType);
    }

    const footerMenus = footerMenuResponse.success && footerMenuResponse.data ? footerMenuResponse.data.footer : [];

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

    const copy = contactCopy[normalizedLocale as keyof typeof contactCopy] ?? contactCopy.az;
    const firstPhone = projectSettings?.general.phones[0]?.number ?? "+994 (50) 828-08-88";
    const email = projectSettings?.general.email || "info@tvim.az";
    const address = projectSettings?.general.address || "Bakı, Süleyman Sani Axundov 225b";

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={normalizedLocale}
                languages={langResponse.data}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <Breadcrumb
                items={[
                    { label: copy.home, href: `/${normalizedLocale}` },
                    { label: copy.page, isCurrent: true },
                ]}
                className="contact-breadcrumb !max-w-[1280px] !px-1 lg:!px-2 [&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle={copy.page}
                titleClassName="!mt-3 mb-0 !text-left !w-full !text-[28px] lg:!text-[44px]"
            />

            <style>{`
                .contact-breadcrumb .breadcrumb-previous {
                    font-size: 13px;
                    color: rgba(132, 150, 171, 1) !important;
                }

                .contact-breadcrumb .breadcrumb-previous:hover {
                    text-decoration: none;
                    cursor: pointer;
                    outline: none !important;
                }

                .contact-breadcrumb .breadcrumb-current {
                    font-size: 13px;
                    color: rgba(132, 150, 171, 1) !important;
                }

                .contact-breadcrumb .breadcrumb li + li::before {
                    padding: 0 5px;
                    color: #aebccd;
                    font-family: "Font Awesome 6 Free";
                    font-weight: 900;
                    font-size: 0.7em;
                    line-height: 1;
                    content: "\f105";
                }
            `}</style>

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-6 pb-10 lg:px-2 lg:pt-7 lg:pb-12">
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] text-[24px] text-black shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                            <i className="fas fa-phone-alt text-[14px] transform scale-x-[-1]" aria-hidden="true" />
                        </span>
                        <a className="text-[24px] leading-[1.15] font-[500] tracking-[-0.01em] text-black group-hover:underline group-hover:decoration-[2px] group-hover:underline-offset-[1px]" href={`tel:${firstPhone.replace(/[^\d+]/g, "")}`}>
                            {firstPhone}
                        </a>
                    </article>

                    <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] text-[24px] text-black shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                            <i className="fas fa-phone-alt text-[14px] transform scale-x-[-1]" aria-hidden="true" />
                        </span>
                        <p className="text-[24px] leading-[1.15] font-[500] tracking-[-0.01em] text-black group-hover:underline group-hover:decoration-[2px] group-hover:underline-offset-[1px]">{copy.callLabel}</p>
                    </article>

                    <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] text-[24px] text-black shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                            <i className="far fa-envelope text-[14px]" aria-hidden="true" />
                        </span>
                        <a className="text-[24px] leading-[1.15] font-[500] tracking-[-0.01em] text-black group-hover:underline group-hover:decoration-[2px] group-hover:underline-offset-[1px]" href={`mailto:${email}`}>
                            {email}
                        </a>
                    </article>
                </div>

                <div className="mt-5 w-full">
                    <article className="group flex flex-1 items-center justify-start gap-4 rounded-[18px] border border-[#f3f5f8] bg-white p-[26px] text-[24px] text-black shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6ebf3] bg-[#f5f8ff] text-[#1d6dff]">
                            <i className="fas fa-map-pin text-[14px]" aria-hidden="true" />
                        </span>
                        <p className="text-[24px] leading-[1.15] font-[500] tracking-[-0.01em] text-black group-hover:underline group-hover:decoration-[2px] group-hover:underline-offset-[1px]">{address}</p>
                    </article>
                </div>

                <div className="mt-6 w-full overflow-hidden rounded-[18px] border border-[#f3f5f8] bg-white shadow-[0_10px_14px_-14px_rgba(15,23,42,0.18)]">
                    <iframe
                        title="TVIM Map"
                        src="https://maps.google.com/maps?q=Bakı%2C%20Süleyman%20Sani%20Axundov%20225b&t=&z=15&ie=UTF8&iwloc=&output=embed"
                        className="h-[420px] w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                    />
                </div>
            </section>

            <div className="mx-auto mt-10 w-full max-w-[1280px] px-0 lg:mt-12">
                <RequestForm />
            </div>

            <div className="mt-8 w-full lg:mt-12">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
            </div>
        </div>
    );
}
