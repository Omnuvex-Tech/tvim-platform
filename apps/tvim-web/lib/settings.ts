import type { Metadata } from "next";
import type { ProjectSettingsData } from "@repo/types/types";
import { htmlToText } from "@repo/shared/utils";
import { config } from "@/config";
import { buildKeywords } from "@/lib/seo-keywords";
import { readApiSchema } from "@/lib/api-schema";
import { extractMapCoordinates, resolveMapEmbedUrl, resolveMapLink } from "@/lib/map";

const metaText = (value: unknown) => htmlToText(value) || undefined;

type AnyRecord = Record<string, unknown>;

type ProjectSettingsSeoData = {
    meta_title?: string;
    title?: string;
    meta_description?: string;
    description?: string;
    meta_keywords?: string[] | string;
    keywords?: string[] | string;
    canonical?: string;
    alternates?: { hreflang?: string; href?: string; url?: string }[];
    x_default?: string;
    twitter_card?: string;
    twitter_site?: string;
    twitter?: {
        card?: string;
        site?: string | null;
        title?: string;
        description?: string;
        image?: string;
        image_alt?: string;
    };
    open_graph?: {
        title?: string;
        description?: string;
        url?: string;
        site_name?: string;
        image?: string;
        image_width?: number;
        image_height?: number;
        image_alt?: string;
        type?: string;
        locale?: string;
        twitter_card?: string;
        twitter_site?: string;
    };
};

type ProjectSettingsSitemapData = {
    auto?: string;
    freq?: string;
    priority?: string;
};

type HomeMetadataOptions = {
    canonicalPath?: string;
    alternatePathByLocale?: Record<string, string>;
    locales?: string[];
    defaultLocale?: string;
    siteUrl?: string;
    useProjectFallbacks?: boolean;
    /** What the page is about, for the keywords it builds; see seoKeywords. */
    keywordSubjects?: Array<string | null | undefined>;
};

