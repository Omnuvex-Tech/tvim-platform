import { unstable_cache } from "next/cache";
import { cache } from "react";
import type {
    HeaderCategoriesResponseData,
    Language,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { resolveSettingsApiLocale } from "@/lib/settings";

const PUBLIC_DATA_REVALIDATE_SECONDS = 30;

const getCachedLanguages = unstable_cache(
    async () => {
        const response = await api.get<Language[]>(config.endpoints.languages.list);
        return response.success && Array.isArray(response.data) ? response.data : [];
    },
    ["public-languages"],
    { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: ["public-languages"] }
);

const getCachedProjectSettingsResponse = unstable_cache(
    async (locale: string) => {
        const normalizedLocale = locale.trim().toLowerCase();
        const response = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
            params: { lang: normalizedLocale },
            locale: resolveSettingsApiLocale(normalizedLocale),
        });

        return response.success && response.data ? response.data : null;
    },
    ["public-project-settings"],
    { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: ["public-project-settings"] }
);

const getCachedMenuList = unstable_cache(
    async (locale: string) => {
        const normalizedLocale = locale.trim().toLowerCase();
        const response = await api.get<unknown>(config.endpoints.menus.list, {
            locale: normalizedLocale,
        });

        return response.success && response.data ? response.data : null;
    },
    ["public-menu-list"],
    { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: ["public-menu-list"] }
);

const getCachedHeaderCategories = unstable_cache(
    async (locale: string) => {
        const normalizedLocale = locale.trim().toLowerCase();
        const response = await api.get<HeaderCategoriesResponseData>("/product/categories", {
            params: { in_header: "1" },
            locale: normalizedLocale,
        });

        return response.success && response.data ? response.data : null;
    },
    ["public-header-categories"],
    { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: ["public-header-categories"] }
);

const getCachedMenuDetail = unstable_cache(
    async <T>(slug: string, locale: string) => {
        const normalizedLocale = locale.trim().toLowerCase();
        const response = await api.get<T>(config.endpoints.menus.detail(slug), {
            params: { lang: normalizedLocale },
            locale: resolveSettingsApiLocale(normalizedLocale),
        });

        return response.success && response.data ? response.data : null;
    },
    ["public-menu-detail"],
    { revalidate: PUBLIC_DATA_REVALIDATE_SECONDS, tags: ["public-menu-detail"] }
);

export const getPublicLanguages = cache(async () => {
    return await getCachedLanguages();
});

export const getPublicProjectSettingsResponse = cache(async (locale: string) => {
    return await getCachedProjectSettingsResponse(locale);
});

export const getPublicMenuList = cache(async (locale: string) => {
    return await getCachedMenuList(locale);
});

export const getPublicHeaderCategories = cache(async (locale: string) => {
    return await getCachedHeaderCategories(locale);
});

export const getPublicMenuDetail = cache(async <T>(slug: string, locale: string) => {
    return await getCachedMenuDetail<T>(slug, locale);
});
