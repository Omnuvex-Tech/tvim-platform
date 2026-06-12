import { PendingLink } from "@/app/components/DrawerScrollLock/drawer-scroll-lock";

type PaginationToken = number | "ellipsis";

type PaginationProps = {
    currentPage: number;
    lastPage: number;
    buildHref: (page: number) => string;
    className?: string;
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
}: PaginationProps) {
    if (lastPage <= 1) return null;

    const safeCurrentPage = Math.max(1, Math.min(currentPage, lastPage));
    const tokens = buildPaginationTokens(safeCurrentPage, lastPage);

    return (
        <div className={`mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`.trim()}>
            <PendingLink
                href={buildHref(Math.max(1, safeCurrentPage - 1))}
                aria-disabled={safeCurrentPage <= 1}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111318] transition-colors sm:h-10 sm:w-10 ${
                    safeCurrentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"
                }`}
            >
                <i className="fa-solid fa-chevron-left text-[12px]" />
            </PendingLink>

            {tokens.map((token, idx) => {
                if (token === "ellipsis") {
                    return (
                        <span
                            key={`ellipsis-${idx}`}
                            className="inline-flex h-9 w-9 items-center justify-center text-[16px] text-[#8b97a9] sm:h-10 sm:w-10"
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
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors sm:h-10 sm:w-10 sm:text-[14px] ${
                            isActive
                                ? "border-[#0f57d6] bg-[#0f57d6] text-white"
                                : "border-[#e5e7eb] bg-white text-[#111318] hover:bg-[#f5f7fb]"
                        }`}
                    >
                        {token}
                    </PendingLink>
                );
            })}

            <PendingLink
                href={buildHref(Math.min(lastPage, safeCurrentPage + 1))}
                aria-disabled={safeCurrentPage >= lastPage}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#111318] transition-colors sm:h-10 sm:w-10 ${
                    safeCurrentPage >= lastPage ? "pointer-events-none opacity-40" : "hover:bg-[#f5f7fb]"
                }`}
            >
                <i className="fa-solid fa-chevron-right text-[12px]" />
            </PendingLink>
        </div>
    );
}

export { Pagination };
