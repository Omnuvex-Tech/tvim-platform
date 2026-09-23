import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { getSiteChromeData } from "@/lib/site-chrome";
import { isSupportedLocale, normalizeLocale } from "@/lib/site-locales";
import { PaymentSuccessView } from "@/app/components/PaymentSuccess/payment-success-view";
import { isOnDeliveryOrder } from "@/lib/payments/result";
import { toSearchParams, type RouteSearchParams } from "@/lib/search-params";

export const metadata: Metadata = buildNoIndexMetadata();

// The gateway sends the shopper straight here, so nothing about this page may
// be served from a cache built for someone else's payment.
export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RouteSearchParams>;
}) {
  const { locale: routeLocale } = await params;

  if (!isSupportedLocale(routeLocale.trim().toLowerCase())) {
    notFound();
  }

  const locale = normalizeLocale(routeLocale);
  const [chrome, query] = await Promise.all([getSiteChromeData(locale), searchParams]);

  return (
    <SitePageShell chrome={chrome}>
      <PaymentSuccessView locale={locale} onDelivery={isOnDeliveryOrder(toSearchParams(query))} />
    </SitePageShell>
  );
}
