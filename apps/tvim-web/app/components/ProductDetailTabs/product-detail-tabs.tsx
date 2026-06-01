"use client";

import React, { useMemo, useState } from "react";

type SpecRow = {
    label: string;
    value: string;
};

type ProductDetailTabsProps = {
    descriptionHtml?: string | null;
    allSpecRows: SpecRow[];
    commentsCount?: number;
};

type TabKey = "about" | "features" | "comments";

const ProductDetailTabs = ({ descriptionHtml, allSpecRows, commentsCount = 0 }: ProductDetailTabsProps) => {
    const [activeTab, setActiveTab] = useState<TabKey>("about");

    const hasDescription = useMemo(() => Boolean(String(descriptionHtml ?? "").trim()), [descriptionHtml]);
    const hasFeatures = allSpecRows.length > 0;

    return (
        <section className="mt-10">
            <div className="flex items-end gap-10 border-b border-[#dce3ef]">
                <button
                    type="button"
                    onClick={() => setActiveTab("about")}
                    className={`-mb-px cursor-pointer border-b pb-2 text-[24px] font-bold leading-none transition-colors max-lg:text-[24px] ${
                        activeTab === "about" ? "border-[#2454e7] text-[#2454e7]" : "border-transparent text-[#8b95a8]"
                    }`}
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                    Məhsul haqqında
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("features")}
                    className={`-mb-px cursor-pointer border-b pb-2 text-[24px] font-bold leading-none transition-colors max-lg:text-[24px] ${
                        activeTab === "features" ? "border-[#2454e7] text-[#2454e7]" : "border-transparent text-[#8b95a8]"
                    }`}
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                    Xüsusiyyətlər
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("comments")}
                    className={`-mb-px cursor-pointer border-b pb-2 text-[24px] font-bold leading-none transition-colors max-lg:text-[24px] ${
                        activeTab === "comments" ? "border-[#2454e7] text-[#2454e7]" : "border-transparent text-[#8b95a8]"
                    }`}
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                    Şərhlər ({commentsCount})
                </button>
            </div>

            {activeTab === "about" ? (
                <div className="mt-4 text-[14px] leading-[1.42857143] text-[#1b202b] max-lg:text-[14px] [&_p]:text-[14px] [&_p]:font-normal [&_p]:text-[#1b202b] [&_span]:text-[14px] [&_span]:font-normal [&_span]:text-[#1b202b] [&_b]:text-[14px] [&_b]:font-normal [&_b]:text-[#1b202b] [&_strong]:text-[14px] [&_strong]:font-normal [&_strong]:text-[#1b202b]">
                    {hasDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: String(descriptionHtml ?? "") }} />
                    ) : (
                        <div className="min-h-[24px]" />
                    )}
                </div>
            ) : null}

            {activeTab === "features" ? (
                hasFeatures ? (
                    <div className="mt-6 w-full">
                        <div className="space-y-10 text-[14px] leading-[1.42857143]">
                            {allSpecRows.map((row, idx) => (
                                <div
                                    key={`${row.label}-${idx}`}
                                    className="grid grid-cols-1 items-start gap-y-1 sm:grid-cols-[minmax(220px,320px)_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[600px_minmax(0,1fr)] lg:gap-x-8"
                                >
                                    <span className="text-[#111318]">{row.label}</span>
                                    <span className="text-[#2a2a2d]">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 min-h-[24px] text-[14px] text-[#8b95a8]">Xüsusiyyət tapılmadı.</div>
                )
            ) : null}

            {activeTab === "comments" ? (
                <div className="mt-6">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[22px] leading-[1.2] font-normal text-[#111318]">
                        <span className="text-[#111318]">Şərh: {commentsCount}</span>
                        <span className="text-[#111318]">Orta qiymət: 0.0</span>
                        <div className="flex items-center gap-1 text-[#c7cdd9] text-[22px] leading-none">
                            <i className="far fa-star" aria-hidden="true" />
                            <i className="far fa-star" aria-hidden="true" />
                            <i className="far fa-star" aria-hidden="true" />
                            <i className="far fa-star" aria-hidden="true" />
                            <i className="far fa-star" aria-hidden="true" />
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full bg-[rgba(0,61,255,1)] !px-4 !py-[15px] !text-[16px] !leading-[1px] !font-[650] text-white transition-opacity hover:opacity-95"
                            style={{ fontFamily: "var(--font-inter), sans-serif" }}
                        >
                            Şərh yaz
                        </button>
                    </div>

                    <div className="mt-8 min-h-[24px] text-[14px] leading-[1.42857143] text-[#111318]">Bu məhsul üçün şərh yazılmayıb.</div>
                </div>
            ) : null}

            <div className="mt-6" />
        </section>
    );
};

export { ProductDetailTabs };
