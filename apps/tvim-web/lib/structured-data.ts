import { config } from "@/config";
import type { BusinessProfile } from "@/lib/settings";
import { clampDescription, toPlainText } from "@/lib/seo-copy";
import { normalizeLocale, type SiteLocale } from "@/lib/site-locales";

/**
 * Structured data (schema.org JSON-LD) for the pages a search engine can show
 * more of than a blue link: a product with its price and stock, a trail of
 * categories instead of a url, the store with its address and opening hours.
 * No page carried any before.
 *
 * Every value here is one the page itself shows. Google drops rich results
 * whose markup disagrees with the visible page, so nothing is added that a
 * visitor could not read on it.
 *
 * Each page renders one `<script type="application/ld+json">` holding a
 * `@graph`; the nodes that describe the site as a whole carry an `@id`, so a
 * page can point at them instead of repeating them.
 */

export type JsonLdNode = Record<string, unknown>;

export const SCHEMA_CONTEXT = "https://schema.org";

const siteOrigin = () => {
    try {
        return new URL(config.project.siteUrl).origin;
    } catch {
        return "";
    }
};

const nodeId = (name: string) => `${siteOrigin()}/#${name}`;

export const ORGANIZATION_ID = () => nodeId("organization");
export const WEBSITE_ID = () => nodeId("website");
export const STORE_ID = () => nodeId("store");

/** A site path or an absolute url, as an absolute url on the published host. */
export const absoluteUrl = (href: string | null | undefined) => {
    const value = String(href ?? "").trim();
    if (!value || value === "#") return undefined;
    if (/^https?:\/\//i.test(value)) return value;

    const origin = siteOrigin();
    if (!origin) return undefined;

    const path = value.replace(/^\/+/, "").replace(/\/+$/, "");
    // The default language's home is published at the bare domain; /az is
    // only another way to reach it.
    if (!path || path === config.project.defLang) return origin;
    return `${origin}/${path}`;
};

/** The admin's dates are Baku local time without an offset. */
const toIsoDateTime = (value: unknown) => {
    const raw = String(value ?? "").trim();
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/);
    if (!match) return undefined;
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) return raw.replace(" ", "T");

    return `${match[1]}T${match[2] ?? "00:00:00"}+04:00`;
};

/** Drops the keys a builder left empty, so the markup carries no nulls. */
const compact = (node: JsonLdNode): JsonLdNode =>
    Object.fromEntries(
        Object.entries(node).filter(([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== "" &&
            !(Array.isArray(value) && value.length === 0)
        ),
    );

const LOCALITY: Record<SiteLocale, string> = { az: "Bakı", en: "Baku", ru: "Баку" };

const DAYS: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
};

/**
 * Opening hours out of the admin's free text ("Работаем с 9:00 до 20:00, без
 * выходных"), one entry per distinct pair of times. A day whose text holds no
 * two times is left out rather than guessed at.
 */
const openingHours = (workHours: Record<string, string>) => {
    const byTimes = new Map<string, string[]>();

    Object.entries(workHours).forEach(([day, text]) => {
        const dayName = DAYS[day.slice(0, 3)];
        const times = text.match(/(\d{1,2})[:.](\d{2})\D+?(\d{1,2})[:.](\d{2})/);
        if (!dayName || !times) return;

        const [, openHour = "", openMinute = "", closeHour = "", closeMinute = ""] = times;
        const opens = `${openHour.padStart(2, "0")}:${openMinute}`;
        const closes = `${closeHour.padStart(2, "0")}:${closeMinute}`;
        const key = `${opens}-${closes}`;
        byTimes.set(key, [...(byTimes.get(key) ?? []), dayName]);
    });

    const weekOrder = Object.values(DAYS);
    return Array.from(byTimes.entries()).map(([key, days]) => {
        const [opens, closes] = key.split("-");
        return {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [...days].sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b)),
            opens,
            closes,
        };
    });
};

/** The admin's structured hours (Settings → SEO → business), one entry per row. */
const adminOpeningHours = (rows: BusinessProfile["openingHours"]) => {
    const weekOrder = Object.keys(DAYS);
    return rows.map((row) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...new Set(row.days)]
            .filter((day) => DAYS[day])
            .sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b))
            .map((day) => DAYS[day]),
        opens: row.opens,
        closes: row.closes,
    }));
};

const telephone = (profile: BusinessProfile) =>
    profile.phones[0]?.replace(/[^\d+]/g, "") || undefined;

export const organizationJsonLd = (profile: BusinessProfile): JsonLdNode =>
    compact({
        "@type": "Organization",
        "@id": ORGANIZATION_ID(),
        name: profile.name,
        url: siteOrigin(),
        logo: profile.logo,
        email: profile.email,
        telephone: telephone(profile),
        sameAs: profile.sameAs,
        contactPoint: telephone(profile)
            ? {
                "@type": "ContactPoint",
                telephone: telephone(profile),
                contactType: "customer service",
                availableLanguage: ["Azerbaijani", "English", "Russian"],
            }
            : undefined,
    });

