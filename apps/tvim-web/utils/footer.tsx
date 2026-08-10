import type { ReactNode } from "react";
import { toHref } from "@repo/shared/utils";
import {
    type MenuItem,
    type ProjectSettingsData,
    type FooterContactItem,
    type FooterLinkItem,
    type FooterSocialItem,
} from "@repo/types/types";

const resolveFooterHref = (link: string | null | undefined, locale?: string): string => {
    if (!link) return "#";
    const raw = String(link);
    if (raw.startsWith("#")) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;

    const hrefPart = raw.trim();
    if (!locale) return toHref(hrefPart);

    const normalizedLocale = locale.trim().toLowerCase();
    let cleaned = hrefPart.replace(/^\/+/, "");
    const localePrefix = `${normalizedLocale}/`;
    if (cleaned.toLowerCase().startsWith(localePrefix)) {
        cleaned = cleaned.slice(localePrefix.length);
    }

    return `/${normalizedLocale}/${cleaned}`;
};

const mapChildrenToLinks = (items: MenuItem[], locale?: string): FooterLinkItem[] => {
    const links: FooterLinkItem[] = [];

    items.forEach((item) => {
        if (item.link) {
            links.push({
                label: item.name,
                href: resolveFooterHref(item.link, locale),
            });
        }
    });

    return links;
};

const mapCategoriesToLinks = (menus: MenuItem[], locale?: string): FooterLinkItem[] => {
    const links: FooterLinkItem[] = [];

    menus.forEach((menu) => {
        if (menu.type === "categories" && (menu.parent_id === null || menu.parent_id === undefined)) {
            if (menu.link) {
                links.push({
                    label: menu.name,
                    href: resolveFooterHref(menu.link, locale),
                });
            }
        }
    });

    return links;
};

/**
 * The "Tvim" footer column is pinned to this order regardless of the menu
 * sort_order coming from the admin: Haqqımızda → Bloq → Brendlər → Əlaqə.
 * Each entry lists the slug that menu uses across locales. Anything not
 * listed keeps its API order and lands after these.
 */
const COMPANY_LINK_ORDER: string[][] = [
    ["haqqimizda", "about-us", "o-nas"],
    ["xeberler", "news", "novisti"],
    ["brands", "product/brands"],
    ["elaqe", "contacts", "kontakty"],
];

