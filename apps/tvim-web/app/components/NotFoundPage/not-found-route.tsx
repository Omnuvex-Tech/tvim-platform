import { NotFoundPage } from "@/app/components/NotFoundPage/not-found-page";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getSiteChromeData } from "@/lib/site-chrome";

/**
 * The 404's own title. It used to inherit the site's home title ("Tvim |
 * Tikinti Materialları…"), so a missing page announced itself in the browser
 * tab and in link previews as the home page.
 */
const NOT_FOUND_TITLE: Record<string, string> = {
    az: "Səhifə tapılmadı | TVİM",
    en: "Page not found | TVIM",
    ru: "Страница не найдена | TVIM",
};

type NotFoundRouteProps = {
    locale: string;
};

export async function NotFoundRoute({ locale }: NotFoundRouteProps) {
    const normalizedLocale = locale.trim().toLowerCase();
    const chrome = await getSiteChromeData(normalizedLocale);

    return (
        <SitePageShell chrome={chrome} contentClassName="gap-6">
            <title>{NOT_FOUND_TITLE[normalizedLocale] ?? NOT_FOUND_TITLE.az}</title>
            <div className="flex-1 flex w-full items-center justify-center">
                <NotFoundPage locale={normalizedLocale} />
            </div>
        </SitePageShell>
    );
}
