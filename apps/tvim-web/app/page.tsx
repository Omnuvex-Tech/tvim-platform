import type { FooterMenusData, Language, ProjectSettingsData, ProjectSettingsResponseData, Translation } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { LanguageSwitcher } from "./components/LanguageSwitcher/language-switcher";
import { CategoryStrip } from "./components/CategoryStrip/category-strip";
import { RequestForm } from "./components/RequestForm/request-form";
import { Navbar } from "@repo/ui";
import { Footer } from "./components/Footer/footer";
import { BenefitsStrip } from "./components/BenefitsStrip/benefits-strip";

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
    const footerMenuResponse = await api.get<FooterMenusData>(config.endpoints.menus.list, {
        params: {
            in_footer: "1",
        },
        locale: siteDefaultLocale,
    });
    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        locale: siteDefaultLocale,
    });
    const footerMenus = footerMenuResponse.success && footerMenuResponse.data
        ? footerMenuResponse.data.footer
        : [];
    let projectSettings: ProjectSettingsData | undefined;

    if (settingsResponse.success && settingsResponse.data) {
        projectSettings = settingsResponse.data.data;
    }

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-6 pt-0 pb-8">
            <Navbar />
            <LanguageSwitcher
                languages={langResponse.data}
                initialTranslations={translationResponse.data ?? []}
            />
            <CategoryStrip />
            <BenefitsStrip />
            <RequestForm />
            <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
        </div>
    );
}
