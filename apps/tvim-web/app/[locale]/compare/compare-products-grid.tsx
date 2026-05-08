"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useNotify } from "@repo/ui";
import type { CompareListItem } from "./page";
import { toggleCompare } from "@/lib/compare/client";
import { toggleFavorite } from "@/lib/favorites/client";

type Props = {
    locale: string;
    initialItems: CompareListItem[];
    copy: {
        onlyDifferentLabel: string;
        emptyState: string;
        orderButton: string;
        noDifferentSpecs: string;
        removeCompareFailed: string;
        favoriteToggleFailed: string;
    };
};

const formatPrice = (value: number) => `${value.toFixed(2)}₼`;

const normalizeCompareValue = (value: string) => value.trim().toLowerCase();

const getSpecValue = (item: CompareListItem, label: string) => item.specs.find((spec) => spec.label === label)?.value || "-";

const getUniqueSpecLabels = (items: CompareListItem[]) => Array.from(new Set(items.flatMap((item) => item.specs.map((spec) => spec.label))));

export function CompareProductsGrid({ locale, initialItems, copy }: Props) {
    const notify = useNotify();
    const [items, setItems] = useState<CompareListItem[]>(initialItems);
    const [showOnlyDifferent, setShowOnlyDifferent] = useState(false);
    const [pendingCompareVariationIds, setPendingCompareVariationIds] = useState<Set<number>>(new Set());
    const [pendingFavoriteVariationIds, setPendingFavoriteVariationIds] = useState<Set<number>>(new Set());

    const allSpecLabels = useMemo(() => getUniqueSpecLabels(items), [items]);

    const [columnWidth, setColumnWidth] = useState<number>(280);
    const [isDesktop, setIsDesktop] = useState<boolean>(false);

    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            if (w < 640) setColumnWidth(220);
            else if (w < 1024) setColumnWidth(260);
            else setColumnWidth(280);
            setIsDesktop(w >= 1024);
        };

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const visibleSpecLabels = useMemo(() => {
        if (!showOnlyDifferent) {
            return allSpecLabels;
        }

        return allSpecLabels.filter((label) => {
            const valueSet = new Set(items.map((item) => normalizeCompareValue(getSpecValue(item, label))));
            return valueSet.size > 1;
        });
    }, [allSpecLabels, items, showOnlyDifferent]);

    const handleRemoveFromCompare = async (item: CompareListItem) => {
        const variationId = item.product_variation_id;

        if (!variationId || !Number.isFinite(variationId)) {
            notify.error(copy.removeCompareFailed);
            return;
        }

        if (pendingCompareVariationIds.has(variationId)) {
            return;
        }

        setPendingCompareVariationIds((prev) => {
            const next = new Set(prev);
            next.add(variationId);
            return next;
        });

        try {
            const response = await toggleCompare(variationId);

            if (response.data.action === "deleted") {
                setItems((prev) => prev.filter((entry) => entry.product_variation_id !== variationId));
            }

            if (response.message) {
                notify.success(response.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : copy.removeCompareFailed;
            notify.error(message);
        } finally {
            setPendingCompareVariationIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    const handleToggleFavorite = async (item: CompareListItem) => {
        const variationId = item.product_variation_id;

        if (!variationId || !Number.isFinite(variationId)) {
            notify.error(copy.favoriteToggleFailed);
            return;
        }

        if (pendingFavoriteVariationIds.has(variationId)) {
            return;
        }

        setPendingFavoriteVariationIds((prev) => {
            const next = new Set(prev);
            next.add(variationId);
            return next;
        });

        try {
            const response = await toggleFavorite(variationId);

            setItems((prev) => prev.map((entry) => {
                if (entry.product_variation_id !== variationId) {
                    return entry;
                }

                if (response.data.action === "created") {
                    return { ...entry, is_favorite: true };
                }

                if (response.data.action === "deleted") {
                    return { ...entry, is_favorite: false };
                }

                return entry;
            }));

            if (response.message) {
                notify.success(response.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : copy.favoriteToggleFailed;
            notify.error(message);
        } finally {
            setPendingFavoriteVariationIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    if (items.length === 0) {
        return (
            <div className="rounded-[24px] bg-[#f7f7f7] px-7 py-4 text-left text-[16px] leading-normal font-normal text-black">
                {copy.emptyState}
            </div>
        );
    }

    return (
        <>
            <label className="mb-[15px] inline-flex cursor-pointer select-none items-center gap-2 pl-2.5 font-[500] text-[#888]">
                <input
                    type="checkbox"
                    checked={showOnlyDifferent}
                    onChange={(event) => setShowOnlyDifferent(event.target.checked)}
                    className="h-4 w-4 cursor-pointer appearance-none rounded-[3px] border border-[#c8cfdd] bg-white bg-center bg-no-repeat transition-all duration-150 hover:border-[1.5px] hover:border-[#6f7b95] checked:border-[#2050f5] checked:bg-[#2050f5]"
                    style={showOnlyDifferent
                        ? {
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'none\' stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M3.5 8.5 6.5 11.5 12.5 4.5\'/%3E%3C/svg%3E")',
                            backgroundSize: "12px 12px",
                        }
                        : undefined}
                />
                {copy.onlyDifferentLabel}
            </label>

            {showOnlyDifferent && visibleSpecLabels.length === 0 ? (
                <div className="mb-4 rounded-[12px] border border-[#e4e8ef] bg-[#f8f9fb] px-4 py-3 text-[14px] font-medium text-[#5f6878]">
                    {copy.noDifferentSpecs}
                </div>
            ) : null}

            <div className="mt-0 overflow-x-auto">
                <div
                    className="grid gap-0 mx-auto"
                    style={(() => {
                        if (isDesktop) {
                            return {
                                gridTemplateColumns: `repeat(${items.length}, 1fr)`,
                                width: "100%",
                            } as React.CSSProperties;
                        }

                        return {
                            gridTemplateColumns: `repeat(${items.length}, ${columnWidth}px)`,
                            minWidth: `${items.length * columnWidth}px`,
                        } as React.CSSProperties;
                    })()}
                >
                    {items.map((item, index) => {
                        const itemKey = `${item.id}-${item.product_variation_id}`;
                        const href = item.slug
                            ? `/${locale}/products/${String(item.slug).replace(/^\/+/, "")}`
                            : null;
                        const isComparePending = pendingCompareVariationIds.has(item.product_variation_id);
                        const isFavoritePending = pendingFavoriteVariationIds.has(item.product_variation_id);
                        const isFavorited = item.is_favorite === true;

                        return (
                            <article
                                key={itemKey}
                                className={`group relative flex h-full flex-col rounded-none border border-[#e2e6ef] bg-white px-3 pb-4 pt-3 text-center ${index > 0 ? "-ml-px" : ""}`}
                            >
                                {typeof item.discount_percent === "number" && item.discount_percent > 0 ? (
                                    <span className="absolute top-4 right-4 z-[2] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2e43] text-[14px] leading-none font-bold text-white">
                                        -{item.discount_percent}%
                                    </span>
                                ) : null}

                                <div className="relative px-1 pt-2 pb-1 text-center">
                                    <div className="absolute left-2 top-2 z-[3] flex flex-col items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={isComparePending}
                                            onClick={() => void handleRemoveFromCompare(item)}
                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                                                isComparePending
                                                    ? "border-[#0f57d6] bg-[#0f57d6] text-white cursor-not-allowed opacity-70"
                                                    : "border-[#0f57d6] bg-[#0f57d6] text-white cursor-pointer"
                                            }`}
                                            aria-label="remove-compare-item"
                                        >
                                            <i className="fa-regular fa-trash-can text-[14px] leading-none" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isFavoritePending}
                                            onClick={() => void handleToggleFavorite(item)}
                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                                                isFavoritePending
                                                    ? isFavorited
                                                        ? "border-[#0f57d6] bg-[#0f57d6] text-white cursor-not-allowed opacity-70"
                                                        : "border-[#e0e5ee] bg-white text-[#7b8596] cursor-not-allowed opacity-70"
                                                    : isFavorited
                                                        ? "border-[#0f57d6] bg-[#0f57d6] text-white cursor-pointer"
                                                        : "border-[#e0e5ee] bg-white text-[#7b8596] cursor-pointer hover:bg-[#0f57d6] hover:text-white"
                                            }`}
                                            aria-label="toggle-favorite-item"
                                        >
                                            <i className={`${isFavorited ? "fa-solid" : "fa-regular"} fa-heart text-[14px] leading-none`} aria-hidden="true" />
                                        </button>
                                    </div>

                                    {href ? (
                                        <Link href={href} className="block w-full">
                                            <span className="mx-auto mt-2 inline-flex h-[150px] w-full max-w-[165px] items-center justify-center overflow-hidden rounded-none">
                                                {item.main_image ? (
                                                    <img src={item.main_image} alt={item.name} className="h-full w-full object-contain" />
                                                ) : null}
                                            </span>
                                            <span className="hoopz-thumb__name mt-3 line-clamp-2 block min-h-[44px]">{item.name}</span>
                                        </Link>
                                    ) : (
                                        <div className="w-full">
                                            <span className="mx-auto mt-2 inline-flex h-[150px] w-full max-w-[165px] items-center justify-center overflow-hidden rounded-none">
                                                {item.main_image ? (
                                                    <img src={item.main_image} alt={item.name} className="h-full w-full object-contain" />
                                                ) : null}
                                            </span>
                                            <span className="hoopz-thumb__name mt-3 line-clamp-2 block min-h-[44px]">{item.name}</span>
                                        </div>
                                    )}

                                    <div className="mt-2 flex items-center justify-center gap-1">
                                        <i className="far fa-star text-[18px] text-[#d2d7e2]" aria-hidden="true" />
                                        <i className="far fa-star text-[18px] text-[#d2d7e2]" aria-hidden="true" />
                                        <i className="far fa-star text-[18px] text-[#d2d7e2]" aria-hidden="true" />
                                        <i className="far fa-star text-[18px] text-[#d2d7e2]" aria-hidden="true" />
                                        <i className="far fa-star text-[18px] text-[#d2d7e2]" aria-hidden="true" />
                                    </div>

                                    <div className="price mt-2 text-center">
                                        {typeof item.old_price === "number" && item.old_price > item.price ? (
                                            <span
                                                className="price-old mb-1 block text-center"
                                                style={{ fontSize: "14px", fontWeight: 500, color: "#888888", textDecoration: "line-through", margin: 0, width: "100%", textAlign: "center" }}
                                            >
                                                {formatPrice(item.old_price)}
                                            </span>
                                        ) : null}
                                        <span
                                            className="price-new block text-[24px] font-bold"
                                            style={{ color: typeof item.old_price === "number" && item.old_price > item.price ? "#ff0000" : "#000000" }}
                                        >
                                            {formatPrice(item.price)}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="relative z-[2] my-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0f57d6] text-white cursor-pointer"
                                        aria-label="Səbətə əlavə et"
                                    >
                                        <i className="fas fa-shopping-cart text-white" aria-hidden="true" />
                                    </button>
                                </div>

                                <div>
                                    {visibleSpecLabels.map((label) => {
                                        const specValue = getSpecValue(item, label);

                                        return (
                                            <div key={`${item.id}-${label}`} className="border-t border-[#e8ecf3] px-4 py-3 text-left">
                                                <p className="text-[12px] font-semibold text-[#9aa3b5]">{label}</p>
                                                <p className="mt-1 text-[14px] font-semibold text-[#1f2328]">{specValue}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
