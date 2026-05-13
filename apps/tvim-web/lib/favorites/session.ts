import {
    GUEST_TOKEN_COOKIE,
    GUEST_TOKEN_MAX_AGE_SECONDS,
    guestCookieOptions,
    encodeGuestTokenForCookie,
    decodeGuestTokenFromCookie,
} from "@/lib/guest/session";

export const FAVORITES_GUEST_TOKEN_COOKIE = GUEST_TOKEN_COOKIE;

export const FAVORITES_GUEST_TOKEN_MAX_AGE_SECONDS = GUEST_TOKEN_MAX_AGE_SECONDS;

export const favoritesCookieOptions = guestCookieOptions;

export { encodeGuestTokenForCookie, decodeGuestTokenFromCookie };
