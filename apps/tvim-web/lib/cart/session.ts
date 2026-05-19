import {
    GUEST_TOKEN_COOKIE,
    GUEST_TOKEN_MAX_AGE_SECONDS,
    guestCookieOptions,
    encodeGuestTokenForCookie,
    decodeGuestTokenFromCookie,
} from "@/lib/guest/session";

export const CART_GUEST_TOKEN_COOKIE = GUEST_TOKEN_COOKIE;

export const CART_GUEST_TOKEN_MAX_AGE_SECONDS = GUEST_TOKEN_MAX_AGE_SECONDS;

export const cartCookieOptions = guestCookieOptions;

export const encodeCartTokenForCookie = encodeGuestTokenForCookie;

export const decodeCartTokenFromCookie = decodeGuestTokenFromCookie;

