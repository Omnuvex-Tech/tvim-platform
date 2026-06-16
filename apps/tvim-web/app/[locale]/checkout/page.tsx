import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type {
    FooterMenusData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { buildNoIndexMetadata } from "@/lib/seo";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";
import { Breadcrumb } from "@repo/ui";
import CheckoutClient from "@/app/checkout/checkout-client";
import type { CheckoutData } from "@/app/checkout/checkout-client";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/guest/session";

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

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!SUPPORTED_LOCALES.includes(locale) || !langResponse.data.some((language) => language.code.toLowerCase() === locale)) {
        notFound();
    }

    const footerMenuResponse = await api.get<FooterMenusData>(config.endpoints.menus.list, {
        params: { in_footer: "1" },
        locale,
    });

    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        locale,
    });

    const footerMenus = footerMenuResponse.success && footerMenuResponse.data ? footerMenuResponse.data.footer : [];

    let projectSettings: ProjectSettingsData | undefined;
    if (settingsResponse.success && settingsResponse.data) {
        projectSettings = settingsResponse.data.data;
    }

    const navbarLogo = projectSettings?.general.images.logo ? (
        <img
            src={projectSettings.general.images.logo}
            alt={projectSettings.general.site_title}
            className="h-10 w-auto object-contain sm:h-12 lg:h-14"
        />
    ) : projectSettings?.general.site_title ? (
        <div className="text-[32px] leading-none font-semibold tracking-[-0.02em] text-[#111318]">
            {projectSettings.general.site_title}
        </div>
    ) : undefined;

    const navbarPhone = projectSettings?.general.phones.find(
        (phone) => phone.is_whatsapp && phone.number.trim().startsWith("+994")
    )?.number;

    const checkoutData = await fetchCheckoutData(locale, authToken, guestToken);

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={locale}
                languages={langResponse.data}
                menuItems={[]}
                initialCatalogItems={[]}
            />

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
                <CheckoutClient locale={locale} initialCheckout={checkoutData} isAuthenticated={Boolean(authToken)} />
            </div>

            <div className="mt-16 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
            </div>
        </div>
    );
}
