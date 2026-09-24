import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumb, RemoteImage } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { getPublicMenuDetail, getPublicMenuList } from "@/lib/public-data";
import { buildSeoMetadata } from "@/lib/seo";
import { buildKeywords } from "@/lib/seo-keywords";
import { articleDescription, clampDescription, toPlainText, withSiteName } from "@/lib/seo-copy";
import { getSiteChromeData } from "@/lib/site-chrome";
import { normalizeLocale } from "@/lib/site-locales";
import { getTranslations } from "@/lib/i18n";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { LocalizedLinks } from "@/app/components/SiteChrome/localized-links";
import { ProductStrip } from "@/app/components/ProductStrip/product-strip";

type NewsVariation = {
    variation_id?: number;
    name?: string;
    slug?: string;
    price?: string | number | null;
    main_image_url?: string | null;
};

type NewsRelatedProduct = {
    id?: number;
    variation?: NewsVariation;
};

type NewsItem = {
    id?: number;
    slug?: string;
    multi_slugs?: Record<string, string>;
    name?: string;
    content?: string;
    // The api sends an article's seo block in the same shape menu items use
    // elsewhere; only the keywords are read here.
    seo?: { meta_keywords?: unknown } | null;
    meta_keywords?: unknown;
    banner?: string | null;
    main_photo?: string | null;
    files?: Array<{ url?: string; is_main?: boolean }>;
    related_products?: NewsRelatedProduct[];
};

type MenuDetailData = {
    menu?: {
        name?: string;
        title?: string | null;
        description?: string | null;
    };
    data?: {
        item?: NewsItem;
        items?: NewsItem[];
        content?: string;
        banner?: string | null;
        main_photo?: string | null;
        related_products?: NewsRelatedProduct[];
    };
};

// The article lives under whatever link its parent menu carries in the admin,
// so nothing here may assume a fixed path. The menu is recognised by its view
// type, which is a separate column and does not change when the link is renamed.
export const BRAND_NEWS_VIEW_TYPE = "brand-news";

/** The parent menu's link for one locale, falling back to the one in the URL. */
const resolveMenuLinkForLocale = (detail: MenuDetailData | null, localeCode: string, fallback: string) => {
    const multi = (detail?.menu as any)?.multi_links;
    const value = multi && typeof multi === "object" && !Array.isArray(multi)
        ? (multi as Record<string, unknown>)[localeCode]
        : null;
    const clean = String(value ?? "").trim().replace(/^\/+|\/+$/g, "");
    return clean || fallback;
};

/**
 * Where brand-news articles actually live.
 *
 * The articles are reached through the page that displays them — Corporate
 * includes the brand-news menu as a block — so the URL segment is that host
 * page's link, not the brand-news menu's own. Falls back to the brand-news
 * menu's link when no page includes it.
 */
export async function resolveBrandNewsHostLink(locale: string): Promise<string | null> {
    const readLink = (entry: Record<string, any>) => {
        const link = entry?.multi_links?.[locale] || entry?.link || "";
        return String(link).trim().replace(/^\/+|\/+$/g, "") || null;
    };

    try {
        const menuList = await getPublicMenuList(locale);
        let hostLink: string | null = null;
        let ownLink: string | null = null;

        const walk = (node: unknown): void => {
            if (hostLink || !node || typeof node !== "object") return;
            if (Array.isArray(node)) {
                node.forEach(walk);
                return;
            }
            const entry = node as Record<string, any>;

            if (Array.isArray(entry.included_items)) {
                const hostsBrandNews = entry.included_items.some(
                    (inc: any) => String(inc?.menu?.view_type ?? "").trim().toLowerCase() === BRAND_NEWS_VIEW_TYPE,
                );
                if (hostsBrandNews) {
                    const link = readLink(entry);
                    if (link) {
                        hostLink = link;
                        return;
                    }
                }
            }

            if (!ownLink && String(entry.view_type ?? "").trim().toLowerCase() === BRAND_NEWS_VIEW_TYPE) {
                ownLink = readLink(entry);
            }

            Object.values(entry).forEach(walk);
        };

        walk(menuList);
        return hostLink ?? ownLink;
    } catch {
        return null;
    }
}

