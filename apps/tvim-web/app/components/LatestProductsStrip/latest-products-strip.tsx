type LatestProduct = {
    id: number;
    title: string;
    price: string;
    imageUrl: string;
    href: string;
};

const latestProducts: LatestProduct[] = [
    {
        id: 1,
        title: "Cilalama maşını 230mm 2200W Emtop",
        price: "130.00₼",
        imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=360&q=80",
        href: "#",
    },
    {
        id: 2,
        title: "Cilalama maşını 230mm 2400W Emtop",
        price: "160.00₼",
        imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=360&q=80",
        href: "#",
    },
    {
        id: 3,
        title: "Cilalama maşını 230mm 2600W Emtop",
        price: "170.00₼",
        imageUrl: "https://images.unsplash.com/photo-1581147036324-c1c1c3f4f7d8?auto=format&fit=crop&w=360&q=80",
        href: "#",
    },
    {
        id: 4,
        title: "Cilalama maşını 230mm 3000W Emtop",
        price: "190.00₼",
        imageUrl: "https://images.unsplash.com/photo-1604448002775-06fefb4774cb?auto=format&fit=crop&w=360&q=80",
        href: "#",
    },
    {
        id: 5,
        title: "Plasmas köşə 3m GLOSSY",
        price: "0.95₼",
        imageUrl: "https://images.unsplash.com/photo-1614632537423-8b599f26b0f7?auto=format&fit=crop&w=360&q=80",
        href: "#",
    },
];

const LatestProductsStrip = () => {
    return (
        <section className="w-full">
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-[32px] leading-tight font-bold text-[#1f2328] sm:text-[52px]">Son məhsullar</h2>

                    <div className="hidden items-center gap-3 md:flex">
                        <button
                            type="button"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#c7d4ea] bg-white text-[#1c2536]"
                            aria-label="Əvvəlki"
                        >
                            ←
                        </button>
                        <span className="text-[16px] font-medium text-[#1f2328]">1 / 4</span>
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
                    {latestProducts.map((product) => (
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

                            <div className="mx-auto mt-2 h-[135px] w-full max-w-[150px] overflow-hidden rounded-[10px] sm:h-[150px]">
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
                                    className="relative z-[2] mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0f57d6] text-white"
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

export { LatestProductsStrip };
