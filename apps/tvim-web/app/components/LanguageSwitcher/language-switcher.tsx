"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Language, Translation } from "@repo/types/types";
import { LanguageSwitcher as LanguageSwitcherUI } from "@repo/ui";
import { useLanguageStore } from "@/stores";
import { api } from "@/lib/api";
import { config } from "@/config";

const LanguageSwitcher = ({
    languages,
    initialTranslations,
    routeLocale,
}: {
    languages: Language[];
    initialTranslations: Translation[];
    routeLocale?: string;
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const { locale, setLocale } = useLanguageStore();
    const effectiveLocale = routeLocale ?? locale;

    const fetchTranslations = useCallback(async (locale: string): Promise<Translation[]> => {
        const response = await api.get<Translation[]>(config.endpoints.translations.list, {
            locale,
        });

        return response.success && response.data ? response.data : [];
    }, []);

    const handleLocaleChange = useCallback((nextLocale: string) => {
        setLocale(nextLocale);

        if (!routeLocale) {
            return;
        }

        const segments = pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
            segments[0] = nextLocale;
        }
        router.push(`/${segments.join("/")}`);
    }, [pathname, routeLocale, router, setLocale]);

    useEffect(() => {
        if (routeLocale && locale !== routeLocale) {
            setLocale(routeLocale);
        }
    }, [locale, routeLocale, setLocale]);

    return (
        <LanguageSwitcherUI
            languages={languages}
            initialTranslations={initialTranslations}
            defLang={config.project.defLang}
            fetchTranslations={fetchTranslations}
            locale={effectiveLocale}
            onLocaleChange={handleLocaleChange}
        />
    );
};

export { LanguageSwitcher };
