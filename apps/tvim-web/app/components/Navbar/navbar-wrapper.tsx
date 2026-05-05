"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Language } from "@repo/types/types";
import type { NavbarSearchProduct } from "@repo/ui";
import { Navbar } from "@repo/ui";
import { config } from "@/config";
import { api } from "@/lib/api";

interface NavbarWrapperProps {
    logo?: ReactNode;
    phone?: string;
    locale: string;
    languages: Language[];
    searchPlaceholder?: string;
    menuItems?: any[];
    initialCatalogItems?: any[];
}

type SessionUser = {
    id?: number | string;
    name?: string | null;
    surname?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
};

type SessionResponse = {
    success?: boolean;
    data?: {
        isAuthenticated?: boolean;
        user?: SessionUser | null;
    };
};

const NavbarWrapper = ({
    logo,
    phone,
    locale,
    languages,
    searchPlaceholder,
    menuItems,
    initialCatalogItems,
}: NavbarWrapperProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authUser, setAuthUser] = useState<SessionUser | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadAuthSession = async () => {
            try {
                const response = await fetch("/api/auth/session", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (!response.ok) return;

                const payload = (await response.json()) as SessionResponse;
                if (!isMounted) return;

                const nextIsAuthenticated = payload.data?.isAuthenticated === true;
                setIsAuthenticated(nextIsAuthenticated);
                setAuthUser(payload.data?.user ?? null);
            } catch {
                if (!isMounted) return;
                setIsAuthenticated(false);
                setAuthUser(null);
            }
        };

        void loadAuthSession();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLocaleChange = useCallback((nextLocale: string) => {
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length === 0) {
            // Root path - sadece locale'ye git
            router.push(`/${nextLocale}`);
        } else {
            // Mevcut path'in locale kısmını değiştir
            segments[0] = nextLocale;
            router.push(`/${segments.join("/")}`);
        }
    }, [pathname, router]);

    const handleSearchProducts = useCallback(async (query: string, localeCode: string): Promise<NavbarSearchProduct[]> => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return [];

        const response = await api.get<any>("/product/list", {
            params: { q: trimmedQuery },
            locale: localeCode,
        });

        if (!response.success || !response.data) return [];

        const raw = response.data as any;

        const findNameDeep = (source: any, visited = new Set<any>()): string => {
            if (!source || typeof source !== "object" || visited.has(source)) return "";
            visited.add(source);

            const preferredKeys = [
                "name",
                "title",
                "product_name",
                "product_title",
                "meta_title",
                "label",
                `name_${localeCode}`,
                `${localeCode}_name`,
                `title_${localeCode}`,
                `${localeCode}_title`,
            ];

            for (const key of preferredKeys) {
                const value = source?.[key];
                if (typeof value === "string" && value.trim()) {
                    return value.trim();
                }
            }

            const nestedCandidates = [
                source.translation,
                source.product,
                source.attributes,
                source.category,
                source.brand,
                source.menu,
                source.data,
            ];

            for (const candidate of nestedCandidates) {
                const found = findNameDeep(candidate, visited);
                if (found) return found;
            }

            if (Array.isArray(source.translations)) {
                const exactLocale = source.translations.find((t: any) => t?.locale === localeCode);
                const foundExact = findNameDeep(exactLocale, visited);
                if (foundExact) return foundExact;

                for (const translation of source.translations) {
                    const found = findNameDeep(translation, visited);
                    if (found) return found;
                }
            }

            for (const value of Object.values(source)) {
                if (value && typeof value === "object") {
                    const found = findNameDeep(value, visited);
                    if (found) return found;
                }
            }

            return "";
        };

        const getProductName = (item: any): string => {
            if (!item || typeof item !== "object") return "";
            const base = (item.product && typeof item.product === "object") ? item.product : item;
            return findNameDeep(base) || findNameDeep(item);
        };

        const pickProductArray = (source: any): any[] => {
            if (!source || typeof source !== "object") return [];

            const arrays: any[][] = [];
            const visited = new Set<any>();

            const collectArrays = (node: any, depth: number) => {
                if (!node || depth > 3 || visited.has(node)) return;
                visited.add(node);

                if (Array.isArray(node)) {
                    arrays.push(node);
                    node.forEach((child) => {
                        if (child && typeof child === "object") collectArrays(child, depth + 1);
                    });
                    return;
                }

                if (typeof node === "object") {
                    Object.values(node).forEach((value) => {
                        if (value && (Array.isArray(value) || typeof value === "object")) {
                            collectArrays(value, depth + 1);
                        }
                    });
                }
            };

            const directCandidates = [
                source.products,
                source.items,
                source.list,
                source.results,
                source.data?.products,
                source.data?.items,
                source.data?.list,
                source.data?.results,
                source.data,
            ];

            directCandidates.forEach((candidate) => {
                if (Array.isArray(candidate)) arrays.unshift(candidate as any[]);
            });

            collectArrays(source, 0);

            const objectArrays = arrays.filter((arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object");
            if (objectArrays.length === 0) return [];

            const scoreArray = (arr: any[]) => {
                let score = 0;
                const sample = arr.slice(0, 10);

                sample.forEach((entry: any) => {
                    const item = (entry?.product && typeof entry.product === "object") ? entry.product : entry;
                    const name = getProductName(entry);
                    const hasPrice = item?.price != null || item?.sale_price != null || item?.final_price != null || item?.special != null;
                    const hasImage = !!(item?.image?.image_url || item?.image_url || item?.thumb || item?.images?.[0]?.image_url);
                    const hasLink = !!(item?.slug || item?.link || item?.multi_links);
                    const hasModel = !!(item?.model || item?.sku || item?.code);

                    if (name) score += 4;
                    if (hasPrice) score += 2;
                    if (hasImage) score += 1;
                    if (hasLink) score += 1;
                    if (hasModel) score += 1;
                });

                return score;
            };

            return objectArrays.sort((a, b) => scoreArray(b) - scoreArray(a))[0] ?? [];
        };

        const items: any[] = Array.isArray(raw)
            ? raw
            : pickProductArray(raw);

        const formatPrice = (value: unknown) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                return `${value.toFixed(2)}₼`;
            }

            const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
            if (Number.isFinite(parsed)) {
                return `${parsed.toFixed(2)}₼`;
            }

            return "";
        };

        return items
            .filter((item) => !!item && typeof item === "object")
            .map((item) => {
                const base = (item?.product && typeof item.product === "object") ? item.product : item;

                const hrefPart =
                    (base?.multi_links && base.multi_links[localeCode]) ||
                    base?.link ||
                    (base?.slug ? `products/${base.slug}` : "");

                const href = hrefPart
                    ? `/${localeCode}/${String(hrefPart).replace(/^\/+/, "")}`
                    : "#";

                return {
                    id: base.id ?? item.id ?? base.product_id ?? item.product_id ?? base.uuid ?? item.uuid ?? `${base.slug ?? base.link ?? getProductName(item) ?? "item"}`,
                    name: getProductName(item) || "Məhsul",
                    model: String(base.model ?? base.sku ?? base.code ?? ""),
                    price: formatPrice(base.sale_price ?? base.price ?? base.final_price ?? base.special),
                    imageUrl: String(
                        base.image?.image_url ??
                        base.image_url ??
                        base.thumb ??
                        base.images?.[0]?.image_url ??
                        ""
                    ),
                    href,
                } satisfies NavbarSearchProduct;
            });
    }, []);

    return (
        <Navbar
            logo={logo}
            phone={phone}
            locale={locale}
            languages={languages}
            defLang={config.project.defLang}
            onLocaleChange={handleLocaleChange}
            searchPlaceholder={searchPlaceholder}
            menuItems={menuItems}
            initialCatalogItems={initialCatalogItems}
            onSearchProducts={handleSearchProducts}
            isAuthenticated={isAuthenticated}
            authUser={authUser}
        />
    );
};

export { NavbarWrapper };
