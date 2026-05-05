import { NextRequest, NextResponse } from "next/server";
import {
    AUTH_SESSION_TOKEN_COOKIE,
    AUTH_SESSION_USER_COOKIE,
    authCookieOptions,
    decodeTokenFromCookie,
    decodeUserFromCookie,
    encodeTokenForCookie,
    encodeUserForCookie,
    normalizeSessionUser,
} from "@/lib/auth/session";

type SessionCreateBody = {
    token?: string;
    user?: unknown;
};

const noStoreHeaders = {
    "Cache-Control": "no-store",
};

export async function GET(request: NextRequest) {
    const token = decodeTokenFromCookie(request.cookies.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const user = decodeUserFromCookie(request.cookies.get(AUTH_SESSION_USER_COOKIE)?.value);

    return NextResponse.json(
        {
            success: true,
            data: {
                isAuthenticated: Boolean(token),
                user,
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
