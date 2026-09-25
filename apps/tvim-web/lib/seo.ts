import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPublicProjectSettingsResponse } from "@/lib/public-data";
import { buildHomeMetadata, resolveSettingsSeo } from "@/lib/settings";

type BuildSeoMetadataOptions = {
    title?: string;
    description?: string;
    keywords?: string[] | string;
    locale: string;
    canonicalPath: string;
    siteUrl?: string;
    alternatePathByLocale?: Record<string, string>;
    locales?: string[];
    defaultLocale?: string;
    robots?: Metadata["robots"];
    image?: string;
    imageAlt?: string;
    /** "article" for blog and corporate posts; everything else is a website page. */
    type?: "website" | "article";
};

/**
 * The image a shared link shows when the page has none of its own: the one
 * set for the whole site in the admin (Settings → OG). It is read from the same
 * cached settings response the page's chrome already loads.
 */
const siteShareImage = async (locale: string) => {
    try {
        const response = await getPublicProjectSettingsResponse(locale);
        return resolveSettingsSeo(response)?.open_graph?.image || undefined;
    } catch {
        return undefined;
    }
};

export const resolveRequestOrigin = async () => {
    try {
        const requestHeaders = await headers();
        const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
        const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
        const host = forwardedHost || requestHeaders.get("host")?.trim();

        if (!host) {
            return undefined;
        }

        return `${forwardedProto || "https"}://${host}`;
    } catch {
        return undefined;
    }
};

/**
 * Open Graph is built for every page, with or without an image of its own. It
 * used to be built only when the page had one, and products (whose image the
 * api keeps in the gallery, not in `main_image_path`) and brands (which passed
 * none) were shared as bare links with no title, text or picture.
 */
export const buildSeoMetadata = async ({
    title,
    description,
    keywords,
    locale,
    canonicalPath,
    siteUrl,
    alternatePathByLocale,
    locales,
    defaultLocale,
    robots,
    image,
    imageAlt,
    type = "website",
}: BuildSeoMetadataOptions): Promise<Metadata> => {
    const shareImage = image || (await siteShareImage(locale));
    const metadata = buildHomeMetadata(
        {
            meta_title: title,
            meta_description: description,
            meta_keywords: keywords,
            open_graph: {
                title,
                description,
                image: shareImage,
                image_alt: shareImage ? imageAlt || title : undefined,
                type,
            },
            twitter: shareImage
                ? {
                    title,
                    description,
                    image: shareImage,
                    image_alt: imageAlt || title,
                }
                : undefined,
        },
        locale,
        {
            canonicalPath,
            alternatePathByLocale,
            siteUrl,
            locales,
            defaultLocale,
        }
    );

    return robots
        ? {
            ...metadata,
            robots,
        }
        : metadata;
};

export const buildNoIndexMetadata = (title?: string, description?: string): Metadata => ({
    ...(title ? { title } : null),
    ...(description ? { description } : null),
    robots: {
        index: false,
        follow: false,
    },
});
