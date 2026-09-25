"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SUPPORTED_LOCALES, type SiteLocale } from "@/lib/site-locales";

const copy: Record<SiteLocale, { documentTitle: string; title: string; retry: string; home: string }> = {
    az: {
        documentTitle: "Xəta baş verdi | TVİM",
        title: "Üzr istəyirik, səhifəni göstərərkən xəta baş verdi.",
        retry: "Yenidən cəhd et",
        home: "Ana səhifə",
    },
    en: {
        documentTitle: "Something went wrong | TVIM",
        title: "Sorry, something went wrong while loading this page.",
        retry: "Try again",
        home: "Home",
    },
    ru: {
        documentTitle: "Произошла ошибка | TVIM",
        title: "К сожалению, при загрузке страницы произошла ошибка.",
        retry: "Попробовать снова",
        home: "На главную",
    },
};

export const toErrorLocale = (value: unknown): SiteLocale => {
    const normalized = String(value ?? "").trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as SiteLocale) ? (normalized as SiteLocale) : "az";
};

const subscribeNever = () => () => {};

/**
 * A browser-only value that hydrates cleanly: the server and the first client
 * render both use the server snapshot, and the real value follows right after.
 * Reading `document` or `location` straight in render would make the two
 * disagree whenever the visitor is not on the default language.
 */
export const useClientLocale = (read: () => string) =>
    toErrorLocale(useSyncExternalStore(subscribeNever, read, () => ""));

type ErrorPageProps = {
    locale: SiteLocale;
    error: Error & { digest?: string };
    retry?: () => void;
};

/**
 * What a visitor sees when a page throws on the server: the site's own screen
 * in their language instead of Next's unbranded default. The response keeps
 * its 5xx status, so a crawler that meets it retries later rather than
 * indexing an error as the page.
 *
 * The home link is a plain anchor: after a server error the client router may
 * be the thing that is broken, and a full load is the dependable way out.
 */
export function ErrorPage({ locale, error, retry }: ErrorPageProps) {
    const t = copy[locale];

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <section className="flex min-h-[60vh] w-full items-center justify-center py-8 sm:py-10">
            <title>{t.documentTitle}</title>
            <div className="w-full text-center">
                <h1 className="text-[clamp(28px,3vw,40px)] leading-[1.2] font-semibold tracking-[-0.04em] text-[#111111]">
                    {t.title}
                </h1>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    {retry ? (
                        <button
                            type="button"
                            onClick={() => retry()}
                            className="inline-flex min-w-[220px] cursor-pointer items-center justify-center rounded-full bg-[#0f57d6] px-8 py-3.5 text-[17px] font-semibold text-white transition-colors hover:bg-[#0c4fc6]"
                        >
                            {t.retry}
                        </button>
                    ) : null}
                    <a
                        href={`/${locale}`}
                        className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-[#0f57d6] px-8 py-3.5 text-[17px] font-semibold text-[#0f57d6] transition-colors hover:bg-[#f5f8ff]"
                    >
                        {t.home}
                    </a>
                </div>
            </div>
        </section>
    );
}
