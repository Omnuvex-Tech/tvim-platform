import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { ResetPasswordForm } from "./reset-password-form";
import { getSiteChromeData } from "@/lib/site-chrome";

export const metadata = buildNoIndexMetadata();

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; code?: string }>;
}) {
  const { locale } = await params;
  const normalizedLocale = (["az", "ru", "en"].includes(locale.toLowerCase())
    ? locale.toLowerCase()
    : "az") as "az" | "ru" | "en";

  const query = await searchParams;
  const email = typeof query.email === "string" ? query.email.trim() : "";
  const code = typeof query.code === "string" ? query.code.trim() : "";

  if (!email || !code) {
    redirect(`/${normalizedLocale}/forgot-password`);
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

  const chrome = await getSiteChromeData(normalizedLocale);

  return (
    <SitePageShell chrome={chrome}>
      <Breadcrumb
        items={[
          { label: homePageMeta.name, href: homePageMeta.url },
          { label: "Şifrəni unutmusunuz?", href: `/${normalizedLocale}/forgot-password` },
          { label: "Yeni şifrə", isCurrent: true },
        ]}
        showTitle
        pageTitle="Yeni şifrə təyin edin"
        titleClassName="mt-0 mb-0 text-[48px] sm:text-[52px]"
      />

      <section className="w-full rounded-[20px] bg-white px-4 pt-1 pb-8 sm:px-8 sm:pt-2 sm:pb-10 lg:px-12">
        <div className="mx-auto w-full max-w-[640px]">
          <p className="mx-auto mb-6 max-w-[560px] text-center text-[15px] leading-[1.4] text-[#6f7786]">
            OTP kodu təsdiqləndi. Davam etmək üçün yeni şifrənizi daxil edin.
          </p>

          <ResetPasswordForm locale={normalizedLocale} email={email} code={code} />
        </div>
      </section>
    </SitePageShell>
  );
}
