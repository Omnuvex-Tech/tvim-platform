"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getTranslations } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { RequestForm } from "../components/RequestForm/request-form";
import { CircleX, Minus, Plus } from "lucide-react";
import { hydrateCart, removeCartItem, updateCartItemQuantity } from "@/lib/cart/client";
import { CheckoutDetailsForm } from "./components/checkout-details-form";
import { CheckoutOrderSummary } from "./components/checkout-order-summary";
import type { AuthSessionUser } from "@/lib/auth/session";
import type { RequestFormProps } from "@repo/types/types";

const formatPrice = (value: number) => `${value.toFixed(2)}₼`;
export const CHECKOUT_SUBMIT_EVENT = "tvim:checkout-submit";
export const CHECKOUT_SUBMIT_DONE_EVENT = "tvim:checkout-submit-done";

type CheckoutCartMeta = {
    id?: number;
    currency?: string;
    promo_code?: {
        id?: number;
        code?: string;
    } | null;
};

type CheckoutItem = {
    product_id?: number;
    variation_id?: number;
    product_name?: string;
    variation_name?: string;
    image?: string | null;
    qty?: number;
    original_unit_price?: number;
    unit_price?: number;
    line_subtotal?: number;
    line_discount_hour?: number;
    line_total?: number;
};

type CheckoutTotals = {
    subtotal?: number;
    discount_hour_discount?: number;
    promo_discount?: number;
    delivery_price?: number;
    total?: number;
};

type DeliveryPrice = {
    id: number;
    parent_id: number;
    name: string;
    price?: number | string | null;
};

type Address = {
    id: number;
    type?: string | null;
    label?: string | null;
    recipient_name?: string | null;
    phone?: string | null;
    delivery_price_id?: number | null;
    region?: string | null;
    city?: string | null;
    postal_code?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    company?: string | null;
    note?: string | null;
    is_default?: boolean | null;
    delivery_price?: DeliveryPrice | null;
};

type PaymentInstallment = {
    id: number;
    month: number;
    percent?: number | null;
    sort_order?: number | null;
    base_total?: number | null;
    interest_amount?: number | null;
    total_with_interest?: number | null;
    monthly_amount?: number | null;
};

type PaymentMethod = {
    key: string;
    name: string;
    description?: string | null;
    type?: string | null;
    is_online?: boolean | null;
    requires_redirect?: boolean | null;
    gateway_code?: string | null;
    icon_path?: string | null;
    installments?: PaymentInstallment[];
};

export type CheckoutData = {
    cart?: CheckoutCartMeta;
    items?: CheckoutItem[];
    totals?: CheckoutTotals;
    delivery_prices?: DeliveryPrice[];
    addresses?: Address[];
    payment_methods?: PaymentMethod[];
};

type Props = {
    locale: string;
    initialCheckout: CheckoutData | null;
    isAuthenticated: boolean;
    authUser?: AuthSessionUser | null;
    requestFormProps?: RequestFormProps | null;
};

const toNumber = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
};

