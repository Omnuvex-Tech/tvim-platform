"use client";

import { RequestForm as RequestFormUI } from "@repo/ui";
import type { RequestFormData, RequestFormField, RequestFormProps, RequestFormSubmitResult } from "@repo/types/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://admin.tvim.az/api/v1").replace(/\/+$/, "");

function resolveSubmitUrl(path: string) {
    const normalizedPath = path.trim();

    if (/^https?:\/\//i.test(normalizedPath)) {
        return normalizedPath;
    }

    const withLeadingSlash = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
    return `${API_BASE_URL}${withLeadingSlash}`;
}

const extractFirstErrorMessage = (payload: unknown) => {
    if (!payload || typeof payload !== "object") return "";

    const errors = (payload as { errors?: unknown }).errors;
    if (errors && typeof errors === "object" && !Array.isArray(errors)) {
        const entries = Object.entries(errors as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
        for (const [, value] of entries) {
            if (Array.isArray(value) && value.length > 0) {
                const first = value.find((item) => typeof item === "string" && item.trim());
                if (typeof first === "string") return first.trim();
            }
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
    }

    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
        return message.trim();
    }

    return "";
};

function normalizeRequestFormFields(fields: RequestFormField[] | undefined) {
    if (!Array.isArray(fields)) return [] as RequestFormField[];

    const toOrder = (value: unknown) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    };

    const toIdNumber = (value: unknown) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : Number.MAX_SAFE_INTEGER;
    };

    return [...fields]
        .filter((field): field is RequestFormField => Boolean(field) && String((field as any).id ?? "").trim() !== "")
        .sort((a, b) => {
            const orderDiff = toOrder(a.sort_order) - toOrder(b.sort_order);
            if (orderDiff !== 0) return orderDiff;
            return toIdNumber(a.id) - toIdNumber(b.id);
        });
}

function resolveValueForFieldType(type: string, data: RequestFormData) {
    const normalized = type.toLowerCase().trim();
    if (normalized === "textbox") return data.name;
    if (normalized === "phone_number") return data.phone;
    if (normalized === "textarea") return data.description;
    if (normalized === "file") return data.file;
    return null;
}

function extractSuccessMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") return "";

    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();

    const nested = (payload as { data?: { message?: unknown } }).data?.message;
    if (typeof nested === "string" && nested.trim()) return nested.trim();

    return "";
}

function extractOkFlag(payload: unknown) {
    if (!payload || typeof payload !== "object") return false;
    const ok = (payload as { ok?: unknown }).ok;
    if (typeof ok === "boolean") return ok;
    const nestedOk = (payload as { data?: { ok?: unknown } }).data?.ok;
    return typeof nestedOk === "boolean" ? nestedOk : false;
}

const RequestForm = (props: RequestFormProps) => {
    const handleSubmit = async (data: RequestFormData) => {
        let successMessage = "";
        let ok = false;

        if (props.submitConfig?.path) {
            const method = String(props.submitConfig.method ?? "POST").toUpperCase();
            const submitUrl = resolveSubmitUrl(props.submitConfig.path);

            const normalizedFields = normalizeRequestFormFields(props.fields);

            if (normalizedFields.length > 0) {
                const answers: Record<string, string> = {};
                const formData = new FormData();
                let hasFile = false;

                for (const field of normalizedFields) {
                    const key = String(field.id).trim();
                    if (!key) continue;

                    const value = resolveValueForFieldType(String(field.type ?? ""), data);
                    if (value === null) continue;

                    if (value instanceof File) {
                        hasFile = true;
                        formData.append(`answers[${key}]`, value);
                    } else {
                        const text = String(value ?? "");
                        answers[key] = text;
                        formData.append(`answers[${key}]`, text);
                    }
                }

                const response = await fetch(submitUrl, {
                    method,
                    body: hasFile ? formData : JSON.stringify({ answers }),
                    headers: {
                        ...(hasFile ? {} : { "Content-Type": "application/json" }),
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    let details = "";

                    try {
                        const payload = await response.json();
                        const extracted = extractFirstErrorMessage(payload);
                        details = extracted ? `: ${extracted}` : "";
                    } catch {
                        details = "";
                    }

                    throw new Error(`Request form submit failed (${response.status})${details}`);
                }

                try {
                    const payload = await response.json();
                    successMessage = extractSuccessMessage(payload);
                    ok = extractOkFlag(payload);
                } catch {
                    successMessage = "";
                    ok = false;
                }
            } else {
                const formData = new FormData();
                formData.append("name", data.name);
                formData.append("phone", data.phone);
                formData.append("description", data.description);

                if (data.file) {
                    formData.append("file", data.file);
                }

                const response = await fetch(submitUrl, {
                    method,
                    body: formData,
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    let details = "";

                    try {
                        const payload = await response.json();
                        const extracted = extractFirstErrorMessage(payload);
                        details = extracted ? `: ${extracted}` : "";
                    } catch {
                        details = "";
                    }

                    throw new Error(`Request form submit failed (${response.status})${details}`);
                }

                try {
                    const payload = await response.json();
                    successMessage = extractSuccessMessage(payload);
                    ok = extractOkFlag(payload);
                } catch {
                    successMessage = "";
                    ok = false;
                }
            }
        }

        const extra = (await props.onSubmit?.(data)) as void | RequestFormSubmitResult;
        const message = typeof extra?.message === "string" && extra.message.trim() ? extra.message.trim() : successMessage;
        const mergedOk = typeof extra?.ok === "boolean" ? extra.ok : ok;
        if (message || mergedOk) {
            return { message, ok: mergedOk } satisfies RequestFormSubmitResult;
        }
    };

    return <RequestFormUI {...props} onSubmit={handleSubmit} />;
};

export { RequestForm };
export type { RequestFormData, RequestFormProps } from "@repo/types/types";
