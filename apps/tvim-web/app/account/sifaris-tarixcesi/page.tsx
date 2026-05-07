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

export default async function OrderHistoryPage() {
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
    const currentLocale = supportedLocales.has(cookieLocale)
        ? cookieLocale
        : siteDefaultLocale.toLowerCase();

    const footerMenuResponse = await api.get<FooterMenusData>(config.endpoints.menus.list, {
        params: { in_footer: "1" },
        locale: currentLocale,
    });

    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        locale: currentLocale,
    });

    const headerMenuResponse = await api.get<any>(config.endpoints.menus.list, {
        params: { in_header: "1" },
        locale: currentLocale,
    });

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
    const headerItems = extractHeaderItems(rawHeaderData);
    const headerTopLevel = headerItems
        .filter((item: any) => !item || !item.parent_id || Number(item.parent_id) === 0)
        .filter(Boolean);

    const headerMenuItems = headerTopLevel
        .filter((item: any) => (((item.type ?? "") + "").toLowerCase() !== "categories"))
        .map((item: any) => {
            const hrefPart = (item.multi_links && item.multi_links[currentLocale]) || item.link || "";
            const path = hrefPart ? `/${currentLocale}/${String(hrefPart).replace(/^\/+/, "")}` : "#";
            return { label: item.name ?? item.title ?? item.link ?? "", href: path };
        });

    const categoriesResponse = await api.get<any>("/product/categories", {
        params: { in_header: "1" },
        locale: currentLocale,
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
                locale={currentLocale}
                languages={langResponse.data}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <section className="mx-auto w-full max-w-[1280px] px-5 pt-5 pb-12 sm:px-10 lg:px-0 lg:pt-6 lg:pb-14">
                <nav className="mb-4 flex items-center gap-1.5 text-[11px] text-[#9AA2B1]">
                    <Link href={`/${currentLocale}`}>Ana səhifə</Link>
                    <span>»</span>
                    <Link href={`/${currentLocale}/account`}>Hesab</Link>
                    <span>»</span>
                    <span>Sifariş tarixçəsi</span>
                </nav>

                <h1 className="text-[34px] font-bold">Sifariş tarixçəsi</h1>

                <div className="mt-16 grid gap-8 lg:grid-cols-[320px_1fr]">
                    <aside>
                        <div className="inline-block border-b border-[#0F131A] px-5 py-5">
                            <h2
                                className="text-[16px] leading-none font-bold text-[#0F131A]"
                                style={{ fontFamily: "'Twemoji Country Flags'" }}
                            >
                                Naviqasiya
                            </h2>
                        </div>

                        <ul className="mt-0.5 space-y-0.5 pl-5">
                            {navItems.map(({ label, href, icon: Icon }) => {
                                const isActive = label === "Sifariş tarixçəsi";

                                return (
                                    <li key={label}>
                                        <Link href={`/${currentLocale}${href}`}>
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </aside>

                    <div>
                        <div>
                            Sizin hər hansı bir sifarişiniz mövcud deyil!
                        </div>
                    </div>
                </div>
            </section>

            <RequestForm />
            <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
        </div>
    );
}