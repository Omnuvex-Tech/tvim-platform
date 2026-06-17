import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/config";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { normalizeLocale } from "@/lib/site-locales";

export default async function AccountEditPage() {
    const cookieStore = await cookies();
    const locale = normalizeLocale(cookieStore.get("preferred-locale")?.value ?? config.project.defLang);
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);

    if (!authToken) {
        redirect(`/${locale}/signin`);
    }
    redirect(`/${locale}/account/edit`);
}
