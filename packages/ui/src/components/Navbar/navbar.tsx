import {
    ChevronDown,
    GitCompareArrows,
    Grid2X2,
    Heart,
    Search,
    ShoppingCart,
    UserRound,
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

function sanitizePhone(phone: string) {
    return phone.replace(/\s|\(|\)|-/g, "");
}

function PhoneHandsetIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px]" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M6.64 10.79a15.47 15.47 0 0 0 6.57 6.57l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.85 21 3 13.15 3 3c0-.55.45-1 1-1h3.52c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.24 1.01l-2.21 2.21Z"
                fill="#12151D"
            />
            <path
                d="M15.7 4.3a4.7 4.7 0 0 1 4 4"
                stroke="#2258F6"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path d="M18.35 3.35a6.7 6.7 0 0 1 2.3 2.3" stroke="#2258F6" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function NavbarLogo() {
    return (
        <a href="#" className="flex min-w-[240px] items-end gap-1.5">
            <span className="text-[52px] leading-none font-semibold tracking-[-0.03em] text-[#111318]">tvim</span>
            <span className="mb-1 inline-flex size-[13px] shrink-0" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.2 5.3L6 1.5L10.8 5.3V10.8H1.2V5.3Z" fill="#2258F6" />
                </svg>
            </span>
            <span className="mb-1 text-[13px] font-normal text-[#616672]">Tikinti və inşaat materialları</span>
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
    return (
        <div className="ml-auto flex items-center gap-4 lg:ml-0 lg:justify-self-end">
            <a href={`tel:${sanitizePhone(phone)}`} className="flex items-center gap-2 text-[17px] leading-none font-bold text-[#12151d]">
                <PhoneHandsetIcon />
                <span>{phone}</span>
            </a>

            <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-[#d7deea] bg-white px-3.5 text-[15px] font-semibold text-[#1d2230]"
            >
                <span className="inline-flex h-[14px] w-[22px] overflow-hidden rounded-[2px] border border-black/10" aria-hidden="true">
                    <svg viewBox="0 0 22 14" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                        <rect width="22" height="14" fill="#0099E6" />
                        <rect y="4.666" width="22" height="4.666" fill="#ED2939" />
                        <rect y="9.332" width="22" height="4.668" fill="#3F9C35" />
                        <circle cx="10.2" cy="7" r="2.15" fill="#fff" />
                        <circle cx="10.9" cy="7" r="1.75" fill="#ED2939" />
                        <path d="M13.72 5.72l.24.73h.77l-.62.45.24.74-.63-.46-.62.46.24-.74-.62-.45h.77l.23-.73Z" fill="#fff" />
                    </svg>
                </span>
                <span className="leading-none">{locale}</span>
                <ChevronDown className="size-4 text-[#2e3441]" />
            </button>
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
        <nav className="flex flex-wrap items-center gap-8 px-2 text-[14px] font-bold text-[#151822] lg:-ml-4 lg:-translate-y-.5 lg:justify-end">
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
