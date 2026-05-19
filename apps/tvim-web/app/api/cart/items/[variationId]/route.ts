import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { cartNoStoreHeaders, parseJsonBody, proxyCartRequest } from "../../helpers";

type UpdateBody = {
    qty?: number | string;
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ variationId: string }> }
) {
    try {
        const { variationId } = await params;
        const body = await parseJsonBody<UpdateBody>(request);
        const qty = Number(body?.qty);

        if (!variationId || !Number.isFinite(qty) || qty < 0) {
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
            method: "PATCH",
            endpoint: config.endpoints.cart.updateItem(variationId),
            body: {
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ variationId: string }> }
) {
    try {
        const { variationId } = await params;

        if (!variationId) {
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
            method: "DELETE",
            endpoint: config.endpoints.cart.updateItem(variationId),
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
