import {
    GUEST_TOKEN_COOKIE,
    GUEST_TOKEN_MAX_AGE_SECONDS,
    guestCookieOptions,
    encodeGuestTokenForCookie,
    decodeGuestTokenFromCookie,
} from "@/lib/guest/session";

export const COMPARE_GUEST_TOKEN_COOKIE = GUEST_TOKEN_COOKIE;

export const COMPARE_GUEST_TOKEN_MAX_AGE_SECONDS = GUEST_TOKEN_MAX_AGE_SECONDS;

export const compareCookieOptions = guestCookieOptions;

export const encodeCompareTokenForCookie = encodeGuestTokenForCookie;

export const decodeCompareTokenFromCookie = decodeGuestTokenFromCookie;
