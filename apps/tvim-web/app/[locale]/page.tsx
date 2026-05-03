import type { Language, Slider, Translation } from "@repo/types/types";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { config } from "@/config";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { HomeSlider } from "@/app/components/HomeSlider/home-slider";
import { SpecialDiscountsStrip } from "@/app/components/SpecialDiscountsStrip/special-discounts-strip";
import { config } from "@/config";
import { api } from "@/lib/api";

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

    const translationResponse = await api.get<Translation[]>(config.endpoints.translations.list, { locale });
    const sliderResponse = await api.get<Slider[]>(config.endpoints.sliders.list, { locale });

    type MainPageBlock = {
        id?: number;
        title?: string;
        source_type?: string | null;
        source_reference?: string | number | null;
        data?: any;
    };

    const mainPageResponse = await api.get<MainPageBlock[]>(config.endpoints.mainPage.list, { locale });

    const productBlocks = (mainPageResponse.success && mainPageResponse.data)
        ? (mainPageResponse.data as MainPageBlock[]).filter((b) => b?.source_type === "product_block")
        : [];

    const specialDiscountBlock = productBlocks.find((b) => String(b?.source_reference) === "1") ??
        productBlocks.find((b) => b?.data?.block?.only_discount_products) ??
        productBlocks.find((b) => typeof b?.title === "string" && b.title.toLowerCase().includes("discount"));

    const specialDiscountItems = specialDiscountBlock?.data?.items ?? [];

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-6 pt-0 pb-8">
            <NavbarWrapper 
                locale={locale}
                languages={langResponse.data}
            />
            <HomeSlider slides={sliderResponse.data ?? []} />
            <SpecialDiscountsStrip
                items={specialDiscountItems}
                only_discount_products={Boolean(specialDiscountBlock?.data?.block?.only_discount_products)}
                viewAllHref="/discounts"
                viewAllText="Bütün məhsullara bax"
            />
        </div>
    );
}
