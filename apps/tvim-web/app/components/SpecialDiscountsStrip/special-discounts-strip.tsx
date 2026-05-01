"use client";

import React from "react";
import { ProductStrip } from "../ProductStrip/product-strip";

type ApiItem = any;

type Props = {
    items?: ApiItem[];
};

const SpecialDiscountsStrip: React.FC<Props> = ({ items }) => {
    return <ProductStrip variant="special" title="Xüsusi endirimlər" items={items} />;
};

export { SpecialDiscountsStrip };
