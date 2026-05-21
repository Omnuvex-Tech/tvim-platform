"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";

type CategoryItem = {
    label: string;
    href: string;
    iconClass?: string;
    iconImageUrl?: string;
    backgroundImageUrl?: string;
    iconEmoji?: string;
};

const fallbackCategoryItems: CategoryItem[] = [
    { label: "Elektrik malları və İşıqlandırma", href: "#", iconEmoji: "💡" },
    { label: "Santexnika, su təchizatı və istilik", href: "#", iconEmoji: "🚰" },
    { label: "Əl alətləri", href: "#", iconEmoji: "🛠️" },
    { label: "Avadanlıqlar", href: "#", iconEmoji: "⚙️" },
    { label: "Tikinti materialları", href: "#", iconEmoji: "🧱" },
    { label: "Silikonlar və mastiklər", href: "#", iconEmoji: "🧴" },
    { label: "Alçıpan sistemləri", href: "#", iconEmoji: "📦" },
    { label: "İnşaat tozları və əlavələr", href: "#", iconEmoji: "🧪" },
    { label: "İstilik izolyasiya", href: "#", iconEmoji: "⬜" },
];

type CategoryStripProps = {
    items?: CategoryItem[];
};

const CategoryStrip = ({ items = [] }: CategoryStripProps) => {
    const categoryItems = items.length > 0 ? items : fallbackCategoryItems;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const supportsPointerRef = useRef(false);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const startScrollLeftRef = useRef(0);
    const suppressClickRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragEnabled, setDragEnabled] = useState(false);

    useEffect(() => {
        supportsPointerRef.current = typeof window !== "undefined" && "PointerEvent" in window;

        const widthMq = window.matchMedia("(max-width: 1023.98px)");
        const coarseMq = window.matchMedia("(hover: none) and (pointer: coarse)");
        const update = () => setDragEnabled(widthMq.matches || coarseMq.matches);
        update();

        if (widthMq.addEventListener) widthMq.addEventListener("change", update);
        else widthMq.addListener(update);

        if (coarseMq.addEventListener) coarseMq.addEventListener("change", update);
        else coarseMq.addListener(update);

        return () => {
            if (widthMq.removeEventListener) widthMq.removeEventListener("change", update);
            else widthMq.removeListener(update);

            if (coarseMq.removeEventListener) coarseMq.removeEventListener("change", update);
            else coarseMq.removeListener(update);
        };
    }, []);

    const startDrag = (clientX: number) => {
        const el = containerRef.current;
        if (!el) return;

        isDraggingRef.current = true;
        setIsDragging(true);
        startXRef.current = clientX;
        startScrollLeftRef.current = el.scrollLeft;
        suppressClickRef.current = false;
    };

    const moveDrag = (clientX: number) => {
        const el = containerRef.current;
        if (!isDraggingRef.current || !el) return;

        const dx = clientX - startXRef.current;
        if (Math.abs(dx) > 5) suppressClickRef.current = true;
        el.scrollLeft = startScrollLeftRef.current - dx;
    };

    const finishDrag = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        // keep suppressClick for a tick so click handlers can be ignored
        setTimeout(() => (suppressClickRef.current = false), 0);
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // On real touch devices we rely on native horizontal scrolling for stability.
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        startDrag(e.clientX);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        moveDrag(e.clientX);
    };

    const endDrag = () => {
        if (!isDraggingRef.current) return;
        finishDrag();
    };

    const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragEnabled && !supportsPointerRef.current) return;
        if (suppressClickRef.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClickRef.current = false;
        }
    };

    return (
        <section className="w-full font-[family-name:var(--font-inter)]">
            <div className="mx-auto w-full max-w-[1280px] px-0">
                <div
                    ref={containerRef}
                    onPointerDown={supportsPointerRef.current ? onPointerDown : undefined}
                    onPointerMove={supportsPointerRef.current ? onPointerMove : undefined}
                    onPointerUp={supportsPointerRef.current ? endDrag : undefined}
                    onPointerCancel={supportsPointerRef.current ? endDrag : undefined}
                    onPointerLeave={supportsPointerRef.current ? endDrag : undefined}
                    onClickCapture={onClickCapture}
                    style={{ touchAction: "auto", WebkitOverflowScrolling: "touch" }}
                    className={`grid grid-flow-col auto-cols-[minmax(120px,auto)] gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:flex-wrap md:justify-center md:gap-4 md:overflow-visible lg:grid lg:grid-flow-row lg:grid-cols-9 py-2 ${isDragging ? "cursor-grabbing" : "cursor-grab"} md:cursor-default`}
                >
                    {categoryItems.map(({ label, href, iconClass, iconImageUrl, iconEmoji }) => {
                        const key = `${label}-${href}`;
                        const isInternal = /^\/(?!\/)/.test(String(href ?? ""));
                        const classes = `select-none group flex h-[170px] max-[512px]:h-[160px] flex-col items-center justify-start gap-6 rounded-[14px] border border-[#e2e6ef] bg-white px-4 max-[512px]:px-6 pt-7 pb-7 text-center shadow-none transition-transform duration-200 ease-out hover:-translate-y-1 md:flex-shrink-0 md:w-[120px] md:min-w-[120px] md:max-w-[120px] ${
                            isDragging ? "cursor-grabbing" : "cursor-pointer"
                        } md:cursor-pointer`;

                        const content = (
                            <>
                                <span className="inline-flex h-11 items-center justify-center select-none" aria-hidden="true">
                                    {iconImageUrl ? (
                                        <img src={iconImageUrl} alt="" className="h-16 w-16 object-contain select-none" draggable={false} />
                                    ) : iconClass ? (
                                        <i className={`${iconClass} text-[42px] leading-none text-[#475066] select-none`} />
                                    ) : (
                                        <span className="text-[44px] leading-none select-none">{iconEmoji ?? "📦"}</span>
                                    )}
                                </span>
                                <span className="text-[12px] leading-[1.2] font-semibold text-[#131722] select-none">{label}</span>
                            </>
                        );

                        return isInternal ? (
                            <Link key={key} href={href} draggable={false} style={{ touchAction: "auto" }} className={classes}>
                                {content}
                            </Link>
                        ) : (
                            <a key={key} href={href} draggable={false} style={{ touchAction: "auto" }} className={classes}>
                                {content}
                            </a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

type CategoryStrip2Props = {
    items?: CategoryItem[];
};

const CategoryStrip2 = ({ items = [] }: CategoryStrip2Props) => {
    const categoryItems = items.length > 0 ? items : fallbackCategoryItems;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const supportsPointerRef = useRef(false);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const startScrollLeftRef = useRef(0);
    const suppressClickRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragEnabled, setDragEnabled] = useState(false);

    useEffect(() => {
        supportsPointerRef.current = typeof window !== "undefined" && "PointerEvent" in window;

        const widthMq = window.matchMedia("(max-width: 1023.98px)");
        const coarseMq = window.matchMedia("(hover: none) and (pointer: coarse)");
        const update = () => setDragEnabled(widthMq.matches || coarseMq.matches);
        update();

        if (widthMq.addEventListener) widthMq.addEventListener("change", update);
        else widthMq.addListener(update);

        if (coarseMq.addEventListener) coarseMq.addEventListener("change", update);
        else coarseMq.addListener(update);

        return () => {
            if (widthMq.removeEventListener) widthMq.removeEventListener("change", update);
            else widthMq.removeListener(update);

            if (coarseMq.removeEventListener) coarseMq.removeEventListener("change", update);
            else coarseMq.removeListener(update);
        };
    }, []);

    const startDrag = (clientX: number) => {
        const el = containerRef.current;
        if (!el) return;

        isDraggingRef.current = true;
        setIsDragging(true);
        startXRef.current = clientX;
        startScrollLeftRef.current = el.scrollLeft;
        suppressClickRef.current = false;
    };

    const moveDrag = (clientX: number) => {
        const el = containerRef.current;
        if (!isDraggingRef.current || !el) return;

        const dx = clientX - startXRef.current;
        if (Math.abs(dx) > 5) suppressClickRef.current = true;
        el.scrollLeft = startScrollLeftRef.current - dx;
    };

    const finishDrag = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        setTimeout(() => (suppressClickRef.current = false), 0);
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        startDrag(e.clientX);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        moveDrag(e.clientX);
    };

    const endDrag = () => {
        if (!isDraggingRef.current) return;
        finishDrag();
    };

    const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragEnabled && !supportsPointerRef.current) return;
        if (suppressClickRef.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClickRef.current = false;
        }
    };

    return (
        <section className="w-full font-[family-name:var(--font-inter)]">
            <div className="mx-auto w-full max-w-[1280px] px-0">
                <div
                    ref={containerRef}
                    onPointerDown={supportsPointerRef.current ? onPointerDown : undefined}
                    onPointerMove={supportsPointerRef.current ? onPointerMove : undefined}
                    onPointerUp={supportsPointerRef.current ? endDrag : undefined}
                    onPointerCancel={supportsPointerRef.current ? endDrag : undefined}
                    onPointerLeave={supportsPointerRef.current ? endDrag : undefined}
                    onClickCapture={onClickCapture}
                    style={{ touchAction: "auto", WebkitOverflowScrolling: "touch" }}
                    className={`grid grid-flow-col auto-cols-[100px] gap-3 overflow-x-auto pb-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[minmax(136px,1fr)] sm:gap-3 md:auto-cols-[minmax(148px,1fr)] md:gap-4 lg:auto-cols-[calc((100%-6rem)/7)] ${isDragging ? "cursor-grabbing" : "cursor-grab"} lg:cursor-default`}
                >
                    {categoryItems.map(({ label, href, iconClass, iconImageUrl, backgroundImageUrl, iconEmoji }) => {
                        const image = backgroundImageUrl ?? iconImageUrl;

                        return (
                            <a
                                key={`${label}-${href}`}
                                href={href}
                                draggable={false}
                                style={{ touchAction: "auto" }}
                                className={`group relative block aspect-square min-w-0 select-none overflow-hidden rounded-[12px] bg-[rgba(217,217,221,0.24)] p-2.5 shadow-none transition-transform duration-200 ease-out hover:-translate-y-1 sm:rounded-[16px] sm:p-4 ${isDragging ? "cursor-grabbing" : "cursor-pointer"}`}
                            >
                                {image ? (
                                    <>
                                        <img
                                            src={image}
                                            alt={label}
                                            className="absolute inset-[3px] h-[calc(100%-6px)] w-[calc(100%-6px)] object-cover object-center"
                                            draggable={false}
                                        />
                                        <div className="absolute inset-[3px] h-[calc(100%-6px)] w-[calc(100%-6px)] bg-[rgba(217,217,221,0.24)]" aria-hidden="true" />
                                    </>
                                ) : null}

                                {!image ? (
                                    <span className="absolute right-3 bottom-3 text-[36px] leading-none opacity-70 sm:right-4 sm:bottom-4 sm:text-[56px]" aria-hidden="true">
                                        {iconClass ? <i className={iconClass} /> : (iconEmoji ?? "📦")}
                                    </span>
                                ) : null}

                                <span
                                    className="relative z-10 block w-full text-[13px] leading-[1.15] font-bold text-[#1f2328] sm:text-[16px] md:text-[22px]"
                                    style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                                >
                                    {label}
                                </span>
                            </a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export { CategoryStrip };
export { CategoryStrip2 };
export type { CategoryItem as CategoryStripItem };
