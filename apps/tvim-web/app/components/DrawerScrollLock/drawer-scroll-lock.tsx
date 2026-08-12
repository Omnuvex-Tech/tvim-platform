"use client";

import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { Spinner } from "@repo/ui";

type Props = {
    checkboxId: string;
};

const DrawerScrollLock = ({ checkboxId }: Props) => {
    useEffect(() => {
        const checkbox = document.getElementById(checkboxId) as HTMLInputElement | null;
        if (!checkbox) return;

        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;

        const update = () => {
            const isOpen = Boolean(checkbox.checked);
            if (isOpen) {
                const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
                document.body.style.overflow = "hidden";
                document.body.style.paddingRight = scrollBarWidth > 0 ? `${scrollBarWidth}px` : originalPaddingRight;
            } else {
                document.body.style.overflow = originalOverflow;
                document.body.style.paddingRight = originalPaddingRight;
            }
        };

        update();
        checkbox.addEventListener("change", update);

        return () => {
            checkbox.removeEventListener("change", update);
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [checkboxId]);

    return null;
};

export { DrawerScrollLock };

type ReportPending = (key: string, pending: boolean) => void;

/**
 * Split in two so the reporting callback keeps a stable identity: a single
 * context would change on every pending flip and send the reporting effect below
 * into a loop.
 */
const PendingNavReportContext = createContext<ReportPending | null>(null);
const PendingNavStateContext = createContext(false);

const PendingNavProvider = ({ children }: { children: ReactNode }) => {
    const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(() => new Set());

    const reportPending = useCallback<ReportPending>((key, pending) => {
        setPendingKeys((current) => {
            if (pending === current.has(key)) return current;

            const next = new Set(current);
            if (pending) {
                next.add(key);
            } else {
                next.delete(key);
            }

            return next;
        });
    }, []);

    const isPending = pendingKeys.size > 0;

    return (
        <PendingNavReportContext.Provider value={reportPending}>
            <PendingNavStateContext.Provider value={isPending}>{children}</PendingNavStateContext.Provider>
        </PendingNavReportContext.Provider>
    );
};

/**
 * Rendered inside the <Link>, which is where useLinkStatus reads its state from.
 * Draws nothing; it only forwards the link's pending flag to the provider.
 */
const PendingLinkStatus = ({ report }: { report: ReportPending }) => {
    const { pending } = useLinkStatus();
    const key = useId();

    useEffect(() => {
        report(key, pending);
        return () => report(key, false);
    }, [key, pending, report]);

    return null;
};

type PendingLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
    href: string;
    children: ReactNode;
    prefetch?: boolean | "auto" | null;
};

/**
 * A real <Link> that reports its in-flight state to the nearest
 * PendingNavProvider, so the click keeps the router's own navigation instead of
 * being intercepted.
 *
 * Viewport prefetching is off by default on purpose: these links sit in filter
 * drawers that render thousands of them on a large category, and letting Next
 * prefetch each one as it scrolls into view would hammer the API. Hovering still
 * warms the route, which is where the intent actually shows up.
 */
const PendingLink = ({ href, className, children, prefetch = false, onMouseEnter, ...rest }: PendingLinkProps) => {
    const report = useContext(PendingNavReportContext);
    const router = useRouter();
    const ariaDisabled = (rest as { "aria-disabled"?: unknown })["aria-disabled"];
    const isDisabled = ariaDisabled === true || ariaDisabled === "true";
    const mergedClassName = `${className ?? ""}${isDisabled ? "" : " cursor-pointer"}`.trim();

    return (
        <Link
            href={href}
            className={mergedClassName}
            prefetch={prefetch}
            onMouseEnter={(event) => {
                if (!isDisabled && prefetch === false) {
                    router.prefetch(href);
                }
                onMouseEnter?.(event);
            }}
            {...rest}
        >
            {children}
            {report && !isDisabled ? <PendingLinkStatus report={report} /> : null}
        </Link>
    );
};

const PendingOverlay = ({ className }: { className?: string }) => {
    const isPending = useContext(PendingNavStateContext);
    if (!isPending) return null;
    return (
        <div className={className ?? "absolute inset-0 z-20 flex items-center justify-center bg-white/55"}>
            <Spinner size={24} />
        </div>
    );
};

export { PendingNavProvider, PendingLink, PendingOverlay };
