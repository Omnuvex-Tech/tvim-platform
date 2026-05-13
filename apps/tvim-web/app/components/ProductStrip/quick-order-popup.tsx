"use client";

import React, { useEffect, useState } from "react";

type QuickOrderPopupProps = {
    isOpen: boolean;
    productTitle: string;
    productCode: string;
    onClose: () => void;
};

const QuickOrderPopup = ({ isOpen, productTitle, productCode, onClose }: QuickOrderPopupProps) => {
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("+994 (__) ___-__-__");
    const [quantity, setQuantity] = useState("1");

    useEffect(() => {
        if (!isOpen) {
            setFullName("");
            setPhone("+994 (__) ___-__-__");
            setQuantity("1");
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
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
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
                        onClick={onClose}
                        className="mt-1 inline-flex h-[54px] w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#ffd500] text-[20px] font-bold text-[#111217] transition-opacity hover:opacity-95 max-sm:text-[16px]"
                    >
                        Sorğunu göndər
                    </button>
                </div>
            </div>
        </div>
    );
};

export { QuickOrderPopup };
