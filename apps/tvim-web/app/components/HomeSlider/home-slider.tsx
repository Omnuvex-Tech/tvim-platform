"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Slider } from "@repo/types/types";
import styles from "./home-slider.module.css";

type HomeSliderProps = {
    slides: Slider[];
    className?: string;
};

const AUTOPLAY_MS = 5000;

export const HomeSlider = ({ slides, className = "" }: HomeSliderProps) => {
    const activeSlides = useMemo(
        () => slides.filter((slide) => slide.is_active).sort((a, b) => a.sort_order - b.sort_order),
        [slides],
    );

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const dragStartXRef = useRef<number | null>(null);
    const dragOffsetRef = useRef(0);
    const suppressClickRef = useRef(false);
    const [index, setIndex] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [autoplayKey, setAutoplayKey] = useState(0);

    useEffect(() => {
        setIndex(0);
    }, [activeSlides.length]);

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

        setIsDragging(true);
        dragStartXRef.current = event.clientX;
        suppressClickRef.current = false;
        dragOffsetRef.current = 0;
        setDragOffset(0);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || dragStartXRef.current === null) {
            return;
        }

        const nextOffset = event.clientX - dragStartXRef.current;
        dragOffsetRef.current = nextOffset;
        setDragOffset(nextOffset);
    };

    const handlePointerEnd = () => {
        if (!isDragging) {
            return;
        }

        const viewportWidth = viewportRef.current?.clientWidth ?? 0;
        const threshold = Math.max(60, viewportWidth * 0.15);
        const hasSwipe = Math.abs(dragOffsetRef.current) > threshold;

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

        suppressClickRef.current = hasSwipe;

        setIsDragging(false);
        dragStartXRef.current = null;
        dragOffsetRef.current = 0;
        setDragOffset(0);
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
                    onPointerLeave={handlePointerEnd}
                    onClickCapture={handleClickCapture}
                    onDragStart={(event) => event.preventDefault()}
                    style={{ touchAction: "pan-y" }}
                >
                    <div
                        className={`flex h-full ${isDragging ? "" : "transition-transform duration-700 ease-in-out"}`}
                        style={{ transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))` }}
                    >
                        {activeSlides.map((slide) => {
                            const isLinkAction = slide.action_type === "link" && !!slide.button_link;
                            const slideLink = isLinkAction ? slide.button_link : undefined;

                            return (
                                <article key={slide.id} className="relative h-full w-full shrink-0">
                                    {slideLink ? (
                                        <a
                                            href={slideLink}
                                            className="absolute inset-0 z-[1]"
                                            aria-label={slide.title ?? "Slider link"}
                                            draggable={false}
                                        />
                                    ) : null}

                                    <picture className="block h-full w-full">
                                        {slide.mobile_image ? <source media="(max-width: 768px)" srcSet={slide.mobile_image} /> : null}
                                        <img
                                            src={slide.image}
                                            alt={slide.title ?? "Slider image"}
                                            className="h-full w-full object-cover"
                                            draggable={false}
                                        />
                                    </picture>

                                    {(slide.title || slide.description || slide.button_text) ? (
                                        <div
                                            className={`absolute inset-y-0 left-0 z-10 flex w-full items-center p-5 sm:p-7 lg:p-12 ${
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
                                                    <a
                                                        href={slide.button_link!}
                                                        className={`pointer-events-auto mt-5 inline-flex items-center rounded-md transition ${styles.btn}`}
                                                    >
                                                        {slide.button_text}
                                                    </a>
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
                    >
                        <i className="fas fa-arrow-right" aria-hidden="true" />
                    </button>
                </div>
            ) : null}
        </section>
    );
};
