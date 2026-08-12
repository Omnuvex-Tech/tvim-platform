import type { ReactNode } from "react";
import Link from "next/link";
import { BlueHexIcon, BuildingGridIcon, ReturnArrowIcon, TicketCutIcon } from "@repo/ui";
import { htmlToText } from "@repo/shared/utils";
import { resolveServiceSlugForLocale } from "@/app/services/[slug]/page";

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

function toServiceLink(rawLink: string | undefined, title: string, locale?: string) {
    const source = String(rawLink ?? "").trim();
    const normalizedLocale = String(locale ?? "az").trim().toLowerCase() || "az";

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
            return `/${normalizedLocale}/services/${resolveServiceSlugForLocale(slug, normalizedLocale)}`;
        }
    }

    const titleSlug = slugifyTitle(title);
    return titleSlug ? `/${normalizedLocale}/services/${titleSlug}` : `/${normalizedLocale}/services`;
}
// Descriptions are clamped via CSS to a fixed number of lines (3).

function mapRawToBenefits(rawItems?: any[], locale?: string): BenefitItem[] {
    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
        return defaultBenefitItems.map((item) => ({
            ...item,
            link: toServiceLink(item.link, item.title, locale),
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

        // The cms link is whatever locale it happened to save (these entries
        // reuse the az wording in every locale), but toServiceLink resolves it
        // through the same per-locale dictionary the /services/ page itself
        // uses, so the tile still lands on the right page.
        const rawLink = it?.menu?.link ?? it?.data?.link ?? it?.menu?.url ?? it?.data?.url ?? it?.menu?.href ?? it?.data?.href ?? it?.menu?.path ?? it?.data?.path ?? "";
        const link = toServiceLink(rawLink ? String(rawLink) : undefined, title, locale);

        return { title, description, icon, link } as BenefitItem;
    }).filter((item) => item.title.trim().length > 0);

    if (mapped.length >= 4) return mapped;

    const existing = new Set(mapped.map((item) => item.title.trim().toLocaleLowerCase("az")));
    const missingDefaults = defaultBenefitItems
        .filter((item) => !existing.has(item.title.trim().toLocaleLowerCase("az")))
        // These still carry their raw, locale-less href — route it through the
        // same resolver as the fully-default case below, or the tile links to
        // "/services/…" with no locale segment at all.
        .map((item) => ({ ...item, link: toServiceLink(item.link, item.title, locale) }));

    return [...mapped, ...missingDefaults].slice(0, 4);
}

const BenefitsStrip = ({ items, locale }: { items?: any[]; locale?: string }) => {
    const list = mapRawToBenefits(items, locale);

    return (
        // <section className="w-full" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
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
