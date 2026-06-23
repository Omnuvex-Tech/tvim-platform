import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/site-locales";

export const revalidate = 31_536_000;

export default async function ProductBrandsPage({
}: {
    searchParams?: Promise<{ page?: string | string[] }>;
}) {
    redirect(`/${defaultLocale}/product/brands`);
}