const normalizeSlug = (value: string) => decodeURIComponent(String(value ?? "")).trim().toLowerCase().replace(/^\/+|\/+$/g, "");

const normalizeSlugText = (value: string) => decodeURIComponent(String(value ?? "")).trim().replace(/[-_]+/g, " ").trim();

async function getMenuDetail(menuLink: string, slug: string, locale: string) {
    const normalizedSlug = normalizeSlug(slug);

    const tryResolveFromPayload = (payload: any): MenuDetailData | null => {
        if (!payload || typeof payload !== "object") return null;

        if (Array.isArray(payload.header)) {
            const headerMenus = payload.header as Array<any>;

            for (const menuEntry of headerMenus) {
                const items = Array.isArray(menuEntry?.data?.items) ? menuEntry.data.items : [];
                const matchedItem = items.find((item: any) => {
                    const localized = item?.multi_slugs?.[locale] || item?.slug || "";
                    return normalizeSlug(localized) === normalizedSlug;
                });

                if (matchedItem) {
                    return {
                        menu: menuEntry,
                        data: {
                            ...menuEntry.data,
                            item: matchedItem,
                        },
                    } as MenuDetailData;
                }
            }
        }

        if (payload && typeof payload === "object" && payload.menu) {
            return payload as MenuDetailData;
        }

        if (payload && typeof payload === "object" && payload.data?.menu) {
            return payload.data as MenuDetailData;
        }

        return null;
    };

    const tryDeepFindItem = (root: any): NewsItem | null => {
        const queue: any[] = [root];
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current || typeof current !== "object") continue;

            if (Array.isArray(current)) {
                for (const v of current) queue.push(v);
                continue;
            }

            const localized = current.multi_slugs?.[locale] || current.slug || "";
            if (normalizeSlug(localized) === normalizedSlug && (current.content || current.banner || current.main_photo || current.related_products)) {
                return current as NewsItem;
            }

            for (const value of Object.values(current)) {
                if (value && typeof value === "object") queue.push(value);
            }
        }
        return null;
    };

    try {
        const responseDetail = await getPublicMenuDetail<any>(menuLink, locale, normalizedSlug);
        if (responseDetail) {
            const fromDetail = tryResolveFromPayload(responseDetail);

            if (fromDetail) {
                // On a page that only *includes* the brand-news menu, the article
                // sits inside an included block rather than in the menu's own
                // items, so the payload shape alone resolves to the menu and the
                // page would render "Corporate" for every article. Keep that menu
                // — breadcrumbs and language links need it — and attach the
                // article the URL actually asks for.
                if (!fromDetail.data?.item) {
                    const nestedItem = tryDeepFindItem(responseDetail);
                    if (nestedItem) {
                        return {
                            ...fromDetail,
                            data: { ...fromDetail.data, item: nestedItem },
                        } as MenuDetailData;
                    }
                }

                return fromDetail;
            }

            const deepItem = tryDeepFindItem(responseDetail);
            if (deepItem) {
                return {
                    menu: { name: deepItem.name ?? normalizeSlugText(slug), title: deepItem.name ?? normalizeSlugText(slug) },
                    data: { item: deepItem },
                };
            }
        }

        const menuList = await getPublicMenuList(locale);
        if (menuList) {
            const fromMenuList = tryResolveFromPayload(menuList);
            if (fromMenuList) return fromMenuList;

            const deepItem = tryDeepFindItem(menuList);
            if (deepItem) {
                return {
                    menu: { name: deepItem.name ?? normalizeSlugText(slug), title: deepItem.name ?? normalizeSlugText(slug) },
                    data: { item: deepItem },
                };
            }
        }

        return null;
    } catch {
        return null;
    }
}

const extractFirstImageFromHtml = (html: string | null | undefined) => {
    const source = String(html ?? "");
    const match = source.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1]?.trim() ?? "";
};

const resolveMainItem = (detail: MenuDetailData, slug: string, locale: string): NewsItem | null => {
    const direct = detail.data?.item;
    if (direct) return direct;

    const items = Array.isArray(detail.data?.items) ? detail.data.items : [];
    const found = items.find((item) => {
        const localized = item.multi_slugs?.[locale] || item.slug || "";
        return normalizeSlug(localized) === slug;
    });

    return found ?? (items[0] ?? null);
};

