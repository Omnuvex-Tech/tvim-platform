import { NotFoundPage } from "@/app/components/NotFoundPage/not-found-page";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getSiteChromeData } from "@/lib/site-chrome";

type NotFoundRouteProps = {
    locale: string;
};

export async function NotFoundRoute({ locale }: NotFoundRouteProps) {
    const normalizedLocale = locale.trim().toLowerCase();
    const chrome = await getSiteChromeData(normalizedLocale);

    return (
        <SitePageShell chrome={chrome} contentClassName="gap-6">
            <div className="flex-1 flex w-full items-center justify-center">
                <NotFoundPage locale={normalizedLocale} />
            </div>
        </SitePageShell>
    );
}
