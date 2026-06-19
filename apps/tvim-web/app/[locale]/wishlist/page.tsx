import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { FAVORITES_GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/favorites/session";
import { getSiteChromeData } from "@/lib/site-chrome";
import { WishlistProductsGrid } from "./wishlist-products-grid";

export const metadata = buildNoIndexMetadata();

type FavoriteListItem = {
    id: number;
    name: string;
    price: number;
    old_price?: number;
    main_image?: string;
    slug?: string;
    product_variation_id?: number | null;
    is_favorite: true;
};

const toPositiveNumber = (value: unknown) => {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (parsed <= 0) return null;
    return Math.trunc(parsed);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object" && !Array.isArray(value);

const extractFavoriteItems = (payload: unknown) => {
    if (!isRecord(payload)) return [];

    const payloadData = payload.data;
    if (Array.isArray(payloadData)) return payloadData;
    if (isRecord(payloadData) && Array.isArray(payloadData.items)) return payloadData.items;
    if (isRecord(payloadData) && Array.isArray(payloadData.data)) return payloadData.data;

    return [];
};

const readString = (sources: Record<string, unknown>[], keys: string[]) => {
    for (const source of sources) {
        for (const key of keys) {
            const value = source[key];
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
    }

    return "";
};

const readNumber = (sources: Record<string, unknown>[], keys: string[]) => {
    for (const source of sources) {
        for (const key of keys) {
            const value = source[key];
            const parsed = typeof value === "number" ? value : Number(value);
            if (Number.isFinite(parsed) && parsed >= 0) {
                return parsed;
            }
        }
    }

    return null;
};

const toAbsoluteAssetUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
        return trimmed;
    }

    try {
        const apiOrigin = new URL(config.api.url).origin;

        if (trimmed.startsWith("//")) {
            return `https:${trimmed}`;
        }

        if (trimmed.startsWith("/")) {
            return `${apiOrigin}${trimmed}`;
        }

        return `${apiOrigin}/${trimmed.replace(/^\/+/, "")}`;
    } catch {
        return trimmed;
    }
};

const firstRecord = (value: unknown): Record<string, unknown> | null => {
    if (!Array.isArray(value)) return null;
    const firstItem = value[0];
    return isRecord(firstItem) ? firstItem : null;
};

const readImage = (sources: Record<string, unknown>[]) => {
    for (const source of sources) {
        const mainImage = isRecord(source.main_image) ? source.main_image : null;
        const image = isRecord(source.image) ? source.image : null;
        const galleryFirst = firstRecord(source.gallery);
        const imagesFirst = firstRecord(source.images);

        const candidates = [
            source.main_image,
            mainImage?.image_url,
            mainImage?.url,
            source.main_image_url,
            image?.image_url,
            image?.url,
            source.image,
            source.thumb,
            source.thumbnail,
            source.main_photo,
            galleryFirst?.url,
            galleryFirst?.image_url,
            imagesFirst?.image_url,
            imagesFirst?.url,
        ];

        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.trim()) {
                return toAbsoluteAssetUrl(candidate);
            }
        }
    }

    return "";
};

const normalizeFavoriteItem = (item: unknown): FavoriteListItem | null => {
    if (!isRecord(item)) return null;

    const product = isRecord(item.product) ? item.product : null;
    const productVariation = product && isRecord(product.variation)
        ? product.variation
        : null;

    const nestedSources = [
        item,
        item.favorite,
        item.product_variation,
        item.productVariation,
        item.variation,
        item.product,
        item.item,
        item.data,
        productVariation,
        product && isRecord(product.data) ? product.data : null,
        isRecord(item.product_variation) ? item.product_variation.product : null,
        isRecord(item.product_variation) && isRecord(item.product_variation.variation)
            ? item.product_variation.variation
            : null,
        isRecord(item.variation) ? item.variation.product : null,
        isRecord(item.variation) && isRecord(item.variation.data)
            ? item.variation.data
            : null,
    ].filter(isRecord);

    const variationId = toPositiveNumber(readNumber(nestedSources, ["product_variation_id", "variation_id", "id"]));
    const id = toPositiveNumber(readNumber(nestedSources, ["id", "product_id", "variation_id", "product_variation_id"]));

    if (!variationId && !id) {
        return null;
    }

    const resolvedVariationId = variationId ?? id ?? 0;
    const resolvedId = id ?? resolvedVariationId;

    const name = readString(nestedSources, ["name", "title", "product_name", "product_title"])
        || `Məhsul #${resolvedVariationId}`;
    const price = readNumber(nestedSources, ["sale_price", "final_price", "special", "price"]) ?? 0;

    const oldPrice = readNumber(nestedSources, ["old_price", "compare_price", "regular_price"]);
    const slug = readString(nestedSources, ["slug", "uuid"]);
    const image = readImage(nestedSources);

    return {
        id: resolvedId,
        name,
        price,
        old_price: oldPrice ?? undefined,
        main_image: image || undefined,
        slug: slug || undefined,
        product_variation_id: resolvedVariationId,
        is_favorite: true,
    };
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const toBearerToken = (token: string) => token.replace(/^Bearer\s+/i, "").trim();

const fetchFavoriteProducts = async (locale: string, authToken: string | null, guestToken: string | null) => {
    const favoritesApiBase = (config.api.url || "https://admin.tvim.az/api/v1").trim();
    const url = new URL(normalizeApiUrl(favoritesApiBase, config.endpoints.favorites.list));
    url.searchParams.set("page", "1");
    url.searchParams.set("per_page", "50");

    const normalizedAuthToken = authToken ? toBearerToken(authToken) : "";

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Language": locale,
                ...(normalizedAuthToken ? { Authorization: `Bearer ${normalizedAuthToken}` } : {}),
                ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
            },
        });

        if (!response.ok) {
            return [];
        }

        const payload = (await response.json()) as unknown;
        return extractFavoriteItems(payload)
            .map(normalizeFavoriteItem)
            .filter((item): item is FavoriteListItem => item !== null);
    } catch {
        return [];
    }
};

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

    const chrome = await getSiteChromeData(locale);

    const favoriteProducts = await fetchFavoriteProducts(locale, authToken, guestToken);

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

            <div className="mx-auto mt-14 mb-10 w-full max-w-[1280px] px-0 lg:mt-16 lg:mb-14">
                <RequestForm />
            </div>
        </SitePageShell>
    );
}
