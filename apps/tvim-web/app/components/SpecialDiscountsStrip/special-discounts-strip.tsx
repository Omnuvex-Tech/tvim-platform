type DiscountProduct = {
    id: number;
    title: string;
    oldPrice: string;
    price: string;
    discount: string;
    imageUrl: string;
    href: string;
};

const products: DiscountProduct[] = [
    {
        id: 1,
        title: "Alət dəsti 96 parça Emtop EEDK09601",
        oldPrice: "87.00₼",
        price: "73.08₼",
        discount: "-16%",
        imageUrl: "https://images.unsplash.com/photo-1581147036324-c1c1c3f4f7d8?auto=format&fit=crop&w=420&q=80",
        href: "#",
    },
    {
        id: 2,
        title: "Drel batareyalı 20V Emtop 118 ECDL6200118",
        oldPrice: "80.00₼",
        price: "64.80₼",
        discount: "-19%",
        imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=420&q=80",
        href: "#",
    },
    {
        id: 3,
        title: "Mini moyka aparatı K2 Karcher 1.600-979.0",
        oldPrice: "199.00₼",
        price: "159.00₼",
        discount: "-20%",
        imageUrl: "https://images.unsplash.com/photo-1604448002775-06fefb4774cb?auto=format&fit=crop&w=420&q=80",
        href: "#",
    },
    {
        id: 4,
        title: "Mini yuyucu aparatı universal K4 Karcher 1.679-300.0",
        oldPrice: "399.00₼",
        price: "299.00₼",
        discount: "-25%",
        imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=420&q=80",
        href: "#",
    },
    {
        id: 5,
        title: "Yuyucu aparat K 5 Basic Karcher 1.180-580.0",
        oldPrice: "649.00₼",
        price: "499.00₼",
        discount: "-23%",
        imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=420&q=80",
        href: "#",
    },
];

const SpecialDiscountsStrip = () => {
    return (
        <section className="w-full">
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-[30px] leading-tight font-bold text-[#1f2328] sm:text-[46px]">Xüsusi endirimlər</h2>
                    <a href="#" className="hidden text-[16px] font-semibold text-[#1557d5] transition-colors hover:text-[#0e45ac] md:inline-flex">
                        Bütün endirimli məhsullara bax →
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {products.map((product) => (
                        <article
                            key={product.id}
                            className="group relative rounded-[14px] border border-[#e2e6ef] bg-white px-3 pb-4 pt-3 transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] sm:px-4"
                        >
                            <a href={product.href} className="absolute inset-0 z-[1]" aria-label={product.title} />

                            <div className="relative h-[120px] overflow-hidden rounded-[10px] sm:h-[145px]">
                                <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
                            </div>

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

                            <span className="absolute top-4 right-4 z-[2] inline-flex h-9 min-w-[52px] items-center justify-center rounded-full bg-[#ff2e43] px-2 text-[14px] font-bold text-white">
                                {product.discount}
                            </span>

                            <div className="pt-3">
                                <h3 className="line-clamp-2 min-h-[44px] text-[14px] leading-5 font-semibold text-[#1f2328]">{product.title}</h3>

                                <div className="mt-2 flex items-center gap-1 text-[#d2d7e2]">
                                    <span>☆</span>
                                    <span>☆</span>
                                    <span>☆</span>
                                    <span>☆</span>
                                    <span>☆</span>
                                </div>

                                <p className="mt-2 text-[16px] text-[#9098a9] line-through">{product.oldPrice}</p>
                                <p className="text-[34px] leading-none font-bold text-[#ff1f2d] scale-[0.5] origin-top-left">{product.price}</p>

                                <button
                                    type="button"
                                    className="relative z-[2] mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0f57d6] text-white"
                                    aria-label="Səbətə əlavə et"
                                >
                                    🛒
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                <a href="#" className="mt-4 inline-flex text-[15px] font-semibold text-[#1557d5] md:hidden">
                    Bütün endirimli məhsullara bax →
                </a>
            </div>
        </section>
    );
};

export { SpecialDiscountsStrip };
