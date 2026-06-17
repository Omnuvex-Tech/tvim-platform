import type { Language, ProjectSettingsResponseData } from "@repo/types/types";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { getMainPageBlocks } from "@/lib/main-page";
import {
    buildHomeMetadata,
    resolveSettingsApiLocale,
    resolveSettingsSeo,
    resolveSiteUrlWithFallbacks,
} from "@/lib/settings";
import { config } from "@/config";
import { MainPageBlocks } from "@/app/components/MainPageBlocks/main-page-blocks";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getSiteChromeData } from "@/lib/site-chrome";

export const dynamic = "force-dynamic";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();
    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        params: { lang: normalizedLocale },
        locale: resolveSettingsApiLocale(normalizedLocale),
        cache: "no-store",
    });

    const requestOrigin = await (async () => {
        try {
            const h = await headers();
            const forwardedProto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
            const forwardedHost = h.get("x-forwarded-host")?.split(",")[0]?.trim();
            const host = forwardedHost || h.get("host")?.trim();
            if (!host) return undefined;
            const proto = forwardedProto || "https";
            return `${proto}://${host}`;
        } catch {
            return undefined;
        }
    })();

    const siteUrl = resolveSiteUrlWithFallbacks({
        settingsResponse: settingsResponse.success ? settingsResponse.data : undefined,
        requestOrigin,
        configUrl: config.project.url,
    });

    return buildHomeMetadata(
        settingsResponse.success ? resolveSettingsSeo(settingsResponse.data) : undefined,
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

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code.toLowerCase() === normalizedLocale)) {
        notFound();
    }

    const [settingsResponse, mainPageBlocks, chrome] = await Promise.all([
        api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            params: { lang: normalizedLocale },
            locale: resolveSettingsApiLocale(normalizedLocale),
            cache: "no-store",
        }),
        getMainPageBlocks(normalizedLocale),
        getSiteChromeData(normalizedLocale),
    ]);

    return (
        <SitePageShell chrome={chrome} contentClassName="gap-6" includeLogoutToast>
            <MainPageBlocks blocks={mainPageBlocks} locale={normalizedLocale} />
        </SitePageShell>
    );
}
