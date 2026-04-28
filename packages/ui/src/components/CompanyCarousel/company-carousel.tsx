"use client";

import React, { useEffect, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import styles from "./company-carousel.module.css";
import { cn } from "../../lib/utils";

export type Company = {
  id: string;
  name?: string;
  logo?: string | StaticImageData | null;
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
  const [visibleCount, setVisibleCount] = useState(() => getVisibleCount(typeof window !== "undefined" ? window.innerWidth : 1200));
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

  return (
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
          {visible.map((c) => (
            <div key={c.uid} className={styles.companyItem} style={{ width: itemWidth, height: imageHeight }}>
              {c.logo ? (
                <div className={styles.logoInner}>
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
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyCarousel;
