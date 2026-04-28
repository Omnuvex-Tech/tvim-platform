"use client";

import React from "react";
import { ProductStrip } from "../ProductStrip/product-strip";

type ApiItem = any;

type Props = {
    items?: ApiItem[];
};

const LatestProductsStrip: React.FC<Props> = ({ items }) => {
    return <ProductStrip variant="latest" title="Son məhsullar" items={items} />;
};

export { LatestProductsStrip };
