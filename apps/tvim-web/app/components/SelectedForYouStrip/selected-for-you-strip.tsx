type SelectedProduct = {
    id: number;
    title: string;
    price: string;
    imageUrl: string;
    href: string;
    cartVariant?: "yellow" | "blue";
};

const selectedProducts: SelectedProduct[] = [
    {
        id: 1,
        title: "Fasad boya 10kq COLART",
        price: "26.00₼",
        imageUrl: "https://images.unsplash.com/photo-1581147036324-c1c1c3f4f7d8?auto=format&fit=crop&w=360&q=80",
        href: "#",
        cartVariant: "yellow",
    },
    {
        id: 2,
        title: "Razetka 1li RSb20-3-FSr kontaktlı Fors İEK",
        price: "7.00₼",
        imageUrl: "https://images.unsplash.com/photo-1611859266727-a398589ce572?auto=format&fit=crop&w=360&q=80",
        href: "#",
        cartVariant: "yellow",
    },
    {
        id: 3,
        title: "A9D31640 2x40A 30mA SCHNEIDER",
        price: "61.00₼",
        imageUrl: "https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=360&q=80",
        href: "#",
        cartVariant: "yellow",
    },
    {
        id: 4,
        title: "TV ASILQAN YP-460 Yupiter",
        price: "32.00₼",
        imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=360&q=80",
        href: "#",
        cartVariant: "yellow",
    },
    {
        id: 5,
        title: "Telefon yuvası K2 akrilik boz Aylex 1-79",
        price: "4.80₼",
        imageUrl: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=360&q=80",
        href: "#",
        cartVariant: "blue",
    },
];

const SelectedForYouStrip = () => {
    return (
        <section className="w-full">
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-[32px] leading-tight font-bold text-[#1f2328] sm:text-[52px]">Sizin üçün seçdiklərimiz</h2>

                    <div className="hidden items-center gap-3 md:flex">
                        <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#c7d4ea] bg-white text-[#1c2536]"
                            aria-label="Əvvəlki"
                        >
                            ←
                        </button>
                        <span className="text-[16px] font-medium text-[#1f2328]">1 / 20</span>
                        <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#c7d4ea] bg-white text-[#1c2536]"
                            aria-label="Növbəti"
                        >
                            →
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {selectedProducts.map((product) => (
                        <article
                            key={product.id}
                            className="group relative rounded-[14px] border border-[#e2e6ef] bg-white px-3 pb-4 pt-3 transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] sm:px-4"
                        >
                            <a href={product.href} className="absolute inset-0 z-[1]" aria-label={product.title} />

                            <button
                                type="button"
                                className="absolute top-4 left-4 z-[2] inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#e0e5ee] bg-white text-[#7b8596]"
                                aria-label="Seçilmişlər"
                            >
                                ♡
                            </button>
                            <button
                                type="button"
                                className="absolute top-11 left-4 z-[2] inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#e0e5ee] bg-white text-[#7b8596]"
                                aria-label="Müqayisə"
                            >
                                ↔
                            </button>

                            <div className="mx-auto mt-2 h-[135px] w-full max-w-[140px] overflow-hidden rounded-[10px] sm:h-[150px]">
                                <img src={product.imageUrl} alt={product.title} className="h-full w-full object-contain" loading="lazy" />
                            </div>

                            <div className="pt-3 text-center">
                                <h3 className="line-clamp-2 min-h-[44px] text-[15px] leading-5 font-semibold text-[#1f2328]">{product.title}</h3>

                                <div className="mt-2 flex items-center justify-center gap-1 text-[#d2d7e2]">
                                    <span>☆</span>
                                    <span>☆</span>
                                    <span>☆</span>
                                    <span>☆</span>
                                    <span>☆</span>
                                </div>

                                <p className="mt-3 text-[34px] leading-none font-bold text-[#111722] scale-[0.5] origin-top">{product.price}</p>

                                <button
                                    type="button"
                                    className={`relative z-[2] mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-white ${
                                        product.cartVariant === "blue" ? "bg-[#0f57d6]" : "bg-[#ffd500] text-[#1b212e]"
                                    }`}
                                    aria-label="Səbətə əlavə et"
                                >
                                    🛒
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export { SelectedForYouStrip };
