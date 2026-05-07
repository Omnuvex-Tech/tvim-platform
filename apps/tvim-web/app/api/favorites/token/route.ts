import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { favoritesNoStoreHeaders, proxyFavoritesRequest } from "../helpers";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const authToken = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);

        if (authToken) {
            return NextResponse.json(
                {
                    success: true,
                    message: "Authenticated user does not need a favorite token.",
                    data: {
                        token: null,
                    },
                },
                {
                    status: 200,
                    headers: favoritesNoStoreHeaders,
                }
            );
        }

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
