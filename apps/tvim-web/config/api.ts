import { normalizer } from "@repo/shared/utils";

const DEFAULT_TIMEOUT_MS = 30_000;

const publicUrl = normalizer.string(process.env.NEXT_PUBLIC_API_URL);

/**
 * Server tərəfindən edilən sorğular (SSR, route handler-lər, sitemap) backend-ə
 * birbaşa maşının içindən çıxır. Əvvəl bunlar da https://admin.tvim.az-a gedirdi,
 * yəni sorğu Cloudflare-ə çıxıb eyni serverə qayıdırdı.
 *
 * INTERNAL_API_URL qəsdən NEXT_PUBLIC_ deyil — belə olduqda Next.js onu brauzer
 * paketinə daxil etmir. `typeof window` yoxlaması isə əlavə təhlükəsizlik qatıdır:
 * brauzerdə həmişə ictimai ünvan işlədilir.
 */
const isServer = typeof window === "undefined";
// normalizer.string() undefined dəyərdə exception atır, ona görə əvvəlcə mövcudluğu
// yoxlanılır: dəyişən təyin edilməyibsə sadəcə ictimai ünvana qayıdılır.
const internalUrl =
    isServer && process.env.INTERNAL_API_URL
        ? normalizer.string(process.env.INTERNAL_API_URL)
        : "";

export const api = {
    url: internalUrl || publicUrl,
    publicUrl,
    timeout: normalizer.number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? DEFAULT_TIMEOUT_MS),
} as const;
