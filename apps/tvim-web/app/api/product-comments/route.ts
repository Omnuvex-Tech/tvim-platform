import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import {
    parseJsonBody,
    productCommentsNoStoreHeaders,
    proxyProductCommentsRequest,
} from "./helpers";

type ProductCommentsPostBody = {
    product_variation_id?: number | string;
    fullname?: string;
    rating?: number;
    comment?: string;
};

export async function GET(request: NextRequest) {
    try {
        const productVariationId = request.nextUrl.searchParams.get("product_variation_id");
        const page = request.nextUrl.searchParams.get("page");
        const perPage = request.nextUrl.searchParams.get("per_page");

        return await proxyProductCommentsRequest(request, {
            method: "GET",
            endpoint: config.endpoints.productComments.list,
            query: {
                product_variation_id: productVariationId,
                page,
                per_page: perPage,
            },
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
                headers: productCommentsNoStoreHeaders,
            }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseJsonBody<ProductCommentsPostBody>(request);

        return await proxyProductCommentsRequest(request, {
            method: "POST",
            endpoint: config.endpoints.productComments.create,
            body: {
                product_variation_id: body?.product_variation_id,
                fullname: body?.fullname,
                rating: body?.rating,
                comment: body?.comment,
            },
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
                headers: productCommentsNoStoreHeaders,
            }
        );
    }
}
