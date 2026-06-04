import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

export default async function OrdersDetailRedirectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value?.trim().toLowerCase() ?? "";
    const locale = SUPPORTED_LOCALES.includes(cookieLocale as (typeof SUPPORTED_LOCALES)[number]) ? cookieLocale : "az";

    redirect(`/${locale}/account/orders/${encodeURIComponent(id)}`);
}
