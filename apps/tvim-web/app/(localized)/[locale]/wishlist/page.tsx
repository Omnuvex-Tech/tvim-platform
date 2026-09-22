import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { getMainPageRequestFormProps } from "@/lib/main-page";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { FAVORITES_GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/favorites/session";
import { getSiteChromeData } from "@/lib/site-chrome";
import { fetchFavoriteProducts } from "@/lib/favorites/list";
import { WishlistProductsGrid } from "./wishlist-products-grid";

export const metadata = buildNoIndexMetadata();

export default async function WishlistPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: routeLocale } = await params;
    const locale = routeLocale.trim().toLowerCase();

    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const guestToken = decodeGuestTokenFromCookie(cookieStore.get(FAVORITES_GUEST_TOKEN_COOKIE)?.value);

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

    const homePageMeta = config.pages.home[locale as "az" | "ru" | "en"];
    const wishlistPageMeta = config.pages.wishlist[locale as "az" | "ru" | "en"];

    const [chrome, favoriteProducts, requestFormProps] = await Promise.all([
        getSiteChromeData(locale),
        fetchFavoriteProducts(locale, authToken, guestToken),
        getMainPageRequestFormProps(locale),
    ]);

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: wishlistPageMeta.name, isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle={wishlistPageMeta.title}
                titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-0 pt-5 pb-12 lg:pt-6 lg:pb-14">
                <div className="min-w-0">
                    <WishlistProductsGrid locale={locale} initialItems={favoriteProducts} />
                </div>
            </section>

            {requestFormProps ? (
                <div className="mx-auto mt-14 mb-10 w-full max-w-[1280px] px-0 lg:mt-16 lg:mb-14">
                    <RequestForm {...requestFormProps} />
                </div>
            ) : null}
        </SitePageShell>
    );
}
