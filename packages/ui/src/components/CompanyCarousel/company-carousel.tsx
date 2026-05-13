"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image, { type StaticImageData } from "next/image";
import styles from "../../styles/components/company-carousel.module.css";
import { cn } from "../../lib/utils";

export type Company = {
  id: string;
  name?: string;
  logo?: string | StaticImageData | null;
  url?: string;
};

type Props = {
  companies: Company[];
};

const SLIDE_DURATION = 3000;
const ANIMATION_DURATION = 600;

const getVisibleCount = (width: number) => {
  if (width >= 1024) return 6;
  if (width >= 768) return 5;
  return 3;
};

function imageHeightFor(visibleCount: number) {
  return visibleCount >= 6 ? 100 : visibleCount >= 5 ? 90 : 75;
}

export const CompanyCarousel: React.FC<Props> = ({ companies }) => {
  if (!companies || companies.length === 0) return null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [visibleCount, setVisibleCount] = useState(() => getVisibleCount(typeof window !== "undefined" ? window.innerWidth : 1200));
  const [itemWidth, setItemWidth] = useState(0);

  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragDxRef = useRef(0);
  const [, setDragTick] = useState(0);

  // clones for infinite scroll
  const cloneCount = visibleCount;
  const extended = useMemo(() => {
    const left = companies.slice(-cloneCount);
    const right = companies.slice(0, cloneCount);
    return [...left, ...companies, ...right];
  }, [companies, cloneCount]);

  const [currentIndex, setCurrentIndex] = useState(cloneCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const calculate = () => {
      const count = getVisibleCount(window.innerWidth);
      setVisibleCount(count);
      setItemWidth(Math.floor(viewport.offsetWidth / count));
    };

    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, []);

  // reset currentIndex when companies or visibleCount change
  useEffect(() => {
    setCurrentIndex(cloneCount);
  }, [cloneCount, companies.length]);

  const firstRealIndex = cloneCount;
  const lastRealIndex = cloneCount + companies.length - 1;

  const goToIndex = useCallback(
    (index: number) => {
      setIsAnimating(true);
      setCurrentIndex(index);

      window.setTimeout(() => {
        setIsAnimating(false);
        // wrap without animation if we crossed clones
        if (index > lastRealIndex) {
          setCurrentIndex(index - companies.length);
        } else if (index < firstRealIndex) {
          setCurrentIndex(index + companies.length);
        }
      }, ANIMATION_DURATION);
    },
    [companies.length, firstRealIndex, lastRealIndex]
  );

  // auto slide
  useEffect(() => {
    if (companies.length <= visibleCount) return;

    const iv = setInterval(() => {
      if (pausedRef.current || draggingRef.current) return;
      goToIndex(currentIndex + 1);
    }, SLIDE_DURATION);

    return () => clearInterval(iv);
  }, [companies.length, visibleCount, currentIndex, goToIndex]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (companies.length <= visibleCount) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
    pausedRef.current = true;
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragDxRef.current = 0;
    setIsAnimating(false);
    setDragTick((t) => t + 1);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    dragDxRef.current = e.clientX - dragStartXRef.current;
    setDragTick((t) => t + 1);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    const dx = dragDxRef.current;
    if (itemWidth > 0) {
      // negative dx means user dragged left (advance forward), so -dx/itemWidth
      const deltaItems = Math.round(-dx / itemWidth);
      if (deltaItems !== 0) {
        goToIndex(currentIndex + deltaItems);
      } else {
        goToIndex(currentIndex);
      }
    } else {
      goToIndex(currentIndex);
    }

    pausedRef.current = false;
    dragDxRef.current = 0;
    setDragTick((t) => t + 1);
  };

  const [tooltip, setTooltip] = useState<{ text: string; left: number } | null>(null);
  const showTooltipReal = (el: HTMLDivElement, name?: string) => {
    if (!name || !containerRef.current) {
      setTooltip(null);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    setTooltip({ text: name, left: itemRect.left - containerRect.left + itemRect.width / 2 });
  };

  const translate = -currentIndex * itemWidth + (draggingRef.current ? dragDxRef.current : 0);

  return (
    <div
      className={styles.containerWrap}
      ref={containerRef}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
    >
      {tooltip ? (
        <span className={styles.blockTooltip} style={{ left: tooltip.left }}>
          {tooltip.text}
        </span>
      ) : null}

      <div className={styles.container}>
        <div
          className={cn(styles.viewport, draggingRef.current ? styles.viewportDragging : "")}
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className={cn(styles.track, !draggingRef.current && isAnimating ? styles.animating : styles.noTransition)}
            style={{ width: itemWidth * extended.length, transform: `translateX(${translate}px)` }}
          >
            {extended.map((c, i) => {
              const logoHeight = Math.max(44, Math.floor(imageHeightFor(visibleCount) * 0.8));
              const logoNode = c.logo ? (
                <div className={styles.logoInner} style={{ height: logoHeight }}>
                  <Image
                    src={c.logo as any}
                    alt={c.name ?? ""}
                    fill
                    style={{ objectFit: "contain" }}
                    sizes={`${itemWidth}px`}
                    unoptimized={typeof c.logo === "string" && c.logo.startsWith("http")}
                    draggable={false}
                  />
                </div>
              ) : null;

              const key = `${i}-${c.id ?? i}`;

              return (
                <div
                  key={key}
                  className={styles.companyItem}
                  style={{ width: itemWidth, height: imageHeightFor(visibleCount) }}
                  onMouseEnter={(e) => showTooltipReal(e.currentTarget, c.name)}
                  onMouseMove={(e) => showTooltipReal(e.currentTarget, c.name)}
                  onMouseLeave={() => setTooltip(null)}
                  onFocusCapture={(e) => showTooltipReal(e.currentTarget, c.name)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setTooltip(null);
                    }
                  }}
                >
                  {c.url ? (
                    <a href={c.url} className={styles.companyLink} target="_blank" rel="noreferrer" aria-label={c.name ? `${c.name} partner səhifəsi` : "Partner səhifəsi"}>
                      {logoNode}
                    </a>
                  ) : (
                    <div className={styles.companyLink}>{logoNode}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyCarousel;
