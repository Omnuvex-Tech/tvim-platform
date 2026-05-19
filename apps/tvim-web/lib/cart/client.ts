"use client";

import { useEffect, useSyncExternalStore } from "react";

type ApiPayload<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

export type ActiveCartItem = {
    id?: number;
    product_variation_id?: number;
    product_id?: number;
    qty?: number;
    price?: number;
    line_total?: number;
    product?: {
        product_id?: number;
        variation?: {
            id?: number;
            name?: string;
            slug?: string;
            stock?: number;
            price?: number;
            old_price?: number;
            discount_price?: number | null;
            main_image?: string | null;
        } | null;
    } | null;
};

export type ActiveCartTotals = {
    subtotal?: number;
    discount?: number;
    total?: number;
};

export type ActiveCartData = {
    id?: number;
    token?: string | null;
    currency?: string;
    totals?: ActiveCartTotals;
    items?: ActiveCartItem[];
};

export type CartProduct = {
    id: number;
    title: string;
    price: string;
    imageUrl: string;
    productVariationId?: number | null;
    stock?: number | null;
};

export type CartItem = {
    key: string;
    product: CartProduct;
    quantity: number;
};

type CartSnapshot = {
    isCartModalOpen: boolean;
    items: CartItem[];
    isAdding: boolean;
    addingProductTitle: string;
    hasHydrated: boolean;
    pendingCount: number;
};

const listeners = new Set<() => void>();

let hydratePromise: Promise<void> | null = null;
let cartState: CartSnapshot = {
    isCartModalOpen: false,
    items: [],
    isAdding: false,
    addingProductTitle: "",
    hasHydrated: false,
    pendingCount: 0,
};

const notifyCartSubscribers = () => {
    listeners.forEach((listener) => listener());
};

const setCartState = (updater: Partial<CartSnapshot> | ((state: CartSnapshot) => CartSnapshot)) => {
    cartState =
        typeof updater === "function"
            ? (updater as (state: CartSnapshot) => CartSnapshot)(cartState)
            : { ...cartState, ...updater };

    notifyCartSubscribers();
};

const bumpPending = (delta: number) => {
    setCartState((state) => ({
        ...state,
        pendingCount: Math.max(0, state.pendingCount + delta),
    }));
};

const subscribeCart = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getCartSnapshot = () => cartState;

const normalizeCartImageUrl = (value: unknown) => {
    if (typeof value !== "string") return "";
    return value.trim().replace(/^`+|`+$/g, "").trim();
};

const resolveCartItemKey = (apiItem: ActiveCartItem, variationId: number) => {
    const cartItemId = Number(apiItem?.id);
    if (Number.isFinite(cartItemId) && cartItemId > 0) {
        return `ci-${cartItemId}`;
    }

    return `v-${variationId}`;
};

const resolveProductKey = (product: { id: number; productVariationId?: number | null }) => {
    if (product.productVariationId) {
        return `v-${product.productVariationId}`;
    }

    return `id-${product.id}`;
};

const toErrorMessage = (payload: { message?: string } | null, fallback: string) => {
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    return message || fallback;
};

const parseResponse = async <T>(response: Response): Promise<ApiPayload<T>> => {
    let payload: ApiPayload<T> | null = null;

    try {
        payload = (await response.json()) as ApiPayload<T>;
    } catch {
        payload = null;
    }

    if (!response.ok || payload?.success === false) {
        throw new Error(toErrorMessage(payload, "Server Error"));
    }

    return payload ?? {};
};

const syncCartItems = (data: ActiveCartData | null | undefined) => {
    const apiItems = Array.isArray(data?.items) ? data.items : [];
    const previousItems = cartState.items;

    const nextItems = apiItems.reduce<CartItem[]>((acc, apiItem) => {
        const variationId = Number(apiItem?.product_variation_id);
        const qty = Number(apiItem?.qty ?? 0);
        const variation = apiItem?.product?.variation;

        if (!Number.isFinite(variationId) || variationId <= 0) return acc;
        if (!Number.isFinite(qty) || qty <= 0) return acc;

        const key = resolveCartItemKey(apiItem, variationId);
        const previousItem = previousItems.find(
            (item) => item.key === key || Number(item.product.productVariationId) === variationId
        );
        const variationPrice = Number(variation?.discount_price ?? variation?.price);
        const fallbackPrice = Number(apiItem?.price ?? 0);
        const resolvedPrice = Number.isFinite(variationPrice)
            ? String(variationPrice)
            : Number.isFinite(fallbackPrice)
            ? String(fallbackPrice)
            : previousItem?.product.price ?? "0";
        const resolvedTitle =
            (typeof variation?.name === "string" && variation.name.trim()) ||
            previousItem?.product.title ||
            `Məhsul #${variationId}`;
        const resolvedImageUrl =
            normalizeCartImageUrl(variation?.main_image) || previousItem?.product.imageUrl || "";
        const resolvedStock = Number(variation?.stock);

        acc.push({
            key,
            quantity: qty,
            product: {
                id: Number(
                    apiItem?.product?.product_id ??
                        apiItem?.product_id ??
                        previousItem?.product.id ??
                        variationId
                ),
                title: resolvedTitle,
                price: resolvedPrice,
                imageUrl: resolvedImageUrl,
                productVariationId: variationId,
                stock: Number.isFinite(resolvedStock)
                    ? resolvedStock
                    : previousItem?.product.stock ?? null,
            },
        });

        return acc;
    }, []);

    setCartState((state) => ({
        ...state,
        items: nextItems,
        hasHydrated: true,
    }));
};