type BrandNewsPageProps = {
    /** The parent menu's link as it appears in the URL for this locale. */
    menuLink: string;
    slug: string;
    locale: string;
};

export async function generateBrandNewsMetadata({
    menuLink,
    slug,
    locale: incomingLocale,
}: BrandNewsPageProps): Promise<Metadata> {
    const normalizedSlug = normalizeSlug(slug);
    const normalizedMenuLink = normalizeSlug(menuLink);
    const locale = normalizeLocale(incomingLocale || config.project.defLang);
    const menuDetail = await getMenuDetail(normalizedMenuLink, normalizedSlug, locale);

    if (!menuDetail?.menu) {
        return {};
    }

    const mainItem = resolveMainItem(menuDetail, normalizedSlug, locale);
    const pageTitle = String(mainItem?.name ?? menuDetail.menu.title ?? menuDetail.menu.name ?? normalizeSlugText(normalizedSlug)).trim() || "Brand News";
    const pageDescriptionHtml = String(mainItem?.content ?? menuDetail.menu.description ?? menuDetail.data?.content ?? "");
    // Entities stay unread by a tag strip, and a fixed slice ends the sentence
    // mid-word; both showed up in result pages as "&ndash;" and "… Azerbaycanda! B".
    const pageDescription = clampDescription(toPlainText(pageDescriptionHtml));
    const bannerImage =
        String(mainItem?.banner ?? mainItem?.main_photo ?? menuDetail.data?.banner ?? menuDetail.data?.main_photo ?? "").trim() ||
        String(mainItem?.files?.find((f) => f?.is_main)?.url ?? mainItem?.files?.[0]?.url ?? "").trim() ||
        extractFirstImageFromHtml(pageDescriptionHtml);

    // Brand news items carry per-locale slugs, so the alternates come from the
    // item itself rather than from swapping the locale prefix.
    const alternatePathByLocale = Object.entries(mainItem?.multi_slugs ?? {}).reduce<Record<string, string>>(
        (acc, [localeCode, localeSlug]) => {
            const cleanSlug = String(localeSlug ?? "").trim().replace(/^\/+|\/+$/g, "");
            if (cleanSlug) acc[localeCode] = `${localeCode}/${resolveMenuLinkForLocale(menuDetail, localeCode, normalizedMenuLink)}/${cleanSlug}`;
            return acc;
        },
        {},
    );
    const alternateLocales = Object.keys(alternatePathByLocale);

    return buildSeoMetadata({
        title: withSiteName(locale, pageTitle),
        description: pageDescription || articleDescription(locale, pageTitle),
        keywords: buildKeywords({
            cms: mainItem?.seo?.meta_keywords ?? mainItem?.meta_keywords,
            // The article, then the section it was published in — a news item
            // is found by its subject far more often than by its section.
            subjects: [pageTitle, menuDetail.menu.title, menuDetail.menu.name],
            locale,
        }),
        locale,
        canonicalPath: `${locale}/${normalizedMenuLink}/${normalizedSlug}`,
        siteUrl: config.project.siteUrl,
        ...(alternateLocales.length > 0 ? { alternatePathByLocale, locales: alternateLocales } : null),
        image: bannerImage || undefined,
        imageAlt: pageTitle,
    });
}

