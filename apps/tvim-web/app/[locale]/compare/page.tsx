import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type {
    FooterMenusData,
    Language,
    ProjectSettingsData,
    ProjectSettingsResponseData,
} from "@repo/types/types";
import { Breadcrumb } from "@repo/ui";
import { api } from "@/lib/api";
import { config } from "@/config";
import { NavbarWrapper } from "@/app/components/Navbar/navbar-wrapper";
import { Footer } from "@/app/components/Footer/footer";
import { RequestForm } from "@/app/components/RequestForm/request-form";
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { COMPARE_GUEST_TOKEN_COOKIE, decodeCompareTokenFromCookie } from "@/lib/compare/session";
import { FAVORITES_GUEST_TOKEN_COOKIE, decodeGuestTokenFromCookie } from "@/lib/favorites/session";
import { CompareProductsGrid } from "./compare-products-grid";

type LocaleCode = "az" | "ru" | "en";

const SUPPORTED_LOCALES: LocaleCode[] = ["az", "ru", "en"];
const DISPLAY_LOCALE: LocaleCode = "az";

const COMPARE_PAGE_COPY: Record<LocaleCode, {
    homeLabel: string;
    pageTitle: string;
    pageName: string;
    productFallbackPrefix: string;
    boolYes: string;
    boolNo: string;
    specLabels: {
        model: string;
        brand: string;
        productCode: string;
        quantity: string;
        batteryVoltage: string;
        batteryCapacity: string;
        drillDiameter: string;
        dimensions: string;
        weight: string;
    };
    onlyDifferentLabel: string;
    emptyState: string;
    orderButton: string;
    noDifferentSpecs: string;
    removeCompareFailed: string;
    favoriteToggleFailed: string;
}> = {
    az: {
        homeLabel: "Ana səhifə",
        pageTitle: "Məhsul müqayisəsi",
        pageName: "Məhsul müqayisəsi",
        productFallbackPrefix: "Məhsul",
        boolYes: "Bəli",
        boolNo: "Xeyr",
        specLabels: {
            model: "Model",
            brand: "Brend",
            productCode: "Məhsul kodu",
            quantity: "Say",
            batteryVoltage: "Akkumulyator gərginliyi (V)",
            batteryCapacity: "Akkumulyator həcmi (Ah)",
            drillDiameter: "Qazma diametri",
            dimensions: "Ölçülər (U x E x H)",
            weight: "Çəki",
        },
        onlyDifferentLabel: "Yalnız fərqli göstərin",
        emptyState: "Müqayisə üçün hər hansı məhsul seçilməyib.",
        orderButton: "Sifariş et",
        noDifferentSpecs: "Məhsullar arasında fərqli xüsusiyyət tapılmadı.",
        removeCompareFailed: "Məhsul müqayisədən silinə bilmədi.",
        favoriteToggleFailed: "Seçilmişlər yenilənərkən xəta baş verdi.",
    },
    ru: {
        homeLabel: "Главная",
        pageTitle: "Сравнение товаров",
        pageName: "Сравнение товаров",
        productFallbackPrefix: "Товар",
        boolYes: "Да",
        boolNo: "Нет",
        specLabels: {
            model: "Модель",
            brand: "Бренд",
            productCode: "Код товара",
            quantity: "Количество",
            batteryVoltage: "Напряжение аккумулятора (В)",
            batteryCapacity: "Емкость аккумулятора (Ач)",
            drillDiameter: "Диаметр сверления",
            dimensions: "Размеры (Д x Ш x В)",
            weight: "Вес",
        },
        onlyDifferentLabel: "Показывать только отличия",
        emptyState: "Для сравнения не выбраны товары.",
        orderButton: "Заказать",
        noDifferentSpecs: "Отличий между товарами не найдено.",
        removeCompareFailed: "Не удалось удалить товар из сравнения.",
        favoriteToggleFailed: "Ошибка при обновлении избранного.",
    },
    en: {
        homeLabel: "Home",
        pageTitle: "Product Comparison",
        pageName: "Product Comparison",
        productFallbackPrefix: "Product",
        boolYes: "Yes",
        boolNo: "No",
        specLabels: {
            model: "Model",
            brand: "Brand",
            productCode: "Product Code",
            quantity: "Quantity",
            batteryVoltage: "Battery Voltage (V)",
            batteryCapacity: "Battery Capacity (Ah)",
            drillDiameter: "Drill Diameter",
            dimensions: "Dimensions (L x W x H)",
            weight: "Weight",
        },
        onlyDifferentLabel: "Show only differences",
        emptyState: "No products selected for comparison.",
        orderButton: "Order",
        noDifferentSpecs: "No differing specifications were found.",
        removeCompareFailed: "Could not remove product from comparison.",
        favoriteToggleFailed: "An error occurred while updating favorites.",
    },
};

