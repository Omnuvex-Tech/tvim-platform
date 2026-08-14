"use client";

import Link from "next/link";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { useNotify } from "./notify-provider";
import type { NotifyItem, NotifyVariant } from "@repo/types/types";
import "../../styles/components/notify.css";

// Mirrors the SweetAlert2 toast tvim.az shows after adding to the cart:
// white card, 0.3125rem radius, 1em padding, layered shadow, #545454 text.
const notifyVariants = cva(
    "pointer-events-auto grid w-full max-w-sm grid-cols-[min-content_auto] items-center rounded-[0.3125rem] border-none bg-white p-[1em] text-[#545454] shadow-[0_0_1px_rgba(0,0,0,0.075),0_1px_2px_rgba(0,0,0,0.075),1px_2px_4px_rgba(0,0,0,0.075),1px_3px_8px_rgba(0,0,0,0.075),2px_4px_16px_rgba(0,0,0,0.075)]",
    {
        variants: {
            variant: {
                success: "",
                error: "",
            },
        },
        defaultVariants: {
            variant: "success",
        },
    }
);

// The ring is the icon's own colour at 30% opacity, as SweetAlert2 draws it.
const iconWrapVariants: Record<NotifyVariant, string> = {
    success: "border-[rgba(165,220,134,0.3)] text-[#a5dc86]",
    error: "border-[rgba(242,116,116,0.3)] text-[#f27474]",
};

const iconPaths: Record<NotifyVariant, string> = {
    success: "M5 11.5 L9 15.5 L16 6.5",
    error: "M6 6 L15 15 M15 6 L6 15",
};

const NotifyIcon = ({ variant }: { variant: NotifyVariant }) => (
    <span
        className={cn(
            "notify-icon mr-[0.5em] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4",
            iconWrapVariants[variant]
        )}
    >
        <svg className="size-5" viewBox="0 0 21 21" fill="none" aria-hidden="true">
            <path
                className="notify-icon-check"
                d={iconPaths[variant]}
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </span>
);

// The product name and the closing words sit inside an already-translated
// sentence, so they are located in the message rather than passed as separate
// pieces of copy.
const renderMessage = (item: NotifyItem, onNavigate: () => void) => {
    const label = item.link?.label?.trim();
    const href = item.link?.href?.trim();
    const muted = item.muted?.trim();

    const withMuted = (text: string, key?: string) => {
        if (!muted) return text;
        const at = text.indexOf(muted);
        if (at < 0) return text;

        return (
            <span key={key}>
                {text.slice(0, at)}
                <span className="text-[#9aa1ab]">{muted}</span>
                {text.slice(at + muted.length)}
            </span>
        );
    };

    if (!label || !href) return withMuted(item.message);

    const index = item.message.indexOf(label);
    if (index < 0) return withMuted(item.message);

    return (
        <>
            {withMuted(item.message.slice(0, index), "before")}
            <Link
                href={href}
                onClick={onNavigate}
                className="font-bold text-[#333] transition-colors hover:text-[#2050f5]"
            >
                {label}
            </Link>
            {withMuted(item.message.slice(index + label.length), "after")}
        </>
    );
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
                        item.isLeaving ? "notify-toast-hide" : "notify-toast-show"
                    )}
                    role="alert"
                    onMouseEnter={() => pause(item.id)}
                    onMouseLeave={() => resume(item.id)}
                >
                    <NotifyIcon variant={item.variant} />
                    <p className="min-w-0 text-[15px] leading-[1.45] font-normal text-current">
                        {renderMessage(item, () => dismiss(item.id))}
                    </p>
                </div>
            ))}
        </div>
    );
};

export { NotifyContainer, notifyVariants };
