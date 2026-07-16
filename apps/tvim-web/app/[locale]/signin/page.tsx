import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { buildNoIndexMetadata } from "@/lib/seo";
import { config } from "@/config";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { LoginForm } from "./login-form";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { getPublicLanguages } from "@/lib/public-data";
import { getSiteChromeData } from "@/lib/site-chrome";

export const metadata = buildNoIndexMetadata();

export default async function LoginPage({
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

  const homePageMeta = config.pages.home[normalizedLocale];
  const loginPageMeta = config.pages.signin[normalizedLocale];

  const languages = await getPublicLanguages();

  if (languages.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center py-8">
        <p className="text-destructive">Languages could not be loaded.</p>
      </div>
    );
  }

  if (!languages.some((language) => language.code === locale)) {
    notFound();
  }

  const chrome = await getSiteChromeData(locale);

  return (
    <SitePageShell chrome={chrome}>
      <Breadcrumb
        items={[
          { label: homePageMeta.name, href: homePageMeta.url },
          { label: loginPageMeta.name, isCurrent: true },
        ]}
        showTitle
        pageTitle={loginPageMeta.title}
        titleClassName="mb-1"
      />

      <section className="w-full rounded-[20px] bg-white px-4 pt-3 pb-8 sm:px-8 sm:pt-4 sm:pb-10 lg:px-12">
        <div className="mx-auto w-full max-w-[640px]">
          <LoginForm locale={locale} />
        </div>
      </section>
    </SitePageShell>
  );
}
