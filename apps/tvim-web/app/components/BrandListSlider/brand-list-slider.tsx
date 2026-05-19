"use client";

import React from "react";
import type { Company } from "@repo/ui";

type Props = {
    companies?: Company[];
    className?: string;
};

export default function BrandListSlider({ companies = [], className = "" }: Props) {
    if (!companies || companies.length === 0) return null;

    return (
        <section className={`w-full ${className}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {companies.map((c) => (
                    <a
                        key={c.id}
                        href={c.url ?? "#"}
                        className="block bg-white rounded-[18px] p-3 sm:p-5 shadow-[0_0_24px_rgba(15,23,42,0.06)] hover:shadow-[0_0_30px_rgba(15,23,42,0.09)] transition-shadow flex items-center justify-center h-[120px]"
                    >
                        {c.logo ? (
                            typeof c.logo === "string" ? (
                                <img src={c.logo} alt={c.name} className="max-h-[96px] sm:max-h-[80px] w-auto object-contain" />
                            ) : (
                                <img src={String((c.logo as any).src ?? "")} alt={c.name} className="max-h-[96px] sm:max-h-[80px] w-auto object-contain" />
                            )
                        ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">Logo</div>
                        )}
                    </a>
                ))}
            </div>
        </section>
    );
}
