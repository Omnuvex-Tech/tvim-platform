import type { MetadataRoute } from "next";
import type { Language } from "@repo/types/types";
import { headers } from "next/headers";
import { config } from "@/config";
import { defaultLocale } from "@/lib/site-locales";
import { resolveSettingsSitemap, resolveSiteUrlWithFallbacks } from "@/lib/settings";

export const dynamic = "force-dynamic";

const validChangeFrequencies = [
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never",
] as const;

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

const getLanguages = async (): Promise<Language[]> => {
    const response = await fetch(`${config.api.url}${config.endpoints.languages.list}`, {
        cache: "no-store",
    });
    const json = await response.json();
    return Array.isArray(json?.data) ? json.data : [];
};

const resolveChangeFrequency = (frequency: string | undefined) =>
    validChangeFrequencies.find((validFrequency) => validFrequency === frequency);

const resolvePriority = (priority: string | undefined) => {
    const parsedPriority = Number(priority);
    if (!Number.isFinite(parsedPriority)) return undefined;
    return Math.min(1, Math.max(0, parsedPriority));
};

type SitemapEntry = MetadataRoute.Sitemap[number];

type ProductListResponse = {
    data?: {
        items?: Array<{
            slug?: string;
            updated_at?: string;
            published_at?: string;
            created_at?: string;
            variation?: {
                slug?: string;
                updated_at?: string;
            };
        }>;
        pagination?: {
            last_page?: number;
        };
    };
};

const STATIC_SERVICE_SLUGS = [
    "bonus-kartlari",
    "pulsuz-catdirilma",
    "geriqaytarma",
    "korporativ-satis",
] as const;

const toNormalizedLocale = (value: string) => value.trim().toLowerCase();

const normalizePath = (value: string) =>
    decodeURIComponent(String(value ?? ""))
        .trim()
        .replace(/^https?:\/\/[^/]+/i, "")
        .replace(/^\/+|\/+$/g, "");

