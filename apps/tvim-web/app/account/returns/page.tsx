import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/config";

export default async function AccountReturnsRedirectPage() {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("preferred-locale")?.value?.trim().toLowerCase() ?? "";
    const locale = ["az", "ru", "en"].includes(cookieLocale) ? cookieLocale : config.project.defLang;

    redirect(`/${locale}/account/returns`);
}
