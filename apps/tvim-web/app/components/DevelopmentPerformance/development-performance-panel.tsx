"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DevApiMetricEntry } from "@/lib/dev-request-metrics";

declare global {
    interface Window {
        __TVIM_DEV_ROUTE_NAV_START__?: number;
        __TVIM_DEV_ROUTE_TARGET__?: string;
    }
}

type DevelopmentPerformancePanelProps = {
    apiCallCount: number;
    apiDurationMs: number;
    apiEntries: DevApiMetricEntry[];
};

const formatMs = (value: number) => `${value.toFixed(1)} ms`;

const isInternalNavigation = (href: string) => {
    if (!href || href.startsWith("#")) return false;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;

    try {
        const url = new URL(href, window.location.href);
        return url.origin === window.location.origin;
    } catch {
        return false;
    }
};

export function DevelopmentPerformancePanel({
    apiCallCount,
    apiDurationMs,
    apiEntries,
}: DevelopmentPerformancePanelProps) {
    const pathname = usePathname();
    const [pageTotalMs, setPageTotalMs] = useState<number | null>(null);

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            const link = target?.closest("a[href]");
            const href = link?.getAttribute("href");

            if (!href || !isInternalNavigation(href)) {
                return;
            }

            const url = new URL(href, window.location.href);
            window.__TVIM_DEV_ROUTE_NAV_START__ = performance.now();
            window.__TVIM_DEV_ROUTE_TARGET__ = `${url.pathname}${url.search}`;
        };

        const onPopState = () => {
            window.__TVIM_DEV_ROUTE_NAV_START__ = performance.now();
            window.__TVIM_DEV_ROUTE_TARGET__ = `${window.location.pathname}${window.location.search}`;
        };

        document.addEventListener("click", onClick, true);
        window.addEventListener("popstate", onPopState);

        return () => {
            document.removeEventListener("click", onClick, true);
            window.removeEventListener("popstate", onPopState);
        };
    }, []);

    useEffect(() => {
        const updateMetrics = () => {
            const targetPath = `${window.location.pathname}${window.location.search}`;
            const softNavStart =
                window.__TVIM_DEV_ROUTE_TARGET__ === targetPath
                    ? window.__TVIM_DEV_ROUTE_NAV_START__
                    : undefined;

            if (typeof softNavStart === "number") {
                setPageTotalMs(Math.max(performance.now() - softNavStart, 0));
                return;
            }

            const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
            if (navigationEntry && navigationEntry.domContentLoadedEventEnd > 0) {
                setPageTotalMs(navigationEntry.domContentLoadedEventEnd);
                return;
            }

            setPageTotalMs(performance.now());
        };

        const rafId = window.requestAnimationFrame(updateMetrics);
        const timeoutId = window.setTimeout(updateMetrics, 50);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.clearTimeout(timeoutId);
        };
    }, [pathname, apiCallCount, apiDurationMs]);

    const frontDurationMs = useMemo(() => {
        if (pageTotalMs === null) return null;
        return Math.max(pageTotalMs - apiDurationMs, 0);
    }, [apiDurationMs, pageTotalMs]);

    return (
        <aside className="fixed right-4 bottom-4 z-[1600] w-[min(380px,calc(100vw-32px))] rounded-xl border border-[#2c3444] bg-[#0d1118]/95 p-3 text-white shadow-[0_12px_34px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-semibold tracking-[0.08em] text-[#8db3ff] uppercase">Dev Performance</p>
                <p className="truncate text-[11px] text-[#c6d0e1]">{pathname || "/"}</p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/5 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#90a0bb]">API</p>
                    <p className="mt-1 text-[15px] font-semibold">{formatMs(apiDurationMs)}</p>
                    <p className="mt-1 text-[10px] text-[#90a0bb]">{apiCallCount} istek</p>
                </div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#90a0bb]">Front</p>
                    <p className="mt-1 text-[15px] font-semibold">
                        {frontDurationMs === null ? "..." : formatMs(frontDurationMs)}
                    </p>
                    <p className="mt-1 text-[10px] text-[#90a0bb]">hydrate + render</p>
                </div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#90a0bb]">Toplam</p>
                    <p className="mt-1 text-[15px] font-semibold">
                        {pageTotalMs === null ? "..." : formatMs(pageTotalMs)}
                    </p>
                    <p className="mt-1 text-[10px] text-[#90a0bb]">gorunur acilis</p>
                </div>
            </div>

            {apiEntries.length > 0 ? (
                <div className="mt-3 rounded-lg border border-white/8 bg-black/20">
                    <div className="flex items-center justify-between px-2.5 py-2 text-[10px] uppercase tracking-[0.08em] text-[#90a0bb]">
                        <span>API detaylari</span>
                        <span>ilk {apiEntries.length}</span>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto border-t border-white/8">
                        {apiEntries.map((entry, index) => (
                            <div
                                key={`${entry.method}-${entry.url}-${index}`}
                                className="border-b border-white/8 px-2.5 py-2 last:border-b-0"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="min-w-0 flex-1 break-all text-[11px] text-[#dce5f5]">
                                        <span className="mr-1 text-[#7ca2ff]">{entry.method}</span>
                                        {entry.url}
                                    </p>
                                    <span className="shrink-0 text-[11px] font-semibold text-white">
                                        {formatMs(entry.durationMs)}
                                    </span>
                                </div>
                                <p className="mt-1 text-[10px] text-[#90a0bb]">status {entry.status}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </aside>
    );
}
