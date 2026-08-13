"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getTranslations } from "@/lib/i18n";
import { defaultLocale, isSupportedLocale } from "@/lib/site-locales";
import { useNotify } from "@repo/ui";
import { Minus, Plus } from "lucide-react";
import { addCartItem, hydrateCart, removeCartItem, updateCartItemQuantity, useCart } from "@/lib/cart/client";
import { listCompare, toggleCompare } from "@/lib/compare/client";
import { listFavorites, toggleFavorite } from "@/lib/favorites/client";
import { QuickOrderPopup } from "../ProductStrip/quick-order-popup";

type ProductDetailActionsProps = {
    productVariationId: number | null;
    stock?: number | null;
    variant?: "discount" | "order";
    productTitle?: string;
    productCode?: string;
};

const ProductDetailActions = ({
    productVariationId,
    stock,
    variant = "discount",
    productTitle = "",
    productCode = "",
}: ProductDetailActionsProps) => {
    const notify = useNotify();
    const pathname = usePathname();
    const t = useMemo(() => {
        const segment = String(pathname ?? "").split("/").filter(Boolean)[0] ?? "";
        return getTranslations(isSupportedLocale(segment) ? segment : defaultLocale).product;
    }, [pathname]);
    const { items } = useCart();

    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isCompared, setIsCompared] = useState(false);
    const [favoritePending, setFavoritePending] = useState(false);
    const [comparePending, setComparePending] = useState(false);
    const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);

    const inCart = useMemo(() => {
        if (!productVariationId) return false;
        return items.some((item) => Number(item.product.productVariationId) === productVariationId);
    }, [items, productVariationId]);
    const cartItem = useMemo(() => {
        if (!productVariationId) return null;
        return items.find((item) => Number(item.product.productVariationId) === productVariationId) ?? null;
    }, [items, productVariationId]);

    useEffect(() => {
        if (!cartItem) return;
        setQuantity(Math.max(1, cartItem.quantity));
    }, [cartItem]);

    const handleQuantityChange = async (nextQuantity: number) => {
        const normalizedQuantity = Math.max(1, nextQuantity);
        setQuantity(normalizedQuantity);

        if (!productVariationId || !inCart || isUpdatingQuantity) return;

        setIsUpdatingQuantity(true);
        try {
            await updateCartItemQuantity(productVariationId, normalizedQuantity);
            await hydrateCart(true);
        } catch (error) {
            const fallbackQuantity = Math.max(1, cartItem?.quantity ?? 1);
            setQuantity(fallbackQuantity);
            const message = error instanceof Error ? error.message : t.cartUpdateFailed;
            notify.error(message);
        } finally {
            setIsUpdatingQuantity(false);
        }
    };

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
            notify.error(t.cartAddBlocked);
            return;
        }

        if (typeof stock === "number" && stock <= 0) {
            notify.error(t.outOfStockToast);
            return;
        }

        if (isAddingToCart) return;

        setIsAddingToCart(true);
        try {
            if (inCart) {
                await removeCartItem(productVariationId);
                await hydrateCart(true);
                notify.success(t.removedFromCart);
                return;
            }

            await addCartItem(productVariationId, quantity);
            await hydrateCart(true);
            notify.success(t.addedToCart);
        } catch (error) {
            const message = error instanceof Error ? error.message : t.cartAddFailed;
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
            notify.success(response.data.action === "created" ? t.favoriteAdded : t.favoriteRemoved);
        } catch (error) {
            setIsFavorite(previous);
            const message = error instanceof Error ? error.message : t.favoriteUpdateFailed;
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
            notify.success(response.data.action === "created" ? t.compareAdded : t.compareRemoved);
        } catch (error) {
            setIsCompared(previous);
            const message = error instanceof Error ? error.message : t.compareUpdateFailed;
            notify.error(message);
        } finally {
            setComparePending(false);
        }
    };

    return (
        <div className="mt-14 max-lg:mt-6">
            <div className="flex flex-nowrap items-center gap-3 max-lg:grid max-lg:grid-cols-[minmax(0,1fr)_44px_44px] max-lg:gap-2">
                {variant === "discount" ? (
                    <div className="grid h-[58px] w-[156px] shrink-0 grid-cols-[1fr_auto_1fr] items-center rounded-[18px] border border-[rgba(217,228,238,1)] bg-white px-[10px] max-lg:col-span-1 max-lg:h-[44px] max-lg:w-[104px] max-lg:rounded-[12px] max-lg:px-2">
                        <button
                            type="button"
                            onClick={() => void handleQuantityChange(quantity - 1)}
                            disabled={isUpdatingQuantity}
                            className={`inline-flex h-9 w-7 items-center justify-center justify-self-start text-[#8a94a7] max-lg:h-8 max-lg:w-5 ${isUpdatingQuantity ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                            aria-label={t.decrease}
                        >
                            <Minus className="size-[18px] max-lg:size-[15px]" strokeWidth={3.2} aria-hidden="true" />
                        </button>
                        <span className="min-w-[28px] border-none text-center text-[18px] font-normal leading-none text-[#000] max-lg:min-w-[22px] max-lg:text-[14px]">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => void handleQuantityChange(quantity + 1)}
                            disabled={isUpdatingQuantity}
                            className={`inline-flex h-9 w-7 items-center justify-center justify-self-end text-[#8a94a7] max-lg:h-8 max-lg:w-5 ${isUpdatingQuantity ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                            aria-label={t.increase}
                        >
                            <Plus className="size-[18px] max-lg:size-[15px]" strokeWidth={3.2} aria-hidden="true" />
                        </button>
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={variant === "discount" ? handleAddToCart : () => setIsQuickOrderOpen(true)}
                    disabled={variant === "discount" ? isAddingToCart || (typeof stock === "number" && stock <= 0) : false}
                    className={`m-0 inline-flex h-[58px] min-w-0 items-center justify-center gap-[9px] rounded-[18px] px-[64px] py-[20px] text-[1.02em] font-medium leading-none transition-colors max-lg:h-[44px] max-lg:w-full max-lg:rounded-[12px] max-lg:px-4 max-lg:py-0 ${
                        variant === "order"
                            ? "bg-[#ffd400] text-[#111318] max-lg:col-start-1 max-lg:row-start-1"
                            : inCart
                              ? "bg-[#57bf67] text-white max-lg:col-span-3 max-lg:row-start-2"
                              : "bg-[rgba(0,61,255,1)] text-white hover:bg-[#0a33c7] max-lg:col-span-3 max-lg:row-start-2"
                    } ${variant === "discount" && ((typeof stock === "number" && stock <= 0) || isAddingToCart) ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                    {variant === "order" ? (
                        <span className="text-[0.85em] font-medium" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                            {t.byOrder}
                        </span>
                    ) : inCart ? (
                        <>
                            <i
                                className="fa-solid fa-check text-[0.85em]"
                                aria-hidden="true"
                                style={{ fontFamily: "'Twemoji Country Flags', 'Font Awesome 5 Free', FontAwesome", fontWeight: 900 }}
                            />
                            <span className="text-[0.85em] font-medium" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
                                {t.inCart}
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
                                {t.addToCart}
                            </span>
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    disabled={!productVariationId || favoritePending}
                    className={`m-0 mt-[2px] inline-flex h-[58px] w-[58px] items-center justify-center rounded-[18px] border border-[rgba(217,228,238,1)] px-[8px] py-[16px] text-[22px] font-semibold transition-colors max-lg:col-start-2 max-lg:row-start-1 max-lg:mt-0 max-lg:h-[44px] max-lg:w-[44px] max-lg:rounded-[12px] max-lg:p-0 ${
                        isFavorite
                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                            : "border-[#dce3ef] bg-white text-[#0f57d6] hover:bg-[#f4f7ff]"
                    } ${!productVariationId || favoritePending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    aria-label={t.favorites}
                >
                    <i className={`${isFavorite ? "fa-solid" : "far"} fa-heart text-[16px] font-normal`} aria-hidden="true" />
                </button>

                <button
                    type="button"
                    onClick={handleCompareToggle}
                    disabled={!productVariationId || comparePending}
                    className={`m-0 mt-[2px] inline-flex h-[58px] w-[58px] items-center justify-center rounded-[18px] border border-[rgba(217,228,238,1)] px-[8px] py-[16px] text-[22px] font-semibold transition-colors max-lg:col-start-3 max-lg:row-start-1 max-lg:mt-0 max-lg:h-[44px] max-lg:w-[44px] max-lg:rounded-[12px] max-lg:p-0 ${
                        isCompared
                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                            : "border-[#dce3ef] bg-white text-[#0f57d6] hover:bg-[#f4f7ff]"
                    } ${!productVariationId || comparePending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    aria-label={t.compareLabel}
                >
                    <i className="fa-solid fa-code-compare text-[16px] font-normal" aria-hidden="true" />
                </button>
            </div>

            <QuickOrderPopup
                isOpen={isQuickOrderOpen}
                productTitle={productTitle}
                productCode={productCode}
                productVariationId={productVariationId}
                onClose={() => setIsQuickOrderOpen(false)}
            />
        </div>
    );
};

export { ProductDetailActions };