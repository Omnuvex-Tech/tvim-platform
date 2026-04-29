type CategoryItem = {
    label: string;
    href: string;
    iconClass?: string;
    iconImageUrl?: string;
    iconEmoji?: string;
};

const fallbackCategoryItems: CategoryItem[] = [
    { label: "Elektrik malları və İşıqlandırma", href: "#", iconEmoji: "💡" },
    { label: "Santexnika, su təchizatı və istilik", href: "#", iconEmoji: "🚰" },
    { label: "Əl alətləri", href: "#", iconEmoji: "🛠️" },
    { label: "Avadanlıqlar", href: "#", iconEmoji: "⚙️" },
    { label: "Tikinti materialları", href: "#", iconEmoji: "🧱" },
    { label: "Silikonlar və mastiklər", href: "#", iconEmoji: "🧴" },
    { label: "Alçıpan sistemləri", href: "#", iconEmoji: "📦" },
    { label: "İnşaat tozları və əlavələr", href: "#", iconEmoji: "🧪" },
    { label: "İstilik izolyasiya", href: "#", iconEmoji: "⬜" },
];

type CategoryStripProps = {
    items?: CategoryItem[];
};

const CategoryStrip = ({ items = [] }: CategoryStripProps) => {
    const categoryItems = items.length > 0 ? items : fallbackCategoryItems;

    return (
        <section className="w-full font-[family-name:var(--font-inter)]">
            <div className="mx-auto w-full max-w-[1280px] px-0">
                <div className="grid grid-flow-col auto-cols-[minmax(120px,auto)] gap-4 md:gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid-flow-row md:grid-cols-3 md:overflow-visible lg:grid-cols-9 py-2">
                    {categoryItems.map(({ label, href, iconClass, iconImageUrl, iconEmoji }) => (
                        <a
                            key={`${label}-${href}`}
                            href={href}
                            className="group flex h-[170px] max-[512px]:h-[160px] min-w-[94px] max-[768px]:min-w-[120px] flex-col items-center justify-start gap-6 rounded-[14px] border border-[#e2e6ef] bg-white px-4 max-[512px]:px-6 pt-7 pb-7 text-center shadow-none transition-transform duration-200 ease-out hover:-translate-y-1"
                        >
                            <span className="inline-flex h-11 items-center justify-center" aria-hidden="true">
                                {iconImageUrl ? (
                                    <img src={iconImageUrl} alt="" className="h-16 w-16 object-contain" />
                                ) : iconClass ? (
                                    <i className={`${iconClass} text-[42px] leading-none text-[#475066]`} />
                                ) : (
                                    <span className="text-[44px] leading-none">{iconEmoji ?? "📦"}</span>
                                )}
                            </span>
                            <span className="text-[12px] leading-[1.2] font-semibold text-[#131722]">{label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export { CategoryStrip };
export type { CategoryItem as CategoryStripItem };