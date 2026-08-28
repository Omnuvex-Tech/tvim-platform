import { openCartModal } from "@/lib/cart/client";
import type { NotifyOptions } from "@repo/types/types";

type AddedToCartCopy = {
    addedToCart: string;
    addedToCartFallback: string;
};

type AddedToCartProduct = {
    title?: string | null;
};

export const buildAddedToCartToast = (
    copy: AddedToCartCopy,
    product: AddedToCartProduct
): { message: string; options: NotifyOptions } => {
    const title = String(product.title ?? "").trim();

    const message = title ? copy.addedToCart.replace("{product}", title) : copy.addedToCartFallback;

    return { message, options: { onClick: openCartModal } };
};
