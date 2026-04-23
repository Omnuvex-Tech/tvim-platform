"use client";

import { type ReactNode, useMemo, useState } from "react";
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

function NavbarContact({ phone, locale }: { phone: string; locale: string }) {
    const [isLocaleOpen, setIsLocaleOpen] = useState(false);
    const [selectedLocale, setSelectedLocale] = useState((locale || "AZ").toUpperCase());
    const activeLocale = useMemo(
        () => localeOptions.find((item) => item.code === selectedLocale) ?? defaultLocaleOption,
        [selectedLocale],
    );

    return (
        <div className="ml-auto flex items-center gap-4 lg:ml-0 lg:justify-self-end">
            <a href={`tel:${sanitizePhone(phone)}`} className="flex cursor-pointer items-center gap-2 text-[17px] leading-none font-bold text-[#12151d]">
                <PhoneHandsetIcon />
                <span>{phone}</span>
            </a>

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
                    <ChevronDown className={`size-4 text-[#2e3441] transition-transform ${isLocaleOpen ? "rotate-180" : "rotate-0"}`} />
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
}: NavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileLocaleOpen, setIsMobileLocaleOpen] = useState(false);
    const [mobileLocale, setMobileLocale] = useState((locale || "AZ").toUpperCase());
    const activeMobileLocale = useMemo(
        () => localeOptions.find((item) => item.code === mobileLocale) ?? defaultLocaleOption,
        [mobileLocale]
    );
    const whatsappHref = toWhatsappHref(phone);

    return (
        <header data-slot="navbar" className={cn(navbarClasses.root, className)}>
            <div className={navbarClasses.container}>
                <div className={navbarClasses.topRow}>
                    <NavbarLogo logo={logo} logoHref={logoHref} />
                    <div className="hidden lg:block">
                        <NavbarSearch searchPlaceholder={searchPlaceholder} />
                    </div>
                    <div className="hidden lg:block">
                        <NavbarContact phone={phone} locale={locale} />
                    </div>

                    <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:hidden">
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
                                <ChevronDown className={`size-3.5 text-[#2e3441] transition-transform ${isMobileLocaleOpen ? "rotate-180" : "rotate-0"}`} />
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
                    <CatalogButton />
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
