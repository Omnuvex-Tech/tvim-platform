import type { MetadataRoute } from "next";
import type { Language } from "@repo/types/types";
import { config } from "@/config";
import { resolveSettingsSitemap, resolveSettingsSiteUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

const validChangeFrequencies = [
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never",
] as const;

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

const getLanguages = async (): Promise<Language[]> => {
    const response = await fetch(`${config.api.url}${config.endpoints.languages.list}`, {
        cache: "no-store",
    });
    const json = await response.json();
    return Array.isArray(json?.data) ? json.data : [];
};

const resolveChangeFrequency = (frequency: string | undefined) =>
    validChangeFrequencies.find((validFrequency) => validFrequency === frequency);

const resolvePriority = (priority: string | undefined) => {
    const parsedPriority = Number(priority);
    if (!Number.isFinite(parsedPriority)) return undefined;
    return Math.min(1, Math.max(0, parsedPriority));
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [settings, languages] = await Promise.all([getSettings(), getLanguages()]);
    const sitemapSettings = resolveSettingsSitemap(settings);
    const siteUrl = resolveSettingsSiteUrl(settings);

    if (!siteUrl) return [];

    const localeEntries = (languages.length > 0 ? languages : [{ code: config.project.defLang }])
        .map((language) => String(language.code).trim().toLowerCase())
        .filter(Boolean)
        .map((locale) => ({
            url: `${siteUrl}/${locale}`,
            changeFrequency: resolveChangeFrequency(sitemapSettings?.freq),
            priority: resolvePriority(sitemapSettings?.priority),
        }));

    return [
        {
            url: siteUrl,
            changeFrequency: resolveChangeFrequency(sitemapSettings?.freq),
            priority: resolvePriority(sitemapSettings?.priority),
        },
        ...localeEntries,
    ];
}
