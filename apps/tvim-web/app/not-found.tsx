import { cookies } from "next/headers";
import { NotFoundRoute } from "@/app/components/NotFoundPage/not-found-route";
import { normalizeLocale } from "@/lib/site-locales";

export default async function NotFound() {
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? "");

    return <NotFoundRoute locale={locale} />;
}
