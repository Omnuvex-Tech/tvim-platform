import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import { buildNoIndexMetadata } from "@/lib/seo";
import { getTranslations } from "@/lib/i18n";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { RegisterForm } from "./register-form";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { getSiteChromeData } from "@/lib/site-chrome";

export const metadata = buildNoIndexMetadata();

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const normalizedLocale = (["az", "ru", "en"].includes(locale.toLowerCase())
    ? locale.toLowerCase()
    : "az") as "az" | "ru" | "en";

  const cookieStore = await cookies();
  const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
  const hasValidRouteLocale = ["az", "ru", "en"].includes(locale.toLowerCase());
  if (authToken && hasValidRouteLocale) {
    redirect(`/${normalizedLocale}`);
  }

  const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

  if (!langResponse.success || !langResponse.data) {
    return (
      <div className="flex min-h-svh items-center justify-center py-8">
        <p className="text-destructive">{langResponse.message}</p>
      </div>
    );
  }

  if (!langResponse.data.some((language) => language.code === locale)) {
    notFound();
  }

  const homePageMeta = config.pages.home[normalizedLocale];
  const signUpPageMeta = config.pages.signup[normalizedLocale];

  const chrome = await getSiteChromeData(locale);

  return (
    <SitePageShell chrome={chrome}>
      <Breadcrumb
        items={[
          { label: homePageMeta.name, href: homePageMeta.url },
          { label: signUpPageMeta.name, isCurrent: true },
        ]}
        showTitle
        pageTitle={signUpPageMeta.title}
      />

      <section className="w-full rounded-[20px] bg-white px-4 pt-1 pb-8 sm:px-8 sm:pt-2 sm:pb-10 lg:px-12">
        <div className="mx-auto w-full max-w-[640px]">
          <p className="mx-auto mt-0 max-w-[560px] text-center text-[15px] leading-[1.4] text-[#6f7786]">
            {getTranslations(normalizedLocale).register.intro}
          </p>

          <RegisterForm locale={locale} />
        </div>
      </section>
    </SitePageShell>
  );
}
