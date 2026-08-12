import { unstable_cache } from "next/cache";
import { api } from "@/lib/api";
import { SUPPORTED_LOCALES, type SiteLocale } from "@/lib/site-locales";

/**
 * Brand slugs are localized: filter value 7666 is "xususiler" in az,
 * "specials" in en and "spetsialnie" in ru. Only `value_id` is stable across
 * languages, so it is the key everything here is built around — it lets a slug
 * from one locale be translated into any other.
 */

type BrandListResponseData = {
    values?: Array<{
        value_id?: number | string;
        name?: string;
        slug?: string;
    }>;
};

export type BrandEntry = {
    valueId: number;
    name: string;
    slug: string;
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

const fetchBrandList = unstable_cache(
    async (locale: string): Promise<BrandEntry[]> => {
        const response = await api.get<BrandListResponseData>("/product/brands", {
            locale,
            next: { revalidate: 300 },
        });

        if (!response.success || !response.data) return [];

        const values = Array.isArray(response.data.values) ? response.data.values : [];

        return values.reduce<BrandEntry[]>((acc, value) => {
            const valueId = Number(value?.value_id);
            const slug = normalizeSlug(String(value?.slug ?? ""));
            if (!Number.isFinite(valueId) || valueId <= 0 || !slug) return acc;

            acc.push({ valueId, name: String(value?.name ?? "").trim(), slug });
            return acc;
        }, []);
    },
    ["brand-slug-index"],
    { revalidate: 300, tags: ["brand-slug-index"] },
);

/** The brand whose slug matches, in that locale only. */
export async function findBrandBySlug(slug: string, locale: string) {
    const target = normalizeSlug(slug);
    if (!target) return null;

    const brands = await fetchBrandList(locale);
    return brands.find((brand) => brand.slug === target) ?? null;
}

/**
 * Every locale's slug for one brand, keyed by locale. Used both for the
 * language switcher and for hreflang, so a visitor switching language lands on
 * that language's url instead of a slug the api cannot resolve.
 */
export async function getBrandSlugsByLocale(valueId: number): Promise<Partial<Record<SiteLocale, string>>> {
    if (!Number.isFinite(valueId) || valueId <= 0) return {};

    const lists = await Promise.all(
        SUPPORTED_LOCALES.map(async (locale) => [locale, await fetchBrandList(locale)] as const),
    );

    return lists.reduce<Partial<Record<SiteLocale, string>>>((acc, [locale, brands]) => {
        const match = brands.find((brand) => brand.valueId === valueId);
        if (match) acc[locale] = match.slug;
        return acc;
    }, {});
}

/**
 * A slug that does not resolve in the requested locale is usually another
 * locale's slug for the same brand — a language switch that kept the old slug,
 * or an old link. Returns that brand so the caller can redirect to the url this
 * locale actually serves.
 */
export async function findBrandInOtherLocales(slug: string, locale: string) {
    const target = normalizeSlug(slug);
    if (!target) return null;

    const otherLocales = SUPPORTED_LOCALES.filter((candidate) => candidate !== locale);

    for (const candidate of otherLocales) {
        const brands = await fetchBrandList(candidate);
        const match = brands.find((brand) => brand.slug === target);
        if (!match) continue;

        const slugsByLocale = await getBrandSlugsByLocale(match.valueId);
        const localizedSlug = slugsByLocale[locale as SiteLocale];
        if (localizedSlug && localizedSlug !== target) {
            return { valueId: match.valueId, slug: localizedSlug };
        }
    }

    return null;
}
