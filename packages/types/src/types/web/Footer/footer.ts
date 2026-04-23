import type { ReactNode } from "react";

export type FooterLinkItem = {
    label: string;
    href: string;
};

export type FooterContactItem = {
    label: string;
    href?: string;
    icon?: ReactNode;
};

export type FooterSocialItem = {
    label: string;
    href: string;
    icon?: ReactNode;
};

export type FooterProps = {
    className?: string;
    logo?: ReactNode;
    description?: string;
    rightsText?: string;
    companyTitle?: string;
    customerTitle?: string;
    companyLinks?: FooterLinkItem[];
    customerLinks?: FooterLinkItem[];
    contacts?: FooterContactItem[];
    socials?: FooterSocialItem[];
    socialColorClasses?: string[];
};
