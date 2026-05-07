import { config } from "@/config";
import { ApiResponse } from "@/classes";
import type { ApiResponseBody, RequestOptions } from "@repo/types/types";

export class ApiClient {
    baseUrl: string;
    timeout: number;

    constructor(baseUrl: string = config.api.url, timeout: number = config.api.timeout) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        const { params, locale: requestedLocale, ...init } = options;
        const locale = typeof requestedLocale === "string" ? requestedLocale.trim().toLowerCase() : "";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.append(key, value);
                });
            }

            const response = await fetch(url.toString(), {
                ...init,
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...init.headers,
                    ...(locale ? { "Content-Language": locale } : null),
                },
            });

            const text = await response.text();
            const parsedBody = text ? (JSON.parse(text) as ApiResponseBody<T>) : null;

            if (parsedBody && typeof parsedBody.success === "boolean") {
                return new ApiResponse<T>(parsedBody);
            }

            return new ApiResponse<T>({
                success: false,
                message: "API-dan gözlənilməz cavab gəldi",
                data: null,
                errors: [
                    {
                        code: response.status ? `HTTP_${response.status}` : "INVALID_RESPONSE",
                        message: response.statusText || "Gözlənilməz cavab formatı",
                    },
                ],
            });
        } catch (error: unknown) {
            const errorName = typeof error === "object" && error !== null && "name" in error
                ? String((error as { name: string }).name)
                : "";

            const isTimeout = errorName === "AbortError";
            const message = error instanceof Error ? error.message : "Naməlum xəta";

            return new ApiResponse<T>({
                success: false,
                message: isTimeout ? "API sorğusunun vaxtı bitdi" : "API sorğusu alınmadı",
                data: null,
                errors: [
                    {
                        code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
                        message,
                    },
                ],
            });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    get<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "GET" });
    }
    post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: "PUT",
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: "PATCH",
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: "DELETE" });
    }
}