export default function CheckoutClient({ locale, initialCheckout, isAuthenticated, authUser, requestFormProps }: Props) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkout, setCheckout] = useState<CheckoutData | null>(initialCheckout);
    const lastDeliveryRequestRef = useRef<number | null>(null);

    const effectiveLocale = useMemo(() => {
        const normalized = locale.trim().toLowerCase();
        return ["az", "ru", "en"].includes(normalized) ? normalized : "az";
    }, [locale]);
    const t = useMemo(() => getTranslations(effectiveLocale).checkout, [effectiveLocale]);

    const defaultDeliveryPriceId = useMemo(() => {
        const addresses = checkout?.addresses;
        if (!Array.isArray(addresses) || addresses.length === 0) return null;
        const def = addresses.find((a) => a.is_default);
        const candidate = def ?? addresses[0];
        const id = candidate?.delivery_price_id ?? null;
        return typeof id === "number" && Number.isFinite(id) ? id : null;
    }, [checkout?.addresses]);

    const [selectedDeliveryPriceId, setSelectedDeliveryPriceId] = useState<number | null>(defaultDeliveryPriceId);
    
    useEffect(() => {
        if (selectedDeliveryPriceId !== null) return;
        if (defaultDeliveryPriceId === null) return;
        setSelectedDeliveryPriceId(defaultDeliveryPriceId);
    }, [defaultDeliveryPriceId, selectedDeliveryPriceId]);

    if (!initialCheckout) {
        return (
            <div className="rounded-[6px] border border-dashed border-[#d3dbe7] bg-white px-4 py-12 text-center">
                <p className="text-lg font-semibold text-[#171d28]">{t.loadFailed}</p>
            </div>
        );
    }

    const items = useMemo(() => (Array.isArray(checkout?.items) ? checkout!.items! : []), [checkout]);
    const totals = checkout?.totals ?? {};

    const totalItems = useMemo(() => items.reduce((sum, it) => sum + toNumber(it.qty), 0), [items]);
    const subtotal = toNumber(totals.subtotal);
    const shipping = toNumber(totals.delivery_price);
    const total = toNumber(totals.total);

    const refreshCheckout = async (deliveryPriceId: number | null) => {
        setIsRefreshing(true);
        try {
            const url = deliveryPriceId
                ? `/api/order/checkout?delivery_price_id=${encodeURIComponent(String(deliveryPriceId))}`
                : "/api/order/checkout";
            const res = await fetch(url, {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    "Content-Language": effectiveLocale,
                },
            });
            const json = (await res.json().catch(() => null)) as { success?: boolean; data?: CheckoutData } | null;
            if (res.ok && json?.success && json.data) {
                setCheckout(json.data);
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    const onDeliveryPriceIdChange = async (nextId: number | null) => {
        if (nextId === selectedDeliveryPriceId && lastDeliveryRequestRef.current === nextId) return;
        setSelectedDeliveryPriceId(nextId);
        lastDeliveryRequestRef.current = nextId;
        await refreshCheckout(nextId);
    };

    const updateQty = async (variationId: number, nextQty: number) => {
        if (isUpdating) return;
        if (!Number.isFinite(variationId) || variationId <= 0) return;

        setIsUpdating(true);
        try {
            if (nextQty <= 0) {
                await removeCartItem(variationId);
            } else {
                await updateCartItemQuantity(variationId, nextQty);
            }
            await hydrateCart(true);
            await refreshCheckout(selectedDeliveryPriceId);
            router.refresh();
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        const onDone = () => setIsSubmitting(false);
        window.addEventListener(CHECKOUT_SUBMIT_DONE_EVENT, onDone);
        return () => window.removeEventListener(CHECKOUT_SUBMIT_DONE_EVENT, onDone);
    }, []);

    if (!items || items.length === 0) {
        return (
            <div className="rounded-[6px] border border-dashed border-[#d3dbe7] bg-white px-4 py-12 text-center">
                <p className="text-lg font-semibold text-[#171d28]">{t.emptyCart}</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section className="overflow-hidden rounded-[6px] bg-white">
                <div className="space-y-6">
                    {items.map((it) => {
                        const variationId = toNumber(it.variation_id);
                        const qty = Math.max(0, toNumber(it.qty));
                        const unit = toNumber(it.unit_price);
                        const originalUnit = toNumber(it.original_unit_price);
                        const hasDiscount = unit > 0 && originalUnit > 0 && unit < originalUnit;
                        const title = String(it.variation_name ?? it.product_name ?? "").trim();
                        const fallbackTitle = variationId ? t.productWithId.replace("{id}", String(variationId)) : t.productFallback;
                        const imageUrl = typeof it.image === "string" ? it.image.trim().replace(/^`+|`+$/g, "").trim() : "";
                        return (
                            <div
                                key={`${variationId}-${title || fallbackTitle}`}
                                className="relative w-full rounded-[10px] border border-[#eef2f7] bg-white p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_132px_220px_32px] lg:items-center lg:gap-6 lg:rounded-none lg:border-0 lg:p-0 first:rounded-t-[6px] last:rounded-b-[6px]"
                            >
                                <div className="flex min-w-0 items-center gap-4 self-center">
                                    <div className="h-[96px] w-[96px] flex-none overflow-hidden rounded-[6px] bg-white sm:h-[120px] sm:w-[120px] lg:h-[144px] lg:w-[144px]">
                                        {imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={imageUrl} alt={title || fallbackTitle} className="h-full w-full object-contain" />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-medium text-[#8a98ac]">{t.productCode}: {toNumber(it.product_id) || variationId || "-"}</p>
                                        <p className="truncate text-[20px] leading-[1.2] font-semibold text-[#111826]">
                                            {title || fallbackTitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex justify-end lg:mt-0 lg:justify-center">
                                    <div className="inline-flex h-[54px] w-[132px] items-center justify-center self-center rounded-[18px] border border-[#d6deea] px-4 lg:translate-y-[4px]">
                                    <button
                                        type="button"
                                        disabled={isUpdating || !variationId || qty <= 0}
                                        onClick={() => updateQty(variationId, qty - 1)}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-[#6f819c] transition-colors hover:text-[#325dd6]"
                                        aria-label={t.decrease}
                                    >
                                        <Minus className="size-4" strokeWidth={2.4} aria-hidden="true" />
                                    </button>
                                    <span className="mx-2 min-w-[24px] text-center text-[18px] leading-none font-medium text-[#1b2330]">
                                        {qty}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={isUpdating || !variationId}
                                        onClick={() => updateQty(variationId, qty + 1)}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-[#6f819c] transition-colors hover:text-[#325dd6]"
                                        aria-label={t.increase}
                                    >
                                        <Plus className="size-4" strokeWidth={2.4} aria-hidden="true" />
                                    </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-end justify-between gap-6 self-center lg:mt-0 lg:grid lg:grid-cols-2 lg:gap-5">
                                    <div className="flex flex-col justify-center">
                                        <p className="mb-1 text-[11px] font-medium text-[#8e97a6]">{t.unitPrice}</p>
                                        <p className="text-[20px] leading-none font-semibold text-[#111826]">{formatPrice(unit)}</p>
                                        {hasDiscount ? (
                                            <p className="mt-1 text-[12px] leading-none font-medium text-[#8e97a6] line-through">
                                                {formatPrice(originalUnit)}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col justify-center text-right lg:text-left">
                                        <p className="mb-1 text-[11px] font-medium text-[#8e97a6]">{t.lineTotal}</p>
                                        <p className="text-[20px] leading-none font-semibold text-[#111826]">{formatPrice(unit * qty)}</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={isUpdating || !variationId}
                                    onClick={() => updateQty(variationId, 0)}
                                    className="absolute top-3 right-3 inline-flex h-8 w-8 cursor-pointer items-center justify-center text-[#9cadc4] transition-colors hover:text-[#5f6f86] lg:static lg:self-center lg:justify-self-end"
                                    aria-label={t.removeItem}
                                >
                                    <CircleX className="size-5" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                    {checkout ? (
                        <CheckoutDetailsForm
                            locale={effectiveLocale}
                            checkout={checkout}
                            isAuthenticated={isAuthenticated}
                            isLoading={isRefreshing || isUpdating}
                            onDeliveryPriceIdChange={onDeliveryPriceIdChange}
                            authUser={authUser}
                        />
                    ) : null}
                </section>

                <CheckoutOrderSummary
                    totalItems={totalItems}
                    shipping={shipping}
                    subtotal={subtotal}
                    total={total}
                    isSubmitting={isSubmitting}
                    onCheckout={() => {
                        setIsSubmitting(true);
                        window.dispatchEvent(new Event(CHECKOUT_SUBMIT_EVENT));
                    }}
                />
            </div>

            {requestFormProps ? (
                <div className="mt-2 mb-10 lg:mt-4 lg:mb-14">
                    <RequestForm {...requestFormProps} />
                </div>
            ) : null}
        </div>
    );
}
