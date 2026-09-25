import { NextResponse } from "next/server";
import { config } from "@/config";
import { resolveSettingsRobotsText, resolveSiteUrlWithFallbacks } from "@/lib/settings";

export const dynamic = "force-dynamic";

const getSettings = async () => {
    const url = new URL(`${config.api.url}${config.endpoints.settings.get}`);
    url.searchParams.set("lang", config.project.defLang);

    const response = await fetch(url.toString(), {
        headers: {
            "Content-Language": config.project.defLang,
            "Accept-Language": config.project.defLang,
        },
        cache: "no-store",
    });

    return response.json();
};

const normalizeUserAgents = (robotsText: string | undefined) => {
    if (!robotsText) return [];

    const items = robotsText
        .split(/\r?\n|,/)
        .map((item) => item.trim().replace(/^user-agent\s*:\s*/i, "").trim())
        .filter(Boolean);

    return Array.from(new Set(items));
};

/**
 * Crawlers the site depends on, which the admin list can never shut out.
 *
 * The robots field in the admin holds a 382-name "bad bots" list that was
 * pasted in whole, and `yandex` came with it: the whole site was closed to
 * Yandex, the search engine most of the Russian-speaking audience uses. Search
 * engines and the link-preview fetchers of the messengers the site is shared
 * on are kept open here whatever the list says; the admin still decides for
 * everything else.
 */
const PROTECTED_CRAWLER_PREFIXES = [
    "googlebot",
    "adsbot-google",
    "mediapartners-google",
    "bingbot",
    "msnbot",
    "adidxbot",
    "bingpreview",
    "slurp",
    "yandex",
    "applebot",
    "duckduckbot",
    "facebookexternalhit",
    "facebot",
    "twitterbot",
    "linkedinbot",
    "whatsapp",
    "telegrambot",
];

const isProtectedCrawler = (userAgent: string) => {
    const name = userAgent.toLowerCase();
    // A blanket group would close the site to every crawler at once.
    if (name === "*") return true;
    // Google-Extended and Applebot-Extended only opt the site out of AI
    // training; they do not crawl for search, so they stay the admin's call.
    if (name.endsWith("-extended")) return false;
    return PROTECTED_CRAWLER_PREFIXES.some((prefix) => name.startsWith(prefix));
};

export async function GET(request: Request) {
    const settings = await getSettings();
    const requestOrigin = (() => {
        try {
            return new URL(request.url).origin;
        } catch {
            return undefined;
        }
    })();
    const siteUrl = resolveSiteUrlWithFallbacks({
        settingsResponse: settings,
        requestOrigin,
        configUrl: config.project.url,
    });
    const userAgents = normalizeUserAgents(resolveSettingsRobotsText(settings))
        .filter((userAgent) => !isProtectedCrawler(userAgent));
    const lines = [
        "User-agent: *",
        "Allow: /",
        // Filtrli URL-lər sonsuz kombinasiya yaradır (filters[19][]=... və s.).
        // Onların SEO dəyəri yoxdur, amma hər biri ağır facet-count sorğusu tetikleyir,
        // ona görə tarama kənarda saxlanılır.
        "Disallow: /*filters",
        // Next.js-in daxili RSC prefetch cavabları — səhifə deyil, tarama edilməməlidir.
        "Disallow: /*_rsc=",
    ];

    if (siteUrl) {
        lines.push(`Sitemap: ${new URL("/sitemap.xml", siteUrl).toString()}`);
    }

    userAgents.forEach((userAgent) => {
        lines.push("", `User-agent: ${userAgent}`, "Disallow: /");
    });

    return new NextResponse(`${lines.join("\n")}\n`, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}
