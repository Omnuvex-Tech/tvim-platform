import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { FAVORITES_GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/favorites/session";

const noStoreHeaders = {
    "Cache-Control": "no-store",
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const parseJsonBody = async <T>(request: NextRequest) => {
    try {
        return (await request.json()) as T;
    } catch {
        return null;
    }
};

const parseApiPayload = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.toLowerCase().includes("application/json")) {
        try {
            return (await response.json()) as unknown;
        } catch {
            return null;
        }
    }

    try {
        const text = await response.text();
        if (!text.trim()) return null;
        return JSON.parse(text) as unknown;
    } catch {
        return null;
    }
};

export async function POST(request: NextRequest) {
    const guestToken = decodeGuestTokenFromCookie(request.cookies.get(FAVORITES_GUEST_TOKEN_COOKIE)?.value);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const contentLanguage = request.headers.get("content-language");

    const loginUrl = normalizeApiUrl(config.api.url, config.endpoints.auth.login);

    try {
        const upstream = await fetch(loginUrl, {
            method: "POST",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(contentLanguage ? { "Content-Language": contentLanguage } : {}),
                ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
            },
            body: JSON.stringify(body ?? {}),
        });

        const payload = await parseApiPayload(upstream);

        return NextResponse.json(
            payload ?? {
                success: false,
                message: "Server Error",
                data: [],
            },
            {
                status: upstream.status,
                headers: noStoreHeaders,
            }
        );
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "Server Error",
                data: [],
            },
            {
                status: 500,
                headers: noStoreHeaders,
            }
        );
    }
}
