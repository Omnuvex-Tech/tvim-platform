import { cookies, headers } from "next/headers";
import { config } from "@/config";
import { NotFoundRoute } from "@/app/components/NotFoundPage/not-found-route";
import { isSupportedLocale, normalizeLocale } from "@/lib/site-locales";
import { REQUEST_PATHNAME_HEADER } from "@/middleware";

export default async function LocaleNotFound() {
    // Next does not hand params to a not-found boundary, so the language comes
    // from the pathname the middleware forwarded, and from the visitor's own
    // choice when that pathname carries no language prefix.
    const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
    const pathname = requestHeaders.get(REQUEST_PATHNAME_HEADER) ?? "";
    const localeSegment = pathname.split("/").filter(Boolean)[0] ?? "";

    const locale = isSupportedLocale(localeSegment)
        ? localeSegment
        : normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);

    return <NotFoundRoute locale={locale} />;
}
