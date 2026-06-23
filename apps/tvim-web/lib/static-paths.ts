import { config } from "@/config";
import { api } from "@/lib/api";
import { getPublicLanguages, getPublicMenuList } from "@/lib/public-data";

type ProductListResponse = {
    data?: {
        items?: Array<{
            slug?: string;
            variation?: {
                slug?: string;
            };
        }>;
        pagination?: {
            last_page?: number;
        };
    };
};

type ProductBrandsResponseData = {
    values?: Array<{
        slug?: string;
    }>;
};

const normalizePath = (value: string) =>
    decodeURIComponent(String(value ?? ""))
        .trim()
        .replace(/^https?:\/\/[^/]+/i, "")
        .replace(/^\/+|\/+$/g, "");

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const readLocalizedLink = (node: Record<string, unknown>, locale: string) => {
    const multiLinks = node.multi_links;
    if (isRecord(multiLinks)) {
        const localized = multiLinks[locale];
        if (typeof localized === "string" && localized.trim()) {
            return normalizePath(localized);
        }
    }

    if (typeof node.link === "string" && node.link.trim()) {
        return normalizePath(node.link);
    }

    return "";
};

const collectMenuPaths = (
    node: unknown,
    locale: string,
    paths: Set<string>,
    parentPath = "",
) => {
    if (!node) return;

    if (Array.isArray(node)) {
        node.forEach((item) => collectMenuPaths(item, locale, paths, parentPath));
        return;
    }

    if (!isRecord(node)) return;

    const ownPath = readLocalizedLink(node, locale);
    const currentPath = ownPath || parentPath;
    const viewType = String(node.view_type ?? "").trim().toLowerCase();

    if (ownPath) {
        paths.add(`${locale}/${ownPath}`);
    }

    const data = node.data;
    const itemList =
        isRecord(data) && Array.isArray(data.items)
            ? data.items as Array<Record<string, unknown>>
            : [];

    itemList.forEach((item) => {
        const multiSlugs = item.multi_slugs;
        const localizedSlug =
            isRecord(multiSlugs)
                ? multiSlugs[locale]
                : undefined;
        const slug = normalizePath(typeof localizedSlug === "string" ? localizedSlug : String(item.slug ?? ""));
        if (!slug) return;

        const itemPath = viewType === "brand-news"
            ? `${locale}/brands/news/${slug}`
            : currentPath
                ? `${locale}/${currentPath}/${slug}`
                : `${locale}/${slug}`;

        paths.add(itemPath);
    });

    Object.values(node).forEach((value) => {
        if (value && typeof value === "object") {
            collectMenuPaths(value, locale, paths, currentPath);
        }
    });
};

const collectCategoryPaths = (
    node: unknown,
    locale: string,
    paths: Set<string>,
) => {
    if (!node) return;

    if (Array.isArray(node)) {
        node.forEach((item) => collectCategoryPaths(item, locale, paths));
        return;
    }

    if (!isRecord(node)) return;

    const link = readLocalizedLink(node, locale);
    if (link) {
        paths.add(`${locale}/${link}`);
    }

    const children = Array.isArray(node.children) ? node.children : [];
    children.forEach((child) => collectCategoryPaths(child, locale, paths));
};

async function collectProductPaths(locale: string, paths: Set<string>) {
    const firstPage = await api.get<ProductListResponse>(config.endpoints.products.paginatedList, {
        locale,
        params: {
            page: "1",
            per_page: "100",
        },
        cache: "force-cache",
    });

    const pages = [firstPage.data ?? null];
    const lastPage = Math.max(1, Number(firstPage.data?.data?.pagination?.last_page ?? 1));

    if (lastPage > 1) {
        const remainingPages = await Promise.all(
            Array.from({ length: lastPage - 1 }, (_, index) =>
                api.get<ProductListResponse>(config.endpoints.products.paginatedList, {
                    locale,
                    params: {
                        page: String(index + 2),
                        per_page: "100",
                    },
                    cache: "force-cache",
                }).then((response) => response.data ?? null)
            )
        );

        pages.push(...remainingPages);
    }

    pages.forEach((payload) => {
        const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
        items.forEach((item) => {
            const slug = normalizePath(String(item.variation?.slug ?? item.slug ?? ""));
            if (!slug) return;
            paths.add(`${locale}/products/${slug}`);
        });
    });
}

async function collectBrandPaths(locale: string, paths: Set<string>) {
    const response = await api.get<ProductBrandsResponseData>("/product/brands", {
        locale,
        cache: "force-cache",
    });

    const items = Array.isArray(response.data?.values) ? response.data.values : [];
    items.forEach((item) => {
        const slug = normalizePath(String(item?.slug ?? ""));
        if (!slug) return;
        paths.add(`${locale}/brands/${slug}`);
    });
}

export async function getStaticLocaleCodes() {
    const languages = await getPublicLanguages();
    return languages.map((language) => String(language.code).trim().toLowerCase()).filter(Boolean);
}

export async function getStaticPublicPaths() {
    const localeCodes = await getStaticLocaleCodes();
    const paths = new Set<string>();

    await Promise.all(
        localeCodes.map(async (locale) => {
            const [menusPayload, categoriesPayload] = await Promise.all([
                getPublicMenuList(locale),
                api.get<unknown>("/product/categories", {
                    locale,
                    cache: "force-cache",
                }).then((response) => response.data ?? null),
                collectProductPaths(locale, paths),
                collectBrandPaths(locale, paths),
            ]);

            collectMenuPaths(menusPayload, locale, paths);
            collectCategoryPaths(categoriesPayload, locale, paths);
        })
    );

    return Array.from(paths);
}

export async function getStaticSlugParams() {
    const paths = await getStaticPublicPaths();

    return paths
        .map((path) => path.split("/").filter(Boolean))
        .filter((segments) => segments.length === 2)
        .map(([locale, slug]) => ({ locale, slug }));
}

export async function getStaticItemSlugParams() {
    const paths = await getStaticPublicPaths();

    return paths
        .map((path) => path.split("/").filter(Boolean))
        .filter((segments) => segments.length === 3)
        .map(([locale, slug, itemSlug]) => ({ locale, slug, itemSlug }));
}

export async function getStaticServiceSlugParams() {
    const paths = await getStaticPublicPaths();

    return paths
        .map((path) => path.split("/").filter(Boolean))
        .filter((segments) => segments.length === 3 && segments[1] === "services")
        .map(([locale, _services, slug]) => ({ locale, slug }));
}

export async function getStaticBrandSlugParams() {
    const paths = await getStaticPublicPaths();

    return paths
        .map((path) => path.split("/").filter(Boolean))
        .filter((segments) => segments.length === 3 && segments[1] === "brands")
        .map(([locale, _brands, slug]) => ({ locale, slug }));
}

export async function getStaticBrandNewsSlugParams() {
    const paths = await getStaticPublicPaths();

    return paths
        .map((path) => path.split("/").filter(Boolean))
        .filter((segments) => segments.length === 4 && segments[1] === "brands" && segments[2] === "news")
        .map(([locale, _brands, _news, slug]) => ({ locale, slug }));
}
