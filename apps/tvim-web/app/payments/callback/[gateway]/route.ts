import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";

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

