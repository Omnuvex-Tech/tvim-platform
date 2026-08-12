import type { SiteLocale } from "@/lib/site-locales";

/**
 * /services/{slug} used to be its own page, publishing four concepts under a
 * slug of its own. Three of them have always had a real cms page at a
 * different url (korporativ, geri-qaytarma-ve-deyisdirilme, bonus-kartlari);
 * the fourth (a free-delivery teaser) never had a cms entry at all. Now that
 * the separate page is gone, every spelling that used to resolve there is
 * mapped onto the real page this locale serves instead.
 */
const LEGACY_SERVICE_TARGETS: Record<string, Record<SiteLocale, string>> = {
    "bonus-kartlari": { az: "bonus-kartlari", en: "bonus-cards", ru: "bonusnye-karty" },
    "bonus-cards": { az: "bonus-kartlari", en: "bonus-cards", ru: "bonusnye-karty" },
    "bonusnye-karty": { az: "bonus-kartlari", en: "bonus-cards", ru: "bonusnye-karty" },

    // The old /services/ slugs (geriqaytarma/returns/vozvrat) share no
    // wording with the cms's own — a fuzzy Azerbaijani-stem match would not
    // have caught this, so every known spelling is listed explicitly.
    geriqaytarma: { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },
    returns: { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },
    vozvrat: { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },
    "geri-qaytarma-ve-deyisdirilme": { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },
    "redemption-and-replacement": { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },
    "iskuplenie-i-zamena": { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },

    "korporativ-satis": { az: "korporativ", en: "korporativ", ru: "korporativ" },
    "corporate-sales": { az: "korporativ", en: "korporativ", ru: "korporativ" },
    "korporativnye-prodazhi": { az: "korporativ", en: "korporativ", ru: "korporativ" },

    // No cms entry ever existed for this specific teaser — "Çatdırılma və
    // ödəniş" (delivery & payment terms) is the closest real page. A
    // judgment call, not a confirmed content match.
    "pulsuz-catdirilma": { az: "catdirilma-ve-odenis", en: "delivery-and-payment", ru: "dostavka-i-oplata" },
    "free-delivery": { az: "catdirilma-ve-odenis", en: "delivery-and-payment", ru: "dostavka-i-oplata" },
    "besplatnaya-dostavka": { az: "catdirilma-ve-odenis", en: "delivery-and-payment", ru: "dostavka-i-oplata" },
};

export function resolveLegacyServicePath(slug: string, locale: SiteLocale): string | null {
    const normalized = (() => {
        try {
            return decodeURIComponent(String(slug ?? ""));
        } catch {
            return String(slug ?? "");
        }
    })()
        .trim()
        .toLowerCase();

    const target = LEGACY_SERVICE_TARGETS[normalized]?.[locale];
    return target ? `/${locale}/${target}` : null;
}
