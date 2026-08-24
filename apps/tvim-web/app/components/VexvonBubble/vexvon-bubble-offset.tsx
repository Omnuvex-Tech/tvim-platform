"use client";

import { useEffect } from "react";

/**
 * The Vexvon chat bubble is injected by a third-party script (a GTM tag), which
 * appends its button straight onto <body> with its `bottom` offset written into
 * the style attribute as !important. That outranks anything a stylesheet of ours
 * can say, so patching the inline value once the node appears is the only way to
 * lift the bubble clear of the mobile bottom tab bar — which is fixed at z-50
 * and was hiding it almost completely on phones.
 */
const BUBBLE_SELECTOR = '[id^="vexvon-chatbot-"][id$="-bubble"]';

// Tailwind's md breakpoint, i.e. exactly where the tab bar stops being `md:hidden`.
const MOBILE_QUERY = "(max-width: 767px)";

// The bar is ~50px tall and floats 16px off the viewport edge once the page is
// scrolled. This clears that taller state with a small gap, and is a constant on
// purpose: the bubble would otherwise hop up and down as the bar swaps states.
const MOBILE_BOTTOM = "calc(78px + env(safe-area-inset-bottom))";

export const VexvonBubbleOffset = () => {
    useEffect(() => {
        const mobile = window.matchMedia(MOBILE_QUERY);
        let defaultBottom: string | null = null;

        const apply = () => {
            const bubble = document.querySelector<HTMLElement>(BUBBLE_SELECTOR);
            if (!bubble) return false;

            // The widget lets visitors drag the bubble and restores where they
            // dropped it, which re-anchors it by top/left. Leave that as it is.
            if (bubble.style.bottom === "auto") return true;

            defaultBottom ??= bubble.style.bottom;
            bubble.style.setProperty("bottom", mobile.matches ? MOBILE_BOTTOM : defaultBottom, "important");

            return true;
        };

        // GTM loads the widget well after hydration, so the button usually is
        // not in the DOM yet on the first pass.
        const observer = new MutationObserver(() => {
            if (apply()) observer.disconnect();
        });

        if (!apply()) {
            observer.observe(document.body, { childList: true });
        }

        mobile.addEventListener("change", apply);

        return () => {
            observer.disconnect();
            mobile.removeEventListener("change", apply);
        };
    }, []);

    return null;
};
