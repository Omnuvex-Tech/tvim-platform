import { serializeExtraSchema, serializeJsonLd, type JsonLdNode } from "@/lib/structured-data";

/**
 * A page's structured data. Pages pass the nodes that describe them; empty
 * entries are skipped, so a builder that had nothing to say can return null.
 */
export function JsonLd({ nodes }: { nodes: ReadonlyArray<JsonLdNode | null | undefined> }) {
    const json = serializeJsonLd(nodes);
    if (!json) return null;

    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/**
 * Schema the admin wrote by hand (`seo.extra_schema`). Rendered as a script of
 * its own so it never mixes with the graph the site builds.
 */
export function ExtraJsonLd({ value }: { value: unknown }) {
    const json = serializeExtraSchema(value);
    if (!json) return null;

    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
