"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { CheckCheck, CircleAlert, X } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { useNotify } from "./notify-provider";
import type { NotifyItem, NotifyVariant } from "@repo/types/types";

const notifyVariants = cva(
    "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-white px-4 py-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition-all duration-200 ease-out",
    {
        variants: {
            variant: {
                success: "border-emerald-300 text-emerald-800",
                error: "border-red-300 text-red-700",
            },
        },
        defaultVariants: {
            variant: "success",
        },
    }
);

const iconWrapVariants: Record<NotifyVariant, string> = {
    success: "text-emerald-600",
    error: "text-red-600",
};

const icons: Record<NotifyVariant, ReactNode> = {
    success: (
        <CheckCheck className="size-5 shrink-0" strokeWidth={2.2} />
    ),
    error: (
        <CircleAlert className="size-5 shrink-0" strokeWidth={2.2} />
    ),
};

const renderMessage = (item: NotifyItem, onNavigate: () => void): ReactNode => {
    const links = (item.links ?? []).filter((link) => link.label.trim() && link.href.trim());
    if (links.length === 0) return item.message;

    const parts: ReactNode[] = [];
    let rest = item.message;

    links.forEach((link, index) => {
        const at = rest.indexOf(link.label);
        if (at < 0) return;

        parts.push(<Fragment key={`text-${index}`}>{rest.slice(0, at)}</Fragment>);
        parts.push(
            <Link
                key={`link-${index}`}
                href={link.href}
                onClick={onNavigate}
                className={cn("underline-offset-2 hover:underline", link.isBold && "font-bold")}
            >
                {link.label}
            </Link>
        );
        rest = rest.slice(at + link.label.length);
    });

    if (parts.length === 0) return item.message;

    parts.push(<Fragment key="text-last">{rest}</Fragment>);
    return parts;
};

const NotifyContainer = () => {
    const { items, dismiss, pause, resume } = useNotify();

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed top-4 left-4 right-4 z-[9999] flex flex-col gap-2.5 sm:left-auto sm:right-4">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        notifyVariants({ variant: item.variant }),
                        item.isEntering && "translate-x-3 opacity-0",
                        item.isLeaving && "translate-x-3 opacity-0",
                        !item.isEntering && !item.isLeaving && "translate-x-0 opacity-100"
                    )}
                    role="alert"
                    // Hovering holds the toast open, so there is time to click the product name.
                    onMouseEnter={() => pause(item.id)}
                    onMouseLeave={() => resume(item.id)}
                >
                    <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center", iconWrapVariants[item.variant])}>
                        {icons[item.variant]}
                    </div>
                    <div className="min-w-0 flex-1 pr-1">
                        <p className="text-sm leading-5 font-medium text-current">
                            {renderMessage(item, () => {
                                item.onNavigate?.();
                                dismiss(item.id);
                            })}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="shrink-0 cursor-pointer rounded-full p-1.5 text-current/60 transition-colors hover:bg-[#eef1f5] hover:text-current"
                        onClick={() => dismiss(item.id)}
                        aria-label="Dismiss notification"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export { NotifyContainer, notifyVariants };
