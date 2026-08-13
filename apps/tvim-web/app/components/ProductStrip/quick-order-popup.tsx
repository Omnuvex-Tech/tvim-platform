"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { cn, useNotify } from "@repo/ui";
import { usePathname } from "next/navigation";
import { submitPurchaseRequest } from "@/lib/purchase-request/client";
import { getTranslations } from "@/lib/i18n";
import { defaultLocale, isSupportedLocale } from "@/lib/site-locales";

type QuickOrderPopupProps = {
    isOpen: boolean;
    productTitle: string;
    productCode: string;
    productVariationId?: number | null;
    onClose: () => void;
};

const AZ_COUNTRY_CODE = "994";
const AZ_LOCAL_PHONE_LENGTH = 9;

/**
 * The country code is rendered as a fixed prefix next to the input, so the
 * field itself only ever holds the 9 local digits. A pasted international or
 * trunk-prefixed number still resolves to the same local digits.
 */
const extractAzerbaijanLocalDigits = (value: string) => {
    const digits = value.replace(/\D/g, "");

    // Only strip a leading 994/0 when the value is too long to be local on its
    // own — "99" is itself a valid local operator prefix.
    if (digits.length > AZ_LOCAL_PHONE_LENGTH) {
        if (digits.startsWith(AZ_COUNTRY_CODE)) {
            return digits.slice(AZ_COUNTRY_CODE.length, AZ_COUNTRY_CODE.length + AZ_LOCAL_PHONE_LENGTH);
        }

        if (digits.startsWith("0")) {
            return digits.slice(1, 1 + AZ_LOCAL_PHONE_LENGTH);
        }
    }

    return digits.slice(0, AZ_LOCAL_PHONE_LENGTH);
};

const formatAzerbaijanLocalPhone = (value: string) => {
    const localDigits = extractAzerbaijanLocalDigits(value);
    if (!localDigits) return "";

    const part1 = localDigits.slice(0, 2);
    const part2 = localDigits.slice(2, 5);
    const part3 = localDigits.slice(5, 7);
    const part4 = localDigits.slice(7, 9);

    let formatted = `(${part1}`;

    if (part1.length === 2) {
        formatted += ")";
    }

    if (part2) {
        formatted += ` ${part2}`;
    }

    if (part3) {
        formatted += `-${part3}`;
    }

    if (part4) {
        formatted += `-${part4}`;
    }

    return formatted;
};

/** Matches the shape produced by formatAzerbaijanLocalPhone. */
const PHONE_PLACEHOLDER = "(__) ___-__-__";

/** Keep in sync with the duration-200 classes on the overlay and panel. */
const MODAL_TRANSITION_MS = 200;

const labelClassName = "block text-[13px] leading-none font-semibold text-[#1b2434]";
const inputClassName =
    "h-[42px] w-full rounded-[20px] border border-black/10 bg-white px-4 text-[14px] font-normal text-[#161922] outline-none transition-colors placeholder:text-[#b3b9c4] focus:border-black/20";

const countLocalDigitsBeforeCursor = (value: string, cursorPosition: number) => {
    const limit = Math.max(0, Math.min(cursorPosition, value.length));
    const digitsBefore = value.slice(0, limit).replace(/\D/g, "").length;
    return Math.min(digitsBefore, AZ_LOCAL_PHONE_LENGTH);
};

const getCursorPositionFromLocalDigits = (formatted: string, localDigitsCount: number) => {
    if (!formatted) return 0;
    if (localDigitsCount <= 0) {
        // Just after the opening bracket, where the first digit goes.
        return Math.min(formatted.length, 1);
    }

    let seenDigits = 0;

    for (let i = 0; i < formatted.length; i += 1) {
        if (!/\d/.test(formatted[i] ?? "")) continue;

        seenDigits += 1;
        if (seenDigits >= localDigitsCount) {
            let nextCursor = i + 1;

            while (nextCursor < formatted.length && /\D/.test(formatted[nextCursor] ?? "")) {
                nextCursor += 1;
            }

            return nextCursor;
        }
    }

    return formatted.length;
};

