"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { RemoteImage } from "@repo/ui";
import { getTranslations } from "@/lib/i18n";
import { defaultLocale, isSupportedLocale } from "@/lib/site-locales";

type ProductGalleryProps = {
    images: string[];
    alt: string;
    discountPercent?: number | null;
};

/** Below this a horizontal drag reads as a tap or a vertical scroll, not a swipe. */
const SWIPE_THRESHOLD_PX = 45;

const ProductGallery = ({ images, alt, discountPercent }: ProductGalleryProps) => {
    const pathname = usePathname();
    const locale = useMemo(() => {
        const segment = String(pathname ?? "").split("/").filter(Boolean)[0] ?? "";
        return isSupportedLocale(segment) ? segment : defaultLocale;
    }, [pathname]);
    const t = useMemo(() => getTranslations(locale).product, [locale]);

    // The api can repeat the main image inside the gallery, and a duplicate
    // slide is indistinguishable from a broken "next" for whoever is paging.
    const slides = useMemo(() => {
        const seen = new Set<string>();
        return images.filter((src) => {
            const key = String(src ?? "").trim();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [images]);

    const [activeIndex, setActiveIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const touchStartXRef = useRef<number | null>(null);

    const total = slides.length;
    const safeIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0;
    const activeSrc = slides[safeIndex];

    const goTo = useCallback(
        (index: number) => {
            if (total === 0) return;
            // Wraps in both directions so the arrows never dead-end.
            setActiveIndex(((index % total) + total) % total);
        },
        [total],
    );

    const goPrevious = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);
    const goNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);
    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
            if (event.key === "ArrowLeft") goPrevious();
            if (event.key === "ArrowRight") goNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [close, goNext, goPrevious, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const { body } = document;
        const previousOverflow = body.style.overflow;
        const previousPaddingRight = body.style.paddingRight;
        // Removing the scrollbar shifts the page under the overlay unless the
        // width it occupied is handed back as padding.
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        body.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            body.style.overflow = previousOverflow;
            body.style.paddingRight = previousPaddingRight;
        };
    }, [isOpen]);

    const handleTouchStart = (event: React.TouchEvent) => {
        touchStartXRef.current = event.touches[0]?.clientX ?? null;
    };

    const handleTouchEnd = (event: React.TouchEvent) => {
        const start = touchStartXRef.current;
        touchStartXRef.current = null;
        if (start === null || total < 2) return;

        const delta = (event.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
        if (delta > 0) goPrevious();
        else goNext();
    };

    return (
        <>
            <div className="relative flex min-h-[300px] items-center justify-center lg:min-h-[540px]">
                {typeof discountPercent === "number" ? (
                    <span className="absolute top-3 right-3 z-10 inline-flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#ff2e43] text-[16px] font-bold leading-none text-white lg:top-5 lg:right-5 lg:h-[84px] lg:w-[84px] lg:text-[18px]">
                        <span className="-translate-y-[1px]">-{discountPercent}%</span>
                    </span>
                ) : null}

                {activeSrc ? (
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        aria-label={t.galleryOpen}
                        className="flex w-full cursor-zoom-in items-center justify-center"
                    >
                        <RemoteImage
                            src={activeSrc}
                            alt={alt}
                            width={1000}
                            height={1000}
                            sizes="(max-width: 1024px) 100vw, 520px"
                            priority
                            className="max-h-[320px] w-full object-contain lg:max-h-[500px]"
                        />
                    </button>
                ) : (
                    <div className="h-[300px] w-full lg:h-[420px]" />
                )}
            </div>

            {total > 1 ? (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {slides.slice(0, 12).map((src, idx) => (
                        <button
                            key={`${src}-${idx}`}
                            type="button"
                            onClick={() => goTo(idx)}
                            onDoubleClick={() => setIsOpen(true)}
                            aria-label={`${alt} ${idx + 1}`}
                            aria-current={idx === safeIndex}
                            className={`cursor-pointer overflow-hidden rounded-[10px] border bg-white transition-colors ${
                                idx === safeIndex ? "border-[#ff2e43]" : "border-[#e2e6ef] hover:border-[#b9c1d2]"
                            }`}
                        >
                            <RemoteImage
                                src={src}
                                alt={alt}
                                width={132}
                                height={132}
                                className="h-[66px] w-full object-contain"
                            />
                        </button>
                    ))}
                </div>
            ) : null}

            {isOpen && activeSrc ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={alt}
                    className="fixed inset-0 z-[2000] flex flex-col bg-black/90"
                    onMouseDown={close}
                >
                    <div className="flex h-[56px] flex-shrink-0 items-center justify-between px-4 text-white sm:px-6">
                        <span className="text-[14px] font-medium tabular-nums text-white/70">
                            {total > 1 ? `${safeIndex + 1} / ${total}` : ""}
                        </span>
                        <button
                            type="button"
                            onClick={close}
                            aria-label={t.galleryClose}
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        >
                            <X className="size-[18px]" strokeWidth={2.5} />
                        </button>
                    </div>

                    <div
                        className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-16"
                        onMouseDown={(event) => event.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {total > 1 ? (
                            <button
                                type="button"
                                onClick={goPrevious}
                                aria-label={t.galleryPrevious}
                                className="absolute left-2 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:left-4 sm:h-12 sm:w-12"
                            >
                                <ChevronLeft className="size-6" />
                            </button>
                        ) : null}

                        <RemoteImage
                            key={activeSrc}
                            src={activeSrc}
                            alt={alt}
                            width={1600}
                            height={1600}
                            sizes="(max-width: 640px) 100vw, 90vw"
                            className="max-h-full w-auto max-w-full object-contain select-none"
                        />

                        {total > 1 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label={t.galleryNext}
                                className="absolute right-2 z-10 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-4 sm:h-12 sm:w-12"
                            >
                                <ChevronRight className="size-6" />
                            </button>
                        ) : null}
                    </div>

                    {total > 1 ? (
                        <div
                            className="thin-scrollbar flex flex-shrink-0 justify-start gap-2 overflow-x-auto px-4 pb-4 sm:justify-center sm:px-6"
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            {slides.map((src, idx) => (
                                <button
                                    key={`lightbox-${src}-${idx}`}
                                    type="button"
                                    onClick={() => goTo(idx)}
                                    aria-label={`${alt} ${idx + 1}`}
                                    aria-current={idx === safeIndex}
                                    className={`h-[56px] w-[56px] flex-shrink-0 cursor-pointer overflow-hidden rounded-[8px] border bg-white transition-opacity sm:h-[68px] sm:w-[68px] ${
                                        idx === safeIndex
                                            ? "border-white opacity-100"
                                            : "border-white/25 opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <RemoteImage
                                        src={src}
                                        alt={alt}
                                        width={136}
                                        height={136}
                                        className="h-full w-full object-contain"
                                    />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </>
    );
};

export default ProductGallery;
export { ProductGallery };