const normalizeLocale = (value: string): LocaleCode => {
    const lower = value.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(lower as LocaleCode) ? (lower as LocaleCode) : "az";
};

export type CompareListItem = {
    id: number;
    name: string;
    price: number;
    old_price?: number;
    discount_percent?: number;
    slug?: string;
    main_image?: string;
    product_variation_id: number;
    is_favorite: boolean;
    specs: Array<{ label: string; value: string }>;
};

const extractHeaderItems = (rawHeaderData: unknown) => {
    if (Array.isArray(rawHeaderData)) return rawHeaderData;
    if (!rawHeaderData || typeof rawHeaderData !== "object") return [];

    const source = rawHeaderData as Record<string, unknown>;
    if (Array.isArray(source.header)) return source.header;
    if (Array.isArray(source.menus)) return source.menus;
    if (Array.isArray(source.items)) return source.items;
    if (Array.isArray(source.data)) return source.data;
    if (Array.isArray(source.footer)) return source.footer;

    return [];
};

const isRecord = (value: unknown): value is Record<string, any> => !!value && typeof value === "object" && !Array.isArray(value);

const toPositiveNumber = (value: unknown) => {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (parsed <= 0) return null;
    return Math.trunc(parsed);
};

const readString = (sources: Record<string, any>[], keys: string[]) => {
    for (const source of sources) {
        for (const key of keys) {
            const value = source[key];
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
    }

    return "";
};

const readNumber = (sources: Record<string, any>[], keys: string[]) => {
    for (const source of sources) {
        for (const key of keys) {
            const value = source[key];
            const parsed = typeof value === "number" ? value : Number(value);
            if (Number.isFinite(parsed) && parsed >= 0) {
                return parsed;
            }
        }
    }

    return null;
};

const isTruthyFlag = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";

const readBooleanFlag = (sources: Record<string, any>[], keys: string[]) => {
    for (const source of sources) {
        for (const key of keys) {
            if (isTruthyFlag(source[key])) {
                return true;
            }
        }
    }

    return false;
};

const toDisplayValue = (value: unknown) => {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? COMPARE_PAGE_COPY[DISPLAY_LOCALE].boolYes : COMPARE_PAGE_COPY[DISPLAY_LOCALE].boolNo;
    return "";
};

const readDisplayValue = (sources: Record<string, any>[], keys: string[]) => {
    for (const source of sources) {
        for (const key of keys) {
            const value = toDisplayValue(source[key]);
            if (value) return value;
        }
    }

    return "";
};

const toAbsoluteAssetUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
        return trimmed;
    }

    try {
        const apiOrigin = new URL(config.api.url).origin;

        if (trimmed.startsWith("//")) {
            return `https:${trimmed}`;
        }

        if (trimmed.startsWith("/")) {
            return `${apiOrigin}${trimmed}`;
        }

        return `${apiOrigin}/${trimmed.replace(/^\/+/, "")}`;
    } catch {
        return trimmed;
    }
};

