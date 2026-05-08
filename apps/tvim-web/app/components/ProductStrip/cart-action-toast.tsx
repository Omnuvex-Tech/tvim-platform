import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CartActionToastProps = {
    trigger: number;
    productTitle?: string;
    durationMs?: number;
};

const CartActionToast = ({ trigger, productTitle, durationMs = 2200 }: CartActionToastProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isProgressing, setIsProgressing] = useState(false);
    const [isIconSpinning, setIsIconSpinning] = useState(false);
    const [isCheckVisible, setIsCheckVisible] = useState(false);
    const hideTimerRef = useRef<number | null>(null);
    const startTimerRef = useRef<number | null>(null);
    const iconTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (trigger <= 0) return;

        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }

        if (startTimerRef.current !== null) {
            window.clearTimeout(startTimerRef.current);
            startTimerRef.current = null;
        }

        if (iconTimerRef.current !== null) {
            window.clearTimeout(iconTimerRef.current);
            iconTimerRef.current = null;
        }

        setIsMounted(true);
        setIsProgressing(false);
        setIsIconSpinning(true);
        setIsCheckVisible(false);

        startTimerRef.current = window.setTimeout(() => {
            setIsVisible(true);
            setIsProgressing(true);
            startTimerRef.current = null;
        }, 20);

        iconTimerRef.current = window.setTimeout(() => {
            setIsIconSpinning(false);
            setIsCheckVisible(true);
            iconTimerRef.current = null;
        }, 480);

        hideTimerRef.current = window.setTimeout(() => {
            setIsVisible(false);
            setIsMounted(false);
        }, durationMs);

        return () => {
            if (hideTimerRef.current !== null) {
                window.clearTimeout(hideTimerRef.current);
                hideTimerRef.current = null;
            }

            if (startTimerRef.current !== null) {
                window.clearTimeout(startTimerRef.current);
                startTimerRef.current = null;
            }

            if (iconTimerRef.current !== null) {
                window.clearTimeout(iconTimerRef.current);
                iconTimerRef.current = null;
            }
        };
    }, [durationMs, trigger]);

    if (!isMounted || typeof document === "undefined") return null;

    return createPortal(
        <div className="pointer-events-none fixed top-4 right-4 z-[9999] w-[min(92vw,380px)]">
            <div
                className={`relative overflow-hidden flex items-start gap-3 rounded-[6px] border border-[#d3d3d3] bg-[#efefef] px-4 py-10 text-[#222] shadow-[0_10px_24px_rgba(0,0,0,0.2)] transition-all duration-200 ${
                    isVisible ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"
                }`}
            >
                <span
                    className={`mt-[1px] inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[4px] border-[#dcefcf] text-[#9bc97a] transition-transform duration-200 ${
                        isIconSpinning ? "animate-spin" : ""
                    }`}
                    style={isIconSpinning ? { animationDuration: "480ms" } : undefined}
                >
                    <i
                        className={`fa-solid fa-check text-[20px] transition-all duration-200 ${
                            isCheckVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"
                        }`}
                        aria-hidden="true"
                    />
                </span>
                <p className="text-[16px] leading-[1.35] font-semibold text-[#222a33]">
                    {productTitle ? `${productTitle} səbətinizə müvəffəqiyyətlə əlavə edildi!` : "Məhsul səbətinizə müvəffəqiyyətlə əlavə edildi!"}
                </p>
                <span className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] bg-[#d5d5d5]" />
                <span
                    className="pointer-events-none absolute bottom-0 left-0 h-[3px] bg-[#8f8f8f]"
                    style={{
                        width: isProgressing ? "0%" : "100%",
                        transition: `width ${durationMs}ms linear`,
                    }}
                />
            </div>
        </div>,
        document.body
    );
};

export { CartActionToast };
