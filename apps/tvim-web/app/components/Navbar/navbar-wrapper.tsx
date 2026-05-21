"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { HeaderCategoryItem, Language } from "@repo/types/types";
import type { NavbarMenuItem, NavbarSearchSection } from "@repo/ui";
import { Navbar } from "@repo/ui";
import { useLanguageStore } from "@/stores";
import { config } from "@/config";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart/client";
import { CartPreviewModal } from "../ProductStrip/cart-preview-modal";

interface NavbarWrapperProps {
    logo?: ReactNode;
    phone?: string;
    locale: string;
    languages?: Language[] | { data?: Language[] | null } | null;
    searchPlaceholder?: string;
    menuItems?: NavbarMenuItem[];
    initialCatalogItems?: HeaderCategoryItem[];
}

type SessionUser = {
    id?: number | string;
    name?: string | null;
    surname?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
};

const formatPrice = (v: number | string | undefined) => {
    const n = typeof v === "number" ? v : Number(v ?? 0);
    return `${n.toFixed(2)}₼`;
};

const parsePriceValue = (value: string) => {
    const normalized = value.replace(/[^\d.,-]/g, "").replace(/,/g, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

type SessionResponse = {
    success?: boolean;
    data?: {
        isAuthenticated?: boolean;
        user?: SessionUser | null;
    };
};

let authSessionPromise: Promise<SessionResponse | null> | null = null;
let authSessionCache: SessionResponse | null = null;

const getAuthSession = async (): Promise<SessionResponse | null> => {
    if (authSessionCache) return authSessionCache;
    if (authSessionPromise) return await authSessionPromise;

    const promise = (async () => {
        try {
            const response = await fetch("/api/auth/session", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                authSessionCache = null;
                return null;
            }

            const payload = (await response.json()) as SessionResponse;
            authSessionCache = payload;
            return payload;
        } catch {
            authSessionCache = null;
            return null;
        } finally {
            authSessionPromise = null;
        }
    })();

    authSessionPromise = promise;
    return await promise;
};

type LiveSearchEntry = {
    id?: number | string;
    product_id?: number | string;
    slug?: string;
    link?: string;
    name?: string;
    model?: string;
    sku?: string;
    discount_price?: number | string;
    price?: number | string;
    old_price?: number | string;
    image?: string;
};

type LiveSearchSectionPayload = {
    name?: string;
    items?: LiveSearchEntry[];
};

type LiveSearchPayload = {
    brands?: LiveSearchSectionPayload;
    categories?: LiveSearchSectionPayload;
    products?: LiveSearchSectionPayload;
};

type LiveSearchResponseData = {
    data?: LiveSearchPayload;
} & LiveSearchPayload;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

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
    const { locale: storedLocale, setLocale } = useLanguageStore();
    const {
        isCartModalOpen,
        items: cartItems,
        openCartModal,
        closeCartModal,
        increaseQuantity: increaseCartItem,
        decreaseQuantity: decreaseCartItem,
        removeItem: removeCartItem,
        hydrateCart: hydrateCartAsync,
    } = useCart();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authUser, setAuthUser] = useState<SessionUser | null>(null);
    const cartCount = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
        [cartItems]
    );
    const cartTotalPrice = useMemo(
        () => cartItems.reduce((sum, item) => sum + parsePriceValue(item.product.price) * item.quantity, 0),
        [cartItems]
    );
    const cartModalItems = useMemo(
        () =>
            cartItems.map((item) => {
                const unitPrice = parsePriceValue(item.product.price);
                const showInsufficientStockWarning =
                    typeof item.product.stock === "number" &&
                    item.product.stock > 0 &&
                    item.quantity > item.product.stock;

                return {
                    key: item.key,
                    title: item.product.title,
                    imageUrl: item.product.imageUrl,
                    quantity: item.quantity,
                    unitPriceText: formatPrice(unitPrice),
                    totalPriceText: formatPrice(unitPrice * item.quantity),
                    showInsufficientStockWarning,
                };
            }),
        [cartItems]
    );

    const effectiveLanguages = useMemo<Language[]>(() => {
        if (Array.isArray(languages)) return languages;
        if (isRecord(languages) && Array.isArray(languages.data)) return languages.data;
        return [];
    }, [languages]);

    const supportedLocales = useMemo(
        () =>
            new Set(
                [
                    ...effectiveLanguages.map((language) => language.code),
                    locale,
                    storedLocale,
                    config.project.defLang,
                    "az",
                    "ru",
                    "en",
                ]
                    .map((value) => String(value || "").trim().toLowerCase())
                    .filter(Boolean)
            ),
        [effectiveLanguages, locale, storedLocale]
    );

    const localeFromPath = useMemo(() => {
        const firstSegment = pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
        return supportedLocales.has(firstSegment) ? firstSegment : "";
    }, [pathname, supportedLocales]);

    const effectiveLocale = useMemo(() => {
        if (localeFromPath) {
            return localeFromPath;
        }

        const normalizedStored = storedLocale.trim().toLowerCase();
        if (supportedLocales.has(normalizedStored)) {
            return normalizedStored;
        }

        const normalizedRoute = locale.trim().toLowerCase();
        if (supportedLocales.has(normalizedRoute)) {
            return normalizedRoute;
        }

        const normalizedDefault = config.project.defLang.trim().toLowerCase();
        if (supportedLocales.has(normalizedDefault)) {
            return normalizedDefault;
        }

        return "az";
    }, [locale, localeFromPath, storedLocale, supportedLocales]);

    useEffect(() => {
        if (!localeFromPath) return;
        if (storedLocale.trim().toLowerCase() === localeFromPath) return;
        setLocale(localeFromPath);
    }, [localeFromPath, setLocale, storedLocale]);

    useEffect(() => {
        if (!isCartModalOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeCartModal();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [closeCartModal, isCartModalOpen]);

    useEffect(() => {
        let isMounted = true;

        const loadAuthSession = async () => {
            try {
                const payload = await getAuthSession();
                if (!isMounted) return;

                const nextIsAuthenticated = payload?.data?.isAuthenticated === true;
                setIsAuthenticated(nextIsAuthenticated);
                setAuthUser(payload?.data?.user ?? null);
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

    useEffect(() => {
        void hydrateCartAsync();
    }, [hydrateCartAsync]);

    const localizedMenuItems = useMemo(() => {
        if (!Array.isArray(menuItems)) return menuItems;

        return menuItems.map((item) => {
            const href = typeof item?.href === "string" ? item.href : "";
            if (!href || href === "#") return item;

            if (href === "/") {
                return { ...item, href: `/${effectiveLocale}` };
            }

            if (!href.startsWith("/")) return item;

            const segments = href.split("/").filter(Boolean);
            if (segments.length === 0) {
                return { ...item, href: `/${effectiveLocale}` };
            }

            const firstSegment = segments[0]?.toLowerCase() ?? "";
            if (!supportedLocales.has(firstSegment)) {
                return item;
            }

            segments[0] = effectiveLocale;
            return { ...item, href: `/${segments.join("/")}` };
        });
    }, [effectiveLocale, menuItems, supportedLocales]);

    const handleLocaleChange = useCallback((nextLocale: string) => {
        const normalizedNextLocale = nextLocale.trim().toLowerCase();
        if (!supportedLocales.has(normalizedNextLocale)) {
            return;
        }

        setLocale(normalizedNextLocale);

        const segments = pathname.split("/").filter(Boolean);

        if (segments.length === 0) {
            router.push(`/${normalizedNextLocale}`);
            return;
        }

        const firstSegment = segments[0]?.toLowerCase() ?? "";

        if (supportedLocales.has(firstSegment)) {
            segments[0] = normalizedNextLocale;
            router.push(`/${segments.join("/")}`);
            return;
        }

        if (["signin", "signup", "forgot-password"].includes(firstSegment)) {
            router.push(`/${normalizedNextLocale}/${segments.join("/")}`);
            return;
        }

        router.refresh();
    }, [pathname, router, setLocale, supportedLocales]);

    const handleSearchProducts = useCallback(async (query: string, localeCode: string): Promise<NavbarSearchSection[]> => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return [];

        const response = await api.get<LiveSearchResponseData>("/product/live-search", {
            params: { q: trimmedQuery },
            locale: localeCode,
        });

        if (!response.success || !response.data) return [];

        const payload = isRecord(response.data.data) ? response.data.data : response.data;
        if (!isRecord(payload)) return [];

        const formatSearchPrice = (value: unknown) => {
            if (typeof value === "number" && Number.isFinite(value)) {
                return `${value.toFixed(2)}₼`;
            }

            const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
            if (Number.isFinite(parsed)) {
                return `${parsed.toFixed(2)}₼`;
            }

            return "";
        };

        const toLocalizedHref = (rawLink: unknown) => {
            if (typeof rawLink !== "string" || !rawLink.trim()) return "#";
            const link = rawLink.trim();
            if (/^https?:\/\//i.test(link)) return link;
            const normalizedLink = link.startsWith("/") ? link : `/${link}`;
            const firstSegment = normalizedLink.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
            if (supportedLocales.has(firstSegment)) return normalizedLink;
            return `/${localeCode}${normalizedLink}`;
        };

        const mapSectionItems = (items: unknown, type: "brand" | "category" | "product") => {
            if (!Array.isArray(items)) return [];

            return items
                .filter((item) => !!item && typeof item === "object")
                .map((item) => {
                    const typedItem = item as LiveSearchEntry;
                    const modelText = String(typedItem.model ?? typedItem.sku ?? "").trim();
                    const subtitle =
                        type === "brand"
                            ? "Brend"
                            : type === "category"
                                ? "Kateqoriya"
                                : modelText
                                    ? `Model: ${modelText}`
                                    : "";

                    return {
                        id: typedItem.id ?? typedItem.product_id ?? typedItem.slug ?? typedItem.link ?? typedItem.name ?? `${type}-item`,
                        name: String(typedItem.name ?? ""),
                        subtitle,
                        model: modelText,
                        price: type === "product"
                            ? formatSearchPrice(typedItem.discount_price ?? typedItem.price ?? typedItem.old_price)
                            : "",
                        imageUrl: String(typedItem.image ?? ""),
                        href: toLocalizedHref(typedItem.link),
                        type,
                    };
                })
                .filter((item) => item.name);
        };

        const sections: NavbarSearchSection[] = [
            {
                key: "brands",
                name: String(payload.brands?.name ?? "Brendlər"),
                items: mapSectionItems(payload.brands?.items, "brand"),
            },
            {
                key: "categories",
                name: String(payload.categories?.name ?? "Kateqoriyalar"),
                items: mapSectionItems(payload.categories?.items, "category"),
            },
            {
                key: "products",
                name: String(payload.products?.name ?? "Məhsullar"),
                items: mapSectionItems(payload.products?.items, "product"),
            },
        ];

        return sections.filter((section) => section.items.length > 0);
    }, [supportedLocales]);

    return (
        <>
            <Navbar
                logo={logo}
                logoHref={`/${effectiveLocale}`}
                phone={phone}
                locale={effectiveLocale}
                languages={effectiveLanguages.length > 0 ? effectiveLanguages : undefined}
                defLang={config.project.defLang}
                onLocaleChange={handleLocaleChange}
                searchPlaceholder={searchPlaceholder}
                menuItems={localizedMenuItems}
                initialCatalogItems={initialCatalogItems}
                onSearchProducts={handleSearchProducts}
                isAuthenticated={isAuthenticated}
                authUser={authUser}
                cartCount={cartCount}
                onCartClick={openCartModal}
            />
            {isCartModalOpen ? (
                <CartPreviewModal
                    items={cartModalItems}
                    totalPriceText={formatPrice(cartTotalPrice)}
                    onClose={closeCartModal}
                    onDecrease={decreaseCartItem}
                    onIncrease={increaseCartItem}
                    onRemove={removeCartItem}
                />
            ) : null}
        </>
    );
};

export { NavbarWrapper };
