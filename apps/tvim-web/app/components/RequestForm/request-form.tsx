"use client";

import { RequestForm as RequestFormUI } from "@repo/ui";
import type { RequestFormData, RequestFormProps } from "@repo/types/types";

const RequestForm = (props: RequestFormProps) => {
    const handleSubmit = async (data: RequestFormData) => {
        console.log("Form submitted:", data);
        await props.onSubmit?.(data);
    };

    return <RequestFormUI {...props} onSubmit={handleSubmit} />;
};

export { RequestForm };
export type { RequestFormData, RequestFormProps } from "@repo/types/types";
