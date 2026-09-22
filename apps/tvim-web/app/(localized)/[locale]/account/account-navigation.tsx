import type { ComponentType } from "react";
import Link from "next/link";
import { Heart, LogOut, Lock, MapPin, Package, UserRound } from "lucide-react";
import { localizedPathname } from "@/lib/routes";
import { getTranslations } from "@/lib/i18n";

export type AccountNavIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

type AccountLabels = ReturnType<typeof getTranslations>["account"];

/** Labels are looked up per request, so the menu follows the active locale. */
type AccountNavLabelKey = {
    [K in keyof AccountLabels]: AccountLabels[K] extends string ? K : never;
}[keyof AccountLabels];

export type AccountNavItem = {
    labelKey: AccountNavLabelKey;
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
    { labelKey: "myAccount", href: "/account", icon: UserRound },
    { labelKey: "orderHistory", href: "/account/orders", icon: Package },
    { labelKey: "editAccount", href: "/account/edit", icon: UserRound },
    { labelKey: "password", href: "/account/password", icon: Lock },
    { labelKey: "addressBook", href: "/account/address", icon: MapPin },
    { labelKey: "favorites", href: "/account/wishlist", icon: Heart },
    { labelKey: "returns", href: "/account/returns", icon: FontAwesomeReplyIcon },
];

/**
 * Logging out destroys the session, so it is posted rather than linked. As a
 * <Link> it was prefetched by the router — which requests the url, which runs the
 * handler — and every visit to an account page silently signed the user out.
 */
const logoutAction = (locale: string) => localizedPathname("/logout", locale);

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
    const t = getTranslations(locale);

    return (
        <div className={className}>
            {accountNavItems.map(({ labelKey, href, icon: Icon }) => {
                const isActive = href === activeHref;
                const label = t.account[labelKey];

                return (
                    <Link
                        href={localizedPathname(href, locale)}
                        key={href}
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

            {/* `contents` keeps the button itself as the grid cell. */}
            <form action={logoutAction(locale)} method="post" className="contents">
                <button
                    type="submit"
                    className="flex min-h-[118px] w-full cursor-pointer flex-col items-center justify-center rounded-[18px] border border-[#D8E1EC] bg-white px-4 py-4 text-center text-[#565F6F] transition-colors"
                >
                    <LogOut className="size-[34px] text-[34px] text-[#808080]" strokeWidth={1.9} />
                    <p className="mt-3 text-[13px] leading-[1.25] font-medium">{t.common.logout}</p>
                </button>
            </form>
        </div>
    );
}

type AccountNavigationProps = {
    locale: string;
    activeHref: string;
    showMobile?: boolean;
};

export function AccountNavigation({ locale, activeHref, showMobile = true }: AccountNavigationProps) {
    const t = getTranslations(locale);

    return (
        <div className={showMobile ? "w-full" : "hidden w-full lg:block"}>
            <aside className={showMobile ? "hidden w-full max-w-[260px] lg:block" : "w-full max-w-[260px]"}>
                <h2 className="-mt-1 px-3 text-[13px] leading-none font-bold text-[#0F131A] sm:text-[16px]">{t.account.navigation}</h2>
                <div className="mt-5 border-t border-[#D2D9E4]" />

                <ul className="mt-0.5 space-y-0.5">
                    {accountNavItems.map(({ labelKey, href, icon: Icon }) => {
                        const isActive = href === activeHref;
                        const label = t.account[labelKey];

                        return (
                            <li key={href}>
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

                    <li>
                        <form action={logoutAction(locale)} method="post" className="contents">
                            <button
                                type="submit"
                                className="group inline-flex min-h-0 w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[14px] font-medium text-[#0F131A] transition-colors hover:bg-[#F0F1F3] hover:text-[#0D47FF]"
                            >
                                <LogOut className="size-5 text-[20px] text-[#707887] transition-colors group-hover:text-[#0D47FF]" />
                                <span>{t.common.logout}</span>
                            </button>
                        </form>
                    </li>
                </ul>
            </aside>

            <nav className={showMobile ? "lg:hidden" : "hidden"} aria-label="Account navigation">
                <AccountNavigationGrid locale={locale} activeHref={activeHref} />
            </nav>
        </div>
    );
}
