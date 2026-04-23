import type { ReactNode } from "react";

type BenefitItem = {
    title: string;
    description: string;
    icon: ReactNode;
};

const benefitItems: BenefitItem[] = [
    {
        title: "Pulsuz çatdırılma",
        description: "200 manatdan yuxarı sifarişlər üçün",
        icon: (
            <svg viewBox="0 0 24 24" className="size-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8.4 12 4l8 4.4v7.2L12 20l-8-4.4V8.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M4.8 8.8 12 12.8l7.2-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 12.8V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Geriqaytarma",
        description: "14 gün müddətində",
        icon: (
            <svg viewBox="0 0 24 24" className="size-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 8H4m0 0 3-3M4 8l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 12a7 7 0 0 0-12-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Korporativ satış",
        description: "Xüsusi təkliflərdən yararlanın",
        icon: (
            <svg viewBox="0 0 24 24" className="size-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20V7.5h8V20M12 20V4h8v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11h2M7 14h2M15 8h2M15 11h2M15 14h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Bonus kartları",
        description: "Xərclədikcə daha çox qazanın",
        icon: (
            <svg viewBox="0 0 24 24" className="size-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="m4.5 8.5 2 2-2 2m15-4-2 2 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
];

const BenefitsStrip = () => {
    return (
        <section className="w-full">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {benefitItems.map((item) => (
                    <button
                        key={item.title}
                        type="button"
                        className="group relative flex h-[142px] w-full items-start gap-3.5 rounded-[18px] bg-white px-6 pt-3.5 pb-2.5 text-left transition-all duration-200 ease-out hover:bg-[#f3f4f6] hover:shadow-[0_10px_24px_rgba(17,24,39,0.1)]"
                    >
                        <span className="mt-1 shrink-0 text-[#1f4fff]">{item.icon}</span>
                        <span className="pr-7 pt-0.5">
                            <span className="block text-[34px] leading-none font-bold whitespace-nowrap text-black scale-[0.5] origin-top-left">{item.title}</span>
                            <span className="-mt-2 block text-[26px] leading-none font-normal text-[#5f6675] scale-[0.5] origin-top-left">{item.description}</span>
                        </span>
                        <span className="absolute right-5 bottom-4 text-[18px] text-[#9ca3af] transition-colors group-hover:text-[#2050ff]" aria-hidden="true">→</span>
                    </button>
                ))}
            </div>
        </section>
    );
};

export { BenefitsStrip };
