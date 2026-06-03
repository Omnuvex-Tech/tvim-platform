"use client";

import React from "react";

const ProductSpecLink = () => {
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
            Bütün xüsusiyyətlər
        </a>
    );
};

export { ProductSpecLink };