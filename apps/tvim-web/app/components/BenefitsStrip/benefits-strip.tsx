import type { ReactNode } from "react";
import { BlueHexIcon, BuildingGridIcon, ReturnArrowIcon, TicketCutIcon } from "@repo/ui";
import { ArrowRight } from "lucide-react";

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
                        className="group relative flex h-[150px] w-full items-center gap-3.5 rounded-[16px] bg-transparent px-7 text-left transition-colors duration-200 ease-out hover:bg-[#e3e3e6]"
                    >
                        <span className="shrink-0 text-[#1f4fff]">{item.icon}</span>
                        <span className="-mt-3 pr-7">
                            <span className="block whitespace-nowrap text-[20px] leading-[1.25] font-bold text-black">{item.title}</span>
                            <span className="mt-1 block text-[13px] leading-[1.25] font-normal text-[#5f6675]">{item.description}</span>
                        </span>
                        <ArrowRight className="absolute right-6 bottom-4 h-[16px] w-[16px] text-[#8a91a0]" strokeWidth={2.8} aria-hidden="true" />
                    </button>
                ))}
            </div>
        </section>
    );
};

export { BenefitsStrip };