const toIsoDate = (value: unknown) => {
    const raw = String(value ?? "").trim();
    if (!raw) return undefined;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

const buildEntry = (
    siteUrl: string,
    path: string,
    changeFrequency: SitemapEntry["changeFrequency"],
    priority: SitemapEntry["priority"],
    lastModified?: Date,
): SitemapEntry => {
    const normalizedPath = normalizePath(path);
    const url = normalizedPath ? `${siteUrl}/${encodeURI(normalizedPath)}` : siteUrl;

    return {
        url,
        changeFrequency,
        priority,
        ...(lastModified ? { lastModified } : null),
    };
};

const fetchApiJson = async (
    path: string,
    locale: string,
    searchParams?: Record<string, string>,
) => {
    const url = new URL(`${config.api.url}${path}`);

    Object.entries(searchParams ?? {}).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url.toString(), {
        headers: {
            "Content-Language": locale,
            "Accept-Language": locale,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        return null;
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
};

const readLocalizedLink = (node: Record<string, unknown>, locale: string) => {
    const multiLinks = node.multi_links;
    if (multiLinks && typeof multiLinks === "object" && !Array.isArray(multiLinks)) {
        const localized = (multiLinks as Record<string, unknown>)[locale];
        if (typeof localized === "string" && localized.trim()) {
            return normalizePath(localized);
        }
    }

    if (typeof node.link === "string" && node.link.trim()) {
        return normalizePath(node.link);
    }

    return "";
};

const collectMenuPaths = (
    node: unknown,
    locale: string,
    paths: Map<string, Date | undefined>,
    parentPath = "",
) => {
    if (!node) return;

    if (Array.isArray(node)) {
        node.forEach((item) => collectMenuPaths(item, locale, paths, parentPath));
        return;
    }

    if (typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    const ownPath = readLocalizedLink(record, locale);
    const currentPath = ownPath || parentPath;
    const viewType = String(record.view_type ?? "").trim().toLowerCase();

    if (ownPath) {
        paths.set(`${locale}/${ownPath}`, toIsoDate(record.updated_at ?? record.created_at));
    }

    const data = record.data;
    const itemList =
        data && typeof data === "object" && !Array.isArray(data) && Array.isArray((data as Record<string, unknown>).items)
            ? ((data as Record<string, unknown>).items as Array<Record<string, unknown>>)
            : [];

    itemList.forEach((item) => {
        const multiSlugs = item.multi_slugs;
        const localizedSlug =
            multiSlugs && typeof multiSlugs === "object" && !Array.isArray(multiSlugs)
                ? (multiSlugs as Record<string, unknown>)[locale]
                : undefined;
        const slug = normalizePath(typeof localizedSlug === "string" ? localizedSlug : String(item.slug ?? ""));
        if (!slug) return;

        const itemPath = viewType === "brand-news"
            ? `${locale}/brands/news/${slug}`
            : currentPath
                ? `${locale}/${currentPath}/${slug}`
                : `${locale}/${slug}`;

        paths.set(itemPath, toIsoDate(item.updated_at ?? item.datetime1 ?? item.created_at));
    });

    Object.values(record).forEach((value) => {
        if (value && typeof value === "object") {
            collectMenuPaths(value, locale, paths, currentPath);
        }
    });
};

const collectCategoryPaths = (
    node: unknown,
    locale: string,
    paths: Map<string, Date | undefined>,
) => {
    if (!node) return;

    if (Array.isArray(node)) {
        node.forEach((item) => collectCategoryPaths(item, locale, paths));
        return;
    }

    if (typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    const link = readLocalizedLink(record, locale);
    if (link) {
        paths.set(`${locale}/${link}`, toIsoDate(record.updated_at ?? record.created_at));
    }

    const children = Array.isArray(record.children) ? record.children : [];
    children.forEach((child) => collectCategoryPaths(child, locale, paths));
}

const collectBrandPaths = async (locale: string, paths: Map<string, Date | undefined>) => {
    const payload = await fetchApiJson("/product/brands", locale);
    const values = Array.isArray(payload?.data?.values)
        ? payload.data.values
        : Array.isArray(payload?.values)
            ? payload.values
            : [];

    values.forEach((item: Record<string, unknown>) => {
        const slug = normalizePath(String(item.slug ?? ""));
        if (!slug) return;
        paths.set(`${locale}/brands/${slug}`, toIsoDate(item.updated_at ?? item.created_at));
    });
};

const collectProductPaths = async (locale: string, paths: Map<string, Date | undefined>) => {
    const firstPage = (await fetchApiJson(config.endpoints.products.paginatedList, locale, {
        page: "1",
        per_page: "100",
    })) as ProductListResponse | null;

    const lastPage = Math.max(1, Number(firstPage?.data?.pagination?.last_page ?? 1));
    const pages = [firstPage];

    if (lastPage > 1) {
        const remainingPages = await Promise.all(
            Array.from({ length: lastPage - 1 }, (_, index) =>
                fetchApiJson(config.endpoints.products.paginatedList, locale, {
                    page: String(index + 2),
                    per_page: "100",
                }) as Promise<ProductListResponse | null>
            )
        );

        pages.push(...remainingPages);
    }

    pages.forEach((payload) => {
        const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
        items.forEach((item) => {
            const slug = normalizePath(String(item.variation?.slug ?? item.slug ?? ""));
            if (!slug) return;
            paths.set(
                `${locale}/products/${slug}`,
                toIsoDate(item.variation?.updated_at ?? item.updated_at ?? item.published_at ?? item.created_at)
            );
        });
    });
};

const collectLocalePaths = async (locale: string, siteUrl: string) => {
    const paths = new Map<string, Date | undefined>();
    const [menusPayload, categoriesPayload] = await Promise.all([
        fetchApiJson(config.endpoints.menus.list, locale),
        fetchApiJson("/product/categories", locale),
    ]);

    collectMenuPaths(menusPayload?.data ?? menusPayload, locale, paths);
    collectCategoryPaths(categoriesPayload?.data ?? categoriesPayload, locale, paths);

    STATIC_SERVICE_SLUGS.forEach((slug) => {
        paths.set(`${locale}/services/${slug}`, undefined);
    });

    // The admin menu still points the brand list at the legacy /product/brands
    // path, which now redirects; the sitemap lists the served URL instead.
    paths.delete(`${locale}/product/brands`);
    paths.set(`${locale}/brands`, undefined);

    await Promise.all([
        collectBrandPaths(locale, paths),
        collectProductPaths(locale, paths),
    ]);

    return Array.from(paths.entries()).map(([path, lastModified]) =>
        buildEntry(siteUrl, path, undefined, undefined, lastModified)
    );
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [settings, languages] = await Promise.all([getSettings(), getLanguages()]);
    const sitemapSettings = resolveSettingsSitemap(settings);
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
        settingsResponse: settings,
        requestOrigin,
        configUrl: config.project.url,
    });

    if (!siteUrl) return [];

    const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
    const localeCodes = (languages.length > 0 ? languages : [{ code: defaultLocale }])
        .map((language) => toNormalizedLocale(String(language.code)))
        .filter(Boolean)
    const localeEntries = localeCodes.map((locale) =>
        buildEntry(
            normalizedSiteUrl,
            locale,
            resolveChangeFrequency(sitemapSettings?.freq),
            resolvePriority(sitemapSettings?.priority),
        )
    );
    const dynamicEntries = (await Promise.all(
        localeCodes.map((locale) => collectLocalePaths(locale, normalizedSiteUrl))
    )).flat();

    return [
        {
            url: normalizedSiteUrl,
            changeFrequency: resolveChangeFrequency(sitemapSettings?.freq),
            priority: resolvePriority(sitemapSettings?.priority),
        },
        ...localeEntries,
        ...dynamicEntries,
    ];
}
