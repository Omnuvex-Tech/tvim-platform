import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { favoritesNoStoreHeaders, parseJsonBody, proxyFavoritesRequest } from "../helpers";

type ToggleBody = {
    product_variation_id?: number | string;
};

export async function POST(request: NextRequest) {
    try {
        const body = await parseJsonBody<ToggleBody>(request);

        return await proxyFavoritesRequest(request, {
            method: "POST",
            endpoint: config.endpoints.favorites.toggle,
            body: {
                product_variation_id: body?.product_variation_id,
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
                headers: favoritesNoStoreHeaders,
            }
        );
    }
}
