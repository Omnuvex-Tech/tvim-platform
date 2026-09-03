import { NextResponse } from "next/server";

/**
 * Next 16 builds `request.url` in route handlers from the server's own address
 * (http://localhost:3000), not from the Host header, so `new URL(path,
 * request.url)` sent logged-out shoppers — and shoppers coming back from the
 * bank — to localhost. A relative Location keeps the browser on whatever host
 * it arrived on (tvim.az / www.tvim.az) without the app guessing at one.
 */
export const redirectToPath = (path: string, status: 303 | 307 | 308 = 303) =>
    new NextResponse(null, {
        status,
        headers: { Location: path },
    });

export const pathWithParams = (path: string, params: Record<string, string>) => {
    const search = new URLSearchParams(params).toString();
    return search ? `${path}?${search}` : path;
};
