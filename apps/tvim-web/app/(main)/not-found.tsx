import { cookies, headers } from "next/headers";
import { NotFoundRoute } from "@/app/components/NotFoundPage/not-found-route";
import { defaultLocale, isSupportedLocale, normalizeLocale } from "@/lib/site-locales";
import { REQUEST_PATHNAME_HEADER } from "@/middleware";

export default async function NotFound() {
    const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
    const pathname = requestHeaders.get(REQUEST_PATHNAME_HEADER) ?? "";
    const localeSegment = pathname.split("/").filter(Boolean)[0] ?? "";

    // A url without a language prefix still belongs to whoever is browsing, so
    // the language they picked is used rather than the site default.
    const locale = isSupportedLocale(localeSegment)
        ? localeSegment
        : normalizeLocale(cookieStore.get("preferred-locale")?.value ?? defaultLocale);

    return <NotFoundRoute locale={locale} />;
}
