import type { ReactNode } from "react";
import { Mail, Phone, Pin } from "lucide-react";
import { cn } from "../../lib/utils";

export interface FooterLinkItem {
    label: string;
    href: string;
}

export interface FooterContactItem {
    label: string;
    href?: string;
    icon: ReactNode;
}

export interface FooterSocialItem {
    label: string;
    href: string;
    icon: ReactNode;
}

export interface FooterProps {
    className?: string;
    logo?: ReactNode;
    description?: string;
    rightsText?: string;
    companyLinks?: FooterLinkItem[];
    customerLinks?: FooterLinkItem[];
    contacts?: FooterContactItem[];
    socials?: FooterSocialItem[];
}

const defaultCompanyLinks: FooterLinkItem[] = [
    { label: "Bloq", href: "#" },
    { label: "Brendlər", href: "#" },
    { label: "Haqqımızda", href: "#" },
    { label: "Əlaqə", href: "#" },
];

const defaultCustomerLinks: FooterLinkItem[] = [
    { label: "Bonus kartları", href: "#" },
    { label: "Geri qaytarma", href: "#" },
    { label: "Məxfilik Siyasəti", href: "#" },
    { label: "Çatdırılma və ödəniş", href: "#" },
    { label: "İstifadə şərtləri", href: "#" },
];

const defaultContacts: FooterContactItem[] = [
    { label: "+994 (50) 828-08-88", href: "tel:+994508280888", icon: <Phone className="size-4" /> },
    { label: "Info@tvim.az", href: "mailto:Info@tvim.az", icon: <Mail className="size-4" /> },
    { label: "Bakı, Süleyman Sani Axundov 225b", icon: <Pin className="size-4" /> },
];

const defaultSocials: FooterSocialItem[] = [
    {
        label: "Instagram",
        href: "#",
        icon: <i className="fab fa-instagram text-[13px] text-white" aria-hidden="true" />,
    },
    {
        label: "TikTok",
        href: "#",
        icon: <i className="fab fa-tiktok text-[13px] text-white" aria-hidden="true" />,
    },
    {
        label: "Facebook",
        href: "#",
        icon: <i className="fab fa-facebook-f text-[13px] text-white" aria-hidden="true" />,
    },
    {
        label: "YouTube",
        href: "#",
        icon: <i className="fab fa-youtube text-[13px] text-white" aria-hidden="true" />,
    },
    {
        label: "LinkedIn",
        href: "#",
        icon: <i className="fab fa-linkedin-in text-[13px] text-white" aria-hidden="true" />,
    },
];

function Footer({
    className,
    logo,
    description = "Diqqət! Monitorun rəng göstərmə xüsusiyyətlərinə görə məhsulun öz rəngi saytdakı rəngindən fərqli ola bilər.",
    rightsText = "Bütün hüquqlar qorunur © 2016-2025",
    companyLinks = defaultCompanyLinks,
    customerLinks = defaultCustomerLinks,
    contacts = defaultContacts,
    socials = defaultSocials,
}: FooterProps) {
    return (
        <footer
            data-slot="footer"
            className={cn("w-full text-[#24262b]", className)}
        >
            <div className="mx-auto w-full max-w-[1280px] px-4 pt-10 pb-4 sm:px-6 lg:px-8">
                <div className="grid gap-9 md:grid-cols-2 lg:grid-cols-[2.35fr_1fr_1.25fr_1.7fr] lg:gap-14">
                    <div className="space-y-6">
                        {logo ?? (
                            <div className="-mt-1.5 flex items-end gap-1.5">
                                <div className="text-[64px] leading-none font-semibold tracking-[-0.03em] text-[#121316]">
                                    tvim
                                </div>
                                <span className="inline-flex" aria-hidden="true">
                                    <svg viewBox="0 0 12 12" className="size-[13px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1.2 5.3L6 1.5L10.8 5.3V10.8H1.2V5.3Z"
                                            fill="#2258F6"
                                        />
                                    </svg>
                                </span>
                                <div className="text-[14px] font-medium text-[#2d2f35]">
                                    Tikinti və inşaat materialları
                                </div>
                            </div>
                        )}
                        <p className="max-w-[500px] text-[14px] leading-[1.35] text-[#61656c] font-normal">{description}</p>
                    </div>

                    <div>
                        <h3 className="text-[21px] font-semibold leading-none">TVIM</h3>
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

                    <div>
                        <h3 className="text-[21px] font-semibold leading-none">Müştərilər üçün</h3>
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

                    <div className="max-w-[280px] space-y-3 text-[14px] leading-[1.2] font-medium text-[#1f2329] sm:text-[15px]">
                        {contacts.map((item) => {
                            const content = (
                                <>
                                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d6d9de] text-[#2f5dff]">
                                        {item.icon}
                                    </span>
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
                </div>

                <p className="mt-1 text-[15px] text-[#7a7e84] font-normal">{rightsText}</p>
            </div>

            <div className="w-full bg-black/5">
                <div className="mx-auto flex w-full max-w-[1280px] items-center px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {socials.map((item, index) => {
                            const colorClasses = [
                                "bg-[#4f8db8]",
                                "bg-[#3f4146]",
                                "bg-[#6b81b6]",
                                "bg-[#eb675c]",
                                "bg-[#4b8fc3]",
                            ];

                            return (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    aria-label={item.label}
                                    className={cn(
                                        "flex size-8 items-center justify-center rounded-full transition-opacity hover:opacity-90",
                                        colorClasses[index % colorClasses.length]
                                    )}
                                >
                                    {item.icon}
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </footer>
    );
}

export { Footer };
