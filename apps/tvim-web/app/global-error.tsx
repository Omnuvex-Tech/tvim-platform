"use client";

import { ErrorPage, useClientLocale } from "@/app/components/ErrorPage/error-page";
import "@/app/globals.css";

/**
 * The last boundary, for an error in a root layout itself. It replaces the
 * whole document, so it brings its own <html> and <body>, and the language is
 * read from the url since no layout is left to say it.
 */
export default function GlobalError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry?: () => void;
}) {
    const locale = useClientLocale(() => window.location.pathname.split("/").filter(Boolean)[0] ?? "");

    return (
        <html lang={locale}>
            <body>
                <main className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8">
                    <ErrorPage locale={locale} error={error} retry={unstable_retry} />
                </main>
            </body>
        </html>
    );
}
