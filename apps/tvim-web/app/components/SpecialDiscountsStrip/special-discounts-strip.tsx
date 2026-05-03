"use client";

import React from "react";
import { ProductStrip } from "../ProductStrip/product-strip";

type ApiItem = any;

type Props = {
    items?: ApiItem[];
    onlyDiscountProducts?: boolean;
    only_discount_products?: boolean;
    viewAllHref?: string;
    viewAllText?: string;
};

const SpecialDiscountsStrip: React.FC<Props> = ({ items, onlyDiscountProducts = false, only_discount_products = false, viewAllHref, viewAllText }) => {
    return (
        <ProductStrip
            variant="special"
            title="Xüsusi endirimlər"
            items={items}
            onlyDiscountProducts={onlyDiscountProducts}
            only_discount_products={only_discount_products}
            viewAllHref={viewAllHref}
            viewAllText={viewAllText}
        />
    );
};

export { SpecialDiscountsStrip };
