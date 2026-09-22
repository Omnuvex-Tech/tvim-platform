"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { defaultLocale, isSupportedLocale, type SiteLocale } from "@/lib/site-locales";

/**
 * `<html lang>` has to be rendered by the root layout, which sits above
 * `app/[locale]` and so has no locale of its own — it used to hardcode `az`,
 * which left every /en and /ru page claiming to be Azerbaijani (wrong language
 * to crawlers, screen readers, `:lang()` rules and any widget that reads
 * `document.documentElement.lang`).
 *
 * Reading the locale from headers() in the layout would fix the attribute at
 * the cost of opting the whole app out of static rendering, so the element is
 * rendered by this client component instead: `useParams()` sees the matched
 * route's params from anywhere in the tree, including during prerender, so the
 * attribute is baked into each locale's static HTML and also follows client-side
 * language switches, where the layout itself never re-renders.
 */
const routeLocaleOf = (value: string | string[] | undefined): SiteLocale | null => {
    const segment = Array.isArray(value) ? value[0] : value;
    const normalized = segment?.trim().toLowerCase() ?? "";

    return isSupportedLocale(normalized) ? normalized : null;
};

const cookieLocale = (): SiteLocale | null => {
    const match = document.cookie.match(/(?:^|;\s*)preferred-locale=([^;]*)/);
    if (!match?.[1]) return null;

    const normalized = decodeURIComponent(match[1]).trim().toLowerCase();
    return isSupportedLocale(normalized) ? normalized : null;
};

export function LocaleHtml({ children }: { children: ReactNode }) {
    const params = useParams<{ locale?: string | string[] }>();
    const routeLocale = routeLocaleOf(params?.locale);

    // Routes without a /:locale prefix — the bare "/" home page and the 404 that
    // answers for unknown paths — are rendered in whatever language the visitor
    // last picked, which is only knowable once the cookie is readable.
    const [visitorLocale, setVisitorLocale] = useState<SiteLocale>(defaultLocale);

    useEffect(() => {
        if (routeLocale) return;
        setVisitorLocale(cookieLocale() ?? defaultLocale);
    }, [routeLocale]);

    return (
        <html lang={routeLocale ?? visitorLocale} suppressHydrationWarning>
            {children}
        </html>
    );
}
