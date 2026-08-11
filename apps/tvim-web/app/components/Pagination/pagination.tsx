import { PendingLink } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";

type PaginationToken = number | "ellipsis";

type PaginationVariant = "default" | "accent";

type PaginationProps = {
    currentPage: number;
    lastPage: number;
    buildHref: (page: number) => string;
    className?: string;
    variant?: PaginationVariant;
};

const VARIANT_STYLES: Record<PaginationVariant, {
    arrow: string;
    page: string;
    activePage: string;
    ellipsis: string;
    gap: string;
}> = {
    default: {
        arrow: "h-9 w-9 rounded-full border border-[#e5e7eb] bg-white text-[#111318] hover:bg-[#f5f7fb] sm:h-10 sm:w-10",
        page: "h-9 w-9 rounded-full border border-[#e5e7eb] bg-white text-[13px] font-semibold text-[#111318] hover:bg-[#f5f7fb] sm:h-10 sm:w-10 sm:text-[14px]",
        activePage: "h-9 w-9 rounded-full border border-[#0f57d6] bg-[#0f57d6] text-[13px] font-semibold text-white sm:h-10 sm:w-10 sm:text-[14px]",
        ellipsis: "h-9 w-9 text-[16px] text-[#8b97a9] sm:h-10 sm:w-10",
        gap: "gap-2 sm:gap-3",
    },
    accent: {
        arrow: "h-[46px] w-[46px] rounded-[20px] bg-white font-bold text-black",
        page: "h-[46px] w-[46px] rounded-[20px] bg-white font-bold text-black",
        activePage: "h-[46px] w-[46px] rounded-[20px] bg-[#ffda00] font-bold text-black",
        ellipsis: "h-[46px] w-[46px] text-[#888]",
        gap: "gap-[10px]",
    },
};

const buildPaginationTokens = (currentPage: number, lastPage: number): PaginationToken[] => {
    if (lastPage <= 1) return [1];
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const tokens: PaginationToken[] = [1];
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(lastPage - 1, currentPage + 1);

    if (currentPage <= 3) {
        start = 2;
        end = 4;
    }

    if (currentPage >= lastPage - 2) {
        start = lastPage - 3;
        end = lastPage - 1;
    }

    if (start > 2) {
        tokens.push("ellipsis");
    }

    for (let page = start; page <= end; page += 1) {
        if (page > 1 && page < lastPage) {
            tokens.push(page);
        }
    }

    if (end < lastPage - 1) {
        tokens.push("ellipsis");
    }

    tokens.push(lastPage);
    return tokens;
};

function Pagination({
    currentPage,
    lastPage,
    buildHref,
    className = "",
    variant = "default",
}: PaginationProps) {
    if (lastPage <= 1) return null;

    const safeCurrentPage = Math.max(1, Math.min(currentPage, lastPage));
    const tokens = buildPaginationTokens(safeCurrentPage, lastPage);
    const styles = VARIANT_STYLES[variant];

    return (
        <div className={`mt-8 flex flex-wrap items-center justify-center ${styles.gap} ${className}`.trim()}>
            <PendingLink
                href={buildHref(Math.max(1, safeCurrentPage - 1))}
                aria-disabled={safeCurrentPage <= 1}
                className={`inline-flex items-center justify-center transition-colors duration-150 ease-linear ${styles.arrow} ${
                    safeCurrentPage <= 1 ? "pointer-events-none opacity-40" : ""
                }`}
            >
                <i className="fa-solid fa-chevron-left text-[12px]" />
            </PendingLink>

            {tokens.map((token, idx) => {
                if (token === "ellipsis") {
                    return (
                        <span
                            key={`ellipsis-${idx}`}
                            className={`inline-flex items-center justify-center ${styles.ellipsis}`}
                        >
                            ...
                        </span>
                    );
                }

                const isActive = token === safeCurrentPage;

                return (
                    <PendingLink
                        key={`page-${token}`}
                        href={buildHref(token)}
                        aria-current={isActive ? "page" : undefined}
                        className={`inline-flex items-center justify-center transition-colors duration-150 ease-linear ${
                            isActive ? styles.activePage : styles.page
                        }`}
                    >
                        {token}
                    </PendingLink>
                );
            })}

            <PendingLink
                href={buildHref(Math.min(lastPage, safeCurrentPage + 1))}
                aria-disabled={safeCurrentPage >= lastPage}
                className={`inline-flex items-center justify-center transition-colors ${styles.arrow} ${
                    safeCurrentPage >= lastPage ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"
                }`}
            >
                <i className="fa-solid fa-chevron-right text-[12px]" />
            </PendingLink>
        </div>
    );
}

export { Pagination };
