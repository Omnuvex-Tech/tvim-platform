import type { FooterProps } from "@repo/types/types";
import { cn } from "../../lib/utils";

const defaultSocialColorClasses: string[] = [
    "bg-[#4f8db8]",
    "bg-[#3f4146]",
    "bg-[#6b81b6]",
    "bg-[#eb675c]",
    "bg-[#4b8fc3]",
];

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
}: FooterProps) => {
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
            <div className="mx-auto w-full max-w-[1280px] pt-10 pb-4">
                <div className={cn("grid gap-9 md:grid-cols-2 lg:gap-14", lgColsClass)}>
                    <div className="space-y-6">
                        <div className="flex items-end gap-0">
                            <span className="flex min-w-0 shrink overflow-hidden [&_img]:h-auto [&_img]:w-auto [&_img]:max-w-[150px]">
                                {logo}
                            </span>
                            <span className="hidden text-[14px] leading-none font-normal whitespace-nowrap text-black sm:inline">
                                Tikinti və inşaat materialları
                            </span>
                        </div>

                        <p className="mt-2 text-[14px] font-normal text-[rgba(119,119,119,1)] leading-[20px] max-w-[500px]">
                            Diqqət! Monitorun rəng göstərmə xüsusiyyətlərinə görə məhsulun öz rəngi saytdakı rəngindən fərqli ola bilər.
                        </p>

                        {description ? (
                            <p className="max-w-[500px] text-[14px] leading-[1.35] text-[#61656c] font-normal">{description}</p>
                        ) : null}
                    </div>

                    {categoryLinks.length > 0 ? (
                        <div>
                            <h3 className="text-[21px] font-bold leading-none">{categoryTitle}</h3>
                            <div className="mt-4 pr-2">
                                <ul className="space-y-2.5 text-[14px] font-medium text-[#272a30]">
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
                            <h3 className="text-[21px] font-bold leading-none">{companyTitle}</h3>
                            <ul className="mt-4 space-y-2.5 text-[14px] font-medium text-[#272a30]">
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
                            <h3 className="text-[21px] font-bold leading-none">{customerTitle}</h3>
                            <ul className="mt-4 space-y-2.5 text-[14px] font-medium text-[#272a30]">
                                {customerLinks.map((item) => (
                                    <li key={item.label}>
                                        <a href={item.href} className="transition-colors hover:text-black">
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {contacts.length > 0 ? (
                        <div className="max-w-[280px] pl-6 space-y-3 text-[14px] leading-[1.2] font-medium text-[#1f2329] sm:pl-7 sm:text-[15px]">
                            {contacts.map((item) => {
                                        const content = (
                                            <>
                                                {item.icon ? (
                                                    <span
                                                        className={cn(
                                                            "flex size-[38px] shrink-0 items-center justify-center rounded-full border border-[#d6d9de] text-[#2f5dff]",
                                                            item.href ? "mt-0.5" : "-mt-0.5"
                                                        )}
                                                    >
                                                        {item.icon}
                                                    </span>
                                                ) : null}
                                                <span className="group-hover:underline">{item.label}</span>
                                            </>
                                        );

                                        if (item.href) {
                                            return (
                                                <a
                                                    key={item.label}
                                                    href={item.href}
                                                    className="flex items-center gap-3 transition-colors hover:text-black group"
                                                >
                                                    {content}
                                                </a>
                                            );
                                        }

                                        return (
                                            <div key={item.label} className="flex items-start gap-3 group">
                                                {content}
                                            </div>
                                        );
                                    })}
                        </div>
                    ) : null}
                </div>

                {rightsText ? <p className="mt-1 text-[15px] text-[#7a7e84] font-normal">{rightsText}</p> : null}
            </div>

            {socials.length > 0 ? (
                <div className="w-full bg-black/5 [box-shadow:0_0_0_100vmax_rgba(0,0,0,0.05)] [clip-path:inset(0_-100vmax)]">
                    <div className={cn("mx-auto w-full max-w-[1280px] px-4 py-3 sm:px-6 lg:px-0 lg:grid lg:items-center", lgColsClass)}>
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

                        <p className={cn("mt-2 text-left text-[14px] font-normal text-[#61656c] sm:mt-0 sm:text-right lg:justify-self-end", rightsColClass)}>
                            Bütün hüquqlar qorunur © 2016—2025
                        </p>
                    </div>
                </div>
            ) : null}
        </footer>
    );
};

export { Footer };
