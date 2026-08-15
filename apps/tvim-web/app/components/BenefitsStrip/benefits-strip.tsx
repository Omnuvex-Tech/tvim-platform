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

type DefaultBenefitLocalized = {
    title: Record<string, string>;
    description: Record<string, string>;
    icon: ReactNode;
    slugs: Record<string, string>;
    matchKeywords: Record<string, string[]>;
};

const DEFAULT_BENEFIT_ITEMS: DefaultBenefitLocalized[] = [
    {
        title: { az: "Pulsuz çatdırılma", en: "Free delivery", ru: "Бесплатная доставка" },
        description: {
            az: "200 manatdan yuxarı sifarişlər üçün",
            en: "For orders over 200 manat",
            ru: "Для заказов свыше 200 манат",
        },
        icon: <BlueHexIcon />,
        slugs: { az: "catdirilma-ve-odenis", en: "delivery-and-payment", ru: "dostavka-i-oplata" },
        matchKeywords: {
            az: ["çatdır", "catdir", "çatdiril", "pulsuz", "delivery"],
            en: ["delivery", "deliver", "free ship"],
            ru: ["достав", "бесплат", "доставк"],
        },
    },
    {
        title: { az: "Geriqaytarma", en: "Returns", ru: "Возврат" },
        description: {
            az: "14 gün müddətində",
            en: "Within 14 days",
            ru: "В течение 14 дней",
        },
        icon: <ReturnArrowIcon />,
        slugs: { az: "geri-qaytarma-ve-deyisdirilme", en: "redemption-and-replacement", ru: "iskuplenie-i-zamena" },
        matchKeywords: {
            az: ["geri", "geriq", "qaytar", "return"],
            en: ["return", "replace", "refund"],
            ru: ["возврат", "замен", "скуплен"],
        },
    },
    {
        title: { az: "Korporativ satış", en: "Corporate sales", ru: "Корпоративные продажи" },
        description: {
            az: "Xüsusi təkliflərdən yararlanın",
            en: "Take advantage of special offers",
            ru: "Воспользуйтесь специальными предложениями",
        },
        icon: <BuildingGridIcon />,
        slugs: { az: "korporativ", en: "korporativ", ru: "korporativ" },
        matchKeywords: {
            az: ["korporat", "korporativ", "korporativnye"],
            en: ["corporate"],
            ru: ["корпоративн", "корпорат"],
        },
    },
    {
        title: { az: "Bonus kartları", en: "Bonus cards", ru: "Бонусные карты" },
        description: {
            az: "Xərclədikcə daha çox qazanın",
            en: "Earn more as you spend",
            ru: "Зарабатывайте больше по мере покупок",
        },
        icon: <TicketCutIcon />,
        slugs: { az: "bonus-kartlari", en: "bonus-cards", ru: "bonusnye-karty" },
        matchKeywords: {
            az: ["bonus", "kart", "kart"],
            en: ["bonus", "card"],
            ru: ["бонус", "карт"],
        },
    },
];

function getDefaultBenefitForLocale(def: DefaultBenefitLocalized, locale: string): BenefitItem & { matchKeywords: string[] } {
    const resolvedTitle = String(def.title[locale] ?? def.title.az ?? def.title.en ?? Object.values(def.title)[0] ?? "");
    const resolvedDescription = String(def.description[locale] ?? def.description.az ?? def.description.en ?? Object.values(def.description)[0] ?? "");
    const resolvedSlug = String(def.slugs[locale] ?? def.slugs.az ?? def.slugs.en ?? Object.values(def.slugs)[0] ?? "");
    const allKeywords: string[] = Object.values(def.matchKeywords).flat();
    return {
        title: resolvedTitle,
        description: resolvedDescription,
        icon: def.icon,
        link: `/${locale}/${resolvedSlug}`,
        matchKeywords: allKeywords,
    };
}

function matchesAnyKeyword(titleLower: string, keywords: string[]): boolean {
    return keywords.some((kw) => titleLower.includes(kw));
}

function resolveIcon(titleLower: string): ReactNode {
    const deliveryKw = ["çatdır", "catdir", "çatdiril", "pulsuz", "delivery", "deliver", "free ship", "достав", "бесплат", "доставк"];
    const returnKw = ["geri", "geriq", "qaytar", "return", "replace", "refund", "возврат", "замен", "скуплен"];
    const corporateKw = ["korporat", "korporativ", "korporativnye", "corporate", "корпоративн", "корпорат"];
    const bonusKw = ["bonus", "kart", "card", "бонус", "карт"];

    if (matchesAnyKeyword(titleLower, deliveryKw)) return <BlueHexIcon />;
    if (matchesAnyKeyword(titleLower, returnKw)) return <ReturnArrowIcon />;
    if (matchesAnyKeyword(titleLower, corporateKw)) return <BuildingGridIcon />;
    if (matchesAnyKeyword(titleLower, bonusKw)) return <TicketCutIcon />;
    return <TicketCutIcon />;
}

