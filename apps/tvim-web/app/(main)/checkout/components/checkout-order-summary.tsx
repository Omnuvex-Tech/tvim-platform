import React from "react";
import { usePathname } from "next/navigation";
import { getTranslations } from "@/lib/i18n";
import { defaultLocale, isSupportedLocale } from "@/lib/site-locales";
import { Spinner } from "@repo/ui";

type CheckoutOrderSummaryProps = {
    totalItems: number;
    shipping: number;
    subtotal: number;
    total: number;
    isSubmitting?: boolean;
    onCheckout: () => void;
};

const formatPrice = (value: number) => `${value.toFixed(2)}₼`;

const CheckoutOrderSummary = ({
    totalItems,
    shipping,
    subtotal,
    total,
    isSubmitting,
    onCheckout,
}: CheckoutOrderSummaryProps) => {
    const pathname = usePathname();
    const segment = String(pathname ?? "").split("/").filter(Boolean)[0] ?? "";
    const t = getTranslations(isSupportedLocale(segment) ? segment : defaultLocale).checkout;
    return (
        <aside className="h-fit w-full bg-white p-0 lg:sticky lg:top-24">
            <h3 className="text-[1.4em] leading-none font-bold text-[#111826]">{t.summaryTitle}</h3>

            <div className="mt-6 w-full space-y-7">
                <div className="w-full grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 text-[16px]">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#1b2330]">
                        <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M9 1.75L15.8 4.9L9 8.05L2.2 4.9L9 1.75Z" fill="#1F4FFF" />
                            <path d="M2.2 6.1L9 9.25L15.8 6.1V12.7L9 15.9L2.2 12.7V6.1Z" fill="#1F4FFF" />
                            <path d="M4.7 7.15L9 9.15L13.3 7.15" stroke="#F2F6FF" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t.itemsInCart}
                    </span>
                    <span className="justify-self-end text-right font-semibold text-[#111826]">{totalItems}</span>
                </div>

                <div className="w-full grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 text-[16px]">
                    <span className="inline-flex items-center gap-2 text-[#1b2330]">
                        <i className="fa fa-truck" style={{ fontSize: "16px", color: "#0052cc", marginRight: "5px", verticalAlign: "middle" }} aria-hidden="true" />
                        {t.delivery}
                    </span>
                    <span className="justify-self-end text-right font-semibold text-[#111826]">{shipping === 0 ? "0.00₼" : formatPrice(shipping)}</span>
                </div>

                <div className="w-full grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 text-[16px]">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#1b2330]">
                        <i className="sub_total" style={{ fontStyle: "normal", fontSize: "16px", color: "#1f4fff", lineHeight: 1, display: "inline-block", transform: "translateY(-1px)" }} aria-hidden="true">
                            ∑
                        </i>
                        {t.subtotal}
                    </span>
                    <span className="justify-self-end text-right font-semibold text-[#111826]">{formatPrice(subtotal)}</span>
                </div>

                <div className="w-full grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 text-[16px] font-bold text-[#111826]">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        <i className="sub_total" style={{ fontStyle: "normal", fontSize: "16px", color: "#1f4fff", lineHeight: 1, display: "inline-block", transform: "translateY(-1px)" }} aria-hidden="true">
                            ∑
                        </i>
                        {t.grandTotal}
                    </span>
                    <span className="justify-self-end text-right whitespace-nowrap">{formatPrice(total)}</span>
                </div>
            </div>

            <button
                type="button"
                onClick={onCheckout}
                disabled={Boolean(isSubmitting)}
                className="mt-8 inline-flex h-[44px] w-full cursor-pointer items-center justify-center rounded-[20px] bg-[#ffd500] px-5 text-[15px] font-bold text-[#000] disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isSubmitting ? <Spinner size={22} strokeWidth={2} /> : t.submit}
            </button>
        </aside>
    );
};

export { CheckoutOrderSummary };