export async function renderBrandNewsSlugPage({
    menuLink,
    slug,
    locale: incomingLocale,
}: BrandNewsPageProps) {
    const normalizedSlug = normalizeSlug(slug);
    const normalizedMenuLink = normalizeSlug(menuLink);
    const locale = normalizeLocale(incomingLocale || config.project.defLang);
    const t = getTranslations(locale);

    const [menuDetail, chrome] = await Promise.all([
        getMenuDetail(normalizedMenuLink, normalizedSlug, locale),
        getSiteChromeData(locale),
    ]);

    if (!menuDetail?.menu || chrome.languages.length === 0) {
        notFound();
    }

    const mainItem = resolveMainItem(menuDetail, normalizedSlug, locale);

    const fallbackTitle = normalizeSlugText(normalizedSlug) || "Brand";
    const pageTitle = String(mainItem?.name ?? menuDetail.menu.title ?? menuDetail.menu.name ?? fallbackTitle).trim() || fallbackTitle;
    const pageDescriptionHtml = String(mainItem?.content ?? menuDetail.menu.description ?? menuDetail.data?.content ?? "");

    const bannerImage =
        String(mainItem?.banner ?? mainItem?.main_photo ?? menuDetail.data?.banner ?? menuDetail.data?.main_photo ?? "").trim() ||
        String(mainItem?.files?.find((f) => f?.is_main)?.url ?? mainItem?.files?.[0]?.url ?? "").trim() ||
        extractFirstImageFromHtml(pageDescriptionHtml);

    // Brand news items carry their own per-locale slugs, so the language
    // switcher can be pointed straight at them instead of reusing this
    // locale's slug under a different language prefix.
    const localizedLinks = Object.entries(mainItem?.multi_slugs ?? {}).reduce<Record<string, string>>(
        (acc, [localeCode, localeSlug]) => {
            const cleanSlug = String(localeSlug ?? "").trim().replace(/^\/+|\/+$/g, "");
            if (cleanSlug) acc[localeCode] = `${resolveMenuLinkForLocale(menuDetail, localeCode, normalizedMenuLink)}/${cleanSlug}`;
            return acc;
        },
        {},
    );

    const relatedProducts = Array.isArray(mainItem?.related_products)
        ? mainItem.related_products
        : (Array.isArray(menuDetail.data?.related_products) ? menuDetail.data.related_products : []);

    const relatedStripItems = relatedProducts
        .map((item) => {
            const variation = item?.variation;
            if (!variation) return null;

            const variationId =
                typeof variation.variation_id === "number"
                    ? variation.variation_id
                    : Number(variation.variation_id ?? NaN);

            const mainImageUrl = typeof variation.main_image_url === "string" ? variation.main_image_url : null;

            return {
                ...item,
                variation_id: Number.isFinite(variationId) ? variationId : undefined,
                variation: {
                    ...variation,
                    id: Number.isFinite(variationId) ? variationId : undefined,
                    main_image: mainImageUrl ?? undefined,
                },
            };
        })
        .filter(Boolean);

    return (
        <SitePageShell chrome={chrome}>
            <LocalizedLinks value={localizedLinks} />
            <section className="mx-auto w-full max-w-[1280px] px-1 pt-2 lg:px-2">
                <div className="relative w-full overflow-hidden rounded-[16px] bg-[#e0e3e8] skeleton-loader">
                    {bannerImage ? (
                        <RemoteImage src={bannerImage} alt={pageTitle} width={1280} height={300} priority className="h-[clamp(120px,25vw,300px)] w-full object-cover" />
                    ) : (
                        <div className="h-[clamp(120px,25vw,300px)] w-full bg-gradient-to-r from-[#243447] via-[#31465d] to-[#4a5f74]" />
                    )}

                </div>
            </section>

            <Breadcrumb
                items={[
                    { label: t.common.home, href: `/${locale}` },
                    // The corporate menu keeps the same slug in every locale.
                    { label: t.breadcrumb.corporate, href: `/${locale}/korporativ` },
                    { label: pageTitle, isCurrent: true as const },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2 [&_ul.breadcrumb]:!mb-0 [&_ul.breadcrumb]:!pb-0"
                showTitle
                pageTitle={pageTitle}
                titleClassName="mb-0 !text-left !w-full !text-[39px] !font-[700] !leading-[39px] !text-[rgba(15,15,15,1)]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-7 pb-12 lg:px-2">
                <div className="prose max-w-none">
                    {pageDescriptionHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: pageDescriptionHtml }} />
                    ) : (
                        <p>{pageTitle}</p>
                    )}
                </div>

                {relatedProducts.length > 0 ? (
                    <div className="mt-10">
                        <ProductStrip variant="latest" title={t.product.linkedProducts} items={relatedStripItems} />
                    </div>
                ) : null}
            </section>

        </SitePageShell>
    );
}

/**
 * /brands/news/{slug} is retired — the article is served from the parent menu's
 * own link now. These paths are indexed, so they redirect permanently instead
 * of 404ing.
 */
export default async function BrandNewsSlugPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);
    const menuLink = await resolveBrandNewsHostLink(locale);

    if (!menuLink) {
        notFound();
    }

    permanentRedirect(`/${locale}/${menuLink}/${encodeURIComponent(slug)}`);
}