export const getActiveCart = async () => {
    const response = await fetch("/api/cart", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
            Accept: "application/json",
        },
    });

    const payload = await parseResponse<ActiveCartData>(response);
    return {
        message: payload.message,
        data: payload.data ?? {},
    };
};

export const removeCartItem = async (productVariationId: number) => {
    const response = await fetch(`/api/cart/items/${productVariationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const payload = await parseResponse<ActiveCartData>(response);
    return {
        message: payload.message,
        data: payload.data ?? {},
    };
};

export const updateCartItemQuantity = async (productVariationId: number, quantity: number) => {
    const response = await fetch(`/api/cart/items/${productVariationId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ qty: quantity }),
    });

    const payload = await parseResponse<ActiveCartData>(response);
    return {
        message: payload.message,
        data: payload.data ?? {},
    };
};

export const addCartItem = async (productVariationId: number, quantity = 1) => {
    const body = {
        product_variation_id: productVariationId,
        qty: quantity,
    };

    const response = await fetch("/api/cart/items", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    const payload = await parseResponse<ActiveCartData>(response);
    return {
        message: payload.message,
        data: payload.data ?? {},
    };
};

export const hydrateCart = async (force = false) => {
    if (!force && cartState.hasHydrated) return;

    if (hydratePromise) {
        await hydratePromise;
        return;
    }

    const promise = (async () => {
        bumpPending(1);
        try {
            const response = await getActiveCart();
            syncCartItems(response.data);
        } catch {
            setCartState((state) => ({
                ...state,
                hasHydrated: true,
            }));
        } finally {
            bumpPending(-1);
        }
    })();

    hydratePromise = promise;
    try {
        await promise;
    } finally {
        hydratePromise = null;
    }
};

export const openCartModal = () => {
    setCartState((state) => ({ ...state, isCartModalOpen: true }));
};

export const closeCartModal = () => {
    setCartState((state) => ({ ...state, isCartModalOpen: false }));
};

export const addProductToCart = async (product: CartProduct) => {
    const variationId = Number(product.productVariationId);

    setCartState((state) => ({
        ...state,
        isAdding: true,
        addingProductTitle: product.title ?? "",
    }));

    bumpPending(1);
    try {
        if (!Number.isFinite(variationId) || variationId <= 0) {
            throw new Error("Validation failed");
        }

        const response = await addCartItem(variationId, 1);
        syncCartItems(response.data);

        setCartState((state) => {
            const key = resolveProductKey(product);
            const hasItem = state.items.some(
                (item) =>
                    item.key === key || Number(item.product.productVariationId) === variationId
            );

            return {
                ...state,
                isAdding: false,
                addingProductTitle: "",
                isCartModalOpen: true,
                items: hasItem
                    ? state.items.map((item) =>
                          item.key === key || Number(item.product.productVariationId) === variationId
                              ? {
                                    ...item,
                                    product: {
                                        ...item.product,
                                        title: product.title,
                                        price: product.price,
                                        imageUrl: product.imageUrl,
                                        stock: product.stock ?? item.product.stock ?? null,
                                    },
                                }
                              : item
                      )
                    : [
                          ...state.items,
                          {
                              key,
                              quantity: 1,
                              product,
                          },
                      ],
            };
        });
    } catch (error) {
        setCartState((state) => ({
            ...state,
            isAdding: false,
            addingProductTitle: "",
        }));
        throw error;
    } finally {
        bumpPending(-1);
    }
};

export const changeCartItemQuantity = async (itemKey: string, nextQuantity: number) => {
    const item = cartState.items.find((entry) => entry.key === itemKey);
    const variationId = Number(item?.product.productVariationId);

    if (!item || !Number.isFinite(variationId) || variationId <= 0) return;

    bumpPending(1);
    try {
        const response =
            nextQuantity <= 0
                ? await removeCartItem(variationId)
                : await updateCartItemQuantity(variationId, nextQuantity);

        syncCartItems(response.data);
    } catch (error) {
        await hydrateCart(true);
        throw error;
    } finally {
        bumpPending(-1);
    }
};

export const removeCartItemByKey = async (itemKey: string) => {
    await changeCartItemQuantity(itemKey, 0);
};

export const useCart = () => {
    const snapshot = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartSnapshot);

    useEffect(() => {
        void hydrateCart();
    }, []);

    return {
        ...snapshot,
        openCartModal,
        closeCartModal,
        hydrateCart,
        addProductToCart,
        increaseQuantity: async (itemKey: string) => {
            const item = getCartSnapshot().items.find((entry) => entry.key === itemKey);
            if (!item) return;
            await changeCartItemQuantity(itemKey, item.quantity + 1);
        },
        decreaseQuantity: async (itemKey: string) => {
            const item = getCartSnapshot().items.find((entry) => entry.key === itemKey);
            if (!item) return;
            await changeCartItemQuantity(itemKey, Math.max(0, item.quantity - 1));
        },
        removeItem: removeCartItemByKey,
    };
};
