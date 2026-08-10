import type { ComponentType } from "react";
import Link from "next/link";
import { Heart, LogOut, Lock, MapPin, Package, UserRound } from "lucide-react";
import { localizedPathname } from "@/lib/routes";

export type AccountNavIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

export type AccountNavItem = {
    label: string;
    href: string;
    icon: AccountNavIcon;
};

const FontAwesomeReplyIcon = ({ className }: { className?: string; strokeWidth?: number }) => (
    <i
        className={`account-index__icon fa-solid fa-reply align-middle ${className ?? ""}`}
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

export const accountNavItems: AccountNavItem[] = [
    { label: "Hesabım", href: "/account", icon: UserRound },
    { label: "Sifariş tarixçəsi", href: "/account/orders", icon: Package },
    { label: "Hesabı redaktə et", href: "/account/edit", icon: UserRound },
    { label: "Şifrə", href: "/account/password", icon: Lock },
    { label: "Ünvan kitabçası", href: "/account/address", icon: MapPin },
    { label: "Bəyənilənlər", href: "/wishlist", icon: Heart },
    { label: "Geri qaytarma", href: "/account/returns", icon: FontAwesomeReplyIcon },
    { label: "Çıxış", href: "/logout", icon: LogOut },
];

type AccountNavigationGridProps = {
    locale: string;
    activeHref: string;
    className?: string;
};

export function AccountNavigationGrid({
    locale,
    activeHref,
    className = "grid w-full grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3",
}: AccountNavigationGridProps) {
    return (
        <div className={className}>
            {accountNavItems.map(({ label, href, icon: Icon }) => {
                const isActive = href === activeHref;

                return (
                    <Link
                        href={localizedPathname(href, locale)}
                        key={label}
                        className={`flex min-h-[118px] flex-col items-center justify-center rounded-[18px] border px-4 py-4 text-center transition-colors ${
                            isActive
                                ? "border-[#0D47FF] bg-[#EEF4FF] text-[#0D47FF]"
                                : "border-[#D8E1EC] bg-white text-[#565F6F]"
                        }`}
                    >
                        <Icon
                            className={isActive ? "size-[34px] text-[34px] text-[#0D47FF]" : "size-[34px] text-[34px] text-[#808080]"}
                            strokeWidth={1.9}
                        />
                        <p className="mt-3 text-[13px] leading-[1.25] font-medium">{label}</p>
                    </Link>
                );
            })}
        </div>
    );
}

type AccountNavigationProps = {
    locale: string;
    activeHref: string;
    showMobile?: boolean;
};

export function AccountNavigation({ locale, activeHref, showMobile = true }: AccountNavigationProps) {
    return (
        <div className={showMobile ? "w-full" : "hidden w-full lg:block"}>
            <aside className={showMobile ? "hidden w-full max-w-[260px] lg:block" : "w-full max-w-[260px]"}>
                <h2 className="-mt-1 px-3 text-[13px] leading-none font-bold text-[#0F131A] sm:text-[16px]">Naviqasiya</h2>
                <div className="mt-5 border-t border-[#D2D9E4]" />

                <ul className="mt-0.5 space-y-0.5">
                    {accountNavItems.map(({ label, href, icon: Icon }) => {
                        const isActive = href === activeHref;

                        return (
                            <li key={label}>
                                <Link
                                    href={localizedPathname(href, locale)}
                                    className={`group inline-flex min-h-0 w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                                        isActive
                                            ? "bg-[#F0F1F3] text-[#0D47FF]"
                                            : "text-[#0F131A] hover:bg-[#F0F1F3] hover:text-[#0D47FF]"
                                    }`}
                                >
                                    <Icon
                                        className={`size-5 text-[20px] transition-colors ${
                                            isActive ? "text-[#0D47FF]" : "text-[#707887] group-hover:text-[#0D47FF]"
                                        }`}
                                    />
                                    <span>{label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            <nav className={showMobile ? "lg:hidden" : "hidden"} aria-label="Account navigation">
                <AccountNavigationGrid locale={locale} activeHref={activeHref} />
            </nav>
        </div>
    );
}
