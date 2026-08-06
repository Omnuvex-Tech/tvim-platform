import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getMainPageBlocks } from "@/lib/main-page";
import {
    buildHomeMetadata,
    resolveSettingsSeo,
    resolveSiteUrlWithFallbacks,
} from "@/lib/settings";
import { config } from "@/config";
import { normalizeLocale } from "@/lib/site-locales";
import { MainPageBlocks } from "./components/MainPageBlocks/main-page-blocks";
import { SitePageShell } from "./components/SiteChrome/site-page-shell";
import { getPublicLanguages, getPublicProjectSettingsResponse } from "@/lib/public-data";
import { getSiteChromeData } from "@/lib/site-chrome";

export const revalidate = 300;

const resolveRootLocale = async () => {
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

export async function generateMetadata(): Promise<Metadata> {
    const { languages, siteDefaultLocale } = await resolveRootLocale();
    const settingsResponse = await getPublicProjectSettingsResponse(siteDefaultLocale);

    const siteUrl = resolveSiteUrlWithFallbacks({
        settingsResponse,
        configUrl: config.project.url,
    });

    return buildHomeMetadata(
        settingsResponse ? resolveSettingsSeo(settingsResponse) : undefined,
        siteDefaultLocale,
        {
            canonicalPath: "",
            locales: languages.map((language) => language.code),
            defaultLocale: siteDefaultLocale,
            siteUrl,
        }
    );
}

export default async function Home() {
    const { languages, locale } = await resolveRootLocale();

    if (languages.length === 0) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">Languages could not be loaded.</p>
            </div>
        );
    }

    const [mainPageBlocks, chrome] = await Promise.all([
        getMainPageBlocks(locale),
        getSiteChromeData(locale),
    ]);

    return (
        <SitePageShell chrome={chrome} contentClassName="gap-6">
            <MainPageBlocks blocks={mainPageBlocks} locale={locale} />
        </SitePageShell>
    );
}
