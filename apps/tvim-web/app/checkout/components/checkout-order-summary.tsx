import React from "react";

type CheckoutOrderSummaryProps = {
    totalItems: number;
    shipping: number;
    subtotal: number;
    total: number;
    onCheckout: () => void;
};

const formatPrice = (value: number) => `${value.toFixed(2)}₼`;

const CheckoutOrderSummary = ({
    totalItems,
    shipping,
    subtotal,
    total,
    onCheckout,
}: CheckoutOrderSummaryProps) => {
    return (
        <aside className="h-fit bg-white p-0 lg:sticky lg:top-24">
            <h3 className="text-[1.4em] leading-none font-bold text-[#111826]">Sifarişiniz</h3>

            <div className="mt-6 max-w-[300px] space-y-7">
                <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 text-[16px]">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#1b2330]">
                        <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M9 1.75L15.8 4.9L9 8.05L2.2 4.9L9 1.75Z" fill="#1F4FFF" />
                            <path d="M2.2 6.1L9 9.25L15.8 6.1V12.7L9 15.9L2.2 12.7V6.1Z" fill="#1F4FFF" />
                            <path d="M4.7 7.15L9 9.15L13.3 7.15" stroke="#F2F6FF" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Səbətdəki məhsullar:
                    </span>
                    <span className="text-left font-semibold text-[#111826]">{totalItems}</span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 text-[16px]">
                    <span className="inline-flex items-center gap-2 text-[#1b2330]">
                        <i className="fa fa-truck" style={{ fontSize: "16px", color: "#0052cc", marginRight: "5px", verticalAlign: "middle" }} aria-hidden="true" />
                        Ünvana çatdırılma
                    </span>
                    <span className="text-left font-semibold text-[#111826]">{shipping === 0 ? "0.00₼" : formatPrice(shipping)}</span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 text-[16px]">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#1b2330]">
                        <i className="sub_total" style={{ fontStyle: "normal", fontSize: "16px", color: "#1f4fff", lineHeight: 1, display: "inline-block", transform: "translateY(-1px)" }} aria-hidden="true">
                            ∑
                        </i>
                        Toplam qiymət
                    </span>
                    <span className="text-left font-semibold text-[#111826]">{formatPrice(subtotal)}</span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 text-[16px] font-bold text-[#111826]">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        <i className="sub_total" style={{ fontStyle: "normal", fontSize: "16px", color: "#1f4fff", lineHeight: 1, display: "inline-block", transform: "translateY(-1px)" }} aria-hidden="true">
                            ∑
                        </i>
                        Ümumi məbləğ
                    </span>
                    <span className="text-left whitespace-nowrap">{formatPrice(total)}</span>
                </div>
            </div>

            <button
                type="button"
                onClick={onCheckout}
                className="mt-8 inline-flex h-[44px] w-full max-w-[246px] cursor-pointer items-center justify-center rounded-[20px] bg-[#ffd500] px-5 text-[15px] font-bold text-[#000]"
            >
                Sifarişi rəsmiləşdirin
            </button>
        </aside>
    );
};

export { CheckoutOrderSummary };
