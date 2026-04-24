"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

type Company = {
    id: string;
    name: string;
    logo: string;
};

type CompanyCarouselProps = {
    companies: Company[];
};

const SLIDE_DURATION = 3000;
const ANIMATION_DURATION = 600;

// Responsive visible counts
const getVisibleCount = (width: number) => {
    if (width >= 1024) return 6;  // Desktop: 6 items
    if (width >= 768) return 5;   // Tablet: 5 items (768-1024)
    return 3;                     // Mobile: 3 items (<768)
};

export const CompanyCarousel = ({ companies }: CompanyCarouselProps) => {
    const [startIndex, setStartIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [itemWidth, setItemWidth] = useState(0);
    const [visibleCount, setVisibleCount] = useState(6);
    const viewportRef = useRef<HTMLDivElement>(null);

    // Calculate exact item width based on viewport
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const calculateWidth = () => {
            const viewportWidth = viewport.offsetWidth;
            const count = getVisibleCount(window.innerWidth);
            setVisibleCount(count);
            // Each item takes exactly 1/visibleCount of viewport width
            setItemWidth(Math.floor(viewportWidth / count));
        };

        calculateWidth();
        window.addEventListener('resize', calculateWidth);
        return () => window.removeEventListener('resize', calculateWidth);
    }, []);

    useEffect(() => {
        if (companies.length <= visibleCount) return;

        const interval = setInterval(() => {
            setIsAnimating(true);
            
            setTimeout(() => {
                setStartIndex((prev) => (prev + 1) % companies.length);
                setIsAnimating(false);
            }, ANIMATION_DURATION);
        }, SLIDE_DURATION);

        return () => clearInterval(interval);
    }, [companies.length, visibleCount]);

    if (companies.length === 0) {
        return null;
    }

    // Get visibleCount+1 companies (extra one for smooth slide animation)
    const getVisibleCompanies = () => {
        const visible = [];
        for (let i = 0; i < visibleCount + 1; i++) {
            const index = (startIndex + i) % companies.length;
            const company = companies[index];
            if (company) {
                visible.push({ ...company, uniqueId: `${company.id}-${startIndex}-${i}` });
            }
        }
        return visible;
    };

    const visibleCompanies = getVisibleCompanies();

    return (
        <div className="w-full py-3 pl-1.5 pr-0 border border-gray-200 rounded-[20px] bg-white overflow-hidden">
            <div className="overflow-hidden w-full" ref={viewportRef}>
                <div 
                    className={clsx(
                        "flex items-center justify-start",
                        isAnimating && "transition-transform duration-[600ms] ease-in-out",
                        !isAnimating && "transition-none"
                    )}
                    style={{ 
                        width: itemWidth * (visibleCount + 1),
                        transform: isAnimating ? `translateX(-${itemWidth}px)` : 'translateX(0)',
                    }}
                >
                    {visibleCompanies.map((company) => (
                        <div 
                            key={company.uniqueId} 
                            className="flex items-center justify-center p-0 box-border"
                            style={{ width: itemWidth }}
                        >
                            <img
                                src={company.logo}
                                alt={company.name}
                                className="w-full h-auto object-contain max-h-[75px] max-w-[200px] md:max-h-[90px] md:max-w-[240px] lg:max-h-[100px] lg:max-w-[280px]"
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
