import type { Metadata } from "next";
import { getMainPageBlocks } from "@/lib/main-page";
import {
    buildHomeMetadata,
    resolveSettingsSeo,
    resolveSiteUrlWithFallbacks,
} from "@/lib/settings";
import { config } from "@/config";
import { MainPageBlocks } from "./components/MainPageBlocks/main-page-blocks";
import { SitePageShell } from "./components/SiteChrome/site-page-shell";
import { getPublicLanguages, getPublicProjectSettingsResponse } from "@/lib/public-data";
import { getSiteChromeData } from "@/lib/site-chrome";

export const revalidate = 31_536_000;

export async function generateMetadata(): Promise<Metadata> {
    const languages = await getPublicLanguages();
    const siteDefaultLocale =
        languages.find((language) => language.is_default_site)?.code ?? config.project.defLang;
    const settingsResponse = await getPublicProjectSettingsResponse(siteDefaultLocale.toLowerCase());

    const siteUrl = resolveSiteUrlWithFallbacks({
        settingsResponse,
        configUrl: config.project.url,
    });

    return buildHomeMetadata(
        settingsResponse ? resolveSettingsSeo(settingsResponse) : undefined,
        siteDefaultLocale.toLowerCase(),
        {
            canonicalPath: "",
            locales: languages.map((language) => language.code),
            defaultLocale: siteDefaultLocale,
            siteUrl,
        }
    );
}

export default async function Home() {
    const languages = await getPublicLanguages();

    if (languages.length === 0) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">Languages could not be loaded.</p>
            </div>
        );
    }

    const siteDefaultLocale =
        languages.find((language) => language.is_default_site)?.code ??
        config.project.defLang;

    const [mainPageBlocks, chrome] = await Promise.all([
        getMainPageBlocks(siteDefaultLocale),
        getSiteChromeData(siteDefaultLocale),
    ]);

    return (
        <SitePageShell chrome={chrome} contentClassName="gap-6">
            <MainPageBlocks blocks={mainPageBlocks} locale={siteDefaultLocale.toLowerCase()} />
        </SitePageShell>
    );
}
