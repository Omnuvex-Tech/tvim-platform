"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNotify } from "@repo/ui";
import { addCartItem, hydrateCart, useCart } from "@/lib/cart/client";
import { listCompare, toggleCompare } from "@/lib/compare/client";
import { listFavorites, toggleFavorite } from "@/lib/favorites/client";

type ProductDetailActionsProps = {
    productVariationId: number | null;
    stock?: number | null;
    variant?: "discount" | "order";
};

const ProductDetailActions = ({
    productVariationId,
    stock,
    variant = "discount",
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
                {variant === "discount" ? (
                    <div className="grid h-[64px] min-w-[190px] grid-cols-[1fr_auto_1fr] items-center rounded-[20px] border border-[rgba(217,228,238,1)] bg-white px-[10px] py-[10px]">
                        <button
                            type="button"
                            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                            className="inline-flex h-10 w-10 items-center justify-center justify-self-center text-[40px] font-light leading-none text-[#8a94a7] max-lg:text-[28px]"
                            aria-label="Azalt"
                        >
                            -
                        </button>
                        <span className="w-[72px] border-none text-center text-[20px] font-normal leading-none text-[#000]">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity((prev) => prev + 1)}
                            className="inline-flex h-10 w-10 items-center justify-center justify-self-center text-[40px] font-light leading-none text-[#8a94a7] max-lg:text-[28px]"
                            aria-label="Artır"
                        >
                            +
                        </button>
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={variant === "discount" ? handleAddToCart : undefined}
                    disabled={variant === "discount" ? isAddingToCart || (typeof stock === "number" && stock <= 0) : false}
                    className={`m-0 inline-flex h-[64px] min-w-0 items-center justify-center gap-[10px] rounded-[20px] px-[80px] py-[25px] text-[1.1em] font-medium leading-none transition-colors ${
                        variant === "order"
                            ? "bg-[#ffd400] text-[#111318]"
                            : inCart
                              ? "bg-[#57bf67] text-white"
                              : "bg-[rgba(0,61,255,1)] text-white hover:bg-[#0a33c7]"
                    } ${(typeof stock === "number" && stock <= 0) || isAddingToCart ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                    {variant === "order" ? (
                        <span className="text-[0.85em] font-medium" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                            By order
                        </span>
                    ) : inCart ? (
                        <>
                            <i
                                className="fa-solid fa-check text-[0.85em]"
                                aria-hidden="true"
                                style={{ fontFamily: "'Twemoji Country Flags', 'Font Awesome 5 Free', FontAwesome", fontWeight: 900 }}
                            />
                            <span className="text-[0.85em] font-medium" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                                Səbətdə
                            </span>
                        </>
                    ) : (
                        <>
                            <i
                                className="fa-solid fa-cart-shopping text-[0.85em]"
                                aria-hidden="true"
                                style={{ fontFamily: "'Twemoji Country Flags', 'Font Awesome 5 Free', FontAwesome", fontWeight: 900 }}
                            />
                            <span className="text-[0.85em] font-medium" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                                Səbətə at
                            </span>
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    disabled={!productVariationId || favoritePending}
                    className={`m-0 mt-[2px] inline-flex h-[64px] w-[64px] items-center justify-center rounded-[20px] border border-[rgba(217,228,238,1)] px-[10px] py-[20px] text-[24px] font-semibold transition-colors ${
                        isFavorite
                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                            : "border-[#dce3ef] bg-white text-[#0f57d6] hover:bg-[#f4f7ff]"
                    } ${!productVariationId || favoritePending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    aria-label="Seçilmişlər"
                >
                    <i className={`${isFavorite ? "fa-solid" : "far"} fa-heart text-[18px] font-normal`} aria-hidden="true" />
                </button>

                <button
                    type="button"
                    onClick={handleCompareToggle}
                    disabled={!productVariationId || comparePending}
                    className={`m-0 mt-[2px] inline-flex h-[64px] w-[64px] items-center justify-center rounded-[20px] border border-[rgba(217,228,238,1)] px-[10px] py-[20px] text-[24px] font-semibold transition-colors ${
                        isCompared
                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                            : "border-[#dce3ef] bg-white text-[#0f57d6] hover:bg-[#f4f7ff]"
                    } ${!productVariationId || comparePending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    aria-label="Müqayisə"
                >
                    <i className="fa-solid fa-code-compare text-[18px] font-normal" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

export { ProductDetailActions };
