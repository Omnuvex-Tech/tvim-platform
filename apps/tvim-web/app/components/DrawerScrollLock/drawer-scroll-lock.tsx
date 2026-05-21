"use client";

import { useEffect } from "react";

type Props = {
    checkboxId: string;
};

const DrawerScrollLock = ({ checkboxId }: Props) => {
    useEffect(() => {
        const checkbox = document.getElementById(checkboxId) as HTMLInputElement | null;
        if (!checkbox) return;

        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;

        const update = () => {
            const isOpen = Boolean(checkbox.checked);
            if (isOpen) {
                const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
                document.body.style.overflow = "hidden";
                document.body.style.paddingRight = scrollBarWidth > 0 ? `${scrollBarWidth}px` : originalPaddingRight;
            } else {
                document.body.style.overflow = originalOverflow;
                document.body.style.paddingRight = originalPaddingRight;
            }
        };

        update();
        checkbox.addEventListener("change", update);

        return () => {
            checkbox.removeEventListener("change", update);
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [checkboxId]);

    return null;
};

export { DrawerScrollLock };

