import type { ComponentType } from "react";
import Link from "next/link";
import type {
    FooterMenusData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import {
    Heart,
    LogOut,
    Lock,
    MapPin,
    Newspaper,
    Package,
    RotateCcw,
    UserRound,
} from "lucide-react";
import { config } from "@/config";
import { api } from "@/lib/api";
import { Footer } from "@/app/components/Footer/footer";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";

type NavItem = {
    label: string;
    icon: ComponentType<{ className?: string }>;
};

type ActionItem = {
    label: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

const navItems: NavItem[] = [
    { label: "Hesabım", icon: UserRound },
    { label: "Sifariş tarixçəsi", icon: Package },
    { label: "Hesabı redaktə et", icon: UserRound },
    { label: "Şifrə", icon: Lock },
    { label: "Ünvan kitabçası", icon: MapPin },
    { label: "Bəyənilənlər", icon: Heart },
    { label: "Geri qaytarma", icon: RotateCcw },
    { label: "Çıxış", icon: LogOut },
];

const actionItems: ActionItem[] = [
    { label: "Sifariş tarixçəsi", icon: Package },
    { label: "Məlumatları redaktə et", icon: UserRound },
    { label: "Şifrəni dəyiş", icon: Lock },
    { label: "Ünvan kitabçası", icon: MapPin },
    { label: "Bəyənilənlərə düzəliş et", icon: Heart },
    { label: "Geri qaytarma sorğuları", icon: RotateCcw },
    { label: "Xəbər bülleteninə abunə ol / olma", icon: Newspaper },
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
    const locale = config.project.defLang;

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);
    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
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
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-3 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={locale}
                languages={langResponse.data}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <section className="w-full rounded-[20px] bg-[#F4F5F7] px-4 pt-4 pb-8 sm:px-8 lg:px-10 lg:pt-6 lg:pb-10">
                <nav className="mb-5 flex items-center gap-2 text-[13px] text-[#8D95A4]">
                    <Link href="/" className="hover:text-[#6f7788]">Ana səhifə</Link>
                    <span>»</span>
                    <span>Hesab</span>
                </nav>

                <h1 className="text-[52px] leading-none font-bold tracking-[-0.02em] text-[#0F131A] sm:text-[54px]">
                    Hesabım
                </h1>

                <div className="mt-8 grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-14">
                    <aside>
                        <h2 className="text-[32px] leading-none font-bold text-[#0F131A]">Naviqasiya</h2>
                        <div className="mt-5 border-t border-[#D2D9E4]" />

                        <ul className="mt-4 space-y-2.5">
                            {navItems.map(({ label, icon: Icon }) => (
                                <li key={label}>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-3 text-left text-[17px] font-semibold text-[#0F131A]"
                                    >
                                        <Icon className="size-5 text-[#707887]" />
                                        <span>{label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    <div className="grid grid-cols-2 gap-x-5 gap-y-14 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
                        {actionItems.map(({ label, icon: Icon }) => (
                            <article key={label} className="flex flex-col items-center text-center">
                                <Icon className="size-[56px] text-[#757575]" strokeWidth={1.8} />
                                <p className="mt-4 max-w-[220px] text-[17px] leading-[1.25] font-semibold text-[#555D6C]">
                                    {label}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
        </div>
    );
}
