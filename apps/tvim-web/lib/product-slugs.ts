import { unstable_cache } from "next/cache";
import { api } from "@/lib/api";
import { config } from "@/config";
import { SUPPORTED_LOCALES, type SiteLocale } from "@/lib/site-locales";

/**
 * Product slugs are localized the same way brand slugs are — one product is
 * "pprc-amerikanka-i-c-dis-20x15-metak" in az and
 * "pprc-american-internal-teeth-20x15-metak" in en. The detail endpoint has no
 * multi_slugs field, but it resolves any locale's slug and answers with the
 * requested language's slug, so asking it once per language yields the full
 * set. See [[brand-slugs]] for the same pattern keyed on value_id instead.
 */

type ProductDetailSlugData = {
    active_variation?: { slug?: string };
    product?: { slug?: string };
};

const normalizeSlug = (value: string) => {
    const raw = String(value ?? "");
    const decoded = (() => {
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    })();

    return decoded.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
};

const fetchLocaleSlug = unstable_cache(
    async (slug: string, locale: string): Promise<string> => {
        const response = await api.get<ProductDetailSlugData>(
            config.endpoints.products.detailBySlug(slug),
            { locale, next: { revalidate: 300 } },
        );

        if (!response.success || !response.data) return "";

        return normalizeSlug(
            String(response.data.active_variation?.slug ?? response.data.product?.slug ?? ""),
        );
    },
    ["product-slug-by-locale"],
    { revalidate: 300, tags: ["product-slug-by-locale"] },
);

/**
 * The slug this locale serves for the product reachable under `slug`, or "" if
 * the product does not resolve. Callers compare it with what was requested to
 * decide whether to redirect.
 */
export async function getCanonicalProductSlug(slug: string, locale: string) {
    const normalized = normalizeSlug(slug);
    if (!normalized) return "";

    return await fetchLocaleSlug(normalized, locale);
}

/** Every locale's slug for one product, for hreflang. */
export async function getProductSlugsByLocale(slug: string): Promise<Partial<Record<SiteLocale, string>>> {
    const normalized = normalizeSlug(slug);
    if (!normalized) return {};

    const entries = await Promise.all(
        SUPPORTED_LOCALES.map(async (locale) => [locale, await fetchLocaleSlug(normalized, locale)] as const),
    );

    return entries.reduce<Partial<Record<SiteLocale, string>>>((acc, [locale, localeSlug]) => {
        if (localeSlug) acc[locale] = localeSlug;
        return acc;
    }, {});
}
