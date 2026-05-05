import { Fragment } from "react";
import { CompanyCarousel, type Company } from "@repo/ui";
import { toHref } from "@repo/shared/utils";
import type { Slider } from "@repo/types/types";
import mitreapelLogo from "@/public/images/mitreapel-logo.jpg";
import { HomeSlider } from "@/app/components/HomeSlider/home-slider";
import { CategoryStrip, type CategoryStripItem } from "@/app/components/CategoryStrip/category-strip";
import { BenefitsStrip } from "@/app/components/BenefitsStrip/benefits-strip";
import { ProductStrip } from "@/app/components/ProductStrip/product-strip";
import { RequestForm } from "@/app/components/RequestForm/request-form";

export type MainPageBlock = {
    id?: number;
    title?: string;
    source_type?: string | null;
    source_reference?: string | number | null;
    sort_order?: number;
    data?: {
        items?: unknown[];
        block?: {
            only_discount_products?: boolean;
            product_scope?: string;
            only_new_products?: boolean;
        };
        menu?: {
            type?: string;
            name?: string;
            title?: string;
        };
        data?: {
            mode?: string;
            fields?: MainPageFormFieldRaw[];
            submit?: MainPageFormSubmitRaw;
        };
    } | null;
};

type MainPageBlocksProps = {
    blocks?: MainPageBlock[];
};

type RequestFormPlaceholders = {
    name?: string;
    phone?: string;
    file?: string;
    description?: string;
};

type MainPageCategoryRawItem = {
    menu?: {
        name?: string;
        link?: string;
        icon?: {
            text?: string | null;
            image_url?: string | null;
        };
        main_image?: {
            url?: string | null;
        };
    };
};

type MainPageBrandRawItem = {
    value_id?: string | number;
    id?: string | number;
    name?: string;
    title?: string;
    image?: string;
    image_url?: string;
    logo?: string;
    url?: string;
    link?: string;
    website?: string;
};

type MainPageFormFieldRaw = {
    type?: string;
    name?: string;
    is_required?: boolean;
};

type MainPageFormSubmitRaw = {
    method?: string;
    path?: string;
};

type SliderRawItem = {
    id?: number | string;
    image?: string;
    mobile_image?: string | null;
    title?: string | null;
    description?: string | null;
    button_text?: string | null;
    button_link?: string | null;
    action_type?: string | null;
    hide_text_mobile?: boolean;
    sort_order?: number | string;
    is_active?: boolean;
};

const fallbackCompanies: Company[] = [
    { id: "1", name: "Mitreapel", logo: mitreapelLogo },
    { id: "2", name: "Mitreapel", logo: mitreapelLogo },
    { id: "3", name: "Mitreapel", logo: mitreapelLogo },
    { id: "4", name: "Mitreapel", logo: mitreapelLogo },
    { id: "5", name: "Mitreapel", logo: mitreapelLogo },
    { id: "6", name: "Mitreapel", logo: mitreapelLogo },
    { id: "7", name: "Mitreapel", logo: mitreapelLogo },
    { id: "8", name: "Mitreapel", logo: mitreapelLogo },
];

function normalizeBlocks(blocks?: MainPageBlock[]) {
    if (!Array.isArray(blocks)) {
        return [] as MainPageBlock[];
    }

    return [...blocks].sort((a, b) => {
        const aOrder = Number.isFinite(Number(a?.sort_order)) ? Number(a?.sort_order) : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isFinite(Number(b?.sort_order)) ? Number(b?.sort_order) : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
    });
}

function mapSliderItems(block: MainPageBlock): Slider[] {
    const rawItems = (Array.isArray(block?.data?.items) ? block.data.items : []) as SliderRawItem[];

    return rawItems.map((item, idx: number) => ({
        id: Number(item?.id ?? idx),
        image: String(item?.image ?? ""),
        mobile_image: item?.mobile_image ?? null,
        title: item?.title ?? null,
        description: item?.description ?? null,
        button_text: item?.button_text ?? null,
        button_link: item?.button_link ?? null,
        action_type: item?.action_type ?? null,
        hide_text_mobile: Boolean(item?.hide_text_mobile),
        sort_order: Number(item?.sort_order ?? idx),
        is_active: item?.is_active === undefined ? true : Boolean(item?.is_active),
    }));
}

function mapCategoryItems(block: MainPageBlock): CategoryStripItem[] {
    const rawItems = (Array.isArray(block?.data?.items) ? block.data.items : []) as MainPageCategoryRawItem[];

    return rawItems
        .map((item) => {
            const label = String(item?.menu?.name ?? "").trim();
            const link = String(item?.menu?.link ?? "").trim();

            if (!label || !link) {
                return null;
            }

            return {
                label,
                href: toHref(link),
                iconClass: item?.menu?.icon?.text ?? undefined,
                iconImageUrl: item?.menu?.icon?.image_url ?? undefined,
                backgroundImageUrl: item?.menu?.main_image?.url ?? item?.menu?.icon?.image_url ?? undefined,
            } satisfies CategoryStripItem;
        })
        .filter(Boolean) as CategoryStripItem[];
}

