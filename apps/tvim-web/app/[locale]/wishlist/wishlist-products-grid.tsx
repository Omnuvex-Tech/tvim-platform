"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotify } from "@repo/ui";
import { toggleFavorite } from "@/lib/favorites/client";

type FavoriteListItem = {
    id: number;
    name: string;
    price: number;
    old_price?: number;
    main_image?: string;
    slug?: string;
    product_variation_id?: number | null;
    is_favorite: true;
};

type Props = {
    locale: string;
    initialItems: FavoriteListItem[];
};

const formatPrice = (value: number) => `${value.toFixed(2)}₼`;

export function WishlistProductsGrid({ locale, initialItems }: Props) {
    const notify = useNotify();
    const [items, setItems] = useState<FavoriteListItem[]>(initialItems);
    const [pendingVariationIds, setPendingVariationIds] = useState<Set<number>>(new Set());

    const handleRemoveFromFavorites = async (item: FavoriteListItem) => {
        const variationId = item.product_variation_id;

        if (!variationId || !Number.isFinite(variationId)) {
            notify.error("Bu məhsul favorilərdən silinə bilmədi.");
            return;
        }

        if (pendingVariationIds.has(variationId)) {
            return;
        }

        setPendingVariationIds((prev) => {
            const next = new Set(prev);
            next.add(variationId);
            return next;
        });

        try {
            const response = await toggleFavorite(variationId);

            if (response.data.action === "deleted") {
                setItems((prev) => prev.filter((entry) => entry.product_variation_id !== variationId));
            }

            if (response.message) {
                notify.success(response.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Favorilər yenilənərkən xəta baş verdi.";
            notify.error(message);
        } finally {
            setPendingVariationIds((prev) => {
                const next = new Set(prev);
                next.delete(variationId);
                return next;
            });
        }
    };

    if (items.length === 0) {
        return (
            <div className="rounded-[24px] bg-[#f7f7f7] px-7 py-4 text-left text-[16px] leading-normal font-normal text-black">
                Sizin bəyənilənlər boşdur.
            </div>
        );
    }

    return (
        <div className="product-carousel">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((item) => {
                    const itemKey = `${item.id}-${item.product_variation_id ?? "no-variation"}`;
                    const href = item.slug
                        ? `/${locale}/products/${String(item.slug).replace(/^\/+/, "")}`
                        : null;
                    const variationId = item.product_variation_id;
                    const isFavoritePending = typeof variationId === "number" && pendingVariationIds.has(variationId);

                    const media = (
                        <>
                            <div className="product-thumb mx-auto mt-2 flex h-[135px] w-full max-w-[150px] items-center justify-center overflow-hidden rounded-[10px] sm:h-[150px] max-[512px]:h-[160px]">
                                {item.main_image ? (
                                    <img
                                        src={item.main_image}
                                        alt={item.name}
                                        className="h-full w-full object-contain transition-transform duration-200 ease-out"
                                        loading="lazy"
                                    />
                                ) : null}
                            </div>
                            <h3 className="hoopz-thumb__name mt-3">{item.name}</h3>
                        </>
                    );

                    return (
                        <li key={itemKey}>
                            <article className="group relative flex h-full flex-col items-center justify-center rounded-[14px] border border-[#e2e6ef] bg-white px-3 pb-4 pt-3 text-center transition-transform duration-200 ease-out hover:z-10 hover:-translate-y-1 shadow-none max-[512px]:pb-5 max-[512px]:pt-4">
                                <div className="absolute top-3 left-3 z-[3] flex flex-col items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={isFavoritePending || !variationId}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            void handleRemoveFromFavorites(item);
                                        }}
                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-150 ${
                                            isFavoritePending || !variationId
                                                ? "border-[#0f57d6] bg-[#0f57d6] text-white cursor-not-allowed opacity-70"
                                                : "border-[#0f57d6] bg-[#0f57d6] text-white cursor-pointer"
                                        }`}
                                        aria-label="Seçilmişlərdən sil"
                                    >
                                        <i className="fa-solid fa-heart text-[14px] leading-none" aria-hidden="true" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            notify.success("Müqayisə funksiyası tezliklə əlavə ediləcək.");
                                        }}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e0e5ee] bg-white text-[#7b8596] transition-colors duration-150 hover:bg-[#0f57d6] hover:text-white cursor-pointer"
                                        aria-label="Müqayisə"
                                    >
                                        <i className="fa-solid fa-code-compare text-[14px] leading-none" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="flex w-full flex-col items-center pt-3 text-center">
                                    {href ? (
                                        <Link href={href} className="block w-full">
                                            {media}
                                        </Link>
                                    ) : (
                                        <div className="block w-full">{media}</div>
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
                                            <span className="price-old mb-1 block">{formatPrice(item.old_price)}</span>
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
                                        className="relative z-[2] mt-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#0f57d6] text-white"
                                        aria-label="Səbətə əlavə et"
                                    >
                                        <i className="fas fa-shopping-cart text-white" aria-hidden="true" />
                                    </button>
                                </div>
                            </article>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
