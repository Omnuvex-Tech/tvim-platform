"use client";

import { ErrorPage, useClientLocale } from "@/app/components/ErrorPage/error-page";

/**
 * The unprefixed pages render in the language the visitor picked, which the
 * document's `lang` already carries.
 */
export default function MainError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry?: () => void;
}) {
    const locale = useClientLocale(() => document.documentElement.lang);

    return <ErrorPage locale={locale} error={error} retry={unstable_retry} />;
}
