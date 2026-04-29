"use client";

import { type ReactNode, useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
    ChevronDown,
    GitCompareArrows,
    Grid2X2,
    Heart,
    Menu,
    Search,
    ShoppingCart,
    UserRound,
    PhoneCall,
    X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { Language } from "@repo/types/types";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { cn } from "../../lib/utils";

const navbarClasses = {
    root: "w-full overflow-x-clip bg-white font-[family-name:var(--font-inter)]",
    container: "mx-auto flex w-full max-w-[1280px] flex-col",
    topRow: "flex items-center gap-1.5 py-3.5 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-5",
    bottomRow: "hidden items-center gap-5 py-2.5 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-6",
};

export interface NavbarMenuItem {
    label: string;
    href: string;
}

export interface NavbarProps {
    className?: string;
    searchPlaceholder?: string;
    menuItems?: NavbarMenuItem[];
    phone?: string;
    locale?: string;
    logo?: ReactNode;
    logoHref?: string;
    languages?: Language[];
    defLang?: string;
    onLocaleChange?: (locale: string) => void;
}

const defaultMenuItems: NavbarMenuItem[] = [
    { label: "Onlayn Sifariş", href: "#" },
    { label: "Korporativ", href: "#" },
    { label: "Haqqımızda", href: "#" },
    { label: "Əlaqə", href: "#" },
];

const localeOptions = [
    { code: "AZ", country: "AZ" },
    { code: "EN", country: "GB" },
    { code: "RU", country: "RU" },
];
const defaultLocaleOption = localeOptions[0]!;

const defaultLanguages: Language[] = [
    { id: 1, code: "az", name: "Azerbaijani", native_name: "AZ", is_rtl: false, is_default_admin: false, is_default_site: true, is_required: true, sort_order: 1 },
    { id: 2, code: "en", name: "English", native_name: "EN", is_rtl: false, is_default_admin: false, is_default_site: false, is_required: false, sort_order: 2 },
    { id: 3, code: "ru", name: "Russian", native_name: "RU", is_rtl: false, is_default_admin: false, is_default_site: false, is_required: false, sort_order: 3 },
];

function sanitizePhone(phone: string) {
    return phone.replace(/\s|\(|\)|-/g, "");
}

function toWhatsappHref(phone: string) {
    return `https://wa.me/${sanitizePhone(phone).replace(/^\+/, "")}`;
}

function PhoneHandsetIcon() {
    return <PhoneCall className="size-[18px] text-[#12151D] stroke-[2.5]" />;
}

function LocaleFlag({ country }: { country: string }) {
    if (country === "GB") {
        return (
            <svg viewBox="0 0 22 14" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="22" height="14" fill="#012169" />
                <path d="M0 0l22 14M22 0 0 14" stroke="#fff" strokeWidth="3" />
                <path d="M0 0l22 14M22 0 0 14" stroke="#C8102E" strokeWidth="1.5" />
                <path d="M11 0v14M0 7h22" stroke="#fff" strokeWidth="4" />
                <path d="M11 0v14M0 7h22" stroke="#C8102E" strokeWidth="2" />
            </svg>
        );
    }

    if (country === "RU") {
        return (
            <svg viewBox="0 0 22 14" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="22" height="14" fill="#fff" />
                <rect y="4.666" width="22" height="4.666" fill="#0039A6" />
                <rect y="9.332" width="22" height="4.668" fill="#D52B1E" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 22 14" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="22" height="14" fill="#0099E6" />
            <rect y="4.666" width="22" height="4.666" fill="#ED2939" />
            <rect y="9.332" width="22" height="4.668" fill="#3F9C35" />
            <circle cx="10.2" cy="7" r="2.15" fill="#fff" />
            <circle cx="10.9" cy="7" r="1.75" fill="#ED2939" />
            <path d="M13.72 5.72l.24.73h.77l-.62.45.24.74-.63-.46-.62.46.24-.74-.62-.45h.77l.23-.73Z" fill="#fff" />
        </svg>
    );
}

function NavbarLogo({ logo, logoHref = "#" }: { logo?: ReactNode; logoHref?: string }) {
    return (
        <a href={logoHref} className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer lg:min-w-[240px] lg:flex-none lg:gap-2.5">
            <span className="flex min-w-0 shrink overflow-hidden [&_img]:h-8 [&_img]:w-auto [&_img]:max-w-[110px] sm:[&_img]:h-10 sm:[&_img]:max-w-[145px] lg:[&_img]:h-14 lg:[&_img]:max-w-none">
                {logo ?? null}
            </span>
            <span className="hidden text-[14px] leading-none font-normal whitespace-nowrap text-[#616672] sm:inline">
                Tikinti və inşaat materialları
            </span>
        </a>
    );
}

function NavbarSearch({ searchPlaceholder, compact = false }: { searchPlaceholder: string; compact?: boolean }) {
    return (
        <div className="relative min-w-0 flex-1 lg:mx-auto lg:w-full lg:max-w-[470px]">
            <input
                type="text"
                placeholder={searchPlaceholder}
                className={cn(
                    "w-full text-[#343943] outline-none placeholder:text-[#8a91a0]",
                    compact
                        ? "h-9 rounded-[12px] bg-white pl-4 pr-9 text-[13px]"
                        : "h-12 rounded-full bg-[#eef2f9] pl-5 pr-10 text-[14px]"
                )}
            />
            <Search className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8b91a0]",
                compact ? "right-3 size-[14px]" : "right-3.5 size-[16px]"
            )} />
        </div>
    );
}

