"use client";

import { useEffect, useState } from "react";
import { useNotify } from "@repo/ui";
import { addProductToCart } from "@/lib/cart/client";
import { listCompare, toggleCompare } from "@/lib/compare/client";
import { listFavorites, toggleFavorite } from "@/lib/favorites/client";

const FAVORITES_UPDATED_EVENT = "tvim:favorites-updated";
const COMPARE_UPDATED_EVENT = "tvim:compare-updated";

type ProductGridCardActionsProps = {
    id: number;
    title: string;
    priceText: string;
    imageUrl: string;
    productVariationId: number | null;
    stock: number | null;
    cartVariant: "yellow" | "blue";
};

export function ProductGridCardActions({
    id,
    title,
    priceText,
    imageUrl,
    productVariationId,
    stock,
    cartVariant,
}: ProductGridCardActionsProps) {
    const notify = useNotify();
    const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
    const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
    const [favoritePendingIds, setFavoritePendingIds] = useState<Set<number>>(new Set());
    const [comparePendingIds, setComparePendingIds] = useState<Set<number>>(new Set());
    const [cartPending, setCartPending] = useState(false);

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

    const isFavorite = typeof productVariationId === "number" && favoriteIds.has(productVariationId);
    const isFavoritePending = typeof productVariationId === "number" && favoritePendingIds.has(productVariationId);
    const isCompared = typeof productVariationId === "number" && compareIds.has(productVariationId);
    const isComparePending = typeof productVariationId === "number" && comparePendingIds.has(productVariationId);

    const handleFavoriteClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const variationId = productVariationId;
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

    const handleCompareClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const variationId = productVariationId;
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

    const handleCartClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (cartPending) return;

        if (cartVariant !== "blue") {
            notify.error("Məhsul stokda yoxdur.");
            return;
        }

        setCartPending(true);
        try {
            await addProductToCart({
                id,
                title,
                price: priceText,
                imageUrl,
                productVariationId,
                stock,
            });

            notify.success(title ? `${title} səbətinizə müvəffəqiyyətlə əlavə edildi!` : "Məhsul səbətinizə müvəffəqiyyətlə əlavə edildi!");
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Səbətə əlavə edərkən xəta baş verdi.");
        } finally {
            setCartPending(false);
        }
    };

    return (
        <>
            <div className="absolute top-3 left-3 z-[3] flex flex-col items-center gap-2">
                <button
                    type="button"
                    disabled={isFavoritePending || !productVariationId}
                    onClick={handleFavoriteClick}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                        isFavorite
                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                            : "border-[#e0e5ee] bg-white text-[#7b8596] hover:bg-[#0f57d6] hover:text-white"
                    } ${isFavoritePending || !productVariationId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    aria-label="Seçilmişlər"
                >
                    <i className={`${isFavorite ? "fa-solid" : "far"} fa-heart text-[14px] leading-none`} aria-hidden="true" />
                </button>

                <button
                    type="button"
                    disabled={isComparePending || !productVariationId}
                    onClick={handleCompareClick}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                        isCompared
                            ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                            : "border-[#e0e5ee] bg-white text-[#7b8596] hover:bg-[#0f57d6] hover:text-white"
                    } ${isComparePending || !productVariationId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                    aria-label="Müqayisə"
                >
                    <i className="fa-solid fa-code-compare text-[14px] leading-none" aria-hidden="true" />
                </button>
            </div>

            <button
                type="button"
                disabled={cartPending || cartVariant !== "blue"}
                onClick={handleCartClick}
                className={`relative z-[2] mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full ${
                    cartVariant === "blue" ? "bg-[#0f57d6] text-white" : "bg-[#ffd500] text-[#1b212e]"
                } ${cartPending || cartVariant !== "blue" ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                aria-label={cartVariant === "blue" ? "Səbətə əlavə et" : "Məhsul stokda yoxdur"}
            >
                {cartVariant === "blue" ? (
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
        </>
    );
}