const readImage = (sources: Record<string, any>[]) => {
    for (const source of sources) {
        const candidates = [
            source.main_image,
            source.main_image?.image_url,
            source.main_image?.url,
            source.main_image_url,
            source.image?.image_url,
            source.image?.url,
            source.image,
            source.thumb,
            source.thumbnail,
            source.main_photo,
            source.gallery?.[0]?.url,
            source.gallery?.[0]?.image_url,
            source.images?.[0]?.image_url,
            source.images?.[0]?.url,
        ];

        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.trim()) {
                return toAbsoluteAssetUrl(candidate);
            }
        }
    }

    return "";
};

const normalizeCompareItem = (item: unknown): CompareListItem | null => {
    if (!isRecord(item)) return null;

    const compare = isRecord(item.compare) ? item.compare : null;
    const variation = compare && isRecord(compare.variation)
        ? compare.variation
        : isRecord(item.variation)
        ? item.variation
        : null;

    const nestedSources = [
        item,
        compare,
        variation,
        item.product,
        item.product_variation,
        isRecord(item.product) ? item.product.variation : null,
    ].filter(isRecord);

    const variationId = toPositiveNumber(readNumber(nestedSources, ["product_variation_id", "variation_id", "id"]));
    const id = toPositiveNumber(readNumber(nestedSources, ["id", "product_id", "variation_id", "product_variation_id"]));

    if (!variationId && !id) {
        return null;
    }

    const resolvedVariationId = variationId ?? id ?? 0;
    const resolvedId = id ?? resolvedVariationId;

    const name = readString(nestedSources, ["name", "title", "product_name", "product_title"])
        || `${COMPARE_PAGE_COPY[DISPLAY_LOCALE].productFallbackPrefix} #${resolvedVariationId}`;
    const price = readNumber(nestedSources, ["sale_price", "final_price", "special", "price"]) ?? 0;
    const oldPrice = readNumber(nestedSources, ["old_price", "compare_price", "regular_price"]);
    const slug = readString(nestedSources, ["slug", "uuid"]);
    const image = readImage(nestedSources);
    const isFavorite = readBooleanFlag(nestedSources, [
        "is_favorite",
        "is_favourited",
        "is_favorited",
        "favorite",
        "in_favorites",
    ]);
    const discountPercent = oldPrice && oldPrice > 0 && oldPrice > price
        ? Math.round((1 - price / oldPrice) * 100)
        : undefined;

    const labels = COMPARE_PAGE_COPY[DISPLAY_LOCALE].specLabels;
    const specDefinitions: Array<{ label: string; keys: string[] }> = [
        { label: labels.model, keys: ["model", "model_number"] },
        { label: labels.brand, keys: ["brand", "brand_name", "manufacturer", "vendor"] },
        { label: labels.productCode, keys: ["sku", "code", "barcode", "product_code"] },
        { label: labels.quantity, keys: ["quantity", "qty", "count"] },
        { label: labels.batteryVoltage, keys: ["battery_voltage", "voltage"] },
        { label: labels.batteryCapacity, keys: ["battery_capacity", "capacity_ah", "ah"] },
        { label: labels.drillDiameter, keys: ["drill_diameter", "diameter", "chuck_size"] },
        { label: labels.dimensions, keys: ["dimensions", "size", "measurement"] },
        { label: labels.weight, keys: ["weight", "net_weight"] },
    ];

    const specs = specDefinitions
        .map((definition) => ({
            label: definition.label,
            value: readDisplayValue(nestedSources, definition.keys),
        }))
        .filter((spec) => !!spec.value);

    const rawFilters = [item.filters, compare?.filters, variation?.filters]
        .find((candidate) => Array.isArray(candidate)) as Array<Record<string, any>> | undefined;

    if (Array.isArray(rawFilters)) {
        rawFilters.forEach((filter) => {
            if (!filter || typeof filter !== "object") return;

            const label = toDisplayValue(
                filter.filter_name ?? filter.filterName ?? filter.name ?? filter.title ?? filter.key ?? filter.label
            );

            // Support new API shape where a filter contains a `values` array
            // Each value may have `name`, `value`, `value_name`, `slug`, etc.
            let value = "";

            if (Array.isArray(filter.values) && filter.values.length > 0) {
                const parts: string[] = [];
                for (const v of filter.values) {
                    if (!v || typeof v !== "object") continue;
                    const name = v.name ?? v.value_name ?? v.value ?? v.title ?? v.slug ?? "";
                    const clean = toDisplayValue(name);
                    if (clean) parts.push(clean);
                }

                value = parts.join(", ");
            }

            // Fallback to legacy single-value fields
            if (!value) {
                value = toDisplayValue(
                    filter.value_name ?? filter.valueName ?? filter.value ?? filter.option ?? filter.option_name ?? filter.optionName
                );
            }

            if (!label || !value) return;
            if (specs.some((spec) => spec.label.toLowerCase() === label.toLowerCase())) return;

            specs.push({ label, value });
        });
    }

    return {
        id: resolvedId,
        name,
        price,
        old_price: oldPrice ?? undefined,
        discount_percent: discountPercent,
        slug: slug || undefined,
        main_image: image || undefined,
        product_variation_id: resolvedVariationId,
        is_favorite: isFavorite,
        specs,
    };
};

