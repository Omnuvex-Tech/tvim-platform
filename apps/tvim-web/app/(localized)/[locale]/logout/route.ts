import { NextRequest } from "next/server";
import { config } from "@/config";
import {
    AUTH_SESSION_TOKEN_COOKIE,
    AUTH_SESSION_USER_COOKIE,
    authCookieOptions,
    decodeTokenFromCookie,
} from "@/lib/auth/session";
import { GUEST_TOKEN_COOKIE, guestCookieOptions } from "@/lib/guest/session";
import { pathWithParams, redirectToPath } from "@/lib/http-redirect";

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
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

// POST, not GET: this destroys the session, and a GET route handler is executed
// by anything that merely requests the url — the router prefetching a <Link> to
// it, a browser preloading, a crawler. Only a form submit reaches it now.
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const normalizedLocale = (["az", "ru", "en"].includes(locale.toLowerCase()) ? locale.toLowerCase() : "az") as
        | "az"
        | "ru"
        | "en";

    const token = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    let logoutMessage = "Hesabdan uğurla çıxdınız";

    if (token) {
        logoutMessage = await performRemoteLogout(token);
    }

    // 303 so the browser follows with GET instead of re-posting.
    const response = redirectToPath(
        pathWithParams(`/${normalizedLocale}`, { logout_message: logoutMessage }),
        303
    );

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
