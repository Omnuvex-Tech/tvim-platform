import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteDocument, siteMetadata } from "@/app/components/SiteDocument/site-document";
import { resolveRootLocale } from "@/lib/root-locale";

// The unprefixed tree is redirects and the root page, which publishes its
// own metadata; the site default is all this fallback needs to be.
export const metadata: Metadata = siteMetadata();

// Root layout for the urls that carry no language prefix: tvim.az/ itself and
// the redirect stubs that send /checkout, /signin, ... to their localized
// address. These already resolve their language from the visitor's cookie, so
// the document follows the same resolution rather than a hardcoded one.
export default async function MainRootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const { locale } = await resolveRootLocale();

    return <SiteDocument lang={locale}>{children}</SiteDocument>;
}
