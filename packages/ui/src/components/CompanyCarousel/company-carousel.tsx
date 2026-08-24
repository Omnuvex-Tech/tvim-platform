"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { isOptimizableSrc } from "../RemoteImage";
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
/** Pointer travel (px) that turns a press into a drag instead of a click. */
const DRAG_START_THRESHOLD = 8;
/** Share of a slide that has to be dragged before the release snaps to the next one. */
const DRAG_SNAP_RATIO = 0.2;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const getVisibleCount = (width: number) => {
  if (width >= 1024) return 6;
  if (width >= 768) return 5;
  return 3;
};

function imageHeightFor(visibleCount: number) {
  return visibleCount >= 6 ? 100 : visibleCount >= 5 ? 90 : 75;
}

export const CompanyCarousel: React.FC<Props> = ({ companies }) => {
  const items = useMemo(() => (Array.isArray(companies) ? companies.filter(Boolean) : []), [companies]);
  const itemCount = items.length;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);
  const [itemWidth, setItemWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDx, setDragDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; left: number } | null>(null);

  const hoveredRef = useRef(false);
  const pointerDownRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  /** Pointer position when the press started, used for the drag threshold only. */
  const pressStartXRef = useRef(0);
  /** Pointer position that maps to "no offset"; shifts by a slide on every wrap. */
  const dragOriginXRef = useRef(0);
  const dragDxRef = useRef(0);
  const settleTimerRef = useRef<number | null>(null);
  const clickResetTimerRef = useRef<number | null>(null);

  // Looping only makes sense when there are more logos than fit on screen; with
  // fewer, cloning would leave the track shorter than the offset it is moved by
  // and the carousel would render empty.
  const canLoop = itemCount > visibleCount;
  const cloneCount = canLoop ? visibleCount : 0;
  const firstRealIndex = cloneCount;
  const lastRealIndex = cloneCount + itemCount - 1;

  const extended = useMemo(() => {
    if (!canLoop) return items;
    return [...items.slice(-cloneCount), ...items, ...items.slice(0, cloneCount)];
  }, [items, canLoop, cloneCount]);

  /** Brings an index back into the real (non-cloned) range. */
  const wrapIndex = useCallback(
    (index: number) => {
      if (!canLoop || itemCount === 0) return 0;
      let next = index;
      while (next > lastRealIndex) next -= itemCount;
      while (next < firstRealIndex) next += itemCount;
      return next;
    },
    [canLoop, itemCount, firstRealIndex, lastRealIndex]
  );

  const applyDragDx = useCallback((value: number) => {
    dragDxRef.current = value;
    setDragDx(value);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      const width = viewport.getBoundingClientRect().width;
      const count = getVisibleCount(window.innerWidth);
      setVisibleCount(count);
      setItemWidth(width > 0 ? width / count : 0);
    };

    measure();

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(viewport);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Re-centre on the first real slide whenever the layout or the data changes.
  useEffect(() => {
    setCurrentIndex(firstRealIndex);
    applyDragDx(0);
  }, [firstRealIndex, itemCount, applyDragDx]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      if (clickResetTimerRef.current) window.clearTimeout(clickResetTimerRef.current);
    },
    []
  );

  /** Ends the running transition and pulls the index back out of the clones. */
  const settle = useCallback(() => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      setIsAnimating(false);
      setCurrentIndex((prev) => wrapIndex(prev));
    }, ANIMATION_DURATION);
  }, [wrapIndex]);

  const slideBy = useCallback(
    (delta: number) => {
      if (!canLoop || delta === 0) return;
      setIsAnimating(true);
      setCurrentIndex((prev) => prev + delta);
      settle();
    },
    [canLoop, settle]
  );

  useEffect(() => {
    if (!canLoop || prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      if (hoveredRef.current || pointerDownRef.current || draggingRef.current) return;
      if (document.hidden) return;
      slideBy(1);
    }, SLIDE_DURATION);

    return () => window.clearInterval(timer);
  }, [canLoop, prefersReducedMotion, slideBy]);

  /** Current on-screen offset of the track, so a grab can continue from it. */
  const readTrackTranslate = () => {
    const track = trackRef.current;
    if (!track) return null;
    const transform = window.getComputedStyle(track).transform;
    if (!transform || transform === "none") return 0;
    try {
      return new DOMMatrixReadOnly(transform).m41;
    } catch {
      return null;
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canLoop || itemWidth <= 0) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Freeze an in-flight transition where it currently sits instead of letting
    // the track jump to the slide it was heading for.
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    const wrapped = wrapIndex(currentIndex);
    let startOffset = 0;
    if (isAnimating) {
      const translate = readTrackTranslate();
      if (translate != null) startOffset = translate + wrapped * itemWidth;
      setIsAnimating(false);
    }
    setCurrentIndex(wrapped);

    pointerDownRef.current = true;
    activePointerIdRef.current = e.pointerId;
    draggingRef.current = false;
    suppressClickRef.current = false;
    pressStartXRef.current = e.clientX;
    dragOriginXRef.current = e.clientX - startOffset;
    applyDragDx(startOffset);
    setTooltip(null);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    if (itemWidth <= 0) return;

    if (!draggingRef.current) {
      if (Math.abs(e.clientX - pressStartXRef.current) <= DRAG_START_THRESHOLD) return;
      draggingRef.current = true;
      setIsDragging(true);
      setIsAnimating(false);
      // A touch pointer is already implicitly captured by the logo link the
      // finger landed on, and its events bubble up here anyway. Grabbing the
      // capture would move it off that link and make the browser fire a
      // lostpointercapture that bubbles straight back into the handler below,
      // ending the drag on its second pixel. Only a mouse needs the capture.
      if (e.pointerType !== "touch") {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // capture is best effort; the drag still works without it
        }
      }
    }

    let offset = e.clientX - dragOriginXRef.current;

    // Keep the offset below one slide by moving the index instead. Without this
    // the track can be dragged past its last clone and show empty space.
    const steps = Math.trunc(offset / itemWidth);
    if (steps !== 0) {
      offset -= steps * itemWidth;
      dragOriginXRef.current += steps * itemWidth;
      setCurrentIndex((prev) => wrapIndex(prev - steps));
    }

    applyDragDx(offset);
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
    if (!pointerDownRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;

    pointerDownRef.current = false;
    activePointerIdRef.current = null;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // nothing to release
    }

    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    setIsDragging(false);

    const dx = dragDxRef.current;
    applyDragDx(0);

    if (wasDragging) {
      suppressClickRef.current = true;
      if (clickResetTimerRef.current) window.clearTimeout(clickResetTimerRef.current);
      clickResetTimerRef.current = window.setTimeout(() => {
        clickResetTimerRef.current = null;
        suppressClickRef.current = false;
      }, 400);
    }

    if (dx === 0) return;

    let delta = 0;
    if (commit && itemWidth > 0) {
      delta = Math.round(-dx / itemWidth);
      if (delta === 0 && Math.abs(dx) > itemWidth * DRAG_SNAP_RATIO) delta = dx < 0 ? 1 : -1;
    }

    setIsAnimating(true);
    if (delta !== 0) setCurrentIndex((prev) => prev + delta);
    settle();
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    // A drag must never open the brand it happened to end on.
    e.preventDefault();
    e.stopPropagation();
  };

  const showTooltipFor = (el: HTMLElement, name?: string) => {
    if (!name || draggingRef.current || !containerRef.current) {
      setTooltip(null);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    setTooltip({ text: name, left: itemRect.left - containerRect.left + itemRect.width / 2 });
  };

  const measured = itemWidth > 0;
  const translate = -currentIndex * itemWidth + dragDx;
  const preloadCenterIndex = measured ? currentIndex + Math.round(-dragDx / itemWidth) : currentIndex;
  // Logos further ahead than this stay lazy; anything closer is fetched before
  // it can be dragged into view.
  const preloadWindow = Math.max(visibleCount * 4, 12);
  const logoHeight = Math.max(44, Math.floor(imageHeightFor(visibleCount) * 0.8));

  if (itemCount === 0) return null;

  return (
    <div
      className={styles.containerWrap}
      ref={containerRef}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hoveredRef.current = true;
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") hoveredRef.current = false;
        setTooltip(null);
      }}
      onFocus={() => (hoveredRef.current = true)}
      onBlur={() => (hoveredRef.current = false)}
    >
      {tooltip ? (
        <span className={styles.blockTooltip} style={{ left: tooltip.left }}>
          {tooltip.text}
        </span>
      ) : null}

      <div className={styles.container}>
        <div
          className={cn(
            styles.viewport,
            canLoop ? styles.viewportDraggable : "",
            isDragging ? styles.viewportDragging : ""
          )}
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endPointer(e, true)}
          onPointerCancel={(e) => endPointer(e, false)}
          onLostPointerCapture={(e) => {
            // Only the viewport losing its own capture ends the drag; the same
            // event bubbling up from a logo link does not.
            if (e.target === e.currentTarget) endPointer(e, false);
          }}
          onClickCapture={onClickCapture}
          onDragStart={(e) => e.preventDefault()}
        >
          <div
            ref={trackRef}
            className={cn(
              styles.track,
              canLoop ? "" : styles.trackStatic,
              isAnimating && !isDragging ? styles.animating : styles.noTransition
            )}
            style={{
              width: measured && canLoop ? itemWidth * extended.length : "100%",
              transform: measured ? `translate3d(${translate}px, 0, 0)` : undefined,
            }}
          >
            {extended.map((c, i) => {
              const shouldEagerLoad = Math.abs(i - preloadCenterIndex) <= preloadWindow;
              const logoNode = c.logo ? (
                <div className={styles.logoInner} style={{ height: logoHeight }}>
                  <Image
                    src={c.logo}
                    alt={c.name ?? ""}
                    fill
                    style={{ objectFit: "contain" }}
                    sizes={measured ? `${Math.round(itemWidth)}px` : "200px"}
                    unoptimized={!isOptimizableSrc(c.logo)}
                    loading={shouldEagerLoad ? "eager" : "lazy"}
                    draggable={false}
                  />
                </div>
              ) : null;

              const key = `${i}-${c.id ?? i}`;
              const href = typeof c.url === "string" ? c.url.trim() : "";
              const isExternalHref = /^https?:\/\//i.test(href);
              const hasLink = Boolean(href);
              const linkLabel = c.name ? `${c.name} partner səhifəsi` : "Partner səhifəsi";

              return (
                <div
                  key={key}
                  className={styles.companyItem}
                  style={{
                    width: measured ? itemWidth : `${100 / visibleCount}%`,
                    height: imageHeightFor(visibleCount),
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") showTooltipFor(e.currentTarget, c.name);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === "mouse") setTooltip(null);
                  }}
                  onFocusCapture={(e) => showTooltipFor(e.currentTarget, c.name)}
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
                        draggable={false}
                        aria-label={linkLabel}
                      >
                        {logoNode}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className={styles.companyLink}
                        prefetch={false}
                        draggable={false}
                        aria-label={linkLabel}
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
