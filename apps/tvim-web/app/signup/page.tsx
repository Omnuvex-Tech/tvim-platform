import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/config";
import { normalizeLocale } from "@/lib/site-locales";

export default async function SignUpPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);
  redirect(`/${locale}/signup`);
}
