import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import {
    AUTH_SESSION_TOKEN_COOKIE,
    AUTH_SESSION_USER_COOKIE,
    authCookieOptions,
    decodeTokenFromCookie,
} from "@/lib/auth/session";
import { GUEST_TOKEN_COOKIE, guestCookieOptions } from "@/lib/guest/session";

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const resolveLocale = (value?: string) => {
    const normalized = value?.trim().toLowerCase() ?? "";
    if (["az", "ru", "en"].includes(normalized)) {
        return normalized as "az" | "ru" | "en";
    }

    return "az";
};

const performRemoteLogout = async (token: string) => {
    const logoutUrl = normalizeApiUrl(config.api.url, config.endpoints.auth.logout);

    try {
        const response = await fetch(logoutUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
            cache: "no-store",
        });

        let payload: { message?: string } | null = null;
        try {
            payload = (await response.json()) as { message?: string };
        } catch {
            payload = null;
        }

        const message = payload?.message?.trim();
        return message || "Hesabdan uğurla çıxdınız";
    } catch {
        // Local session will still be cleared even if remote logout fails.
        return "Hesabdan uğurla çıxdınız";
    }
};

// POST for the same reason as the localized route: a GET that destroys the
// session is executed by prefetches, preloads and crawlers alike.
export async function POST(request: NextRequest) {
    const token = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    let logoutMessage = "Hesabdan uğurla çıxdınız";

    if (token) {
        logoutMessage = await performRemoteLogout(token);
    }

    const targetLocale = resolveLocale(request.cookies.get("preferred-locale")?.value);
    const redirectUrl = new URL(`/${targetLocale}`, request.url);
    redirectUrl.searchParams.set("logout_message", logoutMessage);
    // 303 so the browser follows with GET instead of re-posting.
    const response = NextResponse.redirect(redirectUrl, 303);

    response.cookies.set({
        name: AUTH_SESSION_TOKEN_COOKIE,
        value: "",
        ...authCookieOptions(),
        maxAge: 0,
    });

    response.cookies.set({
        name: AUTH_SESSION_USER_COOKIE,
        value: "",
        ...authCookieOptions(),
        maxAge: 0,
    });

    response.cookies.set({
        name: GUEST_TOKEN_COOKIE,
        value: "",
        ...guestCookieOptions(),
        maxAge: 0,
    });

    return response;
}