export const websiteJsonLd = (profile: BusinessProfile, locales: readonly string[]): JsonLdNode =>
    compact({
        "@type": "WebSite",
        "@id": WEBSITE_ID(),
        url: siteOrigin(),
        name: profile.name,
        inLanguage: [...locales],
        publisher: { "@id": ORGANIZATION_ID() },
    });

/**
 * The shop itself. HardwareStore is the LocalBusiness subtype for a building
 * materials store, which is what makes the address, phone and opening hours
 * eligible for the business panel in search.
 */
export const storeJsonLd = (profile: BusinessProfile, locale: string): JsonLdNode | null => {
    if (!profile.address) return null;

    return compact({
        "@type": "HardwareStore",
        "@id": STORE_ID(),
        name: profile.name,
        url: siteOrigin(),
        image: profile.image ?? profile.logo,
        logo: profile.logo,
        telephone: telephone(profile),
        email: profile.email,
        address: {
            "@type": "PostalAddress",
            streetAddress: profile.address,
            addressLocality: LOCALITY[normalizeLocale(locale)],
            postalCode: profile.postalCode,
            addressCountry: "AZ",
        },
        geo: profile.coordinates
            ? { "@type": "GeoCoordinates", ...profile.coordinates }
            : undefined,
        hasMap: profile.mapUrl,
        openingHoursSpecification: profile.openingHours.length > 0
            ? adminOpeningHours(profile.openingHours)
            : openingHours(profile.workHours),
        sameAs: profile.sameAs,
        parentOrganization: { "@id": ORGANIZATION_ID() },
    });
};

type Crumb = { label?: unknown; href?: string };

/**
 * The breadcrumb trail a page draws, as the trail a result page shows instead
 * of the url. The page passes the same items its breadcrumb renders.
 */
export const breadcrumbJsonLd = (items: readonly Crumb[], currentUrl?: string): JsonLdNode | null => {
    const crumbs = items
        .map((item) => ({ name: toPlainText(item.label), url: absoluteUrl(item.href) }))
        .filter((crumb) => crumb.name);

    if (crumbs.length < 2) return null;

    return {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) =>
            compact({
                "@type": "ListItem",
                position: index + 1,
                name: crumb.name,
                item: crumb.url ?? (index === crumbs.length - 1 ? currentUrl : undefined),
            })),
    };
};

type ProductJsonLdInput = {
    name: string;
    url?: string;
    description?: string;
    images: readonly string[];
    sku?: string;
    mpn?: string;
    brand?: string;
    category?: string;
    properties: ReadonlyArray<{ label: string; value: string }>;
    price?: number;
    inStock: boolean;
};

export const productJsonLd = (product: ProductJsonLdInput): JsonLdNode =>
    compact({
        "@type": "Product",
        // Admin names carry stray double spaces ("Drel GSB 600  BOSCH").
        name: product.name.replace(/\s+/g, " ").trim(),
        url: product.url,
        image: [...product.images],
        description: product.description,
        sku: product.sku,
        mpn: product.mpn,
        brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
        category: product.category,
        additionalProperty: product.properties.map((property) => ({
            "@type": "PropertyValue",
            name: property.label,
            value: property.value,
        })),
        // A product with no price shown is left without an offer: a 0.00 AZN
        // offer would be read as a free product.
        offers: typeof product.price === "number" && product.price > 0
            ? compact({
                "@type": "Offer",
                url: product.url,
                price: product.price.toFixed(2),
                priceCurrency: "AZN",
                availability: product.inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                seller: { "@id": ORGANIZATION_ID() },
            })
            : undefined,
    });

type CollectionJsonLdInput = {
    name: string;
    url?: string;
    description?: string;
    /** The pages the list links to, in the order it shows them. */
    itemUrls: ReadonlyArray<string | undefined>;
    /** Where this page's items start in the whole list: 1 on page one. */
    startPosition?: number;
    about?: JsonLdNode;
};

/**
 * A listing page — a category, a brand, the brand index — and the pages it
 * lists, by url only. Google shows product details for a product's own page,
 * never for a list, so the full Product markup stays there.
 */
export const collectionPageJsonLd = (collection: CollectionJsonLdInput): JsonLdNode => {
    const start = Math.max(1, collection.startPosition ?? 1);
    const urls = collection.itemUrls.filter((url): url is string => Boolean(url));

    return compact({
        "@type": "CollectionPage",
        name: collection.name,
        url: collection.url,
        description: collection.description,
        about: collection.about,
        isPartOf: { "@id": WEBSITE_ID() },
        mainEntity: urls.length > 0
            ? {
                "@type": "ItemList",
                itemListElement: urls.map((url, index) => ({
                    "@type": "ListItem",
                    position: start + index,
                    url,
                })),
            }
            : undefined,
    });
};

