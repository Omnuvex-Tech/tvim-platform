import type { JsonLdNode } from "@/lib/structured-data";

/**
 * The schema the backend builds for a page, read from the page's own api
 * response (`seo.schema`, `active_variation.schema`, `values[].schema`).
 *
 * The backend generates it from the same data the page renders and lays the
 * admin's edits over it, so when it is there the page prints it as it came.
 * When it is missing — a response from before the backend carried it, or one
 * that has none — the caller falls back to the schema built on this side.
 *
 * Only well-formed nodes are kept: objects with an `@type`. `@context` is
 * dropped from each, since the page's graph declares it once.
 */
export const readApiSchema = (value: unknown): JsonLdNode[] | null => {
    if (!Array.isArray(value)) return null;

    const nodes = value
        .filter((node): node is JsonLdNode =>
            typeof node === "object" && node !== null && !Array.isArray(node) && "@type" in node)
        .map((node) => Object.fromEntries(Object.entries(node).filter(([key]) => key !== "@context")));

    return nodes.length > 0 ? nodes : null;
};

const hasType = (node: JsonLdNode, type: string) => ([] as unknown[]).concat(node["@type"]).includes(type);

/** The nodes of any of the given types, in the order they came. */
export const nodesOfType = (nodes: readonly JsonLdNode[] | null | undefined, types: readonly string[]) =>
    (nodes ?? []).filter((node) => types.some((type) => hasType(node, type)));

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

        if (hasType(node, "CollectionPage")) {
            const mainEntity = node.mainEntity ? undefined : itemListJsonLd(listing.itemUrls ?? [], listing.startPosition);
            return { ...node, ...url, ...(mainEntity ? { mainEntity } : null) };
        }

        if (hasType(node, "Blog")) {
            const posts = node.blogPost ? [] : listing.posts ?? [];
            return { ...node, ...url, ...(posts.length > 0 ? { blogPost: posts } : null) };
        }

        return node;
    });
