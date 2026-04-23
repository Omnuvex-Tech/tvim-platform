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
            <div className="mx-auto w-full max-w-[1280px] p-0">
                <div className="grid grid-flow-col auto-cols-[minmax(94px,1fr)] gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid-flow-row md:grid-cols-3 md:overflow-visible lg:grid-cols-9">
                    {categoryItems.map(({ label, href, iconClass, iconImageUrl, iconEmoji }) => (
                        <a
                            key={`${label}-${href}`}
                            href={href}
                            className="group flex h-[170px] min-w-[94px] flex-col items-center justify-start gap-6 rounded-[14px] bg-white px-4 pt-7 pb-7 text-center shadow-[0_4px_20px_rgba(17,24,39,0.14),0_1px_4px_rgba(17,24,39,0.08)] transition-transform duration-200 ease-out hover:-translate-y-1"
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