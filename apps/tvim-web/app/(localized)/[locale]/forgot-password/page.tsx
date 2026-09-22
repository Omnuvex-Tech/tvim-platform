import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { ForgotPasswordForm } from "./forgot-password-form";
import { getSiteChromeData } from "@/lib/site-chrome";

export const metadata = buildNoIndexMetadata();
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";

export default async function ForgotPasswordPage({
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

  const hasLocale = langResponse.data.some(
    (language) => language.code.toLowerCase() === normalizedLocale
  );

  if (!hasLocale) {
    notFound();
  }

  const homePageMeta = config.pages.home[normalizedLocale];
  const forgotPasswordPageMeta = config.pages.forgotPassword[normalizedLocale];

  const chrome = await getSiteChromeData(normalizedLocale);

  return (
    <SitePageShell chrome={chrome}>
      <Breadcrumb
        items={[
          { label: homePageMeta.name, href: homePageMeta.url },
          { label: forgotPasswordPageMeta.name, isCurrent: true },
        ]}
        showTitle
        pageTitle={forgotPasswordPageMeta.title}
        titleClassName="mt-0 mb-0 text-[48px] sm:text-[52px]"
      />

      <section className="w-full rounded-[20px] bg-white px-4 pt-1 pb-8 sm:px-8 sm:pt-2 sm:pb-10 lg:px-12">
        <div className="mx-auto w-full max-w-[640px]">
          <p className="mx-auto mb-8 max-w-[560px] text-center text-[15px] leading-[1.4] text-[#6f7786]">
            E-mail ünvanınızı daxil edin, əgər hesab mövcuddursa sizə OTP kodu göndəriləcək.
          </p>

          <ForgotPasswordForm locale={normalizedLocale} />
        </div>
      </section>
    </SitePageShell>
  );
}
