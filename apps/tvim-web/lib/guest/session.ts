export const GUEST_TOKEN_COOKIE = "tvim_guest_token";

export const GUEST_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

const decodeCookieValue = (value: string) => {
    let current = value;

    for (let i = 0; i < 3; i += 1) {
        try {
            const next = decodeURIComponent(current);
            if (next === current) break;
            current = next;
        } catch {
            break;
        }
    }

    return current;
};

export const guestCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: GUEST_TOKEN_MAX_AGE_SECONDS,
});

export const encodeGuestTokenForCookie = (token: string) => encodeURIComponent(token);

export const decodeGuestTokenFromCookie = (value?: string) => {
    if (!value) return null;

    const decoded = decodeCookieValue(value).trim();
    return decoded || null;
};

type GuestTokenEnsureResult = { message?: string; token: string | null };

type GuestTokenState = {
    ensured: boolean;
    promise: Promise<GuestTokenEnsureResult> | null;
    result: GuestTokenEnsureResult | null;
};

const guestTokenStateKey = "__tvim_guest_token_state__";

const getGuestTokenState = (): GuestTokenState => {
    const target = globalThis as unknown as Record<string, unknown>;
    const existing = target[guestTokenStateKey] as GuestTokenState | undefined;

    if (existing && typeof existing === "object") {
        return existing;
    }

    const initial: GuestTokenState = {
        ensured: false,
        promise: null,
        result: null,
    };

    target[guestTokenStateKey] = initial;
    return initial;
};

const parseEnsureGuestTokenResponse = async (response: Response) => {
    let payload: unknown = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    const typed = payload as { success?: boolean; message?: string; data?: { token?: string | null } } | null;
    const success = typed?.success !== false;
    if (!response.ok || !success) {
        throw new Error(typeof typed?.message === "string" ? typed.message : "Server Error");
    }

    return {
        message: typed?.message,
        token: typed?.data?.token ?? null,
    } satisfies GuestTokenEnsureResult;
};

export const ensureGuestToken = async (): Promise<GuestTokenEnsureResult> => {
    const state = getGuestTokenState();

    if (state.ensured) {
        return state.result ?? { message: "", token: null };
    }

    if (state.promise) {
        return await state.promise;
    }

    const promise = (async () => {
        try {
            const response = await fetch("/api/favorites/token", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });

            const result = await parseEnsureGuestTokenResponse(response);
            state.result = result;
            state.ensured = true;
            return result;
        } catch {
            const result = { message: "", token: null };
            state.result = result;
            state.ensured = true;
            return result;
        } finally {
            state.promise = null;
        }
    })();

    state.promise = promise;
    return await promise;
};
