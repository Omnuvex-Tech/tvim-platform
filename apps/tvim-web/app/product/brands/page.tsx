import { cookies } from "next/headers";
import { config } from "@/config";
import { renderProductBrandsPage } from "@/app/product/brands/product-brands-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

const normalizeLocale = (locale: string) => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as (typeof SUPPORTED_LOCALES)[number]) ? normalized : "az";
};

export default async function ProductBrandsPage({
    searchParams,
}: {
    searchParams?: Promise<{ page?: string | string[] }>;
}) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value ?? "";
    const locale = normalizeLocale(cookieLocale || config.project.defLang);

    return renderProductBrandsPage({ locale, searchParams });
}