const isRecord = (value: unknown): value is AnyRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeAbsoluteHttpUrl = (value: unknown) => {
    const cleaned = String(value ?? "").trim().replace(/^`+|`+$/g, "").trim();
    if (!cleaned) return undefined;

    const normalized = cleaned.replace(/\/+$/, "");

    if (normalized.startsWith("//")) {
        try {
            const url = new URL(`https:${normalized}`);
            return url.toString().replace(/\/+$/, "");
        } catch {
            return undefined;
        }
    }

    if (!/^https?:\/\//i.test(normalized)) return undefined;

    try {
        const url = new URL(normalized);
        return url.toString().replace(/\/+$/, "");
    } catch {
        return undefined;
    }
};

const pickValue = (item: AnyRecord) =>
    item.value ?? item.val ?? item.content ?? item.text ?? item.data ?? item.link ?? item.url ?? "";

const mapArrayToObject = (items: unknown): AnyRecord => {
    if (!Array.isArray(items)) return {};

    return items.reduce<AnyRecord>((acc, item) => {
        if (!isRecord(item)) return acc;

        const key = item.key ?? item.name ?? item.field ?? item.slug ?? item.type ?? item.setting_key;
        if (typeof key === "string" && key.trim()) {
            acc[key.trim()] = pickValue(item);
        }

        return acc;
    }, {});
};

const normalizeObject = (value: unknown): AnyRecord => {
    if (Array.isArray(value)) return mapArrayToObject(value);
    if (isRecord(value)) return value;
    return {};
};

const resolveRawKeywords = (keywords: unknown): string[] | string | undefined => {
    if (Array.isArray(keywords)) return keywords.map((keyword) => String(keyword));
    if (typeof keywords === "string") return keywords;
    return undefined;
};

export const resolveSettingsApiLocale = (locale: string) => {
    const normalizedLocale = locale.trim().toLowerCase();
    const localeMap: Record<string, string> = {
        eng: "en",
        rus: "ru",
    };

    return localeMap[normalizedLocale] ?? normalizedLocale;
};

const resolveOpenGraphType = (type: unknown) => {
    const validTypes = [
        "article",
        "website",
        "book",
        "profile",
        "music.song",
        "music.album",
        "music.playlist",
        "music.radio_station",
        "video.movie",
        "video.episode",
        "video.tv_show",
        "video.other",
    ] as const;

    return validTypes.find((validType) => validType === type);
};

const resolveTwitterCard = (card: unknown) => {
    const validCards = ["summary", "summary_large_image", "app", "player"] as const;
    return validCards.find((validCard) => validCard === card);
};

const normalizeSiteUrl = (url: string | undefined) => String(url || "").replace(/\/+$/, "");

/** og:locale for each language the site serves. */
const OPEN_GRAPH_LOCALE: Record<string, string> = {
    az: "az_AZ",
    en: "en_US",
    ru: "ru_RU",
};

const getUrlOrigin = (url: string | undefined) => {
    const normalizedUrl = normalizeSiteUrl(url);
    if (!normalizedUrl) return "";

    try {
        const parsedUrl = new URL(normalizedUrl);
        return parsedUrl.origin;
    } catch {
        return normalizedUrl;
    }
};

const resolveUrl = (siteUrl: string, path: string) => {
    const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
    if (!normalizedSiteUrl) return undefined;

    const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "/";
    return `${normalizedSiteUrl}${normalizedPath === "/" ? "" : normalizedPath}`;
};

const buildLanguageAlternates = (
    siteUrl: string,
    locales: string[],
    defaultLocale: string,
    alternatePathByLocale: Record<string, string> = {},
) => {
    const languages = locales.reduce<Record<string, string>>((acc, locale) => {
        const normalizedLocale = locale.trim().toLowerCase();
        const href = resolveUrl(siteUrl, alternatePathByLocale[normalizedLocale] ?? normalizedLocale);
        if (normalizedLocale && href) acc[normalizedLocale] = href;
        return acc;
    }, {});

    const normalizedDefaultLocale = defaultLocale.trim().toLowerCase();
    const defaultHref = resolveUrl(siteUrl, alternatePathByLocale[normalizedDefaultLocale] ?? normalizedDefaultLocale);
    if (defaultHref) languages["x-default"] = defaultHref;

    return languages;
};

const normalizeAlternateHref = (siteUrl: string, href: unknown) => {
    const raw = String(href ?? "").trim();
    if (!raw) return undefined;

    const absolute = normalizeAbsoluteHttpUrl(raw);
    if (absolute) return absolute;

    if (raw.startsWith("/")) {
        try {
            return new URL(raw, siteUrl).toString();
        } catch {
            return undefined;
        }
    }

    return undefined;
};

const extractPayload = (responseData: unknown) => {
    if (!isRecord(responseData)) return undefined;

    const nestedData = responseData.data;
    if (isRecord(nestedData) && ("general" in nestedData || "social" in nestedData || "seo" in nestedData)) {
        return nestedData;
    }

    const doubleNestedData = isRecord(nestedData) ? nestedData.data : undefined;
    if (isRecord(doubleNestedData) && ("general" in doubleNestedData || "social" in doubleNestedData || "seo" in doubleNestedData)) {
        return doubleNestedData;
    }

    return responseData;
};

const normalizePhones = (general: AnyRecord) => {
    if (Array.isArray(general.phones)) {
        return general.phones.map((phone: AnyRecord | string) => {
            if (isRecord(phone)) {
                return {
                    label: String(phone.label ?? phone.number ?? ""),
                    number: String(phone.number ?? phone.value ?? ""),
                    is_whatsapp: Boolean(phone.is_whatsapp ?? phone.whatsapp),
                };
            }

            return {
                label: String(phone),
                number: String(phone),
                is_whatsapp: false,
            };
        });
    }

    const phones = ["phone", "phone_1", "phone_2", "whatsapp"]
        .map((key) => general[key])
        .filter(Boolean)
        .map((phone) => ({
            label: String(phone),
            number: String(phone),
            is_whatsapp: false,
        }));

    return phones;
};

export const resolveProjectSettings = (responseData: unknown): ProjectSettingsData | undefined => {
    const payload = extractPayload(responseData);
    if (!payload) return undefined;

    const general = normalizeObject(payload.general);
    const social = normalizeObject(payload.social);
    const images = normalizeObject(general.images);

    return {
        general: {
            site_title: String(general.site_title ?? general.title ?? ""),
            site_about: String(general.site_about ?? general.about ?? ""),
            site_header_text: String(general.site_header_text ?? ""),
            address: String(general.address ?? ""),
            map_iframe: String(general.map_iframe ?? ""),
            email: String(general.email ?? ""),
            phones: normalizePhones(general),
            images: {
                logo: String(images.logo ?? general.logo ?? "") || null,
            },
        },
        social: social as ProjectSettingsData["social"],
    };
};

export const resolveSettingsSeo = (responseData: unknown): ProjectSettingsSeoData | undefined => {
    const payload = extractPayload(responseData);
    if (!payload) return undefined;

    const seo = normalizeObject(payload.seo);
    const og = normalizeObject(payload.og);
    const general = normalizeObject(payload.general);
    if (Object.keys(seo).length === 0 && Object.keys(og).length === 0) return undefined;

    return {
        ...(seo as ProjectSettingsSeoData),
        meta_title: String(seo.meta_title ?? seo.title ?? og.title ?? ""),
        meta_description: String(seo.meta_description ?? seo.description ?? og.description ?? ""),
        meta_keywords: resolveRawKeywords(
            seo.meta_keywords ??
            seo.keywords ??
            og.meta_keywords ??
            og.keywords ??
            payload.meta_keywords ??
            payload.keywords ??
            general.meta_keywords ??
            general.keywords,
        ),
        canonical: String(seo.canonical ?? og.canonical ?? ""),
        x_default: String(seo.x_default ?? ""),
        twitter_card: String(og.twitter_card ?? seo.twitter_card ?? ""),
        twitter_site: String(og.twitter_site ?? seo.twitter_site ?? ""),
        twitter: isRecord(seo.twitter)
            ? {
                card: String(seo.twitter.card ?? ""),
                site: typeof seo.twitter.site === "string" ? seo.twitter.site : undefined,
                title: String(seo.twitter.title ?? ""),
                description: String(seo.twitter.description ?? ""),
                image: String(seo.twitter.image ?? ""),
                image_alt: String(seo.twitter.image_alt ?? ""),
            }
            : undefined,
        open_graph: {
            title: String(og.title ?? seo.meta_title ?? seo.title ?? ""),
            description: String(og.description ?? seo.meta_description ?? seo.description ?? ""),
            url: String(og.url ?? og.canonical ?? seo.canonical ?? ""),
            site_name: String(og.site_name ?? ""),
            image: String(og.image ?? ""),
            image_width: typeof og.image_width === "number" ? og.image_width : undefined,
            image_height: typeof og.image_height === "number" ? og.image_height : undefined,
            image_alt: String(og.image_alt ?? og.title ?? ""),
            type: String(og.type ?? ""),
            locale: String(og.locale ?? ""),
            twitter_card: String(og.twitter_card ?? seo.twitter_card ?? ""),
            twitter_site: String(og.twitter_site ?? seo.twitter_site ?? ""),
        },
    };
};

/** What the settings say about the business itself, for its structured data. */
export type BusinessProfile = {
    name: string;
    logo?: string;
    image?: string;
    email?: string;
    phones: string[];
    address?: string;
    postalCode?: string;
    /** Free text per day as the admin writes it, keyed mon…sun. */
    workHours: Record<string, string>;
    /** Active social profiles, deduplicated. */
    sameAs: string[];
    /** The store's pin, from the map the contact page embeds. */
    coordinates?: { latitude: number; longitude: number };
    /** The store's Google Maps listing. */
    mapUrl?: string;
    /** Admin → Settings → SEO → business; when set it wins over parsing `workHours`. */
    openingHours: BusinessOpeningHours[];
};

export type BusinessOpeningHours = {
    /** mon…sun */
    days: string[];
    /** HH:MM */
    opens: string;
    closes: string;
};

const TIME = /^\d{2}:\d{2}$/;

/** `seo.business.opening_hours`, keeping only complete rows. */
const readOpeningHours = (value: unknown): BusinessOpeningHours[] =>
    (Array.isArray(value) ? value : [])
        .filter(isRecord)
        .map((row) => ({
            days: (Array.isArray(row.days) ? row.days : []).map((day) => readText(day).toLowerCase()).filter(Boolean),
            opens: readText(row.opens),
            closes: readText(row.closes),
        }))
        .filter((row) => row.days.length > 0 && TIME.test(row.opens) && TIME.test(row.closes));

const readCoordinate = (value: unknown, limit: number) => {
    const number = typeof value === "number" ? value : Number.NaN;
    return Number.isFinite(number) && Math.abs(number) <= limit ? number : undefined;
};

const readText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * A social link as a profile url. The admin copies links straight from the
 * browser, so they carry tracking leftovers (`?_rdr` on Facebook); two slots
 * also hold the same page, since the "twitter" slot is used for TikTok and was
 * filled with the Facebook link.
 */
const profileUrl = (value: unknown) => {
    const url = normalizeAbsoluteHttpUrl(value);
    if (!url) return undefined;

    try {
        const parsed = new URL(url);
        parsed.search = "";
        parsed.hash = "";
        return parsed.toString();
    } catch {
        return undefined;
    }
};

/**
 * What the business states about itself that the admin has no field for, as
 * the business gave it: the name it trades under, its postcode, and its
 * official profiles. The admin's social links have no YouTube slot, and the
 * slot showing the TikTok icon links to Facebook. Everything the admin does
 * hold (address, phone, hours, map) is still read from it.
 */
const BUSINESS_NAME = "TVIM.az";
const BUSINESS_POSTAL_CODE = "AZ1108";
const BUSINESS_PROFILES = [
    "https://www.linkedin.com/company/tvim/",
    "https://www.instagram.com/tvim.az",
    "https://www.tiktok.com/@tvim.az",
    "https://www.youtube.com/@tvimaz",
    "https://www.facebook.com/p/Tvimaz-100095715123358/",
];

/** One profile however it is spelled: with or without www, http, a trailing slash. */
const profileKey = (url: string) => {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}`.toLowerCase();
};

export const resolveBusinessProfile = (responseData: unknown): BusinessProfile | undefined => {
    const payload = extractPayload(responseData);
    if (!payload) return undefined;

    const general = normalizeObject(payload.general);
    const og = normalizeObject(payload.og);
    const social = normalizeObject(payload.social);
    const images = normalizeObject(general.images);
    const workHours = normalizeObject(general.work_hours);
    // Admin → Settings → SEO → business. Each field that is filled overrides
    // what is otherwise worked out from the general settings below.
    const business = normalizeObject(normalizeObject(payload.seo).business);

    // Admin → Settings → SEO → business wins where filled; the business's own
    // constants above cover what it leaves empty.
    const name = readText(business.name) || BUSINESS_NAME;

    // Admin's business profiles, then the business's own list, then the
    // social links; one entry per profile however it is spelled.
    const adminProfiles = Object.values(social)
        .filter((entry): entry is AnyRecord => isRecord(entry) && String(entry.active ?? "1") !== "0")
        .map((entry) => profileUrl(entry.link ?? entry.url))
        .filter((url): url is string => Boolean(url));
    const businessProfiles = (Array.isArray(business.same_as) ? business.same_as : [])
        .map(profileUrl)
        .filter((url): url is string => Boolean(url));
    const profilesByKey = new Map<string, string>();
    [...businessProfiles, ...BUSINESS_PROFILES, ...adminProfiles].forEach((url) => {
        const key = profileKey(url);
        if (!profilesByKey.has(key)) profilesByKey.set(key, url);
    });
    const sameAs = Array.from(profilesByKey.values());

    // The contact page embeds the admin's map, or TVİM's own listing while
    // the admin field is empty; the structured data names the same place.
    const [latitude, longitude] = extractMapCoordinates(resolveMapEmbedUrl(general.map_iframe))
        .split(",")
        .map(Number);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const adminLatitude = readCoordinate(business.latitude, 90);
    const adminLongitude = readCoordinate(business.longitude, 180);
    const coordinates = adminLatitude !== undefined && adminLongitude !== undefined
        ? { latitude: adminLatitude, longitude: adminLongitude }
        : hasCoordinates
            ? { latitude: latitude as number, longitude: longitude as number }
            : undefined;

    return {
        name,
        logo: normalizeAbsoluteHttpUrl(images.logo) || undefined,
        image: normalizeAbsoluteHttpUrl(og.image) || undefined,
        email: readText(general.email).toLowerCase() || undefined,
        phones: normalizePhones(general).map((phone) => phone.number.trim()).filter(Boolean),
        address: readText(general.address) || undefined,
        workHours: Object.fromEntries(
            Object.entries(workHours)
                .map(([day, text]) => [day.trim().toLowerCase(), readText(text)])
                .filter(([, text]) => text),
        ),
        sameAs,
        coordinates,
        mapUrl: resolveMapLink(general.map_iframe, general.address) || undefined,
        postalCode: readText(business.postal_code) || BUSINESS_POSTAL_CODE,
        openingHours: readOpeningHours(business.opening_hours),
    };
};

/** Admin → Settings → SEO → extra schema, for the settings' language. */
export const resolveSettingsExtraSchema = (responseData: unknown): unknown => {
    const payload = extractPayload(responseData);
    if (!payload) return undefined;

    return normalizeObject(payload.seo).extra_schema ?? undefined;
};

/**
 * The site-wide schema the backend builds from these settings: the business,
 * the site and the store, with the admin's edits laid over them. Null while
 * the backend sends none, and the pages then build it from the profile above.
 */
export const resolveSettingsSchema = (responseData: unknown) => {
    const payload = extractPayload(responseData);
    if (!payload) return null;

    return readApiSchema(normalizeObject(payload.seo).schema);
};

export const resolveSettingsRobotsText = (responseData: unknown): string | undefined => {
    const payload = extractPayload(responseData);
    if (!payload) return undefined;

    const seo = normalizeObject(payload.seo);
    return typeof seo.robots === "string" && seo.robots.trim() ? seo.robots.trim() : undefined;
};

export const resolveSettingsSitemap = (responseData: unknown): ProjectSettingsSitemapData | undefined => {
    const payload = extractPayload(responseData);
    if (!payload) return undefined;

    const seo = normalizeObject(payload.seo);
    const sitemap = normalizeObject(seo.sitemap);
    if (Object.keys(sitemap).length === 0) return undefined;

    return {
        auto: String(sitemap.auto ?? ""),
        freq: String(sitemap.freq ?? ""),
        priority: String(sitemap.priority ?? ""),
    };
};

export const resolveSettingsSiteUrl = (responseData: unknown): string | undefined => {
    const payload = extractPayload(responseData);
    if (!payload) return undefined;

    const general = normalizeObject(payload.general);
    return normalizeAbsoluteHttpUrl(general.frontend_url);
};

export const resolveSiteUrlWithFallbacks = ({
    settingsResponse,
    requestOrigin,
    configUrl,
}: {
    settingsResponse: unknown;
    requestOrigin?: string;
    configUrl?: string;
}): string | undefined => {
    const fromSettings = resolveSettingsSiteUrl(settingsResponse);
    if (fromSettings) return fromSettings;

    const fromRequest = normalizeAbsoluteHttpUrl(requestOrigin);
    if (fromRequest) return fromRequest;

    return normalizeAbsoluteHttpUrl(configUrl);
};

/**
 * The keywords of a page described by an seo block: what the admin wrote, then
 * the site's own terms in the page's language. The home page's head and the
 * chips above its footer both come from here.
 */
export const seoKeywords = (
    seo: ProjectSettingsSeoData | undefined,
    locale: string,
    subjects: Array<string | null | undefined> = [],
) =>
    buildKeywords({
        cms: seo?.meta_keywords ?? seo?.keywords,
        subjects,
        locale,
    });

type CatalogNode = { name?: string | null; title?: string | null; children?: unknown };

const descendantCount = (node: CatalogNode): number =>
    Array.isArray(node?.children)
        ? node.children.reduce((sum: number, child: CatalogNode) => sum + 1 + descendantCount(child), 0)
        : 0;

/**
 * Whether a catalogue name is written in the page's language.
 *
 * Ten of the catalogue's root sections have no translation, and the api hands
 * their Azerbaijani names to /en and /ru as they are — "Drellər və açarlar" at
 * the head of the English home page's keywords. A Russian name carries Cyrillic
 * and an English one carries none of the letters only Azerbaijani uses. This is
 * for translated content only: a brand name is Latin in every language.
 */
const isInPageLanguage = (text: string, locale: string) => {
    if (locale === "ru") return /[а-яё]/i.test(text);
    if (locale === "en") return !/[əğıöşüçƏĞİÖŞÜÇ]/.test(text);
    return true;
};

/** Enough sections to say what the site sells, with room left for its own name. */
const MAX_CATALOG_NAMES = 12;

/**
 * The main sections of the catalogue, by name. On the home page these are what
 * the site is about: nobody searches for a home page, they search for what it
 * sells.
 *
 * The biggest sections come first. The api lists ten new, empty root sections
 * ahead of the established ones, and taking the list in its own order filled
 * the keywords with "PnevmoTool" and "Vintillər" while "Tikinti materialları"
 * and the site's own name were left off.
 */
export const catalogNames = (items: ReadonlyArray<CatalogNode>, locale: string) =>
    [...items]
        .sort((a, b) => descendantCount(b) - descendantCount(a))
        .map((item) => htmlToText(item?.name || item?.title))
        .filter((name) => name && isInPageLanguage(name, locale))
        .slice(0, MAX_CATALOG_NAMES);

export const buildHomeMetadata = (
    seo: ProjectSettingsSeoData | undefined,
    locale: string,
    options: HomeMetadataOptions = {},
): Metadata => {
    const useProjectFallbacks = options.useProjectFallbacks ?? true;
    const title = metaText(seo?.meta_title || seo?.title) ?? (useProjectFallbacks ? config.project.projectName : undefined);
    const description = metaText(seo?.meta_description || seo?.description) ?? (useProjectFallbacks ? config.project.projectDescription : undefined);
    // Every page this builds metadata for carries keywords, its own where it
    // has them and the site's terms where it has none: an indexable page whose
    // tag is missing describes itself to nobody. Callers that know what their
    // page is about pass a list already built from it.
    const keywords = seoKeywords(seo, locale, options.keywordSubjects);
    const canonicalFromSeo = normalizeAbsoluteHttpUrl(seo?.canonical);
    // When the cms states a canonical it also settles which host the page is
    // published under, and the alternates have to agree with it — otherwise
    // x-default is built here while az/en/ru come from the api and the same
    // head advertises two different origins.
    const siteUrl = getUrlOrigin(canonicalFromSeo ?? options.siteUrl);
    const canonical = canonicalFromSeo ?? resolveUrl(siteUrl, options.canonicalPath ?? locale);
    const locales = options.locales?.length ? options.locales : ["az", "en", "ru"];
    const defaultLocale = options.defaultLocale ?? config.project.defLang;
    const automaticLanguages = siteUrl
        ? buildLanguageAlternates(siteUrl, locales, defaultLocale, options.alternatePathByLocale)
        : {};
    const apiLanguages = siteUrl
        ? seo?.alternates?.reduce<Record<string, string>>((acc, alternate) => {
            const hrefLang = String(alternate.hreflang ?? "").trim().toLowerCase();
            const href = normalizeAlternateHref(siteUrl, alternate.href ?? alternate.url);
            if (hrefLang && href) acc[hrefLang] = href;
            return acc;
        }, {}) ?? {}
        : {};

    const normalizedLocale = locale.trim().toLowerCase();
    const languages = {
        ...automaticLanguages,
        ...apiLanguages,
        ...(canonical ? { [normalizedLocale]: canonical } : {}),
    };

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical,
            languages,
        },
        openGraph: seo?.open_graph
            ? {
                title: metaText(seo.open_graph.title) ?? title,
                description: metaText(seo.open_graph.description) ?? description,
                url: seo.open_graph.url || canonical,
                // Neither is set in the admin, and a shared card without a site
                // name shows the bare domain instead.
                siteName: metaText(seo.open_graph.site_name) ?? (config.project.name || "Tvim"),
                images: seo.open_graph.image
                    ? [
                        {
                            url: seo.open_graph.image,
                            width: seo.open_graph.image_width,
                            height: seo.open_graph.image_height,
                            alt: metaText(seo.open_graph.image_alt),
                        },
                    ]
                    : undefined,
                type: resolveOpenGraphType(seo.open_graph.type),
                locale: seo.open_graph.locale || OPEN_GRAPH_LOCALE[normalizedLocale],
            }
            : undefined,
        twitter: {
            card: resolveTwitterCard(seo?.twitter?.card ?? seo?.twitter_card ?? seo?.open_graph?.twitter_card) ?? "summary_large_image",
            site: seo?.twitter?.site || seo?.twitter_site || seo?.open_graph?.twitter_site || undefined,
            title: metaText(seo?.twitter?.title) ?? title,
            description: metaText(seo?.twitter?.description) ?? description,
            images: seo?.twitter?.image ? [seo.twitter.image] : seo?.open_graph?.image ? [seo.open_graph.image] : undefined,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
};

/**
 * The home page's H1: the title the admin gave the home page in this language
 * ("Tvim | Tikinti Materialları və İnşaat Materialları"), read as a heading.
 */
export const homeHeading = (settingsResponse: unknown) => {
    const title = metaText(resolveSettingsSeo(settingsResponse)?.meta_title) ?? config.project.projectName;
    return title.replace(/\s*\|\s*/g, " — ");
};

/**
 * The home page of one language.
 *
 * The admin stores a single canonical for the whole site (`og.canonical`,
 * "https://tvim.az"), and applying it as it stands made /en and /ru declare
 * themselves copies of the Azerbaijani root, so neither could be indexed on
 * its own. Only the host is taken from it: the default language's home is the
 * bare domain — /az serves the same page — and every other language's home is
 * its own prefix. x-default points at the bare domain too.
 */
export const buildLocaleHomeMetadata = (
    seo: ProjectSettingsSeoData | undefined,
    locale: string,
    options: Omit<HomeMetadataOptions, "canonicalPath" | "alternatePathByLocale"> = {},
): Metadata => {
    const normalizedLocale = locale.trim().toLowerCase();
    const defaultLocale = (options.defaultLocale ?? config.project.defLang).trim().toLowerCase();
    const siteUrl = getUrlOrigin(normalizeAbsoluteHttpUrl(seo?.canonical) ?? options.siteUrl);

    return buildHomeMetadata(
        seo
            ? {
                ...seo,
                canonical: undefined,
                // og:url is read from the same site-wide canonical.
                open_graph: seo.open_graph ? { ...seo.open_graph, url: undefined } : undefined,
            }
            : undefined,
        normalizedLocale,
        {
            ...options,
            siteUrl,
            defaultLocale,
            canonicalPath: normalizedLocale === defaultLocale ? "" : normalizedLocale,
            alternatePathByLocale: { [defaultLocale]: "" },
        },
    );
};