function mapRawToBenefits(rawItems?: any[], locale?: string): BenefitItem[] {
    const normalizedLocale = String(locale ?? "az").trim().toLowerCase() || "az";

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
        return DEFAULT_BENEFIT_ITEMS.map((def) => {
            const { matchKeywords: _kw, ...rest } = getDefaultBenefitForLocale(def, normalizedLocale);
            return rest;
        });
    }

    const mapped = rawItems.map((it: any) => {
        const title = (it?.menu?.title ?? it?.data?.title ?? it?.menu?.name ?? "").toString();
        const description = htmlToText(it?.menu?.description ?? it?.data?.description ?? "");
        const t = title.toLowerCase();
        const icon = resolveIcon(t);

        const multiLinks = it?.menu?.multi_links;
        const localizedMenuLink = multiLinks && typeof multiLinks === "object" ? multiLinks[normalizedLocale] : undefined;
        const menuLink = String(localizedMenuLink ?? it?.menu?.link ?? "").trim().replace(/^\/+|\/+$/g, "");
        const link = menuLink ? `/${normalizedLocale}/${menuLink}` : undefined;

        return { title, description, icon, link } as BenefitItem;
    }).filter((item) => item.title.trim().length > 0 && item.link);

    if (mapped.length >= 4) return mapped;

    const existingTitlesLower = mapped.map((item) => item.title.trim().toLocaleLowerCase());
    const missingDefaults = DEFAULT_BENEFIT_ITEMS
        .filter((def) => {
            const localized = getDefaultBenefitForLocale(def, normalizedLocale);
            const titleLower = localized.title.trim().toLocaleLowerCase();
            const matchInExisting = existingTitlesLower.some((et) =>
                matchesAnyKeyword(et, localized.matchKeywords) ||
                matchesAnyKeyword(titleLower, Object.values(def.matchKeywords).flat()) ||
                localized.matchKeywords.some((kw) => existingTitlesLower.some((et) => et.includes(kw)))
            );
            return !matchInExisting;
        })
        .map((def) => {
            const { matchKeywords: _kw, ...rest } = getDefaultBenefitForLocale(def, normalizedLocale);
            return rest;
        });

    return [...mapped, ...missingDefaults].slice(0, 4);
}

// Written out in full so the class names survive Tailwind's scan.
const LG_COLUMNS_BY_COUNT: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
};

const BenefitsStrip = ({ items, locale }: { items?: any[]; locale?: string }) => {
    const list = mapRawToBenefits(items, locale);
    // The columns follow the number of cards, so three of them fill the row
    // instead of leaving a fourth one empty.
    const lgColumns = LG_COLUMNS_BY_COUNT[Math.min(Math.max(list.length, 1), 4)] ?? "lg:grid-cols-4";

    return (
        <section className="w-full font-sans">
            <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${lgColumns}`}>
                {list.map((item, index) => (
                        <Link
                            key={`${item.title}-${index}`}
                            href={item.link ?? "#"}
                            className="group relative flex min-h-[104px] w-full items-center gap-2.5 rounded-[16px] bg-white px-4 pt-4 pb-7 text-left transition-all duration-200 ease-out hover:bg-[#f3f4f6] hover:shadow-none cursor-pointer select-none sm:min-h-[112px] sm:gap-3 sm:rounded-[20px] sm:px-5 sm:pt-5 sm:pb-8 xl:min-h-[124px] xl:gap-3.5 xl:rounded-[24px] xl:px-6 xl:pt-6 xl:pb-9"
                        >
                        <span className="shrink-0 text-[#1f4fff] w-[28px] h-[28px] flex items-center justify-center [&_svg]:w-full [&_svg]:h-full sm:w-[32px] sm:h-[32px] xl:w-[38px] xl:h-[38px]">{item.icon}</span>
                        <span className="flex-1 min-w-0 w-full flex flex-col">
                                {/* Two columns at sm and four at lg leave the title barely
                                    200px, so it scales with the card instead of being cut off. */}
                                <span className="block text-[16px] leading-[20px] font-bold text-black line-clamp-2 sm:text-[17px] sm:leading-[22px] lg:text-[18px] lg:leading-[24px] xl:text-[20px] xl:leading-[26px]">{item.title}</span>
                                {item.description ? (
                                    <span
                                        className="mt-1 block text-[11px] leading-normal font-normal text-[#555555] line-clamp-2 tracking-[0.05em] sm:mt-1.5 sm:text-[12px]"
                                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}
                                    >
                                        {item.description}
                                    </span>
                                ) : null}
                        </span>
                            <span className="absolute right-4 bottom-2 text-[18px] text-[#9ca3af] transition-colors group-hover:text-[#2050ff] sm:right-5 xl:right-6" aria-hidden="true">→</span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export { BenefitsStrip };
