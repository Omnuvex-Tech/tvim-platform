"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNotify } from "@repo/ui";
import { addCartItem, hydrateCart, useCart } from "@/lib/cart/client";
import { listCompare, toggleCompare } from "@/lib/compare/client";
import { listFavorites, toggleFavorite } from "@/lib/favorites/client";

type ProductDetailActionsProps = {
    productVariationId: number | null;
    stock?: number | null;
};

const ProductDetailActions = ({
    productVariationId,
    stock,
}: ProductDetailActionsProps) => {
    const notify = useNotify();
    const { items } = useCart();

    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isCompared, setIsCompared] = useState(false);
    const [favoritePending, setFavoritePending] = useState(false);
    const [comparePending, setComparePending] = useState(false);

    const inCart = useMemo(() => {
        if (!productVariationId) return false;
        return items.some((item) => Number(item.product.productVariationId) === productVariationId);
    }, [items, productVariationId]);

    useEffect(() => {
        let isMounted = true;

        const hydrate = async () => {
            if (!productVariationId) return;

            try {
                const [favoritesResponse, compareResponse] = await Promise.all([listFavorites(), listCompare()]);
                if (!isMounted) return;

                const favoriteSet = new Set(
                    favoritesResponse.data.items
                        .map((item) => Number(item.product_variation_id))
                        .filter((id) => Number.isFinite(id) && id > 0)
                );

                const compareSet = new Set(
                    compareResponse.data.items
                        .map((item) => Number(item.product_variation_id))
                        .filter((id) => Number.isFinite(id) && id > 0)
                );

                setIsFavorite(favoriteSet.has(productVariationId));
                setIsCompared(compareSet.has(productVariationId));
            } catch {
                // silent hydrate fail
            }
        };

        void hydrate();

        return () => {
            isMounted = false;
        };
    }, [productVariationId]);

    const handleAddToCart = async () => {
        if (!productVariationId) {
            notify.error("Bu məhsul səbətə əlavə edilə bilmədi.");
            return;
        }

        if (typeof stock === "number" && stock <= 0) {
            notify.error("Bu məhsul stokda yoxdur.");
            return;
        }

        if (isAddingToCart) return;

        setIsAddingToCart(true);
        try {
            await addCartItem(productVariationId, quantity);
            await hydrateCart(true);
            notify.success("Məhsul səbətə əlavə edildi.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Səbətə əlavə edilərkən xəta baş verdi.";
            notify.error(message);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleFavoriteToggle = async () => {
        if (!productVariationId || favoritePending) return;

        const previous = isFavorite;
        setFavoritePending(true);
        setIsFavorite(!previous);

        try {
            const response = await toggleFavorite(productVariationId);
            setIsFavorite(response.data.action === "created");
        } catch (error) {
            setIsFavorite(previous);
            const message = error instanceof Error ? error.message : "Favori yenilənərkən xəta baş verdi.";
            notify.error(message);
        } finally {
            setFavoritePending(false);
        }
    };

    const handleCompareToggle = async () => {
        if (!productVariationId || comparePending) return;

        const previous = isCompared;
        setComparePending(true);
        setIsCompared(!previous);

        try {
            const response = await toggleCompare(productVariationId);
            setIsCompared(response.data.action === "created");
        } catch (error) {
            setIsCompared(previous);
            const message = error instanceof Error ? error.message : "Müqayisə yenilənərkən xəta baş verdi.";
            notify.error(message);
        } finally {
            setComparePending(false);
        }
    };

    return (
        <div className="mt-14 max-lg:mt-8">
            <div className="flex flex-nowrap items-center gap-4 max-lg:flex-wrap max-lg:gap-3">
                <div className="inline-flex h-[72px] min-w-[206px] items-center justify-between rounded-[22px] border border-[#dce3ef] bg-white px-5 max-lg:h-[56px] max-lg:min-w-[172px] max-lg:rounded-[16px]">
                    <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        className="inline-flex h-10 w-10 items-center justify-center text-[40px] font-light leading-none text-[#8a94a7] max-lg:text-[28px]"
                        aria-label="Azalt"
                    >
                        -
                    </button>
                    <span className="min-w-[38px] text-center text-[36px] font-normal leading-none text-[#222733] max-lg:text-[28px]">{quantity}</span>
                    <button
                        type="button"
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="inline-flex h-10 w-10 items-center justify-center text-[40px] font-light leading-none text-[#8a94a7] max-lg:text-[28px]"
                        aria-label="Artır"
                    >
                        +
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || (typeof stock === "number" && stock <= 0)}
                    className={`inline-flex h-[72px] min-w-[292px] items-center justify-center rounded-[22px] px-10 text-[1.1em] font-medium leading-none transition-colors max-lg:h-[56px] max-lg:min-w-[212px] max-lg:rounded-[16px] max-lg:px-8 ${
                        inCart
                            ? "bg-[#57bf67] text-white"
                            : "bg-[rgba(0,61,255,1)] text-white hover:bg-[#0a33c7]"
                    } ${(typeof stock === "number" && stock <= 0) || isAddingToCart ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                    {inCart ? (
                        <>
                            <i className="fa-solid fa-check mr-3 text-[1.1em]" aria-hidden="true" />
                            Səbətdə
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-cart-shopping mr-3 text-[1.1em]" aria-hidden="true" />
                            Səbətə at
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    disabled={!productVariationId || favoritePending}
                    className={`inline-flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border transition-colors max-lg:h-[56px] max-lg:w-[56px] max-lg:rounded-[16px] ${
                        isFavorite
                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                            : "border-[#dce3ef] bg-white text-[#0f57d6] hover:bg-[#f4f7ff]"
                    } ${!productVariationId || favoritePending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    aria-label="Seçilmişlər"
                >
                    <i className={`${isFavorite ? "fa-solid" : "far"} fa-heart text-[34px] max-lg:text-[24px]`} aria-hidden="true" />
                </button>

                <button
                    type="button"
                    onClick={handleCompareToggle}
                    disabled={!productVariationId || comparePending}
                    className={`inline-flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border transition-colors max-lg:h-[56px] max-lg:w-[56px] max-lg:rounded-[16px] ${
                        isCompared
                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                            : "border-[#dce3ef] bg-white text-[#0f57d6] hover:bg-[#f4f7ff]"
                    } ${!productVariationId || comparePending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    aria-label="Müqayisə"
                >
                    <i className="fa-solid fa-code-compare text-[34px] max-lg:text-[24px]" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

export { ProductDetailActions };
