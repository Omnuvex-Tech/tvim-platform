import { notFound } from "next/navigation";
import {
    generateServiceMetadata,
    renderServiceSlugPage,
} from "@/app/services/[slug]/page";
import { isSupportedLocale } from "@/lib/site-locales";

type ServiceLocaleRouteParams = {
    locale: string;
    slug: string;
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const dynamicParams = true;

export default async function LocalizedServiceSlugPage({
    params,
}: {
    params: Promise<ServiceLocaleRouteParams>;
}) {
    const { locale, slug } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    if (!isSupportedLocale(normalizedLocale)) {
        notFound();
    }

    return renderServiceSlugPage({
        slug,
        locale: normalizedLocale,
    });
}

export async function generateMetadata({
    params,
}: {
    params: Promise<ServiceLocaleRouteParams>;
}) {
    const { locale, slug } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    if (!isSupportedLocale(normalizedLocale)) {
        return {};
    }

    return generateServiceMetadata({
        slug,
        locale: normalizedLocale,
    });
}
