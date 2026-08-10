import { NextResponse, type NextRequest } from "next/server";
import {
    LEGACY_SEARCH_QUERY_PARAM,
    SEARCH_QUERY_PARAM,
    isRouteLocale,
    isSearchRoute,
    toInternalPath,
    toPublicPath,
    type RouteLocale,
} from "@repo/shared/routes";

const renameLegacySearchParam = (url: URL) => {
    const legacy = url.searchParams.get(LEGACY_SEARCH_QUERY_PARAM);
    if (legacy === null || url.searchParams.has(SEARCH_QUERY_PARAM)) return false;

    url.searchParams.delete(LEGACY_SEARCH_QUERY_PARAM);
    url.searchParams.set(SEARCH_QUERY_PARAM, legacy);
    return true;
};

export function middleware(request: NextRequest) {
    const [maybeLocale, ...restSegments] = request.nextUrl.pathname.split("/").filter(Boolean);
    if (!maybeLocale || !isRouteLocale(maybeLocale)) return NextResponse.next();

    const locale = maybeLocale.toLowerCase() as RouteLocale;
    const rest = restSegments.length > 0 ? `/${restSegments.join("/")}` : "";

    const url = request.nextUrl.clone();
    const renamedSearchParam = isSearchRoute(rest, locale) && renameLegacySearchParam(url);

    const publicPath = toPublicPath(rest, locale);
    if (publicPath !== null) {
        url.pathname = `/${locale}${publicPath}`;
        return NextResponse.redirect(url, 308);
    }

    if (renamedSearchParam) {
        return NextResponse.redirect(url, 308);
    }

    const internalPath = toInternalPath(rest, locale);
    if (internalPath === null) return NextResponse.next();

    url.pathname = `/${locale}${internalPath}`;
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)"],
};
