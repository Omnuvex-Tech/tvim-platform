"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useNotify } from "@repo/ui";
import { addProductToCart } from "@/lib/cart/client";
import { listCompare, toggleCompare } from "@/lib/compare/client";
import { listFavorites, toggleFavorite } from "@/lib/favorites/client";
import { QuickOrderPopup } from "./quick-order-popup";

type ApiItem = any;

type Product = {
    id: number;
    title: string;
    price: string;
    oldPrice?: string;
    discount?: string;
    imageUrl: string;
    href: string;
    cartVariant?: "yellow" | "blue";
    productVariationId?: number | null;
    isFavorited?: boolean;
    isCompared?: boolean;
    stock?: number | null;
};

type Props = {
    items?: ApiItem[];
    variant?: "special" | "selected" | "latest";
    title?: string;
    onlyDiscountProducts?: boolean;
    only_discount_products?: boolean;
    viewAllHref?: string;
    viewAllText?: string;
    layout?: "carousel" | "grid";
    showHeader?: boolean;
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

const getVisibleCount = (width: number) => {
    if (width >= 1280) return 5;
    if (width >= 1200) return 4;
    if (width >= 512) return 3; // 512-767 => 3 items
    if (width >= 368) return 2; // 368-511 => 2 items
    return 1; // <368 => 1 item
};

const defaultLatest: Product[] = [
    { id: 1, title: "Cilalama maşını 230mm 2200W Emtop", price: "130.00₼", imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
    { id: 2, title: "Cilalama maşını 230mm 2400W Emtop", price: "160.00₼", imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
    { id: 3, title: "Cilalama maşını 230mm 2600W Emtop", price: "170.00₼", imageUrl: "https://images.unsplash.com/photo-1581147036324-c1c1c3f4f7d8?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
    { id: 4, title: "Cilalama maşını 230mm 3000W Emtop", price: "190.00₼", imageUrl: "https://images.unsplash.com/photo-1604448002775-06fefb4774cb?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
    { id: 5, title: "Plasmas köşə 3m GLOSSY", price: "0.95₼", imageUrl: "https://images.unsplash.com/photo-1614632537423-8b599f26b0f7?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
];

const defaultSelected: Product[] = [
    { id: 1, title: "Fasad boya 10kq COLART", price: "26.00₼", imageUrl: "https://images.unsplash.com/photo-1581147036324-c1c1c3f4f7d8?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "yellow", productVariationId: null, isFavorited: false },
    { id: 2, title: "Razetka 1li RSb20-3-FSr kontaktlı Fors İEK", price: "7.00₼", imageUrl: "https://images.unsplash.com/photo-1611859266727-a398589ce572?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "yellow", productVariationId: null, isFavorited: false },
    { id: 3, title: "A9D31640 2x40A 30mA SCHNEIDER", price: "61.00₼", imageUrl: "https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "yellow", productVariationId: null, isFavorited: false },
    { id: 4, title: "TV ASILQAN YP-460 Yupiter", price: "32.00₼", imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "yellow", productVariationId: null, isFavorited: false },
    { id: 5, title: "Telefon yuvası K2 akrilik boz Aylex 1-79", price: "4.80₼", imageUrl: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=360&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
];

const defaultProducts: Product[] = [
    { id: 1, title: "Alət dəsti 96 parça Emtop EEDK09601", oldPrice: "87.00₼", price: "73.08₼", discount: "-16%", imageUrl: "https://images.unsplash.com/photo-1581147036324-c1c1c3f4f7d8?auto=format&fit=crop&w=420&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
    { id: 2, title: "Drel batareyalı 20V Emtop 118 ECDL6200118", oldPrice: "80.00₼", price: "64.80₼", discount: "-19%", imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=420&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
    { id: 3, title: "Mini moyka aparatı K2 Karcher 1.600-979.0", oldPrice: "199.00₼", price: "159.00₼", discount: "-20%", imageUrl: "https://images.unsplash.com/photo-1604448002775-06fefb4774cb?auto=format&fit=crop&w=420&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
    { id: 4, title: "Mini yuyucu aparatı universal K4 Karcher 1.679-300.0", oldPrice: "399.00₼", price: "299.00₼", discount: "-25%", imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=420&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
    { id: 5, title: "Yuyucu aparat K 5 Basic Karcher 1.180-580.0", oldPrice: "649.00₼", price: "499.00₼", discount: "-23%", imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=420&q=80", href: "#", cartVariant: "blue", productVariationId: null, isFavorited: false },
];

const ProductStrip: React.FC<Props> = ({
    items,
    variant = "latest",
    title,
    onlyDiscountProducts = false,
    only_discount_products = false,
    viewAllHref = "/discounts",
    viewAllText = "Bütün məhsullara bax",
    layout = "carousel",
    showHeader = true,
}) => {
    const notify = useNotify();
    const raw = Array.isArray(items) ? items : [];

    const products: Product[] = raw.length > 0
        ? raw.map((it: any, idx: number) => {
              const toNumber = (value: unknown) => {
                  const parsed = typeof value === "number" ? value : Number(value ?? NaN);
                  return Number.isFinite(parsed) ? parsed : null;
              };

              const variation = it?.product?.variation && typeof it.product.variation === "object"
                  ? it.product.variation
                  : null;

              const base = variation ?? it?.variation ?? it?.product ?? it;

              const resolvedId =
                  toNumber(base?.id) ??
                  toNumber(base?.product_id) ??
                  toNumber(it?.id) ??
                  toNumber(it?.product_id) ??
                  idx;

              const id = Number(resolvedId);

              const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
              const name =
                  toText(it?.name) ||
                  toText(it?.product?.variation?.name) ||
                  toText(it?.product?.name) ||
                  "Məhsul";

              const priceNum =
                  toNumber(base?.price) ??
                  toNumber(base?.sale_price) ??
                  toNumber(base?.final_price) ??
                  toNumber(base?.special) ??
                  toNumber(it?.price) ??
                  0;

              const oldNum =
                  toNumber(base?.old_price) ??
                  toNumber(base?.compare_price) ??
                  toNumber(base?.regular_price) ??
                  toNumber(it?.old_price) ??
                  undefined;

              const imageRaw =
                  (typeof base?.main_image === "string" ? base.main_image : "") ||
                  (typeof base?.main_image?.url === "string" ? base.main_image.url : "") ||
                  (typeof base?.main_image?.image_url === "string" ? base.main_image.image_url : "") ||
                  (typeof base?.image === "string" ? base.image : "") ||
                  (typeof base?.image?.url === "string" ? base.image.url : "") ||
                  (typeof base?.image?.image_url === "string" ? base.image.image_url : "") ||
                  (typeof base?.main_photo === "string" ? base.main_photo : "") ||
                  (typeof base?.gallery?.[0]?.url === "string" ? base.gallery[0].url : "") ||
                  (typeof base?.gallery?.[0]?.image_url === "string" ? base.gallery[0].image_url : "") ||
                  "";
              const image = typeof imageRaw === "string" ? imageRaw.trim().replace(/^`+|`+$/g, "").trim() : "";

              const normalizedSlug =
                  (typeof base?.slug === "string" ? base.slug.trim() : "") ||
                  (typeof it?.slug === "string" ? it.slug.trim() : "");

              const slug =
                  normalizedSlug ||
                  (base?.uuid ??
                  it?.uuid ??
                  id);

              const variationCandidate =
                  it.product_variation_id ??
                  it.variation_id ??
                  base?.variation_id ??
                  base?.product_variation_id ??
                  it.variation?.id ??
                  base?.id ??
                  it.id ??
                  null;
              const parsedVariationId = Number(variationCandidate);
              const productVariationId = Number.isFinite(parsedVariationId) && parsedVariationId > 0
                  ? parsedVariationId
                  : null;
              const isFavorited =
                  base?.is_favorite === true ||
                  base?.is_favourited === true ||
                  base?.is_favorited === true ||
                  base?.favorite === true ||
                  base?.in_favorites === true ||
                  it.is_favorite === true ||
                  it.is_favourited === true ||
                  it.is_favorited === true ||
                  it.favorite === true ||
                  it.in_favorites === true;
              const isCompared =
                  base?.is_compared === true ||
                  base?.is_compare === true ||
                  base?.compared === true ||
                  base?.in_compare === true ||
                  it.is_compared === true ||
                  it.is_compare === true ||
                  it.compared === true ||
                  it.in_compare === true;

              const stock =
                  toNumber(base?.body?.stock) ??
                  toNumber(base?.stock) ??
                  toNumber(base?.quantity) ??
                  toNumber(base?.qty) ??
                  toNumber(it?.body?.stock) ??
                  toNumber(it?.stock) ??
                  toNumber(it?.quantity) ??
                  toNumber(it?.qty);

              const cartVariant: "yellow" | "blue" = stock !== null && stock <= 0 ? "yellow" : "blue";

              if (variant === "special") {
                  const discount = oldNum && oldNum > 0 ? `-${Math.max(0, Math.round(100 * (1 - priceNum / oldNum)))}%` : "";
                  return {
                      id,
                      title: name,
                      oldPrice: oldNum ? formatPrice(oldNum) : undefined,
                      price: formatPrice(priceNum),
                      discount,
                      imageUrl: image,
                      href: `/product/${slug}`,
                      cartVariant,
                      productVariationId,
                      isFavorited,
                      isCompared,
                      stock,
                  } as Product;
              }

              if (variant === "selected") {
                  return {
                      id,
                      title: name,
                      price: formatPrice(priceNum),
                      oldPrice: oldNum ? formatPrice(oldNum) : undefined,
                      imageUrl: image,
                      href: `/product/${slug}`,
                      cartVariant,
                      productVariationId,
                      isFavorited,
                      isCompared,
                      stock,
                  } as Product;
              }

              // latest
              return {
                  id,
                  title: name,
                  price: formatPrice(priceNum),
                  imageUrl: image,
                  href: `/product/${slug}`,
                  cartVariant,
                  productVariationId,
                  isFavorited,
                  isCompared,
                  stock,
              } as Product;
          })
        : variant === "special"
        ? defaultProducts
        : variant === "selected"
        ? defaultSelected
        : defaultLatest;

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const preselectedFavoriteIds = useMemo(
        () => products
            .filter((product) => product.isFavorited && typeof product.productVariationId === "number")
            .map((product) => product.productVariationId as number),
        [products]
    );
    const preselectedFavoritesSignature = preselectedFavoriteIds.join(",");
    const preselectedCompareIds = useMemo(
        () => products
            .filter((product) => product.isCompared && typeof product.productVariationId === "number")
            .map((product) => product.productVariationId as number),
        [products]
    );
    const preselectedCompareSignature = preselectedCompareIds.join(",");
    const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set(preselectedFavoriteIds));
    const [favoritePendingIds, setFavoritePendingIds] = useState<Set<number>>(new Set());
    const [compareIds, setCompareIds] = useState<Set<number>>(new Set(preselectedCompareIds));
    const [comparePendingIds, setComparePendingIds] = useState<Set<number>>(new Set());
    const [visibleCount, setVisibleCountState] = useState<number>(1);
    const [index, setIndex] = useState<number>(0);
    const [useNativeTouchScroll, setUseNativeTouchScroll] = useState(false);
    const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);

    // Drag state (pointer-based) for all screen sizes
    const isDraggingRef = useRef(false);
    const isPointerDownRef = useRef(false);
    const startXRef = useRef(0);
    const dragOffsetRef = useRef(0);
    const suppressClickRef = useRef(false);
    const rafRef = useRef<number | null>(null);
    const navUnlockTimerRef = useRef<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isNavLocked, setIsNavLocked] = useState(false);
    // Navigation is handled only on the image/link now.

    useEffect(() => {
        if (preselectedFavoriteIds.length === 0) return;

        setFavoriteIds((prev) => {
            const next = new Set(prev);
            let changed = false;
            preselectedFavoriteIds.forEach((id) => {
                if (!next.has(id)) {
                    next.add(id);
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [preselectedFavoritesSignature]);

    useEffect(() => {
        if (preselectedCompareIds.length === 0) return;

        setCompareIds((prev) => {
            const next = new Set(prev);
            let changed = false;
            preselectedCompareIds.forEach((id) => {
                if (!next.has(id)) {
                    next.add(id);
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [preselectedCompareSignature]);

    useEffect(() => {
        let isMounted = true;

        const hydrateFavorites = async () => {
            try {
                const response = await listFavorites();
                if (!isMounted) return;

                const nextIds = new Set<number>();
                response.data.items.forEach((item) => {
                    const value = Number(item.product_variation_id);
                    if (Number.isFinite(value) && value > 0) {
                        nextIds.add(value);
                    }
                });

                setFavoriteIds((prev) => {
                    const merged = new Set<number>(nextIds);
                    preselectedFavoriteIds.forEach((id) => merged.add(id));

                    if (merged.size === prev.size && Array.from(merged).every((id) => prev.has(id))) {
                        return prev;
                    }

                    return merged;
                });
            } catch {
                // Silently ignore initial load failures; user can still toggle manually.
            }
        };

        void hydrateFavorites();

        return () => {
            isMounted = false;
        };
    }, [preselectedFavoritesSignature]);

    useEffect(() => {
        let isMounted = true;

        const hydrateCompare = async () => {
            try {
                const response = await listCompare();
                if (!isMounted) return;

                const nextIds = new Set<number>();
                response.data.items.forEach((item) => {
                    const value = Number(item.product_variation_id);
                    if (Number.isFinite(value) && value > 0) {
                        nextIds.add(value);
                    }
                });

                setCompareIds((prev) => {
                    const merged = new Set<number>(nextIds);
                    preselectedCompareIds.forEach((id) => merged.add(id));

                    if (merged.size === prev.size && Array.from(merged).every((id) => prev.has(id))) {
                        return prev;
                    }

                    return merged;
                });
            } catch {
                // Silently ignore initial load failures; user can still toggle manually.
            }
        };

        void hydrateCompare();

        return () => {
            isMounted = false;
        };
    }, [preselectedCompareSignature]);

    const handleFavoriteToggle = async (product: Product) => {
        const variationId = product.productVariationId;

        if (!variationId) {
            notify.error("Bu məhsul favorilərə əlavə edilə bilmədi.");
            return;
        }

        if (favoritePendingIds.has(variationId)) return;

        const wasFavorite = favoriteIds.has(variationId);

        setFavoritePendingIds((prev) => {
            const next = new Set(prev);
            next.add(variationId);
            return next;
        });

        setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (wasFavorite) next.delete(variationId);
            else next.add(variationId);
            return next;
        });

        try {
            const response = await toggleFavorite(variationId);

            setFavoriteIds((prev) => {
                const next = new Set(prev);
                if (response.data.action === "deleted") next.delete(variationId);
                else next.add(variationId);
                return next;
            });

            if (response.message) {
                notify.success(response.message);
            }
        } catch (error) {
            setFavoriteIds((prev) => {
                const next = new Set(prev);
                if (wasFavorite) next.add(variationId);
                else next.delete(variationId);
                return next;
            });

            const message = error instanceof Error ? error.message : "Favorilərə əlavə edilərkən xəta baş verdi.";
            notify.error(message);
        } finally {
            setFavoritePendingIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    const closeQuickOrderPopup = () => {
        setQuickOrderProduct(null);
    };

    const handleCompareToggle = async (product: Product) => {
        const variationId = product.productVariationId;

        if (!variationId) {
            notify.error("Bu məhsul müqayisəyə əlavə edilə bilmədi.");
            return;
        }

        if (comparePendingIds.has(variationId)) return;

        const wasCompared = compareIds.has(variationId);

        setComparePendingIds((prev) => {
            const next = new Set(prev);
            next.add(variationId);
            return next;
        });

        setCompareIds((prev) => {
            const next = new Set(prev);
            if (wasCompared) next.delete(variationId);
            else next.add(variationId);
            return next;
        });

        try {
            const response = await toggleCompare(variationId);

            setCompareIds((prev) => {
                const next = new Set(prev);
                if (response.data.action === "deleted") next.delete(variationId);
                else next.add(variationId);
                return next;
            });

            if (response.message) {
                notify.success(response.message);
            }
        } catch (error) {
            setCompareIds((prev) => {
                const next = new Set(prev);
                if (wasCompared) next.add(variationId);
                else next.delete(variationId);
                return next;
            });

            const message = error instanceof Error ? error.message : "Müqayisə yenilənərkən xəta baş verdi.";
            notify.error(message);
        } finally {
            setComparePendingIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    useEffect(() => {
        const update = () => setVisibleCountState(getVisibleCount(window.innerWidth));
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        const widthMq = window.matchMedia("(max-width: 1023.98px)");
        const coarseMq = window.matchMedia("(hover: none) and (pointer: coarse)");
        const update = () => {
            const hasTouchPoints = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
            const hasTouchEvent = typeof window !== "undefined" && "ontouchstart" in window;
            const isTouchDevice = coarseMq.matches || hasTouchPoints || hasTouchEvent;
            setUseNativeTouchScroll(widthMq.matches && isTouchDevice);
        };

        update();

        if (widthMq.addEventListener) widthMq.addEventListener("change", update);
        else widthMq.addListener(update);

        if (coarseMq.addEventListener) coarseMq.addEventListener("change", update);
        else coarseMq.addListener(update);

        return () => {
            if (widthMq.removeEventListener) widthMq.removeEventListener("change", update);
            else widthMq.removeListener(update);

            if (coarseMq.removeEventListener) coarseMq.removeEventListener("change", update);
            else coarseMq.removeListener(update);
        };
    }, []);

    const handleCartClick = async (product: Product) => {
        if (product.cartVariant !== "blue") {
            setQuickOrderProduct(product);
            return;
        }

        try {
            await addProductToCart({
                id: product.id,
                title: product.title,
                price: product.price,
                imageUrl: product.imageUrl,
                productVariationId: product.productVariationId ?? null,
                stock: product.stock,
            });

            const message = product.title
                ? `${product.title} səbətinizə müvəffəqiyyətlə əlavə edildi!`
                : "Məhsul səbətinizə müvəffəqiyyətlə əlavə edildi!";

            notify.success(message);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Səbətə əlavə edərkən xəta baş verdi.";
            notify.error(message);
        }
    };

    const getItemWidth = () => {
        const viewportWidth = viewportRef.current?.clientWidth ?? 0;
        const track = trackRef.current;
        const firstChild = track?.children[0] as HTMLElement | undefined;
        return firstChild ? firstChild.getBoundingClientRect().width : viewportWidth / visibleCount || viewportWidth;
    };

    const lockNavigation = (durationMs: number) => {
        if (navUnlockTimerRef.current != null) {
            window.clearTimeout(navUnlockTimerRef.current);
            navUnlockTimerRef.current = null;
        }
        setIsNavLocked(true);
        navUnlockTimerRef.current = window.setTimeout(() => {
            setIsNavLocked(false);
            navUnlockTimerRef.current = null;
        }, durationMs);
    };

    const updateTrackTransform = () => {
        if (useNativeTouchScroll) return;
        const track = trackRef.current;
        const viewport = viewportRef.current;
        if (!track || !viewport) return;
        const itemWidth = getItemWidth();
        const total = products.length;
        const maxIdx = Math.max(0, total - visibleCount);
        const minTranslate = -maxIdx * itemWidth;
        const baseTranslate = index * itemWidth;
        let translateX = -baseTranslate + (dragOffsetRef.current ?? 0);
        // clamp to avoid showing empty left/right whitespace
        translateX = Math.max(minTranslate, Math.min(translateX, 0));
        track.style.transform = `translate3d(${translateX}px,0,0)`;
        track.style.willChange = 'transform';
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (useNativeTouchScroll) return;
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        isPointerDownRef.current = true;
        startXRef.current = e.clientX;
        dragOffsetRef.current = 0;
        // don't set pointer capture yet — wait until movement threshold is crossed
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (useNativeTouchScroll) return;
        if (!isPointerDownRef.current) return;
        const dx = e.clientX - startXRef.current;
        dragOffsetRef.current = dx;
        // start dragging only after threshold to allow clicks
        if (!isDraggingRef.current && Math.abs(dx) > 8) {
            isDraggingRef.current = true;
            setIsDragging(true);
            // disable transition while dragging
            if (trackRef.current) trackRef.current.style.transition = 'none';
            try {
                (e.currentTarget as Element).setPointerCapture(e.pointerId);
            } catch {}
        }
        if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(() => {
                updateTrackTransform();
                rafRef.current = null;
            });
        }
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        if (useNativeTouchScroll) return;
        // always clear pointer-down state
        isPointerDownRef.current = false;
        if (!isDraggingRef.current) return; // no drag happened
        isDraggingRef.current = false;
        setIsDragging(false);
        try {
            (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        } catch {}
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        const itemWidth = getItemWidth();
        const total = products.length;
        const maxIdx = Math.max(0, total - visibleCount);
        const minTranslate = -maxIdx * itemWidth;
        const baseTranslate = index * itemWidth;
        let translateX = -baseTranslate + (dragOffsetRef.current ?? 0);
        // clamp translate to valid range and compute final index from that
        translateX = Math.max(minTranslate, Math.min(translateX, 0));
        const targetIndex = Math.min(maxIdx, Math.max(0, Math.round(-translateX / itemWidth)));
        setIndex(targetIndex);

        // determine whether a real drag occurred (use larger threshold to avoid jitter)
        const didDrag = Math.abs(dragOffsetRef.current) > 8;
        suppressClickRef.current = didDrag;

        dragOffsetRef.current = 0;
        // restore transition so index change animates
        if (trackRef.current) trackRef.current.style.transition = 'transform 300ms ease-in-out';
        setTimeout(() => (suppressClickRef.current = false), 50);
    };

    const onNativeScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!useNativeTouchScroll) return;
        if (isNavLocked) return;
        const itemWidth = getItemWidth();
        if (!itemWidth) return;
        const nextIndex = Math.round(e.currentTarget.scrollLeft / itemWidth);
        const maxIdx = Math.max(0, products.length - visibleCount);
        const clamped = Math.min(maxIdx, Math.max(0, nextIndex));
        if (clamped !== index) setIndex(clamped);
    };

    // click suppression is handled per-Link to avoid capture-phase blocking

    const maxIndex = Math.max(0, products.length - visibleCount);

    useEffect(() => {
        if (index > maxIndex) setIndex(maxIndex);
    }, [maxIndex, index]);

    const prev = () => {
        if (isNavLocked) return;
        const target = Math.max(0, index - 1);
        if (target === index) return;
        lockNavigation(useNativeTouchScroll ? 380 : 320);
        setIndex(target);
        if (useNativeTouchScroll && viewportRef.current) {
            const itemWidth = getItemWidth();
            viewportRef.current.scrollTo({ left: target * itemWidth, behavior: "smooth" });
        }
    };

    const next = () => {
        if (isNavLocked) return;
        const target = Math.min(maxIndex, index + 1);
        if (target === index) return;
        lockNavigation(useNativeTouchScroll ? 380 : 320);
        setIndex(target);
        if (useNativeTouchScroll && viewportRef.current) {
            const itemWidth = getItemWidth();
            viewportRef.current.scrollTo({ left: target * itemWidth, behavior: "smooth" });
        }
    };

    const pageCount = Math.max(1, maxIndex + 1);

    const headingClass = "text-[30px] sm:text-[46px]";

    const showViewAll = !!(onlyDiscountProducts || only_discount_products);

    // Sync DOM transform when index or visible count changes (animated)
    React.useEffect(() => {
        const track = trackRef.current;
        const viewport = viewportRef.current;
        if (!track || !viewport) return;
        if (useNativeTouchScroll) {
            track.style.transition = "none";
            track.style.transform = "translate3d(0,0,0)";
            return;
        }
        if (isDraggingRef.current) return; // don't override while dragging
        const itemWidth = getItemWidth();
        const baseTranslate = index * itemWidth;
        track.style.transition = 'transform 300ms ease-in-out';
        track.style.transform = `translate3d(${-baseTranslate}px,0,0)`;
    }, [index, visibleCount, useNativeTouchScroll]);

    // Cleanup RAF on unmount
    React.useEffect(() => {
        return () => {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            if (navUnlockTimerRef.current != null) {
                window.clearTimeout(navUnlockTimerRef.current);
                navUnlockTimerRef.current = null;
            }
        };
    }, []);

    const renderCard = (product: Product, opts: { dragging: boolean }) => {
        const isFavorite = typeof product.productVariationId === "number" && favoriteIds.has(product.productVariationId);
        const isFavoritePending = typeof product.productVariationId === "number" && favoritePendingIds.has(product.productVariationId);
        const isCompared = typeof product.productVariationId === "number" && compareIds.has(product.productVariationId);
        const isComparePending = typeof product.productVariationId === "number" && comparePendingIds.has(product.productVariationId);

        return (
            <article
                className={`group relative flex flex-col items-center justify-center rounded-[14px] border border-[#e2e6ef] bg-white px-3 pb-4 pt-3 max-[512px]:pt-4 max-[512px]:pb-5 text-center transition-transform duration-200 ease-out hover:z-10 hover:-translate-y-1 shadow-none select-none ${opts.dragging ? "cursor-grabbing" : "cursor-pointer"}`}
            >
                <div className="absolute top-3 left-3 z-[3] flex flex-col items-center gap-2">
                    <button
                        type="button"
                        disabled={isFavoritePending || !product.productVariationId}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleFavoriteToggle(product);
                        }}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                            isFavorite
                                ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                                : "border-[#e0e5ee] bg-white text-[#7b8596] hover:bg-[#0f57d6] hover:text-white"
                        } ${isFavoritePending || !product.productVariationId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        aria-label="Seçilmişlər"
                    >
                        <i className={`${isFavorite ? "fa-solid" : "far"} fa-heart text-[14px] leading-none`} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        disabled={isComparePending || !product.productVariationId}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleCompareToggle(product);
                        }}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                            isCompared
                                ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                                : "border-[#e0e5ee] bg-white text-[#7b8596] hover:bg-[#0f57d6] hover:text-white"
                        } ${isComparePending || !product.productVariationId ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        aria-label="Müqayisə"
                    >
                        <i className="fa-solid fa-code-compare text-[14px] leading-none" aria-hidden="true" />
                    </button>
                </div>

                {product.discount ? (
                    <span className="absolute top-4 right-4 z-[2] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2e43] text-[14px] leading-none font-bold text-white">
                        {product.discount}
                    </span>
                ) : null}

                <div className="pt-3 text-center w-full flex flex-col items-center">
                    <Link href={product.href} className="block w-full">
                        <div className={`product-thumb mx-auto mt-2 flex items-center justify-center ${variant === "special" ? "h-[120px] sm:h-[145px] max-[512px]:h-[160px]" : "h-[135px] sm:h-[150px] max-[512px]:h-[160px]"} w-full max-w-[150px] overflow-hidden rounded-[10px]`}>
                            {product.imageUrl ? (
                                <img draggable={false} src={product.imageUrl} alt={product.title} className={`${variant === "special" ? "h-full w-full object-cover" : "h-full w-full object-contain"} transition-transform duration-200 ease-out`} loading="lazy" />
                            ) : null}
                        </div>
                        <h3 className="hoopz-thumb__name mt-3">{product.title}</h3>
                    </Link>

                    <div className="mt-2 flex items-center justify-center gap-1">
                        <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                        <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                        <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                        <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                        <i className="far fa-star text-[#d2d7e2] text-[18px]" aria-hidden="true" />
                    </div>

                    <div className="price mt-2 text-center">
                        {product.oldPrice ? <span className="price-old block mb-1">{product.oldPrice}</span> : null}
                        <span className="price-new block text-[24px] font-bold" style={{ color: product.oldPrice ? "#ff0000" : "#000000" }}>
                            {product.price}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleCartClick(product);
                        }}
                        className={`relative z-[2] mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full cursor-pointer ${product.cartVariant === "blue" ? "bg-[#0f57d6] text-white" : "bg-[#ffd500] text-[#1b212e]"}`}
                        aria-label={product.cartVariant === "blue" ? "Səbətə əlavə et" : "Məhsul stokda yoxdur"}
                    >
                        {product.cartVariant === "blue" ? (
                            <i className="fas fa-shopping-cart text-white" aria-hidden="true" />
                        ) : (
                            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M1.25 6V3.25C1.25 2.14543 2.14543 1.25 3.25 1.25H5" stroke="#1b212e" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 1.25H12.75C13.8546 1.25 14.75 2.14543 14.75 3.25V12.75C14.75 13.8546 13.8546 14.75 12.75 14.75H3.25C2.14543 14.75 1.25 13.8546 1.25 12.75V6" stroke="#1b212e" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 1.25V9.1" stroke="#1b212e" strokeWidth="0.9" strokeLinecap="round" />
                                <path d="M5.9 7.7L8 9.8L10.1 7.7" stroke="#1b212e" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                </div>
            </article>
        );
    };

    if (layout === "grid") {
        return (
            <>
                <div className="product-carousel">
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                        {products.map((product) => (
                            <li key={product.id}>{renderCard(product, { dragging: false })}</li>
                        ))}
                    </ul>
                </div>

                <QuickOrderPopup
                    isOpen={Boolean(quickOrderProduct)}
                    productTitle={quickOrderProduct?.title ?? ""}
                    productCode={quickOrderProduct ? String(quickOrderProduct.id) : ""}
                    onClose={closeQuickOrderPopup}
                />
            </>
        );
    }

    return (
        <>
        <section className="w-full product-carousel">
                <div className="mx-auto w-full max-w-[1280px] px-0">
                {showHeader ? (
                    <div className="mb-0 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
                        <h2 className={`${headingClass} leading-tight font-bold text-[#1f2328]`}>{title ?? (variant === "special" ? "Xüsusi endirimlər" : variant === "selected" ? "Sizin üçün seçdiklərimiz" : "Son məhsullar")}</h2>

                        <div className="flex items-center gap-3">
                            {showViewAll ? (
                                <Link href={viewAllHref} className="text-base font-medium text-[#0f57d6] hover:underline mr-2">
                                    {viewAllText}
                                </Link>
                            ) : null}
                            <button
                                type="button"
                                onClick={prev}
                                disabled={index === 0 || isNavLocked}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#c7d4ea] bg-white text-[#1c2536] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Əvvəlki"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
                                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <span className="text-[16px] font-medium text-[#1f2328]">{index + 1} / {pageCount}</span>
                            <button
                                type="button"
                                onClick={next}
                                disabled={index >= maxIndex || isNavLocked}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#c7d4ea] bg-white text-[#1c2536] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                aria-label="Növbəti"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
                                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="relative">
                    <div
                        ref={viewportRef}
                        className={useNativeTouchScroll ? "overflow-x-auto overflow-y-hidden py-3 px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "overflow-hidden py-3 px-0"}
                        onPointerDown={!useNativeTouchScroll ? onPointerDown : undefined}
                        onPointerMove={!useNativeTouchScroll ? onPointerMove : undefined}
                        onPointerUp={!useNativeTouchScroll ? endDrag : undefined}
                        onPointerCancel={!useNativeTouchScroll ? endDrag : undefined}
                        onPointerLeave={!useNativeTouchScroll ? endDrag : undefined}
                        onScroll={useNativeTouchScroll ? onNativeScroll : undefined}
                        style={useNativeTouchScroll ? { touchAction: "auto", WebkitOverflowScrolling: "touch" } : undefined}
                    >
                        <div
                            ref={trackRef}
                            className={`flex ${!useNativeTouchScroll && isDragging ? "transition-none" : "transition-transform duration-300 ease-in-out"} -mx-2 sm:-mx-3`}
                        >
                            {products.map((product) => (
                                <div key={product.id} style={{ flex: `0 0 ${100 / visibleCount}%` }} className="box-border px-2 sm:px-3">
                                    {renderCard(product, { dragging: isDragging })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <QuickOrderPopup
            isOpen={Boolean(quickOrderProduct)}
            productTitle={quickOrderProduct?.title ?? ""}
            productCode={quickOrderProduct ? String(quickOrderProduct.id) : ""}
            productVariationId={quickOrderProduct?.productVariationId ?? null}
            onClose={closeQuickOrderPopup}
        />
        
        </>
    );
};

export { ProductStrip };
