type ApiPayload<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

type ValidationErrorPayload = {
    message?: string;
    data?: Record<string, string[] | undefined>;
};

export type PurchaseRequestResult = {
    uuid?: string;
    fullname?: string;
    phone?: string;
    quantity?: number;
    status?: string;
    product?: {
        id?: number;
    };
    variation?: {
        id?: number;
        name?: string;
        slug?: string;
        sku?: string;
        model?: string;
        price?: string;
        stock?: number;
    };
    created_at?: string;
};

export type SubmitPurchaseRequestBody = {
    fullname: string;
    phone: string;
    product_variation_id: number;
    quantity: number;
};

const toErrorMessage = (payload: { message?: string } | null, fallback: string) => {
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    return message || fallback;
};

const parseResponse = async <T>(response: Response): Promise<ApiPayload<T>> => {
    let payload: ApiPayload<T> | null = null;

    try {
        payload = (await response.json()) as ApiPayload<T>;
    } catch {
        payload = null;
    }

    if (!response.ok || payload?.success === false) {
        const validationPayload = payload as ValidationErrorPayload | null;
        const validationMessages = validationPayload?.data
            ? Object.values(validationPayload.data)
                .flatMap((messages) => (Array.isArray(messages) ? messages : []))
                .map((message) => String(message).trim())
                .filter(Boolean)
            : [];

        const fallbackMessage = toErrorMessage(payload, "Server Error");
        throw new Error(validationMessages.length > 0 ? validationMessages[0]! : fallbackMessage);
    }

    return payload ?? {};
};

export const submitPurchaseRequest = async (body: SubmitPurchaseRequestBody) => {
    const response = await fetch("/api/product/purchase-requests", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    const payload = await parseResponse<PurchaseRequestResult>(response);

    return {
        message: payload.message,
        data: payload.data ?? {},
    };
};
