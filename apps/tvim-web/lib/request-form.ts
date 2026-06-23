import type { RequestFormSubmitConfig } from "@repo/types/types";

const readString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const resolveConfigFromObject = (value: Record<string, unknown>): RequestFormSubmitConfig | undefined => {
    const nestedSubmit = value.submit;
    if (nestedSubmit && typeof nestedSubmit === "object" && !Array.isArray(nestedSubmit)) {
        const resolvedNested = resolveRequestFormSubmitConfig(nestedSubmit);
        if (resolvedNested) return resolvedNested;
    }

    const nestedData = value.data;
    if (nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)) {
        const resolvedNested = resolveRequestFormSubmitConfig(nestedData);
        if (resolvedNested) return resolvedNested;
    }

    const path = readString(value.path) || readString(value.route) || readString(value.url) || readString(value.endpoint);
    if (!path) {
        return undefined;
    }

    return {
        method: readString(value.method) || undefined,
        path,
    };
};

export function resolveRequestFormSubmitConfig(value: unknown): RequestFormSubmitConfig | undefined {
    if (!value) return undefined;

    if (typeof value === "string") {
        const path = readString(value);
        return path ? { path } : undefined;
    }

    if (typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }

    return resolveConfigFromObject(value as Record<string, unknown>);
}
