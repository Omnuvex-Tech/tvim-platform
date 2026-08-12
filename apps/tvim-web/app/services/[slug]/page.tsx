import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import type {
} from "@repo/types/types";
import { Breadcrumb, type Company } from "@repo/ui";
import { htmlToText } from "@repo/shared/utils";
import BrandListSlider from "@/app/components/BrandListSlider/brand-list-slider";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { config } from "@/config";
import { getPublicMenuDetail } from "@/lib/public-data";
import { buildSeoMetadata } from "@/lib/seo";
import { getSiteChromeData } from "@/lib/site-chrome";
import { resolveRequestFormSubmitConfig } from "@/lib/request-form";
import { normalizeLocale, type SiteLocale } from "@/lib/site-locales";
import { getTranslations } from "@/lib/i18n";

type MenuDetailData = {
    menu?: {
        type?: string;
        view_type?: string;
        name?: string;
        title?: string | null;
        description?: string | null;
        seo?: {
            meta_keywords?: string | string[];
        };
    };
    data?: {
        // The real, full-length content for these entries lives here — the
        // short menu.description above is just the one-line teaser also
        // shown on the homepage benefit tile.
        title?: string | null;
        description?: string | null;
        main_photo?: string | null;
        seo?: {
            meta_title?: string | null;
            meta_description?: string | null;
            meta_keywords?: string | string[] | null;
        };
        submit?: {
            method?: string;
            path?: string;
            route?: string;
        };
    };
    included_items?: any[];
};

type StaticServiceContent = {
    // Nothing else can tell a request what this locale's own slug/title for
    // these are — that's the one thing every entry here needs regardless of
    // where its body content comes from.
    slugs: Record<SiteLocale, string>;
    titles: Record<SiteLocale, string>;
    // Only "pulsuz-catdirilma" (no cms entry at all) populates these. The
    // other three have a real cms menu with full body content, own SEO, and
    // (for two of them) a real icon image — renderServiceSlugPage reads that
    // from menuDetail.data instead of duplicating it here. Keeping fabricated
    // copy for an entry the cms already answers is exactly the mess this
    // dictionary used to be.
    introTitle?: string;
    introText?: string;
    detailsTitle?: string;
    details?: string[];
    bannerImage?: string;
};

// Keyed by the az slug — the historical key these pages have always used —
// but every entry now carries its own slug and title per locale.
const STATIC_SERVICE_CONTENT: Record<string, StaticServiceContent> = {
    "bonus-kartlari": {
        slugs: { az: "bonus-kartlari", en: "bonus-cards", ru: "bonusnye-karty" },
        titles: { az: "Bonus kartları", en: "Bonus cards", ru: "Бонусные карты" },
    },
    "pulsuz-catdirilma": {
        slugs: { az: "pulsuz-catdirilma", en: "free-delivery", ru: "besplatnaya-dostavka" },
        titles: { az: "Pulsuz çatdırılma", en: "Free delivery", ru: "Бесплатная доставка" },
        introTitle: "Pulsuz çatdırılma xidməti",
        introText:
            "200 AZN və yuxarı sifarişlər üçün pulsuz çatdırılma xidməti təqdim olunur. Sifarişiniz operativ şəkildə ünvanınıza çatdırılır.",
        detailsTitle: "Şərtlər",
        details: [
            "Minimum sifariş məbləği: 200 AZN.",
            "Çatdırılma vaxtı bölgədən asılı olaraq dəyişə bilər.",
            "Bəzi iri həcmli məhsullar üçün əlavə logistika qaydaları tətbiq edilə bilər.",
            "Çatdırılma zamanı məhsulun bütövlüyü və sifariş uyğunluğu komanda tərəfindən yoxlanılır.",
        ],
        bannerImage: "https://images.unsplash.com/photo-1614018453562-77f6180d18da?auto=format&fit=crop&w=1920&q=80",
    },
    geriqaytarma: {
        slugs: { az: "geriqaytarma", en: "returns", ru: "vozvrat" },
        titles: { az: "Geriqaytarma", en: "Returns", ru: "Возврат" },
    },
    "korporativ-satis": {
        slugs: { az: "korporativ-satis", en: "corporate-sales", ru: "korporativnye-prodazhi" },
        titles: { az: "Korporativ satış", en: "Corporate sales", ru: "Корпоративные продажи" },
    },
};

// The sitemap has no other way to learn these slugs, since — unlike every
// other page it lists — they come from this dictionary rather than an api.
export const SERVICE_SLUGS_BY_LOCALE: Record<SiteLocale, string>[] =
    Object.values(STATIC_SERVICE_CONTENT).map((content) => content.slugs);

