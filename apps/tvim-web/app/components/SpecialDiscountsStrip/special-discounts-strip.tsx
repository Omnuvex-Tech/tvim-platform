"use client";

import React from "react";
import { ProductStrip } from "../ProductStrip/product-strip";

type ApiItem = any;

type Props = {
    items?: ApiItem[];
    showLink?: boolean;
};

const SpecialDiscountsStrip: React.FC<Props> = ({ items, showLink = true }) => {
    return <ProductStrip variant="special" title="Xüsusi endirimlər" items={items} showSpecialDiscountLink={showLink} />;
};

export { SpecialDiscountsStrip };
