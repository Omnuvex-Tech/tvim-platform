"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Heart, House, LayoutGrid, ShoppingCart, UserRound } from "lucide-react";
import { useCart } from "@/lib/cart/client";

const SUPPORTED_LOCALES = new Set(["az", "en", "ru"]);
const FAVORITES_UPDATED_EVENT = "tvim:favorites-updated";

const LABELS = {
    az: {
        home: "Əsas",
        catalog: "Kataloq",
        cart: "Səbət",
        wishlist: "Seçilmişlər",
        login: "Giriş",
    },
    en: {
        home: "Home",
        catalog: "Catalog",
        cart: "Cart",
        wishlist: "Wishlist",
        login: "Login",
    },
    ru: {
        home: "Главная",
        catalog: "Каталог",
        cart: "Корзина",
        wishlist: "Избранное",
        login: "Вход",
    },
} as const;

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const getLocaleFromPathname = (pathname: string | null) => {
    const firstSegment = pathname?.split("/").filter(Boolean)[0]?.toLowerCase();
    return SUPPORTED_LOCALES.has(firstSegment ?? "") ? (firstSegment as keyof typeof LABELS) : "az";
};

const extractFavoritesCount = (payload: any) => {
    const total = Number(payload?.data?.pagination?.total);
    if (Number.isFinite(total) && total >= 0) {
        return Math.trunc(total);
    }

    const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    return items.length;
};

const formatBadgeCount = (count: number) => (count > 99 ? "99+" : String(count));

export const MobileBottomTabs = () => {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [favoritesCount, setFavoritesCount] = useState(0);
    const { items: cartItems } = useCart();
    const locale = getLocaleFromPathname(pathname);
    const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

    useEffect(() => {
        let isMounted = true;

        const loadFavoritesCount = async () => {
            try {
                const response = await fetch("/api/favorites?page=1&per_page=1", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    if (isMounted) setFavoritesCount(0);
                    return;
                }

                const payload = await response.json();
                if (isMounted) {
                    setFavoritesCount(extractFavoritesCount(payload));
                }
            } catch {
                if (isMounted) setFavoritesCount(0);
            }
        };

        void loadFavoritesCount();

        const onFavoritesUpdated = () => {
            void loadFavoritesCount();
        };

        window.addEventListener(FAVORITES_UPDATED_EVENT, onFavoritesUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener(FAVORITES_UPDATED_EVENT, onFavoritesUpdated);
        };
    }, []);

    useEffect(() => {
        const updateScrollState = () => {
            setIsScrolled(window.scrollY > 24);
        };

        updateScrollState();
        window.addEventListener("scroll", updateScrollState, { passive: true });

        return () => {
            window.removeEventListener("scroll", updateScrollState);
        };
    }, []);

    const tabs = useMemo(
        () => [
            {
                label: LABELS[locale].home,
                href: `/${locale}`,
                icon: House,
                active: pathname === `/${locale}` || pathname === `/${locale}/`,
            },
            {
                label: LABELS[locale].catalog,
                href: `/${locale}#catalog`,
                icon: LayoutGrid,
                active: false,
            },
            {
                label: LABELS[locale].cart,
                href: `/${locale}/checkout`,
                icon: ShoppingCart,
                active: pathname?.startsWith(`/${locale}/checkout`) ?? false,
                count: cartCount,
            },
            {
                label: LABELS[locale].wishlist,
                href: `/${locale}/wishlist`,
                icon: Heart,
                active: pathname?.startsWith(`/${locale}/wishlist`) ?? false,
                count: favoritesCount,
            },
            {
                label: LABELS[locale].login,
                href: `/${locale}/signin`,
                icon: UserRound,
                active: pathname?.startsWith(`/${locale}/signin`) ?? false,
            },
        ],
        [locale, pathname]
    );

    return (
        <>
            <div className="h-[86px] md:hidden" aria-hidden="true" />
            <nav
                className={cx(
                    "fixed left-1/2 z-50 grid grid-cols-5 bg-white transition-all duration-200 md:hidden",
                    "pb-[calc(8px+env(safe-area-inset-bottom))] pt-2",
                    isScrolled
                        ? "bottom-4 w-[calc(100%-28px)] max-w-[330px] -translate-x-1/2 rounded-[22px] border border-[#e8edf5] shadow-[0_8px_28px_rgba(15,37,76,0.16)]"
                        : "bottom-0 w-full max-w-[380px] -translate-x-1/2 border-t border-[#e8edf5] shadow-[0_-6px_18px_rgba(15,37,76,0.08)]"
                )}
                aria-label="Mobile navigation"
            >
                {tabs.map(({ label, href, icon: Icon, active, count }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cx(
                            "flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium leading-tight no-underline transition-colors",
                            active ? "text-[#0b57f0]" : "text-[#8c96a8] hover:text-[#0b57f0]"
                        )}
                    >
                        <span className="relative inline-flex">
                            <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.8 : 2.2} aria-hidden="true" />
                            {typeof count === "number" && count > 0 ? (
                                <span className="absolute -right-2.5 -top-2 inline-flex min-h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#ffd500] px-1 text-[10px] font-bold leading-none text-[#111827] shadow-[0_1px_3px_rgba(15,23,42,0.18)]">
                                    {formatBadgeCount(count)}
                                </span>
                            ) : null}
                        </span>
                        <span className="max-w-full truncate">{label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
};
