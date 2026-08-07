/**
 * Azerbaijani-aware relevance helpers for the live search dropdown.
 *
 * The live-search API only returns a category once the query matches its full
 * name, and it returns whatever it finds in catalog order rather than by
 * relevance. Both problems are handled on the client: results are re-ranked
 * here, and the navbar merges matches from the locally available category tree
 * so a partially typed name still surfaces the category it belongs to.
 */

export type PreparedSearchQuery = {
    text: string;
    tokens: string[];
};

/**
 * Lowercases and strips diacritics so "materiallari" matches "materialları".
 * NFD decomposition covers ç/ğ/ö/ş/ü/İ; ə and ı have no decomposition and are
 * folded explicitly.
 */
export function normalizeSearchText(value: unknown): string {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\p{M}]/gu, "")
        .toLowerCase()
        .replace(/ə/g, "e")
        .replace(/ı/g, "i")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

export function prepareSearchQuery(query: string): PreparedSearchQuery {
    const text = normalizeSearchText(query);
    return {
        text,
        tokens: text ? text.split(" ").filter(Boolean) : [],
    };
}

const SCORE_EXACT = 120;
const SCORE_PREFIX = 100;
const SCORE_WORD_PREFIX = 85;
const SCORE_CONTAINS = 70;
const SCORE_TOKEN_BASE = 20;
const SCORE_TOKEN_COVERAGE = 40;
const SCORE_LEADING_TOKEN_BONUS = 8;

/** Minimum token length before a target word is allowed to match a longer query word. */
const REVERSE_PREFIX_MIN_LENGTH = 3;

/**
 * Returns 0 when the text does not match the query at all, otherwise a score
 * where a whole-string match beats a prefix, which beats a per-word match.
 */
export function getSearchRelevance(text: unknown, query: PreparedSearchQuery): number {
    const target = normalizeSearchText(text);
    if (!target || !query.text) return 0;

    if (target === query.text) return SCORE_EXACT;
    if (target.startsWith(query.text)) return SCORE_PREFIX;
    if (target.includes(` ${query.text}`)) return SCORE_WORD_PREFIX;
    if (target.includes(query.text)) return SCORE_CONTAINS;

    const targetTokens = target.split(" ").filter(Boolean);
    if (targetTokens.length === 0 || query.tokens.length === 0) return 0;

    let matchedTokens = 0;
    for (const token of query.tokens) {
        const isMatch = targetTokens.some(
            (targetToken) =>
                targetToken.startsWith(token) ||
                // "materialları" should still match a category named "material".
                (targetToken.length >= REVERSE_PREFIX_MIN_LENGTH && token.startsWith(targetToken))
        );
        if (isMatch) matchedTokens += 1;
    }

    if (matchedTokens === 0) return 0;

    const coverage = matchedTokens / query.tokens.length;
    const firstQueryToken = query.tokens[0];
    const leadsWithQuery = Boolean(firstQueryToken && targetTokens[0]?.startsWith(firstQueryToken));

    return (
        SCORE_TOKEN_BASE +
        coverage * SCORE_TOKEN_COVERAGE +
        (leadsWithQuery ? SCORE_LEADING_TOKEN_BONUS : 0)
    );
}

/** Secondary fields (model, sku…) can match, but never outrank a name match. */
const SECONDARY_FIELD_WEIGHT = 0.6;

export function getBestSearchRelevance(texts: unknown[], query: PreparedSearchQuery): number {
    let best = 0;

    texts.forEach((text, index) => {
        const weight = index === 0 ? 1 : SECONDARY_FIELD_WEIGHT;
        const score = getSearchRelevance(text, query) * weight;
        if (score > best) best = score;
    });

    return best;
}

/**
 * Orders items by relevance, keeping the original order between equally
 * relevant entries and preferring the shorter name (a parent category should
 * come before the longer child names that also match).
 */
export function sortBySearchRelevance<T>(
    items: T[],
    query: string | PreparedSearchQuery,
    getTexts: (item: T) => unknown[]
): T[] {
    const prepared = typeof query === "string" ? prepareSearchQuery(query) : query;
    if (!prepared.text || items.length < 2) return items;

    return items
        .map((item, index) => {
            const texts = getTexts(item);
            return {
                item,
                index,
                score: getBestSearchRelevance(texts, prepared),
                length: normalizeSearchText(texts[0]).length,
            };
        })
        .sort((a, b) => b.score - a.score || a.length - b.length || a.index - b.index)
        .map((entry) => entry.item);
}

export type CategoryTreeNode = {
    id?: string | number | null;
    name?: string | null;
    title?: string | null;
    link?: string | null;
    multi_links?: Record<string, string> | null;
    image?: string | null;
    icon?: { image?: string | null } | null;
    children?: CategoryTreeNode[] | null;
};

export type FlatCategoryEntry = {
    id: string | number;
    name: string;
    /** Locale-resolved path without a leading slash. */
    link: string;
    imageUrl: string;
    /** 0 for a root category; used to suggest broader categories first. */
    depth: number;
};

/** Flattens a nested category tree into a list that can be matched against. */
export function flattenCategoryTree(nodes: unknown, locale: string): FlatCategoryEntry[] {
    const normalizedLocale = String(locale || "az").trim().toLowerCase();
    const flattened: FlatCategoryEntry[] = [];
    const seen = new Set<string>();

    const walk = (candidates: unknown, depth: number) => {
        if (!Array.isArray(candidates)) return;

        for (const candidate of candidates) {
            if (!candidate || typeof candidate !== "object") continue;

            const node = candidate as CategoryTreeNode;
            const name = String(node.name ?? node.title ?? "").trim();
            const link = String(node.multi_links?.[normalizedLocale] || node.link || "")
                .trim()
                .replace(/^\/+/, "");
            const key = String(node.id ?? link);

            if (name && link && !seen.has(key)) {
                seen.add(key);
                flattened.push({
                    id: node.id ?? link,
                    name,
                    link,
                    imageUrl: String(node.icon?.image ?? node.image ?? ""),
                    depth,
                });
            }

            walk(node.children, depth + 1);
        }
    };

    walk(nodes, 0);
    return flattened;
}

/** Keeps weak token matches out once a clearly better match exists. */
const CATEGORY_MATCH_SCORE_RATIO = 0.6;

/**
 * Picks the categories worth suggesting for a query, best match first.
 *
 * The live-search API only returns a category once the query matches its full
 * name, so partially typed names are matched against the locally available
 * category tree instead.
 */
export function matchCategories(
    categories: FlatCategoryEntry[],
    query: string,
    limit: number
): FlatCategoryEntry[] {
    if (categories.length === 0 || limit <= 0) return [];

    const prepared = prepareSearchQuery(query);
    if (!prepared.text) return [];

    const scored = categories
        .map((category) => ({ category, score: getSearchRelevance(category.name, prepared) }))
        .filter((entry) => entry.score > 0);

    if (scored.length === 0) return [];

    const bestScore = scored.reduce((best, entry) => Math.max(best, entry.score), 0);

    return scored
        .filter((entry) => entry.score >= bestScore * CATEGORY_MATCH_SCORE_RATIO)
        .sort(
            (a, b) =>
                b.score - a.score ||
                // Equally relevant? Offer the broader category before its children.
                a.category.depth - b.category.depth ||
                a.category.name.length - b.category.name.length
        )
        .slice(0, limit)
        .map((entry) => entry.category);
}
