export type FavoriteAction = "created" | "deleted";

const FAVORITES_UPDATED_EVENT = "tvim:favorites-updated";

export type FavoriteItem = {
    id: number;
    product_variation_id: number;
    created_at?: string;
    updated_at?: string;
};

export type FavoritesPagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type FavoritesListData = {
    token?: string | null;
    items: FavoriteItem[];
    pagination?: FavoritesPagination;
};

type ApiPayload<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

type FavoriteToggleData = {
    token?: string | null;
    action?: FavoriteAction;
    favorite?: FavoriteItem | null;
};

const safeEnsureGuestFavoriteToken = async () => {
    try {
        await ensureGuestFavoriteToken();
    } catch {
        // Auth users or transient errors should not block favorites operations.
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

export const listFavorites = async (page = 1, perPage = 20) => {
    await safeEnsureGuestFavoriteToken();

    const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
    });

    const response = await fetch(`/api/favorites?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
            Accept: "application/json",
        },
    });

    const payload = await parseResponse<FavoritesListData>(response);

    return {
        message: payload.message,
        data: {
            token: payload.data?.token ?? null,
            items: Array.isArray(payload.data?.items) ? payload.data.items : [],
            pagination: payload.data?.pagination,
        } as FavoritesListData,
    };
};

export const toggleFavorite = async (productVariationId: number) => {
    await safeEnsureGuestFavoriteToken();

    const response = await fetch("/api/favorites/toggle", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ product_variation_id: productVariationId }),
    });

    const payload = await parseResponse<FavoriteToggleData>(response);
    const action = payload.data?.action;

    if (action !== "created" && action !== "deleted") {
        throw new Error("Invalid favorites response.");
    }

    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent(FAVORITES_UPDATED_EVENT, {
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
            favorite: payload.data?.favorite ?? null,
        },
    };
};

export const ensureGuestFavoriteToken = async () => {
    const response = await fetch("/api/favorites/token", {
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
