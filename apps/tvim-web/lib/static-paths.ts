import { getPublicLanguages } from "@/lib/public-data";
import { isSupportedLocale } from "@/lib/site-locales";

export async function getStaticLocaleCodes() {
    const languages = await getPublicLanguages();

    // Routes validate against SUPPORTED_LOCALES, so a language the admin adds
    // but the app does not serve would otherwise be prerendered here and then
    // 404 when requested.
    return languages
        .map((language) => String(language.code).trim().toLowerCase())
        .filter((code) => code && isSupportedLocale(code));
}
