import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/guest/session";

const noStoreHeaders = {
    "Cache-Control": "no-store",
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
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

export async function GET(request: NextRequest) {
    const authToken = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const headerGuestToken = request.headers.get("x-guest-token")?.trim() || null;
    const cookieGuestToken = decodeGuestTokenFromCookie(request.cookies.get(GUEST_TOKEN_COOKIE)?.value);
    const guestToken = headerGuestToken || cookieGuestToken;

    if (!authToken && !guestToken) {
        return NextResponse.json(
            {
                success: false,
                message: "Token Required",
                data: [],
            },
            {
                status: 401,
                headers: noStoreHeaders,
            }
        );
    }

    const contentLanguage = request.headers.get("content-language");
    const url = new URL(request.url);
    const deliveryPriceId = url.searchParams.get("delivery_price_id")?.trim() ?? "";
    const query = deliveryPriceId ? `?delivery_price_id=${encodeURIComponent(deliveryPriceId)}` : "";
    const upstreamUrl = normalizeApiUrl(config.api.url, `/order/checkout${query}`);

    try {
        const upstream = await fetch(upstreamUrl, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                ...(!authToken && guestToken ? { "X-Guest-Token": guestToken } : {}),
                ...(contentLanguage ? { "Content-Language": contentLanguage } : {}),
            },
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

export async function POST(request: NextRequest) {
    const authToken = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const headerGuestToken = request.headers.get("x-guest-token")?.trim() || null;
    const cookieGuestToken = decodeGuestTokenFromCookie(request.cookies.get(GUEST_TOKEN_COOKIE)?.value);
    const guestToken = headerGuestToken || cookieGuestToken;

    if (!authToken && !guestToken) {
        return NextResponse.json(
            {
                success: false,
                message: "Token Required",
                data: [],
            },
            {
                status: 401,
                headers: noStoreHeaders,
            }
        );
    }

    const contentLanguage = request.headers.get("content-language");
    const upstreamUrl = normalizeApiUrl(config.api.url, "/order/checkout");

    let body: unknown = null;
    try {
        body = await request.json();
    } catch {
        body = null;
    }

    try {
        const upstream = await fetch(upstreamUrl, {
            method: "POST",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                ...(!authToken && guestToken ? { "X-Guest-Token": guestToken } : {}),
                ...(contentLanguage ? { "Content-Language": contentLanguage } : {}),
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
