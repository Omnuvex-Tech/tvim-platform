"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type CartProduct = {
    id: number;
    title: string;
    price: string;
    imageUrl: string;
    productVariationId?: number | null;
    stock?: number | null;
};

type CartItem = {
    key: string;
    product: CartProduct;
    quantity: number;
};

type CartState = {
    isCartModalOpen: boolean;
    items: CartItem[];
    toastTrigger: number;
    toastProductTitle: string;
};

type CartActions = {
    addProduct: (product: CartProduct) => void;
    openModal: () => void;
    closeModal: () => void;
    increaseQuantity: (itemKey: string) => void;
    decreaseQuantity: (itemKey: string) => void;
    removeItem: (itemKey: string) => void;
};

const resolveProductKey = (product: CartProduct) => {
    if (product.productVariationId) {
        return `v-${product.productVariationId}`;
    }

    return `id-${product.id}`;
};

export const useCartStore = create<CartState & CartActions>()(
    persist(
        (set) => ({
            isCartModalOpen: false,
            items: [],
            toastTrigger: 0,
            toastProductTitle: "",

            addProduct: (product) =>
                set((state) => {
                    const itemKey = resolveProductKey(product);
                    const existingItemIndex = state.items.findIndex((item) => item.key === itemKey);

                    const nextItems =
                        existingItemIndex >= 0
                            ? state.items.map((item, index) =>
                                  index === existingItemIndex
                                      ? {
                                            ...item,
                                            quantity: item.quantity + 1,
                                        }
                                      : item
                              )
                            : [
                                  ...state.items,
                                  {
                                      key: itemKey,
                                      product,
                                      quantity: 1,
                                  },
                              ];

                    return {
                        items: nextItems,
                        isCartModalOpen: true,
                        toastProductTitle: product.title,
                        toastTrigger: state.toastTrigger + 1,
                    };
                }),

            openModal: () =>
                set((state) => ({
                    isCartModalOpen: state.items.length > 0,
                })),

            closeModal: () => set({ isCartModalOpen: false }),

            increaseQuantity: (itemKey) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.key === itemKey
                            ? {
                                  ...item,
                                  quantity: item.quantity + 1,
                              }
                            : item
                    ),
                })),

            decreaseQuantity: (itemKey) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.key === itemKey
                            ? {
                                  ...item,
                                  quantity: Math.max(1, item.quantity - 1),
                              }
                            : item
                    ),
                })),

            removeItem: (itemKey) =>
                set((state) => {
                    const nextItems = state.items.filter((item) => item.key !== itemKey);

                    return {
                        items: nextItems,
                        isCartModalOpen: nextItems.length > 0 ? state.isCartModalOpen : false,
                    };
                }),
        }),
        {
            name: "cart-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
            }),
        }
    )
);
