import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import Script from "next/script";
import { NotifyProvider, NotifyContainer } from "@repo/ui";
import { QueryProvider } from "@/app/providers";
import { DevelopmentPerformance } from "@/app/components/DevelopmentPerformance/development-performance";
import { MobileBottomTabs } from "@/app/components/MobileBottomTabs/mobile-bottom-tabs";
import { NavigationProgress } from "@/app/components/NavigationProgress/navigation-progress";
import { LocalizedLinksProvider } from "@/app/components/SiteChrome/localized-links";
import { config } from "@/config";
import "./globals.css";

// Served as subsetted woff2 per unicode-range rather than the two raw variable
// TTFs this used to ship (1.7MB on the wire, of which the italic face was never
// referenced anywhere in the app). Subsets match the Roboto declaration the
// blog uses, so Azerbaijani (ə) and Russian both stay covered.
const inter = Inter({
    subsets: ["latin", "latin-ext", "cyrillic"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: config.project.projectName,
    description: config.project.projectDescription,
    keywords: [...config.project.keywords],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="az" suppressHydrationWarning>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
                <Script id="gtm" strategy="afterInteractive">
                    {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','GTM-NRZ44CBC');`}
                </Script>
            </head>
            <body className={inter.variable} suppressHydrationWarning>
                <noscript>
                    <iframe
                        src="https://www.googletagmanager.com/ns.html?id=GTM-NRZ44CBC"
                        height="0"
                        width="0"
                        style={{ display: "none", visibility: "hidden" }}
                    />
                </noscript>
                <NavigationProgress />
                <QueryProvider>
                    <NotifyProvider>
                        <LocalizedLinksProvider>
                            <main className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8">{children}</main>
                        </LocalizedLinksProvider>
                        <MobileBottomTabs />
                        <NotifyContainer />
                        <DevelopmentPerformance />
                    </NotifyProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
