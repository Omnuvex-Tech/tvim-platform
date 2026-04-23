"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { Language, LanguageSwitcherProps } from "@repo/types/types";
import { cn } from "../../lib/utils";

const localeOptions = [
    { code: "az", country: "AZ" },
    { code: "en", country: "GB" },
    { code: "ru", country: "RU" },
];

function LocaleFlag({ country }: { country: string }) {
    if (country === "GB") {
        return (
            <svg viewBox="0 0 22 14" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="22" height="14" fill="#012169" />
                <path d="M0 0l22 14M22 0 0 14" stroke="#fff" strokeWidth="3" />
                <path d="M0 0l22 14M22 0 0 14" stroke="#C8102E" strokeWidth="1.5" />
                <path d="M11 0v14M0 7h22" stroke="#fff" strokeWidth="4" />
                <path d="M11 0v14M0 7h22" stroke="#C8102E" strokeWidth="2" />
            </svg>
        );
    }

    if (country === "RU") {
        return (
            <svg viewBox="0 0 22 14" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="22" height="14" fill="#fff" />
                <rect y="4.666" width="22" height="4.666" fill="#0039A6" />
                <rect y="9.332" width="22" height="4.668" fill="#D52B1E" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 22 14" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="22" height="14" fill="#0099E6" />
            <rect y="4.666" width="22" height="4.666" fill="#ED2939" />
            <rect y="9.332" width="22" height="4.668" fill="#3F9C35" />
            <circle cx="10.2" cy="7" r="2.15" fill="#fff" />
            <circle cx="10.9" cy="7" r="1.75" fill="#ED2939" />
            <path d="M13.72 5.72l.24.73h.77l-.62.45.24.74-.63-.46-.62.46.24-.74-.62-.45h.77l.23-.73Z" fill="#fff" />
        </svg>
    );
}

const LanguageSwitcher = ({
    languages,
    defLang,
    locale,
    onLocaleChange,
    variant = "desktop",
}: LanguageSwitcherProps & {
    locale: string;
    onLocaleChange: (locale: string) => void;
    variant?: "desktop" | "mobile";
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeLocale = locale || defLang;

    const activeLang = useMemo(() => {
        const lang = languages.find((l) => l.code === activeLocale);
        const country = localeOptions.find((o) => o.code === activeLocale)?.country || "AZ";
        return {
            code: (lang?.code || activeLocale || "az").toUpperCase(),
            country,
        };
    }, [activeLocale, languages]);

    const isDesktop = variant === "desktop";

    return (
        <div className="relative">
            <button
                type="button"
                className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 border border-[#d7deea] bg-white font-semibold text-[#1d2230]",
                    isDesktop ? "h-10 rounded-[14px] px-2.5 text-[13px]" : "h-8 rounded-[10px] px-1.5 text-[12px]"
                )}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span
                    className={cn(
                        "inline-flex overflow-hidden rounded-[2px] border border-black/10",
                        isDesktop ? "h-[14px] w-[22px]" : "h-[12px] w-[18px]"
                    )}
                    aria-hidden="true"
                >
                    <LocaleFlag country={activeLang.country} />
                </span>
                <span className="leading-none">{activeLang.code}</span>
                <ChevronDown
                    className={cn(
                        "text-[#2e3441] transition-transform",
                        isDesktop ? "size-4" : "size-3.5",
                        isOpen ? "rotate-180" : "rotate-0"
                    )}
                />
            </button>

            {isOpen && (
                <div
                    className={cn(
                        "absolute top-full right-0 z-30 mt-2 rounded-xl border border-[#d7deea] bg-white p-1.5 shadow-[0_10px_24px_rgba(17,24,39,0.12)]",
                        isDesktop ? "min-w-[120px]" : "min-w-[110px]"
                    )}
                >
                    {languages.map((lang) => {
                        const country =
                            localeOptions.find((o) => o.code === lang.code)?.country || "AZ";
                        const isActive = lang.code === activeLocale;
                        const code = lang.code.toUpperCase();

                        return (
                            <button
                                key={lang.id}
                                type="button"
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-2 rounded-lg border text-left font-medium text-[#1d2230] transition-colors",
                                    isDesktop ? "px-3 py-2 text-[14px]" : "px-2 py-1.5 text-[13px]",
                                    isActive && "border-[#c7d8fb] bg-[#e7efff]",
                                    !isActive && "border-transparent hover:bg-[#f3f4f6]"
                                )}
                                onClick={() => {
                                    onLocaleChange(lang.code);
                                    setIsOpen(false);
                                }}
                                role="option"
                                aria-selected={isActive}
                            >
                                <span
                                    className={cn(
                                        "inline-flex overflow-hidden rounded-[2px] border border-black/10",
                                        isDesktop ? "h-[14px] w-[22px]" : "h-[12px] w-[18px]"
                                    )}
                                    aria-hidden="true"
                                >
                                    <LocaleFlag country={country} />
                                </span>
                                <span>{code}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export { LanguageSwitcher };
export { LocaleFlag };
