import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { localizedHref } from "@/lib/routes";
import { normalizeLocale } from "@/lib/site-locales";
import { redirectToPath } from "@/lib/http-redirect";

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

const isAllowedGateway = (gateway: string) => {
    const normalized = gateway.trim().toLowerCase();
    return normalized === "kapitalbank" || normalized === "payriff";
};

const resolveCartPath = (request: NextRequest) => {
    const cookieLocale = request.cookies.get("preferred-locale")?.value ?? "";
    const locale = normalizeLocale(cookieLocale || config.project.defLang);
    return localizedHref("checkout", locale);
};

const isBrowserNavigation = (request: NextRequest) =>
    (request.headers.get("accept") || "").toLowerCase().includes("text/html");

const buildUpstreamHeaders = (request: NextRequest) => {
    const headers = new Headers();

    request.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === "host") return;
        if (lowerKey === "connection") return;
        if (lowerKey === "content-length") return;
        if (lowerKey === "cookie") return;
        headers.set(key, value);
    });

    if (!headers.has("accept")) headers.set("Accept", "application/json");
    return headers;
};

export async function POST(request: NextRequest, context: { params: Promise<{ gateway: string }> }) {
    const { gateway: gatewayParam } = await context.params;
    const gateway = gatewayParam?.trim() ?? "";

    if (!gateway || !isAllowedGateway(gateway)) {
        return NextResponse.json(
            {
                success: false,
                message: "Invalid gateway",
                data: [],
            },
            {
                status: 400,
                headers: noStoreHeaders,
            }
        );
    }

    const upstreamUrl = normalizeApiUrl(config.api.url, `/payments/callback/${encodeURIComponent(gateway)}`);

    let rawBody: string | null = null;
    try {
        rawBody = await request.text();
    } catch {
        rawBody = null;
    }

    try {
        const upstream = await fetch(upstreamUrl, {
            method: "POST",
            cache: "no-store",
            headers: buildUpstreamHeaders(request),
            body: rawBody && rawBody.length > 0 ? rawBody : undefined,
        });

        const payload = await parseApiPayload(upstream);

        if (isBrowserNavigation(request)) {
            return redirectToPath(resolveCartPath(request), 303);
        }

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
        if (isBrowserNavigation(request)) {
            return redirectToPath(resolveCartPath(request), 303);
        }

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

// The bank returns the shopper's browser here after payment. Only POST existed,
// so that navigation answered 405 and the page failed to load.
export async function GET(request: NextRequest) {
    return redirectToPath(resolveCartPath(request), 303);
}
