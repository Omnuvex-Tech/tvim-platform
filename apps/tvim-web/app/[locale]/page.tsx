import type { Language } from "@repo/types/types";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { config } from "@/config";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { MainPageBlocks, type MainPageBlock } from "@/app/components/MainPageBlocks/main-page-blocks";

export default async function HomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

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

    const mainPageResponse = await api.get<MainPageBlock[]>(config.endpoints.mainPage.list, { locale });
    const mainPageBlocks =
        mainPageResponse.success && Array.isArray(mainPageResponse.data)
            ? (mainPageResponse.data as MainPageBlock[])
            : [];

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-6 pt-0 pb-8">
            <NavbarWrapper 
                locale={locale}
                languages={langResponse.data}
            />
            <MainPageBlocks blocks={mainPageBlocks} />
        </div>
    );
}
