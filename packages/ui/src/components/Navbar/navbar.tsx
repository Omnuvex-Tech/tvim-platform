"use client";

import { useMemo, useState } from "react";
import {
    ChevronDown,
    GitCompareArrows,
    Grid2X2,
    Heart,
    Search,
    ShoppingCart,
    UserRound,
    PhoneCall
} from "lucide-react";
import { cn } from "../../lib/utils";

const navbarClasses = {
    root: "w-full border-b border-[#e8eaef] bg-white",
    container: "mx-auto flex w-full max-w-[1280px] flex-col px-4 sm:px-6 lg:px-8",
    topRow: "flex flex-wrap items-center gap-4 py-3.5 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-5",
    bottomRow: "flex flex-wrap items-center gap-5 py-2.5 lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-6",
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

function sanitizePhone(phone: string) {
    return phone.replace(/\s|\(|\)|-/g, "");
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

function NavbarLogo() {
    return (
        <a href="#" className="flex min-w-[240px] items-end gap-1.5">
            <span className="text-[52px] leading-none font-semibold tracking-[-0.03em] text-[#111318]">tvim</span>
            <span className="flex items-end gap-2 pb-[2px]">
                <span className="inline-flex size-[13px] shrink-0" aria-hidden="true">
                    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.2 5.3L6 1.5L10.8 5.3V10.8H1.2V5.3Z" fill="#2258F6" />
                    </svg>
                </span>
                <span className="text-[13px] leading-none font-normal whitespace-nowrap text-[#616672]">Tikinti və inşaat materialları</span>
            </span>
        </a>
    );
}

function NavbarSearch({ searchPlaceholder }: { searchPlaceholder: string }) {
    return (
        <div className="relative min-w-[320px] flex-1 lg:mx-auto lg:w-full lg:max-w-[470px]">
            <input
                type="text"
                placeholder={searchPlaceholder}
                className="h-12 w-full rounded-full bg-[#eef2f9] pl-5 pr-10 text-[14px] text-[#343943] outline-none placeholder:text-[#8a91a0]"
            />
            <Search className="pointer-events-none absolute top-1/2 right-3.5 size-[16px] -translate-y-1/2 text-[#8b91a0]" />
        </div>
    );
}

function NavbarContact({ phone, locale }: { phone: string; locale: string }) {
    const [isLocaleOpen, setIsLocaleOpen] = useState(false);
    const [selectedLocale, setSelectedLocale] = useState((locale || "AZ").toUpperCase());
    const activeLocale = useMemo(
        () => localeOptions.find((item) => item.code === selectedLocale) ?? defaultLocaleOption,
        [selectedLocale],
    );

    return (
        <div className="ml-auto flex items-center gap-4 lg:ml-0 lg:justify-self-end">
            <a href={`tel:${sanitizePhone(phone)}`} className="flex items-center gap-2 text-[17px] leading-none font-bold text-[#12151d]">
                <PhoneHandsetIcon />
                <span>{phone}</span>
            </a>

            <div className="relative">
                <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-[#d7deea] bg-white px-3.5 text-[15px] font-semibold text-[#1d2230]"
                    onClick={() => setIsLocaleOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isLocaleOpen}
                >
                    <span className="inline-flex h-[14px] w-[22px] overflow-hidden rounded-[2px] border border-black/10" aria-hidden="true">
                        <LocaleFlag country={activeLocale.country} />
                    </span>
                    <span className="leading-none">{activeLocale.code}</span>
                    <ChevronDown className={`size-4 text-[#2e3441] transition-transform ${isLocaleOpen ? "rotate-180" : "rotate-0"}`} />
                </button>

                {isLocaleOpen && (
                    <div className="absolute top-full right-0 z-30 mt-2 min-w-[120px] rounded-xl border border-[#d7deea] bg-white p-1.5 shadow-[0_10px_24px_rgba(17,24,39,0.12)]">
                        {localeOptions.map((item) => (
                            <button
                                key={item.code}
                                type="button"
                                className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[14px] font-medium text-[#1d2230] transition-colors ${
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
        </div>
    );
}

function CatalogButton() {
    return (
        <button
            type="button"
            className="inline-flex items-center gap-2 rounded-[20px] bg-[#ffd500] px-6 py-2.5 text-[15px] font-medium text-[#171717] lg:px-[38px] lg:py-[12px] lg:text-[16px]"
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
        <a key={item.label} href={item.href} className="transition-colors hover:text-[#1d4fff]">
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
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f4fff] px-11 text-[16px] font-medium text-white"
            >
                <UserRound className="size-[17px]" />
                Daxil ol
            </button>

            <button
                type="button"
                aria-label="Seçilmişlər"
                className="inline-flex size-12 items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff]"
            >
                <Heart className="size-[19px]" />
            </button>
            <button
                type="button"
                aria-label="Müqayisə"
                className="inline-flex size-12 items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff]"
            >
                <GitCompareArrows className="size-[19px]" />
            </button>
            <button
                type="button"
                aria-label="Səbət"
                className="inline-flex size-12 items-center justify-center rounded-full border-2 border-[#8ea1c8] text-[#2350ff]"
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
}: NavbarProps) {
    return (
        <header data-slot="navbar" className={cn(navbarClasses.root, className)}>
            <div className={navbarClasses.container}>
                <div className={navbarClasses.topRow}>
                    <NavbarLogo />
                    <NavbarSearch searchPlaceholder={searchPlaceholder} />
                    <NavbarContact phone={phone} locale={locale} />
                </div>

                <div className={navbarClasses.bottomRow}>
                    <CatalogButton />
                    <NavbarMenu menuItems={menuItems} />
                    <NavbarActions />
                </div>
            </div>
        </header>
    );
}