function mapPartnerCompanies(block: MainPageBlock) {
    const rawItems = (Array.isArray(block?.data?.items) ? block.data.items : []) as MainPageBrandRawItem[];

    const mapped = rawItems
        .map((it, idx: number): Company => ({
            id: String(it?.value_id ?? it?.id ?? `company-${idx}`),
            name: it?.name ?? it?.title ?? "",
            logo: it?.image ?? it?.image_url ?? it?.logo ?? mitreapelLogo,
            url: (it?.url ?? it?.link ?? it?.website ?? "").toString().trim() || undefined,
        }))
        .filter((company) => Boolean(company.name))
        .slice(0, 20);

    return mapped.length > 0 ? mapped : fallbackCompanies;
}

function resolveProductVariant(block: MainPageBlock): "special" | "selected" | "latest" | null {
    const sourceReference = String(block?.source_reference ?? "").trim();

    if (sourceReference === "1") return "special";
    if (sourceReference === "2") return "selected";
    if (sourceReference === "3") return "latest";

    if (block?.data?.block?.only_discount_products) return "special";
    if (block?.data?.block?.product_scope === "selected") return "selected";
    if (block?.data?.block?.only_new_products) return "latest";

    const title = String(block?.title ?? "").toLowerCase();
    if (title.includes("endirim") || title.includes("discount")) return "special";
    if (title.includes("secdik") || title.includes("selected") || title.includes("special for you")) return "selected";
    if (title.includes("son") || title.includes("latest") || title.includes("new")) return "latest";

    return null;
}

function mapFormPlaceholders(block: MainPageBlock): RequestFormPlaceholders {
    const fields = Array.isArray(block?.data?.data?.fields) ? block.data.data.fields : [];

    const byType = (type: string) => fields.find((field) => String(field?.type ?? "").toLowerCase() === type);

    const textBoxField = byType("textbox");
    const phoneField = byType("phone_number");
    const fileField = byType("file");
    const textAreaField = byType("textarea");

    const toPlaceholder = (field: MainPageFormFieldRaw | undefined, fallback: string) => {
        if (!field || !field.name) return fallback;
        const suffix = field.is_required ? " *" : "";
        return `${String(field.name).trim()}${suffix}`;
    };

    return {
        name: toPlaceholder(textBoxField, "Adınız *"),
        phone: toPlaceholder(phoneField, "Telefon *"),
        file: toPlaceholder(fileField, "Fayl seç"),
        description: toPlaceholder(textAreaField, "Layihəni təsvir edin... *"),
    };
}

function mapFormSubmitConfig(block: MainPageBlock) {
    const submit = block?.data?.data?.submit;
    const path = String(submit?.path ?? "").trim();

    if (!path) {
        return undefined;
    }

    return {
        method: String(submit?.method ?? "POST").toUpperCase(),
        path,
    };
}

function isFormBlock(block: MainPageBlock) {
    if (block?.source_type !== "menu_type") {
        return false;
    }

    const menuType = String(block?.data?.menu?.type ?? "").toLowerCase();
    const dataMode = String(block?.data?.data?.mode ?? "").toLowerCase();

    return menuType === "form" || dataMode === "form";
}

export function MainPageBlocks({ blocks = [] }: MainPageBlocksProps) {
    const sortedBlocks = normalizeBlocks(blocks);

    if (sortedBlocks.length === 0) {
        return null;
    }

    return (
        <>
            {sortedBlocks.map((block, idx) => {
                const key = `${String(block?.id ?? `main-block-${idx}`)}-${String(block?.source_type ?? "unknown")}`;

                if (block?.source_type === "slider") {
                    return (
                        <Fragment key={key}>
                            <HomeSlider slides={mapSliderItems(block)} />
                        </Fragment>
                    );
                }

                if (block?.source_type === "show_on_main_page_categories") {
                    return (
                        <Fragment key={key}>
                            <CategoryStrip items={mapCategoryItems(block)} />
                        </Fragment>
                    );
                }

                if (block?.source_type === "show_on_main_page_services") {
                    return (
                        <Fragment key={key}>
                            <BenefitsStrip items={Array.isArray(block?.data?.items) ? block.data.items : undefined} />
                        </Fragment>
                    );
                }

                if (block?.source_type === "product_block") {
                    const variant = resolveProductVariant(block);

                    if (!variant) {
                        return null;
                    }

                    return (
                        <Fragment key={key}>
                            <ProductStrip
                                variant={variant}
                                title={block?.title}
                                items={Array.isArray(block?.data?.items) ? block.data.items : []}
                                only_discount_products={Boolean(block?.data?.block?.only_discount_products)}
                                viewAllHref="/discounts"
                                viewAllText="Bütün məhsullara bax"
                            />
                        </Fragment>
                    );
                }

                if (block?.source_type === "brand") {
                    return (
                        <Fragment key={key}>
                            <CompanyCarousel companies={mapPartnerCompanies(block)} />
                        </Fragment>
                    );
                }

                if (isFormBlock(block)) {
                    const heading = String(block?.data?.menu?.name ?? "").trim() || undefined;
                    const subheading = String(block?.data?.menu?.title ?? "").trim() || undefined;

                    return (
                        <Fragment key={key}>
                            <RequestForm
                                heading={heading}
                                subheading={subheading}
                                placeholders={mapFormPlaceholders(block)}
                                submitConfig={mapFormSubmitConfig(block)}
                            />
                        </Fragment>
                    );
                }

                return null;
            })}
        </>
    );
}
