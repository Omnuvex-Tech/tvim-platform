import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/site-locales";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ProductBrandsPage({
}: {
    searchParams?: Promise<{ page?: string | string[] }>;
}) {
    redirect(`/${defaultLocale}/product/brands`);
}
