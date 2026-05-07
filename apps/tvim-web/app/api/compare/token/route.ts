import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { compareNoStoreHeaders, proxyCompareRequest } from "../helpers";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const authToken = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);

        if (authToken) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Authenticated user does not need a compare token.",
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
            endpoint: config.endpoints.compare.token,
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
                headers: compareNoStoreHeaders,
            }
        );
    }
}
