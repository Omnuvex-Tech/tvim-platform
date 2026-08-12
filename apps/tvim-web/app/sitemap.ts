import type { MetadataRoute } from "next";
import type { Language } from "@repo/types/types";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { config } from "@/config";
import { defaultLocale } from "@/lib/site-locales";
import { resolveSettingsSitemap, resolveSiteUrlWithFallbacks } from "@/lib/settings";
import { SERVICE_SLUGS_BY_LOCALE } from "@/app/services/[slug]/page";

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

// Menu groups that only exist as footer headings carry "#" as their link.
const isPlaceholderLink = (value: string) => !value || value === "#";

const readLocalizedLink = (node: Record<string, unknown>, locale: string) => {
    const multiLinks = node.multi_links;
    if (multiLinks && typeof multiLinks === "object" && !Array.isArray(multiLinks)) {
        const localized = (multiLinks as Record<string, unknown>)[locale];
        if (typeof localized === "string" && localized.trim()) {
            const path = normalizePath(localized);
            if (!isPlaceholderLink(path)) return path;
        }
    }

    if (typeof node.link === "string" && node.link.trim()) {
        const path = normalizePath(node.link);
        if (!isPlaceholderLink(path)) return path;
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

const collectBrandPaths = async (
    locale: string,
    paths: Map<string, Date | undefined>,
    groupKeyByPath: Map<string, string>,
) => {
    const payload = await fetchApiJson("/product/brands", locale);
    const values = Array.isArray(payload?.data?.values)
        ? payload.data.values
        : Array.isArray(payload?.values)
            ? payload.values
            : [];

    values.forEach((item: Record<string, unknown>) => {
        const slug = normalizePath(String(item.slug ?? ""));
        if (!slug) return;

        const path = `${locale}/brands/${slug}`;
        paths.set(path, toIsoDate(item.updated_at ?? item.created_at));

        // A brand's slug differs per language, so its translations cannot be
        // found by comparing url suffixes. `value_id` is the same in every
        // language and is what pairs them up.
        const valueId = Number(item.value_id);
        if (Number.isFinite(valueId) && valueId > 0) {
            groupKeyByPath.set(path, `brand:${valueId}`);
        }
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

const collectLocalePathEntries = async (locale: string) => {
    const paths = new Map<string, Date | undefined>();
    const groupKeyByPath = new Map<string, string>();
    const [menusPayload, categoriesPayload] = await Promise.all([
        fetchApiJson(config.endpoints.menus.list, locale),
        fetchApiJson("/product/categories", locale),
    ]);

    collectMenuPaths(menusPayload?.data ?? menusPayload, locale, paths);
    collectCategoryPaths(categoriesPayload?.data ?? categoriesPayload, locale, paths);

    // These have no cms entry, so — unlike everything else this function
    // collects — their per-locale slug comes from the page's own dictionary
    // rather than an api response.
    SERVICE_SLUGS_BY_LOCALE.forEach((slugsByLocale, index) => {
        const slug = slugsByLocale[locale as keyof typeof slugsByLocale];
        if (!slug) return;
        const path = `${locale}/services/${slug}`;
        paths.set(path, undefined);
        groupKeyByPath.set(path, `service:${index}`);
    });

    // The admin menu still points the brand list at the legacy /product/brands
    // path, which now redirects; the sitemap lists the served URL instead.
    paths.delete(`${locale}/product/brands`);
    paths.set(`${locale}/brands`, undefined);

    await Promise.all([
        collectBrandPaths(locale, paths, groupKeyByPath),
        collectProductPaths(locale, paths),
    ]);

    return Array.from(paths.entries()).map(([path, lastModified]) => ({
        path,
        // Defaults to the url suffix, which is shared across languages for
        // every route whose slug is not localized.
        groupKey: groupKeyByPath.get(path) ?? path.slice(locale.length),
        // Dates do not survive the cache as Date objects.
        lastModified: lastModified ? lastModified.toISOString() : undefined,
    }));
};

/**
 * Walking every menu, category, brand and product page for one language costs
 * several seconds and a few hundred upstream requests. Without this the whole
 * crawl ran again on every single sitemap.xml hit.
 */
const getCachedLocalePathEntries = unstable_cache(
    collectLocalePathEntries,
    ["sitemap-locale-paths"],
    { revalidate: 3600, tags: ["sitemap-locale-paths"] },
);

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
    const pathsByLocale = await Promise.all(
        localeCodes.map(async (locale) => [locale, await getCachedLocalePathEntries(locale)] as const)
    );

    // Translations of one page are collected under a shared group key, so the
    // alternates are built from the urls each language actually serves instead
    // of from a locale prefix swap.
    const pathsByGroup = new Map<string, Map<string, string>>();
    pathsByLocale.forEach(([locale, entries]) => {
        entries.forEach(({ path, groupKey }) => {
            if (!pathsByGroup.has(groupKey)) pathsByGroup.set(groupKey, new Map());
            pathsByGroup.get(groupKey)!.set(locale, path);
        });
    });

    const dynamicEntries = pathsByLocale.flatMap(([, entries]) =>
        entries.map(({ path, groupKey, lastModified }) => {
            const siblings = pathsByGroup.get(groupKey);
            const entry = buildEntry(
                normalizedSiteUrl,
                path,
                undefined,
                undefined,
                lastModified ? new Date(lastModified) : undefined,
            );

            if (!siblings || siblings.size < 2) return entry;

            return {
                ...entry,
                alternates: {
                    languages: Object.fromEntries(
                        Array.from(siblings).map(([siblingLocale, siblingPath]) => [
                            siblingLocale,
                            `${normalizedSiteUrl}/${encodeURI(siblingPath)}`,
                        ])
                    ),
                },
            };
        })
    );

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
