import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/config";
import { normalizeLocale } from "@/lib/site-locales";

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
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);
    redirect(`/${locale}/brands/${encodeURIComponent(slug)}`);
}
