import type { Language, Translation } from "@repo/types/types";
import { api } from "@/lib/api";
import { endpoints } from "@/config/endpoints";
import { project } from "@/config/project";
import { LanguageSwitcher } from "./components/language-switcher";

export default async function Home() {
    const [langResponse, translationResponse] = await Promise.all([
        api.get<Language[]>(endpoints.languages.list),
        api.get<Translation[]>(endpoints.translations.list, { locale: project.defLang }),
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
