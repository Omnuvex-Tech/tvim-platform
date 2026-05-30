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

type ProfileUpdateBody = {
    name?: unknown;
    surname?: unknown;
    email?: unknown;
    phone?: unknown;
    password?: unknown;
    password_confirmation?: unknown;
};

export async function PUT(request: NextRequest) {
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

    const body = await parseJsonBody<ProfileUpdateBody>(request);
    const contentLanguage = request.headers.get("content-language");

    const upstreamBody: Record<string, string> = {
        name: typeof body?.name === "string" ? body.name : "",
        surname: typeof body?.surname === "string" ? body.surname : "",
        email: typeof body?.email === "string" ? body.email : "",
        phone: typeof body?.phone === "string" ? body.phone : "",
    };

    const password = typeof body?.password === "string" ? body.password : "";
    const passwordConfirmation = typeof body?.password_confirmation === "string" ? body.password_confirmation : "";

    if (password.trim()) {
        upstreamBody.password = password;
        upstreamBody.password_confirmation = passwordConfirmation;
    }

    const profileUrl = normalizeApiUrl(config.api.url, "/customer/profile");

    try {
        const upstream = await fetch(profileUrl, {
            method: "PUT",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                ...(contentLanguage ? { "Content-Language": contentLanguage } : {}),
            },
            body: JSON.stringify(upstreamBody),
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

