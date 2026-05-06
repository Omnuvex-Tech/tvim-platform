"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LanguageState, LanguageActions } from "@repo/types/types";

const normalizeLocale = (locale: string) => locale.trim().toLowerCase();

const setPreferredLocaleCookie = (locale: string) => {
    if (typeof document === "undefined") return;

    document.cookie = `preferred-locale=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
};

export const useLanguageStore = create<LanguageState & LanguageActions>()(
    persist(
        (set) => ({
            locale: "az",
            setLocale: (locale) => {
                const nextLocale = normalizeLocale(locale);
                if (!nextLocale) return;

                setPreferredLocaleCookie(nextLocale);
                set({ locale: nextLocale });
            },
        }),
        {
            name: "language",
            onRehydrateStorage: () => (state) => {
                if (!state?.locale) return;
                setPreferredLocaleCookie(normalizeLocale(state.locale));
            },
        },
    ),
);
