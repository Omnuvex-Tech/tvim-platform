import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type {
} from "@repo/types/types";
import { Breadcrumb, type Company } from "@repo/ui";
import BrandListSlider from "@/app/components/BrandListSlider/brand-list-slider";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { config } from "@/config";
import { getPublicMenuDetail } from "@/lib/public-data";
import { buildSeoMetadata } from "@/lib/seo";
import { getSiteChromeData } from "@/lib/site-chrome";
import { resolveRequestFormSubmitConfig } from "@/lib/request-form";
import { normalizeLocale } from "@/lib/site-locales";

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
        submit?: {
            method?: string;
            path?: string;
            route?: string;
        };
    };
    included_items?: any[];
};

type StaticServiceContent = {
    title: string;
    pageTitle?: string;
    introTitle?: string;
    introText?: string;
    detailsTitle?: string;
    details: string[];
    bannerImage?: string;
};

const STATIC_SERVICE_CONTENT: Record<string, StaticServiceContent> = {
    "bonus-kartlari": {
        title: "Bonus kartları",
        pageTitle: "Bonus cards",
        introTitle: "Earn More from Your Shopping with Our Bonus Cards!",
        introText:
            "Bonus kartları ilə alış-veriş etdikcə əlavə üstünlüklər qazanın. Hər alışda bonus toplayın, növbəti sifarişlərdə istifadə edin və daha sərfəli alış imkanlarından yararlanın.",
        detailsTitle: "Bonus kartının üstünlükləri",
        details: [
            "Hər alışda bonus faizi toplanır və növbəti sifarişlərdə istifadə edilir.",
            "Bonuslar bütün TVİM mağazalarında və uyğun məhsul qruplarında keçərlidir.",
            "Xüsusi kampaniya günlərində bonus qazanma faizi daha yüksək olur.",
        ],
        bannerImage: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1920&q=80",
    },
    "pulsuz-catdirilma": {
        title: "Pulsuz çatdırılma",
        pageTitle: "Free delivery",
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
        title: "Geriqaytarma",
        pageTitle: "Returns",
        introTitle: "14 gün geri qaytarma imkanı",
        introText:
            "Məhsulu təhvil aldıqdan sonra 14 gün ərzində müəyyən şərtlərlə geri qaytarmaq mümkündür.",
        detailsTitle: "Qaydalar",
        details: [
            "Məhsul istifadə olunmamış və ilkin vəziyyətdə olmalıdır.",
            "Qablaşdırma və qəbz mütləq təqdim edilməlidir.",
            "Qaytarma qərarı yoxlanışdan sonra təsdiqlənir.",
            "Texniki məhsullarda geri qaytarma istehsalçı qaydalarına uyğun olaraq qiymətləndirilir.",
        ],
        bannerImage: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1920&q=80",
    },
    "korporativ-satis": {
        title: "Korporativ satış",
        pageTitle: "Corporate sales",
        introTitle: "Korporativ müştərilər üçün xüsusi həllər",
        introText:
            "Şirkətlər üçün fərdi qiymət təklifləri, toplu alış üstünlükləri və uzunmüddətli əməkdaşlıq modelləri təqdim edilir.",
        detailsTitle: "Nələr təqdim olunur",
        details: [
            "Toplu alış üçün fərdi qiymətləndirmə.",
            "Müqavilə əsasında davamlı tədarük.",
            "Sürətli logistika və satış sonrası dəstək.",
            "Layihə yönümlü sifarişlər üçün fərdi menecer dəstəyi.",
        ],
        bannerImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80",
    },
};

