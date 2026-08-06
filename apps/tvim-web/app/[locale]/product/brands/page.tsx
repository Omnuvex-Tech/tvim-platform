import { notFound } from "next/navigation";
import {
    generateProductBrandsMetadata,
    renderProductBrandsPage,
} from "@/app/product/brands/product-brands-page";
import { getStaticLocaleCodes } from "@/lib/static-paths";
import { isSupportedLocale } from "@/lib/site-locales";

export const revalidate = 300;

export async function generateStaticParams() {
    const localeCodes = await getStaticLocaleCodes();
    return localeCodes.map((locale) => ({ locale }));
}

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
