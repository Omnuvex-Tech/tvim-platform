import type { ReactNode } from "react";
import Link from "next/link";
import { BlueHexIcon, BuildingGridIcon, ReturnArrowIcon, TicketCutIcon } from "@repo/ui";
import { htmlToText } from "@repo/shared/utils";

type BenefitItem = {
    title: string;
    description: string;
    icon: ReactNode;
    link?: string;
};

// Used only when the main-page api returns fewer than four "Services" block
// items (e.g. a fresh environment with nothing configured there yet). Each
// links straight at the real page this locale serves — three of these are
// real cms menu entries (see mapRawToBenefits below); "Çatdırılma və ödəniş"
// has no dedicated free-delivery teaser page, so it is the closest real page
// to that concept, not a confirmed one-to-one match.
const DEFAULT_BENEFIT_ITEMS: (Omit<BenefitItem, "link"> & { slugs: Record<string, string> })[] = [
    {
        title: "Pulsuz çatdırılma",
        description: "200 manatdan yuxarı sifarişlər üçün",
        icon: <BlueHexIcon />,
        slugs: { az: "catdirilma-ve-odenis", en: "delivery-and-payment", ru: "dostavka-i-oplata" },
    },
    {
        title: "Geriqaytarma",
        description: "14 gün müddətində",
        icon: <ReturnArrowIcon />,
        slugs: { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },
    },
    {
        title: "Korporativ satış",
        description: "Xüsusi təkliflərdən yararlanın",
        icon: <BuildingGridIcon />,
        slugs: { az: "korporativ", en: "korporativ", ru: "korporativ" },
    },
    {
        title: "Bonus kartları",
        description: "Xərclədikcə daha çox qazanın",
        icon: <TicketCutIcon />,
        slugs: { az: "bonus-kartlari", en: "bonus-cards", ru: "bonusnye-karty" },
    },
];

function mapRawToBenefits(rawItems?: any[], locale?: string): BenefitItem[] {
    const normalizedLocale = String(locale ?? "az").trim().toLowerCase() || "az";

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
        return DEFAULT_BENEFIT_ITEMS.map(({ slugs, ...item }) => ({
            ...item,
            link: `/${normalizedLocale}/${slugs[normalizedLocale] ?? slugs.az}`,
        }));
    }

    const mapped = rawItems.map((it: any) => {
        const title = (it?.menu?.title ?? it?.data?.title ?? it?.menu?.name ?? "").toString();
        const description = htmlToText(it?.menu?.description ?? it?.data?.description ?? "");

        const t = title.toLowerCase();
        let icon = <TicketCutIcon />;
        if (t.includes("bonus") || t.includes("kart")) icon = <TicketCutIcon />;
        else if (t.includes("geri") || t.includes("geriq")) icon = <ReturnArrowIcon />;
        else if (t.includes("korporat") || t.includes("korporativ")) icon = <BuildingGridIcon />;
        else if (t.includes("çatdır") || t.includes("catdir") || t.includes("çatdiril")) icon = <BlueHexIcon />;

        // These are real menu entries with their own canonical url (e.g.
        // /az/korporativ), reached the same way any other menu page is —
        // through multi_links, not a /services/ prefix.
        const multiLinks = it?.menu?.multi_links;
        const localizedMenuLink = multiLinks && typeof multiLinks === "object" ? multiLinks[normalizedLocale] : undefined;
        const menuLink = String(localizedMenuLink ?? it?.menu?.link ?? "").trim().replace(/^\/+|\/+$/g, "");
        const link = menuLink ? `/${normalizedLocale}/${menuLink}` : undefined;

        return { title, description, icon, link } as BenefitItem;
    }).filter((item) => item.title.trim().length > 0 && item.link);

    if (mapped.length >= 4) return mapped;

    const existing = new Set(mapped.map((item) => item.title.trim().toLocaleLowerCase("az")));
    const missingDefaults = DEFAULT_BENEFIT_ITEMS
        .filter((item) => !existing.has(item.title.trim().toLocaleLowerCase("az")))
        .map(({ slugs, ...item }) => ({
            ...item,
            link: `/${normalizedLocale}/${slugs[normalizedLocale] ?? slugs.az}`,
        }));

    return [...mapped, ...missingDefaults].slice(0, 4);
}

const BenefitsStrip = ({ items, locale }: { items?: any[]; locale?: string }) => {
    const list = mapRawToBenefits(items, locale);

    return (
        <section className="w-full font-sans">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((item, index) => (
                        <Link
                            key={`${item.title}-${index}`}
                            href={item.link ?? "#"}
                            className="group relative flex h-[140px] w-full items-center gap-2.5 rounded-[16px] bg-white px-4 pt-6 pb-10 text-left transition-all duration-200 ease-out hover:bg-[#f3f4f6] hover:shadow-none cursor-pointer select-none sm:h-[160px] sm:gap-3.5 sm:rounded-[24px] sm:px-6 sm:pt-10 sm:pb-14"
                        >
                        <span className="shrink-0 text-[#1f4fff] w-[32px] h-[32px] flex items-center justify-center [&_svg]:w-full [&_svg]:h-full sm:w-[40px] sm:h-[40px]">{item.icon}</span>
                        <span className="flex-1 min-w-0 w-full flex flex-col">
                                <span className="block text-[18px] leading-[22px] font-bold text-black truncate sm:text-[24px] sm:leading-[30px]">{item.title}</span>
                                {item.description ? (
                                    <span
                                        className="mt-1 block text-[11px] leading-normal font-normal text-[#555555] line-clamp-3 tracking-[0.05em] sm:mt-2 sm:text-[12px]"
                                        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}
                                    >
                                        {item.description}
                                    </span>
                                ) : null}
                        </span>
                            <span className="absolute right-4 bottom-2 text-[18px] text-[#9ca3af] transition-colors group-hover:text-[#2050ff] sm:right-6 sm:bottom-2" aria-hidden="true">→</span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export { BenefitsStrip };
