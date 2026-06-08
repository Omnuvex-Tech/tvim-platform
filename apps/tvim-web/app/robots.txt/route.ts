import { NextResponse } from "next/server";
import { config } from "@/config";
import { resolveSettingsRobotsText, resolveSiteUrlWithFallbacks } from "@/lib/settings";

export const dynamic = "force-dynamic";

const getSettings = async () => {
    const url = new URL(`${config.api.url}${config.endpoints.settings.get}`);
    url.searchParams.set("lang", config.project.defLang);

    const response = await fetch(url.toString(), {
        headers: {
            "Content-Language": config.project.defLang,
            "Accept-Language": config.project.defLang,
        },
        cache: "no-store",
    });

    return response.json();
};

const normalizeUserAgents = (robotsText: string | undefined) => {
    if (!robotsText) return [];

    const items = robotsText
        .split(/\r?\n|,/)
        .map((item) => item.trim().replace(/^user-agent\s*:\s*/i, "").trim())
        .filter(Boolean);

    return Array.from(new Set(items));
};

export async function GET(request: Request) {
    const settings = await getSettings();
    const requestOrigin = (() => {
        try {
            return new URL(request.url).origin;
        } catch {
            return undefined;
        }
    })();
    const siteUrl = resolveSiteUrlWithFallbacks({
        settingsResponse: settings,
        requestOrigin,
        configUrl: config.project.url,
    });
    const userAgents = normalizeUserAgents(resolveSettingsRobotsText(settings));
    const lines = ["User-agent: *", "Allow: /"];

    if (siteUrl) {
        lines.push(`Sitemap: ${new URL("/sitemap.xml", siteUrl).toString()}`);
    }

    userAgents.forEach((userAgent) => {
        lines.push("", `User-agent: ${userAgent}`, "Disallow: /");
    });

    return new NextResponse(`${lines.join("\n")}\n`, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}
