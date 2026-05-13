import type {
    HeaderCategoriesResponseData,
    HeaderCategoryItem,
    HeaderMenuItem,
    HeaderMenuResponseData,
} from "@repo/types/types";

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const toTruthyString = (value: unknown) => String(value ?? "").trim();

export const extractHeaderItems = (rawHeaderData: HeaderMenuResponseData | unknown): HeaderMenuItem[] => {
    if (Array.isArray(rawHeaderData)) return rawHeaderData;
    if (!isObjectRecord(rawHeaderData)) return [];

    if (Array.isArray(rawHeaderData.header)) return rawHeaderData.header;
    if (Array.isArray(rawHeaderData.menus)) return rawHeaderData.menus;
    if (Array.isArray(rawHeaderData.items)) return rawHeaderData.items;
    if (Array.isArray(rawHeaderData.data)) return rawHeaderData.data;
    if (Array.isArray(rawHeaderData.footer)) return rawHeaderData.footer;

    return [];
};

export const extractHeaderCategories = (
    rawCategoriesData: HeaderCategoriesResponseData | unknown
): HeaderCategoryItem[] => {
    if (Array.isArray(rawCategoriesData)) return rawCategoriesData;
    if (!isObjectRecord(rawCategoriesData)) return [];

    if (Array.isArray(rawCategoriesData.data)) return rawCategoriesData.data;
    if (Array.isArray(rawCategoriesData.items)) return rawCategoriesData.items;

    const firstArray = Object.values(rawCategoriesData).find(Array.isArray);
    return Array.isArray(firstArray) ? (firstArray as HeaderCategoryItem[]) : [];
};

export const isTopLevelHeaderItem = (item: HeaderMenuItem): boolean => {
    if (!item.parent_id) return true;
    return Number(item.parent_id) === 0;
};

export const isCategoriesMenuType = (item: HeaderMenuItem): boolean =>
    toTruthyString(item.type).toLowerCase() === "categories";

export const isHeaderEnabledItem = (item: HeaderCategoryItem): boolean => {
    const value = item.in_header;
    return value === true || value === 1 || value === "1" || value === "true";
};

export const resolveHeaderMenuHref = (item: HeaderMenuItem, locale: string): string => {
    const normalizedLocale = locale.trim().toLowerCase();
    const multiLinks = item.multi_links;
    const localizedLink = isObjectRecord(multiLinks) ? multiLinks[normalizedLocale] : undefined;
    const hrefPart = toTruthyString(localizedLink ?? item.link);

    return hrefPart ? `/${normalizedLocale}/${hrefPart.replace(/^\/+/, "")}` : "#";
};

export const resolveHeaderMenuLabel = (item: HeaderMenuItem): string =>
    toTruthyString(item.name ?? item.title ?? item.link);
