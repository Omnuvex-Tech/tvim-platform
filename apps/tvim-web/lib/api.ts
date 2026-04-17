import { config } from "@/config";
import { ApiResponse } from "@/classes";
import type { ApiResponseBody } from "@repo/types/types";

type RequestOptions = RequestInit & {
    params?: Record<string, string>;
    locale?: string;
};

const request = async <T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    const { params, locale, ...init } = options;

    const url = new URL(`${config.api.url}${endpoint}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.api.timeout);

    const response = await fetch(url.toString(), {
        ...init,
        signal: controller.signal,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(locale && { "Content-Language": locale }),
            ...init.headers,
        },
    });

    clearTimeout(timeout);

    const body = await response.json() as ApiResponseBody<T>;

    return new ApiResponse<T>(body);
};

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) => {
        return request<T>(endpoint, { ...options, method: "GET" });
    },

    post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
        return request<T>(endpoint, {
            ...options,
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
        return request<T>(endpoint, {
            ...options,
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
        return request<T>(endpoint, {
            ...options,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    delete: <T>(endpoint: string, options?: RequestOptions) => {
        return request<T>(endpoint, { ...options, method: "DELETE" });
    },
};
