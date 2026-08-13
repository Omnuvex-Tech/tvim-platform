"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { getTranslations } from "@/lib/i18n";
import { defaultLocale, isSupportedLocale } from "@/lib/site-locales";

const ProductSpecLink = () => {
    const pathname = usePathname();
    const segment = String(pathname ?? "").split("/").filter(Boolean)[0] ?? "";
    const t = getTranslations(isSupportedLocale(segment) ? segment : defaultLocale).product;
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const tabBtn = document.getElementById("tab-features");
        if (tabBtn) {
            tabBtn.click();
            tabBtn.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        
          <a href="#product-features"
            onClick={handleClick}
           className="mt-2 inline-block text-[15px] font-normal text-[#2563eb] hover:text-[#003dff] transition-colors"
style={{
    textDecoration: "underline",
    textDecorationStyle: "dotted",
    textDecorationColor: "#2563eb",
    textDecorationThickness: "1px",
    textUnderlineOffset: "3px",
}}
        >
            {t.allSpecs}
        </a>
    );
};

export { ProductSpecLink };