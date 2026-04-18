"use client";

import { create } from "zustand";
import type { UIState, UIActions } from "@repo/types/types";

export const useUIStore = create<UIState & UIActions>((set) => ({
    theme: "light",
    setTheme: (theme) => set({ theme }),
}));
