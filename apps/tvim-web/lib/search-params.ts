/** The shape Next hands a page for its query string. */
export type RouteSearchParams = Record<string, string | string[] | undefined>;

/**
 * The same query string as a `URLSearchParams`, so the helpers that read a
 * gateway's return url work the same whether they are handed a request or a
 * page's own params. A repeated key keeps its first value, which is what a
 * gateway means by it.
 */
export const toSearchParams = (entries: RouteSearchParams) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(entries)) {
        if (value === undefined) continue;
        params.set(key, Array.isArray(value) ? (value[0] ?? "") : value);
    }

    return params;
};

/** The same path with a page's query string put back on it, if it had one. */
export const withQuery = (path: string, entries: RouteSearchParams) => {
    const query = toSearchParams(entries).toString();
    return query ? `${path}?${query}` : path;
};