const getCompanyLinkRank = (href: string) => {
    const path = String(href ?? "").trim().toLowerCase().replace(/^\/+|\/+$/g, "");
    const withoutLocale = path.replace(/^(az|en|ru)\//, "");
    const index = COMPANY_LINK_ORDER.findIndex((slugs) => slugs.includes(withoutLocale));
    return index === -1 ? COMPANY_LINK_ORDER.length : index;
};

const getBrandsFooterLabel = (locale?: string) => {
    const normalizedLocale = locale?.trim().toLowerCase();
    if (normalizedLocale === "ru") return "Бренды";
    if (normalizedLocale === "en") return "Brands";
    return "Brendlər";
};

const getFooterSections = (menus: MenuItem[], locale?: string) => {
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
    let categoryTitle = "";
    let categoryLinks: FooterLinkItem[] = [];

    if (companySection) {
        companyTitle = companySection.name;
        companyLinks = mapChildrenToLinks(companySection.children, locale);
    }

    if (customerSection) {
        customerTitle = customerSection.name;
        customerLinks = mapChildrenToLinks(customerSection.children, locale);
    }

    const normalizedLocale = String(locale || "").trim().toLowerCase() || "az";
    const brandsHref = `/${normalizedLocale}/brands`;
    const brandsLink = {
        label: getBrandsFooterLabel(locale),
        href: brandsHref,
    };
    // The admin menu still stores the legacy /product/brands link, so both
    // spellings count as "brands is already in this column".
    const isBrandsHref = (value: string | null | undefined) => {
        const path = String(value ?? "").trim().toLowerCase().replace(/^\/+|\/+$/g, "");
        const withoutLocale = path.replace(/^(az|en|ru)\//, "");
        return withoutLocale === "brands" || withoutLocale === "product/brands";
    };
    const pointBrandsLinkAtBrandsPage = (items: FooterLinkItem[]) =>
        items.map((item) => (isBrandsHref(item.href) ? { ...item, href: brandsHref } : item));

    customerLinks = pointBrandsLinkAtBrandsPage(customerLinks);
    companyLinks = pointBrandsLinkAtBrandsPage(companyLinks);

    const hasBrandsInCustomer = customerLinks.some((item) => isBrandsHref(item.href));
    const hasBrandsInCompany = companyLinks.some((item) => isBrandsHref(item.href));

    if (!hasBrandsInCustomer && !hasBrandsInCompany && companyTitle) {
        companyLinks = [...companyLinks, brandsLink];
    }

    // Array.prototype.sort is stable, so unranked links keep their API order.
    companyLinks = [...companyLinks].sort(
        (first, second) => getCompanyLinkRank(first.href) - getCompanyLinkRank(second.href),
    );

    // Static category section: only top-level categories (parent_id === null)
    categoryTitle = "Kateqoriya";
    categoryLinks = mapCategoriesToLinks(menus, locale);

    return {
        companyTitle,
        customerTitle,
        companyLinks,
        customerLinks,
        categoryTitle,
        categoryLinks,
    };
};

const mapSettingsToContacts = (settings: ProjectSettingsData): FooterContactItem[] => {
    const contacts: FooterContactItem[] = [];

    settings.general.phones.forEach((phone) => {
        const normalizedNumber = phone.number.replace(/[^\d+]/g, "");
        contacts.push({
            label: phone.number,
            href: `tel:${normalizedNumber}`,
            icon: <i className="fas fa-phone-alt text-[16px] transform scale-x-[-1]" aria-hidden="true" />,
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
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.general.address)}`,
        icon: <i className="fas fa-map-marker-alt -mt-[2px] text-[16px]" aria-hidden="true" />,
    });
}

    return contacts;
};

/**
 * The footer socials are fixed in code rather than read from the admin
 * `settings.social` block, because that block only carries four networks and
 * has no slot for TikTok or YouTube. Order and brand colours follow the
 * reference footer: Instagram → TikTok → Facebook → YouTube → LinkedIn.
 */
const FOOTER_SOCIALS: Array<FooterSocialItem & { colorClass: string }> = [
    {
        label: "Instagram",
        href: "https://www.instagram.com/tvim.az/",
        icon: <i className="fab fa-instagram text-[16px] text-white" aria-hidden="true" />,
        colorClass: "bg-[#125688]",
    },
    {
        label: "TikTok",
        href: "https://www.tiktok.com/@tvim.az",
        icon: <i className="fab fa-tiktok text-[16px] text-white" aria-hidden="true" />,
        colorClass: "bg-[#fe2c55]",
    },
    {
        label: "Facebook",
        href: "https://www.facebook.com/p/Tvimaz-100095715123358/?_rdr",
        icon: <i className="fab fa-facebook text-[16px] text-white" aria-hidden="true" />,
        colorClass: "bg-[#3a5795]",
    },
    {
        label: "YouTube",
        href: "https://www.youtube.com/@tvimaz",
        icon: <i className="fab fa-youtube text-[16px] text-white" aria-hidden="true" />,
        colorClass: "bg-[#e62117]",
    },
    {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/tvim/",
        icon: <i className="fab fa-linkedin text-[16px] text-white" aria-hidden="true" />,
        colorClass: "bg-[#0a66c2]",
    },
];

const getFooterSocials = (): FooterSocialItem[] =>
    FOOTER_SOCIALS.map(({ colorClass: _colorClass, ...social }) => social);

const getFooterSocialColorClasses = (): string[] => FOOTER_SOCIALS.map((social) => social.colorClass);

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
                className="h-auto w-auto max-w-[150px] object-contain"
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
    getFooterSocials,
    getFooterSocialColorClasses,
    mapSettingsToFooterMeta,
};
