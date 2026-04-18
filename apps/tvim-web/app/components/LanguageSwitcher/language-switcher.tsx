"use client";

import { useCallback } from "react";
import type { Language, Translation } from "@repo/types/types";
import { LanguageSwitcher as LanguageSwitcherUI } from "@repo/ui";
import { useLanguageStore } from "@/stores";
import { api } from "@/lib/api";
import { config } from "@/config";

const LanguageSwitcher = ({
    languages,
    initialTranslations,
}: {
    languages: Language[];
    initialTranslations: Translation[];
}) => {
    const { locale, setLocale } = useLanguageStore();

    const fetchTranslations = useCallback(async (locale: string): Promise<Translation[]> => {
        const response = await api.get<Translation[]>(config.endpoints.translations.list, {
            locale,
        });

        return response.success && response.data ? response.data : [];
    }, []);

    return (
        <LanguageSwitcherUI
            languages={languages}
            initialTranslations={initialTranslations}
            defLang={config.project.defLang}
            fetchTranslations={fetchTranslations}
            locale={locale}
            onLocaleChange={setLocale}
        />
    );
};

export { LanguageSwitcher };
