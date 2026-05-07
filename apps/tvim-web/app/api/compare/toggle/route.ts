import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { compareNoStoreHeaders, parseJsonBody, proxyCompareRequest } from "../helpers";

type ToggleBody = {
    product_variation_id?: number | string;
};

export async function POST(request: NextRequest) {
    try {
        const body = await parseJsonBody<ToggleBody>(request);
        const productVariationId = Number(body?.product_variation_id);

        if (!Number.isFinite(productVariationId) || productVariationId <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    data: [],
                },
                {
                    status: 422,
                    headers: compareNoStoreHeaders,
                }
            );
        }

        return await proxyCompareRequest(request, {
            method: "POST",
            endpoint: config.endpoints.compare.toggle,
            body: {
                product_variation_id: productVariationId,
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
                headers: compareNoStoreHeaders,
            }
        );
    }
}
