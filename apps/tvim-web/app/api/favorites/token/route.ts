import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { favoritesNoStoreHeaders, proxyFavoritesRequest } from "../helpers";

export async function POST(request: NextRequest) {
    try {
        return await proxyFavoritesRequest(request, {
            method: "POST",
            endpoint: config.endpoints.favorites.token,
            body: {},
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
