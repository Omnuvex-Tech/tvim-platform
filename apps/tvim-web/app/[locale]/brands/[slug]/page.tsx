import { notFound } from "next/navigation";
import { renderBrandSlugPage } from "@/app/brands/brand-slug-page";

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

type BrandLocalePageSearchParams = {
    page?: string | string[];
    per_page?: string | string[];
    sort?: string | string[];
};

export default async function BrandLocaleSlugPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; slug: string }>;
    searchParams?: Promise<BrandLocalePageSearchParams>;
}) {
    const { locale, slug } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    if (!SUPPORTED_LOCALES.includes(normalizedLocale as (typeof SUPPORTED_LOCALES)[number])) {
        notFound();
    }

    return renderBrandSlugPage({
        slug,
        locale: normalizedLocale,
        searchParams,
    });
}
