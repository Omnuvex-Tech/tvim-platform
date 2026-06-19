import type { FooterProps as BaseFooterProps } from "@repo/types/types";
import { cn } from "../../lib/utils";


type FooterProps = BaseFooterProps & {
    locale?: string;
};

const defaultSocialColorClasses: string[] = [
    "bg-[#4f8db8]",
    "bg-[#3f4146]",
    "bg-[#6b81b6]",
    "bg-[#eb675c]",
    "bg-[#4b8fc3]",
];

const footerCopy = {
    az: {
        tagline: "Tikinti və inşaat materialları",
        disclaimer:
            "Diqqət! Monitorun rəng göstərmə xüsusiyyətlərinə görə məhsulun öz rəngi saytdakı rəngindən fərqli ola bilər.",
        rightsText: "Bütün hüquqlar qorunur © 2016—2025",
    },
    en: {
        tagline: "Construction and building materials",
        disclaimer:
            "Attention! Due to your monitor's color display settings, the actual color of the product may differ from the color shown on the website.",
        rightsText: "All rights reserved © 2016—2025",
    },
    ru: {
        tagline: "Строительные и отделочные материалы",
        disclaimer:
            "Внимание! Из-за особенностей цветопередачи монитора реальный цвет товара может отличаться от цвета на сайте.",
        rightsText: "Все права защищены © 2016—2025",
    },
} as const;

function getFooterCopy(locale?: string) {
    const normalizedLocale = String(locale || "az").trim().toLowerCase();
    if (normalizedLocale === "en" || normalizedLocale === "ru") {
        return footerCopy[normalizedLocale];
    }

    return footerCopy.az;
}