function NavbarContact({ 
    phone, 
    locale, 
    languages, 
    defLang, 
    onLocaleChange 
}: { 
    phone: string; 
    locale: string;
    languages?: Language[];
    defLang?: string;
    onLocaleChange?: (locale: string) => void;
}) {
    const [isLocaleOpen, setIsLocaleOpen] = useState(false);
    const [selectedLocale, setSelectedLocale] = useState((locale || "AZ").toUpperCase());
    const activeLocale = useMemo(
        () => localeOptions.find((item) => item.code === selectedLocale) ?? defaultLocaleOption,
        [selectedLocale],
    );

    const effectiveLanguages = languages || defaultLanguages;
    const effectiveDefLang = defLang || "az";

    return (
        <div className="ml-auto flex items-center gap-4 lg:ml-0 lg:justify-self-end">
            <a href={`tel:${sanitizePhone(phone)}`} className="flex cursor-pointer items-center gap-2 text-[17px] leading-none font-bold text-[#12151d]">
                <PhoneHandsetIcon />
                <span>{phone}</span>
            </a>

            {languages && onLocaleChange ? (
                <LanguageSwitcher
                    languages={effectiveLanguages}
                    defLang={effectiveDefLang}
                    locale={selectedLocale.toLowerCase()}
                    onLocaleChange={(newLocale: string) => {
                        setSelectedLocale(newLocale.toUpperCase());
                        onLocaleChange(newLocale);
                    }}
                    variant="desktop"
                />
            ) : (
                <div className="relative">
                    <button
                        type="button"
                        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[14px] border border-[#d7deea] bg-white px-3.5 text-[15px] font-semibold text-[#1d2230]"
                        onClick={() => setIsLocaleOpen((prev) => !prev)}
                        aria-haspopup="listbox"
                        aria-expanded={isLocaleOpen}
                    >
                        <span className="inline-flex h-[14px] w-[22px] overflow-hidden rounded-[2px] border border-black/10" aria-hidden="true">
                            <LocaleFlag country={activeLocale.country} />
                        </span>
                        <span className="leading-none">{activeLocale.code}</span>
                    </button>

                    {isLocaleOpen && (
                        <div className="absolute top-full right-0 z-30 mt-2 min-w-[120px] rounded-xl border border-[#d7deea] bg-white p-1.5 shadow-[0_10px_24px_rgba(17,24,39,0.12)]">
                            {localeOptions.map((item) => (
                                <button
                                    key={item.code}
                                    type="button"
                                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[14px] font-medium text-[#1d2230] transition-colors ${
                                        item.code === activeLocale.code
                                            ? "border-[#c7d8fb] bg-[#e7efff]"
                                            : "border-transparent hover:bg-[#f3f4f6]"
                                    }`}
                                    onClick={() => {
                                        setSelectedLocale(item.code);
                                        setIsLocaleOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={item.code === activeLocale.code}
                                >
                                    <span className="inline-flex h-[14px] w-[22px] overflow-hidden rounded-[2px] border border-black/10" aria-hidden="true">
                                        <LocaleFlag country={item.country} />
                                    </span>
                                    <span>{item.code}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CatalogButton() {
    return (
        <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-[20px] bg-[#ffd500] px-6 py-2.5 text-[15px] font-medium text-[#171717] lg:px-[38px] lg:py-[12px] lg:text-[16px]"
        >
            <Grid2X2 className="size-[15px] lg:size-4" />
            Kataloq
            <ChevronDown className="size-[15px] lg:size-4" />
        </button>
    );
}

function NavbarMenu({ menuItems }: { menuItems: NavbarMenuItem[] }) {
    return (
   <nav className="space-x-8 items-center px-2 text-[14px] font-bold text-[#151822] lg:ml-8 lg:-translate-y-0.5 lg:justify-start">
    {menuItems.map((item) => (
        <a key={item.label} href={item.href} className="cursor-pointer transition-colors hover:text-[#1d4fff]">
            {item.label}
        </a>
    ))}
</nav>
    );
}

function NavbarActions() {
    return (
        <div className="ml-auto flex items-center gap-3 lg:ml-0 lg:justify-self-end">
            <button
                type="button"
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-[#1f4fff] px-11 text-[16px] font-medium text-white"
            >
                <UserRound className="size-[17px]" />
                Daxil ol
            </button>

            <button
                type="button"
                aria-label="Seçilmişlər"
                className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
            >
                <Heart className="size-[19px]" />
            </button>
            <button
                type="button"
                aria-label="Müqayisə"
                className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
            >
                <GitCompareArrows className="size-[19px]" />
            </button>
            <button
                type="button"
                aria-label="Səbət"
                className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
            >
                <ShoppingCart className="size-[19px]" />
            </button>
        </div>
    );
}

export function Navbar({
    className,
    searchPlaceholder = "Məhsul axtarışı",
    menuItems = defaultMenuItems,
    phone = "+994 (50) 828-08-88",
    locale = "AZ",
    logo,
    logoHref = "#",
    languages,
    defLang,
    onLocaleChange,
}: NavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileLocaleOpen, setIsMobileLocaleOpen] = useState(false);
    const [mobileLocale, setMobileLocale] = useState((locale || "AZ").toUpperCase());
    const activeMobileLocale = useMemo(
        () => localeOptions.find((item) => item.code === mobileLocale) ?? defaultLocaleOption,
        [mobileLocale]
    );
    const whatsappHref = toWhatsappHref(phone);

    // Catalog dropdown state + data
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [catalogFetched, setCatalogFetched] = useState(false);
    const catalogRef = useRef<HTMLDivElement | null>(null);
    const catalogFetchPromiseRef = useRef<Promise<any[]> | null>(null);

    const buildTree = useCallback((items: any[]) => {
        if (!Array.isArray(items)) return [];

        // Normalize input: flatten any nested `children` arrays into a unique flat list
        const flat: any[] = [];
        const seen = new Set<any>();

        const recurse = (arr: any[], parentId?: number | null) => {
            if (!Array.isArray(arr)) return;
            for (const raw of arr) {
                if (!raw || typeof raw !== "object") continue;

                const id = raw.id ?? raw.uuid;
                if (seen.has(id)) {
                    if (Array.isArray(raw.children) && raw.children.length) recurse(raw.children, raw.id ?? parentId);
                    continue;
                }

                const copy: any = { ...raw, children: [] };
                // If a parentId was provided by recursion and the item lacks a parent_id, set it
                if ((copy.parent_id === undefined || copy.parent_id === null || Number(copy.parent_id) === 0) && parentId) {
                    copy.parent_id = parentId;
                }

                flat.push(copy);
                seen.add(id);

                if (Array.isArray(raw.children) && raw.children.length) {
                    recurse(raw.children, copy.id ?? parentId);
                }
            }
        };

        recurse(items, undefined);

        // Build map by id and attach children by parent_id
        const map = new Map<number, any>();
        flat.forEach((it: any) => map.set(Number(it.id), { ...it, children: [] }));
        const roots: any[] = [];
        map.forEach((it) => {
            const pid = it.parent_id == null ? 0 : Number(it.parent_id);
            if (!pid) roots.push(it);
            else {
                const parent = map.get(pid);
                if (parent) parent.children.push(it);
                else roots.push(it);
            }
        });

        return roots;
    }, []);

    const fetchCategories = useCallback(async () => {
        // If a fetch is already in-flight, reuse the same promise to avoid duplicate requests
        if (catalogFetchPromiseRef.current) return catalogFetchPromiseRef.current;

        const p = (async () => {
            setCatalogLoading(true);
            setCatalogError(null);
            try {
                // Request header categories from the API
                const res = await fetch("https://admin.tvim.az/api/v1/product/categories?in_header=1");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const items = Array.isArray(json.data) ? json.data : Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : [];
                // server-side may not filter; prefer items with in_header, but fall back
                // to the full list if none are marked for header so the dropdown isn't empty.
                const filtered = (items as any[]).filter((it) => !!it && (it.in_header === true || it.in_header === 1 || it.in_header === '1' || it.in_header === 'true'));
                const finalItems = filtered.length > 0 ? filtered : (items as any[]);
                setCatalogItems(finalItems as any[]);
                return finalItems as any[];
            } catch (err: any) {
                setCatalogError(err?.message ?? String(err));
                throw err;
            } finally {
                setCatalogLoading(false);
                setCatalogFetched(true);
                // clear the in-flight promise so future fetches can be made if needed
                catalogFetchPromiseRef.current = null;
            }
        })();

        catalogFetchPromiseRef.current = p;
        return p;
    }, []);

    const toggleCatalog = useCallback(() => {
        setIsCatalogOpen((prev) => {
            const next = !prev;
            if (next && catalogItems.length === 0 && !catalogLoading) {
                void fetchCategories();
            }
            return next;
        });
    }, [catalogItems.length, catalogLoading, fetchCategories]);

    useEffect(() => {
        if (!isCatalogOpen) return;
        function onDocClick(e: MouseEvent) {
            if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) setIsCatalogOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setIsCatalogOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [isCatalogOpen]);

    return (
        <header data-slot="navbar" className={cn(navbarClasses.root, className)}>
            <div className={navbarClasses.container}>
                <div className={navbarClasses.topRow}>
                    <NavbarLogo logo={logo} logoHref={logoHref} />
                    <div className="hidden lg:block">
                        <NavbarSearch searchPlaceholder={searchPlaceholder} />
                    </div>
                    <div className="hidden lg:block">
                        <NavbarContact 
                            phone={phone} 
                            locale={locale} 
                            languages={languages}
                            defLang={defLang}
                            onLocaleChange={onLocaleChange}
                        />
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:hidden">
                        {languages && onLocaleChange ? (
                            <LanguageSwitcher
                                languages={languages || defaultLanguages}
                                defLang={defLang || "az"}
                                locale={mobileLocale.toLowerCase()}
                                onLocaleChange={(newLocale: string) => {
                                    setMobileLocale(newLocale.toUpperCase());
                                    onLocaleChange(newLocale);
                                }}
                                variant="mobile"
                            />
                        ) : (
                            <div className="relative">
                                <button
                                    type="button"
                                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-[10px] border border-[#d7deea] bg-white px-2 text-[12px] font-semibold text-[#1d2230]"
                                    onClick={() => setIsMobileLocaleOpen((prev) => !prev)}
                                    aria-haspopup="listbox"
                                    aria-expanded={isMobileLocaleOpen}
                                >
                                    <span className="inline-flex h-[12px] w-[18px] overflow-hidden rounded-[2px] border border-black/10" aria-hidden="true">
                                        <LocaleFlag country={activeMobileLocale.country} />
                                    </span>
                                    <span className="leading-none">{activeMobileLocale.code}</span>
                                </button>

                                {isMobileLocaleOpen && (
                                    <div className="absolute top-full right-0 z-40 mt-2 min-w-[110px] rounded-xl border border-[#d7deea] bg-white p-1.5 shadow-[0_10px_24px_rgba(17,24,39,0.12)]">
                                        {localeOptions.map((item) => (
                                            <button
                                                key={item.code}
                                                type="button"
                                                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[13px] font-medium text-[#1d2230] transition-colors ${
                                                    item.code === activeMobileLocale.code
                                                        ? "border-[#c7d8fb] bg-[#e7efff]"
                                                        : "border-transparent hover:bg-[#f3f4f6]"
                                                }`}
                                                onClick={() => {
                                                    setMobileLocale(item.code);
                                                    setIsMobileLocaleOpen(false);
                                                }}
                                                role="option"
                                                aria-selected={item.code === activeMobileLocale.code}
                                            >
                                                <span className="inline-flex h-[12px] w-[18px] overflow-hidden rounded-[2px] border border-black/10" aria-hidden="true">
                                                    <LocaleFlag country={item.country} />
                                                </span>
                                                <span>{item.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="WhatsApp ilə əlaqə"
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[10px] text-[#25D366] transition-colors hover:text-[#1fb85a]"
                        >
                            <FaWhatsapp className="size-6" />
                        </a>

                        <button
                            type="button"
                            aria-label="Menyunu aç"
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[10px] bg-white text-[#1d2230] transition-colors hover:bg-[#f3f4f6]"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="size-5" />
                        </button>
                    </div>
                </div>

                <div className={navbarClasses.bottomRow}>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={toggleCatalog}
                            aria-haspopup="true"
                            aria-expanded={isCatalogOpen}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-[20px] bg-[#ffd500] px-6 py-2.5 text-[15px] font-medium text-[#171717] lg:px-[38px] lg:py-[12px] lg:text-[16px]"
                        >
                            <Grid2X2 className="size-[15px] lg:size-4" />
                            Kataloq
                            <ChevronDown className="size-[15px] lg:size-4" />
                        </button>

                        {isCatalogOpen && (
                            <div
                                ref={catalogRef}
                                role="menu"
                                aria-hidden={!isCatalogOpen}
                                className="absolute left-0 top-full z-50 mt-2 w-[880px] max-w-[calc(100vw-32px)] rounded-xl border border-[#e6e9f0] bg-white p-4 shadow-[0_10px_24px_rgba(17,24,39,0.12)]"
                            >
                                {catalogLoading ? (
                                    <div className="py-6 text-center text-sm text-[#6b7280]">Yüklənir…</div>
                                ) : catalogError ? (
                                    <div className="py-6 text-center text-sm text-red-500">Xəta: {catalogError}</div>
                                ) : catalogItems && catalogItems.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {buildTree(catalogItems).map((cat: any) => (
                                            <div key={cat.id} className="min-w-0">
                                                <a
                                                    href={`/${(locale || "az").toLowerCase()}/${(cat.multi_links && cat.multi_links[(locale || "az").toLowerCase()]) || cat.link || ""}`}
                                                    className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-[#f3f4f6]"
                                                >
                                                    {cat.icon?.image_url ? (
                                                        <img src={cat.icon.image_url} alt={cat.name ?? ""} className="h-8 w-8 object-cover rounded" />
                                                    ) : (
                                                        <Grid2X2 className="size-[18px] text-[#475066]" />
                                                    )}
                                                    <span className="font-semibold text-sm text-[#131722]">{cat.name ?? cat.title ?? cat.link}</span>
                                                </a>

                                                {Array.isArray(cat.children) && cat.children.length > 0 && (
                                                    <ul className="mt-2 space-y-1 text-sm text-[#475066]">
                                                        {cat.children.map((child: any) => (
                                                            <li key={child.id}>
                                                                <a
                                                                    href={`/${(locale || "az").toLowerCase()}/${(child.multi_links && child.multi_links[(locale || "az").toLowerCase()]) || child.link || ""}`}
                                                                    className="block rounded px-2 py-1 hover:bg-[#f3f4f6]"
                                                                >
                                                                    {child.name ?? child.title ?? child.link}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Only show "no catalog" after we've attempted a fetch
                                    catalogFetched ? (
                                        <div className="py-4 text-sm text-[#6b7280]">Kataloq mövcud deyil</div>
                                    ) : null
                                )}
                            </div>
                        )}
                    </div>
                    <NavbarMenu menuItems={menuItems} />
                    <NavbarActions />
                </div>

                <div className="mt-1 flex items-center gap-2 bg-[#f4f5f7] px-2 py-2.5 lg:hidden">
                    <button
                        type="button"
                        className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-[10px] bg-[#ffd500] px-3 text-[13px] font-medium text-[#171717]"
                    >
                        <Grid2X2 className="size-[14px]" />
                        Kataloq
                        <ChevronDown className="size-[14px]" />
                    </button>
                    <NavbarSearch searchPlaceholder={searchPlaceholder} compact />
                </div>
            </div>

            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/35 transition-opacity duration-300 lg:hidden",
                    isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full w-[84%] max-w-[320px] bg-white shadow-[8px_0_30px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out lg:hidden",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-hidden={!isMobileMenuOpen}
            >
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <a
                        href={logoHref}
                        className="flex min-w-0 items-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <span className="flex min-w-0 shrink overflow-hidden [&_img]:h-9 [&_img]:w-auto [&_img]:max-w-[135px]">
                            {logo ?? null}
                        </span>
                    </a>
                    <button
                        type="button"
                        aria-label="Menyunu bağla"
                        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-[10px] text-[#1d2230] transition-colors hover:bg-[#f3f4f6]"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="mx-4 border-b border-[#e8eaef]" />

                <nav className="flex flex-col px-4 py-3">
                    {menuItems.map((item) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className="cursor-pointer rounded-lg px-2 py-2.5 text-[15px] font-medium text-[#151822] transition-colors hover:bg-[#f3f4f6]"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="px-4 pb-3">
                    <button
                        type="button"
                        className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1f4fff] px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-95"
                    >
                        <UserRound className="size-[16px]" />
                        Daxil ol
                    </button>
                </div>

                <div className="flex items-center gap-3 px-4 pb-5">
                    <button
                        type="button"
                        aria-label="Seçilmişlər"
                        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
                    >
                        <Heart className="size-[18px]" />
                    </button>
                    <button
                        type="button"
                        aria-label="Müqayisə"
                        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
                    >
                        <GitCompareArrows className="size-[18px]" />
                    </button>
                    <button
                        type="button"
                        aria-label="Səbət"
                        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
                    >
                        <ShoppingCart className="size-[18px]" />
                    </button>
                </div>
            </aside>
        </header>
    );
}
