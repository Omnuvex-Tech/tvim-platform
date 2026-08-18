"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { getTranslations } from "@/lib/i18n";
import { defaultLocale, isSupportedLocale } from "@/lib/site-locales";

type TermsDialogProps = {
    open: boolean;
    onClose: () => void;
};

type TermsCopy = {
    termsTitle: string;
    termsLoading: string;
    termsError: string;
    closeTerms: string;
};

type TermsContent = {
    title: string;
    html: string;
};

const termsCache = new Map<string, TermsContent>();

export const TermsDialog = ({ open, onClose }: TermsDialogProps) => {
    const pathname = usePathname();
    const localeSegment = String(pathname ?? "").split("/").filter(Boolean)[0] ?? "";
    const locale = isSupportedLocale(localeSegment) ? localeSegment : defaultLocale;
    const t = getTranslations(locale).register as unknown as TermsCopy;

    const [content, setContent] = useState<TermsContent | null>(() => termsCache.get(locale) ?? null);
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

    useEffect(() => {
        if (!open) return;

        const cached = termsCache.get(locale);
        if (cached) {
            setContent(cached);
            setStatus("idle");
            return;
        }

        let alive = true;
        setStatus("loading");

        const load = async () => {
            try {
                const response = await fetch(`/api/terms?locale=${encodeURIComponent(locale)}`, {
                    headers: { Accept: "application/json" },
                });
                const payload = await response.json();

                if (!alive) return;

                if (!response.ok || !payload?.success || !payload?.data?.html) {
                    setStatus("error");
                    return;
                }

                const next: TermsContent = { title: payload.data.title ?? "", html: payload.data.html };
                termsCache.set(locale, next);
                setContent(next);
                setStatus("idle");
            } catch {
                if (alive) setStatus("error");
            }
        };

        void load();

        return () => {
            alive = false;
        };
    }, [locale, open]);

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;

        const { body } = document;
        const previousOverflow = body.style.overflow;
        const previousPaddingRight = body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        body.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            body.style.overflow = previousOverflow;
            body.style.paddingRight = previousPaddingRight;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCloseRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onMouseDown={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="terms-dialog-title"
                className="flex max-h-[88vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[4px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.28)]"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex min-h-[54px] items-center justify-between border-b border-[#eceff3] bg-[#fafafa] pl-5">
                    <h2 id="terms-dialog-title" className="text-[18px] font-bold text-[#1b1d22]">
                        {content?.title || t.termsTitle}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-[54px] w-[40px] cursor-pointer items-center justify-center bg-[#f4f4f4] text-[#666] transition-colors hover:bg-[#ececec] hover:text-black"
                        aria-label={t.closeTerms}
                    >
                        <X className="size-[14px]" strokeWidth={3.5} />
                    </button>
                </header>

                <div className="thin-scrollbar prose max-w-none overflow-y-auto px-5 py-6 text-[16px] leading-[1.45] text-[#15171c] sm:px-6">
                    {content ? (
                        <div dangerouslySetInnerHTML={{ __html: content.html }} />
                    ) : (
                        <p className="text-[#6b7280]">{status === "error" ? t.termsError : t.termsLoading}</p>
                    )}
                </div>
            </section>
        </div>
    );
};
