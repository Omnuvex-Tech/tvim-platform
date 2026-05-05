import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { favoritesNoStoreHeaders, proxyFavoritesRequest } from "./helpers";

export async function GET(request: NextRequest) {
    try {
        const page = request.nextUrl.searchParams.get("page");
        const perPage = request.nextUrl.searchParams.get("per_page");

        return await proxyFavoritesRequest(request, {
            method: "GET",
            endpoint: config.endpoints.favorites.list,
            query: {
                page,
                per_page: perPage,
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
