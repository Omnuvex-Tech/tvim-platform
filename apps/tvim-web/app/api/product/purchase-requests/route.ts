import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { cartNoStoreHeaders, parseJsonBody, proxyCartRequest } from "@/app/api/cart/helpers";

type PurchaseRequestBody = {
    fullname?: string;
    phone?: string;
    product_variation_id?: number | string;
    quantity?: number | string;
};

export async function POST(request: NextRequest) {
    try {
        const body = await parseJsonBody<PurchaseRequestBody>(request);

        const fullname = typeof body?.fullname === "string" ? body.fullname.trim() : "";
        const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
        const productVariationId = Number(body?.product_variation_id);
        const quantity = Number(body?.quantity ?? 1);

        if (
            fullname.length < 2 ||
            !phone ||
            !Number.isFinite(productVariationId) ||
            productVariationId <= 0 ||
            !Number.isFinite(quantity) ||
            quantity < 1 ||
            quantity > 999
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    data: {
                        ...(fullname.length < 2
                            ? {
                                  fullname: ["Full name is required."],
                              }
                            : {}),
                        ...(!phone
                            ? {
                                  phone: ["Phone number must be a valid Azerbaijan phone number."],
                              }
                            : {}),
                        ...(!Number.isFinite(productVariationId) || productVariationId <= 0
                            ? {
                                  product_variation_id: ["Selected product variation was not found."],
                              }
                            : {}),
                        ...(!Number.isFinite(quantity) || quantity < 1 || quantity > 999
                            ? {
                                  quantity: ["Quantity must be at least 1."],
                              }
                            : {}),
                    },
                },
                {
                    status: 422,
                    headers: cartNoStoreHeaders,
                }
            );
        }

        return await proxyCartRequest(request, {
            method: "POST",
            endpoint: config.endpoints.products.purchaseRequests,
            body: {
                fullname,
                phone,
                product_variation_id: productVariationId,
                quantity,
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
