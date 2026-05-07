export const AUTH_SESSION_TOKEN_COOKIE = "tvim_customer_token";
export const AUTH_SESSION_USER_COOKIE = "tvim_customer_user";

export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AuthSessionUser = {
    id?: number | string;
    uuid?: string | null;
    name?: string | null;
    surname?: string | null;
    passport_fin?: string | null;
    date_of_birth?: string | null;
    email?: string | null;
    email_verified_at?: string | null;
    phone?: string | null;
    country_id?: number | string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
};

const toStringOrNull = (value: unknown) => (typeof value === "string" ? value : null);
const toBooleanOrNull = (value: unknown) => (typeof value === "boolean" ? value : null);
const toNumberOrStringOrNull = (value: unknown) => {
    if (typeof value === "number" || typeof value === "string") {
        return value;
    }

    return null;
};

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

export const encodeTokenForCookie = (token: string) => encodeURIComponent(token);

export const decodeTokenFromCookie = (value?: string) => {
    if (!value) return null;
    const decoded = decodeCookieValue(value).trim();
    return decoded || null;
};

export const normalizeSessionUser = (input: unknown): AuthSessionUser | null => {
    if (!input || typeof input !== "object") return null;

    const source = input as Record<string, unknown>;

    const id = (typeof source.id === "number" || typeof source.id === "string")
        ? source.id
        : undefined;

    return {
        id,
        uuid: toStringOrNull(source.uuid),
        name: toStringOrNull(source.name),
        surname: toStringOrNull(source.surname),
        passport_fin: toStringOrNull(source.passport_fin),
        date_of_birth: toStringOrNull(source.date_of_birth),
        email: toStringOrNull(source.email),
        email_verified_at: toStringOrNull(source.email_verified_at),
        phone: toStringOrNull(source.phone),
        country_id: toNumberOrStringOrNull(source.country_id),
        avatar_url: toStringOrNull(source.avatar_url),
        avatar_path: toStringOrNull(source.avatar_path),
        is_active: toBooleanOrNull(source.is_active),
        created_at: toStringOrNull(source.created_at),
        updated_at: toStringOrNull(source.updated_at),
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
