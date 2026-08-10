export const ROUTE_LOCALES = ["az", "en", "ru"] as const;

export type RouteLocale = (typeof ROUTE_LOCALES)[number];

export type LocalizedRouteKey = "signin" | "signup" | "account" | "orders" | "compare" | "wishlist" | "search";

type RouteRule = {
    key: LocalizedRouteKey;
    internal: string;
    segments: Record<RouteLocale, string>;
};

const ROUTE_RULES: readonly RouteRule[] = [
    { key: "orders", internal: "/account/orders", segments: { az: "sifaris", en: "order", ru: "zakaz" } },
    { key: "account", internal: "/account", segments: { az: "hesab", en: "account", ru: "schet" } },
    { key: "signin", internal: "/signin", segments: { az: "giris", en: "login", ru: "vkhod" } },
    { key: "signup", internal: "/signup", segments: { az: "qeydiyyat", en: "register", ru: "registratsiya" } },
    { key: "compare", internal: "/compare", segments: { az: "muqayise", en: "compare", ru: "sravnit" } },
    { key: "wishlist", internal: "/wishlist", segments: { az: "wishlist", en: "wishlist", ru: "spisok-zhelanii" } },
    { key: "search", internal: "/search", segments: { az: "axtaris", en: "search", ru: "poisk" } },
] as const;

export const SEARCH_QUERY_PARAM = "search";
export const LEGACY_SEARCH_QUERY_PARAM = "q";

export const isRouteLocale = (value: string): value is RouteLocale =>
    (ROUTE_LOCALES as readonly string[]).includes(value.trim().toLowerCase());

const ruleFor = (key: LocalizedRouteKey) => ROUTE_RULES.find((rule) => rule.key === key)!;

const stripPrefix = (path: string, prefix: string) => {
    if (path === prefix) return "";
    return path.startsWith(`${prefix}/`) ? path.slice(prefix.length) : null;
};

export const routePath = (key: LocalizedRouteKey, locale: RouteLocale, suffix = "") =>
    `/${locale}/${ruleFor(key).segments[locale]}${suffix}`;

const FALLBACK_ROUTE_LOCALE: RouteLocale = "az";

export const asRouteLocale = (locale: string): RouteLocale => {
    const normalized = locale.trim().toLowerCase();
    return isRouteLocale(normalized) ? (normalized as RouteLocale) : FALLBACK_ROUTE_LOCALE;
};

export const localizedHref = (key: LocalizedRouteKey, locale: string, suffix = "") =>
    routePath(key, asRouteLocale(locale), suffix);

export const toPublicPath = (rest: string, locale: RouteLocale) => {
    for (const rule of ROUTE_RULES) {
        const suffix = stripPrefix(rest, rule.internal);
        if (suffix === null) continue;

        const publicPath = `/${rule.segments[locale]}${suffix}`;
        return publicPath === rest ? null : publicPath;
    }

    return null;
};

export const toInternalPath = (rest: string, locale: RouteLocale) => {
    for (const rule of ROUTE_RULES) {
        const suffix = stripPrefix(rest, `/${rule.segments[locale]}`);
        if (suffix === null) continue;

        const internalPath = `${rule.internal}${suffix}`;
        return internalPath === rest ? null : internalPath;
    }

    return null;
};

export const localizedPathname = (internalPath: string, locale: string) => {
    const routeLocale = asRouteLocale(locale);
    return `/${routeLocale}${toPublicPath(internalPath, routeLocale) ?? internalPath}`;
};

export const isSearchRoute = (rest: string, locale: RouteLocale) => {
    const rule = ruleFor("search");
    return rest === rule.internal || rest === `/${rule.segments[locale]}`;
};

export const translatePath = (pathname: string, nextLocale: RouteLocale) => {
    const [maybeLocale, ...restSegments] = pathname.split("/").filter(Boolean);
    if (!maybeLocale || !isRouteLocale(maybeLocale)) return null;

    const currentLocale = maybeLocale.toLowerCase() as RouteLocale;
    const rest = restSegments.length > 0 ? `/${restSegments.join("/")}` : "";
    const internal = toInternalPath(rest, currentLocale) ?? rest;

    return `/${nextLocale}${toPublicPath(internal, nextLocale) ?? internal}`;
};
