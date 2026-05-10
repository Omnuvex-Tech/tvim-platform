import React from "react";
import { CreditCard, Landmark, Mail, MapPin, Phone, User, Wallet } from "lucide-react";

const CheckoutDetailsForm = () => {
    return (
        <div className="mt-4 border-t border-[#edf1f6] px-2 pb-2 pt-8 sm:px-4 lg:px-2">
            <div className="space-y-9">
                <section>
                    <h3 className="mb-5 text-[32px] leading-none font-semibold text-[#111826]">1. Əlaqə məlumatları</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex h-[72px] items-center gap-3 rounded-[16px] bg-[#eaf0f7] px-4 text-[#6e7f99]">
                            <User className="size-4 text-[#2e5cff]" />
                            <input
                                type="text"
                                placeholder="Ad *"
                                className="h-full w-full bg-transparent text-[16px] text-[#243247] outline-none placeholder:text-[#7f8fa8]"
                            />
                        </label>
                        <label className="flex h-[72px] items-center gap-3 rounded-[16px] bg-[#eaf0f7] px-4 text-[#6e7f99]">
                            <User className="size-4 text-[#2e5cff]" />
                            <input
                                type="text"
                                placeholder="Soyad *"
                                className="h-full w-full bg-transparent text-[16px] text-[#243247] outline-none placeholder:text-[#7f8fa8]"
                            />
                        </label>
                        <label className="flex h-[72px] items-center gap-3 rounded-[16px] bg-[#eaf0f7] px-4 text-[#6e7f99]">
                            <Phone className="size-4 text-[#2e5cff]" />
                            <input
                                type="tel"
                                placeholder="Telefon *"
                                className="h-full w-full bg-transparent text-[16px] text-[#243247] outline-none placeholder:text-[#7f8fa8]"
                            />
                        </label>
                        <label className="flex h-[72px] items-center gap-3 rounded-[16px] bg-[#eaf0f7] px-4 text-[#6e7f99]">
                            <Mail className="size-4 text-[#2e5cff]" />
                            <input
                                type="email"
                                defaultValue="ilahin.1@omnuvex.net"
                                className="h-full w-full bg-transparent text-[16px] text-[#243247] outline-none placeholder:text-[#7f8fa8]"
                            />
                        </label>
                    </div>
                </section>

                <section>
                    <h3 className="mb-5 text-[32px] leading-none font-semibold text-[#111826]">2. Ünvan</h3>
                    <div className="space-y-4">
                        <label className="relative block">
                            <select className="h-[54px] w-full appearance-none rounded-[8px] border border-[#cfd8e5] bg-white px-4 pr-10 text-[15px] text-[#1f2a3a] outline-none">
                                <option>Bakı</option>
                            </select>
                            <svg className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#93a1b5]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </label>

                        <label className="relative block">
                            <select className="h-[54px] w-full appearance-none rounded-[8px] border border-[#cfd8e5] bg-white px-4 pr-10 text-[15px] text-[#1f2a3a] outline-none">
                                <option>--- Seçin ---</option>
                            </select>
                            <svg className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#93a1b5]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </label>

                        <p className="text-[15px] font-semibold text-[#ef2b2b]">Ünvana çatdırılma: 0.00₼</p>

                        <label className="flex h-[72px] items-center gap-3 rounded-[16px] bg-[#eaf0f7] px-4 text-[#6e7f99]">
                            <MapPin className="size-4 text-[#2e5cff]" />
                            <input
                                type="text"
                                placeholder="Ünvan *"
                                className="h-full w-full bg-transparent text-[16px] text-[#243247] outline-none placeholder:text-[#7f8fa8]"
                            />
                        </label>
                    </div>
                </section>

                <section>
                    <h3 className="mb-5 text-[32px] leading-none font-semibold text-[#111826]">3. Ödəniş üsulları</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <label className="flex h-[88px] cursor-pointer items-center gap-3 rounded-[16px] border border-[#d2dded] bg-[#eaf0f7] px-4">
                            <input type="radio" name="payment-method" defaultChecked className="h-[15px] w-[15px] accent-[#2756ff]" />
                            <span className="text-[14px] font-medium text-[#2e5cff]">Qapıda post terminalla</span>
                            <Landmark className="ml-auto size-[18px] text-[#8d99ab]" />
                        </label>

                        <label className="flex h-[88px] cursor-pointer items-center gap-3 rounded-[16px] border border-[#e3e9f2] bg-[#f2f5fa] px-4">
                            <input type="radio" name="payment-method" className="h-[15px] w-[15px] accent-[#2756ff]" />
                            <span className="text-[14px] font-medium text-[#7f8fa8]">Qapıda nəğd pulla</span>
                            <Wallet className="ml-auto size-[18px] text-[#9aa7ba]" />
                        </label>

                        <label className="flex h-[88px] cursor-pointer items-center gap-3 rounded-[16px] border border-[#e3e9f2] bg-[#f2f5fa] px-4">
                            <input type="radio" name="payment-method" className="h-[15px] w-[15px] accent-[#2756ff]" />
                            <span className="text-[14px] font-medium text-[#7f8fa8]">Saytda kart ilə ödəniş</span>
                            <CreditCard className="ml-auto size-[18px] text-[#9aa7ba]" />
                        </label>
                    </div>
                </section>

                <section>
                    <h3 className="mb-5 text-[32px] leading-none font-semibold text-[#111826]">4. Şərh</h3>
                    <label className="flex min-h-[160px] items-start gap-3 rounded-[16px] bg-[#eaf0f7] px-4 py-4 text-[#6e7f99]">
                        <svg className="mt-1 h-4 w-4 text-[#2e5cff]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M6.5 13.5L5.75 16.5L8.75 15.75L15.25 9.25C15.6642 8.83579 15.6642 8.16421 15.25 7.75L12.25 4.75C11.8358 4.33579 11.1642 4.33579 10.75 4.75L4.25 11.25L3.5 14.5L6.5 13.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <textarea
                            placeholder="Şərh"
                            className="h-full min-h-[130px] w-full resize-none bg-transparent text-[16px] text-[#243247] outline-none placeholder:text-[#7f8fa8]"
                        />
                    </label>
                </section>
            </div>
        </div>
    );
};

export { CheckoutDetailsForm };
