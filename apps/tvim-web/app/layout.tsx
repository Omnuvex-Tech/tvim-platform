import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { NotifyProvider, NotifyContainer } from "@repo/ui";
import { QueryProvider } from "@/app/providers";
import { config } from "@/config";
import "./globals.css";

const inter = localFont({
    src: [
        {
            path: "./fonts/Inter-VariableFont_opsz,wght.ttf",
            style: "normal",
        },
        {
            path: "./fonts/Inter-Italic-VariableFont_opsz,wght.ttf",
            style: "italic",
        },
    ],
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
        <html lang="az">
            <head>
                <script
                    // Remove attributes injected by browser extensions (e.g. fdprocessedid)
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{['fdprocessedid','data-fdprocessedid'].forEach(function(attr){var els=document.querySelectorAll('['+attr+']');for(var i=0;i<els.length;i++){els[i].removeAttribute(attr);}});}catch(e){} })();`,
                    }}
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
            </head>
            <body className={inter.variable}>
                <QueryProvider>
                    <NotifyProvider>
                        <main className="mx-auto w-full max-w-[1328px] px-4 sm:px-6 lg:px-8">{children}</main>
                        <NotifyContainer />
                    </NotifyProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
