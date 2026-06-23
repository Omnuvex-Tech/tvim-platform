import { notFound } from "next/navigation";
import { config } from "@/config";
import { NotFoundRoute } from "@/app/components/NotFoundPage/not-found-route";

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
};

export default async function LocaleNotFound({
    params,
}: {
    params?: Promise<{ locale: string }>;
}) {
    const resolvedParams = params ? await params : undefined;
    const normalizedLocale = normalizeLocale(
        resolvedParams?.locale || config.project.defLang
    );

    if (!SUPPORTED_LOCALES.includes(normalizedLocale as (typeof SUPPORTED_LOCALES)[number])) {
        notFound();
    }

    return <NotFoundRoute locale={normalizedLocale} />;
}
