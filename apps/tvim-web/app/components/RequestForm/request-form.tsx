"use client";

import { RequestForm as RequestFormUI } from "@repo/ui";
import type { RequestFormData, RequestFormProps } from "@repo/types/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://admin.tvim.az/api/v1").replace(/\/+$/, "");

function resolveSubmitUrl(path: string) {
    const normalizedPath = path.trim();

    if (/^https?:\/\//i.test(normalizedPath)) {
        return normalizedPath;
    }

    const withLeadingSlash = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
    return `${API_BASE_URL}${withLeadingSlash}`;
}

const RequestForm = (props: RequestFormProps) => {
    const handleSubmit = async (data: RequestFormData) => {
        if (props.submitConfig?.path) {
            const method = String(props.submitConfig.method ?? "POST").toUpperCase();
            const submitUrl = resolveSubmitUrl(props.submitConfig.path);

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
                    details = payload?.message ? `: ${payload.message}` : "";
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