const QuickOrderPopup = ({ isOpen, productTitle, productCode, productVariationId, onClose }: QuickOrderPopupProps) => {
    const notify = useNotify();
    const pathname = usePathname();
    const t = React.useMemo(() => {
        const segment = String(pathname ?? "").split("/").filter(Boolean)[0] ?? "";
        return getTranslations(isSupportedLocale(segment) ? segment : defaultLocale).quickOrder;
    }, [pathname]);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const phoneInputRef = useRef<HTMLInputElement | null>(null);
    const closeTimerRef = useRef<number | null>(null);
    const lastProductRef = useRef("");
    const fieldIdPrefix = useId();

    const normalizeAzerbaijanPhone = (value: string) => {
        const localDigits = extractAzerbaijanLocalDigits(value);
        if (localDigits.length !== AZ_LOCAL_PHONE_LENGTH) return null;
        return `+${AZ_COUNTRY_CODE}${localDigits}`;
    };

    useEffect(() => {
        if (isOpen) {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }

            setIsMounted(true);
            // Mount hidden, then flip on the next frame so the enter transition runs.
            const enterFrame = window.requestAnimationFrame(() => setIsVisible(true));

            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    onClose();
                }
            };

            window.addEventListener("keydown", onKeyDown);
            return () => {
                window.cancelAnimationFrame(enterFrame);
                window.removeEventListener("keydown", onKeyDown);
            };
        }

        if (!isMounted) return undefined;

        // Play the exit transition first, then unmount and clear the form so the
        // fields do not blank out mid-animation.
        setIsVisible(false);

        // The effect re-runs whenever the caller passes a new onClose identity,
        // so replace any pending timer instead of orphaning it.
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
        }

        closeTimerRef.current = window.setTimeout(() => {
            closeTimerRef.current = null;
            setIsMounted(false);
            setFullName("");
            setPhone("");
            setQuantity("1");
            setIsSubmitting(false);
        }, MODAL_TRANSITION_MS);

        return undefined;
    }, [isOpen, isMounted, onClose]);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    if (!isMounted) {
        return null;
    }

    // Callers clear the selected product on close, so the last known value is
    // kept for the duration of the exit transition.
    const composedProduct = `${productTitle} ${productCode}`.trim();
    if (isOpen) {
        lastProductRef.current = composedProduct;
    }
    const displayedProduct = isOpen ? composedProduct : lastProductRef.current;

    const handleQuantityChange = (value: string) => {
        const onlyDigits = value.replace(/\D/g, "");

        if (!onlyDigits) {
            setQuantity("");
            return;
        }

        const normalized = String(Number.parseInt(onlyDigits, 10));
        setQuantity(normalized);
    };

    const handleQuantityBlur = () => {
        const parsed = Number.parseInt(quantity, 10);

        if (!Number.isFinite(parsed) || parsed < 1) {
            setQuantity("1");
            return;
        }

        setQuantity(String(parsed));
    };

    const handlePhoneChange = (value: string, cursorPosition: number | null) => {
        const localDigitsBeforeCursor = countLocalDigitsBeforeCursor(value, cursorPosition ?? value.length);
        const formattedPhone = formatAzerbaijanLocalPhone(value);

        setPhone(formattedPhone);

        requestAnimationFrame(() => {
            const input = phoneInputRef.current;
            if (!input) return;

            const nextCursor = getCursorPositionFromLocalDigits(formattedPhone, localDigitsBeforeCursor);
            input.setSelectionRange(nextCursor, nextCursor);
        });
    };

    const handlePhoneBackspace = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Backspace") return;

        const input = event.currentTarget;
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;

        if (selectionStart === null || selectionEnd === null) return;
        if (selectionStart !== selectionEnd) return;

        const currentValue = phone;
        if (!currentValue) return;

        const localDigits = extractAzerbaijanLocalDigits(currentValue);
        const localDigitsBeforeCursor = countLocalDigitsBeforeCursor(currentValue, selectionStart);
        const deleteLocalIndex = localDigitsBeforeCursor - 1;

        if (deleteLocalIndex < 0) {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        const nextLocalDigits = localDigits.slice(0, deleteLocalIndex) + localDigits.slice(deleteLocalIndex + 1);
        const nextFormattedPhone = formatAzerbaijanLocalPhone(nextLocalDigits);

        setPhone(nextFormattedPhone);

        requestAnimationFrame(() => {
            const target = phoneInputRef.current;
            if (!target) return;

            const nextCursor = getCursorPositionFromLocalDigits(nextFormattedPhone, deleteLocalIndex);
            target.setSelectionRange(nextCursor, nextCursor);
        });
    };

    const handleSubmit = async () => {
        const cleanedName = fullName.trim();
        const normalizedPhone = normalizeAzerbaijanPhone(phone.trim());
        const parsedQuantity = Number(quantity);
        const variationId = Number(productVariationId);

        if (cleanedName.length < 2) {
            notify.error(t.nameTooShort);
            return;
        }

        if (!normalizedPhone) {
            notify.error(t.invalidPhone);
            return;
        }

        if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 999) {
            notify.error(t.invalidQuantity);
            return;
        }

        if (!Number.isFinite(variationId) || variationId <= 0) {
            notify.error(t.missingProduct);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await submitPurchaseRequest({
                fullname: cleanedName,
                phone: normalizedPhone,
                product_variation_id: variationId,
                quantity: parsedQuantity,
            });

            notify.success(response.message || t.success);
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : t.failed;
            notify.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            // Only a press that starts on the backdrop closes, so selecting text
            // inside the panel and releasing outside does not dismiss it.
            onMouseDown={(event) => {
                if (event.target !== event.currentTarget) return;
                onClose();
            }}
            className={cn(
                "fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 px-4 py-6",
                "transition-opacity duration-200 ease-out motion-reduce:transition-none",
                isVisible ? "opacity-100" : "opacity-0"
            )}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${fieldIdPrefix}-title`}
                className={cn(
                    "w-full max-w-[760px] overflow-hidden rounded-[16px] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]",
                    "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
                    isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.97] opacity-0"
                )}
            >
                <div className="relative flex items-center bg-[#f7f7f7] py-[15px] pr-[52px] pl-5">
                    <h3 id={`${fieldIdPrefix}-title`} className="text-[18px] leading-[1.3] font-semibold text-[#111217]">
                        {t.title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-0 right-0 z-10 flex h-full w-[42px] cursor-pointer items-center justify-center bg-black/5 text-[22px] leading-none text-[#161922] opacity-60 transition-opacity hover:opacity-100"
                        aria-label={t.close}
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4 px-5 pt-2.5 pb-5">
                    <div className="space-y-1.5">
                        <label htmlFor={`${fieldIdPrefix}-fullname`} className={labelClassName}>
                            {t.fullName}
                        </label>
                        <input
                            id={`${fieldIdPrefix}-fullname`}
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder={t.fullName}
                            className={inputClassName}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${fieldIdPrefix}-phone`} className={labelClassName}>
                            {t.phone}
                        </label>
                        <div
                            onMouseDown={(event) => {
                                if (event.target === phoneInputRef.current) return;
                                event.preventDefault();
                                phoneInputRef.current?.focus();
                            }}
                            className="flex h-[42px] w-full cursor-text items-center rounded-[20px] border border-black/10 bg-white px-4 transition-colors focus-within:border-black/20"
                        >
                            <span className="shrink-0 text-[14px] leading-none text-[#161922] select-none">+{AZ_COUNTRY_CODE}</span>
                            <input
                                id={`${fieldIdPrefix}-phone`}
                                ref={phoneInputRef}
                                type="tel"
                                value={phone}
                                onChange={(event) => handlePhoneChange(event.target.value, event.target.selectionStart)}
                                onKeyDown={handlePhoneBackspace}
                                placeholder={PHONE_PLACEHOLDER}
                                className="h-full w-full min-w-0 bg-transparent pl-1.5 text-[14px] font-normal text-[#161922] outline-none placeholder:text-[#b3b9c4]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${fieldIdPrefix}-product`} className={labelClassName}>
                            {t.product}
                        </label>
                        <input
                            id={`${fieldIdPrefix}-product`}
                            type="text"
                            value={displayedProduct}
                            readOnly
                            className={cn(
                                inputClassName,
                                "cursor-default bg-[#eff0f2] text-[#6a707a] focus:border-black/10"
                            )}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${fieldIdPrefix}-quantity`} className={labelClassName}>
                            {t.quantity}
                        </label>
                        <input
                            id={`${fieldIdPrefix}-quantity`}
                            type="text"
                            inputMode="numeric"
                            value={quantity}
                            onChange={(event) => handleQuantityChange(event.target.value)}
                            onBlur={handleQuantityBlur}
                            placeholder="1"
                            className={inputClassName}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="mt-6 inline-flex h-[55px] w-full cursor-pointer items-center justify-center rounded-[20px] bg-[#ffda00] px-[50px] text-[16px] font-bold text-black transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 max-sm:text-[15px]"
                    >
                        {isSubmitting ? t.submitting : t.submit}
                    </button>
                </div>
            </div>
        </div>
    );
};

export { QuickOrderPopup };
