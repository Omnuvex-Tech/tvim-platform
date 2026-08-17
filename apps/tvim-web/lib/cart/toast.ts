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

    const onNavigate = () => closeCartModal();

    const links: NotifyLink[] = [];
    if (href) {
        links.push({ label: title, href, isBold: true });
    }
    links.push({ label: copy.addedToCartLink, href: localizedHref("checkout", locale) });

    return {
        message: copy.addedToCart.replace("{product}", title).replace("{cart}", copy.addedToCartLink),
        options: { links, onNavigate },
    };
};
