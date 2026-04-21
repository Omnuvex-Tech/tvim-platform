import type { Language, Slider, Translation } from "@repo/types/types";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { config } from "@/config";
import { LanguageSwitcher } from "@/app/components/LanguageSwitcher/language-switcher";
import { HomeSlider } from "@/app/components/HomeSlider/home-slider";

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code === locale)) {
        notFound();
    }

    const translationResponse = await api.get<Translation[]>(config.endpoints.translations.list, { locale });
    const sliderResponse = await api.get<Slider[]>(config.endpoints.sliders.list, { locale });

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 py-8">
            <HomeSlider slides={sliderResponse.data ?? []} />
            <LanguageSwitcher
                languages={langResponse.data}
                initialTranslations={translationResponse.data ?? []}
                routeLocale={locale}
            />
        </div>
    );
}
