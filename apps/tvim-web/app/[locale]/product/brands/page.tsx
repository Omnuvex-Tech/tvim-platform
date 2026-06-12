import { notFound } from "next/navigation";
import { renderProductBrandsPage } from "@/app/product/brands/product-brands-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

export default async function LocalizedProductBrandsPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<{ page?: string | string[] }>;
}) {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    if (!SUPPORTED_LOCALES.includes(normalizedLocale as (typeof SUPPORTED_LOCALES)[number])) {
        notFound();
    }

    return renderProductBrandsPage({ locale: normalizedLocale, searchParams });
}
