import type { Language, Translation } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { LanguageSwitcher } from "./components/LanguageSwitcher/language-switcher";

export default async function Home() {
    const [langResponse, translationResponse] = await Promise.all([
        api.get<Language[]>(config.endpoints.languages.list),
        api.get<Translation[]>(config.endpoints.translations.list, { locale: config.project.defLang }),
    ]);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center p-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
            <LanguageSwitcher
                languages={langResponse.data}
                initialTranslations={translationResponse.data ?? []}
            />
        </div>
    );
}
