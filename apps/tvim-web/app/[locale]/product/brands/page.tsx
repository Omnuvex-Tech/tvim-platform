import { notFound } from "next/navigation";
import {
    generateProductBrandsMetadata,
    renderProductBrandsPage,
} from "@/app/product/brands/product-brands-page";
import { isSupportedLocale } from "@/lib/site-locales";

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

    if (!isSupportedLocale(normalizedLocale)) {
        notFound();
    }

    return renderProductBrandsPage({ locale: normalizedLocale, searchParams });
}

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams?: Promise<{ page?: string | string[] }>;
}) {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    if (!isSupportedLocale(normalizedLocale)) {
        return {};
    }

    return generateProductBrandsMetadata({
        locale: normalizedLocale,
        searchParams,
    });
}
