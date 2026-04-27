import type { ReactNode } from "react";
import { BlueHexIcon, BuildingGridIcon, ReturnArrowIcon, TicketCutIcon } from "@repo/ui";

type BenefitItem = {
    title: string;
    description: string;
    icon: ReactNode;
};

const benefitItems: BenefitItem[] = [
    {
        title: "Pulsuz çatdırılma",
        description: "200 manatdan yuxarı sifarişlər üçün",
        icon: <BlueHexIcon />,
    },
    {
        title: "Geriqaytarma",
        description: "14 gün müddətində",
        icon: <ReturnArrowIcon />,
    },
    {
        title: "Korporativ satış",
        description: "Xüsusi təkliflərdən yararlanın",
        icon: <BuildingGridIcon />,
    },
    {
        title: "Bonus kartları",
        description: "Xərclədikcə daha çox qazanın",
        icon: <TicketCutIcon />,
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
