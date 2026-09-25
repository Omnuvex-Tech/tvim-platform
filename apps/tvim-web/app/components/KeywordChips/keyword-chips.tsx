/**
 * The page's meta keywords, printed above the footer.
 *
 * The list passed in is the one the page already published in its
 * `<meta name="keywords">`: each page builds it once and hands the same array
 * to both, so what a visitor reads here and what the head declares cannot
 * drift apart. The markup is the block the category pages used to render on
 * their own, moved here so every page draws it the same way.
 *
 * Only the first few are drawn: a long run of keywords on the page reads as
 * keyword stuffing to search engines. The meta tag keeps the full list.
 */
const MAX_VISIBLE_KEYWORDS = 15;

export function KeywordChips({ keywords }: { keywords: readonly string[] }) {
    const visibleKeywords = keywords.slice(0, MAX_VISIBLE_KEYWORDS);
    if (visibleKeywords.length === 0) return null;

    return (
        <div className="mx-auto mt-20 mb-10 w-full max-w-[1280px] px-1 lg:mt-24 lg:mb-14 lg:px-2">
            <div className="w-full border-t border-[#e5e9ef]" />
            <div className="pt-4">
                <div className="flex flex-wrap justify-start gap-2">
                    {visibleKeywords.map((keyword) => (
                        <span
                            key={keyword}
                            className="inline-block rounded-[20px] border border-[#ddd] bg-[#f8f8f8] px-[12px] py-[6px] text-[14px] leading-none font-normal text-[#333] transition-all duration-200 ease-in-out cursor-default"
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
