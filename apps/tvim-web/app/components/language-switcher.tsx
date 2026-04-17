"use client";

import { useCallback } from "react";
import type { Language, Translation } from "@repo/types/types";
import { LanguageSwitcher as LanguageSwitcherUI } from "@repo/ui";
import { api } from "@/lib/api";
import { endpoints } from "@/config/endpoints";
import { project } from "@/config/project";

const LanguageSwitcher = ({
    languages,
    initialTranslations,
}: {
    languages: Language[];
    initialTranslations: Translation[];
}) => {
    const fetchTranslations = useCallback(async (locale: string): Promise<Translation[]> => {
        const response = await api.get<Translation[]>(endpoints.translations.list, {
            locale,
        });

        return response.success && response.data ? response.data : [];
    }, []);

    return (
        <LanguageSwitcherUI
            languages={languages}
            initialTranslations={initialTranslations}
            defLang={project.defLang}
            fetchTranslations={fetchTranslations}
        />
    );
};

export { LanguageSwitcher };
