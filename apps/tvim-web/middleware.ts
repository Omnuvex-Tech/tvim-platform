import { NextResponse, type NextRequest } from "next/server";
import {
    LEGACY_SEARCH_QUERY_PARAM,
    SEARCH_QUERY_PARAM,
    asRouteLocale,
    isBlogPath,
    isRouteLocale,
    isSearchRoute,
    resolveBlogRedirect,
    resolveLocalizedRoute,
    resolveTvimPageRedirect,
    type RouteLocale,
} from "@repo/shared/routes";

const renameLegacySearchParam = (url: URL) => {
    const legacy = url.searchParams.get(LEGACY_SEARCH_QUERY_PARAM);
    if (legacy === null || url.searchParams.has(SEARCH_QUERY_PARAM)) return false;

    url.searchParams.delete(LEGACY_SEARCH_QUERY_PARAM);
    url.searchParams.set(SEARCH_QUERY_PARAM, legacy);
    return true;
};

const preferredLocale = (request: NextRequest) =>
    asRouteLocale(request.cookies.get("preferred-locale")?.value ?? "");

export function middleware(request: NextRequest) {
    const [maybeLocale, ...restSegments] = request.nextUrl.pathname.split("/").filter(Boolean);
    if (!maybeLocale || !isRouteLocale(maybeLocale)) {
        // Legacy blog links also exist without a locale prefix; send those to
        // the visitor's locale instead of letting them fall through to a 404.
        const path = `/${[maybeLocale, ...restSegments].filter(Boolean).join("/")}`;
        if (!maybeLocale || !isBlogPath(path)) return NextResponse.next();

        const fallbackLocale = preferredLocale(request);
        const url = request.nextUrl.clone();
        url.pathname = `/${fallbackLocale}${resolveBlogRedirect(path, fallbackLocale) ?? path}`;
        return NextResponse.redirect(url, 308);
    }

    const locale = maybeLocale.toLowerCase() as RouteLocale;
    const rest = restSegments.length > 0 ? `/${restSegments.join("/")}` : "";

    const url = request.nextUrl.clone();
    const renamedSearchParam = isSearchRoute(rest) && renameLegacySearchParam(url);

    if (renamedSearchParam) {
        return NextResponse.redirect(url, 308);
    }

    // Each of these pages has one url per language. A request carrying another
    // locale's wording (/az/vkhod, /az/login) is moved onto this locale's own
    // (/az/giris) rather than served in place, so a page never answers at more
    // than one address per language. Once the url is right, the app directory
    // path behind it is reached by rewrite so the address stays put.
    const localizedRoute = resolveLocalizedRoute(rest, locale);
    if (localizedRoute !== null) {
        if (localizedRoute.publicPath !== rest) {
            url.pathname = `/${locale}${localizedRoute.publicPath}`;
            return NextResponse.redirect(url, 308);
        }

        if (localizedRoute.internalPath !== rest) {
            url.pathname = `/${locale}${localizedRoute.internalPath}`;
            return NextResponse.rewrite(url);
        }
    }

    const blogPath = resolveBlogRedirect(rest, locale);
    if (blogPath !== null) {
        url.pathname = `/${locale}${blogPath}`;
        return NextResponse.redirect(url, 308);
    }

    const tvimPagePath = resolveTvimPageRedirect(rest, locale);
    if (tvimPagePath === null) return NextResponse.next();

    url.pathname = `/${locale}${tvimPagePath}`;
    return NextResponse.redirect(url, 308);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)"],
};
