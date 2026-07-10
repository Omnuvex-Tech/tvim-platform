import { notFound } from "next/navigation";
import {
    generateBrandNewsMetadata,
    renderBrandNewsSlugPage,
} from "@/app/brands/news/[slug]/page";
import { getStaticBrandNewsSlugParams } from "@/lib/static-paths";
import { isSupportedLocale } from "@/lib/site-locales";

type BrandNewsLocaleRouteParams = {
    locale: string;
    slug: string;
};

export const revalidate = 31_536_000;
export const dynamicParams = true;

export async function generateStaticParams() {
    return await getStaticBrandNewsSlugParams();
}

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

    return renderBrandNewsSlugPage({
        slug,
        locale: normalizedLocale,
    });
}

export async function generateMetadata({
    params,
}: {
    params: Promise<BrandNewsLocaleRouteParams>;
}) {
    const { locale, slug } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    if (!isSupportedLocale(normalizedLocale)) {
        return {};
    }

    return generateBrandNewsMetadata({
        slug,
        locale: normalizedLocale,
    });
}
