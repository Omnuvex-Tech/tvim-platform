import { ROUTE_LOCALES } from "@repo/shared/routes";
import { config } from "@/config";

/**
 * The one list of languages the site serves. Routing (middleware, localized
 * route wordings) and rendering used to keep separate copies, which meant a
 * language could be routable but not renderable, or prerendered from the api's
 * language list and then rejected by a hardcoded array.
 */
export const SUPPORTED_LOCALES = ROUTE_LOCALES;

export type SiteLocale = (typeof SUPPORTED_LOCALES)[number];

export const isSupportedLocale = (value: string): value is SiteLocale =>
    SUPPORTED_LOCALES.includes(value.trim().toLowerCase() as SiteLocale);

export const normalizeLocale = (value: string, fallback: SiteLocale = "az"): SiteLocale => {
    const normalizedValue = value.trim().toLowerCase();
    if (isSupportedLocale(normalizedValue)) {
        return normalizedValue;
    }

    const normalizedFallback = fallback.trim().toLowerCase();
    return isSupportedLocale(normalizedFallback) ? normalizedFallback : "az";
};

export const defaultLocale = normalizeLocale(config.project.defLang);
