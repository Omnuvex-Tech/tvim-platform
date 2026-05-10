"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { CircleX, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/stores";
import { CheckoutDetailsForm } from "./components/checkout-details-form";
import { CheckoutOrderSummary } from "./components/checkout-order-summary";
import { RequestForm } from "../components/RequestForm/request-form";

const formatPrice = (value: number) => `${value.toFixed(2)}₼`;
const parsePrice = (value: string | number | undefined) => Number(String(value ?? "").replace(/[^0-9.-]+/g, "")) || 0;

export default function CheckoutClient() {
    const items = useCartStore((s) => s.items);
    const increase = useCartStore((s) => s.increaseQuantity);
    const decrease = useCartStore((s) => s.decreaseQuantity);
    const removeItem = useCartStore((s) => s.removeItem);
    const router = useRouter();

    const subtotal = useMemo(() => {
        return items.reduce((sum, it) => {
            const unit = parsePrice(it.product.price);
            return sum + unit * (it.quantity || 0);
        }, 0);
    }, [items]);
    const totalItems = useMemo(() => items.reduce((sum, it) => sum + (it.quantity || 0), 0), [items]);

    const shipping = 0;
    const total = subtotal + shipping;

    if (!items || items.length === 0) {
        return (
            <div className="rounded-[6px] border border-dashed border-[#d3dbe7] bg-white px-4 py-12 text-center">
                <p className="text-lg font-semibold text-[#171d28]">Səbətinizdə məhsul yoxdur.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section className="overflow-hidden rounded-[6px] bg-white">
                <div>
                    {items.map((it) => {
                        const unit = parsePrice(it.product.price);
                        return (
                            <div
                                key={it.key}
                                className="grid items-center gap-4 py-3 lg:grid-cols-[minmax(0,1fr)_132px_220px_32px] lg:gap-6"
                            >
                                <div className="flex min-w-0 items-center gap-4 self-center">
                                    <div className="h-[144px] w-[144px] flex-none overflow-hidden rounded-[6px] bg-white">
                                        {it.product.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={it.product.imageUrl} alt={it.product.title} className="h-full w-full object-contain" />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-medium text-[#8a98ac]">Məhsul kodu: {it.product.id}</p>
                                        <p className="truncate text-[20px] leading-[1.2] font-semibold text-[#111826]">
                                            {it.product.title}
                                        </p>
                                    </div>
                                </div>

                                <div className="inline-flex h-[54px] w-[132px] translate-y-[4px] items-center justify-center self-center rounded-[18px] border border-[#d6deea] px-4">
                                    <button
                                        type="button"
                                        onClick={() => decrease(it.key)}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-[#6f819c] transition-colors hover:text-[#325dd6]"
                                        aria-label="Azalt"
                                    >
                                        <Minus className="size-4" strokeWidth={2.4} aria-hidden="true" />
                                    </button>
                                    <span className="mx-2 min-w-[24px] text-center text-[18px] leading-none font-medium text-[#1b2330]">
                                        {it.quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => increase(it.key)}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-[#6f819c] transition-colors hover:text-[#325dd6]"
                                        aria-label="Artır"
                                    >
                                        <Plus className="size-4" strokeWidth={2.4} aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-5 self-center">
                                    <div className="flex h-[54px] flex-col justify-center">
                                        <p className="mb-1 text-[11px] font-medium text-[#8e97a6]">Qiyməti</p>
                                        <p className="text-[20px] leading-none font-semibold text-[#111826]">{formatPrice(unit)}</p>
                                    </div>
                                    <div className="flex h-[54px] flex-col justify-center">
                                        <p className="mb-1 text-[11px] font-medium text-[#8e97a6]">Cəmi</p>
                                        <p className="text-[20px] leading-none font-semibold text-[#111826]">{formatPrice(unit * it.quantity)}</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeItem(it.key)}
                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center self-center justify-self-end text-[#9cadc4] transition-colors hover:text-[#5f6f86]"
                                    aria-label="Səbətdən sil"
                                >
                                    <CircleX className="size-5" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                    <CheckoutDetailsForm />
                </section>

                <CheckoutOrderSummary
                    totalItems={totalItems}
                    shipping={shipping}
                    subtotal={subtotal}
                    total={total}
                    onCheckout={() => router.push("/checkout/complete")}
                />
            </div>

            <RequestForm />
        </div>
    );
}
