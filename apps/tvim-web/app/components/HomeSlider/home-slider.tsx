"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Slider } from "@repo/types/types";
import styles from "./home-slider.module.css";

type HomeSliderProps = {
    slides: Slider[];
    className?: string;
};

const AUTOPLAY_MS = 5000;

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

const normalizeHref = (href: string) => {
    const trimmed = href.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("/")) return trimmed;
    if (isExternalHref(trimmed)) return trimmed;
    return `/${trimmed}`;
};

export const HomeSlider = ({ slides, className = "" }: HomeSliderProps) => {
    const router = useRouter();
    const activeSlides = useMemo(
        () => slides.filter((slide) => slide.is_active).sort((a, b) => a.sort_order - b.sort_order),
        [slides],
    );

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const dragStartXRef = useRef<number | null>(null);
    const dragOffsetRef = useRef(0);
    const dragPointerIdRef = useRef<number | null>(null);
    const suppressClickRef = useRef(false);
    const clickHrefRef = useRef<string | null>(null);
    const clickHrefExternalRef = useRef(false);
    const [index, setIndex] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [autoplayKey, setAutoplayKey] = useState(0);

    const resetInteractionState = () => {
        const viewport = viewportRef.current;
        const pointerId = dragPointerIdRef.current;

        if (viewport && pointerId !== null && viewport.hasPointerCapture(pointerId)) {
            try {
                viewport.releasePointerCapture(pointerId);
            } catch {
                // Ignore capture release errors when the pointer is already gone.
            }
        }

        dragStartXRef.current = null;
        dragOffsetRef.current = 0;
        dragPointerIdRef.current = null;
        suppressClickRef.current = false;
        clickHrefRef.current = null;
        clickHrefExternalRef.current = false;
        setIsDragging(false);
        setDragOffset(0);
    };

    useEffect(() => {
        setIndex(0);
        resetInteractionState();
    }, [activeSlides.length]);

    useEffect(() => {
        const resetOnReturn = () => {
            setIndex(0);
            resetInteractionState();
            setAutoplayKey((currentKey) => currentKey + 1);
        };

        window.addEventListener("pageshow", resetOnReturn);
        window.addEventListener("focus", resetOnReturn);

        return () => {
            window.removeEventListener("pageshow", resetOnReturn);
            window.removeEventListener("focus", resetOnReturn);
        };
    }, []);

    useEffect(() => {
        if (activeSlides.length <= 1) {
            return;
        }

        const timer = window.setInterval(() => {
            setIndex((currentIndex) => (currentIndex + 1) % activeSlides.length);
        }, AUTOPLAY_MS);

        return () => window.clearInterval(timer);
    }, [activeSlides.length, autoplayKey]);

    if (activeSlides.length === 0) {
        return null;
    }

    const goTo = (nextIndex: number) => {
        setIndex((nextIndex + activeSlides.length) % activeSlides.length);
        setAutoplayKey((k) => k + 1);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (activeSlides.length <= 1) {
            return;
        }

        const currentSlide = activeSlides[index];
        const currentIsLinkAction = currentSlide?.action_type === "link" && !!currentSlide.button_link;
        const currentLink = currentIsLinkAction ? normalizeHref(currentSlide.button_link ?? "") : "";
        clickHrefRef.current = currentLink || null;
        clickHrefExternalRef.current = currentLink ? isExternalHref(currentLink) : false;

        event.currentTarget.setPointerCapture(event.pointerId);
        dragPointerIdRef.current = event.pointerId;
        setIsDragging(false);
        dragStartXRef.current = event.clientX;
        suppressClickRef.current = false;
        dragOffsetRef.current = 0;
        setDragOffset(0);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragStartXRef.current === null) {
            return;
        }

        const nextOffset = event.clientX - dragStartXRef.current;
        dragOffsetRef.current = nextOffset;

        const dragStartThreshold = 10;
        if (!isDragging && Math.abs(nextOffset) >= dragStartThreshold) {
            setIsDragging(true);
        }

        setDragOffset(isDragging ? nextOffset : 0);
    };

    const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragStartXRef.current === null) {
            return;
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        const viewportWidth = viewportRef.current?.clientWidth ?? 0;
        const threshold = Math.max(60, viewportWidth * 0.15);
        const hasSwipe = Math.abs(dragOffsetRef.current) > threshold;
        const clickSlop = 8;
        const isClick = Math.abs(dragOffsetRef.current) < clickSlop;

        if (dragOffsetRef.current < -threshold) {
            goTo(index + 1);
        } else if (dragOffsetRef.current > threshold) {
            goTo(index - 1);
        }

        // If the user interacted (drag end) but didn't cause a swipe change,
        // reset the autoplay timer so it starts counting from 0 again.
        if (!hasSwipe) {
            setAutoplayKey((k) => k + 1);
        }

        suppressClickRef.current = !isClick;

        if (isClick && clickHrefRef.current) {
            const href = clickHrefRef.current;
            if (clickHrefExternalRef.current) {
                window.location.assign(href);
            } else {
                router.push(href);
            }
        }

        setIsDragging(false);
        dragStartXRef.current = null;
        dragPointerIdRef.current = null;
        dragOffsetRef.current = 0;
        setDragOffset(0);
    };

    const handleLostPointerCapture = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragPointerIdRef.current === event.pointerId) {
            resetInteractionState();
        }
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!suppressClickRef.current) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
    };

    return (
        <section
            className={`relative w-full select-none overflow-hidden rounded-[28px] ${styles.root} ${className}`}
            aria-label="Home slider"
            style={{ ['--slideshow-btn-bg' as any]: '#ffda03', ['--slideshow-btn-c' as any]: '#ffffff' }}
        >
            <div className={`relative h-[260px] max-h-[500px] w-full sm:h-[320px] md:h-[360px] lg:h-[300px] ${styles.smallViewport}`}>
                <div
                    ref={viewportRef}
                    className="h-full w-full cursor-grab select-none overflow-hidden active:cursor-grabbing"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                    onLostPointerCapture={handleLostPointerCapture}
                    onClickCapture={handleClickCapture}
                    onDragStart={(event) => event.preventDefault()}
                    style={{ touchAction: "pan-y" }}
                >
                    <div
                        className={`flex h-full ${isDragging ? "" : "transition-transform duration-700 ease-in-out"}`}
                        style={{ transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))` }}
                    >
                        {activeSlides.map((slide, slideIndex) => {
                            const isLinkAction = slide.action_type === "link" && !!slide.button_link;
                            const slideLink = isLinkAction ? normalizeHref(slide.button_link ?? "") : "";
                            const slideIsExternal = slideLink ? isExternalHref(slideLink) : false;
                            const isPrioritySlide = slideIndex === 0;

                            return (
                                <article key={slide.id} className="relative h-full w-full shrink-0">
                                    {slideLink ? (
                                        slideIsExternal ? (
                                            <a
                                                href={slideLink}
                                                className="absolute inset-0 z-[1]"
                                                aria-label={slide.title ?? "Slider link"}
                                                draggable={false}
                                                rel="noreferrer"
                                            />
                                        ) : (
                                            <Link
                                                href={slideLink}
                                                className="absolute inset-0 z-[1]"
                                                aria-label={slide.title ?? "Slider link"}
                                                draggable={false}
                                                prefetch={false}
                                            />
                                        )
                                    ) : null}

                                    <picture className="block h-full w-full">
                                        {slide.mobile_image ? <source media="(max-width: 768px)" srcSet={slide.mobile_image} /> : null}
                                        <img
                                            src={slide.image}
                                            alt={slide.title ?? "Slider image"}
                                            className="h-full w-full object-cover"
                                            loading={isPrioritySlide ? "eager" : "lazy"}
                                            fetchPriority={isPrioritySlide ? "high" : "auto"}
                                            decoding={isPrioritySlide ? "sync" : "async"}
                                            draggable={false}
                                        />
                                    </picture>

                                    {(slide.title || slide.description || slide.button_text) ? (
                                        <div
                                            className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex w-full items-center p-5 sm:p-7 lg:p-12 ${
                                                slide.hide_text_mobile ? "hidden md:flex" : "flex"
                                            }`}
                                        >
                                            <div className="max-w-[560px] text-white">
                                                {slide.title ? (
                                                    <h2 className={`text-[34px] sm:text-[36px] font-bold leading-tight ${styles.title}`}>{slide.title}</h2>
                                                ) : null}
                                                {slide.description ? (
                                                    <p className={`mt-3 whitespace-pre-line text-[22px] leading-relaxed text-white/90 ${styles.description}`}>{slide.description}</p>
                                                ) : null}
                                                {slide.button_text && isLinkAction ? (
                                                    slideIsExternal ? (
                                                        <a
                                                            href={slideLink}
                                                            className={`pointer-events-auto mt-5 inline-flex items-center rounded-md transition ${styles.btn}`}
                                                            rel="noreferrer"
                                                        >
                                                            {slide.button_text}
                                                        </a>
                                                    ) : (
                                                        <Link
                                                            href={slideLink}
                                                            className={`pointer-events-auto mt-5 inline-flex items-center rounded-md transition ${styles.btn}`}
                                                            prefetch={false}
                                                        >
                                                            {slide.button_text}
                                                        </Link>
                                                    )
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>

            {activeSlides.length > 1 ? (
                <div className={styles.controls}>
                    <button
                        type="button"
                        onClick={() => goTo(index - 1)}
                        className={`flex items-center justify-center cursor-pointer rounded-full bg-white text-black shadow-sm ${styles.controlButton}`}
                        aria-label="Previous slide"
                        suppressHydrationWarning
                    >
                        <i className="fas fa-arrow-left" aria-hidden="true" />
                    </button>
                    <span className={`${styles.counter}`}>
                        {index + 1} / {activeSlides.length}
                    </span>
                    <button
                        type="button"
                        onClick={() => goTo(index + 1)}
                        className={`flex items-center justify-center cursor-pointer rounded-full bg-white text-black shadow-sm ${styles.controlButton}`}
                        aria-label="Next slide"
                        suppressHydrationWarning
                    >
                        <i className="fas fa-arrow-right" aria-hidden="true" />
                    </button>
                </div>
            ) : null}
        </section>
    );
};
