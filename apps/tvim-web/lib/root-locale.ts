import { cookies } from "next/headers";
import { config } from "@/config";
import { getPublicLanguages } from "@/lib/public-data";
import { normalizeLocale, type SiteLocale } from "@/lib/site-locales";

type PublicLanguages = Awaited<ReturnType<typeof getPublicLanguages>>;

/**
 * The language the unprefixed part of the site answers in: whatever the visitor
 * last picked, and otherwise the language marked `is_default_site` in admin
 * (`config.project.defLang` is only a fallback for when no row carries it).
 *
 * Shared by the root page and by the root layout above it so the document's
 * `lang` can never disagree with the language the page is written in.
 */
export const resolveRootLocale = async (): Promise<{
    languages: PublicLanguages;
    locale: SiteLocale;
    siteDefaultLocale: SiteLocale;
}> => {
    const languages = await getPublicLanguages();
    const siteDefaultLocale = normalizeLocale(
        languages.find((language) => language.is_default_site)?.code ?? config.project.defLang
    );

    const cookieStore = await cookies();
    const preferredLocale = normalizeLocale(
        cookieStore.get("preferred-locale")?.value ?? "",
        siteDefaultLocale
    );

    const hasPreferredLocale = languages.some(
        (language) => language.code.trim().toLowerCase() === preferredLocale
    );

    return {
        languages,
        locale: hasPreferredLocale ? preferredLocale : siteDefaultLocale,
        siteDefaultLocale,
    };
};
