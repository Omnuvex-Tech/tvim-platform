import { closeCartModal } from "@/lib/cart/client";
import { localizedHref } from "@/lib/routes";
import type { NotifyLink, NotifyOptions } from "@repo/types/types";

type AddedToCartCopy = {
    addedToCart: string;
    addedToCartLink: string;
    addedToCartFallback: string;
};

type AddedToCartProduct = {
    title?: string | null;
    href?: string | null;
};

/**
 * The toast reads as one sentence with the product name and the cart word
 * linked inside it, so the message and its links are built together here and
 * every add-to-cart entry point shares the result.
 */
export const buildAddedToCartToast = (
    copy: AddedToCartCopy,
    locale: string,
    product: AddedToCartProduct
): { message: string; options: NotifyOptions } => {
    const title = String(product.title ?? "").trim();
    const href = String(product.href ?? "").trim();

    if (!title) {
        return { message: copy.addedToCartFallback, options: {} };
    }

    // Adding to the cart also opens the cart modal, which would otherwise stay
    // over whichever page the link leads to.
    const onNavigate = () => closeCartModal();

    const links: NotifyLink[] = [];
    if (href) {
        links.push({ label: title, href });
    }
    links.push({ label: copy.addedToCartLink, href: localizedHref("checkout", locale) });

    return {
        message: copy.addedToCart.replace("{product}", title).replace("{cart}", copy.addedToCartLink),
        options: { links, onNavigate },
    };
};
