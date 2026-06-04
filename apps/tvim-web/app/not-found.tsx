import { cookies } from "next/headers";
import { config } from "@/config";
import { NotFoundRoute } from "@/app/components/NotFoundPage/not-found-route";

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
};

export default async function NotFound() {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value ?? "";
    const locale = normalizeLocale(cookieLocale || config.project.defLang);

    return <NotFoundRoute locale={locale} />;
}
