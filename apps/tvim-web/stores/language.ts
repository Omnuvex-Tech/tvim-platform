"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LanguageState, LanguageActions } from "@repo/types/types";

export const useLanguageStore = create<LanguageState & LanguageActions>()(
    persist(
        (set) => ({
            locale: "",
            setLocale: (locale) => set({ locale }),
        }),
        {
            name: "language",
        },
    ),
);
