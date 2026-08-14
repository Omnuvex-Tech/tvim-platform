"use client";

import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import type { NotifyItem, NotifyOptions, NotifyVariant } from "@repo/types/types";

type NotifyContextValue = {
    items: NotifyItem[];
    success: (message: string, options?: NotifyOptions) => void;
    error: (message: string, options?: NotifyOptions) => void;
    dismiss: (id: string) => void;
    pause: (id: string) => void;
    resume: (id: string) => void;
};

const NotifyContext = createContext<NotifyContextValue | null>(null);

const NOTIFY_DURATION = 3000;
const EXIT_ANIMATION_DURATION = 220;

const generateId = (): string => {
    return Math.random().toString(36).substring(2, 9);
};

type NotifyTimer = {
    timeoutId: ReturnType<typeof setTimeout> | null;
    startedAt: number;
    remaining: number;
};

const NotifyProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<NotifyItem[]>([]);
    const timers = useRef(new Map<string, NotifyTimer>());

    const dismiss = useCallback((id: string) => {
        const timer = timers.current.get(id);
        if (timer?.timeoutId) {
            clearTimeout(timer.timeoutId);
        }
        timers.current.delete(id);

        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id || item.isLeaving) {
                    return item;
                }

                return { ...item, isLeaving: true };
            })
        );

        setTimeout(() => {
            setItems((prev) => prev.filter((item) => item.id !== id));
        }, EXIT_ANIMATION_DURATION);
    }, []);

    const startTimer = useCallback(
        (id: string, duration: number) => {
            timers.current.set(id, {
                timeoutId: setTimeout(() => dismiss(id), duration),
                startedAt: Date.now(),
                remaining: duration,
            });
        },
        [dismiss]
    );

    // Hovering holds the toast open, so there is time to click the product name.
    const pause = useCallback((id: string) => {
        const timer = timers.current.get(id);
        if (!timer?.timeoutId) return;

        clearTimeout(timer.timeoutId);
        timers.current.set(id, {
            timeoutId: null,
            startedAt: timer.startedAt,
            remaining: Math.max(0, timer.remaining - (Date.now() - timer.startedAt)),
        });
    }, []);

    const resume = useCallback(
        (id: string) => {
            const timer = timers.current.get(id);
            if (!timer || timer.timeoutId) return;

            startTimer(id, timer.remaining);
        },
        [startTimer]
    );

    const addItem = useCallback(
        (variant: NotifyVariant, message: string, options?: NotifyOptions) => {
            const id = generateId();
            setItems((prev) => [
                ...prev,
                {
                    id,
                    variant,
                    message,
                    links: options?.links,
                    onNavigate: options?.onNavigate,
                    isEntering: true,
                    isLeaving: false,
                },
            ]);

            requestAnimationFrame(() => {
                setItems((prev) =>
                    prev.map((item) => (item.id === id ? { ...item, isEntering: false } : item))
                );
            });

            startTimer(id, NOTIFY_DURATION);
        },
        [startTimer]
    );

    const success = useCallback(
        (message: string, options?: NotifyOptions) => addItem("success", message, options),
        [addItem]
    );

    const error = useCallback(
        (message: string, options?: NotifyOptions) => addItem("error", message, options),
        [addItem]
    );

    const value = useMemo(
        () => ({ items, success, error, dismiss, pause, resume }),
        [items, success, error, dismiss, pause, resume]
    );

    return (
        <NotifyContext value={value}>
            {children}
        </NotifyContext>
    );
};

const useNotify = (): NotifyContextValue => {
    const context = useContext(NotifyContext);

    if (!context) {
        throw new Error("useNotify must be used within a NotifyProvider");
    }

    return context;
};

export { NotifyProvider, useNotify };
