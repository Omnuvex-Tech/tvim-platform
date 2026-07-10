import { notFound } from "next/navigation";
import {
    generateServiceMetadata,
    renderServiceSlugPage,
} from "@/app/services/[slug]/page";
import { getStaticServiceSlugParams } from "@/lib/static-paths";
import { isSupportedLocale } from "@/lib/site-locales";

type ServiceLocaleRouteParams = {
    locale: string;
    slug: string;
};

export const revalidate = 31_536_000;
export const dynamicParams = true;

export async function generateStaticParams() {
    return await getStaticServiceSlugParams();
}

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
