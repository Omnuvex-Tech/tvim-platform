import { config } from "@/config";
import { ApiResponse } from "@/classes";
import type { ApiResponseBody, RequestOptions } from "@repo/types/types";
import { isDevelopmentRuntime } from "@/lib/runtime-env";

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
        const method = typeof init.method === "string" ? init.method.toUpperCase() : "GET";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        const startedAt =
            typeof performance !== "undefined" && typeof performance.now === "function"
                ? performance.now()
                : Date.now();

        try {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            if (params) {
                const shouldStripMenuFilters = endpoint === config.endpoints.menus.list;
                Object.entries(params).forEach(([key, value]) => {
                    if (shouldStripMenuFilters && (key === "in_footer" || key === "in_header")) {
                        return;
                    }
                    url.searchParams.append(key, value);
                });
            }

            const recordServerMetric = async (status: number) => {
                if (!isDevelopmentRuntime || typeof window !== "undefined") {
                    return;
                }

                const endedAt =
                    typeof performance !== "undefined" && typeof performance.now === "function"
                        ? performance.now()
                        : Date.now();
                const { recordDevApiMetric } = await import("@/lib/dev-request-metrics");

                recordDevApiMetric({
                    durationMs: Math.max(endedAt - startedAt, 0),
                    method,
                    status,
                    url: `${url.pathname}${url.search}`,
                });
            };

            const runFetch = async (): Promise<ApiResponse<T>> => {
            const response = await fetch(url.toString(), {
                ...init,
                cache: "no-store",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...init.headers,
                    ...(locale ? { "Content-Language": locale, "Accept-Language": locale } : null),
                },
            });

            const text = await response.text();
            const parsedBody = text ? (JSON.parse(text) as ApiResponseBody<T>) : null;

            if (parsedBody && typeof parsedBody.success === "boolean") {
                await recordServerMetric(response.status);
                return new ApiResponse<T>({
                    ...parsedBody,
                    status: response.status,
                });
            }

            await recordServerMetric(response.status);
            return new ApiResponse<T>({
                success: false,
                message: "API-dan gözlənilməz cavab gəldi",
                data: null,
                status: response.status,
                errors: [
                    {
                        code: response.status ? `HTTP_${response.status}` : "INVALID_RESPONSE",
                        message: response.statusText || "Gözlənilməz cavab formatı",
                    },
                ],
            });
            };

            return await runFetch();
        } catch (error: unknown) {
            const errorName = typeof error === "object" && error !== null && "name" in error
                ? String((error as { name: string }).name)
                : "";

            const isTimeout = errorName === "AbortError";
            const message = error instanceof Error ? error.message : "Naməlum xəta";

            if (isDevelopmentRuntime && typeof window === "undefined") {
                const endedAt =
                    typeof performance !== "undefined" && typeof performance.now === "function"
                        ? performance.now()
                        : Date.now();
                const { recordDevApiMetric } = await import("@/lib/dev-request-metrics");

                recordDevApiMetric({
                    durationMs: Math.max(endedAt - startedAt, 0),
                    method,
                    status: isTimeout ? 408 : 0,
                    url: endpoint,
                });
            }

            return new ApiResponse<T>({
                success: false,
                message: isTimeout ? "API sorğusunun vaxtı bitdi" : "API sorğusu alınmadı",
                data: null,
                status: isTimeout ? 408 : 0,
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
