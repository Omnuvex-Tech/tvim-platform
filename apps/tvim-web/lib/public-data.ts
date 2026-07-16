import type {
    HeaderCategoriesResponseData,
    Language,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { resolveSettingsApiLocale } from "@/lib/settings";

export async function getPublicLanguages() {
    const response = await api.get<Language[]>(config.endpoints.languages.list);
    return response.success && Array.isArray(response.data) ? response.data : [];
}

export async function getPublicProjectSettingsResponse(locale: string) {
    const normalizedLocale = locale.trim().toLowerCase();
    const response = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        params: { lang: normalizedLocale },
        locale: resolveSettingsApiLocale(normalizedLocale),
    });

    return response.success && response.data ? response.data : null;
}

export async function getPublicMenuList(locale: string) {
    const normalizedLocale = locale.trim().toLowerCase();
    const response = await api.get<unknown>(config.endpoints.menus.list, {
        locale: normalizedLocale,
    });

    return response.success && response.data ? response.data : null;
}

export async function getPublicHeaderCategories(locale: string) {
    const normalizedLocale = locale.trim().toLowerCase();
    const response = await api.get<HeaderCategoriesResponseData>("/product/categories", {
        params: { in_header: "1" },
        locale: normalizedLocale,
    });

    return response.success && response.data ? response.data : null;
}

export async function getPublicMenuDetail<T>(slug: string, locale: string) {
    const normalizedLocale = locale.trim().toLowerCase();
    const response = await api.get<T>(config.endpoints.menus.detail(slug), {
        params: { lang: normalizedLocale },
        locale: resolveSettingsApiLocale(normalizedLocale),
    });

    return response.success && response.data ? response.data : null;
}
