"use client";

import React, { useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import styles from "./company-carousel.module.css";
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

export const CompanyCarousel: React.FC<Props> = ({ companies }) => {
  if (!companies || companies.length === 0) return null;

  const [startIndex, setStartIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [itemWidth, setItemWidth] = useState(0);
  const [tooltip, setTooltip] = useState<{ text: string; left: number } | null>(null);
  const [visibleCount, setVisibleCount] = useState(() => getVisibleCount(typeof window !== "undefined" ? window.innerWidth : 1200));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (companies.length <= visibleCount) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      const t = setTimeout(() => {
        setStartIndex((s) => (s + 1) % companies.length);
        setIsAnimating(false);
        clearTimeout(t);
      }, ANIMATION_DURATION);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [companies.length, visibleCount]);

  const visible: (Company & { uid: string })[] = [];
  for (let i = 0; i < visibleCount + 1; i++) {
    const c = companies[(startIndex + i) % companies.length];
    if (c) visible.push({ ...c, uid: `${c.id}-${startIndex}-${i}` });
  }

  const imageHeight = visibleCount >= 6 ? 100 : visibleCount >= 5 ? 90 : 75;

  const showTooltip = (el: HTMLDivElement, name?: string) => {
    if (!name || !containerRef.current) {
      setTooltip(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();

    setTooltip({
      text: name,
      left: itemRect.left - containerRect.left + itemRect.width / 2,
    });
  };

  return (
    <div className={styles.containerWrap} ref={containerRef}>
      {tooltip ? (
        <span className={styles.blockTooltip} style={{ left: tooltip.left }}>
          {tooltip.text}
        </span>
      ) : null}
      <div className={styles.container}>
      <div className={styles.viewport} ref={viewportRef}>
        <div
          className={cn(
            styles.track,
            isAnimating ? styles.animating : styles.noTransition
          )}
          style={{
            width: itemWidth * (visibleCount + 1),
            transform: isAnimating ? `translateX(-${itemWidth}px)` : "translateX(0)",
          }}
        >
          {visible.map((c) => {
            const logoHeight = Math.max(44, Math.floor(imageHeight * 0.8));
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

            return (
              <div
                key={c.uid}
                className={styles.companyItem}
                style={{ width: itemWidth, height: imageHeight }}
                onMouseEnter={(e) => showTooltip(e.currentTarget, c.name)}
                onMouseMove={(e) => showTooltip(e.currentTarget, c.name)}
                onMouseLeave={() => setTooltip(null)}
                onFocusCapture={(e) => showTooltip(e.currentTarget, c.name)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setTooltip(null);
                  }
                }}
              >
                {c.url ? (
                  <a
                    href={c.url}
                    className={styles.companyLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={
                      c.name ? `${c.name} partner səhifəsi` : "Partner səhifəsi"
                    }
                  >
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
