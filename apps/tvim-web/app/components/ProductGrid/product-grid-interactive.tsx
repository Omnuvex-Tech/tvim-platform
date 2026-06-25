"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useNotify } from "@repo/ui";
import { addProductToCart } from "@/lib/cart/client";
import { listCompare, toggleCompare } from "@/lib/compare/client";
import { listFavorites, toggleFavorite } from "@/lib/favorites/client";
import { QuickOrderPopup } from "@/app/components/ProductStrip/quick-order-popup";

const FAVORITES_UPDATED_EVENT = "tvim:favorites-updated";
const COMPARE_UPDATED_EVENT = "tvim:compare-updated";

type ProductGridInteractiveItem = {
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

type ProductGridInteractiveProps = {
    products: ProductGridInteractiveItem[];
};

export function ProductGridInteractive({ products }: ProductGridInteractiveProps) {
    const notify = useNotify();
    const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
    const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
    const [favoritePendingIds, setFavoritePendingIds] = useState<Set<number>>(new Set());
    const [comparePendingIds, setComparePendingIds] = useState<Set<number>>(new Set());
    const [cartPendingIds, setCartPendingIds] = useState<Set<number>>(new Set());
    const [quickOrderProduct, setQuickOrderProduct] = useState<ProductGridInteractiveItem | null>(null);

    useEffect(() => {
        let alive = true;

        const load = async () => {
            const [favoritesResponse, compareResponse] = await Promise.all([
                listFavorites(),
                listCompare(),
            ]);

            if (!alive) return;

            setFavoriteIds(
                new Set(
                    (favoritesResponse.data.items ?? [])
                        .map((item) => Number(item.product_variation_id))
                        .filter((value) => Number.isFinite(value) && value > 0)
                )
            );
            setCompareIds(
                new Set(
                    (compareResponse.data.items ?? [])
                        .map((item) => Number(item.product_variation_id))
                        .filter((value) => Number.isFinite(value) && value > 0)
                )
            );
        };

        void load();

        const onFavoritesUpdated = (event: Event) => {
            const detail = (event as CustomEvent<{ action?: "created" | "deleted"; productVariationId?: number }>).detail;
            const variationId = Number(detail?.productVariationId);
            if (!Number.isFinite(variationId) || variationId <= 0) return;

            setFavoriteIds((prev) => {
                const next = new Set(prev);
                if (detail?.action === "deleted") next.delete(variationId);
                else next.add(variationId);
                return next;
            });
        };

        const onCompareUpdated = (event: Event) => {
            const detail = (event as CustomEvent<{ action?: "created" | "deleted"; productVariationId?: number }>).detail;
            const variationId = Number(detail?.productVariationId);
            if (!Number.isFinite(variationId) || variationId <= 0) return;

            setCompareIds((prev) => {
                const next = new Set(prev);
                if (detail?.action === "deleted") next.delete(variationId);
                else next.add(variationId);
                return next;
            });
        };

        window.addEventListener(FAVORITES_UPDATED_EVENT, onFavoritesUpdated as EventListener);
        window.addEventListener(COMPARE_UPDATED_EVENT, onCompareUpdated as EventListener);

        return () => {
            alive = false;
            window.removeEventListener(FAVORITES_UPDATED_EVENT, onFavoritesUpdated as EventListener);
            window.removeEventListener(COMPARE_UPDATED_EVENT, onCompareUpdated as EventListener);
        };
    }, []);

    const handleFavoriteToggle = async (product: ProductGridInteractiveItem, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const variationId = product.productVariationId;
        if (!variationId) {
            notify.error("Bu məhsul favorilərə əlavə edilə bilmədi.");
            return;
        }
        if (favoritePendingIds.has(variationId)) return;

        const wasFavorite = favoriteIds.has(variationId);
        setFavoritePendingIds((prev) => new Set(prev).add(variationId));
        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (wasFavorite) next.delete(variationId);
            else next.add(variationId);
            return next;
        });

        try {
            const response = await toggleFavorite(variationId);
            setFavoriteIds((prev) => {
                const next = new Set(prev);
                if (response.data.action === "deleted") next.delete(variationId);
                else next.add(variationId);
                return next;
            });
            if (response.message) notify.success(response.message);
        } catch (error) {
            setFavoriteIds((prev) => {
                const next = new Set(prev);
                if (wasFavorite) next.add(variationId);
                else next.delete(variationId);
                return next;
            });
            notify.error(error instanceof Error ? error.message : "Favorilərə əlavə edilərkən xəta baş verdi.");
        } finally {
            setFavoritePendingIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    const handleCompareToggle = async (product: ProductGridInteractiveItem, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const variationId = product.productVariationId;
        if (!variationId) {
            notify.error("Bu məhsul müqayisəyə əlavə edilə bilmədi.");
            return;
        }
        if (comparePendingIds.has(variationId)) return;

        const wasCompared = compareIds.has(variationId);
        setComparePendingIds((prev) => new Set(prev).add(variationId));
        setCompareIds((prev) => {
            const next = new Set(prev);
            if (wasCompared) next.delete(variationId);
            else next.add(variationId);
            return next;
        });

        try {
            const response = await toggleCompare(variationId);
            setCompareIds((prev) => {
                const next = new Set(prev);
                if (response.data.action === "deleted") next.delete(variationId);
                else next.add(variationId);
                return next;
            });
            if (response.message) notify.success(response.message);
        } catch (error) {
            setCompareIds((prev) => {
                const next = new Set(prev);
                if (wasCompared) next.add(variationId);
                else next.delete(variationId);
                return next;
            });
            notify.error(error instanceof Error ? error.message : "Müqayisə yenilənərkən xəta baş verdi.");
        } finally {
            setComparePendingIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    const handleCartClick = async (product: ProductGridInteractiveItem, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (cartPendingIds.has(product.id)) return;

        if (product.cartVariant !== "blue") {
            setQuickOrderProduct(product);
            return;
        }

        setCartPendingIds((prev) => new Set(prev).add(product.id));
        try {
            await addProductToCart({
                id: product.id,
                title: product.title,
                price: product.priceText,
                imageUrl: product.imageUrl,
                productVariationId: product.productVariationId,
                stock: product.stock,
            });
            notify.success(product.title ? `${product.title} səbətinizə müvəffəqiyyətlə əlavə edildi!` : "Məhsul səbətinizə müvəffəqiyyətlə əlavə edildi!");
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Səbətə əlavə edərkən xəta baş verdi.");
        } finally {
            setCartPendingIds((prev) => {
                const next = new Set(prev);
                next.delete(product.id);
                return next;
            });
        }
    };

    return (
        <>
            <div className="product-carousel">
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                    {products.map((product) => {
                    const variationId = product.productVariationId;
                    const isFavorite = typeof variationId === "number" && favoriteIds.has(variationId);
                    const isFavoritePending = typeof variationId === "number" && favoritePendingIds.has(variationId);
                    const isCompared = typeof variationId === "number" && compareIds.has(variationId);
                    const isComparePending = typeof variationId === "number" && comparePendingIds.has(variationId);
                    const isCartPending = cartPendingIds.has(product.id);

                    return (
                        <li key={product.key}>
                            <article className="group relative flex h-full flex-col items-center justify-center rounded-[14px] border border-[#e2e6ef] bg-white px-3 pb-4 pt-3 text-center transition-transform duration-200 ease-out hover:z-10 hover:-translate-y-1 shadow-none select-none cursor-pointer max-[512px]:pt-4 max-[512px]:pb-5">
                                <Link href={product.href} className="block w-full text-center">
                                    <div className="product-thumb mx-auto mt-0 flex aspect-square items-center justify-center w-full max-w-[135px] sm:max-w-[150px] max-[512px]:max-w-[160px] overflow-visible rounded-[10px]">
                                        {product.discountText ? (
                                            <span className="absolute top-3 right-4 z-[4] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2e43] text-[14px] leading-none font-bold text-white">
                                                {product.discountText}
                                            </span>
                                        ) : null}

                                        <div className="absolute top-3 left-3 z-[3] flex flex-col items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={isFavoritePending || !variationId}
                                                onClick={(event) => void handleFavoriteToggle(product, event)}
                                                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                                                    isFavorite
                                                        ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                                                        : "border-[#e0e5ee] bg-white text-[#7b8596] hover:bg-[#0f57d6] hover:text-white"
                                                } ${isFavoritePending || !variationId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                                aria-label="Seçilmişlər"
                                            >
                                                <i className={`${isFavorite ? "fa-solid" : "far"} fa-heart text-[14px] leading-none`} aria-hidden="true" />
                                            </button>

                                            <button
                                                type="button"
                                                disabled={isComparePending || !variationId}
                                                onClick={(event) => void handleCompareToggle(product, event)}
                                                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                                                    isCompared
                                                        ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                                                        : "border-[#e0e5ee] bg-white text-[#7b8596] hover:bg-[#0f57d6] hover:text-white"
                                                } ${isComparePending || !variationId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                                aria-label="Müqayisə"
                                            >
                                                <i className="fa-solid fa-code-compare text-[14px] leading-none" aria-hidden="true" />
                                            </button>
                                        </div>

                                        <div className="relative z-[1] aspect-square w-full overflow-hidden rounded-[10px]">
                                            {product.imageUrl ? (
                                                <img
                                                    draggable={false}
                                                    src={product.imageUrl}
                                                    alt={product.title}
                                                    className="h-full w-full object-cover transition-transform duration-200 ease-out"
                                                    loading="lazy"
                                                />
                                            ) : null}
                                        </div>
                                    </div>

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

                                <button
                                    type="button"
                                    disabled={isCartPending}
                                    onClick={(event) => void handleCartClick(product, event)}
                                    className={`relative z-[2] mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full ${
                                        product.cartVariant === "blue" ? "bg-[#0f57d6] text-white" : "bg-[#ffd500] text-[#1b212e]"
                                    } ${isCartPending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                    aria-label={product.cartVariant === "blue" ? "Səbətə əlavə et" : "Məhsul stokda yoxdur"}
                                >
                                    {product.cartVariant === "blue" ? (
                                        <i className="fas fa-shopping-cart text-white" aria-hidden="true" />
                                    ) : (
                                        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                            <path d="M1.25 6V3.25C1.25 2.14543 2.14543 1.25 3.25 1.25H5" stroke="#1b212e" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M8 1.25H12.75C13.8546 1.25 14.75 2.14543 14.75 3.25V12.75C14.75 13.8546 13.8546 14.75 12.75 14.75H3.25C2.14543 14.75 1.25 13.8546 1.25 12.75V6" stroke="#1b212e" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M8 1.25V9.1" stroke="#1b212e" strokeWidth="0.9" strokeLinecap="round" />
                                            <path d="M5.9 7.7L8 9.8L10.1 7.7" stroke="#1b212e" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            </article>
                        </li>
                    );
                })}
                </ul>
            </div>

            <QuickOrderPopup
                isOpen={Boolean(quickOrderProduct)}
                productTitle={quickOrderProduct?.title ?? ""}
                productCode={quickOrderProduct ? String(quickOrderProduct.id) : ""}
                productVariationId={quickOrderProduct?.productVariationId ?? null}
                onClose={() => setQuickOrderProduct(null)}
            />
        </>
    );
}
