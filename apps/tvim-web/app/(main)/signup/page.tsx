import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/config";
import { normalizeLocale } from "@/lib/site-locales";
import { localizedHref } from "@/lib/routes";

export default async function SignUpPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);
  redirect(localizedHref("signup", locale));
}
