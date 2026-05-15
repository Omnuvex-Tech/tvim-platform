import type { ReactNode } from "react";
import Link from "next/link";
import { BlueHexIcon, BuildingGridIcon, ReturnArrowIcon, TicketCutIcon } from "@repo/ui";

type BenefitItem = {
    title: string;
    description: string;
    icon: ReactNode;
    link?: string;
};

const defaultBenefitItems: BenefitItem[] = [
    {
        title: "Pulsuz çatdırılma",
        description: "200 manatdan yuxarı sifarişlər üçün",
        icon: <BlueHexIcon />,
        link: "/services/pulsuz-catdirilma",
    },
    {
        title: "Geriqaytarma",
        description: "14 gün müddətində",
        icon: <ReturnArrowIcon />,
        link: "/services/geriqaytarma",
    },
    {
        title: "Korporativ satış",
        description: "Xüsusi təkliflərdən yararlanın",
        icon: <BuildingGridIcon />,
        link: "/services/korporativ-satis",
    },
    {
        title: "Bonus kartları",
        description: "Xərclədikcə daha çox qazanın",
        icon: <TicketCutIcon />,
        link: "/services/bonus-kartlari",
    },
];

function stripHtml(input?: string) {
    if (!input) return "";
    return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function slugifyTitle(value: string) {
    return value
        .toLocaleLowerCase("az")
        .replace(/ə/g, "e")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ğ/g, "g")
        .replace(/ş/g, "s")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function toServiceLink(rawLink: string | undefined, title: string) {
    const source = String(rawLink ?? "").trim();

    if (source.startsWith("http://") || source.startsWith("https://")) {
        return source;
    }

    const cleaned = source.replace(/^\/+|\/+$/g, "");
    if (cleaned) {
        const parts = cleaned.split("/").filter(Boolean);
        const slug = cleaned.startsWith("services/")
            ? parts[1]
            : parts[parts.length - 1];

        if (slug) {
            return `/services/${slug}`;
        }
    }

    const titleSlug = slugifyTitle(title);
    return titleSlug ? `/services/${titleSlug}` : "/services";
}
// Descriptions are clamped via CSS to a fixed number of lines (3).

function mapRawToBenefits(rawItems?: any[]): BenefitItem[] {
    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) return defaultBenefitItems;

    const mapped = rawItems.map((it: any) => {
        const title = (it?.menu?.title ?? it?.data?.title ?? it?.menu?.name ?? "").toString();
        let description = (it?.menu?.description ?? it?.data?.description ?? "").toString();
        description = stripHtml(description);

        const t = title.toLowerCase();
        let icon = <TicketCutIcon />;
        if (t.includes("bonus") || t.includes("kart")) icon = <TicketCutIcon />;
        else if (t.includes("geri") || t.includes("geriq")) icon = <ReturnArrowIcon />;
        else if (t.includes("korporat") || t.includes("korporativ")) icon = <BuildingGridIcon />;
        else if (t.includes("çatdır") || t.includes("catdir") || t.includes("çatdiril")) icon = <BlueHexIcon />;

        const rawLink = it?.menu?.link ?? it?.data?.link ?? it?.menu?.url ?? it?.data?.url ?? it?.menu?.href ?? it?.data?.href ?? it?.menu?.path ?? it?.data?.path ?? "";
        const link = toServiceLink(rawLink ? String(rawLink) : undefined, title);

        return { title, description, icon, link } as BenefitItem;
    }).filter((item) => item.title.trim().length > 0);

    if (mapped.length >= 4) return mapped;

    const existing = new Set(mapped.map((item) => item.title.trim().toLocaleLowerCase("az")));
    const missingDefaults = defaultBenefitItems.filter(
        (item) => !existing.has(item.title.trim().toLocaleLowerCase("az"))
    );

    return [...mapped, ...missingDefaults].slice(0, 4);
}

const BenefitsStrip = ({ items }: { items?: any[] }) => {
    const list = mapRawToBenefits(items);

    return (
        <section className="w-full" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
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
