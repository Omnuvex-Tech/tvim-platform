import { ProductGridInteractive } from "./product-grid-interactive";

type ProductGridProps = {
    locale: string;
    items: unknown[];
};

type NormalizedProduct = {
    id: number;
    key: string;
    title: string;
    href: string;
    imageUrl: string;
    priceText: string;
    oldPriceText?: string;
    discountText?: string;
    productVariationId: number | null;
    stock: number | null;
    cartVariant: "yellow" | "blue";
};

const toNumber = (value: unknown) => {
    const parsed = typeof value === "number" ? value : Number(value ?? NaN);
    return Number.isFinite(parsed) ? parsed : null;
};

const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeMoney = (value: unknown) => {
    if (value == null) return "";
    if (typeof value === "string" && value.trim()) return value.trim();
    const n = toNumber(value);
    if (n == null) return "";
    return `${n.toFixed(2)}₼`;
};

const normalizeHref = (locale: string, slug: string) => {
    const cleanSlug = String(slug ?? "").trim().replace(/^\/+/, "");
    if (!cleanSlug) return `/${locale}`;
    if (cleanSlug.startsWith("http://") || cleanSlug.startsWith("https://")) return cleanSlug;
    if (cleanSlug.startsWith(`${locale}/`)) return `/${cleanSlug}`;
    if (cleanSlug.startsWith("products/")) return `/${locale}/${cleanSlug}`;
    return `/${locale}/products/${cleanSlug}`;
};

const normalizeImageUrl = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value.trim().replace(/^`+|`+$/g, "").trim();
};

const normalizeProduct = (raw: any, locale: string, index: number): NormalizedProduct | null => {
    const variation = raw?.product?.variation && typeof raw.product.variation === "object" ? raw.product.variation : null;
    const base = variation ?? raw?.variation ?? raw?.product ?? raw;

    const id =
        toNumber(base?.id) ??
        toNumber(base?.product_id) ??
        toNumber(raw?.id) ??
        toNumber(raw?.product_id) ??
        index;

    const title =
        toText(base?.name) ||
        toText(base?.title) ||
        toText(raw?.variation?.name) ||
        toText(raw?.name) ||
        toText(raw?.product?.variation?.name) ||
        toText(raw?.product?.name) ||
        "Məhsul";

    const slug =
        toText(base?.slug) ||
        toText(raw?.slug) ||
        String(base?.uuid ?? raw?.uuid ?? id);

    const imageRaw =
        base?.main_image ||
        base?.main_image?.url ||
        base?.main_image?.image_url ||
        base?.image ||
        base?.image?.url ||
        base?.image?.image_url ||
        base?.main_photo ||
        base?.gallery?.[0]?.url ||
        base?.gallery?.[0]?.image_url ||
        "";

    const price =
        toNumber(base?.discount_price) ??
        toNumber(base?.price) ??
        toNumber(base?.sale_price) ??
        toNumber(base?.final_price) ??
        toNumber(base?.special) ??
        toNumber(raw?.price) ??
        0;

    const oldPrice =
        toNumber(base?.old_price) ??
        toNumber(base?.compare_price) ??
        toNumber(base?.regular_price) ??
        toNumber(raw?.old_price) ??
        null;
    const stock =
        toNumber(base?.body?.stock) ??
        toNumber(base?.stock) ??
        toNumber(base?.quantity) ??
        toNumber(base?.qty) ??
        toNumber(raw?.body?.stock) ??
        toNumber(raw?.stock) ??
        toNumber(raw?.quantity) ??
        toNumber(raw?.qty);
    const variationCandidate =
        raw?.product_variation_id ??
        raw?.variation_id ??
        base?.variation_id ??
        base?.product_variation_id ??
        raw?.variation?.id ??
        raw?.product?.variation?.id ??
        base?.id ??
        raw?.id;
    const productVariationId = toNumber(variationCandidate);
    const discount =
        toText(base?.discount) ||
        toText(raw?.discount) ||
        (oldPrice != null && oldPrice > price && oldPrice > 0
            ? `-${Math.round(((oldPrice - price) / oldPrice) * 100)}%`
            : "");

    return {
        id: Number(id),
        key: `p-${id}`,
        title,
        href: normalizeHref(locale, slug),
        imageUrl: normalizeImageUrl(imageRaw),
        priceText: normalizeMoney(price),
        oldPriceText: oldPrice != null && oldPrice > price ? normalizeMoney(oldPrice) : undefined,
        discountText: discount || undefined,
        productVariationId,
        stock,
        cartVariant: stock !== null && stock <= 0 ? "yellow" : "blue",
    };
};

export function ProductGrid({ locale, items }: ProductGridProps) {
    const list = Array.isArray(items) ? items : [];
    const normalizedLocale = String(locale || "az").trim().toLowerCase() || "az";

    const products = list
        .map((it, index) => normalizeProduct(it as any, normalizedLocale, index))
        .filter((it): it is NormalizedProduct => Boolean(it));

    return <ProductGridInteractive products={products} />;
}
