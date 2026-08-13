"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useNavProgressStore } from "@/stores/nav-progress";

/**
 * Navigations that resolve faster than this never show the bar, so prefetched
 * routes stay flicker-free.
 */
const SHOW_DELAY_MS = 120;

/** How long the bar keeps running to 100% and fades out after a commit. */
const FINISH_DURATION_MS = 260;

/** Safety net for a navigation that never commits (aborted fetch, error page). */
const STUCK_TIMEOUT_MS = 15_000;

type Phase = "idle" | "loading" | "done";

const isModifiedClick = (event: MouseEvent) =>
    event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

/**
 * Same-document links, downloads, new tabs and links pointing at the current URL
 * never produce a route change, so they must not arm the bar.
 */
const startsRouteChange = (anchor: HTMLAnchorElement) => {
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return false;

    let url: URL;
    try {
        url = new URL(anchor.href, window.location.href);
    } catch {
        return false;
    }

    if (url.origin !== window.location.origin) return false;
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    return url.pathname !== window.location.pathname || url.search !== window.location.search;
};

/**
 * A client-side navigation never triggers the browser's own tab spinner, and the
 * App Router keeps the current page on screen while it fetches the next one, so
 * without this the UI looks frozen between the click and the new page.
 *
 * The click is treated as the start of a navigation and the history entry the
 * router writes on commit as the end of it. Listening at the document level means
 * every link — including the ones inside @repo/ui — is covered without wrapping
 * them individually.
 */
export function NavigationProgress() {
    const pathname = usePathname();
    const isNavigating = useNavProgressStore((state) => state.isNavigating);
    const startNavigation = useNavProgressStore((state) => state.startNavigation);
    const endNavigation = useNavProgressStore((state) => state.endNavigation);
    const [phase, setPhase] = useState<Phase>("idle");

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || isModifiedClick(event)) return;

            const target = event.target;
            if (!(target instanceof Element)) return;

            const anchor = target.closest("a");
            if (!anchor || !startsRouteChange(anchor)) return;

            startNavigation();
        };

        // Capture, so links that call preventDefault in their own onClick and
        // navigate through the router are still picked up.
        document.addEventListener("click", onClick, true);
        return () => document.removeEventListener("click", onClick, true);
    }, [startNavigation]);

    useEffect(() => {
        const { pushState, replaceState } = window.history;

        // The router writes history from inside its commit, where React refuses
        // store updates, so the flag is cleared on the next microtask instead.
        const finish = () => queueMicrotask(endNavigation);

        window.history.pushState = function patchedPushState(...args) {
            const result = pushState.apply(this, args);
            finish();
            return result;
        };

        window.history.replaceState = function patchedReplaceState(...args) {
            const result = replaceState.apply(this, args);
            finish();
            return result;
        };

        return () => {
            window.history.pushState = pushState;
            window.history.replaceState = replaceState;
        };
    }, [endNavigation]);

    // Back/forward and any commit the history patch misses.
    useEffect(() => {
        endNavigation();
    }, [pathname, endNavigation]);

    useEffect(() => {
        if (!isNavigating) {
            setPhase((current) => (current === "loading" ? "done" : "idle"));
            return;
        }

        const showTimer = window.setTimeout(() => setPhase("loading"), SHOW_DELAY_MS);
        const stuckTimer = window.setTimeout(() => endNavigation(), STUCK_TIMEOUT_MS);

        return () => {
            window.clearTimeout(showTimer);
            window.clearTimeout(stuckTimer);
        };
    }, [isNavigating, endNavigation]);

    useEffect(() => {
        if (phase !== "done") return;

        const timer = window.setTimeout(() => setPhase("idle"), FINISH_DURATION_MS);
        return () => window.clearTimeout(timer);
    }, [phase]);

    if (phase === "idle") return null;

    return (
        <div className="nav-progress" role="presentation" aria-hidden="true">
            <div className={`nav-progress__bar${phase === "done" ? " nav-progress__bar--done" : ""}`} />
        </div>
    );
}
