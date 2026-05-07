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
import { AUTH_SESSION_TOKEN_COOKIE, decodeTokenFromCookie } from "@/lib/auth/session";
import { COMPARE_GUEST_TOKEN_COOKIE, decodeCompareTokenFromCookie } from "@/lib/compare/session";

type CompareListItem = {
    id: number;
    name: string;
    price: number;
    old_price?: number;
    discount_percent?: number;
    slug?: string;
    main_image?: string;
    product_variation_id: number;
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

const toDisplayValue = (value: unknown) => {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "Bəli" : "Xeyr";
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

    const name = readString(nestedSources, ["name", "title", "product_name", "product_title"]) || `Məhsul #${resolvedVariationId}`;
    const price = readNumber(nestedSources, ["sale_price", "final_price", "special", "price"]) ?? 0;
    const oldPrice = readNumber(nestedSources, ["old_price", "compare_price", "regular_price"]);
    const slug = readString(nestedSources, ["slug", "uuid"]);
    const image = readImage(nestedSources);
    const discountPercent = oldPrice && oldPrice > 0 && oldPrice > price
        ? Math.round((1 - price / oldPrice) * 100)
        : undefined;

    const specDefinitions: Array<{ label: string; keys: string[] }> = [
        { label: "Model", keys: ["model", "model_number"] },
        { label: "Brend", keys: ["brand", "brand_name", "manufacturer", "vendor"] },
        { label: "Məhsul kodu", keys: ["sku", "code", "barcode", "product_code"] },
        { label: "Say", keys: ["quantity", "qty", "count"] },
        { label: "Akkumulyator gərginliyi (V)", keys: ["battery_voltage", "voltage"] },
        { label: "Akkumulyator həcmi (Ah)", keys: ["battery_capacity", "capacity_ah", "ah"] },
        { label: "Qazma diametri", keys: ["drill_diameter", "diameter", "chuck_size"] },
        { label: "Ölçülər (U x E x H)", keys: ["dimensions", "size", "measurement"] },
        { label: "Çəki", keys: ["weight", "net_weight"] },
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

            const label = toDisplayValue(filter.name ?? filter.title ?? filter.key);
            const value = toDisplayValue(filter.value ?? filter.option ?? filter.option_name);

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
    locale: string,
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

export default async function ComparePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: routeLocale } = await params;
    const locale = routeLocale.trim().toLowerCase();
    const cookieStore = await cookies();
    const authToken = decodeTokenFromCookie(cookieStore.get(AUTH_SESSION_TOKEN_COOKIE)?.value);
    const guestToken = decodeCompareTokenFromCookie(cookieStore.get(COMPARE_GUEST_TOKEN_COOKIE)?.value);

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

    const homePageMeta = config.pages.home[locale as "az" | "ru" | "en"];
    const comparePageMeta = config.pages.compare[locale as "az" | "ru" | "en"];

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
    const compareResponse = await fetchCompareProducts(locale, authToken, guestToken);
    const compareItems = compareResponse.items;
    const uniqueSpecLabels = Array.from(
        new Set(compareItems.flatMap((item) => item.specs.map((spec) => spec.label)))
    );

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
                    { label: homePageMeta.name, href: homePageMeta.url },
                    { label: comparePageMeta.name, isCurrent: true },
                ]}
                className="compare-breadcrumb-sm [&_ul.breadcrumb]:mb-0 [&_ul.breadcrumb]:pb-0 [&_ul.breadcrumb]:-ml-3"
                showTitle
                pageTitle={comparePageMeta.title}
                titleClassName="!mt-[-4px] -ml-3 mb-0 !text-left w-full !text-[39px] !font-[700] !leading-[39px] !text-[#0f0f0f]"
            />

            <section className="mx-auto w-full max-w-[1280px] px-0 pt-5 pb-10 lg:pt-6 lg:pb-12">
                <label className="mb-[15px] inline-flex items-center gap-2 font-[500] text-[#888]">
                    <input
                        type="checkbox"
                        className="appearance-none h-4 w-4 rounded-[3px] border border-[#c8cfdd] bg-white transition-all duration-150 hover:border-[1.5px] hover:border-[#6f7b95] checked:border-[#2050f5] checked:bg-[#2050f5]"
                    />
                    Yalnız fərqli göstərin
                </label>

                {compareItems.length === 0 ? (
                    <div className="mt-4 rounded-[14px] bg-[#f2f2f2] px-4 py-5 text-[18px] font-medium text-[#1f2328]">
                        Müqayisə üçün hər hansı məhsul seçilməyib.
                    </div>
                ) : (
                    <div className="mt-0 overflow-x-auto">
                        <div
                            className="grid w-max gap-0"
                            style={{ gridTemplateColumns: `repeat(${compareItems.length}, 320px)` }}
                        >
                            {compareItems.map((item: CompareListItem) => (
                                <article key={`${item.id}-${item.product_variation_id}`} className="border border-[#e4e8ef] bg-white">
                                    <div className="relative px-4 pt-4 pb-5 text-center">
                                        {typeof item.discount_percent === "number" && item.discount_percent > 0 ? (
                                            <span className="absolute left-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#ff2e43] text-[12px] font-bold text-white">
                                                -{item.discount_percent}%
                                            </span>
                                        ) : null}

                                        <div className="absolute right-3 top-3 flex flex-col gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#dce1ea] bg-white text-[12px] text-[#3b4352]"
                                            >
                                                <i className="fa-regular fa-trash-can" aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#dce1ea] bg-white text-[12px] text-[#6d778a]"
                                            >
                                                <i className="fa-regular fa-heart" aria-hidden="true" />
                                            </button>
                                        </div>

                                        <a href={item.slug ? `/product/${item.slug}` : "#"} className="block">
                                            <span className="mx-auto inline-flex h-[190px] w-[250px] items-center justify-center overflow-hidden rounded-[10px]">
                                                {item.main_image ? (
                                                    <img src={item.main_image} alt={item.name} className="h-full w-full object-contain" />
                                                ) : null}
                                            </span>
                                            <span className="mt-3 line-clamp-2 block min-h-[44px] text-[16px] font-medium text-[#1f2328]">{item.name}</span>
                                        </a>

                                        <div className="mt-2 flex min-h-[92px] flex-col items-center">
                                            {typeof item.old_price === "number" && item.old_price > 0 ? (
                                                <span className="block text-[16px] leading-none font-bold text-[#9ba3b5] line-through">{item.old_price.toFixed(2)}₼</span>
                                            ) : null}
                                            <span className="mt-1 block text-[28px] leading-none font-bold text-[#ff0000]">{item.price.toFixed(2)}₼</span>
                                        </div>

                                        <button
                                            type="button"
                                            className="mt-4 inline-flex h-8 items-center justify-center border-none rounded-full bg-[#f5d400] px-3 text-[13px] leading-[1.15] font-semibold text-[#1f2328] transition-all duration-150"
                                        >
                                            By order
                                        </button>
                                    </div>

                                    <div>
                                        {uniqueSpecLabels.map((label) => {
                                            const specValue = item.specs.find((spec) => spec.label === label)?.value || "-";

                                            return (
                                                <div key={`${item.id}-${label}`} className="border-t border-[#e8ecf3] px-4 py-3 text-left">
                                                    <p className="text-[12px] font-semibold text-[#9aa3b5]">{label}</p>
                                                    <p className="mt-1 text-[14px] font-semibold text-[#1f2328]">{specValue}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <div className="mt-16 w-full lg:mt-20">
                <Footer footerMenus={footerMenus} footerSettings={projectSettings} />
            </div>
        </div>
    );
}