// Three of these four concepts also exist as real cms menu entries (see
// BenefitsStrip), under their own wording — which for "geri qaytarma" is
// completely different from this dictionary's own slugs and shares no
// Azerbaijani stem with them, so the fuzzy fallback below cannot catch it.
// These aliases are the actual per-locale `menu.link` values fetched live
// from those cms entries.
const CMS_ALIAS_SLUGS: Record<string, string> = {
    korporativ: "korporativ-satis",
    "geri-qaytarma-ve-deyisdirilme": "geriqaytarma",
    "redemption-and-replacement": "geriqaytarma",
    "iskuplenie-i-zamena": "geriqaytarma",
};

// Maps every locale's slug back to the (az-keyed) content entry, so
// /en/services/bonus-cards resolves exactly like /az/services/bonus-kartlari.
const SERVICE_KEY_BY_SLUG = Object.entries(STATIC_SERVICE_CONTENT).reduce<Record<string, string>>(
    (acc, [key, content]) => {
        Object.values(content.slugs).forEach((slug) => {
            acc[slug] = key;
        });
        return acc;
    },
    { ...CMS_ALIAS_SLUGS },
);

function resolveStaticServiceKey(slug: string): string | undefined {
    const exactKey = SERVICE_KEY_BY_SLUG[slug];
    if (exactKey) return exactKey;

    // Legacy / mistyped variants that are neither a stored key nor any
    // locale's own slug — matched by Azerbaijani word stem only, since that
    // is the language these ad hoc variants have historically been in.
    const normalized = slug
        .toLowerCase()
        .replace(/ə/g, "e")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ğ/g, "g")
        .replace(/ş/g, "s")
        .replace(/ç/g, "c");

    if (normalized.includes("bonus") || normalized.includes("kart")) return "bonus-kartlari";
    if (normalized.includes("catdir")) return "pulsuz-catdirilma";
    if (normalized.includes("geri") || normalized.includes("qaytar") || normalized.includes("deyisdir")) return "geriqaytarma";
    if (normalized.includes("korporativ") || normalized.includes("satis")) return "korporativ-satis";

    return undefined;
}

function resolveStaticServiceContent(slug: string): StaticServiceContent | undefined {
    const key = resolveStaticServiceKey(slug);
    return key ? STATIC_SERVICE_CONTENT[key] : undefined;
}

/**
 * Translates any known spelling of one of these four services (this
 * dictionary's own slug in any locale, or an Azerbaijani-stem variant) into
 * the slug this locale serves. Used by callers that build a /services/ link
 * up front — BenefitsStrip — so the link lands on the right page without a
 * redirect hop through this page's own canonicalizing redirect.
 */
export function resolveServiceSlugForLocale(candidate: string, locale: string): string {
    const key = resolveStaticServiceKey(candidate);
    if (!key) return candidate;

    const normalizedLocale = locale.trim().toLowerCase();
    return STATIC_SERVICE_CONTENT[key]?.slugs[normalizedLocale as SiteLocale] ?? candidate;
}

// This page publishes these three under a slug of its own (korporativ-satis,
// geriqaytarma) that is *not* what the cms stores them under — their real
// page lives at a different url (see BenefitsStrip / the previous commit).
// The api resolves a link by any locale's spelling regardless of the
// requested Content-Language, so the az spelling alone is enough to reach
// the entry in every locale.
const CMS_SLUG_BY_KEY: Partial<Record<string, string>> = {
    "korporativ-satis": "korporativ",
    geriqaytarma: "geri-qaytarma-ve-deyisdirilme",
    "bonus-kartlari": "bonus-kartlari",
};

function resolveCmsQuerySlug(normalizedSlug: string): string {
    const key = resolveStaticServiceKey(normalizedSlug);
    return (key && CMS_SLUG_BY_KEY[key]) || normalizedSlug;
}

async function getMenuDetail(slug: string, locale: string) {
    const payload = await getPublicMenuDetail<any>(slug, locale);
    if (!payload || typeof payload !== "object") return null;
    if ("menu" in payload) return payload as MenuDetailData;
    if ("data" in payload && payload.data && typeof payload.data === "object" && "menu" in payload.data) {
        return payload.data as MenuDetailData;
    }
    return null;
}

function mapIncludedValuesToCompanies(values: any[], locale: string) {
    const arr = Array.isArray(values) ? values : [];
    return arr
        .map((v: any, i: number): Company => ({
            id: String(v?.value_id ?? v?.id ?? `company-${i}`),
            name: v?.name ?? v?.title ?? "",
            logo: v?.image ?? v?.image_url ?? v?.logo ?? null,
            url: v?.slug
                ? `/${locale}/brands/news/${String(v.slug)}`
                : (v?.url ?? v?.link ?? v?.website ?? "").toString().trim() || undefined,
        }))
        .filter((c) => Boolean(c.name));
}

