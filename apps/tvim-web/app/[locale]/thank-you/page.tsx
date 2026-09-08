import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Language } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getSiteChromeData } from "@/lib/site-chrome";
import { SUPPORTED_LOCALES, type SiteLocale } from "@/lib/site-locales";
import { ThankYouWrapper } from "@/app/components/ThankYou/ThankYouWrapper";

export const metadata: Metadata = buildNoIndexMetadata();

const normalizeLocale = (value: string): SiteLocale => {
  const lower = value.trim().toLowerCase();
  return SUPPORTED_LOCALES.includes(lower as SiteLocale) ? (lower as SiteLocale) : "az";
};

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale = normalizeLocale(routeLocale);

  const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

  if (!langResponse.success || !langResponse.data) {
    return (
      <div className="flex min-h-svh items-center justify-center py-8">
        <p className="text-destructive">{langResponse.message}</p>
      </div>
    );
  }

  if (
    !SUPPORTED_LOCALES.includes(locale) ||
    !langResponse.data.some((language) => language.code.toLowerCase() === locale)
  ) {
    notFound();
  }

  const chrome = await getSiteChromeData(locale);

  return (
    <SitePageShell chrome={chrome}>
      <ThankYouWrapper locale={locale} />
    </SitePageShell>
  );
}