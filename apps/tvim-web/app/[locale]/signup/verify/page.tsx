import { notFound } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import { buildNoIndexMetadata } from "@/lib/seo";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { VerificationForm } from "./verification-form";
import { getSiteChromeData } from "@/lib/site-chrome";

export const metadata = buildNoIndexMetadata();

export default async function RegisterVerificationPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ email?: string; flow?: string }>;
}) {
    const { locale } = await params;
    const normalizedLocale = (["az", "ru", "en"].includes(locale.toLowerCase())
        ? locale.toLowerCase()
        : "az") as "az" | "ru" | "en";
    const query = await searchParams;
    const email = typeof query.email === "string" ? query.email : "";
    const flow = query.flow === "forgot" ? "forgot" : "signup";
    const homePageMeta = config.pages.home[normalizedLocale];
    const verifyPageMeta = config.pages.signupVerify[normalizedLocale];

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code === locale)) {
        notFound();
    }

    const chrome = await getSiteChromeData(locale);

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: verifyPageMeta.name, isCurrent: true },
                ]}
            />

            <section className="w-full rounded-[20px] bg-white px-4 pt-3 pb-8 sm:px-8 sm:pt-4 sm:pb-10 lg:px-12">
                <div className="mx-auto w-full max-w-[560px]">
                    <h1 className="text-center text-[46px] leading-none font-bold tracking-[-0.02em] text-[#000000] sm:text-[52px]">{verifyPageMeta.title}</h1>
                    <p className="mx-auto mt-4 max-w-[520px] text-center text-[15px] leading-[1.4] text-[#6f7786]">
                        Qeydiyyatı tamamlamaq üçün sizə göndərilən 4 rəqəmli kodu daxil edin.
                    </p>

                    <VerificationForm locale={locale} email={email} flow={flow} />
                </div>
            </section>
        </SitePageShell>
    );
}
