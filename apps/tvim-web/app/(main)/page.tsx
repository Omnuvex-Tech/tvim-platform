import type { Metadata } from "next";
import { getMainPageBlocks } from "@/lib/main-page";
import {
    buildHomeMetadata,
    resolveSettingsSeo,
    resolveSiteUrlWithFallbacks,
    seoKeywords,
    catalogNames,
} from "@/lib/settings";
import { config } from "@/config";
import { resolveRootLocale } from "@/lib/root-locale";
import { MainPageBlocks } from "@/app/components/MainPageBlocks/main-page-blocks";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getPublicProjectSettingsResponse } from "@/lib/public-data";
import { getSiteChromeData } from "@/lib/site-chrome";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
    const { languages, siteDefaultLocale } = await resolveRootLocale();
    const [settingsResponse, chrome] = await Promise.all([
        getPublicProjectSettingsResponse(siteDefaultLocale),
        getSiteChromeData(siteDefaultLocale),
    ]);

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
            keywordSubjects: catalogNames(chrome.initialCatalogItems, siteDefaultLocale),
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

    const [mainPageBlocks, chrome, settingsResponse] = await Promise.all([
        getMainPageBlocks(locale),
        getSiteChromeData(locale),
        getPublicProjectSettingsResponse(locale),
    ]);
    // The head of this address is the site default's, since that is the url it
    // is canonical for. The chips are read by the visitor, so they follow the
    // language the page is actually rendered in.
    const keywords = seoKeywords(
        settingsResponse ? resolveSettingsSeo(settingsResponse) : undefined,
        locale,
        catalogNames(chrome.initialCatalogItems, locale),
    );

    return (
        <SitePageShell chrome={chrome} contentClassName="gap-6" keywords={keywords}>
            <MainPageBlocks blocks={mainPageBlocks} locale={locale} />
        </SitePageShell>
    );
}
