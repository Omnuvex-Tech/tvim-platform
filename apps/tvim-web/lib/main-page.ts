import { config } from "@/config";
import { api } from "@/lib/api";
import type { MainPageBlock } from "@/app/components/MainPageBlocks/main-page-blocks";

type MainPageProductItem = {
    id?: number | string;
    uuid?: string;
    name?: string;
    slug?: string;
    [key: string]: unknown;
};

const asTrimmedString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isPlaceholderName = (value: string) => /^#\d+$/.test(value);

function getProductItemKey(item: MainPageProductItem) {
    const id = asTrimmedString(item?.id);
    if (id) return `id:${id}`;

    const uuid = asTrimmedString(item?.uuid);
    if (uuid) return `uuid:${uuid}`;

    return "";
}

function mapFallbackItems(items: MainPageProductItem[]) {
    const mapped = new Map<string, MainPageProductItem>();

    items.forEach((item) => {
        const key = getProductItemKey(item);
        if (key) {
            mapped.set(key, item);
        }
    });

    return mapped;
}

function mergeLocalizedProductData(localized: MainPageBlock[], fallback: MainPageBlock[]) {
    if (!Array.isArray(localized) || localized.length === 0 || !Array.isArray(fallback) || fallback.length === 0) {
        return localized;
    }

    const fallbackProductBlocks = fallback.filter((block) => block?.source_type === "product_block");
    const fallbackById = new Map<string, MainPageBlock>();
    const fallbackByReference = new Map<string, MainPageBlock>();

    fallbackProductBlocks.forEach((block) => {
        const id = asTrimmedString(block?.id);
        if (id) fallbackById.set(id, block);

        const reference = asTrimmedString(block?.source_reference);
        if (reference) fallbackByReference.set(reference, block);
    });

    let productBlockIndex = 0;

    return localized.map((block) => {
        if (block?.source_type !== "product_block") {
            return block;
        }

        const byId = fallbackById.get(asTrimmedString(block?.id));
        const byReference = fallbackByReference.get(asTrimmedString(block?.source_reference));
        const byOrder = fallbackProductBlocks[productBlockIndex];
        productBlockIndex += 1;

        const fallbackBlock = byId ?? byReference ?? byOrder;
        if (!fallbackBlock) {
            return block;
        }

        const localizedItems = Array.isArray(block?.data?.items)
            ? (block.data.items as MainPageProductItem[])
            : [];
        const fallbackItems = Array.isArray(fallbackBlock?.data?.items)
            ? (fallbackBlock.data.items as MainPageProductItem[])
            : [];

        if (localizedItems.length === 0 || fallbackItems.length === 0) {
            return block;
        }

        const fallbackItemMap = mapFallbackItems(fallbackItems);

        const mergedItems = localizedItems.map((item) => {
            const key = getProductItemKey(item);
            if (!key) {
                return item;
            }

            const fallbackItem = fallbackItemMap.get(key);
            if (!fallbackItem) {
                return item;
            }

            const localizedName = asTrimmedString(item?.name);
            const localizedSlug = asTrimmedString(item?.slug);
            const fallbackName = asTrimmedString(fallbackItem?.name);
            const fallbackSlug = asTrimmedString(fallbackItem?.slug);

            const shouldReplaceName = (!localizedName || isPlaceholderName(localizedName)) && Boolean(fallbackName);
            const shouldReplaceSlug = !localizedSlug && Boolean(fallbackSlug);

            if (!shouldReplaceName && !shouldReplaceSlug) {
                return item;
            }

            return {
                ...item,
                ...(shouldReplaceName ? { name: fallbackName } : null),
                ...(shouldReplaceSlug ? { slug: fallbackSlug } : null),
            };
        });

        return {
            ...block,
            data: {
                ...block.data,
                items: mergedItems,
            },
        };
    });
}

export async function getMainPageBlocks(locale: string): Promise<MainPageBlock[]> {
    const [localizedResponse, fallbackResponse] = await Promise.all([
        api.get<MainPageBlock[]>(config.endpoints.mainPage.list, { locale }),
        api.get<MainPageBlock[]>(config.endpoints.mainPage.list),
    ]);

    const localizedBlocks =
        localizedResponse.success && Array.isArray(localizedResponse.data)
            ? (localizedResponse.data as MainPageBlock[])
            : [];

    if (localizedBlocks.length === 0) {
        return [];
    }

    const fallbackBlocks =
        fallbackResponse.success && Array.isArray(fallbackResponse.data)
            ? (fallbackResponse.data as MainPageBlock[])
            : [];

    if (fallbackBlocks.length === 0) {
        return localizedBlocks;
    }

    return mergeLocalizedProductData(localizedBlocks, fallbackBlocks);
}
