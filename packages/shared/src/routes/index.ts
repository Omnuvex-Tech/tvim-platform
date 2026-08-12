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

type TvimPageRule = {
    slugs: Record<RouteLocale, string>;
    tvimSlugs: readonly string[];
};

const TVIM_PAGE_RULES: readonly TvimPageRule[] = [
    {
        slugs: { az: "catdirilma-ve-odenis", en: "delivery-and-payment", ru: "dostavka-i-oplata" },
        tvimSlugs: ["Catdirilma-ve-odeme"],
    },
    {
        slugs: { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },
        tvimSlugs: ["Geri-qaytarma", "refund", "vozvraschat-dengi"],
    },
    {
        slugs: { az: "bonus-kartlari", en: "bonus-cards", ru: "bonusnye-karty" },
        tvimSlugs: ["Bonus-kartları"],
    },
    {
        slugs: { az: "İstifade-sertleri", en: "terms-of-use", ru: "ispolzovanie-zavod" },
        tvimSlugs: ["istifade-sertleri"],
    },
] as const;

// tvim.az serves the blog behind an extra "bloq" segment and repeats the blog
// root inside deeper URLs (/az/bloq/xeberler, /az/bloq/xeberler/mehsullar,
// /az/xeberler/mehsullar/{yazi}). We serve the same pages flat
// (/az/xeberler, /az/mehsullar, /az/mehsullar/{yazi}), so the legacy shape is
// folded back regardless of which locale's wording the incoming link uses.
const BLOG_PREFIX_SLUGS = ["bloq", "blog", "blogi"] as const;

const BLOG_ROOT_SLUGS: Record<RouteLocale, string> = { az: "xeberler", en: "news", ru: "novisti" };

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

const matchRule = (rest: string) => {
    for (const rule of ROUTE_RULES) {
        const internalSuffix = stripPrefix(rest, rule.internal);
        if (internalSuffix !== null) return { rule, suffix: internalSuffix };

        for (const routeLocale of ROUTE_LOCALES) {
            const suffix = stripPrefix(rest, `/${rule.segments[routeLocale]}`);
            if (suffix !== null) return { rule, suffix };
        }
    }

    return null;
};

export const toPublicPath = (rest: string, locale: RouteLocale) => {
    const matched = matchRule(rest);
    if (!matched) return null;

    const publicPath = `/${matched.rule.segments[locale]}${matched.suffix}`;
    return publicPath === rest ? null : publicPath;
};

export const toInternalPath = (rest: string) => {
    const matched = matchRule(rest);
    if (!matched) return null;

    const internalPath = `${matched.rule.internal}${matched.suffix}`;
    return internalPath === rest ? null : internalPath;
};

/**
 * Both paths for a localized route: the url this locale publishes and the one
 * the app directory actually implements. `toPublicPath` and `toInternalPath`
 * collapse "no match" and "already correct" into the same null, which is not
 * enough to tell a redirect apart from a rewrite.
 */
export const resolveLocalizedRoute = (rest: string, locale: RouteLocale) => {
    const matched = matchRule(rest);
    if (!matched) return null;

    return {
        publicPath: `/${matched.rule.segments[locale]}${matched.suffix}`,
        internalPath: `${matched.rule.internal}${matched.suffix}`,
    };
};

export const localizedPathname = (internalPath: string, locale: string) => {
    const routeLocale = asRouteLocale(locale);
    return `/${routeLocale}${toPublicPath(internalPath, routeLocale) ?? internalPath}`;
};

export const isSearchRoute = (rest: string) => matchRule(rest)?.rule.key === "search";

const decodeSlug = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const COMBINING_MARKS = /[\u0300-\u036f]/g;

const foldSlug = (value: string) =>
    value.toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "");

export const resolveTvimPageRedirect = (rest: string, locale: RouteLocale) => {
    const [firstSegment, ...restSegments] = rest.split("/").filter(Boolean);
    if (!firstSegment) return null;

    const decoded = decodeSlug(firstSegment);
    if (!decoded) return null;

    if (TVIM_PAGE_RULES.some((rule) => rule.slugs[locale] === decoded)) return null;

    const folded = foldSlug(decoded);
    const matched = TVIM_PAGE_RULES.find((rule) =>
        [...Object.values(rule.slugs), ...rule.tvimSlugs].some(
            (candidate) => candidate === decoded || foldSlug(candidate) === folded,
        ),
    );
    if (!matched) return null;

    const suffix = restSegments.length > 0 ? `/${restSegments.join("/")}` : "";
    return `/${encodeURIComponent(matched.slugs[locale])}${suffix}`;
};

const matchesSlug = (segment: string, candidates: readonly string[]) => {
    const folded = foldSlug(segment);
    return candidates.some((candidate) => candidate === segment || foldSlug(candidate) === folded);
};

const isBlogPrefixSlug = (segment: string) => matchesSlug(segment, BLOG_PREFIX_SLUGS);

const isBlogRootSlug = (segment: string) => matchesSlug(segment, Object.values(BLOG_ROOT_SLUGS));

export const isBlogPath = (rest: string) => {
    const [firstSegment] = rest.split("/").filter(Boolean);
    if (!firstSegment) return false;

    const decoded = decodeSlug(firstSegment);
    return isBlogPrefixSlug(decoded) || isBlogRootSlug(decoded);
};

export const resolveBlogRedirect = (rest: string, locale: RouteLocale) => {
    const segments = rest.split("/").filter(Boolean).map(decodeSlug);
    if (segments.length === 0) return null;

    let changed = false;

    if (isBlogPrefixSlug(segments[0]!)) {
        segments.shift();
        changed = true;
    }

    // A bare "/bloq" is the blog itself on tvim.az.
    if (segments.length === 0) return `/${encodeURIComponent(BLOG_ROOT_SLUGS[locale])}`;

    // The root is repeated in front of a category ("/bloq/xeberler/mehsullar")
    // and in front of an article ("/xeberler/mehsullar/{yazi}"). Both are one
    // segment shorter here, so the root is dropped whenever something follows
    // it — except for "/xeberler/{slug}", which is one of our own item URLs.
    if (isBlogRootSlug(segments[0]!) && segments.length > (changed ? 1 : 2)) {
        segments.shift();
        changed = true;
    }

    // A root slug from another locale used to be served in place, because the
    // CMS resolves it under the requested language anyway. That gave one page
    // three urls per language, so it is now moved onto this locale's root.
    if (isBlogRootSlug(segments[0]!) && segments[0] !== BLOG_ROOT_SLUGS[locale]) {
        segments[0] = BLOG_ROOT_SLUGS[locale];
        changed = true;
    }

    if (!changed) return null;

    return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
};

export const translatePath = (pathname: string, nextLocale: RouteLocale) => {
    const [maybeLocale, ...restSegments] = pathname.split("/").filter(Boolean);
    if (!maybeLocale || !isRouteLocale(maybeLocale)) return null;

    const rest = restSegments.length > 0 ? `/${restSegments.join("/")}` : "";
    const internal = toInternalPath(rest) ?? rest;

    return `/${nextLocale}${toPublicPath(internal, nextLocale) ?? internal}`;
};
