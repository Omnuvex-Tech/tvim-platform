"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { cn, useNotify } from "@repo/ui";
import { submitPurchaseRequest } from "@/lib/purchase-request/client";

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
    "h-[42px] w-full rounded-[8px] border border-[#dfe3ea] bg-white px-4 text-[14px] font-normal text-[#161922] outline-none transition-colors placeholder:text-[#b3b9c4] focus:border-[#2050f5]";

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
            notify.error("Ad və soyad ən azı 2 simvol olmalıdır.");
            return;
        }

        if (!normalizedPhone) {
            notify.error("Zəhmət olmasa düzgün telefon nömrəsi daxil edin.");
            return;
        }

        if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 999) {
            notify.error("Miqdar 1 ilə 999 arasında olmalıdır.");
            return;
        }

        if (!Number.isFinite(variationId) || variationId <= 0) {
            notify.error("Bu məhsul üçün sifariş göndərilə bilmədi.");
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

            notify.success(response.message || "Sorğu uğurla göndərildi.");
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Sorğu göndərilərkən xəta baş verdi.";
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
                    "w-full max-w-[720px] overflow-hidden rounded-[12px] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]",
                    "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
                    isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.97] opacity-0"
                )}
            >
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
                    <h3 id={`${fieldIdPrefix}-title`} className="text-[18px] leading-[1.3] font-bold text-[#111217]">
                        Məhsulu sifariş etmək istəyirsiniz?
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[6px] bg-[#ececec] text-[18px] leading-none font-semibold text-[#4b4b4b] transition-colors hover:bg-[#dedede] hover:text-[#161922]"
                        aria-label="Bağla"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4 px-6 pt-2 pb-6">
                    <div className="space-y-1.5">
                        <label htmlFor={`${fieldIdPrefix}-fullname`} className={labelClassName}>
                            Ad və soyadınız *
                        </label>
                        <input
                            id={`${fieldIdPrefix}-fullname`}
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Ad və soyadınız *"
                            className={inputClassName}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${fieldIdPrefix}-phone`} className={labelClassName}>
                            Nömrəniz *
                        </label>
                        <div
                            onMouseDown={(event) => {
                                if (event.target === phoneInputRef.current) return;
                                event.preventDefault();
                                phoneInputRef.current?.focus();
                            }}
                            className="flex h-[42px] w-full cursor-text items-center rounded-[8px] border border-[#dfe3ea] bg-white px-4 transition-colors focus-within:border-[#2050f5]"
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
                            Məhsul
                        </label>
                        <input
                            id={`${fieldIdPrefix}-product`}
                            type="text"
                            value={displayedProduct}
                            readOnly
                            className={cn(
                                inputClassName,
                                "cursor-default border-[#e4e6ea] bg-[#eff0f2] text-[#6a707a] focus:border-[#e4e6ea]"
                            )}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`${fieldIdPrefix}-quantity`} className={labelClassName}>
                            Miqdar
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
                        className="mt-6 inline-flex h-[56px] w-full cursor-pointer items-center justify-center rounded-[10px] bg-[#ffd500] text-[17px] font-bold text-[#111217] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 max-sm:text-[15px]"
                    >
                        {isSubmitting ? "Göndərilir..." : "Sorğunu göndər"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export { QuickOrderPopup };
