import { NextResponse } from "next/server";
import { config } from "@/config";
import { resolveSettingsRobotsText } from "@/lib/settings";

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

const getSiteUrl = (settings: unknown) => {
    const responseData = (settings as { data?: unknown }).data;
    const payload = (responseData as { data?: unknown })?.data ?? responseData;
    const general = (payload as { general?: { frontend_url?: string } })?.general;
    const frontendUrl = general?.frontend_url;
    return String(frontendUrl || config.project.url || "").replace(/\/+$/, "");
};

const normalizeUserAgents = (robotsText: string | undefined) => {
    if (!robotsText) return [];

    return robotsText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item, index, items) => items.indexOf(item) === index);
};

export async function GET() {
    const settings = await getSettings();
    const siteUrl = getSiteUrl(settings);
    const userAgents = normalizeUserAgents(resolveSettingsRobotsText(settings));
    const lines = ["User-agent: *", "Allow: /"];

    if (siteUrl) {
        lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
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
