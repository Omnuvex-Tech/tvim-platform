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
    companyLinks = [],
    customerLinks = [],
    contacts = [],
    socials = [],
    socialColorClasses = defaultSocialColorClasses,
}: FooterProps) => {
    return (
        <footer
            data-slot="footer"
            className={cn("w-full font-[family-name:var(--font-inter)] text-[#24262b]", className)}
        >
            <div className="mx-auto w-full max-w-[1280px] pt-10 pb-4">
                <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-[2.35fr_1fr_1.25fr_1.7fr] lg:gap-14">
                    <div className="space-y-6">
                        {logo}
                        {description ? (
                            <p className="max-w-[500px] text-[14px] leading-[1.35] text-[#61656c] font-normal">{description}</p>
                        ) : null}
                    </div>

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
                        <div className="max-w-[280px] space-y-3 text-[14px] leading-[1.2] font-medium text-[#1f2329] sm:text-[15px]">
                            {contacts.map((item) => {
                                const content = (
                                    <>
                                        {item.icon ? (
                                            <span className="mt-0.5 flex size-[38px] shrink-0 items-center justify-center rounded-full border border-[#d6d9de] text-[#2f5dff]">
                                                {item.icon}
                                            </span>
                                        ) : null}
                                        <span>{item.label}</span>
                                    </>
                                );

                                if (item.href) {
                                    return (
                                        <a
                                            key={item.label}
                                            href={item.href}
                                            className="flex items-center gap-3 transition-colors hover:text-black"
                                        >
                                            {content}
                                        </a>
                                    );
                                }

                                return (
                                    <div key={item.label} className="flex items-start gap-3">
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
                <div className="w-full bg-black/5">
                    <div className="mx-auto flex w-full max-w-[1280px] items-center px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap items-center gap-2.5">
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
                    </div>
                </div>
            ) : null}
        </footer>
    );
};

export { Footer };
