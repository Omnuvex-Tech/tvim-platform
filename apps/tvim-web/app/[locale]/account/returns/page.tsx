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
    { label: "Sifariş tarixçəsi", href: "/account/orders", icon: Package },
    { label: "Hesabı redaktə et", href: "/account/edit", icon: UserRound },
    { label: "Şifrə", href: "/account/password", icon: Lock },
    { label: "Ünvan kitabçası", href: "/account/address", icon: MapPin },
    { label: "Bəyənilənlər", href: "/wishlist", icon: Heart },
    { label: "Geri qaytarma", href: "/account/returns", icon: FontAwesomeReplyIcon },
    { label: "Çıxış", href: "/logout", icon: LogOut },
];

export default async function AccountReturnsPage({
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

    const chrome = await getSiteChromeData(locale);

    const activeHref = "/account/returns";
    const pageTitle = normalizedLocale === "en" ? "Returns" : normalizedLocale === "ru" ? "Возвраты" : "Geri qaytarma";
    const emptyMessage =
        normalizedLocale === "en"
            ? "You don't have any return requests yet!"
            : normalizedLocale === "ru"
              ? "У вас пока нет запросов на возврат!"
              : "Sizin hər hansı geri qaytarma sorğunuz mövcud deyil!";
    const continueLabel = normalizedLocale === "en" ? "Continue" : normalizedLocale === "ru" ? "Продолжить" : "Davam et";

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: accountPageMeta.name, href: `/${locale}/account` },
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
                                                    isActive
                                                        ? "text-[#0D47FF]"
                                                        : "text-[#707887] group-hover:text-[#0D47FF]"
                                                }`}
                                            />
                                            <span>{label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </aside>

                    <section className="w-full rounded-[20px] bg-white px-5 py-6 sm:px-7 sm:py-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[14px] leading-[1.5] font-medium text-[#202938] sm:text-[15px]">
                                {emptyMessage}
                            </p>
                            <Link
                                href={`/${locale}`}
                                className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[#0f57d6] px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0c4fc6]"
                            >
                                {continueLabel}
                            </Link>
                        </div>
                    </section>
                </div>
            </section>

            <div className="mx-auto mt-12 w-full max-w-[1280px] px-0 lg:mt-14">
                <RequestForm />
            </div>
        </SitePageShell>
    );
}