const Footer = ({
    className,
    logo,
    description,
    rightsText,
    companyTitle,
    customerTitle,
    categoryTitle,
    companyLinks = [],
    customerLinks = [],
    categoryLinks = [],
    contacts = [],
    socials = [],
    socialColorClasses = defaultSocialColorClasses,
    locale = "az",
}: FooterProps) => {
    const copy = getFooterCopy(locale);
    const hasCategory = categoryLinks && categoryLinks.length > 0;
    const lgColsClass = hasCategory
        ? "lg:grid-cols-[2.35fr_1.8fr_0.95fr_1.3fr_1.7fr]"
        : "lg:grid-cols-[2.35fr_0.95fr_1.3fr_1.7fr]";
    const rightsColClass = hasCategory ? "lg:col-start-5" : "lg:col-start-4";
    return (
        <footer
            data-slot="footer"
            className={cn("w-full font-[family-name:var(--font-inter)] text-[#24262b]", className)}
        >
            <div className="mx-auto w-full max-w-[1280px] px-1 pt-10 pb-2 sm:pb-4 lg:px-2">
                <div className={cn("grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-2 lg:gap-14", lgColsClass)}>
                    <div className="col-span-2 space-y-5 lg:col-span-1 lg:space-y-6">
                        <div className="flex items-end gap-0">
                            <span className="flex min-w-0 shrink overflow-hidden [&_img]:h-auto [&_img]:w-auto [&_img]:max-w-[150px]">
                                {logo}
                            </span>
                            <span className="hidden text-[14px] leading-none font-normal whitespace-nowrap text-black sm:inline">
                                {copy.tagline}
                            </span>
                        </div>

                        <p className="mt-2 w-full max-w-none text-[13px] leading-[1.35] font-normal text-[rgba(119,119,119,1)] lg:max-w-[500px] lg:text-[14px] lg:leading-[20px]">
                            {copy.disclaimer}
                        </p>

                        {description ? (
                            <p className="max-w-[500px] text-[14px] leading-[1.35] text-[#61656c] font-normal">{description}</p>
                        ) : null}
                    </div>

                    {categoryLinks.length > 0 ? (
                        <div>
                            <h3 className="text-[16px] font-bold leading-none lg:text-[21px]">{categoryTitle}</h3>
                            <div className="mt-4 pr-2">
                                <ul className="space-y-3 text-[13px] font-medium text-[#272a30] lg:space-y-2.5 lg:text-[14px]">
                                    {categoryLinks.map((item) => (
                                        <li key={item.label}>
                                            <a href={item.href} className="transition-colors hover:text-black">
                                                {item.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : null}

                    {companyLinks.length > 0 ? (
                        <div>
                            <h3 className="text-[16px] font-bold leading-none lg:text-[21px]">{companyTitle}</h3>
                            <ul className="mt-4 space-y-3 text-[13px] font-medium text-[#272a30] lg:space-y-2.5 lg:text-[14px]">
                                {companyLinks.map((item) => (
                                    <li key={item.label}>
                                        <a href={item.href} className="transition-colors hover:text-black">
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {customerLinks.length > 0 ? (
                        <div>
                            <h3 className="text-[16px] font-bold leading-none lg:text-[21px]">{customerTitle}</h3>
                            <ul className="mt-4 space-y-3 text-[13px] font-medium text-[#272a30] lg:space-y-2.5 lg:text-[14px]">
                                {customerLinks.map((item, index) => (
                                    <li key={`${item.href ?? ""}-${item.label}-${index}`}>
                                        <a href={item.href} className="transition-colors hover:text-black">
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {contacts.length > 0 ? (
                        <div className="col-span-2 mx-0 max-w-full min-w-0 space-y-3.5 pl-0 pr-0 text-[17px] leading-[1.3] font-normal text-[#1f2329] sm:max-w-[320px] lg:col-span-1 lg:max-w-[360px] lg:space-y-3 lg:text-[14px] lg:font-medium">
                            {contacts.map((item) => {
                                        const content = (
                                            <>
                                                {item.icon ? (
                                                    <span
                                                        className={cn(
                                                            "flex size-[34px] shrink-0 items-center justify-center rounded-full border border-[#d6d9de] text-[#2f5dff] lg:size-[38px]",
                                                            item.href ? "mt-0.5" : "-mt-0.5"
                                                        )}
                                                    >
                                                        {item.icon}
                                                    </span>
                                                ) : null}
                                                <span className="min-w-0 break-words leading-[1.35] group-hover:underline">{item.label}</span>
                                            </>
                                        );

                                        if (item.href) {
                                            return (
                                                <a
                                                    key={item.label}
                                                    href={item.href}
                                                    className="group flex min-w-0 items-center justify-start gap-3 text-left transition-colors hover:text-black"
                                                >
                                                    {content}
                                                </a>
                                            );
                                        }

                                        return (
                                            <div key={item.label} className="group flex min-w-0 items-center justify-start gap-3 text-left">
                                                {content}
                                            </div>
                                        );
                                    })}
                        </div>
                    ) : null}
                </div>

                {rightsText ? <p className="mt-6 text-[13px] font-normal text-[#7a7e84] lg:mt-1 lg:text-[15px]">{rightsText}</p> : null}
                {socials.length > 0 && !rightsText ? (
                    <p className="mt-6 text-[13px] font-normal text-[#7a7e84] lg:hidden">{copy.rightsText}</p>
                ) : null}
            </div>

            {socials.length > 0 ? (
                <div className="hidden w-full bg-black/5 [box-shadow:0_0_0_100vmax_rgba(0,0,0,0.05)] [clip-path:inset(0_-100vmax)] lg:block">
                    <div className={cn("mx-auto w-full max-w-[1280px] px-1 py-3 lg:px-2 lg:grid lg:items-center", lgColsClass)}>
                        <div className="flex flex-wrap items-center justify-start gap-2.5 lg:col-start-1">
                            {socials.map((item, index) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    aria-label={item.label}
                                    className={cn(
                                        "flex size-[34px] items-center justify-center rounded-full transition-opacity hover:opacity-90",
                                        socialColorClasses[index % socialColorClasses.length]
                                    )}
                                >
                                    {item.icon}
                                </a>
                            ))}
                        </div>

                        <p className={cn("mt-2 text-left text-[14px] font-normal text-[#61656c] lg:mt-0 lg:text-right lg:justify-self-end", rightsColClass)}>
                            {copy.rightsText}
                        </p>
                    </div>
                </div>
            ) : null}
        </footer>
    );
};

export { Footer };
