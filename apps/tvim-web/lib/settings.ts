import type { Metadata } from "next";
import type { ProjectSettingsData } from "@repo/types/types";
import { config } from "@/config";

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
    twitter_card?: string;
    twitter_site?: string;
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
};

const isRecord = (value: unknown): value is AnyRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

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

const normalizeKeywords = (keywords: unknown) => {
    if (Array.isArray(keywords)) {
        return keywords.map((keyword) => String(keyword).trim()).filter(Boolean);
    }

    if (typeof keywords === "string") {
        return keywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean);
    }

    return undefined;
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
        twitter_card: String(og.twitter_card ?? seo.twitter_card ?? ""),
        twitter_site: String(og.twitter_site ?? seo.twitter_site ?? ""),
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

export const buildHomeMetadata = (
    seo: ProjectSettingsSeoData | undefined,
    locale: string,
    options: HomeMetadataOptions = {},
): Metadata => {
    const title = seo?.meta_title || seo?.title || config.project.projectName;
    const description = seo?.meta_description || seo?.description || config.project.projectDescription;
    const keywords = normalizeKeywords(seo?.meta_keywords ?? seo?.keywords);
    const siteUrl = getUrlOrigin(seo?.canonical || config.project.url);
    const canonical = resolveUrl(siteUrl, options.canonicalPath ?? locale);
    const locales = options.locales?.length ? options.locales : ["az", "en", "ru"];
    const defaultLocale = options.defaultLocale ?? config.project.defLang;
    const automaticLanguages = buildLanguageAlternates(siteUrl, locales, defaultLocale, options.alternatePathByLocale);
    const apiLanguages = seo?.alternates?.reduce<Record<string, string>>((acc, alternate) => {
        const hrefLang = alternate.hreflang;
        const href = alternate.href ?? alternate.url;
        if (hrefLang && href) acc[hrefLang] = href;
        return acc;
    }, {});

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical,
            languages: {
                ...automaticLanguages,
                ...apiLanguages,
            },
        },
        openGraph: seo?.open_graph
            ? {
                title: seo.open_graph.title || title,
                description: seo.open_graph.description || description,
                url: seo.open_graph.url || canonical,
                siteName: seo.open_graph.site_name,
                images: seo.open_graph.image
                    ? [
                        {
                            url: seo.open_graph.image,
                            width: seo.open_graph.image_width,
                            height: seo.open_graph.image_height,
                            alt: seo.open_graph.image_alt,
                        },
                    ]
                    : undefined,
                type: resolveOpenGraphType(seo.open_graph.type),
                locale: seo.open_graph.locale,
            }
            : undefined,
        twitter: {
            card: resolveTwitterCard(seo?.twitter_card ?? seo?.open_graph?.twitter_card) ?? "summary_large_image",
            site: seo?.twitter_site || seo?.open_graph?.twitter_site || undefined,
            title,
            description,
            images: seo?.open_graph?.image ? [seo.open_graph.image] : undefined,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
};
