import type { ComponentType } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type {
    FooterMenusData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { Heart, LogOut, Lock, MapPin, Package, UserRound } from "lucide-react";
import { config } from "@/config";
import { api } from "@/lib/api";
import { Footer } from "@/app/components/Footer/footer";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";

type NavItem = {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
};

const FontAwesomeReplyIcon = ({ className }: { className?: string }) => (
    <i
        className={`account-index__icon fa fa-reply ${className ?? ""}`}
        style={{
            MozOsxFontSmoothing: "grayscale",
            WebkitFontSmoothing: "antialiased",
            display: "inline-block",
            fontStyle: "normal",
            fontVariant: "normal",
            textRendering: "auto",
            lineHeight: 1,
        }}
        aria-hidden="true"
    />
);

const navItems: NavItem[] = [
    { label: "Hesabım", href: "/account", icon: UserRound },
    { label: "Sifariş tarixçəsi", href: "/account/orders", icon: Package },
    { label: "Hesabı redaktə et", href: "/account/edit", icon: UserRound },
    { label: "Şifrə", href: "/account/password", icon: Lock },
    { label: "Ünvan kitabçası", href: "/account/address", icon: MapPin },
    { label: "Bəyənilənlər", href: "/wishlist", icon: Heart },
    { label: "Geri qaytarma", href: "/account/returns", icon: FontAwesomeReplyIcon },
    { label: "Çıxış", href: "/logout", icon: LogOut },
];

const extractHeaderItems = (rawHeaderData: unknown) => {
    if (Array.isArray(rawHeaderData)) return rawHeaderData;
    if (!rawHeaderData || typeof rawHeaderData !== "object") return [];

    const source = rawHeaderData as Record<string, unknown>;
    if (Array.isArray(source.header)) return source.header;
    if (Array.isArray(source.menus)) return source.menus;
    if (Array.isArray(source.items)) return source.items;
    if (Array.isArray(source.data)) return source.data;
    if (Array.isArray(source.footer)) return source.footer;

    return [];
};

export default async function AccountReturnsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: routeLocale } = await params;
    const locale = routeLocale.trim().toLowerCase();
    const normalizedLocale = (["az", "ru", "en"].includes(locale) ? locale : "az") as "az" | "ru" | "en";
    const homePageMeta = config.pages.home[normalizedLocale];
    const accountPageMeta = config.pages.account[normalizedLocale];

    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    if (!authToken) {
        redirect(`/${locale}/signin`);
    }

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);
    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code.toLowerCase() === locale)) {
        notFound();
    }

    const [footerMenuResponse, settingsResponse, headerMenuResponse, categoriesResponse] = await Promise.all([
        api.get<FooterMenusData>(config.endpoints.menus.list, {
            params: { in_footer: "1" },
            locale,
        }),
        api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            locale,
        }),
        api.get<any>(config.endpoints.menus.list, {
            params: { in_header: "1" },
            locale,
        }),
        api.get<any>("/product/categories", {
            params: { in_header: "1" },
            locale,
        }),
    ]);

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
    const headerItems = extractHeaderItems(rawHeaderData);
    const headerTopLevel = headerItems
        .filter((item: any) => !item || !item.parent_id || Number(item.parent_id) === 0)
        .filter(Boolean);

    const headerMenuItems = headerTopLevel
        .filter((item: any) => (((item.type ?? "") + "").toLowerCase() !== "categories"))
        .map((item: any) => {
            const hrefPart = (item.multi_links && item.multi_links[locale]) || item.link || "";
            const path = hrefPart ? `/${locale}/${String(hrefPart).replace(/^\/+/, "")}` : "#";
            return { label: item.name ?? item.title ?? item.link ?? "", href: path };
        });

    let headerCategoryItems: any[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const raw = categoriesResponse.data;
        let items: any[] = [];
        if (Array.isArray(raw)) items = raw;
        else if (Array.isArray(raw.data)) items = raw.data;
        else if (Array.isArray(raw.items)) items = raw.items;
        else if (raw && typeof raw === "object") {
            const arr = Object.values(raw).find((value) => Array.isArray(value));
            if (Array.isArray(arr)) items = arr as any[];
        }

        const filtered = items.filter(
            (item) =>
                !!item &&
                (item.in_header === true || item.in_header === 1 || item.in_header === "1" || item.in_header === "true")
        );
        headerCategoryItems = filtered.length > 0 ? filtered : items;
    } else {
        headerCategoryItems = headerTopLevel.filter((item: any) => (((item.type ?? "") + "").toLowerCase() === "categories"));
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

    const activeHref = "/account/returns";

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
                    { label: accountPageMeta.name, href: `/${locale}/account` },
                    { label: "Geri qaytar", isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-5 pb-12 lg:px-2 lg:pt-6 lg:pb-14">
                <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
                    <aside className="hidden w-full max-w-[260px] lg:block">
                        <h2 className="-mt-1 px-3 text-[13px] leading-none font-bold text-[#0F131A] sm:text-[16px]">Naviqasiya</h2>
                        <div className="mt-5 border-t border-[#D2D9E4]" />

                        <ul className="mt-0.5 space-y-0.5">
                            {navItems.map(({ label, href, icon: Icon }) => {
                                const isActive = href === activeHref;
                                return (
                                    <li key={label}>
                                        <Link
                                            href={`/${locale}${href}`}
                                            className={`group inline-flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                                                isActive
                                                    ? "bg-[#F0F1F3] text-[#0D47FF]"
                                                    : "text-[#0F131A] hover:bg-[#F0F1F3] hover:text-[#0D47FF]"
                                            }`}
                                        >
                                            <Icon
                                                className={`size-4 transition-colors ${
                                                    isActive
                                                        ? "text-[#0D47FF]"
                                                        : "text-[#707887] group-hover:text-[#0D47FF]"
                                                }`}
                                            />
                                            <span>{label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </aside>

                    <section className="grid min-h-[260px] w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                        <div className="pt-0 lg:pt-0">
                            <h1 className="m-0 mb-[25px] text-[1.8em] leading-tight font-bold text-[var(--h1-c)]">
                                Geri qaytar
                            </h1>
                            <p
                                className="text-[14px] leading-[1.45]"
                                style={{ color: "#000000", fontWeight: 475 }}
                            >
                                Sizin hər hansı geri qaytarma sorğunuz mövcud deyil!
                            </p>
                        </div>

                        <div className="flex justify-start lg:min-w-[180px] lg:justify-end lg:pt-[84px]">
                            <Link
                                href={`/${locale}`}
                                className="inline-flex items-center justify-center rounded-[16px] bg-[#0D47FF] px-[50px] py-[25px] text-[20px] leading-[1px] font-[480] text-white transition-opacity hover:opacity-95"
                            >
                                Davam et
                            </Link>
                        </div>
                    </section>
                </div>
            </section>

            <div className="mx-auto mt-12 w-full max-w-[1280px] px-0 lg:mt-14">
                <RequestForm />
            </div>

            <div className="mt-24 w-full lg:mt-28">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
            </div>
        </div>
    );
}
