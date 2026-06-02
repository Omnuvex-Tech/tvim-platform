type ApiPayload<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

export type ProductComment = {
    id: string;
    author: string;
    comment: string;
    rating: number;
    status?: string;
    createdAt?: string;
};

type ProductCommentsListItem = {
    id?: number | string;
    fullname?: string | null;
    name?: string | null;
    comment?: string | null;
    message?: string | null;
    rating?: number | null;
    status?: string | null;
    created_at?: string | null;
};

type ProductCommentsListData = {
    items?: ProductCommentsListItem[];
    pagination?: {
        total?: number;
    };
};

type ProductCommentsCreateData = {
    id?: number | string;
    uuid?: string;
    rating?: number;
    status?: string;
};

const parseResponse = async <T>(response: Response): Promise<ApiPayload<T>> => {
    let payload: ApiPayload<T> | null = null;

    try {
        payload = (await response.json()) as ApiPayload<T>;
    } catch {
        payload = null;
    }

    if (!response.ok || payload?.success === false) {
        throw new Error(typeof payload?.message === "string" && payload.message.trim() ? payload.message : "Server Error");
    }

    return payload ?? {};
};

const toComment = (item: ProductCommentsListItem | null | undefined): ProductComment | null => {
    if (!item || typeof item !== "object") return null;

    const message = String(item.comment ?? item.message ?? "").trim();
    if (!message) return null;

    const ratingValue = Number(item.rating ?? 0);

    return {
        id: String(item.id ?? `${Date.now()}`),
        author: String(item.fullname ?? item.name ?? "İstifadəçi").trim() || "İstifadəçi",
        comment: message,
        rating: Number.isFinite(ratingValue) ? Math.max(0, Math.min(5, ratingValue)) : 0,
        status: String(item.status ?? "").trim() || undefined,
        createdAt: String(item.created_at ?? "").trim() || undefined,
    };
};

export const listProductComments = async (productVariationId: number) => {
    const params = new URLSearchParams({
        product_variation_id: String(productVariationId),
    });

    const response = await fetch(`/api/product-comments?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
            Accept: "application/json",
        },
    });

    const payload = await parseResponse<ProductCommentsListData>(response);

    const items = Array.isArray(payload.data?.items)
        ? payload.data.items.map((item) => toComment(item)).filter((item): item is ProductComment => Boolean(item))
        : [];

    return {
        message: payload.message,
        data: {
            items,
            pagination: payload.data?.pagination,
        },
    };
};

export const createProductComment = async (input: {
    productVariationId: number;
    fullname: string;
    rating: number;
    comment: string;
}) => {
    const response = await fetch("/api/product-comments", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            product_variation_id: input.productVariationId,
            fullname: input.fullname,
            rating: input.rating,
            comment: input.comment,
        }),
    });

    const payload = await parseResponse<ProductCommentsCreateData>(response);

    return {
        message: payload.message,
        data: {
            id: payload.data?.id,
            uuid: payload.data?.uuid,
            rating: payload.data?.rating,
            status: payload.data?.status,
        },
    };
};
