type StatusLike = {
    code?: string | null;
    text?: string | null;
} | null | undefined;

/** Codes reach us as "on-hold", "On Hold" or "on_hold" depending on the endpoint. */
const normalizeStatusCode = (code: string | null | undefined) =>
    (code ?? "").toString().trim().toLowerCase().replace(/[\s-]+/g, "_");

/**
 * The api labels statuses in a single language, so the code is translated here
 * and the api text is kept only for codes this map has not seen yet.
 */
export const statusLabel = (status: StatusLike, labels: Record<string, string>) => {
    const translated = labels[normalizeStatusCode(status?.code)];
    if (translated) return translated;

    return (status?.text ?? "").toString();
};
