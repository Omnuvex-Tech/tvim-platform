"use client";

import { create } from "zustand";

type NavProgressState = {
    /** True from the moment a route change is requested until the router commits it. */
    isNavigating: boolean;
    startNavigation: () => void;
    endNavigation: () => void;
};

/**
 * Tracks whether an App Router navigation is in flight so the top progress bar
 * can be rendered once, in the root layout, instead of per link.
 */
export const useNavProgressStore = create<NavProgressState>((set) => ({
    isNavigating: false,
    startNavigation: () => set({ isNavigating: true }),
    endNavigation: () => set({ isNavigating: false }),
}));
