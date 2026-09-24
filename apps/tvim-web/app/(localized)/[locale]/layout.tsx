import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteDocument, siteMetadata } from "@/app/components/SiteDocument/site-document";
import { normalizeLocale } from "@/lib/site-locales";

// The language is in the params here, so the fallback metadata every page
// inherits is written in the language of the page inheriting it.
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return siteMetadata(normalizeLocale(locale));
}

// Root layout for every localized url. The language prefix is right here in the
// params, so the document is prerendered per language and stays static.
export default async function LocalizedRootLayout({
    children,
    params,
}: Readonly<{
    children: ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    return <SiteDocument lang={normalizeLocale(locale)}>{children}</SiteDocument>;
}
