import { notFound, permanentRedirect } from "next/navigation";
import { resolveBrandNewsHostLink } from "@/app/(main)/brands/news/[slug]/page";
import { isSupportedLocale } from "@/lib/site-locales";

type BrandNewsLocaleRouteParams = {
    locale: string;
    slug: string;
};

/**
 * /{locale}/brands/news/{slug} is retired. Brand news articles are served from
 * their parent menu's own link, like every other menu-driven page, so this path
 * only forwards the traffic that is already indexed against it.
 */
export default async function LocalizedBrandNewsSlugPage({
    params,
}: {
    params: Promise<BrandNewsLocaleRouteParams>;
}) {
    const { locale, slug } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    if (!isSupportedLocale(normalizedLocale)) {
        notFound();
    }

    const menuLink = await resolveBrandNewsHostLink(normalizedLocale);

    if (!menuLink) {
        notFound();
    }

    permanentRedirect(`/${normalizedLocale}/${menuLink}/${encodeURIComponent(slug)}`);
}
