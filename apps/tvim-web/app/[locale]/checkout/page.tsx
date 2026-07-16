import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Language } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { Breadcrumb } from "@repo/ui";
import CheckoutClient from "@/app/checkout/checkout-client";
import type { CheckoutData } from "@/app/checkout/checkout-client";
import { getMainPageRequestFormProps } from "@/lib/main-page";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/guest/session";
import { getPublicLanguages } from "@/lib/public-data";
import { getSiteChromeData } from "@/lib/site-chrome";

export const metadata = buildNoIndexMetadata();

type LocaleCode = "az" | "ru" | "en";
const SUPPORTED_LOCALES: LocaleCode[] = ["az", "ru", "en"];

const normalizeLocale = (value: string): LocaleCode => {
    const lower = value.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(lower as LocaleCode) ? (lower as LocaleCode) : "az";
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const fetchCheckoutData = async (locale: string, authToken: string | null, guestToken: string | null): Promise<CheckoutData | null> => {
    const url = normalizeApiUrl(config.api.url, "/order/checkout");

    try {
        const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Language": locale,
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
            },
        });

        let payload: unknown = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok || !payload || typeof payload !== "object") {
            return null;
        }

        const typed = payload as { success?: boolean; data?: unknown };
        if (typed.success === false) {
            return null;
        }

        return (typed.data ?? null) as CheckoutData | null;
    } catch {
        return null;
    }
};

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale: routeLocale } = await params;
    const locale = normalizeLocale(routeLocale);
    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const guestToken = decodeGuestTokenFromCookie(cookieStore.get(GUEST_TOKEN_COOKIE)?.value);

    const languages = await getPublicLanguages();

    if (languages.length === 0) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">Languages could not be loaded.</p>
            </div>
        );
    }

    if (!SUPPORTED_LOCALES.includes(locale) || !languages.some((language) => language.code.toLowerCase() === locale)) {
        notFound();
    }

    const [chrome, checkoutData, requestFormProps] = await Promise.all([
        getSiteChromeData(locale),
        fetchCheckoutData(locale, authToken, guestToken),
        getMainPageRequestFormProps(locale),
    ]);

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: "Ana səhifə", href: `/${locale}` },
                    { label: "Sifariş rəsmiləşdirmə", isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle="Sifariş rəsmiləşdirmə"
                titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
            />

            <div className="mx-auto mt-3 w-full max-w-[1280px] px-3 lg:mt-4 lg:px-0">
                <CheckoutClient
                    locale={locale}
                    initialCheckout={checkoutData}
                    isAuthenticated={Boolean(authToken)}
                    requestFormProps={requestFormProps}
                />
            </div>
        </SitePageShell>
    );
}
