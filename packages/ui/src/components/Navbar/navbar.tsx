"use client";

import { type ReactNode, useMemo, useState, useEffect, useRef, useCallback, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
    Boxes,
    Briefcase,
    Droplets,
    GitCompareArrows,
    Grid2X2,
    ChevronDown,
    Hammer,
    Heart,
    House,
    Lightbulb,
    Menu,
    Package,
    Paintbrush,
    Search,
    ShoppingCart,
    TreePine,
    UserRound,
    Wrench,
    PhoneCall,
    X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { Language } from "@repo/types/types";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { cn } from "../../lib/utils";
import Spinner from "../Spinner/Spinner";
import "./navbar.css";

const navbarClasses = {
    root: "w-full overflow-x-clip bg-white font-[family-name:var(--font-inter)] border-b border-gray-200",
    container: "mx-auto flex w-full max-w-[1280px] flex-col",
    topRow: "flex items-center gap-1.5 pt-5 pb-2 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-5",
    bottomRow: "hidden items-center gap-5 py-3 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-6",
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://admin.tvim.az/api/v1").replace(/\/+$/, "");
const NAVBAR_REQUEST_TIMEOUT_MS = 10000;
const CONTENT_LOCALE = "az";
const FAVORITES_UPDATED_EVENT = "tvim:favorites-updated";
const COMPARE_UPDATED_EVENT = "tvim:compare-updated";

function extractFavoritesCount(payload: any) {
    const total = Number(payload?.data?.pagination?.total);
    if (Number.isFinite(total) && total >= 0) {
        return Math.trunc(total);
    }

    const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return items.length;
}

function extractCompareCount(payload: any) {
    const total = Number(payload?.data?.pagination?.total);
    if (Number.isFinite(total) && total >= 0) {
        return Math.trunc(total);
    }

    const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return items.length;
}

function buildApiUrl(path: string, params?: Record<string, string>) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${API_BASE_URL}${normalizedPath}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }

    return url.toString();
}

async function fetchNavbarApiJson(path: string, options?: { locale?: string; params?: Record<string, string> }) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), NAVBAR_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(buildApiUrl(path, options?.params), {
            signal: controller.signal,
            headers: {
                Accept: "application/json",
                "Content-Language": CONTENT_LOCALE,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function extractResponseItems(json: any): any[] {
    if (json && Array.isArray(json.data?.header)) return json.data.header;
    if (json && Array.isArray(json.header)) return json.header;
    if (json && Array.isArray(json.data?.menus)) return json.data.menus;
    if (json && Array.isArray(json.data?.items)) return json.data.items;
    if (json && Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.items)) return json.items;
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object" && json.data && typeof json.data === "object") {
        const arr = Object.values(json.data).find((v) => Array.isArray(v));
        if (Array.isArray(arr)) return arr as any[];
    }
    return [];
}

export type NavbarSearchProduct = {
    id: string | number;
    name: string;
    model?: string;
    subtitle?: string;
    price?: string;
    imageUrl?: string;
    href: string;
    type?: "brand" | "category" | "product";
};

export type NavbarSearchSection = {
    key: "brands" | "categories" | "products" | string;
    name: string;
    items: NavbarSearchProduct[];
};

export type NavbarAuthUser = {
    id?: number | string;
    name?: string | null;
    surname?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
};

function toProductHref(item: any, locale: string) {
    const hrefPart =
        (item?.multi_links && item.multi_links[locale]) ||
        item?.link ||
        (item?.slug ? `products/${item.slug}` : "");

    if (!hrefPart) return "#";

    const normalizedHref = String(hrefPart).replace(/^\/+/, "");
    return `/${locale}/${normalizedHref}`;
}

function formatProductPrice(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return `${value.toFixed(2)}₼`;
    }

    const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
    if (Number.isFinite(parsed)) {
        return `${parsed.toFixed(2)}₼`;
    }

    return "";
}

function normalizeSearchProducts(json: any, locale: string): NavbarSearchSection[] {
    const items = extractResponseItems(json);

    const mappedItems = (items as any[])
        .filter((item) => !!item && typeof item === "object")
        .map((item) => ({
            id: item.id ?? item.product_id ?? item.uuid ?? `${item.slug ?? item.link ?? item.name ?? "item"}`,
            name: String(item.name ?? item.title ?? item.product_name ?? "Məhsul"),
            model: String(item.model ?? item.sku ?? item.code ?? ""),
            price: formatProductPrice(item.sale_price ?? item.price ?? item.final_price ?? item.special),
            imageUrl: String(
                item.image?.image_url ??
                item.image_url ??
                item.thumb ??
                item.images?.[0]?.image_url ??
                ""
            ),
            href: toProductHref(item, locale),
            type: "product" as const,
        }));

    return [
        {
            key: "products",
            name: "Məhsullar",
            items: mappedItems,
        },
    ];
}

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
    initialCatalogItems?: any[];
    onSearchProducts?: (query: string, locale: string) => Promise<NavbarSearchSection[]>;
    isAuthenticated?: boolean;
    authUser?: NavbarAuthUser | null;
    cartCount?: number;
    onCartClick?: () => void;
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

function normalizeLocaleCode(value?: string) {
    const code = (value || defaultLocaleOption.code).trim().toUpperCase();
    return localeOptions.some((item) => item.code === code) ? code : defaultLocaleOption.code;
}

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

function getAuthDisplayName(user?: NavbarAuthUser | null) {
    if (!user) return "Profil";

    const safeName = typeof user.name === "string" ? user.name.trim() : "";
    const safeSurname = typeof user.surname === "string" ? user.surname.trim() : "";

    if (safeName && safeSurname) {
        return `${safeName} ${safeSurname[0]}.`;
    }

    if (safeName) return safeName;

    if (typeof user.email === "string" && user.email.trim()) {
        const email = user.email.trim();
        const atIndex = email.indexOf("@");
        return atIndex > 1 ? email.slice(0, atIndex) : email;
    }

    return "Profil";
}

