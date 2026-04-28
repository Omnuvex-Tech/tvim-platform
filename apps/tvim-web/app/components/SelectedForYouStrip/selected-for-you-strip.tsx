"use client";

import React from "react";
import { ProductStrip } from "../ProductStrip/product-strip";

type ApiItem = any;

type Props = {
    items?: ApiItem[];
};

const SelectedForYouStrip: React.FC<Props> = ({ items }) => {
    return <ProductStrip variant="selected" title="Sizin üçün seçdiklərimiz" items={items} />;
};

export { SelectedForYouStrip };
