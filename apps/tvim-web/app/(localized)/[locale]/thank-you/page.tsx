import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { api } from "@/lib/api";
import { config } from "@/config";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getSiteChromeData } from "@/lib/site-chrome";
import { SUPPORTED_LOCALES, type SiteLocale } from "@/lib/site-locales";
import { ThankYouWrapper } from "@/app/components/ThankYou/ThankYouWrapper";
import { paymentResultPath, readPaymentReturn } from "@/lib/payments/result";
import { toSearchParams, type RouteSearchParams } from "@/lib/search-params";

export const metadata: Metadata = buildNoIndexMetadata();

// A gateway can send a paying shopper here, so nothing about this page may
// be served from a cache built for someone else's payment.
export const dynamic = "force-dynamic";

const normalizeLocale = (value: string): SiteLocale => {
  const lower = value.trim().toLowerCase();
  return SUPPORTED_LOCALES.includes(lower as SiteLocale) ? (lower as SiteLocale) : "az";
};

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const { locale: routeLocale } = await params;
  const locale = normalizeLocale(routeLocale);

  // The gateway's stored return url can point at this screen rather than at
  // /payments/callback. A payment says so in its query string, and belongs on
  // the screen for its outcome; a submitted form arrives with a bare path.
  const outcome = readPaymentReturn(toSearchParams(await searchParams));
  if (outcome) {
    redirect(paymentResultPath(outcome, locale));
  }

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