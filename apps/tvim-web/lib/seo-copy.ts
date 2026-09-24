import { htmlToText } from "@repo/shared/utils";
import type { SiteLocale } from "@/lib/site-locales";
import { normalizeLocale } from "@/lib/site-locales";

/**
 * Plain text out of a cms field, whatever shape its markup arrived in.
 *
 * Some fields hold html, and some hold html that was entity-encoded on the way
 * in — a product description that reads "&lt;p&gt;EMTOP EMAMAX0600 is…". One
 * pass handles either but not both: stripping tags leaves the encoded form
 * untouched, and decoding it turns it back into tags that then have to go.
 */
export const toPlainText = (value: unknown) => {
    const once = htmlToText(value);
    return /<[^>]+>/.test(once) ? htmlToText(once) : once;
};

/**
 * The sentences a page falls back to when the cms holds no description for it.
 *
 * They used to be written inline at each call site, in one language and with
 * the Azerbaijani letters missing — "Knauf brandina aid mehsullar ve teklifleri
 * TVIM daxilinde kesf edin" was served on /az, /en and /ru alike. Keeping them
 * here means a page picks a sentence rather than writes one, and every sentence
 * exists in all three languages.
 *
 * Each stays well inside the ~160 characters a result page shows, and none of
 * them promises anything the page does not actually have: no delivery terms, no
 * guarantees, no prices that the catalogue alone cannot back up.
 */

const SITE_NAME: Record<SiteLocale, string> = {
    az: "TVİM",
    en: "TVIM",
    ru: "TVIM",
};

/** A brand's own page. */
export const brandDescription = (locale: string, brand: string) => {
    const site = SITE_NAME[normalizeLocale(locale)];

    switch (normalizeLocale(locale)) {
        case "en":
            return `${brand} products in the ${site} catalogue. Browse the range, compare prices and order online.`;
        case "ru":
            return `Товары бренда ${brand} в каталоге ${site}. Смотрите ассортимент, сравнивайте цены и заказывайте онлайн.`;
        default:
            return `${brand} brendinin məhsulları ${site} kataloqunda. Çeşidə baxın, qiymətləri müqayisə edin və onlayn sifariş verin.`;
    }
};

/** The index that lists every brand. */
export const brandsIndexDescription = (locale: string) => {
    const site = SITE_NAME[normalizeLocale(locale)];

    switch (normalizeLocale(locale)) {
        case "en":
            return `All brands in the ${site} catalogue. Find the construction and repair brand you need and order its products online.`;
        case "ru":
            return `Все бренды в каталоге ${site}. Найдите нужный бренд строительных и ремонтных товаров и закажите онлайн.`;
        default:
            return `${site} kataloqundakı bütün brendlər. Axtardığınız tikinti və təmir brendini tapın və məhsullarını onlayn sifariş edin.`;
    }
};

/** An article whose own text gave nothing to quote. */
export const articleDescription = (locale: string, title: string) => {
    const site = SITE_NAME[normalizeLocale(locale)];

    switch (normalizeLocale(locale)) {
        case "en":
            return `Read about ${title} in the ${site} blog.`;
        case "ru":
            return `Читайте о «${title}» в блоге ${site}.`;
        default:
            return `${title} haqqında ${site} bloqunda oxuyun.`;
    }
};

/**
 * A product with no description of its own. Most of the catalogue is in this
 * state, and repeating the product's name as its description — which is what
 * happened before — gives a result page nothing the title had not already said.
 */
