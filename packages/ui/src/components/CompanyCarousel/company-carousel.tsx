"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
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
const DEFAULT_VISIBLE_COUNT = 6;
const DRAG_CLICK_THRESHOLD = 24;

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

  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);
  const [itemWidth, setItemWidth] = useState(0);

  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const pointerDownRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
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
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pausedRef.current = true;
    pointerDownRef.current = true;
    activePointerIdRef.current = e.pointerId;
    suppressClickRef.current = false;
    draggingRef.current = false;
    dragStartXRef.current = e.clientX;
    dragDxRef.current = 0;
    setDragTick((t) => t + 1);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    dragDxRef.current = e.clientX - dragStartXRef.current;

    if (!draggingRef.current && Math.abs(dragDxRef.current) > DRAG_CLICK_THRESHOLD) {
      draggingRef.current = true;
      setIsAnimating(false);
    }

    if (!draggingRef.current) return;
    e.preventDefault();
    setDragTick((t) => t + 1);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    pointerDownRef.current = false;
    activePointerIdRef.current = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Pointer capture may already be released by the browser.
    }

    if (!draggingRef.current) {
      pausedRef.current = false;
      suppressClickRef.current = false;
      dragDxRef.current = 0;
      setDragTick((t) => t + 1);
      return;
    }

    draggingRef.current = false;
    suppressClickRef.current = Math.abs(dragDxRef.current) > DRAG_CLICK_THRESHOLD;

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
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;

    const target = e.target as HTMLElement | null;
    const hasLink = target?.closest("a") || false;
    if (hasLink) {
      suppressClickRef.current = false;
      return;
    }

    const path = (e.nativeEvent as MouseEvent).composedPath?.() ?? [];
    const hasLinkInPath = path.some((node) => node instanceof Element && node.closest("a") !== null);
    if (hasLinkInPath) {
      suppressClickRef.current = false;
      return;
    }

    suppressClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }

    pointerDownRef.current = false;
    activePointerIdRef.current = null;
    draggingRef.current = false;
    suppressClickRef.current = false;
    dragDxRef.current = 0;
    pausedRef.current = false;
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
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onPointerCancel}
          onClickCapture={onClickCapture}
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
              const href = typeof c.url === "string" ? c.url.trim() : "";
              const isExternalHref = /^https?:\/\//i.test(href);
              const hasLink = Boolean(href);

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
                  {hasLink ? (
                    isExternalHref ? (
                      <a
                        href={href}
                        className={styles.companyLink}
                        target="_blank"
                        rel="noreferrer"
                        onClickCapture={(event) => event.stopPropagation()}
                        aria-label={c.name ? `${c.name} partner səhifəsi` : "Partner səhifəsi"}
                      >
                        {logoNode}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className={styles.companyLink}
                        prefetch={false}
                        onClickCapture={(event) => event.stopPropagation()}
                        aria-label={c.name ? `${c.name} partner səhifəsi` : "Partner səhifəsi"}
                      >
                        {logoNode}
                      </Link>
                    )
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
