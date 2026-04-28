import type { Language } from "../Language/language";
import type { Translation } from "../Translation/translation";

export type LanguageSwitcherProps = {
    languages: Language[];
    defLang?: string;
    initialTranslations?: Translation[];
    fetchTranslations?: (locale: string) => Promise<Translation[]>;
};
