import { NotFoundRoute } from "@/app/components/NotFoundPage/not-found-route";
import { defaultLocale } from "@/lib/site-locales";

export default function NotFound() {
    return <NotFoundRoute locale={defaultLocale} />;
}
