import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import {
    FAVORITES_GUEST_TOKEN_COOKIE,
    decodeGuestTokenFromCookie,
    encodeGuestTokenForCookie,
    favoritesCookieOptions,
} from "@/lib/favorites/session";

const noStoreHeaders = {
    "Cache-Control": "no-store",
};

type FavoritesMethod = "GET" | "POST";

type ProxyFavoritesOptions = {
    method: FavoritesMethod;
    endpoint: string;
    body?: unknown;
    query?: Record<string, string | number | null | undefined>;
};

const resolveApiUrl = (endpoint: string) => {
    const cleanBase = config.api.url.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const extractTokenFromPayload = (payload: unknown) => {
    if (!payload || typeof payload !== "object") return null;

    const token = (payload as { data?: { token?: unknown } }).data?.token;
    if (typeof token !== "string") return null;

    const trimmed = token.trim();
    return trimmed || null;
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

const toHeaders = (
    request: NextRequest,
    authToken: string | null,
    guestToken: string | null,
    method: FavoritesMethod
) => {
    const contentLanguage = request.headers.get("content-language");

    return {
        Accept: "application/json",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        ...(contentLanguage ? { "Content-Language": contentLanguage } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
    };
};

export const parseJsonBody = async <T>(request: NextRequest) => {
    try {
        return (await request.json()) as T;
    } catch {
        return null;
    }
};

export const proxyFavoritesRequest = async (request: NextRequest, options: ProxyFavoritesOptions) => {
    const authToken = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const guestToken = decodeGuestTokenFromCookie(request.cookies.get(FAVORITES_GUEST_TOKEN_COOKIE)?.value);

    const url = new URL(resolveApiUrl(options.endpoint));

    if (options.query) {
        Object.entries(options.query).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "") return;
            url.searchParams.set(key, String(value));
        });
    }

    const upstream = await fetch(url.toString(), {
        method: options.method,
        headers: toHeaders(request, authToken, guestToken, options.method),
        body: options.method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
        cache: "no-store",
    });

    const payload = await parseApiPayload(upstream);

    const response = NextResponse.json(
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

    const nextGuestToken = extractTokenFromPayload(payload);

    if (!authToken && nextGuestToken) {
        response.cookies.set({
            name: FAVORITES_GUEST_TOKEN_COOKIE,
            value: encodeGuestTokenForCookie(nextGuestToken),
            ...favoritesCookieOptions(),
        });
    }

    return response;
};

export const favoritesNoStoreHeaders = noStoreHeaders;