export const productDescription = (
    locale: string,
    { name, brand, category }: { name: string; brand?: string; category?: string },
) => {
    const site = SITE_NAME[normalizeLocale(locale)];
    const subject = brand && !name.toLowerCase().includes(brand.toLowerCase())
        ? `${name} (${brand})`
        : name;

    switch (normalizeLocale(locale)) {
        case "en":
            return category
                ? `${subject} in the ${category} section. Price, specifications and online ordering at ${site}.`
                : `${subject}. Price, specifications and online ordering at ${site}.`;
        case "ru":
            return category
                ? `${subject} в разделе «${category}». Цена, характеристики и онлайн-заказ на ${site}.`
                : `${subject}. Цена, характеристики и онлайн-заказ на ${site}.`;
        default:
            return category
                ? `${subject} — ${category} bölməsində. Qiymət, xüsusiyyətlər və onlayn sifariş ${site} saytında.`
                : `${subject}. Qiymət, xüsusiyyətlər və onlayn sifariş ${site} saytında.`;
    }
};

/**
 * A section or information page the cms wrote no description for.
 *
 * It names the page rather than repeating one sentence across the site: a
 * boilerplate description shared by every page is worth less than none, while
 * a missing one leaves a result page to quote whatever text it finds first,
 * which on these pages is the navigation.
 */
export const pageDescription = (locale: string, title: string) => {
    const site = SITE_NAME[normalizeLocale(locale)];

    switch (normalizeLocale(locale)) {
        case "en":
            return `${title} — ${site}. Construction and repair materials: browse the catalogue and order online.`;
        case "ru":
            return `${title} — ${site}. Строительные и ремонтные материалы: смотрите каталог и заказывайте онлайн.`;
        default:
            return `${title} — ${site}. Tikinti və təmir materialları: kataloqa baxın və onlayn sifariş verin.`;
    }
};

/**
 * A description cut to length at a word boundary.
 *
 * Slicing a stripped article body at a fixed count, which is what the pages did
 * before, ends the sentence mid-word — "…keramika yapışdırıcısı ilə divar plit".
 */
export const clampDescription = (text: string, max = 160) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;

    const cut = clean.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");

    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:—-]+$/, "")}…`;
};

/**
 * Whether a cms description says anything the title did not.
 *
 * Most of the catalogue comes back with `meta_description` set to the product's
 * own name, so a result page would print the title twice. Such a description is
 * treated as absent and the built one is used in its place.
 */
export const saysMoreThan = (description: string, ...titles: Array<string | undefined>) => {
    const norm = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();
    const body = norm(description);

    return body.length > 0 && !titles.some((title) => title && norm(title) === body);
};

/** Roughly what a result page shows of a title before it cuts it off. */
const MAX_TITLE_LENGTH = 60;

/** Shorter than this, a cms description is a label rather than a description. */
const MIN_DESCRIPTION_LENGTH = 50;

/**
 * The site's name on the end of a title, unless the title already carries it
 * or has no room left for it.
 *
 * A cms title often ends in "– TVİM" already, and a suffix added on top would
 * read twice. A title already near the cut-off loses the suffix to the cut
 * anyway, so adding it there only pushes the page's own words further out.
 */
export const withSiteName = (locale: string, title: string) => {
    const site = SITE_NAME[normalizeLocale(locale)];
    const alreadyNamed = /tv[iİı]m/i.test(title);
    const named = `${title} | ${site}`;

    return alreadyNamed || named.length > MAX_TITLE_LENGTH ? title : named;
};

/**
 * The cms title when it says more than the page's own name, and nothing when it
 * does not — the caller then falls back to the name.
 *
 * "Termet" as the meta title of the Termet brand adds nothing; "KAS Radiator
 * Ventilləri | Keyfiyyətli İstilik Sistemi Hissələri – TVİM" is what the admin
 * wrote the page to be found by.
 */
export const pickTitle = (cms: unknown, name: string) => {
    const text = toPlainText(cms);
    return text && saysMoreThan(text, name) ? text : "";
};

/**
 * The cms description when it is one, and nothing when it is not: empty, a
 * repeat of the title, or a single word like the "Brend" the brand index holds.
 */
export const pickDescription = (cms: unknown, ...titles: Array<string | undefined>) => {
    const text = toPlainText(cms);
    return text.length >= MIN_DESCRIPTION_LENGTH && saysMoreThan(text, ...titles)
        ? clampDescription(text)
        : "";
};
