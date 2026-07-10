"use client";

import type { MouseEvent, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useNotify } from "@repo/ui";

const FAVORITES_UPDATED_EVENT = "tvim:favorites-updated";
const COMPARE_UPDATED_EVENT = "tvim:compare-updated";
const QuickOrderPopup = dynamic(
    () => import("@/app/components/ProductStrip/quick-order-popup").then((module) => module.QuickOrderPopup),
    { ssr: false }
);

const loadFavoritesClient = () => import("@/lib/favorites/client");
const loadCompareClient = () => import("@/lib/compare/client");
const loadCartClient = () => import("@/lib/cart/client");

export type ProductGridCardActionItem = {
    id: number;
    title: string;
    priceText: string;
    imageUrl: string;
    productVariationId: number | null;
    stock: number | null;
    cartVariant: "yellow" | "blue";
};

type ProductGridCardActionsProviderProps = {
    children: ReactNode;
};

type ProductGridCardActionsContextValue = {
    favoriteIds: Set<number>;
    compareIds: Set<number>;
    favoritePendingIds: Set<number>;
    comparePendingIds: Set<number>;
    cartPendingIds: Set<number>;
    handleFavoriteClick: (product: ProductGridCardActionItem, event: MouseEvent<HTMLButtonElement>) => Promise<void>;
    handleCompareClick: (product: ProductGridCardActionItem, event: MouseEvent<HTMLButtonElement>) => Promise<void>;
    handleCartClick: (product: ProductGridCardActionItem, event: MouseEvent<HTMLButtonElement>) => Promise<void>;
};

const ProductGridCardActionsContext = createContext<ProductGridCardActionsContextValue | null>(null);

