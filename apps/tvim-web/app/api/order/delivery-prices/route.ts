import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";

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

const buildQuery = (request: NextRequest) => {
    const url = new URL(request.url);
    const params = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
        if (!value.trim()) continue;
        params.set(key, value);
    }
    const query = params.toString();
    return query ? `?${query}` : "";
};

export async function GET(request: NextRequest) {
    const token = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);

    if (!token) {
        return NextResponse.json(
            {
                success: false,
                message: "Unauthenticated.",
                data: [],
            },
            {
                status: 401,
                headers: noStoreHeaders,
            }
        );
    }

    const contentLanguage = request.headers.get("content-language");
    const query = buildQuery(request);
    const endpoint = `/order/delivery-prices${query}`;
    const upstreamUrl = normalizeApiUrl(config.api.url, endpoint);

    try {
        const upstream = await fetch(upstreamUrl, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
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

