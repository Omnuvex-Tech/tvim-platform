import { notFound } from "next/navigation";
import type {
    FooterMenusData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";
import { VerificationForm } from "./verification-form";

export default async function RegisterVerificationPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ email?: string; flow?: string }>;
}) {
    const { locale } = await params;
    const normalizedLocale = (["az", "ru", "en"].includes(locale.toLowerCase())
        ? locale.toLowerCase()
        : "az") as "az" | "ru" | "en";
    const query = await searchParams;
    const email = typeof query.email === "string" ? query.email : "";
    const flow = query.flow === "forgot" ? "forgot" : "signup";
    const homePageMeta = config.pages.home[normalizedLocale];

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code === locale)) {
        notFound();
    }

    const footerMenuResponse = await api.get<FooterMenusData>(config.endpoints.menus.list, {
        params: { in_footer: "1" },
        locale,
    });

    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        locale,
    });

    const headerMenuResponse = await api.get<any>(config.endpoints.menus.list, {
        params: { in_header: "1" },
        locale,
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
            const hrefPart = (it.multi_links && it.multi_links[locale.toLowerCase()]) || it.link || "";
            const path = hrefPart ? `/${locale.toLowerCase()}/${String(hrefPart).replace(/^\/+/, "")}` : "#";
            return { label: it.name ?? it.title ?? it.link ?? "", href: path };
        });

    const categoriesResponse = await api.get<any>("/product/categories", {
        params: { in_header: "1" },
        locale,
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

        const filtered = items.filter(
            (it) =>
                !!it &&
                (it.in_header === true || it.in_header === 1 || it.in_header === "1" || it.in_header === "true")
        );
        headerCategoryItems = filtered.length > 0 ? filtered : items;
    } else {
        headerCategoryItems = headerTopLevel.filter((it: any) => (((it.type ?? "") + "").toString().toLowerCase() === "categories"));
    }

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
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: "Kod təsdiqi", isCurrent: true },
                ]}
            />

            <section className="w-full rounded-[20px] bg-white px-4 pt-3 pb-8 sm:px-8 sm:pt-4 sm:pb-10 lg:px-12">
                <div className="mx-auto w-full max-w-[560px]">
                    <h1 className="text-center text-[46px] leading-none font-bold tracking-[-0.02em] text-[#000000] sm:text-[52px]">Kod təsdiqi</h1>
                    <p className="mx-auto mt-4 max-w-[520px] text-center text-[15px] leading-[1.4] text-[#6f7786]">
                        Qeydiyyatı tamamlamaq üçün sizə göndərilən 4 rəqəmli kodu daxil edin.
                    </p>

                    <VerificationForm locale={locale} email={email} flow={flow} />
                </div>
            </section>

            <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
        </div>
    );
}