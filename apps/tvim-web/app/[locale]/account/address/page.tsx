import type { ComponentType } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { Heart, LogOut, Lock, MapPin, Package, UserRound } from "lucide-react";
import { config } from "@/config";
import { api } from "@/lib/api";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { getSiteChromeData } from "@/lib/site-chrome";
import { AddressClient } from "./address-client";

type NavItem = {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
};

type Address = {
    id: number;
    type: string | null;
    label: string | null;
    recipient_name: string | null;
    phone: string | null;
    country_id: number | null;
    delivery_price_id: number | null;
    region: string | null;
    city: string | null;
    postal_code: string | null;
    address_line1: string | null;
    address_line2: string | null;
    company: string | null;
    note: string | null;
    is_default: boolean | null;
    status: boolean | null;
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
    { label: "Sifariş tarixçəsi", href: "/account/orders", icon: Package },
    { label: "Hesabı redaktə et", href: "/account/edit", icon: UserRound },
    { label: "Şifrə", href: "/account/password", icon: Lock },
    { label: "Ünvan kitabçası", href: "/account/address", icon: MapPin },
    { label: "Bəyənilənlər", href: "/wishlist", icon: Heart },
    { label: "Geri qaytarma", href: "/account/returns", icon: FontAwesomeReplyIcon },
    { label: "Çıxış", href: "/logout", icon: LogOut },
];

export default async function AccountAddressPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: routeLocale } = await params;
    const locale = routeLocale.trim().toLowerCase();
    const normalizedLocale = (["az", "ru", "en"].includes(locale) ? locale : "az") as "az" | "ru" | "en";
    const homePageMeta = config.pages.home[normalizedLocale];
    const accountPageMeta = config.pages.account[normalizedLocale];

    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    if (!authToken) {
        redirect(`/${locale}/signin`);
    }

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);
    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code.toLowerCase() === locale)) {
        notFound();
    }

    const [chrome, addressesResponse] = await Promise.all([
        getSiteChromeData(locale),
        api.get<Address[]>("/customer/addresses", {
            locale,
            headers: { Authorization: `Bearer ${authToken}` },
            cache: "no-store",
        }),
    ]);

    const activeHref = "/account/address";
    const pageTitle = "Ünvan kitabçası";
    const addresses = addressesResponse.success && Array.isArray(addressesResponse.data) ? addressesResponse.data : [];

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: accountPageMeta.name, href: accountPageMeta.url },
                    { label: pageTitle, isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle={pageTitle}
                titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-5 pb-12 lg:px-2 lg:pt-6 lg:pb-14">
                <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
                    <aside className="hidden w-full max-w-[260px] lg:block">
                        <h2 className="-mt-1 px-3 text-[13px] leading-none font-bold text-[#0F131A] sm:text-[16px]">Naviqasiya</h2>
                        <div className="mt-5 border-t border-[#D2D9E4]" />

                        <ul className="mt-0.5 space-y-0.5">
                            {navItems.map(({ label, href, icon: Icon }) => {
                                const isActive = href === activeHref;
                                return (
                                    <li key={label}>
                                        <Link
                                            href={`/${locale}${href}`}
                                            className={`group inline-flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                                                isActive
                                                    ? "bg-[#F0F1F3] text-[#0D47FF]"
                                                    : "text-[#0F131A] hover:bg-[#F0F1F3] hover:text-[#0D47FF]"
                                            }`}
                                        >
                                            <Icon
                                                className={`size-4 transition-colors ${
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

                    <AddressClient locale={locale} initialAddresses={addresses} />
                </div>
            </section>

            <div className="mx-auto mt-12 w-full max-w-[1280px] px-0 lg:mt-14">
                <RequestForm />
            </div>
        </SitePageShell>
    );
}
