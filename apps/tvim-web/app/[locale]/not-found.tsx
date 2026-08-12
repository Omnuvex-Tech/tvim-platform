import { config } from "@/config";
import { NotFoundRoute } from "@/app/components/NotFoundPage/not-found-route";
import { normalizeLocale } from "@/lib/site-locales";

export default async function LocaleNotFound({
    params,
}: {
    params?: Promise<{ locale: string }>;
}) {
    const resolvedParams = params ? await params : undefined;
    // normalizeLocale already falls back to the default language, so an
    // unknown prefix renders this page rather than recursing into notFound().
    const normalizedLocale = normalizeLocale(resolvedParams?.locale || config.project.defLang);

    return <NotFoundRoute locale={normalizedLocale} />;
}
