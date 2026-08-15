import type { ReactNode } from "react";

export type FooterLinkItem = {
    label: string;
    href: string;
};

export type FooterContactItem = {
    label: string;
    href?: string;
    icon?: ReactNode;
    /** Set for the map link, so the site is not replaced by Google Maps. */
    target?: string;
};

export type FooterSocialItem = {
    label: string;
    href: string;
    icon?: ReactNode;
};

export type FooterProps = {
     locale?: string;
    className?: string;
    logo?: ReactNode;
    description?: string;
    rightsText?: string;
    companyTitle?: string;
    customerTitle?: string;
    categoryTitle?: string;
    categoryLinks?: FooterLinkItem[];
    companyLinks?: FooterLinkItem[];
    customerLinks?: FooterLinkItem[];
    contacts?: FooterContactItem[];
    socials?: FooterSocialItem[];
    socialColorClasses?: string[];
};