type ServicePageProps = {
    slug: string;
    locale: string;
};

export async function generateServiceMetadata({
    slug,
    locale: incomingLocale,
}: ServicePageProps): Promise<Metadata> {
    const normalizedSlug = decodeURIComponent(String(slug ?? ""))
        .trim()
        .toLowerCase()
        .replace(/^\/+|\/+$/g, "");
    const locale = normalizeLocale(incomingLocale || config.project.defLang);
    const menuDetail = await getMenuDetail(resolveCmsQuerySlug(normalizedSlug), locale);
    const staticContent = resolveStaticServiceContent(normalizedSlug);
    const menu = menuDetail?.menu;
    const cmsData = menuDetail?.data;
    // The dictionary's own title wins first: it is what this /services/ url
    // actually publishes, kept intentionally distinct from the cms page's
    // own title even when both exist for the same underlying topic.
    const title = staticContent?.titles[locale] || cmsData?.title || menu?.title || menu?.name || "Service";
    const description =
        cmsData?.seo?.meta_description
        || htmlToText(cmsData?.description).slice(0, 170)
        || staticContent?.introText
        || menu?.description
        || `${title} xidmeti ile bagli melumatlar TVIM daxilinde.`;
    const keywordsRaw = cmsData?.seo?.meta_keywords ?? menu?.seo?.meta_keywords;
    const keywords = Array.isArray(keywordsRaw)
        ? keywordsRaw.filter(Boolean).map(String)
        : typeof keywordsRaw === "string"
            ? keywordsRaw.split(",").map((item) => item.trim()).filter(Boolean)
            : [title, "service", "tvim"];

    // The dictionary is the only source of a per-locale /services/ slug —
    // even for the three backed by a real cms page, that page lives at a
    // different url. staticContent is undefined only for a slug this
    // dictionary has never heard of.
    const alternatePathByLocale = staticContent
        ? Object.entries(staticContent.slugs).reduce<Record<string, string>>((acc, [localeCode, localeSlug]) => {
            acc[localeCode] = `${localeCode}/services/${localeSlug}`;
            return acc;
        }, {})
        : undefined;
    const alternateLocales = alternatePathByLocale ? Object.keys(alternatePathByLocale) : [locale];

    return buildSeoMetadata({
        title,
        description,
        keywords,
        locale,
        canonicalPath: `${locale}/services/${normalizedSlug}`,
        siteUrl: config.project.siteUrl,
        ...(alternatePathByLocale ? { alternatePathByLocale } : null),
        locales: alternateLocales,
        image: cmsData?.main_photo || staticContent?.bannerImage,
        imageAlt: title,
    });
}

