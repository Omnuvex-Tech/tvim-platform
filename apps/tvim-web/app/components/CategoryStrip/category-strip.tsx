type CategoryItem = {
    label: string;
    icon: string;
};

const categoryItems: CategoryItem[] = [
    { label: "Elektrik malları və İşıqlandırma", icon: "💡" },
    { label: "Santexnika, su təchizatı və istilik", icon: "🚰" },
    { label: "Əl alətləri", icon: "🛠️" },
    { label: "Avadanlıqlar", icon: "⚙️" },
    { label: "Tikinti materialları", icon: "🧱" },
    { label: "Silikonlar və mastiklər", icon: "🧴" },
    { label: "Alçıpan sistemləri", icon: "📦" },
    { label: "İnşaat tozları və əlavələr", icon: "🧪" },
    { label: "İstilik izolyasiya", icon: "⬜" },
];

const CategoryStrip = () => {
    return (
        <section className="w-full">
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div className="grid grid-flow-col auto-cols-[minmax(106px,1fr)] gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid-flow-row md:grid-cols-3 md:overflow-visible lg:grid-cols-9">
                    {categoryItems.map(({ label, icon }) => (
                        <button
                            key={label}
                            type="button"
                            className="group flex h-[150px] min-w-[106px] flex-col items-center justify-start gap-3 rounded-[14px] bg-white px-2 pt-4 pb-3 text-center shadow-[0_6px_16px_rgba(17,24,39,0.06)] transition-transform duration-200 ease-out hover:-translate-y-1"
                        >
                            <span className="inline-flex h-11 items-center justify-center" aria-hidden="true">
                                <span className="text-[28px] leading-none">{icon}</span>
                            </span>
                            <span className="text-[12px] leading-[1.2] font-semibold text-[#131722]">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

export { CategoryStrip };
