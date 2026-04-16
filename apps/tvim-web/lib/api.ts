import { config } from "@/config";

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...init } = options;

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
      ...init.headers,
    },
  });

  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },
};
