"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { useNotify } from "./notify-provider";
import type { NotifyItem, NotifyVariant } from "@repo/types/types";
import "../../styles/components/notify.css";

const NotifyIcon = ({ variant }: { variant: NotifyVariant }) => {
    if (variant === "error") {
        return (
            <span className="notify-icon notify-icon-error" aria-hidden="true">
                <span className="notify-x-mark">
                    <span className="notify-x-mark-line notify-x-mark-line-left" />
                    <span className="notify-x-mark-line notify-x-mark-line-right" />
                </span>
            </span>
        );
    }

    return (
        <span className="notify-icon notify-icon-success" aria-hidden="true">
            <span className="notify-success-ring" />
            <span className="notify-success-line notify-success-line-tip" />
            <span className="notify-success-line notify-success-line-long" />
        </span>
    );
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
            <Link key={`link-${index}`} href={link.href} onClick={onNavigate}>
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
        <div className="pointer-events-none fixed top-0 right-0 z-[1060] flex w-[360px] max-w-full flex-col gap-2.5 p-2.5">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn("notify-toast", item.isLeaving && "notify-toast-hide")}
                    role="alert"
                    onMouseEnter={() => pause(item.id)}
                    onMouseLeave={() => resume(item.id)}
                >
                    <NotifyIcon variant={item.variant} />
                    <p className="notify-title">
                        {renderMessage(item, () => {
                            item.onNavigate?.();
                            dismiss(item.id);
                        })}
                    </p>
                </div>
            ))}
        </div>
    );
};

export { NotifyContainer };
