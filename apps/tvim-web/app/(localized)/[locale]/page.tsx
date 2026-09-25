import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMainPageBlocks } from "@/lib/main-page";
import {
    buildLocaleHomeMetadata,
    resolveSettingsSeo,
    resolveSiteUrlWithFallbacks,
    seoKeywords,
    catalogNames,
    resolveBusinessProfile,
    resolveSettingsSchema,
    homeHeading,
} from "@/lib/settings";
import { siteJsonLdNodes } from "@/lib/structured-data";
import { JsonLd } from "@/app/components/JsonLd/json-ld";
import { config } from "@/config";
import { MainPageBlocks } from "@/app/components/MainPageBlocks/main-page-blocks";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getPublicLanguages, getPublicProjectSettingsResponse } from "@/lib/public-data";
import { getStaticLocaleCodes } from "@/lib/static-paths";
import { getSiteChromeData } from "@/lib/site-chrome";

export const revalidate = 300;

export async function generateStaticParams() {
    const localeCodes = await getStaticLocaleCodes();
    return localeCodes.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();
    const [settingsResponse, chrome] = await Promise.all([
        getPublicProjectSettingsResponse(normalizedLocale),
        getSiteChromeData(normalizedLocale),
    ]);

    const siteUrl = resolveSiteUrlWithFallbacks({
        settingsResponse,
        configUrl: config.project.url,
    });

    return buildLocaleHomeMetadata(
        settingsResponse ? resolveSettingsSeo(settingsResponse) : undefined,
        normalizedLocale,
        {
            siteUrl,
            keywordSubjects: catalogNames(chrome.initialCatalogItems, normalizedLocale),
        },
    );
}

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    const languages = await getPublicLanguages();

    if (languages.length === 0) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">Languages could not be loaded.</p>
            </div>
        );
    }

    if (!languages.some((language) => language.code.toLowerCase() === normalizedLocale)) {
        notFound();
    }

    const [mainPageBlocks, chrome, settingsResponse] = await Promise.all([
        getMainPageBlocks(normalizedLocale),
        getSiteChromeData(normalizedLocale),
        getPublicProjectSettingsResponse(normalizedLocale),
    ]);
    const keywords = seoKeywords(
        settingsResponse ? resolveSettingsSeo(settingsResponse) : undefined,
        normalizedLocale,
        catalogNames(chrome.initialCatalogItems, normalizedLocale),
    );

    return (
        <SitePageShell chrome={chrome} contentClassName="gap-6" includeLogoutToast keywords={keywords}>
            {/* The home page had no H1. Its visible layout is a set of
                sliders and strips with no single heading, so the title is
                given to screen readers and crawlers without changing it. */}
            <h1 className="sr-only">{homeHeading(settingsResponse)}</h1>
            <JsonLd
                nodes={resolveSettingsSchema(settingsResponse) ?? siteJsonLdNodes(
                    resolveBusinessProfile(settingsResponse),
                    normalizedLocale,
                    languages.map((language) => language.code.trim().toLowerCase()),
                )}
            />
            <MainPageBlocks blocks={mainPageBlocks} locale={normalizedLocale} />
        </SitePageShell>
    );
}
