export const AUTH_SESSION_TOKEN_COOKIE = "tvim_customer_token";
export const AUTH_SESSION_USER_COOKIE = "tvim_customer_user";

export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AuthSessionUser = {
    id?: number | string;
    name?: string | null;
    surname?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
};

const decodeCookieValue = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

export const encodeTokenForCookie = (token: string) => encodeURIComponent(token);

export const decodeTokenFromCookie = (value?: string) => {
    if (!value) return null;
    const decoded = decodeCookieValue(value).trim();
    return decoded || null;
};

export const normalizeSessionUser = (input: unknown): AuthSessionUser | null => {
    if (!input || typeof input !== "object") return null;

    const source = input as Record<string, unknown>;

    return {
        id: typeof source.id === "number" || typeof source.id === "string" ? source.id : undefined,
        name: typeof source.name === "string" ? source.name : null,
        surname: typeof source.surname === "string" ? source.surname : null,
        email: typeof source.email === "string" ? source.email : null,
        avatar_url: typeof source.avatar_url === "string" ? source.avatar_url : null,
        avatar_path: typeof source.avatar_path === "string" ? source.avatar_path : null,
    };
};

export const encodeUserForCookie = (user: AuthSessionUser | null) => {
    if (!user) return null;

    try {
        return encodeURIComponent(JSON.stringify(user));
    } catch {
        return null;
    }
};

export const decodeUserFromCookie = (value?: string) => {
    if (!value) return null;

    const decoded = decodeCookieValue(value);

    try {
        const parsed = JSON.parse(decoded) as unknown;
        return normalizeSessionUser(parsed);
    } catch {
        return null;
    }
};

export const authCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
});