function getParentIcon(name: string) {
    const normalized = name.toLocaleLowerCase("az");

    if (normalized.includes("santex")) return Droplets;
    if (normalized.includes("avadan")) return Wrench;
    if (normalized.includes("bağ") || normalized.includes("bag")) return TreePine;
    if (normalized.includes("boya") || normalized.includes("kimyə")) return Paintbrush;
    if (normalized.includes("bərkid") || normalized.includes("berkid")) return Package;
    if (normalized.includes("elektr") || normalized.includes("işıq") || normalized.includes("isiq")) return Lightbulb;
    if (normalized.includes("məişət") || normalized.includes("meiset")) return House;
    if (normalized.includes("ofis")) return Briefcase;
    if (normalized.includes("tikinti") || normalized.includes("material")) return Boxes;
    if (normalized.includes("əl alət") || normalized.includes("el alet")) return Hammer;

    return Grid2X2;
}

function ParentCategoryIcon({ category, className }: { category: any; className?: string }) {
    if (category?.icon?.image_url) {
        return <img src={category.icon.image_url} alt={category.name ?? ""} className={cn("h-4 w-4 shrink-0 object-cover", className)} />;
    }

    const Icon = getParentIcon(category?.name ?? category?.title ?? category?.link ?? "");
    return <Icon className={cn("size-[16px] shrink-0", className)} strokeWidth={2.2} />;
}

function PhoneHandsetIcon() {
    return <i className="fas fa-phone-volume size-[18px] text-[#12151D]" aria-hidden="true" />;
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
        <a href={logoHref} className="flex min-w-0 flex-1 items-center gap-1 cursor-pointer lg:min-w-[240px] lg:flex-none lg:gap-1">
            <span className="flex min-w-0 shrink overflow-hidden [&_img]:h-auto [&_img]:w-auto [&_img]:max-w-[150px]">
                {logo ?? null}
            </span>
            <span className="hidden text-[14px] leading-none font-normal whitespace-nowrap text-[#616672] sm:inline">
                Tikinti və inşaat materialları
            </span>
        </a>
    );
}

