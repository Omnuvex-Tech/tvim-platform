"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useMemo, useTransition, type ReactNode } from "react";
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

type PendingNavContextValue = {
    isPending: boolean;
    navigate: (href: string) => void;
    prefetch: (href: string) => void;
};

const PendingNavContext = createContext<PendingNavContextValue | null>(null);

const PendingNavProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const value = useMemo<PendingNavContextValue>(() => {
        return {
            isPending,
            navigate: (href: string) => {
                startTransition(() => {
                    router.push(href);
                });
            },
            prefetch: (href: string) => {
                router.prefetch(href);
            },
        };
    }, [isPending, router, startTransition]);

    return <PendingNavContext.Provider value={value}>{children}</PendingNavContext.Provider>;
};

type PendingLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
    href: string;
    children: ReactNode;
};

const PendingLink = ({ href, className, children, ...rest }: PendingLinkProps) => {
    const ctx = useContext(PendingNavContext);

    if (!ctx) {
        return (
            <Link href={href} className={className} {...rest}>
                {children}
            </Link>
        );
    }

    return (
        <a
            href={href}
            className={className}
            {...rest}
            onMouseEnter={() => {
                ctx.prefetch(href);
            }}
            onClick={(e) => {
                if (e.defaultPrevented) return;
                if (e.button !== 0) return;
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                ctx.navigate(href);
            }}
        >
            {children}
        </a>
    );
};

const PendingOverlay = ({ className }: { className?: string }) => {
    const ctx = useContext(PendingNavContext);
    if (!ctx?.isPending) return null;
    return (
        <div className={className ?? "absolute inset-0 z-20 flex items-center justify-center bg-white/55"}>
            <Spinner size={24} />
        </div>
    );
};

export { PendingNavProvider, PendingLink, PendingOverlay };

type FiltersDebugLoggerProps = {
    filters: unknown;
};

const FiltersDebugLogger = ({ filters }: FiltersDebugLoggerProps) => {
    useEffect(() => {
        if (!Array.isArray(filters)) {
            console.log("[catalog filters]", { filters });
            return;
        }

        const normalized = filters
            .filter((f) => !!f && typeof f === "object")
            .map((f: any) => {
                const values = Array.isArray(f.values)
                    ? f.values
                          .filter((v: any) => !!v && typeof v === "object")
                          .map((v: any) => ({
                              value_id: v.value_id ?? v.id ?? null,
                              name: v.name ?? "",
                              count: v.count ?? null,
                          }))
                    : [];

                return {
                    filter_id: f.filter_id ?? f.id ?? null,
                    name: f.name ?? "",
                    slug: f.slug ?? "",
                    input_type: f.input_type ?? "",
                    values,
                };
            });

        console.log("[catalog filters]", normalized);
    }, [filters]);

    return null;
};

export { FiltersDebugLogger };
