import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Language } from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { SitePageShell } from "@/app/components/SiteChrome/site-page-shell";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { getSiteChromeData } from "@/lib/site-chrome";
import { AccountNavigation } from "../account-navigation";
import { EditProfileForm } from "./edit-profile-form";

type AuthUserResponse = {
    name?: string | null;
    surname?: string | null;
    email?: string | null;
    phone?: string | null;
};

export default async function AccountEditPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: routeLocale } = await params;
    const locale = routeLocale.trim().toLowerCase();
    const normalizedLocale = (["az", "ru", "en"].includes(locale) ? locale : "az") as "az" | "ru" | "en";
    const homePageMeta = config.pages.home[normalizedLocale];
    const accountPageMeta = config.pages.account[normalizedLocale];
    const accountEditPageMeta = config.pages.accountEdit[normalizedLocale];

    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    if (!authToken) {
        redirect(`/${locale}/signin`);
    }

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);
    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!langResponse.data.some((language) => language.code.toLowerCase() === locale)) {
        notFound();
    }

    const [chrome, userResponse] = await Promise.all([
        getSiteChromeData(locale),
        api.get<AuthUserResponse>(config.endpoints.auth.user ?? config.endpoints.auth.me, {
            locale,
            headers: { Authorization: `Bearer ${authToken}` },
            cache: "no-store",
        }),
    ]);

    const user = userResponse.success ? userResponse.data : null;
    const activeHref = "/account/edit";

    return (
        <SitePageShell chrome={chrome}>
            <Breadcrumb
                items={[
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: accountPageMeta.name, href: `/${locale}/account` },
                    { label: accountEditPageMeta.name, isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle={accountEditPageMeta.title}
                titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-1 pt-5 pb-12 lg:px-2 lg:pt-6 lg:pb-14">
                <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
                    <AccountNavigation locale={locale} activeHref={activeHref} />

                    <section className="w-full rounded-[20px] bg-white px-0 py-6 sm:px-7 sm:py-8">
                        <div className="w-full">
                            <EditProfileForm
                                locale={locale}
                                initialValues={{
                                    name: user?.name ?? "",
                                    surname: user?.surname ?? "",
                                    email: user?.email ?? "",
                                    phone: user?.phone ?? "",
                                }}
                            />
                        </div>
                    </section>
                </div>
            </section>

            <div className="mx-auto mt-14 mb-10 w-full max-w-[1280px] px-0 lg:mt-16 lg:mb-14">
                <RequestForm />
            </div>
        </SitePageShell>
    );
}
