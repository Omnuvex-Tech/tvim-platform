"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { NotifyItem, NotifyVariant } from "@repo/types/types";

type NotifyContextValue = {
    items: NotifyItem[];
    success: (message: string) => void;
    error: (message: string) => void;
    dismiss: (id: string) => void;
};

const NotifyContext = createContext<NotifyContextValue | null>(null);

const NOTIFY_DURATION = 5000;

const generateId = (): string => {
    return Math.random().toString(36).substring(2, 9);
};

const NotifyProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<NotifyItem[]>([]);

    const dismiss = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const addItem = useCallback(
        (variant: NotifyVariant, message: string) => {
            const id = generateId();
            setItems((prev) => [...prev, { id, variant, message }]);

            setTimeout(() => {
                dismiss(id);
            }, NOTIFY_DURATION);
        },
        [dismiss]
    );

    const success = useCallback(
        (message: string) => addItem("success", message),
        [addItem]
    );

    const error = useCallback(
        (message: string) => addItem("error", message),
        [addItem]
    );

    const value = useMemo(
        () => ({ items, success, error, dismiss }),
        [items, success, error, dismiss]
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