function resolveStaticServiceContent(slug: string): StaticServiceContent | undefined {
    const exact = STATIC_SERVICE_CONTENT[slug];
    if (exact) return exact;

    const normalized = slug
        .toLowerCase()
        .replace(/ə/g, "e")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ğ/g, "g")
        .replace(/ş/g, "s")
        .replace(/ç/g, "c");

    if (normalized.includes("bonus") || normalized.includes("kart")) {
        return STATIC_SERVICE_CONTENT["bonus-kartlari"];
    }

    if (normalized.includes("catdir")) {
        return STATIC_SERVICE_CONTENT["pulsuz-catdirilma"];
    }

    if (normalized.includes("geri") || normalized.includes("qaytar") || normalized.includes("deyisdir")) {
        return STATIC_SERVICE_CONTENT.geriqaytarma;
    }

    if (normalized.includes("korporativ") || normalized.includes("satis")) {
        return STATIC_SERVICE_CONTENT["korporativ-satis"];
    }

    return undefined;
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
    const menuDetail = await getMenuDetail(normalizedSlug, locale);
    const staticContent = resolveStaticServiceContent(normalizedSlug);
    const menu = menuDetail?.menu;
    const title = staticContent?.pageTitle || staticContent?.title || menu?.title || menu?.name || "Service";
    const description = staticContent?.introText || menu?.description || `${title} xidmeti ile bagli melumatlar TVIM daxilinde.`;
    const keywordsRaw = menu?.seo?.meta_keywords;
    const keywords = Array.isArray(keywordsRaw)
        ? keywordsRaw.filter(Boolean).map(String)
        : typeof keywordsRaw === "string"
            ? keywordsRaw.split(",").map((item) => item.trim()).filter(Boolean)
            : [title, "service", "tvim"];

    return buildSeoMetadata({
        title,
        description,
        keywords,
        locale,
        canonicalPath: `${locale}/services/${normalizedSlug}`,
        siteUrl: config.project.url,
        locales: [locale],
        defaultLocale: locale,
        image: staticContent?.bannerImage,
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

    const [menuDetail, chrome] = await Promise.all([
        getMenuDetail(normalizedSlug, locale),
        getSiteChromeData(locale),
    ]);

    const staticContent = resolveStaticServiceContent(normalizedSlug);

    if ((!menuDetail?.menu && !staticContent) || chrome.languages.length === 0) {
        notFound();
    }

    const menu = menuDetail?.menu;
    const pageData = menuDetail?.data;
    const includedItems = Array.isArray(menuDetail?.included_items) ? menuDetail.included_items : [];
    const pageTitle = staticContent?.pageTitle || staticContent?.title || menu?.title || menu?.name || "Service";
    const keywordsRaw = menu?.seo?.meta_keywords;
    const keywords = Array.isArray(keywordsRaw)
        ? keywordsRaw.filter(Boolean).map(String)
        : typeof keywordsRaw === "string"
            ? keywordsRaw.split(",").map((item) => item.trim()).filter(Boolean)
            : [];

    const fallbackTitle = normalizedSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const currentTitle = staticContent?.title || menu?.name || fallbackTitle;

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: locale === "en" ? "Home" : "Ana səhifə", href: `/${locale}` },
                    { label: locale === "en" ? "Services" : "Xidmətlər" },
                    { label: currentTitle || "Service", isCurrent: true },
                ]}
                className="mx-auto w-full max-w-[1280px] !px-1 lg:!px-2"
                showTitle
                pageTitle={pageTitle}
                titleClassName="!mt-[-10px] mb-0 !text-left !w-full !text-[28px] lg:!text-[40px]"
            />

            <section className="mx-auto w-full max-w-[1280px] !px-1 pt-2 pb-10 lg:!px-2 lg:pt-3 lg:pb-12">
                {staticContent ? (
                    <div className="space-y-7">
                        <div className="overflow-hidden rounded-[8px] bg-[#f0f2f5] skeleton-loader">
                            {staticContent.bannerImage ? (
                                <img src={staticContent.bannerImage} alt={staticContent.title} className="h-[clamp(180px,40vw,300px)] w-full object-cover" loading="lazy" />
                            ) : (
                                <div className="flex h-[clamp(180px,40vw,300px)] w-full items-center bg-gradient-to-r from-[#1432c9] via-[#1a41ef] to-[#2944c6] px-8">
                                    <div>
                                        <p className="text-[24px] leading-none font-bold text-white lg:text-[36px]">tvim.</p>
                                        <p className="mt-3 text-[24px] leading-tight font-extrabold text-[#ffe044] uppercase lg:text-[48px]">{staticContent.title}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {staticContent.introTitle ? (
                            <h2 className="text-[24px] leading-[1.25] font-bold text-[#111827] lg:text-[36px]">{staticContent.introTitle}</h2>
                        ) : null}

                        {staticContent.introText ? (
                            <p className="max-w-none text-[16px] leading-[1.65] text-[#1f2937] lg:text-[20px]">{staticContent.introText}</p>
                        ) : null}

                        <div className="border-t border-[#e5e7eb] pt-5">
                            <h3 className="text-[22px] leading-[1.25] font-bold text-[#111827] lg:text-[32px]">{staticContent.detailsTitle}</h3>
                            <ul className="mt-4 space-y-3">
                                {staticContent.details.map((item, index) => (
                                    <li key={index} className="relative pl-7 text-[16px] leading-[1.6] text-[#1f2937] lg:text-[18px]">
                                        <span className="absolute top-[10px] left-0 h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="prose max-w-none">
                        {menu?.description ? (
                            <div dangerouslySetInnerHTML={{ __html: menu.description }} />
                        ) : (
                            <p>Xidmət haqqında məlumat tezliklə əlavə olunacaq.</p>
                        )}
                    </div>
                )}

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
