import { unstable_cache } from "next/cache";
import type {
    HeaderCategoriesResponseData,
    Language,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { resolveSettingsApiLocale } from "@/lib/settings";

const DATA_CACHE_DISABLED = process.env.NEXT_PUBLIC_DISABLE_DATA_CACHE === "1";

const resolveCacheTtlSeconds = () => {
    if (DATA_CACHE_DISABLED) return 0;
    const configured = Number(process.env.NEXT_PUBLIC_DATA_CACHE_TTL);
    return Number.isFinite(configured) && configured > 0 ? configured : 300;
};

const SETTINGS_REVALIDATE_SECONDS = resolveCacheTtlSeconds();
const NAVIGATION_REVALIDATE_SECONDS = resolveCacheTtlSeconds();
const LANGUAGES_REVALIDATE_SECONDS = resolveCacheTtlSeconds();

type MemoryCacheEntry<T> = {
    createdAt: number;
    promise: Promise<T> | null;
    value: T | null;
};

const navigationMemoryCache = new Map<string, MemoryCacheEntry<unknown>>();
const languagesMemoryCache: MemoryCacheEntry<Language[]> = {
    createdAt: 0,
    promise: null,
    value: null,
};

async function getFromNavigationMemoryCache<T>(key: string, loader: () => Promise<T>) {
    const now = Date.now();
    const existing = navigationMemoryCache.get(key) as MemoryCacheEntry<T> | undefined;

    if (existing?.value && now - existing.createdAt < NAVIGATION_REVALIDATE_SECONDS * 1_000) {
        return existing.value;
    }

    if (existing?.promise) {
        return await existing.promise;
    }

    const promise = loader().then((result) => {
        navigationMemoryCache.set(key, {
            createdAt: Date.now(),
            promise: null,
            value: result,
        });

        return result;
    }).catch((error) => {
        navigationMemoryCache.delete(key);
        throw error;
    });

    navigationMemoryCache.set(key, {
        createdAt: now,
        promise,
        value: null,
    });

    return await promise;
}

async function getCachedLanguages() {
    const now = Date.now();

    if (
        languagesMemoryCache.value &&
        languagesMemoryCache.value.length > 0 &&
        now - languagesMemoryCache.createdAt < LANGUAGES_REVALIDATE_SECONDS * 1_000
    ) {
        return languagesMemoryCache.value;
    }

    if (languagesMemoryCache.promise) {
        return await languagesMemoryCache.promise;
    }

    const promise = api.get<Language[]>(config.endpoints.languages.list).then((response) => {
        const languages = response.success && Array.isArray(response.data) ? response.data : [];

        if (languages.length > 0) {
            languagesMemoryCache.createdAt = Date.now();
            languagesMemoryCache.value = languages;
        } else {
            languagesMemoryCache.createdAt = 0;
            languagesMemoryCache.value = null;
        }

        languagesMemoryCache.promise = null;
        return languages;
    }).catch(() => {
        languagesMemoryCache.promise = null;
        return [];
    });

    languagesMemoryCache.promise = promise;
    return await promise;
}

const getCachedProjectSettingsResponse = unstable_cache(
    async (incomingLocale: string) => {
        const locale = incomingLocale.trim().toLowerCase();
        const response = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            params: { lang: locale },
            locale: resolveSettingsApiLocale(locale),
        });

        return response.success && response.data ? response.data : null;
    },
    ["public-project-settings"],
    { revalidate: Math.max(1, SETTINGS_REVALIDATE_SECONDS), tags: ["public-project-settings"] }
);

async function getCachedMenuList(incomingLocale: string) {
    const locale = incomingLocale.trim().toLowerCase();
    return await getFromNavigationMemoryCache(`menu-list:${locale}`, async () => {
        const locale = incomingLocale.trim().toLowerCase();
        const response = await api.get<unknown>(config.endpoints.menus.list, {
            locale,
        });

        return response.success && response.data ? response.data : null;
    });
}

async function getCachedHeaderCategories(incomingLocale: string) {
    const locale = incomingLocale.trim().toLowerCase();
    return await getFromNavigationMemoryCache(`header-categories:${locale}`, async () => {
        const locale = incomingLocale.trim().toLowerCase();
        const response = await api.get<HeaderCategoriesResponseData>("/product/categories", {
            params: { in_header: "1" },
            locale,
        });

        return response.success && response.data ? response.data : null;
    });
}

async function getCachedMenuDetail<T>(slug: string, incomingLocale: string, dataSlug?: string) {
    const locale = incomingLocale.trim().toLowerCase();
    const cacheKey = `menu-detail:${locale}:${slug}:${dataSlug ?? ""}`;
    return await getFromNavigationMemoryCache(cacheKey, async () => {
        const locale = incomingLocale.trim().toLowerCase();
        const response = await api.get<T>(config.endpoints.menus.detail(slug, dataSlug), {
            params: { lang: locale },
            locale: resolveSettingsApiLocale(locale),
        });

        return response.success && response.data ? response.data : null;
    });
}

export async function getPublicLanguages() {
    return await getCachedLanguages();
}

export async function getPublicProjectSettingsResponse(locale: string) {
    return await getCachedProjectSettingsResponse(locale);
}

export async function getPublicMenuList(locale: string) {
    return await getCachedMenuList(locale);
}

export async function getPublicHeaderCategories(locale: string) {
    return await getCachedHeaderCategories(locale);
}

export async function getPublicMenuDetail<T>(slug: string, locale: string, dataSlug?: string) {
    return await getCachedMenuDetail<T>(slug, locale, dataSlug);
}
