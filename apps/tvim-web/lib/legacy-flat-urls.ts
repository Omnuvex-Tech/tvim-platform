import { api } from "@/lib/api";
import { config } from "@/config";

const BRAND_INDEX_SLUGS = new Set(["brendler", "brands", "brendy"]);

type BrandListResponseData = {
    values?: Array<{
        slug?: string;
        name?: string;
    }>;
};

const slugify = (value: string) =>
    String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/ə/g, "e")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ç/g, "c")
        .replace(/ş/g, "s")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const cleanSlug = (value: string) => {
    try {
        return decodeURIComponent(String(value ?? "")).trim().replace(/^\/+|\/+$/g, "");
    } catch {
        return String(value ?? "").trim().replace(/^\/+|\/+$/g, "");
    }
};

async function isProductSlug(slug: string, locale: string) {
    try {
        const response = await api.get(config.endpoints.products.detailBySlug(slug), {
            locale,
            cache: "force-cache",
        });

        return Boolean(response.success && response.data);
    } catch {
        return false;
    }
}

async function findBrandSlug(slug: string, locale: string) {
    try {
        const response = await api.get<BrandListResponseData>("/product/brands", {
            locale,
            cache: "force-cache",
        });

        if (!response.success || !response.data) return null;

        const brands = Array.isArray(response.data.values) ? response.data.values : [];
        const target = slugify(slug);
        const matched =
            brands.find((brand) => slugify(String(brand?.slug ?? "")) === target) ??
            brands.find((brand) => slugify(String(brand?.name ?? "")) === target);

        const matchedSlug = String(matched?.slug ?? "").trim();
        return matchedSlug || null;
    } catch {
        return null;
    }
}

export async function resolveLegacyFlatSlugTarget(slug: string, locale: string) {
    const normalizedSlug = cleanSlug(slug);
    if (!normalizedSlug || normalizedSlug.includes("/")) return null;

    const normalizedLocale = String(locale ?? "").trim().toLowerCase();

    if (BRAND_INDEX_SLUGS.has(normalizedSlug.toLowerCase())) {
        return `/${normalizedLocale}/product/brands`;
    }

    if (await isProductSlug(normalizedSlug, normalizedLocale)) {
        return `/${normalizedLocale}/products/${encodeURIComponent(normalizedSlug)}`;
    }

    const brandSlug = await findBrandSlug(normalizedSlug, normalizedLocale);
    if (brandSlug) {
        return `/${normalizedLocale}/brands/${encodeURIComponent(brandSlug)}`;
    }

    return null;
}
