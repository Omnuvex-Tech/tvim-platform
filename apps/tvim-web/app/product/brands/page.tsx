import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/config";
import { normalizeLocale } from "@/lib/site-locales";

export const revalidate = 31_536_000;

export default async function ProductBrandsPage({
}: {
    searchParams?: Promise<{ page?: string | string[] }>;
}) {
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);
    redirect(`/${locale}/product/brands`);
}
