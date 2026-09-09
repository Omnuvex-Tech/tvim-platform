/**
 * Next Data Cache üçün tag adları.
 *
 * Eyni adlar Laravel tərəfində `Modules\Product\Support\FrontendRevalidator`-də
 * təkrarlanır — biri dəyişəndə o biri də dəyişməlidir, yoxsa admin-dən şəkil
 * yüklənəndə sayt sakitcə köhnə cavabı göstərməyə davam edər.
 */

/** Bütün məhsul məlumatı (siyahı + detal). */
export const PRODUCTS_TAG = "products";

/** Brend siyahıları. */
export const BRANDS_TAG = "brands";

/** Tək bir məhsul. Slug API-dən gəldiyi kimi verilir. */
export const productTag = (slug: string) => `product:${String(slug ?? "").trim()}`;

/**
 * Məhsul cavabları üçün standart keş seçimləri.
 *
 * `revalidate` burada təhlükəsizlik toru rolunu oynayır: birbaşa bazaya yazılan
 * şəkil heç bir tətbiq hadisəsi doğurmur, ona görə tag əsaslı yenilənmə işə
 * düşmür və yeganə zəmanət bu TTL-dir.
 */
export const PRODUCT_REVALIDATE_SECONDS = 60;

export const productCacheOptions = (slug?: string) => ({
    revalidate: PRODUCT_REVALIDATE_SECONDS,
    tags: slug ? [PRODUCTS_TAG, productTag(slug)] : [PRODUCTS_TAG],
});

export const brandCacheOptions = () => ({
    revalidate: PRODUCT_REVALIDATE_SECONDS,
    tags: [BRANDS_TAG],
});