export function ProductGridCardActionsProvider({ children }: ProductGridCardActionsProviderProps) {
    const notify = useNotify();
    const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
    const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
    const [favoritePendingIds, setFavoritePendingIds] = useState<Set<number>>(new Set());
    const [comparePendingIds, setComparePendingIds] = useState<Set<number>>(new Set());
    const [cartPendingIds, setCartPendingIds] = useState<Set<number>>(new Set());
    const [quickOrderProduct, setQuickOrderProduct] = useState<ProductGridCardActionItem | null>(null);

    useEffect(() => {
        let alive = true;

        const load = async () => {
            const [favoritesClient, compareClient] = await Promise.all([
                loadFavoritesClient(),
                loadCompareClient(),
            ]);

            const [favoritesResponse, compareResponse] = await Promise.all([
                favoritesClient.listFavorites(),
                compareClient.listCompare(),
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

    const handleFavoriteClick = async (product: ProductGridCardActionItem, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const variationId = product.productVariationId;
        if (!variationId) {
            notify.error("Bu mehsul favorilere elave edile bilmedi.");
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
            const favoritesClient = await loadFavoritesClient();
            const response = await favoritesClient.toggleFavorite(variationId);
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
            notify.error(error instanceof Error ? error.message : "Favorilere elave edilerken xeta bas verdi.");
        } finally {
            setFavoritePendingIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    const handleCompareClick = async (product: ProductGridCardActionItem, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const variationId = product.productVariationId;
        if (!variationId) {
            notify.error("Bu mehsul muqayiseye elave edile bilmedi.");
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
            const compareClient = await loadCompareClient();
            const response = await compareClient.toggleCompare(variationId);
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
            notify.error(error instanceof Error ? error.message : "Muqayise yenilenirken xeta bas verdi.");
        } finally {
            setComparePendingIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    const handleCartClick = async (product: ProductGridCardActionItem, event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (cartPendingIds.has(product.id)) return;

        if (product.cartVariant !== "blue") {
            setQuickOrderProduct(product);
            return;
        }

        setCartPendingIds((prev) => new Set(prev).add(product.id));
        try {
            const cartClient = await loadCartClient();
            await cartClient.addProductToCart({
                id: product.id,
                title: product.title,
                price: product.priceText,
                imageUrl: product.imageUrl,
                productVariationId: product.productVariationId,
                stock: product.stock,
            });

            notify.success(product.title ? `${product.title} sebetinize muveffeqiyyetle elave edildi!` : "Mehsul sebetinize muveffeqiyyetle elave edildi!");
        } catch (error) {
            notify.error(error instanceof Error ? error.message : "Sebete elave ederken xeta bas verdi.");
        } finally {
            setCartPendingIds((prev) => {
                const next = new Set(prev);
                next.delete(product.id);
                return next;
            });
        }
    };

    const value = useMemo<ProductGridCardActionsContextValue>(
        () => ({
            favoriteIds,
            compareIds,
            favoritePendingIds,
            comparePendingIds,
            cartPendingIds,
            handleFavoriteClick,
            handleCompareClick,
            handleCartClick,
        }),
        [favoriteIds, compareIds, favoritePendingIds, comparePendingIds, cartPendingIds]
    );

    return (
        <>
            <ProductGridCardActionsContext.Provider value={value}>
                {children}
            </ProductGridCardActionsContext.Provider>
            {quickOrderProduct ? (
                <QuickOrderPopup
                    isOpen={Boolean(quickOrderProduct)}
                    onClose={() => setQuickOrderProduct(null)}
                    productVariationId={quickOrderProduct.productVariationId ?? quickOrderProduct.id}
                    productTitle={quickOrderProduct.title}
                    productCode={String(quickOrderProduct.productVariationId ?? quickOrderProduct.id)}
                />
            ) : null}
        </>
    );
}

export function ProductGridCardSideActions(props: ProductGridCardActionItem) {
    const context = useContext(ProductGridCardActionsContext);

    if (!context) return null;

    const variationId = props.productVariationId;
    const isFavorite = typeof variationId === "number" && context.favoriteIds.has(variationId);
    const isFavoritePending = typeof variationId === "number" && context.favoritePendingIds.has(variationId);
    const isCompared = typeof variationId === "number" && context.compareIds.has(variationId);
    const isComparePending = typeof variationId === "number" && context.comparePendingIds.has(variationId);

    return (
        <div className="absolute top-3 left-3 z-[3] flex flex-col items-center gap-2">
            <button
                type="button"
                disabled={isFavoritePending || !variationId}
                onClick={(event) => void context.handleFavoriteClick(props, event)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                    isFavorite
                        ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                        : "border-[#e0e5ee] bg-white text-[#7b8596] hover:bg-[#0f57d6] hover:text-white"
                } ${isFavoritePending || !variationId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                aria-label="Secilmisler"
            >
                <i className={`${isFavorite ? "fa-solid" : "far"} fa-heart text-[14px] leading-none`} aria-hidden="true" />
            </button>

            <button
                type="button"
                disabled={isComparePending || !variationId}
                onClick={(event) => void context.handleCompareClick(props, event)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                    isCompared
                        ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                        : "border-[#e0e5ee] bg-white text-[#7b8596] hover:bg-[#0f57d6] hover:text-white"
                } ${isComparePending || !variationId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                aria-label="Muqayise"
            >
                <i className="fa-solid fa-code-compare text-[14px] leading-none" aria-hidden="true" />
            </button>
        </div>
    );
}

export function ProductGridCartButton(props: ProductGridCardActionItem) {
    const context = useContext(ProductGridCardActionsContext);

    if (!context) return null;

    const isCartPending = context.cartPendingIds.has(props.id);

    return (
        <button
            type="button"
            disabled={isCartPending}
            onClick={(event) => void context.handleCartClick(props, event)}
            className={`relative z-[2] mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full ${
                props.cartVariant === "blue" ? "bg-[#0f57d6] text-white" : "bg-[#ffd500] text-[#1b212e]"
            } ${isCartPending ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            aria-label={props.cartVariant === "blue" ? "Sebete elave et" : "Mehsul stokda yoxdur"}
        >
            {props.cartVariant === "blue" ? (
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
    );
}
