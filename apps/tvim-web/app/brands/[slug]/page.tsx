import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/site-locales";

type BrandSlugPageSearchParams = {
    page?: string | string[];
    per_page?: string | string[];
    sort?: string | string[];
};

export default async function BrandSlugPage({
    params,
}: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<BrandSlugPageSearchParams>;
}) {
    const { slug } = await params;
    redirect(`/${defaultLocale}/brands/${encodeURIComponent(slug)}`);
}
