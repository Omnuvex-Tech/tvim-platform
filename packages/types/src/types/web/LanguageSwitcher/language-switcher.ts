import type { Language } from "../Language/language";
import type { Translation } from "../Translation/translation";

export type LanguageSwitcherProps = {
    languages: Language[];
    initialTranslations: Translation[];
    defLang: string;
    fetchTranslations: (locale: string) => Promise<Translation[]>;
};
