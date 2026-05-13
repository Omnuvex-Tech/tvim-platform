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

const corporateCopy = {
    az: {
        home: "Ana səhifə",
        page: "Korporativ",
    },
    ru: {
        home: "Главная",
        page: "Корпоратив",
    },
    en: {
        home: "Home",
        page: "Corporate",
    },
} as const;

const corporateBrands = [
    { name: "Knauf", accent: "#1199dd" },
    { name: "Soudal", accent: "#d9272e" },
    { name: "Hekim Yapi", accent: "#e1242a" },
    { name: "Bosch", accent: "#cf0a2c" },
    { name: "IZOSPAN", accent: "#b61f2d" },
    { name: "Holcim", accent: "#6c6c6c" },
    { name: "Dalsan", accent: "#dd1f25" },
    { name: "Mapei", accent: "#1189d2" },
] as const;

const corporateContentCopy = {
    az: {
        partnersTitle: "Tərəfdaşlarımız",
        partnersParagraphs: [
            "TVİM olaraq uğurumuz etibarlı tərəfdaşlarla qurduğumuz güclü əməkdaşlığa əsaslanır. Yerli və beynəlxalq istehsalçıların məhsullarını həm onlayn e-ticarət platformamız, həm də fiziki satış nöqtəmiz vasitəsilə təqdim edirik. Biz topdansatış tikinti materialları sahəsində ixtisaslaşmış bir şirkət olaraq, hər ölçüdə biznes üçün çevik və etibarlı həllər təklif edirik.",
            "TVİM, topdan tikinti materialları üçün Bakı ərazisində keyfiyyətli və geniş çeşidli məhsullar təqdim edərək, fərqli ehtiyaclara cavab verən müştəri portfeli formalaşdırmışdır.",
            "Eyni zamanda, topdan tikinti materialları sifarişi vermək istəyən şirkətlər üçün sürətli və şəffaf təchizat prosesləri ilə seçilirik.",
            "Podratçılar üçün tikinti materialları sahəsində seçimlərimizi genişləndirərək, müxtəlif layihələrə uyğun məhsullar təqdim edirik. Korporativ yönümlü yanaşmamızla, korporativ müştərilər üçün tikinti materialları üzrə xüsusi təkliflər və fərdi qiymətləndirmələr aparırıq.",
            "Bundan əlavə, şirkətlər üçün tikinti materialları kateqoriyasında stabil qiymət siyasəti və uzunmüddətli əməkdaşlıq modelləri təklif edirik. Məqsədimiz — tərəfdaşlarımızla birlikdə müştərilərimizə dəyərli seçimlər, effektiv xidmət və güvənli alış təcrübəsi təqdim etməkdir.",
        ],
        servicesTitle: "Bizim Xidmətlərimiz",
        servicesParagraphs: [
            "Toplu Alış Endirimləri - Böyük həcmdə sifarişlərlə, biznesiniz üçün əhəmiyyətli endirimlər əldə edirsiniz. Müştərilərimiz topdan tikinti materialları sifariş edərək həm büdcəyə qənaət edir, həm də sürətli və problemsiz təchizatın üstünlüklərindən yararlanır.",
            "TVİM ilə çalışaraq toplu alışlarınızda böyük qənaət edin.",
        ],
    },
    ru: {
        partnersTitle: "Наши партнеры",
        partnersParagraphs: [
            "Мы строим надежные партнерские отношения с местными и международными производителями и предлагаем гибкие решения для корпоративных клиентов.",
        ],
        servicesTitle: "Наши услуги",
        servicesParagraphs: ["Выгодные условия оптовых закупок и стабильные поставки для бизнеса."],
    },
    en: {
        partnersTitle: "Our Partners",
        partnersParagraphs: [
            "We build reliable cooperation with local and international manufacturers and provide flexible B2B supply solutions.",
        ],
        servicesTitle: "Our Services",
        servicesParagraphs: ["Bulk purchase advantages and stable supply terms for business clients."],
    },
} as const;

export default async function CorporatePage({
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

    const copy = corporateCopy[normalizedLocale as keyof typeof corporateCopy] ?? corporateCopy.az;
    const contentCopy =
        corporateContentCopy[normalizedLocale as keyof typeof corporateContentCopy] ?? corporateContentCopy.az;

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
                className="corporate-breadcrumb [&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0 [&_ul.breadcrumb]:mx-auto [&_ul.breadcrumb]:max-w-[980px]"
                showTitle
                pageTitle={copy.page}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !max-w-[980px] !mx-auto !text-[24px] lg:!text-[39px]"
            />

            <style>{`
                .corporate-breadcrumb .breadcrumb-previous {
                    font-size: 13px;
                    color: rgba(132, 150, 171, 1) !important;
                }

                .corporate-breadcrumb .breadcrumb-previous:hover {
                    text-decoration: none;
                    cursor: pointer;
                    outline: none !important;
                }

                .corporate-breadcrumb .breadcrumb-current {
                    font-size: 13px;
                    color: rgba(132, 150, 171, 1) !important;
                }

                .corporate-breadcrumb .breadcrumb li + li::before {
                    padding: 0 5px;
                    color: #aebccd;
                    font-family: "Font Awesome 6 Free";
                    font-weight: 900;
                    font-size: 0.7em;
                    line-height: 1;
                    content: "\f105";
                }
            `}</style>

            <section className="mx-auto w-full max-w-[1280px] px-0 pt-6 pb-12 lg:pt-7 lg:pb-14">
                <div className="mx-auto grid w-full max-w-[980px] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
                    {corporateBrands.map((brand) => (
                        <article
                            key={brand.name}
                            className="flex h-[146px] items-center justify-center rounded-[12px] bg-white px-4 shadow-[0_10px_14px_-14px_rgba(15,23,42,0.24)] transition-shadow duration-200 ease-out hover:shadow-[inset_1px_0_0_#e9edf3,inset_-1px_0_0_#e9edf3,inset_0_-1px_0_#e9edf3,0_16px_24px_-16px_rgba(15,23,42,0.28)]"
                        >
                            <span
                                className="text-center text-[24px] leading-none font-extrabold tracking-[-0.02em] uppercase"
                                style={{ color: brand.accent }}
                            >
                                {brand.name}
                            </span>
                        </article>
                    ))}
                </div>

                <div className="mx-auto mt-10 w-full max-w-[980px] text-[#141a24]">
                    <h2 className="text-[24px] font-[700] leading-[1.2] tracking-[-0.01em] lg:text-[32px]">{contentCopy.partnersTitle}</h2>
                    <div className="corporate-body-text mt-4 space-y-3 leading-[1.42] text-[#1e2531]">
                        {contentCopy.partnersParagraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>

                    <h3 className="mt-8 text-[24px] font-[700] leading-[1.2] tracking-[-0.01em] lg:text-[32px]">{contentCopy.servicesTitle}</h3>
                    <div className="corporate-body-text mt-3 space-y-3 leading-[1.42] text-[#1e2531]">
                        {contentCopy.servicesParagraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </section>

            <style>{`
                .corporate-body-text {
                    font-variant-numeric: normal;
                    font-variant-east-asian: normal;
                    font-variant-alternates: normal;
                    font-variant-position: normal;
                    font-variant-emoji: normal;
                    vertical-align: baseline;
                    font-size: 18px;
                }
            `}</style>

            <div className="mx-auto mt-10 w-full max-w-[1280px] px-0 lg:mt-12">
                <RequestForm />
            </div>

            <div className="mt-8 w-full lg:mt-12">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
            </div>
        </div>
    );
}