type ArticleJsonLdInput = {
    headline: string;
    url?: string;
    description?: string;
    image?: string | null;
    datePublished?: string | null;
    dateModified?: string | null;
    locale: string;
    type?: "Article" | "BlogPosting" | "NewsArticle";
};

export const articleJsonLd = (article: ArticleJsonLdInput): JsonLdNode =>
    compact({
        "@type": article.type ?? "Article",
        // Google cuts headlines past 110 characters.
        headline: clampDescription(toPlainText(article.headline), 110),
        url: article.url,
        mainEntityOfPage: article.url,
        description: article.description,
        image: absoluteUrl(article.image),
        datePublished: toIsoDateTime(article.datePublished),
        dateModified: toIsoDateTime(article.dateModified ?? article.datePublished),
        inLanguage: normalizeLocale(article.locale),
        author: { "@id": ORGANIZATION_ID() },
        publisher: { "@id": ORGANIZATION_ID() },
    });

type BlogJsonLdInput = {
    name: string;
    url?: string;
    description?: string;
    locale: string;
    posts: ReadonlyArray<{ headline: string; url?: string; image?: string | null; datePublished?: string | null }>;
};

export const blogJsonLd = (blog: BlogJsonLdInput): JsonLdNode =>
    compact({
        "@type": "Blog",
        name: blog.name,
        url: blog.url,
        description: blog.description,
        inLanguage: normalizeLocale(blog.locale),
        publisher: { "@id": ORGANIZATION_ID() },
        blogPost: blog.posts
            .filter((post) => post.url && toPlainText(post.headline))
            .map((post) => compact({
                "@type": "BlogPosting",
                headline: clampDescription(toPlainText(post.headline), 110),
                url: post.url,
                image: absoluteUrl(post.image),
                datePublished: toIsoDateTime(post.datePublished),
            })),
    });

/**
 * A product card's page, whichever shape the list endpoint gave the card in:
 * the category list nests the slug under `variation`, older lists carry it at
 * the top.
 */
export const listedProductUrl = (item: unknown, locale: string) => {
    const record = (item ?? {}) as {
        slug?: unknown;
        variation?: { slug?: unknown } | null;
        product?: { variation?: { slug?: unknown } | null } | null;
    };
    const slug = String(record.product?.variation?.slug ?? record.variation?.slug ?? record.slug ?? "")
        .trim()
        .replace(/^\/+|\/+$/g, "");

    return slug ? absoluteUrl(`/${locale}/products/${slug}`) : undefined;
};

/** What every home page says about the site: who runs it, and the store. */
export const siteJsonLdNodes = (
    profile: BusinessProfile | undefined,
    locale: string,
    locales: readonly string[],
): Array<JsonLdNode | null> =>
    profile
        ? [organizationJsonLd(profile), websiteJsonLd(profile, locales), storeJsonLd(profile, locale)]
        : [];

export const contactPageJsonLd = (name: string, url: string | undefined): JsonLdNode =>
    compact({
        "@type": "ContactPage",
        name,
        url,
        about: { "@id": STORE_ID() },
        isPartOf: { "@id": WEBSITE_ID() },
    });

/**
 * The markup for one page. `<` is escaped so a cms value holding
 * "</script>" cannot end the tag early.
 */
export const serializeJsonLd = (nodes: ReadonlyArray<JsonLdNode | null | undefined>) => {
    const graph = nodes.filter((node): node is JsonLdNode => Boolean(node));
    if (graph.length === 0) return null;

    return JSON.stringify({ "@context": SCHEMA_CONTEXT, "@graph": graph }).replace(/</g, "\\u003c");
};

const isJsonLdObject = (value: unknown): value is JsonLdNode =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The JSON-LD an admin pasted into a page's (or the site's) SEO tab, returned
 * by the API as `seo.extra_schema`: an object, an array of objects, or null.
 * It goes out as its own script, apart from the graph built above, exactly as
 * written except that a node without `@context` gets schema.org's. The admin
 * side already rejected anything without an `@type`.
 */
export const serializeExtraSchema = (value: unknown) => {
    const nodes = (Array.isArray(value) ? value : [value])
        .filter(isJsonLdObject)
        .map((node) => ("@context" in node ? node : { "@context": SCHEMA_CONTEXT, ...node }));

    if (nodes.length === 0) return null;

    const payload = nodes.length === 1 ? nodes[0] : nodes;
    return JSON.stringify(payload).replace(/</g, "\\u003c");
};
