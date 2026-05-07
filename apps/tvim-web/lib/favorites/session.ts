export const FAVORITES_GUEST_TOKEN_COOKIE = "tvim_favorites_guest_token";

export const FAVORITES_GUEST_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

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

export const favoritesCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: FAVORITES_GUEST_TOKEN_MAX_AGE_SECONDS,
});

export const encodeGuestTokenForCookie = (token: string) => encodeURIComponent(token);

export const decodeGuestTokenFromCookie = (value?: string) => {
    if (!value) return null;

    const decoded = decodeCookieValue(value).trim();
    return decoded || null;
};
