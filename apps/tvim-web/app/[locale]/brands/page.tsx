import { notFound } from "next/navigation";
import {
    generateBrandsMetadata,
    renderBrandsPage,
} from "@/app/brands/brands-page";
import { getStaticLocaleCodes } from "@/lib/static-paths";
import { isSupportedLocale } from "@/lib/site-locales";

export const revalidate = 300;

export async function generateStaticParams() {
    const localeCodes = await getStaticLocaleCodes();
    return localeCodes.map((locale) => ({ locale }));
}

export default async function LocalizedBrandsPage({
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

    return renderBrandsPage({ locale: normalizedLocale, searchParams });
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

    return generateBrandsMetadata({
        locale: normalizedLocale,
        searchParams,
    });
}
