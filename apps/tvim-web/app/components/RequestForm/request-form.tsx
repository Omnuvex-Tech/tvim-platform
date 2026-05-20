"use client";

import { RequestForm as RequestFormUI } from "@repo/ui";
import type { RequestFormData, RequestFormField, RequestFormProps } from "@repo/types/types";

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

    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
        return message.trim();
    }

    const errors = (payload as { errors?: unknown }).errors;
    if (!errors || typeof errors !== "object") return "";

    const values = Object.values(errors as Record<string, unknown>);
    for (const value of values) {
        if (Array.isArray(value) && value.length > 0) {
            const first = value.find((item) => typeof item === "string" && item.trim());
            if (typeof first === "string") return first.trim();
        }
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

const RequestForm = (props: RequestFormProps) => {
    const handleSubmit = async (data: RequestFormData) => {
        if (props.submitConfig?.path) {
            const method = String(props.submitConfig.method ?? "POST").toUpperCase();
            const submitUrl = resolveSubmitUrl(props.submitConfig.path);

            const formData = new FormData();
            const normalizedFields = normalizeRequestFormFields(props.fields);

            if (normalizedFields.length > 0) {
                for (const field of normalizedFields) {
                    const key = String(field.id).trim();
                    if (!key) continue;

                    const value = resolveValueForFieldType(String(field.type ?? ""), data);
                    if (value === null) continue;

                    if (value instanceof File) {
                        formData.append(key, value);
                    } else {
                        formData.append(key, String(value ?? ""));
                    }
                }
            } else {
                formData.append("name", data.name);
                formData.append("phone", data.phone);
                formData.append("description", data.description);

                if (data.file) {
                    formData.append("file", data.file);
                }
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
        }

        await props.onSubmit?.(data);
    };

    return <RequestFormUI {...props} onSubmit={handleSubmit} />;
};

export { RequestForm };
export type { RequestFormData, RequestFormProps } from "@repo/types/types";
