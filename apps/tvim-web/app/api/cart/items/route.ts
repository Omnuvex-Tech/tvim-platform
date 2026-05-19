import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { cartNoStoreHeaders, parseJsonBody, proxyCartRequest } from "../helpers";

type AddBody = {
    product_variation_id?: number | string;
    qty?: number | string;
    quantity?: number | string;
};

export async function POST(request: NextRequest) {
    try {
        const body = await parseJsonBody<AddBody>(request);
        const productVariationId = Number(body?.product_variation_id);
        const qty = Number(body?.qty ?? body?.quantity ?? 1);

        if (!Number.isFinite(productVariationId) || productVariationId <= 0 || !Number.isFinite(qty) || qty <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    data: [],
                },
                {
                    status: 422,
                    headers: cartNoStoreHeaders,
                }
            );
        }

        return await proxyCartRequest(request, {
            method: "POST",
            endpoint: config.endpoints.cart.items,
            body: {
                product_variation_id: productVariationId,
                qty,
            },
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "Server Error",
                data: [],
            },
            {
                status: 500,
                headers: cartNoStoreHeaders,
            }
        );
    }
}

