"use client";

import { type ReactNode } from "react";
import { X } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { useNotify } from "./notify-provider";
import type { NotifyVariant } from "@repo/types/types";

const notifyVariants = cva(
    "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-200 ease-out",
    {
        variants: {
            variant: {
                success: "border-emerald-300 bg-white text-emerald-800",
                error: "border-red-300 bg-white text-red-700",
            },
        },
        defaultVariants: {
            variant: "success",
        },
    }
);

const icons: Record<NotifyVariant, ReactNode> = {
    success: (
        <svg className="size-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
            />
        </svg>
    ),
    error: (
        <svg className="size-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
            />
        </svg>
    ),
};

const NotifyContainer = () => {
    const { items, dismiss } = useNotify();

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2">
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
                >
                    {icons[item.variant]}
                    <p className="flex-1 text-sm font-medium">{item.message}</p>
                    <button
                        type="button"
                        className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
                        onClick={() => dismiss(item.id)}
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export { NotifyContainer, notifyVariants };
