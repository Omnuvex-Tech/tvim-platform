import type { ReactNode } from "react";
import { toHref } from "@repo/shared/utils";
import {
    type MenuItem,
    type ProjectSettingsData,
    type ProjectSettingsSocialConfigItem,
    type FooterContactItem,
    type FooterLinkItem,
    type FooterSocialItem,
} from "@repo/types/types";

const mapChildrenToLinks = (items: MenuItem[]): FooterLinkItem[] => {
    const links: FooterLinkItem[] = [];

    items.forEach((item) => {
        if (item.link) {
            links.push({
                label: item.name,
                href: toHref(item.link),
            });
        }
    });

    return links;
};

const getFooterSections = (menus: MenuItem[]) => {
    const sectionMenus = menus.filter((menu) => menu.children.length > 0);
    let companySection: MenuItem | undefined;
    let customerSection: MenuItem | undefined;

    sectionMenus.forEach((menu) => {
        const lowerName = menu.name.toLocaleLowerCase("az");
        let isCustomerSection = false;

        if (lowerName.includes("musteri")) {
            isCustomerSection = true;
        }

        if (lowerName.includes("müştəri")) {
            isCustomerSection = true;
        }

        if (lowerName.includes("customer")) {
            isCustomerSection = true;
        }

        if (isCustomerSection) {
            if (!customerSection) {
                customerSection = menu;
            }
            return;
        }

        if (!companySection) {
            companySection = menu;
        }
    });

    if (!companySection && sectionMenus.length > 0) {
        companySection = sectionMenus[0];
    }

    if (!customerSection && sectionMenus.length > 1) {
        if (sectionMenus[0] === companySection) {
            customerSection = sectionMenus[1];
        } else {
            customerSection = sectionMenus[0];
        }
    }

    let companyTitle = "";
    let customerTitle = "";
    let companyLinks: FooterLinkItem[] = [];
    let customerLinks: FooterLinkItem[] = [];

    if (companySection) {
        companyTitle = companySection.name;
        companyLinks = mapChildrenToLinks(companySection.children);
    }

    if (customerSection) {
        customerTitle = customerSection.name;
        customerLinks = mapChildrenToLinks(customerSection.children);
    }

    return {
        companyTitle,
        customerTitle,
        companyLinks,
        customerLinks,
    };
};

const mapSettingsToContacts = (settings: ProjectSettingsData): FooterContactItem[] => {
    const contacts: FooterContactItem[] = [];

    settings.general.phones.forEach((phone) => {
        const normalizedNumber = phone.number.replace(/[^\d+]/g, "");
        contacts.push({
            label: phone.number,
            href: `tel:${normalizedNumber}`,
            icon: <i className="fas fa-phone-alt text-[16px]" aria-hidden="true" />,
        });
    });

    if (settings.general.email) {
        contacts.push({
            label: settings.general.email,
            href: `mailto:${settings.general.email}`,
            icon: <i className="fas fa-envelope text-[16px]" aria-hidden="true" />,
        });
    }

    if (settings.general.address) {
        contacts.push({
            label: settings.general.address,
            icon: <i className="fas fa-map-marker-alt text-[16px]" aria-hidden="true" />,
        });
    }

    return contacts;
};

const mapSettingsToSocials = (settings: ProjectSettingsData): FooterSocialItem[] => {
    const socials: FooterSocialItem[] = [];
    const socialEntries: ProjectSettingsSocialConfigItem[] = [
        { key: "instagram", label: "Instagram", short: "IG" },
        { key: "facebook", label: "Facebook", short: "FB" },
        { key: "twitter", label: "Twitter", short: "TW" },
        { key: "linkedin", label: "LinkedIn", short: "IN" },
    ];

    socialEntries.forEach((entryItem) => {
        const item = settings.social[entryItem.key];
        if (item && item.link) {
            let isActive = true;

            if (item.active === "0") {
                isActive = false;
            }

            if (isActive) {
                let iconClass = "fas fa-link";

                if (item.icon) {
                    iconClass = item.icon;
                }

                socials.push({
                    label: entryItem.label,
                    href: item.link,
                    icon: <i className={`${iconClass} text-[17px] text-white`} aria-hidden="true" />,
                });
            }
        }
    });

    return socials;
};

const mapSettingsToFooterMeta = (settings: ProjectSettingsData) => {
    let logo: ReactNode | undefined;
    let description: string | undefined;
    let rightsText: string | undefined;

    if (settings.general.site_about) {
        description = settings.general.site_about;
    }

    if (settings.general.site_header_text) {
        rightsText = settings.general.site_header_text;
    }

    if (settings.general.images.logo) {
        logo = (
            <img
                src={settings.general.images.logo}
                alt={settings.general.site_title}
                className="h-14 w-auto object-contain"
            />
        );
    } else if (settings.general.site_title) {
        logo = (
            <div className="text-[28px] leading-none font-semibold tracking-[-0.02em] text-[#121316]">
                {settings.general.site_title}
            </div>
        );
    }

    return {
        logo,
        description,
        rightsText,
    };
};

export const footerUtils = {
    getFooterSections,
    mapSettingsToContacts,
    mapSettingsToSocials,
    mapSettingsToFooterMeta,
};
