import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { cartNoStoreHeaders, proxyCartRequest } from "./helpers";

export async function GET(request: NextRequest) {
    try {
        return await proxyCartRequest(request, {
            method: "GET",
            endpoint: config.endpoints.cart.active,
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
