import Link from "next/link";
import { ProductGridCartButton, ProductGridCardActionsProvider, ProductGridCardSideActions } from "./product-grid-card-actions";

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

    return (
        <ProductGridCardActionsProvider>
            <div className="product-carousel">
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                    {products.map((product, index) => (
                        <li key={product.key}>
                            <article className="group relative flex h-full flex-col items-center justify-start overflow-hidden rounded-[14px] border border-[#e2e6ef] bg-white px-3 pb-4 pt-3 text-center transition-transform duration-200 ease-out hover:z-10 hover:-translate-y-1 shadow-none select-none cursor-pointer max-[512px]:pt-4 max-[512px]:pb-5">
                                <ProductGridCardSideActions
                                    id={product.id}
                                    title={product.title}
                                    priceText={product.priceText}
                                    imageUrl={product.imageUrl}
                                    productVariationId={product.productVariationId}
                                    stock={product.stock}
                                    cartVariant={product.cartVariant}
                                />

                                {/* Full-bleed square thumb: negative margins cancel the card padding
                                    so the image spans the whole card width and aspect-square
                                    derives its height from that width. */}
                                <div className="product-thumb product-thumb--bleed relative -mx-3 -mt-3 flex aspect-square items-center justify-center self-stretch overflow-hidden p-2 max-[512px]:-mt-4">
                                    {product.discountText ? (
                                        <span className="absolute top-3 right-4 z-[4] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2e43] text-[14px] leading-none font-bold text-white">
                                            {product.discountText}
                                        </span>
                                    ) : null}

                                    <Link href={product.href} className="block h-full w-full text-center">
                                        <div className="relative z-[1] h-full w-full overflow-hidden">
                                            {product.imageUrl ? (
                                                <img
                                                    draggable={false}
                                                    src={product.imageUrl}
                                                    alt={product.title}
                                                    className="h-full w-full object-contain transition-transform duration-200 ease-out"
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                    fetchPriority={index === 0 ? "high" : "auto"}
                                                />
                                            ) : null}
                                        </div>
                                    </Link>
                                </div>

                                <Link href={product.href} className="block w-full text-center">
                                    <h3 className="hoopz-thumb__name mt-3">{product.title}</h3>
                                </Link>

                                <div className="mt-2 flex items-center justify-center gap-1">
                                    <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                                    <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                                    <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                                    <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                                    <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                                </div>

                                <div className="price mt-2 text-center">
                                    {product.oldPriceText ? <span className="price-old block mb-1">{product.oldPriceText}</span> : null}
                                    <span
                                        className="price-new block text-[24px] font-bold"
                                        style={{ color: product.oldPriceText ? "#ff0000" : "#000000" }}
                                    >
                                        {product.priceText}
                                    </span>
                                </div>

                                <ProductGridCartButton
                                    id={product.id}
                                    title={product.title}
                                    priceText={product.priceText}
                                    imageUrl={product.imageUrl}
                                    productVariationId={product.productVariationId}
                                    stock={product.stock}
                                    cartVariant={product.cartVariant}
                                />
                            </article>
                        </li>
                    ))}
                </ul>
            </div>
        </ProductGridCardActionsProvider>
    );
}
