import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { getPublicMenuDetail, getPublicMenuList } from "@/lib/public-data";
import { buildSeoMetadata } from "@/lib/seo";
import { getSiteChromeData } from "@/lib/site-chrome";
import { normalizeLocale } from "@/lib/site-locales";
import { getTranslations } from "@/lib/i18n";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
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

const BRAND_NEWS_MENU_LINK = "brand-news";

const normalizeSlug = (value: string) => decodeURIComponent(String(value ?? "")).trim().toLowerCase().replace(/^\/+|\/+$/g, "");

const normalizeSlugText = (value: string) => decodeURIComponent(String(value ?? "")).trim().replace(/[-_]+/g, " ").trim();

async function getMenuDetail(slug: string, locale: string) {
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
        const responseDetail = await getPublicMenuDetail<any>(BRAND_NEWS_MENU_LINK, locale, normalizedSlug);
        if (responseDetail) {
            const fromDetail = tryResolveFromPayload(responseDetail);
            if (fromDetail) return fromDetail;

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
    slug: string;
    locale: string;
};

export async function generateBrandNewsMetadata({
    slug,
    locale: incomingLocale,
}: BrandNewsPageProps): Promise<Metadata> {
    const normalizedSlug = normalizeSlug(slug);
    const locale = normalizeLocale(incomingLocale || config.project.defLang);
    const menuDetail = await getMenuDetail(normalizedSlug, locale);

    if (!menuDetail?.menu) {
        return {};
    }

    const mainItem = resolveMainItem(menuDetail, normalizedSlug, locale);
    const pageTitle = String(mainItem?.name ?? menuDetail.menu.title ?? menuDetail.menu.name ?? normalizeSlugText(normalizedSlug)).trim() || "Brand News";
    const pageDescriptionHtml = String(mainItem?.content ?? menuDetail.menu.description ?? menuDetail.data?.content ?? "");
    const pageDescription = pageDescriptionHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 170);
    const bannerImage =
        String(mainItem?.banner ?? mainItem?.main_photo ?? menuDetail.data?.banner ?? menuDetail.data?.main_photo ?? "").trim() ||
        String(mainItem?.files?.find((f) => f?.is_main)?.url ?? mainItem?.files?.[0]?.url ?? "").trim() ||
        extractFirstImageFromHtml(pageDescriptionHtml);

    // Brand news items carry per-locale slugs, so the alternates come from the
    // item itself rather than from swapping the locale prefix.
    const alternatePathByLocale = Object.entries(mainItem?.multi_slugs ?? {}).reduce<Record<string, string>>(
        (acc, [localeCode, localeSlug]) => {
            const cleanSlug = String(localeSlug ?? "").trim().replace(/^\/+|\/+$/g, "");
            if (cleanSlug) acc[localeCode] = `${localeCode}/brands/news/${cleanSlug}`;
            return acc;
        },
        {},
    );
    const alternateLocales = Object.keys(alternatePathByLocale);

    return buildSeoMetadata({
        title: `${pageTitle} | TVIM`,
        description: pageDescription || `${pageTitle} haqqinda yenilikleri TVIM daxilinde oxuyun.`,
        keywords: [pageTitle, "brand news", "tvim"],
        locale,
        canonicalPath: `${locale}/brands/news/${normalizedSlug}`,
        siteUrl: config.project.siteUrl,
        ...(alternateLocales.length > 0 ? { alternatePathByLocale, locales: alternateLocales } : null),
        image: bannerImage || undefined,
        imageAlt: pageTitle,
    });
}

export async function renderBrandNewsSlugPage({
    slug,
    locale: incomingLocale,
}: BrandNewsPageProps) {
    const normalizedSlug = normalizeSlug(slug);
    const locale = normalizeLocale(incomingLocale || config.project.defLang);
    const t = getTranslations(locale);

    const [menuDetail, chrome] = await Promise.all([
        getMenuDetail(normalizedSlug, locale),
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
            if (cleanSlug) acc[localeCode] = `brands/news/${cleanSlug}`;
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
        <SitePageShell chrome={chrome} localizedLinks={localizedLinks}>
            <section className="mx-auto w-full max-w-[1280px] px-1 pt-2 lg:px-2">
                <div className="relative w-full overflow-hidden rounded-[16px] bg-[#e0e3e8] skeleton-loader">
                    {bannerImage ? (
                        <img src={bannerImage} alt={pageTitle} className="h-[clamp(120px,25vw,300px)] w-full object-cover" />
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
                        <ProductStrip variant="latest" title="Əlaqəli məhsullar" items={relatedStripItems} />
                    </div>
                ) : null}
            </section>

        </SitePageShell>
    );
}

export default async function BrandNewsSlugPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);
    redirect(`/${locale}/brands/news/${encodeURIComponent(slug)}`);
}
