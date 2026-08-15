// The address stored in the admin is prose ("Dərnəgül qəsəbəsi, 2096-ci
// məhəllə…"), so sending it to Google as a search term lands on whatever the
// text happens to match. Coordinates from the embed pin the exact place, and
// the admin's own "Map iframe" field is the source for them.

export const FALLBACK_MAP_EMBED_URL =
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d12148.130766671124!2d49.877831!3d40.430275!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40307f6c2b29febd%3A0x6f282cb15cada9be!2zVFbEsE0!5e0!3m2!1sru!2saz!4v1786695417759!5m2!1sru!2saz";

const isFiniteCoordinate = (value: number, limit: number) =>
    Number.isFinite(value) && Math.abs(value) <= limit;

/** A stray "%" in a pasted iframe would make decodeURIComponent throw mid-render. */
const decodeSafely = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

/** Pulls "lat,lng" out of an embed url, an iframe snippet or a plain maps link. */
export const extractMapCoordinates = (value: unknown) => {
    const raw = decodeSafely(String(value ?? "").trim());
    if (!raw) return "";

    // Embed urls encode the centre as !3d<lat> and !2d<lng>.
    const embedLat = raw.match(/!3d(-?\d+(?:\.\d+)?)/);
    const embedLng = raw.match(/!2d(-?\d+(?:\.\d+)?)/);
    if (embedLat && embedLng) {
        const lat = Number(embedLat[1]);
        const lng = Number(embedLng[1]);
        if (isFiniteCoordinate(lat, 90) && isFiniteCoordinate(lng, 180)) return `${lat},${lng}`;
    }

    // Shared links use @lat,lng or ll=/q= instead.
    const atPair = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    const paramPair = raw.match(/[?&](?:ll|q|query|center)=(-?\d+(?:\.\d+)?)(?:%2C|,)\s*(-?\d+(?:\.\d+)?)/i);
    const pair = atPair ?? paramPair;
    if (pair) {
        const lat = Number(pair[1]);
        const lng = Number(pair[2]);
        if (isFiniteCoordinate(lat, 90) && isFiniteCoordinate(lng, 180)) return `${lat},${lng}`;
    }

    return "";
};

/** The src for the embedded map: the admin's iframe when set, ours otherwise. */
export const resolveMapEmbedUrl = (mapIframe: unknown) => {
    const raw = String(mapIframe ?? "").trim();
    if (!raw) return FALLBACK_MAP_EMBED_URL;

    const fromIframe = raw.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    const candidate = (fromIframe?.[1] ?? raw).trim();

    return /^https?:\/\//i.test(candidate) ? candidate : FALLBACK_MAP_EMBED_URL;
};

/**
 * Google's own listing id. Embeds carry it as !1s0x<feature>:0x<cid>, and the
 * decimal half opens the business card — name, photos, hours — rather than a
 * bare pin.
 */
export const extractMapPlaceId = (value: unknown) => {
    const raw = decodeSafely(String(value ?? "").trim());
    if (!raw) return "";

    const matched = raw.match(/!1s0x[0-9a-f]+:0x([0-9a-f]+)/i) ?? raw.match(/[?&]cid=(\d+)/i);
    if (!matched?.[1]) return "";

    try {
        return matched[1].startsWith("0x") || /[a-f]/i.test(matched[1])
            ? BigInt(`0x${matched[1].replace(/^0x/i, "")}`).toString()
            : matched[1];
    } catch {
        return "";
    }
};

/** Where the address should link to: the listing when known, then the pin, then a text search. */
export const resolveMapLink = (mapIframe: unknown, address: unknown) => {
    // Once the admin sets a map, only that map decides where the link goes —
    // otherwise a different location's embed would still open ours.
    const source = String(mapIframe ?? "").trim() || FALLBACK_MAP_EMBED_URL;

    const placeId = extractMapPlaceId(source);
    if (placeId) {
        return `https://www.google.com/maps?cid=${placeId}`;
    }

    const coordinates = extractMapCoordinates(source);
    if (coordinates) {
        return `https://www.google.com/maps/search/?api=1&query=${coordinates}`;
    }

    const fallbackQuery = String(address ?? "").trim();
    return fallbackQuery
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`
        : "";
};
