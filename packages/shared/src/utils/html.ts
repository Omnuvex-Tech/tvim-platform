const NAMED_ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    laquo: "«",
    raquo: "»",
    ldquo: "“",
    rdquo: "”",
    lsquo: "‘",
    rsquo: "’",
    ndash: "–",
    mdash: "—",
    hellip: "…",
    middot: "·",
    bull: "•",
    deg: "°",
    euro: "€",
    pound: "£",
    copy: "©",
    reg: "®",
    trade: "™",
    agrave: "à",
    aacute: "á",
    acirc: "â",
    atilde: "ã",
    auml: "ä",
    aring: "å",
    ccedil: "ç",
    egrave: "è",
    eacute: "é",
    ecirc: "ê",
    euml: "ë",
    igrave: "ì",
    iacute: "í",
    icirc: "î",
    iuml: "ï",
    ntilde: "ñ",
    ograve: "ò",
    oacute: "ó",
    ocirc: "ô",
    otilde: "õ",
    ouml: "ö",
    oslash: "ø",
    ugrave: "ù",
    uacute: "ú",
    ucirc: "û",
    uuml: "ü",
    yacute: "ý",
    yuml: "ÿ",
    szlig: "ß",
};

const decodeEntity = (entity: string, body: string) => {
    if (body.startsWith("#")) {
        const isHex = body[1] === "x" || body[1] === "X";
        const codePoint = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
        if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return entity;
        try {
            return String.fromCodePoint(codePoint);
        } catch {
            return entity;
        }
    }

    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named ?? entity;
};

export const htmlToText = (value: unknown) => {
    const raw = String(value ?? "");
    if (!raw) return "";

    return raw
        .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6]|\/tr)\b[^>]*>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, decodeEntity)
        .replace(/\s+/g, " ")
        .trim();
};