export async function renderServiceSlugPage({
    slug,
    locale: incomingLocale,
}: ServicePageProps) {
    const normalizedSlug = decodeURIComponent(String(slug ?? ""))
        .trim()
        .toLowerCase()
        .replace(/^\/+|\/+$/g, "");
    const locale = normalizeLocale(incomingLocale || config.project.defLang);
    const t = getTranslations(locale);

    const staticContent = resolveStaticServiceContent(normalizedSlug);

    // These slugs have no cms entry, so unlike every other page nothing else
    // can resolve this locale's own spelling for us — it comes from the
    // dictionary above. A request under another locale's slug (or an old
    // Azerbaijani-stem variant) is moved onto it.
    const canonicalSlug = staticContent?.slugs[locale];
    if (canonicalSlug && canonicalSlug !== normalizedSlug) {
        permanentRedirect(`/${locale}/services/${encodeURIComponent(canonicalSlug)}`);
    }

    const [menuDetail, chrome] = await Promise.all([
        getMenuDetail(resolveCmsQuerySlug(normalizedSlug), locale),
        getSiteChromeData(locale),
    ]);

    if ((!menuDetail?.menu && !staticContent) || chrome.languages.length === 0) {
        notFound();
    }

    const menu = menuDetail?.menu;
    const cmsData = menuDetail?.data;
    const includedItems = Array.isArray(menuDetail?.included_items) ? menuDetail.included_items : [];
    const pageTitle = staticContent?.titles[locale] || cmsData?.title || menu?.title || menu?.name || "Service";
    const keywordsRaw = cmsData?.seo?.meta_keywords ?? menu?.seo?.meta_keywords;
    const keywords = Array.isArray(keywordsRaw)
        ? keywordsRaw.filter(Boolean).map(String)
        : typeof keywordsRaw === "string"
            ? keywordsRaw.split(",").map((item) => item.trim()).filter(Boolean)
            : [];

    const fallbackTitle = normalizedSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const currentTitle = staticContent?.titles[locale] || cmsData?.title || menu?.name || fallbackTitle;
    const bannerImage = cmsData?.main_photo || staticContent?.bannerImage;
    // Only "pulsuz-catdirilma" still populates this — everything else renders
    // the real cms body below instead.
    const hasStaticBody = Boolean(staticContent?.details && staticContent.details.length > 0);
    const cmsBodyHtml = cmsData?.description || menu?.description || "";

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: t.common.home, href: `/${locale}` },
                    { label: t.breadcrumb.services },
                    { label: currentTitle || "Service", isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle
                pageTitle={pageTitle}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[40px]"
            />

            <section className="mx-auto w-full max-w-[1280px] !px-1 pt-2 pb-10 lg:!px-2 lg:pt-3 lg:pb-12">
                <div className="space-y-7">
                    <div className="overflow-hidden rounded-[8px] bg-[#f0f2f5] skeleton-loader">
                        {bannerImage ? (
                            <img src={bannerImage} alt={pageTitle} className="h-[clamp(180px,40vw,300px)] w-full object-cover" loading="lazy" />
                        ) : (
                            <div className="flex h-[clamp(180px,40vw,300px)] w-full items-center bg-gradient-to-r from-[#1432c9] via-[#1a41ef] to-[#2944c6] px-8">
                                <div>
                                    <p className="text-[24px] leading-none font-bold text-white lg:text-[36px]">tvim.</p>
                                    <p className="mt-3 text-[24px] leading-tight font-extrabold text-[#ffe044] uppercase lg:text-[48px]">{pageTitle}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {hasStaticBody ? (
                        <>
                            {staticContent?.introTitle ? (
                                <h2 className="text-[24px] leading-[1.25] font-bold text-[#111827] lg:text-[36px]">{staticContent.introTitle}</h2>
                            ) : null}

                            {staticContent?.introText ? (
                                <p className="max-w-none text-[16px] leading-[1.65] text-[#1f2937] lg:text-[20px]">{staticContent.introText}</p>
                            ) : null}

                            <div className="border-t border-[#e5e7eb] pt-5">
                                <h3 className="text-[22px] leading-[1.25] font-bold text-[#111827] lg:text-[32px]">{staticContent?.detailsTitle}</h3>
                                <ul className="mt-4 space-y-3">
                                    {staticContent?.details?.map((item, index) => (
                                        <li key={index} className="relative pl-7 text-[16px] leading-[1.6] text-[#1f2937] lg:text-[18px]">
                                            <span className="absolute top-[10px] left-0 h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="prose max-w-none">
                            {cmsBodyHtml ? (
                                <div dangerouslySetInnerHTML={{ __html: cmsBodyHtml }} />
                            ) : (
                                <p>{t.service.comingSoon}</p>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {includedItems.length > 0 ? (
                <div className="mt-4 w-full">
                    <div className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2">
                        {includedItems.map((inc: any, idx: number) => {
                            const includedSubmitConfig = resolveRequestFormSubmitConfig(inc?.data?.submit ?? inc?.data ?? inc);

                            if (inc.included_type === "menu" && inc.type === "form" && includedSubmitConfig) {
                                return (
                                    <div key={idx} className="mt-4 lg:mt-6">
                                        <RequestForm submitConfig={includedSubmitConfig} />
                                    </div>
                                );
                            }

                            if (inc.included_type === "brand" && inc.data?.values) {
                                const companies = mapIncludedValuesToCompanies(inc.data.values, locale);
                                if (companies.length === 0) return null;
                                return (
                                    <div key={idx} className="mt-4 lg:mt-6">
                                        <BrandListSlider companies={companies} />
                                    </div>
                                );
                            }

                            return null;
                        })}
                    </div>
                </div>
            ) : null}

            {keywords.length > 0 ? (
                <div className="mx-auto mt-8 w-full max-w-[1280px] lg:mt-10">
                    <div className="w-[calc(100%-56px)] border-t border-[#e5e9ef]" />
                    <div className="pt-4">
                        <div className="flex flex-wrap justify-start gap-2">
                            {keywords.map((kw, i) => (
                                <span
                                    key={i}
                                    className="inline-block rounded-[20px] border border-[#ddd] bg-[#f8f8f8] px-[12px] py-[6px] text-[14px] leading-none font-normal text-[#333] transition-all duration-200 ease-in-out cursor-default"
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

        </SitePageShell>
    );
}

export default async function ServiceSlugPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);
    redirect(`/${locale}/services/${encodeURIComponent(slug)}`);
}
