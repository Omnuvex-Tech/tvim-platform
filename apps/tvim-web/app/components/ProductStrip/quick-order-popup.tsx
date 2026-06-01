"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNotify } from "@repo/ui";
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

const extractAzerbaijanLocalDigits = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.startsWith(AZ_COUNTRY_CODE)) {
        return digits.slice(AZ_COUNTRY_CODE.length, AZ_COUNTRY_CODE.length + AZ_LOCAL_PHONE_LENGTH);
    }

    return digits.slice(0, AZ_LOCAL_PHONE_LENGTH);
};

const formatAzerbaijanPhone = (value: string) => {
    const localDigits = extractAzerbaijanLocalDigits(value);
    if (!localDigits) return "";

    const part1 = localDigits.slice(0, 2);
    const part2 = localDigits.slice(2, 5);
    const part3 = localDigits.slice(5, 7);
    const part4 = localDigits.slice(7, 9);

    let formatted = "+994";

    if (part1) {
        formatted += ` (${part1}`;
        if (part1.length === 2) {
            formatted += ")";
        }
    }

    if (part2) {
        formatted += ` ${part2}`;
    }

    if (part3) {
        formatted += ` ${part3}`;
    }

    if (part4) {
        formatted += ` ${part4}`;
    }

    return formatted;
};

const countLocalDigitsBeforeCursor = (value: string, cursorPosition: number) => {
    const limit = Math.max(0, Math.min(cursorPosition, value.length));
    const leftPart = value.slice(0, limit);
    return extractAzerbaijanLocalDigits(leftPart).length;
};

const getCursorPositionFromLocalDigits = (formatted: string, localDigitsCount: number) => {
    if (!formatted) return 0;
    if (localDigitsCount <= 0) {
        return Math.min(formatted.length, 4);
    }

    let countryDigitsLeft = AZ_COUNTRY_CODE.length;
    let seenLocalDigits = 0;

    for (let i = 0; i < formatted.length; i += 1) {
        const char = formatted[i] ?? "";
        if (!/\d/.test(char)) continue;

        if (countryDigitsLeft > 0) {
            countryDigitsLeft -= 1;
            continue;
        }

        seenLocalDigits += 1;
        if (seenLocalDigits >= localDigitsCount) {
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
    const phoneInputRef = useRef<HTMLInputElement | null>(null);

    const normalizeAzerbaijanPhone = (value: string) => {
        const digits = value.replace(/\D/g, "");

        if (digits.startsWith("994") && digits.length === 12) {
            return `+${digits}`;
        }

        if (digits.length === 9) {
            return `+994${digits}`;
        }

        if (digits.startsWith("0") && digits.length === 10) {
            return `+994${digits.slice(1)}`;
        }

        return null;
    };

    useEffect(() => {
        if (!isOpen) {
            setFullName("");
            setPhone("");
            setQuantity("1");
            setIsSubmitting(false);
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const composedProduct = `${productTitle} ${productCode}`.trim();

    const handlePhoneChange = (value: string, cursorPosition: number | null) => {
        const localDigitsBeforeCursor = countLocalDigitsBeforeCursor(value, cursorPosition ?? value.length);
        const formattedPhone = formatAzerbaijanPhone(value);

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
        const nextFormattedPhone = formatAzerbaijanPhone(nextLocalDigits);

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
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 px-4 py-6" role="dialog" aria-modal="true">
            <div className="w-full max-w-[760px] overflow-hidden rounded-[14px] bg-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                <div className="flex items-stretch border-b border-[#e9e9e9] bg-[#f2f2f2]">
                    <h3 className="flex h-[52px] flex-1 items-center px-4 text-[18px] leading-[1.1] font-semibold text-[#111217]">Məhsulu sifariş etmək istəyirsiniz?</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-[52px] w-[38px] cursor-pointer items-center justify-center border-l border-[#e4e4e4] text-[18px] font-bold text-[#757575] transition-colors hover:text-[#202020]"
                        aria-label="Bağla"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4 px-4 pt-3 pb-4">
                    <label className="block">
                        <span className="mb-1.5 block text-[16px] font-medium text-[#2b2f35]">Ad və soyadınız *</span>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Ad və soyadınız *"
                            className="h-[40px] w-full rounded-full border border-[#dddddd] bg-white px-4 text-[14px] text-[#20242b] outline-none placeholder:text-[#b4b8c0]"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[16px] font-medium text-[#2b2f35]">Nömrəniz *</span>
                        <input
                            ref={phoneInputRef}
                            type="tel"
                            value={phone}
                            onChange={(event) => handlePhoneChange(event.target.value, event.target.selectionStart)}
                            onKeyDown={handlePhoneBackspace}
                            placeholder="+994 (__) ___ __ __"
                            className="h-[40px] w-full rounded-full border border-[#dddddd] bg-white px-4 text-[14px] text-[#20242b] outline-none"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[16px] font-medium text-[#2b2f35]">Məhsul</span>
                        <input
                            type="text"
                            value={composedProduct}
                            readOnly
                            className="h-[40px] w-full rounded-full border border-[#dddddd] bg-[#f3f3f3] px-4 text-[14px] text-[#6a707a] outline-none"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[16px] font-medium text-[#2b2f35]">Miqdar</span>
                        <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            className="h-[40px] w-full rounded-full border border-[#dddddd] bg-white px-4 text-[14px] text-[#20242b] outline-none"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="mt-1 inline-flex h-[54px] w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#ffd500] text-[20px] font-bold text-[#111217] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 max-sm:text-[16px]"
                    >
                        {isSubmitting ? "Göndərilir..." : "Sorğunu göndər"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export { QuickOrderPopup };
