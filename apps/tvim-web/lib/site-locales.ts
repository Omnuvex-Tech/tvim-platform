import { config } from "@/config";

export const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

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
