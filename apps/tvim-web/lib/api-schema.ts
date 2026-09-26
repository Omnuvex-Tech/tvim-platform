import type { JsonLdNode } from "@/lib/structured-data";

/**
 * The schema the backend builds for a page, read from the page's own api
 * response.
 *
 * The backend generates it from the same data the page renders and lays the
 * admin's edits over it, so when it is there the page prints it as it came.
 * When it is missing — a response that has none — the caller falls back to the
 * schema built on this side.
 *
 * A single node is accepted as well as a list: the backend writes one node per
 * page under `structured_data`, and a list is the shape it grows into once a
 * page needs more than one. Only well-formed nodes are kept — objects with an
 * `@type` — and `@context` is dropped from each, since the page's graph
 * declares it once.
 */
export const readApiSchema = (value: unknown): JsonLdNode[] | null => {
    const list = Array.isArray(value) ? value : value == null ? [] : [value];

    const nodes = list
        .filter((node): node is JsonLdNode =>
            typeof node === "object" && node !== null && !Array.isArray(node) && "@type" in node)
        .map((node) => Object.fromEntries(Object.entries(node).filter(([key]) => key !== "@context")));

    return nodes.length > 0 ? nodes : null;
};

/**
 * A page's generated schema, from the `seo` object the api returns for it.
 *
 * `structured_data` is the field the backend actually writes, and the one the
 * admin's SEO tab shows, so both sides read the same place. `schema` is only
 * checked first so a response that already carries the list form wins.
 */
export const readSeoSchema = (seo: unknown): JsonLdNode[] | null => {
    if (typeof seo !== "object" || seo === null || Array.isArray(seo)) return null;

    const record = seo as Record<string, unknown>;
    return readApiSchema(record.schema) ?? readApiSchema(record.structured_data);
};

const hasType = (node: JsonLdNode, type: string) => ([] as unknown[]).concat(node["@type"]).includes(type);

/** The nodes of any of the given types, in the order they came. */
export const nodesOfType = (nodes: readonly JsonLdNode[] | null | undefined, types: readonly string[]) =>
    (nodes ?? []).filter((node) => types.some((type) => hasType(node, type)));

/**
 * The backend's nodes, plus the ones built on this side that they do not
 * already cover.
 *
 * The backend describes the page itself; the breadcrumb is walked from the
 * menu tree here, and dropping it because a page node arrived would take a
 * trail out of search results that the api never sent in the first place. A
 * type the backend did send always wins.
 */
export const withLocalNodes = (
    nodes: readonly JsonLdNode[],
    locals: ReadonlyArray<JsonLdNode | null | undefined>,
): JsonLdNode[] => {
    const typesOf = (node: JsonLdNode) => ([] as unknown[]).concat(node["@type"]).map(String);
    const present = new Set(nodes.flatMap(typesOf));

    const missing = locals.filter((node): node is JsonLdNode =>
        Boolean(node) && !typesOf(node as JsonLdNode).some((type) => present.has(type)));

    return [...nodes, ...missing];
};

/** The pages a listing links to, by url, numbered from where this page starts. */
export const itemListJsonLd = (itemUrls: ReadonlyArray<string | undefined>, startPosition = 1): JsonLdNode | undefined => {
    const urls = itemUrls.filter((url): url is string => Boolean(url));
    if (urls.length === 0) return undefined;

    const start = Math.max(1, startPosition);
    return {
        "@type": "ItemList",
        itemListElement: urls.map((url, index) => ({ "@type": "ListItem", position: start + index, url })),
    };
};

type Listing = {
    /** The url this page is published at; page two carries ?page=2. */
    url?: string;
    /** A collection's items: the pages it links to, in the order it shows them. */
    itemUrls?: ReadonlyArray<string | undefined>;
    startPosition?: number;
    /** A blog's posts on this page. */
    posts?: readonly JsonLdNode[];
};

/**
 * A listing page's own items, laid onto the backend's page node. The backend
 * knows what the page is; which products or posts it shows depends on the page
 * number and sort order the visitor asked for, and only this side knows those.
 * A node the admin already gave its own list keeps it.
 */
export const withListing = (nodes: readonly JsonLdNode[], listing: Listing): JsonLdNode[] =>
    nodes.map((node) => {
        const url = listing.url ? { url: listing.url } : null;

        if (hasType(node, "Blog")) {
            const posts = node.blogPost ? [] : listing.posts ?? [];
            return { ...node, ...url, ...(posts.length > 0 ? { blogPost: posts } : null) };
        }

        // `WebPage` is what the backend sends for a listing today; it carries no
        // list of its own, and dropping the items because the node came typed
        // generically would lose the only part of this graph the api cannot
        // know. `mainEntity` is valid on either type.
        if (hasType(node, "CollectionPage") || hasType(node, "WebPage")) {
            const urls = listing.itemUrls ?? (listing.posts ?? []).map((post) => String(post.url ?? ""));
            const mainEntity = node.mainEntity ? undefined : itemListJsonLd(urls, listing.startPosition);
            return { ...node, ...url, ...(mainEntity ? { mainEntity } : null) };
        }

        return node;
    });
