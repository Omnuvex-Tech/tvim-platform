"use client";

import React, { useRef, useState, useEffect } from "react";

type CategoryItem = {
    label: string;
    href: string;
    iconClass?: string;
    iconImageUrl?: string;
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
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const startScrollLeftRef = useRef(0);
    const suppressClickRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragEnabled, setDragEnabled] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767.98px)");
        const update = () => setDragEnabled(mq.matches);
        update();
        if (mq.addEventListener) mq.addEventListener("change", update);
        else mq.addListener(update);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", update);
            else mq.removeListener(update);
        };
    }, []);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = containerRef.current;
        if (!el) return;
        isDraggingRef.current = true;
        setIsDragging(true);
        startXRef.current = e.clientX;
        startScrollLeftRef.current = el.scrollLeft;
        suppressClickRef.current = false;
        try {
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
        } catch {}
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = containerRef.current;
        if (!isDraggingRef.current || !el) return;
        const dx = e.clientX - startXRef.current;
        if (Math.abs(dx) > 5) suppressClickRef.current = true;
        el.scrollLeft = startScrollLeftRef.current - dx;
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        try {
            (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        } catch {}
        // keep suppressClick for a tick so click handlers can be ignored
        setTimeout(() => (suppressClickRef.current = false), 0);
    };

    const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
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
                    onPointerDown={dragEnabled ? onPointerDown : undefined}
                    onPointerDownCapture={dragEnabled ? onPointerDown : undefined}
                    onPointerMove={dragEnabled ? onPointerMove : undefined}
                    onPointerUp={dragEnabled ? endDrag : undefined}
                    onPointerCancel={dragEnabled ? endDrag : undefined}
                    onPointerLeave={dragEnabled ? endDrag : undefined}
                    onClickCapture={onClickCapture}
                    style={{ touchAction: "pan-y" }}
                    className={`grid grid-flow-col auto-cols-[minmax(120px,auto)] gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:flex-wrap md:justify-center md:gap-4 md:overflow-visible lg:grid lg:grid-flow-row lg:grid-cols-9 py-2 ${isDragging ? "cursor-grabbing" : "cursor-grab"} md:cursor-default`}
                >
                    {categoryItems.map(({ label, href, iconClass, iconImageUrl, iconEmoji }) => (
                        <a
                            key={`${label}-${href}`}
                            href={href}
                            draggable={false}
                            style={{ touchAction: 'pan-y' }}
                            className="select-none group flex h-[170px] max-[512px]:h-[160px] flex-col items-center justify-start gap-6 rounded-[14px] border border-[#e2e6ef] bg-white px-4 max-[512px]:px-6 pt-7 pb-7 text-center shadow-none transition-transform duration-200 ease-out hover:-translate-y-1 md:flex-shrink-0 md:w-[120px] md:min-w-[120px] md:max-w-[120px] md:cursor-default"
                        >
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
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export { CategoryStrip };
export type { CategoryItem as CategoryStripItem };