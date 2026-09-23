import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getSiteChromeData } from "@/lib/site-chrome";
import { isSupportedLocale, normalizeLocale } from "@/lib/site-locales";
import { PaymentSuccessView } from "@/app/components/PaymentSuccess/payment-success-view";

export const metadata: Metadata = buildNoIndexMetadata();

// The gateway sends the shopper straight here, so nothing about this page may
// be served from a cache built for someone else's payment.
export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;

  if (!isSupportedLocale(routeLocale.trim().toLowerCase())) {
    notFound();
  }

  const locale = normalizeLocale(routeLocale);
  const chrome = await getSiteChromeData(locale);

  return (
    <SitePageShell chrome={chrome}>
      <PaymentSuccessView locale={locale} />
    </SitePageShell>
  );
}
