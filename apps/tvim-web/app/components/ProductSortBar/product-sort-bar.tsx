import { PendingLink } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";
import { getTranslations } from "@/lib/i18n";
import { getProductSortOptions, type ProductSortKey } from "@/lib/product-sort";

type ProductSortBarProps = {
    locale: string;
    /** Currently applied sort key. */
    activeSort: ProductSortKey;
    /** Query string of the current page, used as the base for every sort link. */
    currentParams: string;
    /** Path the sort links point to, without a query string. */
    basePath: string;
};

const isPriceKey = (key: string) => key === "price_asc" || key === "price_desc";

/**
 * Sort bar shared by the category, search and brand listings. The two price
 * options are collapsed into a single button that toggles between ascending and
 * descending, with an arrow showing the direction currently applied.
 */
export function ProductSortBar({ locale, activeSort, currentParams, basePath }: ProductSortBarProps) {
    const labels = getTranslations(locale).search.sort;

    type SortButton = {
        id: string;
        label: string;
        ariaLabel?: string;
        targetKey: ProductSortKey;
        isActive: boolean;
        priceDirection?: "asc" | "desc";
    };

    const buttons: SortButton[] = [];
    let priceButtonPlaced = false;

    for (const option of getProductSortOptions(locale)) {
        if (isPriceKey(option.key)) {
            if (priceButtonPlaced) continue;
            priceButtonPlaced = true;

            const currentDirection = activeSort === "price_desc" ? "desc" : "asc";
            buttons.push({
                id: "price",
                label: labels.price,
                ariaLabel: currentDirection === "desc" ? labels.priceDesc : labels.priceAsc,
                targetKey: activeSort === "price_asc" ? "price_desc" : "price_asc",
                isActive: isPriceKey(activeSort),
                priceDirection: currentDirection,
            });
            continue;
        }

        buttons.push({
            id: option.key,
            label: option.label,
            targetKey: option.key,
            isActive: option.key === activeSort,
        });
    }

    const buildHref = (targetKey: ProductSortKey) => {
        const next = new URLSearchParams(currentParams);
        next.set("page", "1");
        next.set("sort", targetKey);
        const qs = next.toString();
        return qs ? `${basePath}?${qs}` : basePath;
    };

    return (
        <div className="relative z-30 mb-4 flex min-h-[64px] flex-nowrap items-center gap-3 overflow-x-auto rounded-[16px] border border-[#eee] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {buttons.map((button) => (
                <PendingLink
                    key={button.id}
                    href={buildHref(button.targetKey)}
                    aria-label={button.ariaLabel}
                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-[9px] px-4 py-2 text-center text-[14px] transition-colors ${button.isActive
                            ? "bg-[#0f57d6] font-semibold text-white"
                            : "bg-[#f7f8fa] font-medium text-[#4b5565] hover:bg-[#eef1f5]"
                        }`}
                >
                    {button.label}
                    {button.priceDirection ? (
                        <i
                            className={`fa-solid ${button.priceDirection === "desc"
                                    ? "fa-arrow-down-wide-short"
                                    : "fa-arrow-up-short-wide"
                                } text-[13px]`}
                            aria-hidden="true"
                        />
                    ) : null}
                </PendingLink>
            ))}
        </div>
    );
}
