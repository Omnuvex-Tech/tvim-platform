import type { Language, Slider, Translation } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { LanguageSwitcher } from "./components/LanguageSwitcher/language-switcher";
import { HomeSlider } from "./components/HomeSlider/home-slider";
import { RequestForm } from "@repo/ui/components/RequestForm/request-form";

export default async function Home() {
    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    const siteDefaultLocale = langResponse.data.find((language) => language.is_default_site)?.code ?? config.project.defLang;
    const translationResponse = await api.get<Translation[]>(config.endpoints.translations.list, {
        locale: siteDefaultLocale,
    });
    const sliderResponse = await api.get<Slider[]>(config.endpoints.sliders.list, {
        locale: siteDefaultLocale,
    });

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 py-8">
            <HomeSlider slides={sliderResponse.data ?? []} />
            <LanguageSwitcher
                languages={langResponse.data}
                initialTranslations={translationResponse.data ?? []}
            />
            <RequestForm />
        </div>
    );
}