function NavbarSearch({
    searchPlaceholder,
    compact = false,
    locale = "az",
    onSearchProducts,
}: {
    searchPlaceholder: string;
    compact?: boolean;
    locale?: string;
    onSearchProducts?: (query: string, locale: string) => Promise<NavbarSearchSection[]>;
}) {
    const [value, setValue] = useState("");
    const [results, setResults] = useState<NavbarSearchSection[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const activeQueryRef = useRef("");
    const localeCode = (locale || "az").toLowerCase();
    const totalResults = results.reduce((sum, section) => sum + section.items.length, 0);

    const overlayVisible = value.length === 0;

    useEffect(() => {
        const query = value.trim();

        if (!query) {
            setResults([]);
            setError(null);
            setIsLoading(false);
            setIsOpen(false);
            activeQueryRef.current = "";
            return;
        }

        activeQueryRef.current = query;

        const timer = window.setTimeout(async () => {
            setIsLoading(true);
            setError(null);

            try {
                const mapped = onSearchProducts
                    ? await onSearchProducts(query, localeCode)
                    : normalizeSearchProducts(
                        await fetchNavbarApiJson("/product/list", {
                            locale: localeCode,
                            params: { q: query },
                        }),
                        localeCode
                    );

                if (activeQueryRef.current !== query) return;
                setResults((mapped || []).filter((section) => Array.isArray(section?.items) && section.items.length > 0));
                setIsOpen(true);
            } catch (err: any) {
                if (activeQueryRef.current !== query) return;
                setResults([]);
                setError(err?.message ?? "Axtarış xətası");
                setIsOpen(true);
            } finally {
                if (activeQueryRef.current === query) {
                    setIsLoading(false);
                }
            }
        }, 280);

        return () => window.clearTimeout(timer);
    }, [value, localeCode, onSearchProducts]);

    useEffect(() => {
        if (!isOpen) return;

        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (searchRef.current && searchRef.current.contains(target)) return;
            setIsOpen(false);
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [isOpen]);

    return (
        <div ref={searchRef} className="relative min-w-0 flex-1 lg:mx-auto lg:w-full lg:max-w-[470px] group">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-label={searchPlaceholder}
                placeholder=""
                className={cn(
                    "w-full text-[#343943] outline-none focus:ring-1 focus:ring-[rgba(0,0,0,0.24)] focus:ring-offset-0 focus:outline-none transition-shadow duration-150 ease-out",
                    compact
                        ? "h-12 rounded-[20px] bg-[#ecf4fc] px-[28px] py-0 text-[13px]"
                        : "h-12 rounded-[20px] bg-[#ecf4fc] px-[28px] py-0 text-[14px]"
                )}
            />

            <span
                className={cn(
                    "pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-[#8b91a0] transition-opacity duration-200 ease-out",
                    compact ? "text-[13px]" : "text-[14px]",
                    overlayVisible ? "opacity-100" : "opacity-0",
                    "group-focus-within:opacity-0"
                )}
            >
                {searchPlaceholder}
            </span>

            <Search
                className={cn(
                    "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8b91a0]",
                    compact ? "right-[28px] size-[14px]" : "right-[28px] size-[16px]"
                )}
            />

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[1200] overflow-hidden rounded-[18px] border border-[#dfe5ef] bg-white shadow-[0_16px_34px_rgba(17,24,39,0.16)]">
                    <div className="max-h-[420px] overflow-y-auto">
                        {isLoading ? (
                            <div className="px-4 py-4 text-[13px] text-[#7b8494]">Axtarılır...</div>
                        ) : error ? (
                            <div className="px-4 py-4 text-[13px] text-[#d14343]">{error}</div>
                        ) : totalResults === 0 ? (
                            <div className="px-4 py-4 text-[13px] text-[#7b8494]">Nəticə tapılmadı</div>
                        ) : (
                            results.map((section, sectionIndex) => (
                                <div
                                    key={section.key || section.name || sectionIndex}
                                    className={cn(sectionIndex > 0 ? "border-t border-[#edf1f7]" : "")}
                                >
                                    <p className="px-4 pb-2 pt-3 text-[14px] leading-none font-bold text-[#000]">{section.name}</p>
                                    {section.items.map((product, productIndex) => (
                                        <a
                                            key={`${section.key}-${product.id}`}
                                            href={product.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f6f8fc]",
                                                productIndex < section.items.length - 1 ? "border-b border-[#edf1f7]" : ""
                                            )}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f3f5f9]">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
                                                ) : (
                                                    <Package className="size-4 text-[#98a1b2]" strokeWidth={2} />
                                                )}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] leading-[1.25] font-semibold text-[#1c2431]">{product.name}</span>
                                                {product.subtitle || product.model ? (
                                                    <span className="mt-0.5 block text-[12px] leading-[1.2] text-[#7c8596]">{product.subtitle ?? `Model: ${product.model}`}</span>
                                                ) : null}
                                            </span>

                                            {product.price ? (
                                                <span className="shrink-0 text-[13px] leading-none font-semibold text-[#1f2430]">{product.price}</span>
                                            ) : null}
                                        </a>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    {!isLoading && totalResults > 0 ? (
                        <a
                            href={`/${localeCode}/products?q=${encodeURIComponent(value.trim())}`}
                            className="block border-t border-[#edf1f7] px-4 py-3 text-center text-[13px] font-semibold text-[#3a4354] transition-colors hover:bg-[#f6f8fc]"
                            onClick={() => setIsOpen(false)}
                        >
                            Bütün axtarış nəticələri ({totalResults})
                        </a>
                    ) : null}
                </div>
            )}
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
    const [selectedLocale, setSelectedLocale] = useState(normalizeLocaleCode(locale));
    const localeDropdownRef = useRef<HTMLDivElement | null>(null);
    const activeLocale = useMemo(
        () => localeOptions.find((item) => item.code === selectedLocale) ?? defaultLocaleOption,
        [selectedLocale],
    );

    useEffect(() => {
        const nextLocale = normalizeLocaleCode(locale);
        setSelectedLocale((prev) => (prev === nextLocale ? prev : nextLocale));
    }, [locale]);

    useEffect(() => {
        if (!isLocaleOpen) return;

        function onDocClick(e: MouseEvent) {
            const target = e.target as Node;
            if (localeDropdownRef.current && localeDropdownRef.current.contains(target)) return;
            setIsLocaleOpen(false);
        }

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setIsLocaleOpen(false);
        }

        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [isLocaleOpen]);

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
                <div className="relative" ref={localeDropdownRef}>
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

function CatalogButton({ open = false, onClick, toggleRef }: { open?: boolean; onClick?: () => void; toggleRef?: RefObject<HTMLButtonElement | null> }) {
    return (
        <button
            type="button"
            ref={toggleRef}
            onPointerDown={(e) => {
                if (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            onClick={(e) => {
                // Keep keyboard activation (Enter/Space), ignore pointer-generated click.
                if (e.detail === 0) onClick?.();
            }}
            aria-haspopup="true"
            aria-expanded={open}
            className="inline-flex cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-[20px] bg-[#ffd500] px-6 py-2.5 text-[15px] font-medium text-[#171717] lg:px-[38px] lg:py-[12px] lg:text-[16px]"
        >
            <Grid2X2 className="size-[15px] lg:size-4" />
            Kataloq
                <ChevronDown
                    className={cn(
                        "size-[16px] lg:size-5 transform transition-transform duration-200 text-[#000000] opacity-80",
                        open ? "rotate-180" : "rotate-0"
                    )}
                    strokeWidth={2.2}
                />
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

function NavbarActions({
    locale,
    isAuthenticated,
    authUser,
    favoritesCount,
    compareCount,
    cartCount,
    onCartClick,
}: {
    locale: string;
    isAuthenticated: boolean;
    authUser?: NavbarAuthUser | null;
    favoritesCount: number;
    compareCount: number;
    cartCount: number;
    onCartClick?: () => void;
}) {
    const displayName = getAuthDisplayName(authUser);
    const favoritesBadgeText = favoritesCount > 99 ? "99+" : String(favoritesCount);
    const compareBadgeText = compareCount > 99 ? "99+" : String(compareCount);
    const cartBadgeText = cartCount > 99 ? "99+" : String(cartCount);

    return (
        <div className="ml-auto flex items-center gap-3 lg:ml-0 lg:justify-self-end">
            {isAuthenticated ? (
                <Link
                    href={`/${locale.toLowerCase()}/account`}
                    className="inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-full bg-[#1448F4] px-7 text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                    aria-label="Profil"
                >
                    <UserRound className="size-[18px]" strokeWidth={2.2} />
                    <span className="max-w-[170px] truncate text-[15px] leading-none">{displayName}</span>
                </Link>
            ) : (
                <Link
                    href={`/${locale.toLowerCase()}/signin`}
                    className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-[#1f4fff] px-11 text-[16px] font-medium text-white"
                >
                    <UserRound className="size-[17px]" />
                    Daxil ol
                </Link>
            )}

            <Link
                href={`/${locale.toLowerCase()}/wishlist`}
                aria-label="Seçilmişlər"
                className="relative inline-flex size-12 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
            >
                <Heart className="size-[19px]" />
                {favoritesCount > 0 ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full bg-[#ffd500] px-1 text-[11px] leading-none font-bold text-[#121212]">
                        {favoritesBadgeText}
                    </span>
                ) : null}
            </Link>
            <Link
                href={`/${locale.toLowerCase()}/compare`}
                aria-label="Müqayisə"
                className="relative inline-flex size-12 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
            >
                <GitCompareArrows className="size-[19px]" />
                {compareCount > 0 ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full bg-[#ffd500] px-1 text-[11px] leading-none font-bold text-[#121212]">
                        {compareBadgeText}
                    </span>
                ) : null}
            </Link>
            <button
                type="button"
                aria-label="Səbət"
                onClick={onCartClick}
                className="relative inline-flex size-12 overflow-visible cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
            >
                <ShoppingCart className="size-[19px]" />
                {cartCount > 0 ? (
                    <span className="absolute top-0 right-0 translate-x-[10%] -translate-y-[20%] inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[4px] bg-[#ffd500] text-[10px] leading-none font-bold text-[#121212]">
                        {cartBadgeText}
                    </span>
                ) : null}
            </button>
        </div>
    );
}

function MobileCatalogCollapsible({
    expanded,
    renderContent,
}: {
    expanded: boolean;
    renderContent: () => React.ReactNode;
}) {
    const [shouldRender, setShouldRender] = useState(expanded);

    useEffect(() => {
        if (expanded) {
            setShouldRender(true);
            return;
        }

        const timer = window.setTimeout(() => {
            setShouldRender(false);
        }, 180);

        return () => window.clearTimeout(timer);
    }, [expanded]);

    return (
        <div className={cn("mobile-catalog-children", expanded && "is-expanded")} aria-hidden={!expanded}>
            <div className="overflow-hidden">{shouldRender ? renderContent() : null}</div>
        </div>
    );
}

export function Navbar({
    className,
    searchPlaceholder = "Məhsul axtarışı",
    menuItems,
    phone = "+994 (50) 828-08-88",
    locale = "AZ",
    logo,
    logoHref = "#",
    languages,
    defLang,
    onLocaleChange,
    initialCatalogItems,
    onSearchProducts,
    isAuthenticated = false,
    authUser,
    cartCount = 0,
    onCartClick,
}: NavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileLocaleOpen, setIsMobileLocaleOpen] = useState(false);
    const mobileLocaleDropdownRef = useRef<HTMLDivElement | null>(null);
    const [mobileLocale, setMobileLocale] = useState(normalizeLocaleCode(locale));
    const activeMobileLocale = useMemo(
        () => localeOptions.find((item) => item.code === mobileLocale) ?? defaultLocaleOption,
        [mobileLocale]
    );
    const [mobileExpandedIds, setMobileExpandedIds] = useState<number[]>([]);
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [compareCount, setCompareCount] = useState(0);
    const whatsappHref = toWhatsappHref(phone);

    const fetchFavoritesCount = useCallback(async () => {
        try {
            const response = await fetch("/api/favorites?page=1&per_page=1", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                setFavoritesCount(0);
                return;
            }

            const payload = await response.json();
            setFavoritesCount(extractFavoritesCount(payload));
        } catch {
            // Ignore transient network errors for badge sync.
        }
    }, []);

    const fetchCompareCount = useCallback(async () => {
        try {
            const response = await fetch("/api/compare?page=1&per_page=1", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                setCompareCount(0);
                return;
            }

            const payload = await response.json();
            setCompareCount(extractCompareCount(payload));
        } catch {
            // Ignore transient network errors for badge sync.
        }
    }, []);

    useEffect(() => {
        const nextLocale = normalizeLocaleCode(locale);
        setMobileLocale((prev) => (prev === nextLocale ? prev : nextLocale));
    }, [locale]);

    useEffect(() => {
        void fetchFavoritesCount();
    }, [fetchFavoritesCount]);

    useEffect(() => {
        void fetchCompareCount();
    }, [fetchCompareCount]);

    useEffect(() => {
        const onFavoritesUpdated = (event: Event) => {
            const detail = (event as CustomEvent<{ action?: "created" | "deleted" }>).detail;

            if (detail?.action === "created") {
                setFavoritesCount((prev) => prev + 1);
                return;
            }

            if (detail?.action === "deleted") {
                setFavoritesCount((prev) => Math.max(0, prev - 1));
                return;
            }

            void fetchFavoritesCount();
        };

        window.addEventListener(FAVORITES_UPDATED_EVENT, onFavoritesUpdated as EventListener);

        return () => {
            window.removeEventListener(FAVORITES_UPDATED_EVENT, onFavoritesUpdated as EventListener);
        };
    }, [fetchFavoritesCount]);

    useEffect(() => {
        const onCompareUpdated = (event: Event) => {
            const detail = (event as CustomEvent<{ action?: "created" | "deleted" }>).detail;

            if (detail?.action === "created") {
                setCompareCount((prev) => prev + 1);
                return;
            }

            if (detail?.action === "deleted") {
                setCompareCount((prev) => Math.max(0, prev - 1));
                return;
            }

            void fetchCompareCount();
        };

        window.addEventListener(COMPARE_UPDATED_EVENT, onCompareUpdated as EventListener);

        return () => {
            window.removeEventListener(COMPARE_UPDATED_EVENT, onCompareUpdated as EventListener);
        };
    }, [fetchCompareCount]);

    useEffect(() => {
        if (!isMobileLocaleOpen) return;

        function onDocClick(e: MouseEvent) {
            const target = e.target as Node;
            if (mobileLocaleDropdownRef.current && mobileLocaleDropdownRef.current.contains(target)) return;
            setIsMobileLocaleOpen(false);
        }

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setIsMobileLocaleOpen(false);
        }

        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [isMobileLocaleOpen]);

    // Header menus (fetched from admin API when parent doesn't provide `menuItems`)
    const [fetchedMenuItems, setFetchedMenuItems] = useState<NavbarMenuItem[] | null>(null);
    const [menusLoading, setMenusLoading] = useState(false);

    // Catalog dropdown state + data
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [catalogItems, setCatalogItems] = useState<any[]>(initialCatalogItems ?? []);
    const [catalogFetched, setCatalogFetched] = useState(false);
    const [activeParentId, setActiveParentId] = useState<number | null>(null);
    const catalogRef = useRef<HTMLDivElement | null>(null);
    const catalogToggleRef = useRef<HTMLButtonElement | null>(null);
    const mobileCatalogToggleRef = useRef<HTMLButtonElement | null>(null);
    const mobileCatalogRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [catalogPortalPos, setCatalogPortalPos] = useState<{ top: number; left: number; width: number } | null>(null);
    const [catalogOverlayTop, setCatalogOverlayTop] = useState<number | null>(null);
    const catalogFetchPromiseRef = useRef<Promise<any[]> | null>(null);
    const [isDesktopViewport, setIsDesktopViewport] = useState(false);
    const [isDesktopCatalogMounted, setIsDesktopCatalogMounted] = useState(false);
    const [isDesktopCatalogActive, setIsDesktopCatalogActive] = useState(false);
    const desktopCatalogCloseTimerRef = useRef<number | null>(null);

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
                const currentLocale = (locale || "az").toLowerCase();
                const json = await fetchNavbarApiJson("/product/categories", {
                    locale: currentLocale,
                    params: { in_header: "1" },
                });
                const items = extractResponseItems(json);
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
    }, [locale]);

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
        const mediaQuery = window.matchMedia("(min-width: 1024px)");
        const onChange = (e: MediaQueryListEvent) => setIsDesktopViewport(e.matches);

        setIsDesktopViewport(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", onChange);
            return () => mediaQuery.removeEventListener("change", onChange);
        }

        mediaQuery.addListener(onChange);
        return () => mediaQuery.removeListener(onChange);
    }, []);

    useEffect(() => {
        if (!isDesktopViewport) {
            setIsDesktopCatalogActive(false);
            setIsDesktopCatalogMounted(false);
            return;
        }

        if (desktopCatalogCloseTimerRef.current !== null) {
            window.clearTimeout(desktopCatalogCloseTimerRef.current);
            desktopCatalogCloseTimerRef.current = null;
        }

        if (isCatalogOpen) {
            setIsDesktopCatalogMounted(true);
            const rafId = window.requestAnimationFrame(() => setIsDesktopCatalogActive(true));
            return () => window.cancelAnimationFrame(rafId);
        }

        setIsDesktopCatalogActive(false);
        desktopCatalogCloseTimerRef.current = window.setTimeout(() => {
            setIsDesktopCatalogMounted(false);
            desktopCatalogCloseTimerRef.current = null;
        }, 200);

        return undefined;
    }, [isCatalogOpen, isDesktopViewport]);

    useEffect(() => {
        return () => {
            if (desktopCatalogCloseTimerRef.current !== null) {
                window.clearTimeout(desktopCatalogCloseTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        // If the parent provided a non-empty custom `menuItems`, use them
        const providedMenuItems = Array.isArray(menuItems) && menuItems.length > 0;
        if (providedMenuItems) {
            setFetchedMenuItems(menuItems ?? []);
            return;
        }

        async function fetchMenus() {
            setMenusLoading(true);
            try {
                const currentLocale = (locale || "az").toLowerCase();

                const json = await fetchNavbarApiJson("/menus", {
                    locale: currentLocale,
                    params: { in_header: "1" },
                });

                // Extract array robustly from several possible response shapes
                const items: any[] = extractResponseItems(json);

                const filtered = (items as any[])
                    .filter((it) => !!it)
                    .filter((it) => ((it.type ?? "") + "").toString().toLowerCase() !== "categories")
                    .filter((it) => !it.parent_id || Number(it.parent_id) === 0);

                const mapped = filtered
                    .map((it: any) => {
                        const label = it.title ?? it.name ?? it.label ?? it.link ?? "";
                        const hrefPart = (it.multi_links && it.multi_links[currentLocale]) || it.link || "";
                        const href = hrefPart ? `/${currentLocale}/${hrefPart}` : "#";
                        return { label: String(label), href } as NavbarMenuItem;
                    })
                    .filter((m: NavbarMenuItem) => m.label && m.href);

                if (mounted) setFetchedMenuItems(mapped);
            } catch (err: any) {
                if (mounted) setFetchedMenuItems([]);
            } finally {
                if (mounted) setMenusLoading(false);
            }
        }

        void fetchMenus();

        return () => {
            mounted = false;
        };
    }, [locale, menuItems]);

    // Prefetch header categories in the background after mount so the catalog
    // list is available even before the user opens the dropdown. We avoid
    // fetching when the parent already provided `initialCatalogItems`.
    useEffect(() => {
        if (catalogItems.length > 0 || catalogLoading || catalogFetched) return;

        // Delay slightly to avoid competing with critical page work
        const timer = setTimeout(() => {
            void fetchCategories().catch(() => {});
        }, 500);

        return () => clearTimeout(timer);
    }, [catalogItems.length, catalogLoading, catalogFetched, fetchCategories]);

    useEffect(() => {
        if (!isCatalogOpen) return;
        function onDocClick(e: MouseEvent) {
            const target = e.target as Node;

            // If click happened inside the catalog dropdown (desktop) or inside the mobile aside, ignore
            if (catalogRef.current && catalogRef.current.contains(target)) return;
            if (mobileCatalogRef.current && mobileCatalogRef.current.contains(target)) return;

            // If click happened on the catalog toggle button (desktop or mobile), ignore
            if (catalogToggleRef.current && catalogToggleRef.current.contains(target)) return;
            if (mobileCatalogToggleRef.current && mobileCatalogToggleRef.current.contains(target)) return;

            setIsCatalogOpen(false);
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

    const catalogTree = useMemo(() => buildTree(catalogItems), [buildTree, catalogItems]);
    const rootCategories = useMemo(() => catalogTree.filter((cat: any) => !cat.parent_id || Number(cat.parent_id) === 0), [catalogTree]);

    useEffect(() => {
        if (rootCategories.length === 0) {
            setActiveParentId(null);
            return;
        }

        if (activeParentId == null || !rootCategories.some((cat: any) => Number(cat.id) === Number(activeParentId))) {
            setActiveParentId(Number(rootCategories[0]?.id));
        }
    }, [rootCategories, activeParentId]);

    const activeParent = useMemo(
        () => rootCategories.find((cat: any) => Number(cat.id) === Number(activeParentId)) ?? rootCategories[0],
        [rootCategories, activeParentId]
    );
    const activeParentChildren = Array.isArray(activeParent?.children) ? activeParent.children : [];

    const effectiveMenuItems: NavbarMenuItem[] = fetchedMenuItems ?? (menuItems ?? []);

    const renderCatalogChild = (child: any) => {
        const childHref = `/${(locale || "az").toLowerCase()}/${(child.multi_links && child.multi_links[(locale || "az").toLowerCase()]) || child.link || ""}`;

        return (
            <div key={child.id} className="min-w-0 p-0">
                <div className="flex items-start gap-3 px-0 py-4 rounded-md h-full">
                    <div className="hidden lg:flex h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                        {child.icon && child.icon.image_url ? (
                            <img src={child.icon.image_url} alt={child.name ?? ""} className="h-full w-full object-cover" />
                        ) : (
                            <ParentCategoryIcon category={child} className="size-[14px] lg:size-[18px] lg:text-[#131722]" />
                        )}
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                        <a href={childHref} className="text-[13.3px] leading-[1.2] font-bold text-[#131722] whitespace-normal break-words transition-colors duration-100 hover:text-[#00a9c8]">
                            {child.name ?? child.title ?? child.link}
                        </a>

                        {Array.isArray(child.children) && child.children.length > 0 && (
                            <ul className="mt-2 space-y-1 pl-0 text-[14px] leading-[1.3] text-[#5a6475]">
                                {child.children.map((subChild: any) => (
                                    <li key={subChild.id}>
                                        <a
                                            href={`/${(locale || "az").toLowerCase()}/${(subChild.multi_links && subChild.multi_links[(locale || "az").toLowerCase()]) || subChild.link || ""}`}
                                            className="block rounded px-0 py-0.5 whitespace-normal break-words text-[13.3px] hover:underline transition-colors duration-75"
                                            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                                        >
                                            {subChild.name ?? subChild.title ?? subChild.link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (!isDesktopCatalogMounted) {
            setCatalogPortalPos(null);
            setCatalogOverlayTop(null);
            return;
        }

        const update = () => {
            // Prefer visible toggle button as anchor (mobile or desktop), fallback to container
            const desktopAnchor = catalogToggleRef.current;
            const mobileAnchor = mobileCatalogToggleRef.current;
            let anchorEl: Element | null = null;

            if (mobileAnchor && mobileAnchor.offsetParent !== null) anchorEl = mobileAnchor;
            else if (desktopAnchor && desktopAnchor.offsetParent !== null) anchorEl = desktopAnchor;
            else anchorEl = containerRef.current;

            if (!anchorEl) return;

            const rect = (anchorEl as Element).getBoundingClientRect();
            const dropdownWidth = Math.min(1280, window.innerWidth - 24);
            const margin = 12;

            // align dropdown left edge with anchor button's left edge
            let left = rect.left;
            left = Math.max(margin, Math.min(left, window.innerWidth - dropdownWidth - margin));

            const containerRect = containerRef.current?.getBoundingClientRect();
            // anchor the dropdown top to the navbar/container bottom so it visually joins navbar border
            const top = containerRect ? containerRect.bottom : rect.bottom;

            const overlayTop = containerRect ? containerRect.bottom : rect.bottom;

            setCatalogPortalPos({ top, left, width: dropdownWidth });
            setCatalogOverlayTop(overlayTop);
        };

        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, { passive: true });
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
        };
    }, [isDesktopCatalogMounted]);

    const toggleMobileExpanded = (id: number) => {
        setMobileExpandedIds((prev) => {
            const nid = Number(id);
            return prev.includes(nid) ? prev.filter((x) => x !== nid) : [...prev, nid];
        });
    };

    const renderMobileTree = (items: any[], level = 0): React.ReactNode => {
        if (!Array.isArray(items) || items.length === 0) return null;

        return (
            <ul className="space-y-0">
                {items.map((item: any) => {
                    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                    const expanded = mobileExpandedIds.includes(Number(item.id));
                    const href = `/${(locale || "az").toLowerCase()}/${(item.multi_links && item.multi_links[(locale || "az").toLowerCase()]) || item.link || ""}`;
                    const isRoot = level === 0 || !item.parent_id || Number(item.parent_id) === 0;
                    const rowIndent = level <= 1 ? 0 : 36 * Math.pow(2, level - 2);

                    return (
                        <li key={item.id} className="border-b border-[#e5e7eb] last:border-b-0">
                            <div
                                className="flex items-center justify-between gap-3 rounded-lg px-0 py-2 text-left lg:px-0 lg:py-3"
                                style={{ paddingLeft: rowIndent }}
                            >
                                <a href={href} className="flex items-center gap-3 flex-1" onClick={() => setIsCatalogOpen(false)}>
                                    {isRoot ? (
                                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md lg:h-10 lg:w-10">
                                            {item.icon && item.icon.image_url ? (
                                                <img src={item.icon.image_url} alt={item.name ?? ""} className="h-full w-full object-cover" />
                                            ) : (
                                                <ParentCategoryIcon category={item} className="size-[14px] lg:size-[18px]" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md lg:h-10 lg:w-10">
                                            <div className="hidden lg:block h-full w-full">
                                                {item.icon && item.icon.image_url ? (
                                                    <img src={item.icon.image_url} alt={item.name ?? ""} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ParentCategoryIcon category={item} className="size-[14px] lg:size-[18px] lg:text-[#131722]" />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <span className={cn("text-[14px] text-[#131722]", isRoot ? "font-bold" : "font-normal")}>{item.name ?? item.title ?? item.link}</span>
                                </a>

                                {hasChildren && (
                                    <button
                                        type="button"
                                        aria-expanded={expanded}
                                        onPointerDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleMobileExpanded(Number(item.id));
                                        }}
                                        className="inline-flex cursor-pointer touch-manipulation items-center justify-center rounded-full p-2 text-[#1d2230] hover:bg-[#f3f4f6]"
                                    >
                                        <ChevronDown className={cn("mobile-catalog-chevron size-5 shrink-0", expanded && "is-expanded")} strokeWidth={2} />
                                    </button>
                                )}
                            </div>

                            {hasChildren && (
                                <MobileCatalogCollapsible
                                    expanded={expanded}
                                    renderContent={() => renderMobileTree(item.children, level + 1)}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <header data-slot="navbar" className={cn(navbarClasses.root, className)}>
            <div className={navbarClasses.container} ref={containerRef}>
                <div className={navbarClasses.topRow}>
                    <NavbarLogo logo={logo} logoHref={logoHref} />
                    <div className="hidden lg:block">
                        <NavbarSearch searchPlaceholder={searchPlaceholder} locale={locale} onSearchProducts={onSearchProducts} />
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
                            <div className="relative" ref={mobileLocaleDropdownRef}>
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
                            className="inline-flex size-8 cursor-pointer touch-manipulation items-center justify-center rounded-[10px] bg-white text-[#1d2230] transition-colors hover:bg-[#f3f4f6]"
                            onPointerDown={(e) => {
                                if (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen") {
                                    e.preventDefault();
                                    setIsMobileMenuOpen(true);
                                }
                            }}
                            onClick={(e) => {
                                if (e.detail === 0) setIsMobileMenuOpen(true);
                            }}
                        >
                            <Menu className="size-5" />
                        </button>
                    </div>
                </div>

                <div className={navbarClasses.bottomRow}>
                    <div className="relative">
                        <CatalogButton open={isCatalogOpen} onClick={toggleCatalog} toggleRef={catalogToggleRef} />

                        {isDesktopCatalogMounted && catalogOverlayTop !== null && typeof document !== "undefined"
                            ? createPortal(
                                  <div
                                      role="presentation"
                                      onClick={() => setIsCatalogOpen(false)}
                                      style={{
                                          position: "fixed",
                                          top: `${catalogOverlayTop}px`,
                                          left: 0,
                                          right: 0,
                                          bottom: 0,
                                          background: "rgba(0,0,0,0.55)",
                                          zIndex: 1040,
                                      }}
                                      className={cn("desktop-catalog-overlay hidden lg:block", isDesktopCatalogActive && "is-active")}
                                  />,
                                  document.body
                              )
                            : null}

                        {isDesktopCatalogMounted && catalogPortalPos !== null && typeof document !== "undefined"
                            ? createPortal(
                                  <div
                                      ref={catalogRef}
                                      role="menu"
                                      aria-hidden={!isCatalogOpen}
                                      style={{
                                          position: "fixed",
                                          top: `${catalogPortalPos.top}px`,
                                          left: `${catalogPortalPos.left}px`,
                                          width: `${catalogPortalPos.width}px`,
                                          transform: "none",
                                          zIndex: 1050,
                                      }}
                                      className={cn(
                                          "desktop-catalog-panel hidden lg:block h-[560px] overflow-hidden border border-[#dfe3eb] border-t-0 bg-white shadow-[0_-10px_24px_rgba(17,24,39,0.10)]",
                                          isDesktopCatalogActive && "is-active"
                                      )}
                                  >
                                      {catalogLoading ? (
                                          <div className="h-full flex items-center justify-center">
                                                <Spinner size={30} strokeWidth={1.5} className="text-black" />
                                          </div>
                                      ) : catalogError ? (
                                          <div className="py-6 text-center text-sm text-red-500">Xəta: {catalogError}</div>
                                      ) : rootCategories.length > 0 ? (
                                          <div className="grid h-full grid-cols-[300px_1fr]">
                                              <div className="h-full overflow-y-auto bg-[#003dff] text-white lg:bg-white lg:text-[#131722]">
                                                  <ul className="divide-y divide-white/10 lg:divide-gray-200">
                                                      {rootCategories.map((parent: any) => {
                                                          const isActive = Number(parent.id) === Number(activeParent?.id);
                                                          return (
                                                              <li key={parent.id}>
                                                                <button
                                                                    type="button"
                                                                    onMouseEnter={() => setActiveParentId(Number(parent.id))}
                                                                    onClick={() => setActiveParentId(Number(parent.id))}
                                                                    className={cn(
                                                                        "flex h-[52px] w-full items-center justify-between gap-3 px-4 text-left text-[13.3px] font-bold transition-colors cursor-pointer lg:text-[#131722]",
                                                                        isActive
                                                                            ? "bg-[#003dff] text-white lg:bg-white lg:text-[#131722]"
                                                                            : "bg-transparent text-white hover:bg-[#0256ff] lg:bg-transparent lg:text-[#131722] lg:hover:bg-[#f3f4f6]"
                                                                    )}
                                                                >
                                                                    <span className="flex min-w-0 items-center gap-3">
                                                                                                                <ParentCategoryIcon category={parent} className="size-[14px] lg:size-[18px] text-white lg:text-[#131722]" />
                                                                                                                <span className="truncate">{parent.name ?? parent.title ?? parent.link}</span>
                                                                </span>
                                                                      <ChevronDown
                                                                          className={cn(
                                                                              "size-[14px] shrink-0 text-white lg:text-[#131722] transition-transform duration-150",
                                                                              isActive ? "-rotate-90" : "rotate-0"
                                                                          )}
                                                                          strokeWidth={2}
                                                                      />
                                                                  </button>
                                                              </li>
                                                          );
                                                      })}
                                                  </ul>
                                              </div>

                                              <div className="h-full overflow-y-auto bg-white px-3 lg:px-4">
                                                {activeParentChildren.length > 0 ? (
                                                          <div className="grid grid-cols-4 gap-2 px-0">
                                                              {activeParentChildren.map((child: any) => renderCatalogChild(child))}
                                                          </div>
                                                      ) : (
                                                  <div className="px-4 py-4 text-sm text-[#6b7280]">Bu kateqoriya üçün alt bölmə yoxdur</div>
                                                  )}
                                              </div>
                                          </div>
                                      ) : (
                                          // Only show "no catalog" after we've attempted a fetch
                                          catalogFetched ? (
                                              <div className="px-5 py-4 text-sm text-[#6b7280]">Kataloq mövcud deyil</div>
                                          ) : null
                                      )}
                                  </div>,
                                  document.body
                                                            )
                                                        : null}
                    </div>
                    <NavbarMenu menuItems={effectiveMenuItems} />
                    <NavbarActions
                        locale={locale}
                        isAuthenticated={isAuthenticated}
                        authUser={authUser}
                        favoritesCount={favoritesCount}
                        compareCount={compareCount}
                        cartCount={cartCount}
                        onCartClick={onCartClick}
                    />
                </div>

                <div className="mt-1 flex items-center gap-2 bg-[#f4f5f7] px-2 py-2.5 lg:hidden">
                    <button
                        type="button"
                        ref={mobileCatalogToggleRef}
                        onPointerDown={(e) => {
                            if (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen") {
                                e.preventDefault();
                                toggleCatalog();
                            }
                        }}
                        onClick={(e) => {
                            if (e.detail === 0) toggleCatalog();
                        }}
                        aria-haspopup="true"
                        aria-expanded={isCatalogOpen}
                        className="inline-flex h-9 shrink-0 cursor-pointer touch-manipulation items-center gap-1 rounded-[10px] bg-[#ffd500] px-3 text-[13px] font-medium text-[#171717]"
                    >
                        <Grid2X2 className="size-[14px]" />
                        Kataloq
                        <ChevronDown
                            className={cn(
                                "size-5 shrink-0 transform transition-transform duration-200",
                                isCatalogOpen ? "rotate-180" : "rotate-0"
                            )}
                            strokeWidth={2}
                        />
                    </button>
                    <NavbarSearch searchPlaceholder={searchPlaceholder} compact locale={locale} onSearchProducts={onSearchProducts} />
                </div>
            </div>

            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/35 transition-opacity duration-200 lg:hidden",
                    isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full w-[84%] max-w-[320px] bg-white shadow-[8px_0_30px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out lg:hidden flex flex-col",
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
                        <span className="flex min-w-0 shrink overflow-hidden [&_img]:h-auto [&_img]:w-auto [&_img]:max-w-[150px]">
                            {logo ?? null}
                        </span>
                    </a>
                    <button
                        type="button"
                        aria-label="Menyunu bağla"
                        className="inline-flex size-9 cursor-pointer touch-manipulation items-center justify-center rounded-[10px] text-[#1d2230] transition-colors hover:bg-[#f3f4f6]"
                        onPointerDown={(e) => {
                            if (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen") {
                                e.preventDefault();
                                setIsMobileMenuOpen(false);
                            }
                        }}
                        onClick={(e) => {
                            if (e.detail === 0) setIsMobileMenuOpen(false);
                        }}
                    >
                        <X className="size-5 shrink-0" />
                    </button>
                </div>

                <div className="mx-4 border-b border-[#e8eaef]" />

                <div className="overflow-y-auto px-4 flex-1">
                    <nav className="flex flex-col py-3">
                        {effectiveMenuItems.map((item) => (
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

                    <div className="pb-3">
                        {isAuthenticated ? (
                            <Link
                                href={`/${locale.toLowerCase()}/account`}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1448F4] px-6 text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <UserRound className="size-[16px]" />
                                <span className="max-w-[210px] truncate">{getAuthDisplayName(authUser)}</span>
                            </Link>
                        ) : (
                            <Link
                                href={`/${locale.toLowerCase()}/signin`}
                                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1f4fff] px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-95"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <UserRound className="size-[16px]" />
                                Daxil ol
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pb-5">
                        <Link
                            href={`/${locale.toLowerCase()}/wishlist`}
                            aria-label="Seçilmişlər"
                            className="relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <Heart className="size-[18px]" />
                            {favoritesCount > 0 ? (
                                <span className="absolute -top-1 -right-1 inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full bg-[#ffd500] px-1 text-[11px] leading-none font-bold text-[#121212]">
                                    {favoritesCount > 99 ? "99+" : String(favoritesCount)}
                                </span>
                            ) : null}
                        </Link>
                        <Link
                            href={`/${locale.toLowerCase()}/compare`}
                            aria-label="Müqayisə"
                            className="relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <GitCompareArrows className="size-[18px]" />
                            {compareCount > 0 ? (
                                <span className="absolute -top-1 -right-1 inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full bg-[#ffd500] px-1 text-[11px] leading-none font-bold text-[#121212]">
                                    {compareCount > 99 ? "99+" : String(compareCount)}
                                </span>
                            ) : null}
                        </Link>
                        <button
                            type="button"
                            aria-label="Səbət"
                            onClick={onCartClick}
                            className="relative inline-flex size-11 overflow-visible cursor-pointer items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff] transition-colors duration-200 hover:bg-[#f1f3f7]"
                        >
                            <ShoppingCart className="size-[18px]" />
                            {cartCount > 0 ? (
                                <span className="absolute top-0 right-0 translate-x-[10%] -translate-y-[20%] inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[4px] bg-[#ffd500] text-[10px] leading-none font-bold text-[#121212]">
                                    {cartCount > 99 ? "99+" : String(cartCount)}
                                </span>
                            ) : null}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile catalog overlay */}
            <div
                className={cn("mobile-catalog-overlay fixed inset-0 z-40 bg-black/35 lg:hidden", isCatalogOpen && "is-active")}
                onClick={() => setIsCatalogOpen(false)}
            />

            <aside
                className={cn(
                    "mobile-catalog-panel fixed top-0 left-0 z-50 h-full w-full max-w-none overflow-y-auto bg-white shadow-[8px_0_30px_rgba(0,0,0,0.12)] lg:hidden",
                    isCatalogOpen && "is-active"
                )}
                ref={mobileCatalogRef}
                aria-hidden={!isCatalogOpen}
            >
                <div className="flex items-center justify-between px-6 lg:px-4 pt-4 pb-3 bg-[#003dff] text-white">
                    <div className="flex items-center gap-2">
                        <Grid2X2 className="size-[18px] text-white" />
                        <span className="text-[16px] font-bold">Kataloq</span>
                    </div>
                    <button
                        type="button"
                        aria-label="Kataloqu bağla"
                        className="inline-flex size-9 cursor-pointer touch-manipulation items-center justify-center rounded-[10px] text-white transition-colors hover:bg-white/10"
                        onPointerDown={(e) => {
                            if (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen") {
                                e.preventDefault();
                                setIsCatalogOpen(false);
                            }
                        }}
                        onClick={(e) => {
                            if (e.detail === 0) setIsCatalogOpen(false);
                        }}
                    >
                        <X className="size-5 shrink-0 text-white" />
                    </button>
                </div>

                <div className="pl-4 pr-6 lg:pl-1 lg:pr-3 lg:py-4">
                    {renderMobileTree(rootCategories)}
                </div>
            </aside>
        </header>
    );
}