const normalizeApiUrl = (baseUrl: string, endpoint: string) => {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${cleanBase}${cleanEndpoint}`;
};

const toBearerToken = (token: string) => token.replace(/^Bearer\s+/i, "").trim();

const fetchCompareProducts = async (
    locale: LocaleCode,
    authToken: string | null,
    guestToken: string | null
): Promise<{ message: string; items: CompareListItem[] }> => {
    const compareApiBase = (config.api.url || "https://admin.tvim.az/api/v1").trim();
    const url = new URL(normalizeApiUrl(compareApiBase, config.endpoints.compare.list));
    url.searchParams.set("page", "1");
    url.searchParams.set("per_page", "20");

    const normalizedAuthToken = authToken ? toBearerToken(authToken) : "";

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Language": locale,
                ...(normalizedAuthToken ? { Authorization: `Bearer ${normalizedAuthToken}` } : {}),
                ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
            },
        });

        if (!response.ok) {
            return {
                message: "",
                items: [] as CompareListItem[],
            };
        }

        const payload = (await response.json()) as any;
        const message = typeof payload?.message === "string" ? payload.message : "";
        const rawItems: unknown[] = Array.isArray(payload?.data?.items)
            ? payload.data.items
            : Array.isArray(payload?.data)
            ? payload.data
            : [];

        return {
            message,
            items: rawItems
                .map((rawItem) => normalizeCompareItem(rawItem))
                .filter((normalizedItem): normalizedItem is CompareListItem => normalizedItem !== null),
        };
    } catch {
        return {
            message: "",
            items: [] as CompareListItem[],
        };
    }
};

const extractFavoriteItems = (payload: unknown) => {
    if (!isRecord(payload)) return [] as unknown[];

    const payloadData = payload.data;
    if (Array.isArray(payloadData)) return payloadData;
    if (isRecord(payloadData) && Array.isArray(payloadData.items)) return payloadData.items;
    if (isRecord(payloadData) && Array.isArray(payloadData.data)) return payloadData.data;

    return [] as unknown[];
};

const extractFavoriteVariationId = (item: unknown) => {
    if (!isRecord(item)) return null;

    const product = isRecord(item.product) ? item.product : null;
    const productVariation = product && isRecord(product.variation) ? product.variation : null;

    const nestedSources = [
        item,
        item.favorite,
        item.product_variation,
        item.productVariation,
        item.variation,
        item.product,
        item.item,
        item.data,
        productVariation,
        product && isRecord(product.data) ? product.data : null,
        isRecord(item.product_variation) ? item.product_variation.product : null,
        isRecord(item.product_variation) && isRecord(item.product_variation.variation)
            ? item.product_variation.variation
            : null,
        isRecord(item.variation) ? item.variation.product : null,
        isRecord(item.variation) && isRecord(item.variation.data)
            ? item.variation.data
            : null,
    ].filter(isRecord);

    return toPositiveNumber(readNumber(nestedSources, ["product_variation_id", "variation_id", "id"]));
};

const fetchFavoriteVariationIds = async (
    locale: LocaleCode,
    authToken: string | null,
    guestToken: string | null
) => {
    const favoritesApiBase = (config.api.url || "https://admin.tvim.az/api/v1").trim();
    const url = new URL(normalizeApiUrl(favoritesApiBase, config.endpoints.favorites.list));
    url.searchParams.set("page", "1");
    url.searchParams.set("per_page", "200");

    const normalizedAuthToken = authToken ? toBearerToken(authToken) : "";

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Language": locale,
                ...(normalizedAuthToken ? { Authorization: `Bearer ${normalizedAuthToken}` } : {}),
                ...(guestToken ? { "X-Guest-Token": guestToken } : {}),
            },
        });

        if (!response.ok) {
            return new Set<number>();
        }

        const payload = (await response.json()) as unknown;
        const ids = extractFavoriteItems(payload)
            .map((rawItem) => extractFavoriteVariationId(rawItem))
            .filter((variationId): variationId is number => variationId !== null);

        return new Set(ids);
    } catch {
        return new Set<number>();
    }
};

export default async function ComparePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: routeLocale } = await params;
    const locale = normalizeLocale(routeLocale);
    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const compareGuestToken = decodeCompareTokenFromCookie(cookieStore.get(COMPARE_GUEST_TOKEN_COOKIE)?.value);
    const favoritesGuestToken = decodeGuestTokenFromCookie(cookieStore.get(FAVORITES_GUEST_TOKEN_COOKIE)?.value);

    const langResponse = await api.get<Language[]>(config.endpoints.languages.list);

    if (!langResponse.success || !langResponse.data) {
        return (
            <div className="flex min-h-svh items-center justify-center py-8">
                <p className="text-destructive">{langResponse.message}</p>
            </div>
        );
    }

    if (!SUPPORTED_LOCALES.includes(locale) || !langResponse.data.some((language) => language.code.toLowerCase() === locale)) {
        notFound();
    }
    const copy = COMPARE_PAGE_COPY[DISPLAY_LOCALE];

    const footerMenuResponse = await api.get<FooterMenusData>(config.endpoints.menus.list, {
        params: { in_footer: "1" },
        locale,
    });

    const settingsResponse = await api.get<ProjectSettingsResponseData>(config.endpoints.settings.get, {
        locale,
    });

    const headerMenuResponse = await api.get<any>(config.endpoints.menus.list, {
        params: { in_header: "1" },
        locale,
    });

    const rawHeaderData = headerMenuResponse.success && headerMenuResponse.data ? headerMenuResponse.data : null;
    const headerItems = extractHeaderItems(rawHeaderData);
    const headerTopLevel = headerItems
        .filter((item: any) => !item || !item.parent_id || Number(item.parent_id) === 0)
        .filter(Boolean);

    const headerMenuItems = headerTopLevel
        .filter((item: any) => (((item.type ?? "") + "").toLowerCase() !== "categories"))
        .map((item: any) => {
            const hrefPart = (item.multi_links && item.multi_links[locale]) || item.link || "";
            const path = hrefPart ? `/${locale}/${String(hrefPart).replace(/^\/+/, "")}` : "#";
            return { label: item.name ?? item.title ?? item.link ?? "", href: path };
        });

    const categoriesResponse = await api.get<any>("/product/categories", {
        params: { in_header: "1" },
        locale,
    });

    let headerCategoryItems: any[] = [];
    if (categoriesResponse.success && categoriesResponse.data) {
        const raw = categoriesResponse.data;
        let items: any[] = [];

        if (Array.isArray(raw)) items = raw;
        else if (Array.isArray(raw.data)) items = raw.data;
        else if (Array.isArray(raw.items)) items = raw.items;
        else if (raw && typeof raw === "object") {
            const arr = Object.values(raw).find((value) => Array.isArray(value));
            if (Array.isArray(arr)) items = arr as any[];
        }

        const filtered = items.filter(
            (item) =>
                !!item &&
                (item.in_header === true || item.in_header === 1 || item.in_header === "1" || item.in_header === "true")
        );
        headerCategoryItems = filtered.length > 0 ? filtered : items;
    } else {
        headerCategoryItems = headerTopLevel.filter((item: any) => (((item.type ?? "") + "").toLowerCase() === "categories"));
    }

    const footerMenus = footerMenuResponse.success && footerMenuResponse.data
        ? footerMenuResponse.data.footer
        : [];

    let projectSettings: ProjectSettingsData | undefined;
    if (settingsResponse.success && settingsResponse.data) {
        projectSettings = settingsResponse.data.data;
    }

    const navbarLogo = projectSettings?.general.images.logo ? (
        <img
            src={projectSettings.general.images.logo}
            alt={projectSettings.general.site_title}
            className="h-10 w-auto object-contain sm:h-12 lg:h-14"
        />
    ) : projectSettings?.general.site_title ? (
        <div className="text-[32px] leading-none font-semibold tracking-[-0.02em] text-[#111318]">
            {projectSettings.general.site_title}
        </div>
    ) : undefined;

    const navbarPhone = projectSettings?.general.phones.find(
        (phone) => phone.is_whatsapp && phone.number.trim().startsWith("+994")
    )?.number;
    const [compareResponse, favoriteVariationIds] = await Promise.all([
        fetchCompareProducts(locale, authToken, compareGuestToken),
        fetchFavoriteVariationIds(locale, authToken, favoritesGuestToken),
    ]);
    const compareItems = compareResponse.items.map((item) => ({
        ...item,
        is_favorite: item.is_favorite || favoriteVariationIds.has(item.product_variation_id),
    }));

    return (
        <div className="flex min-h-svh w-full flex-col items-center justify-start gap-0 pt-0 pb-8">
            <NavbarWrapper
                logo={navbarLogo}
                phone={navbarPhone}
                locale={locale}
                languages={langResponse.data}
                menuItems={headerMenuItems}
                initialCatalogItems={headerCategoryItems}
            />

            <Breadcrumb
                items={[
                    { label: copy.homeLabel, href: `/${locale}` },
                    { label: copy.pageName, isCurrent: true },
                ]}
                className="[&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0"
                showTitle
                pageTitle={copy.pageTitle}
                titleClassName="!mt-[-10px] mb-0 !text-left w-full !text-[24px] lg:!text-[39px]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-0 pt-5 pb-12 lg:pt-6 lg:pb-14">
                <CompareProductsGrid
                    locale={locale}
                    initialItems={compareItems}
                    copy={{
                        onlyDifferentLabel: copy.onlyDifferentLabel,
                        emptyState: copy.emptyState,
                        orderButton: copy.orderButton,
                        noDifferentSpecs: copy.noDifferentSpecs,
                        removeCompareFailed: copy.removeCompareFailed,
                        favoriteToggleFailed: copy.favoriteToggleFailed,
                    }}
                />
            </section>

            <div className="mx-auto mt-12 w-full max-w-[1280px] px-0 lg:mt-14">
                <RequestForm />
            </div>

            <div className="mt-16 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} locale={locale} />
            </div>
        </div>
    );
}
