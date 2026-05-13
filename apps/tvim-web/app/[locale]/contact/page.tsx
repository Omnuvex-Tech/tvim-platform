import { redirect } from "next/navigation";

export default async function ContactAliasPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const normalizedLocale = locale.trim().toLowerCase();

    redirect(`/${normalizedLocale}/elaqe`);
}
