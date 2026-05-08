type CartPreviewModalProduct = {
    key: string;
    title: string;
    imageUrl: string;
    quantity: number;
    unitPriceText: string;
    totalPriceText: string;
    showInsufficientStockWarning: boolean;
};

type CartPreviewModalProps = {
    items: CartPreviewModalProduct[];
    totalPriceText: string;
    onClose: () => void;
    onDecrease: (itemKey: string) => void;
    onIncrease: (itemKey: string) => void;
    onRemove: (itemKey: string) => void;
};

const CartPreviewModal = ({
    items,
    totalPriceText,
    onClose,
    onDecrease,
    onIncrease,
    onRemove,
}: CartPreviewModalProps) => {
    return (
        <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/35 px-3 py-4 sm:px-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[740px] overflow-hidden rounded-[4px] bg-white shadow-[0_20px_50px_rgba(20,30,60,0.22)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-stretch border-b border-[#f7f7f7] bg-[#f7f7f7]">
                    <h3
                        className="flex-1 px-5 py-[15px] leading-none font-semibold"
                        style={{ fontSize: "1.2em", color: "var(--h4-c)" }}
                    >
                        Səbət
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex w-[42px] items-center justify-center border-l border-[#f3f3f3] bg-[#efefef] text-[20px] leading-none font-bold text-[#757575] transition-colors hover:bg-[#e7e7e7] hover:text-[#111111]"
                        aria-label="Bağla"
                    >
                        ×
                    </button>
                </div>

                <div className="px-5 py-5 sm:px-6 sm:py-6">
                    <div className="border-b border-[#e9edf3]">
                        {items.map((item, index) => (
                            <div
                                key={item.key}
                                className={`grid grid-cols-1 gap-4 pb-5 md:grid-cols-[1.45fr_0.7fr_0.35fr_0.35fr_auto] md:items-center md:gap-3 ${
                                    index > 0 ? "border-t border-[#eef2f7] pt-5" : ""
                                }`}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-[64px] w-[64px] flex-none overflow-hidden rounded-[6px] bg-white">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[18px] leading-[1.2] font-semibold text-[#171d28]">
                                            {item.title}
                                        </p>
                                        {item.showInsufficientStockWarning ? (
                                            <p className="mt-1 text-[14px] leading-none font-semibold text-[#ff2e43]">
                                                Tələb olunan miqdarda yoxdur!
                                            </p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="inline-flex h-[61px] w-[126px] items-center justify-center rounded-[20px] border border-[#d6deea] px-4 md:justify-between">
                                    <button
                                        type="button"
                                        onClick={() => onDecrease(item.key)}
                                        className="inline-flex h-8 w-8 items-center justify-center text-[24px] leading-none font-medium text-[#6f819c] transition-colors hover:text-[#325dd6]"
                                        aria-label="Azalt"
                                    >
                                        -
                                    </button>
                                    <span className="mx-3 min-w-[26px] text-center text-[18px] leading-none font-medium text-[#1b2330]">
                                        {item.quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onIncrease(item.key)}
                                        className="inline-flex h-8 w-8 items-center justify-center text-[24px] leading-none font-medium text-[#6f819c] transition-colors hover:text-[#325dd6]"
                                        aria-label="Artır"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="text-left md:text-left">
                                    <p
                                        className="whitespace-nowrap"
                                        style={{ margin: "0 0 5px", color: "#888", lineHeight: "1em", fontSize: "0.65em", fontWeight: 500 }}
                                    >
                                        Bir ədəd üçün qiymət
                                    </p>
                                    <p className="mt-[2px] whitespace-nowrap text-[15px] leading-none font-medium text-[#171d28]">{item.unitPriceText}</p>
                                </div>

                                <div className="text-left md:text-left">
                                    <p
                                        className="whitespace-nowrap"
                                        style={{ margin: "0 0 5px", color: "#888", lineHeight: "1em", fontSize: "0.65em", fontWeight: 500 }}
                                    >
                                        Cəmi
                                    </p>
                                    <p className="mt-[2px] whitespace-nowrap text-[15px] leading-none font-medium text-[#171d28]">{item.totalPriceText}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onRemove(item.key)}
                                    className="inline-flex h-8 w-8 items-center justify-center self-center text-[#93a1b6] transition-colors hover:text-[#5f6f86] md:justify-self-end"
                                    aria-label="Səbətdən sil"
                                >
                                    <i className="fa-regular fa-circle-xmark text-[18px]" aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <p className="leading-none text-[#161c27]" style={{ fontSize: "1.15em", fontWeight: 700 }}>
                            Toplam qiymət: {totalPriceText}
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-[36px] min-w-[148px] items-center justify-center rounded-full bg-[#f3f5f8] px-4 text-[15px] leading-none font-normal text-[#8a95a5] transition-colors duration-200 hover:bg-[#dfe5ec]"
                        >
                            Alış-verişə davam et
                        </button>
                        <button
                            type="button"
                            className="inline-flex h-[40px] min-w-[176px] items-center justify-center self-end rounded-full bg-[#1f4fff] px-5 text-[16px] leading-none font-semibold text-white"
                        >
                            Sifarişi rəsmiləşdir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { CartPreviewModal };
