import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMainPageBlocks } from "@/lib/main-page";
import {
    buildHomeMetadata,
    resolveSettingsSeo,
    resolveSiteUrlWithFallbacks,
} from "@/lib/settings";
import { config } from "@/config";
import { MainPageBlocks } from "@/app/components/MainPageBlocks/main-page-blocks";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getPublicLanguages, getPublicProjectSettingsResponse } from "@/lib/public-data";
import { getSiteChromeData } from "@/lib/site-chrome";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();
    const settingsResponse = await getPublicProjectSettingsResponse(normalizedLocale);

    const siteUrl = resolveSiteUrlWithFallbacks({
        settingsResponse,
        configUrl: config.project.url,
    });

    return buildHomeMetadata(
        settingsResponse ? resolveSettingsSeo(settingsResponse) : undefined,
        normalizedLocale,
        {
            canonicalPath: normalizedLocale,
            siteUrl,
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

    const [mainPageBlocks, chrome] = await Promise.all([
        getMainPageBlocks(normalizedLocale),
        getSiteChromeData(normalizedLocale),
    ]);

    return (
        <SitePageShell chrome={chrome} contentClassName="gap-6" includeLogoutToast>
            <MainPageBlocks blocks={mainPageBlocks} locale={normalizedLocale} />
        </SitePageShell>
    );
}
