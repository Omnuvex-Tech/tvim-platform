/**
 * Admin-written html, fitted into a page that already has its own title.
 *
 * The admin editor offers "Heading 1" for section titles, and articles arrive
 * with several of them — /az/korporativ/bosch-partner carried seven <h1>s
 * under the page's own. A page has one H1, its title; headings inside the body
 * are sections of it, so when the body uses H1 every level moves one down
 * (h1 → h2 … h5 → h6) and the outline the editor built stays intact.
 */
export const demoteHeadings = (html: string | null | undefined) => {
    const source = String(html ?? "");
    if (!/<h1[\s>]/i.test(source)) return source;

    return source.replace(/<(\/?)h([1-5])(?=[\s>])/gi, (_, slash: string, level: string) =>
        `<${slash}h${Number(level) + 1}`);
};

const escapeAttribute = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Images the editor inserted without alt text get the page's title as theirs.
 * Pictures in an article are of what the article is about, and a missing alt
 * leaves them unreadable to screen readers and to image search alike. An
 * image that has an alt, even an empty one, is left as the editor set it.
 */
export const fillMissingAlt = (html: string | null | undefined, alt: string | null | undefined) => {
    const source = String(html ?? "");
    const text = String(alt ?? "").replace(/\s+/g, " ").trim();
    if (!text || !/<img\b/i.test(source)) return source;

    return source.replace(/<img\b(?![^>]*\salt\s*=)/gi, `<img alt="${escapeAttribute(text)}"`);
};

/** Both of the above, for a body rendered under a page titled `title`. */
export const prepareContentHtml = (html: string | null | undefined, title: string | null | undefined) =>
    fillMissingAlt(demoteHeadings(html), title);
