"use client";

import { useState, useEffect, useCallback } from "react";
import type { Language, Translation, LanguageSwitcherProps } from "@repo/types/types";

const LanguageSwitcher = ({
    languages,
    initialTranslations,
    defLang,
    fetchTranslations: fetchTranslationsFn,
    locale,
    onLocaleChange,
}: LanguageSwitcherProps & {
    locale: string;
    onLocaleChange: (locale: string) => void;
}) => {
    const activeLocale = locale || defLang;
    const active = languages.find((l) => l.code === activeLocale) ?? languages[0]!;
    const [translations, setTranslations] = useState<Translation[]>(initialTranslations);

    const fetchTranslations = useCallback(async (code: string) => {
        const result = await fetchTranslationsFn(code);
        setTranslations(result);
    }, [fetchTranslationsFn]);

    useEffect(() => {
        fetchTranslations(active.code);
    }, [active.code, fetchTranslations]);

    const t = (key: string): string => {
        const found = translations.find((item) => item.key === key);
        return found?.value ?? key;
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
                {languages.map((lang) => (
                    <button
                        key={lang.id}
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            active.code === lang.code
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-accent"
                        }`}
                        onClick={() => onLocaleChange(lang.code)}
                    >
                        {lang.native_name}
                    </button>
                ))}
            </div>

            <div className="text-center">
                <h2 className="text-xl font-semibold">{t("projectName")}</h2>
                <p className="text-sm text-muted-foreground">{active.native_name} ({active.code})</p>
            </div>
        </div>
    );
};

export { LanguageSwitcher };
