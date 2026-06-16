import type { Metadata } from "next";
import { headers } from "next/headers";
import { buildHomeMetadata } from "@/lib/settings";

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

export const buildSeoMetadata = ({
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
}: BuildSeoMetadataOptions): Metadata => {
    const metadata = buildHomeMetadata(
        {
            meta_title: title,
            meta_description: description,
            meta_keywords: keywords,
            open_graph: image
                ? {
                    title,
                    description,
                    image,
                    image_alt: imageAlt || title,
                    type: "website",
                }
                : undefined,
            twitter: image
                ? {
                    title,
                    description,
                    image,
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
