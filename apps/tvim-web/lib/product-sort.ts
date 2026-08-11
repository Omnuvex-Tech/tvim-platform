import { getTranslations } from "@/lib/i18n";

/**
 * Product listing sort is handled entirely on the frontend: the `sort` query
 * parameter is never forwarded to the API, the fetched page of items is
 * reordered here instead.
 */
export const PRODUCT_SORT_KEYS = [
    "newest",
    "name_asc",
    "name_desc",
    "price_asc",
    "price_desc",
    "popular",
    "most_sale",
] as const;

export type ProductSortKey = (typeof PRODUCT_SORT_KEYS)[number];

export const DEFAULT_PRODUCT_SORT: ProductSortKey = "newest";

const SORT_KEYS = new Set<string>(PRODUCT_SORT_KEYS);

export const isProductSortKey = (value: unknown): value is ProductSortKey =>
    typeof value === "string" && SORT_KEYS.has(value.trim().toLowerCase());

export function normalizeProductSort(value: unknown): ProductSortKey {
    const raw = Array.isArray(value) ? value[0] : value;
    const key = String(raw ?? "").trim().toLowerCase();
    return SORT_KEYS.has(key) ? (key as ProductSortKey) : DEFAULT_PRODUCT_SORT;
}

export type ProductSortOption = {
    key: ProductSortKey;
    label: string;
};

export function getProductSortOptions(locale: string): ProductSortOption[] {
    const sort = getTranslations(locale).search.sort;
    return [
        { key: "newest", label: sort.newest },
        { key: "name_asc", label: sort.nameAsc },
        { key: "name_desc", label: sort.nameDesc },
        { key: "price_asc", label: sort.priceAsc },
        { key: "price_desc", label: sort.priceDesc },
        { key: "popular", label: sort.popular },
        { key: "most_sale", label: sort.mostSale },
    ];
}

type AnyItem = Record<string, unknown>;

const asItem = (value: unknown): AnyItem =>
    typeof value === "object" && value !== null ? (value as AnyItem) : {};

const readVariation = (item: AnyItem): AnyItem => asItem(item.variation);

const readNumber = (value: unknown) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const text = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (!text) return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
};

const readName = (item: AnyItem) => {
    const variation = readVariation(item);
    const name = typeof variation.name === "string" ? variation.name : typeof item.name === "string" ? item.name : "";
    return name.trim();
};

const readPrice = (item: AnyItem) => {
    const variation = readVariation(item);
    return readNumber(
        variation.discount_price ?? variation.price ?? item.discount_price ?? item.price ?? item.old_price
    );
};

const readFlag = (item: AnyItem, key: "is_new" | "is_popular" | "most_sale") => {
    const raw = item[key] ?? readVariation(item)[key];
    return raw === true || raw === 1 || raw === "1" || raw === "true" ? 1 : 0;
};

const readId = (item: AnyItem) => {
    const variation = readVariation(item);
    const raw = item.variation_id ?? item.product_id ?? item.id ?? variation.id ?? variation.uuid ?? item.uuid ?? 0;
    return readNumber(raw) ?? 0;
};

const readRating = (item: AnyItem) => {
    const variation = readVariation(item);
    return readNumber(item.rating ?? item.rate ?? item.average_rating ?? variation.rating);
};

const readSaleCount = (item: AnyItem) => {
    const variation = readVariation(item);
    return readNumber(item.sale_count ?? item.sales_count ?? item.sold_count ?? item.order_count ?? variation.sale_count);
};

const readCreatedAt = (item: AnyItem) => {
    const raw = item.created_at ?? item.createdAt ?? readVariation(item).created_at;
    if (!raw) return null;
    const parsed = Date.parse(String(raw));
    return Number.isFinite(parsed) ? parsed : null;
};

/** Compares two optional numeric scores, highest first, leaving ties untouched. */
const compareScoreDesc = (a: number | null, b: number | null) => {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return b - a;
};

/**
 * Reorders the already fetched items according to the selected sort key.
 * Only the current page of results can be reordered, since pagination stays
 * server side.
 */
export function sortProductItems<T>(items: readonly T[], sort: unknown, locale?: string): T[] {
    const list = Array.isArray(items) ? [...items] : [];
    if (list.length <= 1) return list;

    const dir = normalizeProductSort(sort);
    const localeForCompare = String(locale ?? "").trim() || "az";

    list.sort((left, right) => {
        const a = asItem(left);
        const b = asItem(right);

        if (dir === "price_asc" || dir === "price_desc") {
            const pa = readPrice(a);
            const pb = readPrice(b);
            const na = pa == null ? Number.POSITIVE_INFINITY : pa;
            const nb = pb == null ? Number.POSITIVE_INFINITY : pb;
            if (na !== nb) return dir === "price_asc" ? na - nb : nb - na;
            return readId(b) - readId(a);
        }

        if (dir === "name_asc" || dir === "name_desc") {
            const cmp = readName(a).toLowerCase().localeCompare(readName(b).toLowerCase(), localeForCompare);
            if (cmp !== 0) return dir === "name_asc" ? cmp : -cmp;
            return readId(b) - readId(a);
        }

        if (dir === "popular") {
            const byRating = compareScoreDesc(readRating(a), readRating(b));
            if (byRating !== 0) return byRating;
            const flagDiff = readFlag(b, "is_popular") - readFlag(a, "is_popular");
            if (flagDiff !== 0) return flagDiff;
            return readId(b) - readId(a);
        }

        if (dir === "most_sale") {
            const bySales = compareScoreDesc(readSaleCount(a), readSaleCount(b));
            if (bySales !== 0) return bySales;
            const flagDiff = readFlag(b, "most_sale") - readFlag(a, "most_sale");
            if (flagDiff !== 0) return flagDiff;
            return readId(b) - readId(a);
        }

        const byDate = compareScoreDesc(readCreatedAt(a), readCreatedAt(b));
        if (byDate !== 0) return byDate;
        const flagDiff = readFlag(b, "is_new") - readFlag(a, "is_new");
        if (flagDiff !== 0) return flagDiff;
        return readId(b) - readId(a);
    });

    return list as T[];
}
