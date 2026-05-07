import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { compareNoStoreHeaders, proxyCompareRequest } from "./helpers";

export async function GET(request: NextRequest) {
    try {
        const pageParam = request.nextUrl.searchParams.get("page");
        const perPageParam = request.nextUrl.searchParams.get("per_page");

        const isInvalidPositiveInt = (value: string | null) => {
            if (!value || !value.trim()) return false;
            const parsed = Number(value);
            return !Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed);
        };

        if (isInvalidPositiveInt(pageParam) || isInvalidPositiveInt(perPageParam)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    data: [],
                },
                {
                    status: 422,
                    headers: compareNoStoreHeaders,
                }
            );
        }

        return await proxyCompareRequest(request, {
            method: "GET",
            endpoint: config.endpoints.compare.list,
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "Server Error",
                data: [],
            },
            {
                status: 500,
                headers: compareNoStoreHeaders,
            }
        );
    }
}
