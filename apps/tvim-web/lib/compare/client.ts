export type CompareAction = "created" | "deleted";

const COMPARE_UPDATED_EVENT = "tvim:compare-updated";

type ApiPayload<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

export type CompareItem = {
    id: number;
    product_variation_id: number;
    created_at?: string;
    updated_at?: string;
};

export type CompareListData = {
    token?: string | null;
    items: CompareItem[];
};

type CompareToggleData = {
    token?: string | null;
    action?: CompareAction;
    compare?: CompareItem | null;
};

const safeEnsureGuestCompareToken = async () => {
    try {
        await ensureGuestCompareToken();
    } catch {
        // Auth users or transient errors should not block compare operations.
    }
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
        throw new Error(toErrorMessage(payload, "Server Error"));
    }

    return payload ?? {};
};

export const listCompare = async () => {
    await safeEnsureGuestCompareToken();

    const response = await fetch("/api/compare", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
            Accept: "application/json",
        },
    });

    const payload = await parseResponse<CompareListData>(response);

    return {
        message: payload.message,
        data: {
            token: payload.data?.token ?? null,
            items: Array.isArray(payload.data?.items) ? payload.data.items : [],
        } as CompareListData,
    };
};

export const toggleCompare = async (productVariationId: number) => {
    await safeEnsureGuestCompareToken();

    const response = await fetch("/api/compare/toggle", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ product_variation_id: productVariationId }),
    });

    const payload = await parseResponse<CompareToggleData>(response);
    const action = payload.data?.action;

    if (action !== "created" && action !== "deleted") {
        throw new Error("Invalid compare response.");
    }

    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent(COMPARE_UPDATED_EVENT, {
                detail: {
                    action,
                    productVariationId,
                },
            })
        );
    }

    return {
        message: payload.message,
        data: {
            token: payload.data?.token ?? null,
            action,
            compare: payload.data?.compare ?? null,
        },
    };
};

export const ensureGuestCompareToken = async () => {
    const response = await fetch("/api/compare/token", {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    const payload = await parseResponse<{ token?: string | null }>(response);

    return {
        message: payload.message,
        token: payload.data?.token ?? null,
    };
};
