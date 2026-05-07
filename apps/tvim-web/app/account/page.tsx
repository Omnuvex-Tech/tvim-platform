import type { ComponentType } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type {
    FooterMenusData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import {
    Archive,
    Heart,
    LogOut,
    Lock,
    MapPin,
    Package,
    Reply,
    RotateCcw,
    UserRound,
} from "lucide-react";
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

type ActionItem = {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

const FontAwesomeNewspaperIcon = ({ className }: { className?: string }) => (
    <i className={`account-index__icon fa fa-newspaper text-[34px] leading-none ${className ?? ""}`} aria-hidden="true" />
);

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
    { label: "Sifariş tarixçəsi", href: "/account/sifaris-tarixcesi", icon: Package },
    { label: "Hesabı redaktə et", href: "/account/edit", icon: UserRound },
    { label: "Şifrə", href: "/account/password", icon: Lock },
    { label: "Ünvan kitabçası", href: "/account/address", icon: MapPin },
    { label: "Bəyənilənlər", href: "/wishlist", icon: Heart },
    { label: "Geri qaytarma", href: "/account/returns", icon: FontAwesomeReplyIcon },
    { label: "Çıxış", href: "/logout", icon: LogOut },
];

const actionItems: ActionItem[] = [
    { label: "Sifariş tarixçəsi", href: "/account/sifaris-tarixcesi", icon: Archive },
    { label: "Məlumatları redaktə et", href: "/account/edit", icon: UserRound },
    { label: "Şifrəni dəyiş", href: "/account/password", icon: Lock },
    { label: "Ünvan kitabçası", href: "/account/address", icon: MapPin },
    { label: "Bəyənilənlərə düzəliş et", href: "/wishlist", icon: Heart },
    { label: "Geri qaytarma sorğuları", href: "/account/returns", icon: Reply },
    { label: "Xəbər bülleteninə abunə ol / olma", href: "/account/newsletter", icon: FontAwesomeNewspaperIcon },
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

export default async function AccountPage() {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value?.trim().toLowerCase() ?? "";
    const normalizedPreferredLocale = (["az", "ru", "en"].includes(cookieLocale)
        ? cookieLocale
        : "az") as "az" | "ru" | "en";
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);

    if (!authToken) {
        redirect(`/${normalizedPreferredLocale}/signin`);
    }

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

    const supportedLocales = new Set(langResponse.data.map((language) => language.code.toLowerCase()));
    const locale = supportedLocales.has(cookieLocale)
        ? cookieLocale
        : siteDefaultLocale.toLowerCase();

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

            <section className="mx-auto w-full max-w-[1280px] px-5 pt-5 pb-12 sm:px-10 lg:px-0 lg:pt-6 lg:pb-14">
                <nav className="mb-4 flex items-center gap-1.5 text-[11px] text-[#9AA2B1]">
                    <Link href="/" className="hover:text-[#6f7788]">Ana səhifə</Link>
                    <span>»</span>
                    <span>Hesab</span>
                </nav>

                <h1 className="text-[34px] leading-none font-bold tracking-[-0.02em] text-[#0F131A] sm:text-[42px]">
                    Hesabım
                </h1>

                <div className="mt-16 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12">
                    <aside className="w-full max-w-[320px]">
                        <h2 className="-mt-1 pl-6 text-[13px] leading-none font-bold text-[#0F131A] sm:text-[16px]">Naviqasiya</h2>
                        <div className="mt-5 ml-2 border-t border-[#D2D9E4]" />

                        <ul className="mt-0.5 space-y-0.5 pl-6">
                            {navItems.map(({ label, href, icon: Icon }) => {
                                const isActive = label === "Ünvan kitabçası";

                                return (
                                    <li key={label}>
                                        <Link
                                            href={`/${locale}${href}`}
                                            className={`group inline-flex w-full items-center gap-2.5 py-2 text-left text-[14px] font-medium transition-colors ${
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

                    <div className="grid w-full max-w-[900px] justify-self-start grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 md:grid-cols-4 md:gap-x-6 md:gap-y-1 lg:gap-x-8 lg:gap-y-2 2xl:grid-cols-3">
                        {actionItems.map(({ label, href, icon: Icon }) => (
                            <Link
                                href={`/${locale}${href}`}
                                key={label}
                                className="flex flex-col items-center text-center"
                            >
                                <Icon className="size-[34px] text-[#808080]" strokeWidth={1.9} />
                                <p className="mt-3 max-w-[150px] text-[14px] leading-[1.25] font-medium text-[#565F6F]">
                                    {label}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <div className="mx-auto mt-12 w-full max-w-[1280px] px-0 lg:mt-14">
                <RequestForm />
            </div>

            <div className="mt-24 w-full lg:mt-28">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
            </div>
        </div>
    );
}