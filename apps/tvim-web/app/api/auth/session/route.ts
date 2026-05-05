import { NextRequest, NextResponse } from "next/server";
import {
    AUTH_SESSION_TOKEN_COOKIE,
    AUTH_SESSION_USER_COOKIE,
    type AuthSessionUser,
    authCookieOptions,
    decodeTokenFromCookie,
    decodeUserFromCookie,
    encodeTokenForCookie,
    encodeUserForCookie,
    normalizeSessionUser,
} from "@/lib/auth/session";
import { config } from "@/config";

type SessionCreateBody = {
    token?: string;
    user?: unknown;
};

const noStoreHeaders = {
    "Cache-Control": "no-store",
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

type FetchAuthUserResult =
    | { status: "ok"; user: AuthSessionUser | null }
    | { status: "unauthorized" }
    | { status: "error" };

const fetchAuthUserByToken = async (token: string): Promise<FetchAuthUserResult> => {
    const endpoint = config.endpoints.auth.user ?? config.endpoints.auth.me;
    const url = normalizeApiUrl(config.api.url, endpoint);

    let response: Response;
    try {
        response = await fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
    } catch {
        return { status: "error" };
    }

    if (response.status === 401 || response.status === 403) {
        return { status: "unauthorized" };
    }

    if (!response.ok) {
        return { status: "error" };
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!payload || typeof payload !== "object") {
        return { status: "ok", user: null };
    }

    const source = payload as {
        data?: unknown;
        user?: unknown;
    };

    const user = normalizeSessionUser(source.data ?? source.user ?? payload);
    return { status: "ok", user };
};

export async function GET(request: NextRequest) {
    const token = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const cookieUser = decodeUserFromCookie(request.cookies.get(AUTH_SESSION_USER_COOKIE)?.value);

    if (!token) {
        return NextResponse.json(
            {
                success: true,
                data: {
                    isAuthenticated: false,
                    user: null,
                },
            },
            {
                headers: noStoreHeaders,
            }
        );
    }

    const authUserResult = await fetchAuthUserByToken(token);

    if (authUserResult.status === "unauthorized") {
        const response = NextResponse.json(
            {
                success: true,
                data: {
                    isAuthenticated: false,
                    user: null,
                },
            },
            {
                headers: noStoreHeaders,
            }
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

        return response;
    }

    if (authUserResult.status === "ok" && authUserResult.user) {
        const response = NextResponse.json(
            {
                success: true,
                data: {
                    isAuthenticated: true,
                    user: authUserResult.user,
                },
            },
            {
                headers: noStoreHeaders,
            }
        );

        const encodedUser = encodeUserForCookie(authUserResult.user);
        if (encodedUser) {
            response.cookies.set({
                name: AUTH_SESSION_USER_COOKIE,
                value: encodedUser,
                ...authCookieOptions(),
            });
        }

        return response;
    }

    return NextResponse.json(
        {
            success: true,
            data: {
                isAuthenticated: true,
                user: cookieUser,
            },
        },
        {
            headers: noStoreHeaders,
        }
    );
}

export async function POST(request: NextRequest) {
    let body: SessionCreateBody | null = null;

    try {
        body = (await request.json()) as SessionCreateBody;
    } catch {
        body = null;
    }

    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const user = normalizeSessionUser(body?.user);

    if (!token) {
        return NextResponse.json(
            {
                success: false,
                message: "Token tapılmadı.",
            },
            {
                status: 400,
                headers: noStoreHeaders,
            }
        );
    }

    const response = NextResponse.json(
        {
            success: true,
            message: "Sessiya yaradıldı.",
            data: { user },
        },
        {
            headers: noStoreHeaders,
        }
    );

    response.cookies.set({
        name: AUTH_SESSION_TOKEN_COOKIE,
        value: encodeTokenForCookie(token),
        ...authCookieOptions(),
    });

    const encodedUser = encodeUserForCookie(user);

    if (encodedUser) {
        response.cookies.set({
            name: AUTH_SESSION_USER_COOKIE,
            value: encodedUser,
            ...authCookieOptions(),
        });
    } else {
        response.cookies.delete(AUTH_SESSION_USER_COOKIE);
    }

    return response;
}

export async function DELETE() {
    const response = NextResponse.json(
        {
            success: true,
            message: "Sessiya bağlandı.",
        },
        {
            headers: noStoreHeaders,
        }
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

    return response;
}
