import type { SiteLocale } from "@/lib/site-locales";
import { normalizeLocale } from "@/lib/site-locales";

/**
 * How a page's `<meta name="keywords">` is put together.
 *
 * Every page used to reach this tag its own way: a product printed whatever the
 * cms held and nothing at all when the cms held nothing, while the brand and
 * news screens printed a hardcoded `["brand", "brands", "tvim"]` in English on
 * a page written in Azerbaijani. The list is built here instead, so a page only
 * has to say what it is about.
 *
 * What an editor wrote in the admin is used as it stands, with nothing added
 * to it. Only a page nobody wrote keywords for gets a built list: its own
 * subject — its title, its brand, the category above it — and then the
 * site-wide terms.
 */

/**
 * Room for a full admin list, or for a built one with the site's terms in. It
 * was 12, which cut the admin's own lists short — the corporate page has 18
 * written for it.
 */
const MAX_KEYWORDS = 20;

/** A keyword is a phrase, not a sentence; anything longer is a description. */
const MAX_KEYWORD_LENGTH = 60;

/**
 * Terms that hold for every page of the site, in the language the page is
 * written in. A page carries the wording of its own language only — mixing
 * three languages into one tag describes none of them.
 */
const SITE_TERMS: Record<SiteLocale, readonly string[]> = {
    az: ["Tvim", "tikinti materialları", "inşaat materialları", "tikinti mağazası", "onlayn sifariş", "Bakı"],
    en: ["Tvim", "construction materials", "building materials", "construction store", "online store", "Baku"],
    ru: ["Tvim", "строительные материалы", "стройматериалы", "строительный магазин", "интернет-магазин", "Баку"],
};

const clean = (value: unknown) =>
    String(value ?? "")
        // A cms field can hold markup, and a keyword made of tags is worse
        // than no keyword at all.
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

const isUsable = (keyword: string) =>
    keyword.length > 1 &&
    keyword.length <= MAX_KEYWORD_LENGTH &&
    // A bare number describes nothing on its own — it is a price, a size or a
    // year that arrived with the title it was split from.
    !/^[\d\s.,-]+$/.test(keyword);

/**
 * Whatever the api holds for a keywords field, as a list. Arrays, comma or
 * newline separated strings and `{ meta_keywords }` wrappers all appear across
 * the endpoints this site reads, and a page should not have to know which.
 */
export const normalizeKeywords = (raw: unknown): string[] => {
    if (!raw) return [];

    if (Array.isArray(raw)) {
        return raw.flatMap((entry) => normalizeKeywords(entry));
    }

    if (typeof raw === "string") {
        return raw
            .split(/[,\n;|]+/)
            .map(clean)
            .filter(isUsable);
    }

    if (typeof raw === "object") {
        const record = raw as Record<string, unknown>;
        if (record.meta_keywords) return normalizeKeywords(record.meta_keywords);
        if (record.keywords) return normalizeKeywords(record.keywords);
        return [];
    }

    const single = clean(raw);
    return isUsable(single) ? [single] : [];
};

/**
 * One subject as one keyword.
 *
 * Unlike a cms keywords field, a subject is a single phrase that happens to
 * contain punctuation — an article titled "Holcim Tector Ceram 301: Kafel və
 * Keramika İşlərində Peşəkar, Dayanıqlı və Sərfəli Həll" is one thing, and
 * splitting it at its comma leaves half a sentence standing in for it.
 */
const normalizePhrase = (value: unknown): string[] => {
    const phrase = clean(value);
    return isUsable(phrase) ? [phrase] : [];
};

type BuildKeywordsOptions = {
    /** What the cms holds for this page, in whatever shape it holds it. */
    cms?: unknown;
    /**
     * What the page is about, most specific first: a product's name before its
     * brand, a brand before the section it sits in. Empty entries are dropped,
     * so a caller can pass a field that may be missing without guarding it.
     */
    subjects?: Array<string | null | undefined>;
    locale: string;
    /** Left out where a page should carry only its own terms. */
    siteTerms?: boolean;
};

/**
 * The keywords for one page: the cms list when the admin wrote one, and the
 * page's own subject followed by the site-wide terms when nobody did — never
 * the two mixed. Deduplicated and capped either way.
 *
 * A cms list that only repeats the page's own name counts as not written. The
 * admin fills an empty keywords field with the entity's name on its own —
 * "Drel GSB 600 BOSCH" on most products, "Brend" on the brand filter — and
 * taking that at its word would leave those pages a single keyword where the
 * built list has a dozen. The name is still in the built list, as a subject.
 *
 * Deduplication ignores case and surrounding space.
 */
export const buildKeywords = ({
    cms,
    subjects = [],
    locale,
    siteTerms = true,
}: BuildKeywordsOptions): string[] => {
    const siteLocale = normalizeLocale(locale);

    const written = normalizeKeywords(cms);
    const pageSubjects = subjects.flatMap((subject) => normalizePhrase(subject));
    const ownNames = new Set(pageSubjects.map((subject) => subject.toLowerCase()));
    const adminWroteList = written.some((keyword) => !ownNames.has(keyword.toLowerCase()));

    const candidates = adminWroteList
        ? written
        : [...pageSubjects, ...(siteTerms ? SITE_TERMS[siteLocale] : [])];

    const seen = new Set<string>();
    const keywords: string[] = [];

    for (const candidate of candidates) {
        // Deliberately not locale-aware: Azerbaijani lowercases "I" to a
        // dotless "ı", so "TVIM" and "Tvim" compare as two different words
        // under the az locale and both end up in the tag.
        const key = candidate.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        keywords.push(candidate);

        if (keywords.length === MAX_KEYWORDS) break;
    }

    return keywords;
};
