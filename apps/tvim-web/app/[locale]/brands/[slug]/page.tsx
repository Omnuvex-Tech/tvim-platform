import { notFound } from "next/navigation";
import {
    generateBrandSlugMetadata,
    renderBrandSlugPage,
} from "@/app/brands/brand-slug-page";
import { getStaticBrandSlugParams } from "@/lib/static-paths";
import { isSupportedLocale } from "@/lib/site-locales";

type BrandLocalePageSearchParams = {
    page?: string | string[];
    per_page?: string | string[];
    sort?: string | string[];
};

export const revalidate = 31_536_000;

export async function generateStaticParams() {
    return await getStaticBrandSlugParams();
}

export default async function BrandLocaleSlugPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; slug: string }>;
    searchParams?: Promise<BrandLocalePageSearchParams>;
}) {
    const { locale, slug } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    if (!isSupportedLocale(normalizedLocale)) {
        notFound();
    }

    return renderBrandSlugPage({
        slug,
        locale: normalizedLocale,
        searchParams,
    });
}

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; slug: string }>;
    searchParams?: Promise<BrandLocalePageSearchParams>;
}) {
    const { locale, slug } = await params;

    if (!isSupportedLocale(locale.trim().toLowerCase())) {
        return {};
    }

    return generateBrandSlugMetadata({
        slug,
        locale,
        searchParams,
    });
}
