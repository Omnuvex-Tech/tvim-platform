// import type { ReactNode } from "react";
// import {
//     type FooterComponentProps,
//     type FooterContactItem,
//     type FooterSocialItem,
// } from "@repo/types/types";
// import {
//     Footer as FooterUI,
// } from "@repo/ui";
// import { utils } from "@/utils";

// const Footer = ({ footerMenus, footerSettings, locale }: FooterComponentProps) => {
//     const dynamicSections = utils.footer.getFooterSections(footerMenus, locale);
//     let logo: ReactNode | undefined;
//     let description: string | undefined;
//     let rightsText: string | undefined;
//     let contacts: FooterContactItem[] = [];
//     let socials: FooterSocialItem[] = [];

//     if (footerSettings) {
//         contacts = utils.footer.mapSettingsToContacts(footerSettings);
//         socials = utils.footer.mapSettingsToSocials(footerSettings);
//         const footerMeta = utils.footer.mapSettingsToFooterMeta(footerSettings);
//         logo = footerMeta.logo;
//         description = footerMeta.description;
//         rightsText = footerMeta.rightsText;
//     }

//     return (
//         <FooterUI
//             locale={locale}
//             logo={logo}
//             description={description}
//             rightsText={rightsText}
//             companyTitle={dynamicSections.companyTitle}
//             customerTitle={dynamicSections.customerTitle}
//             companyLinks={dynamicSections.companyLinks}
//             customerLinks={dynamicSections.customerLinks}
//             categoryTitle={dynamicSections.categoryTitle}
//             categoryLinks={dynamicSections.categoryLinks}
//             contacts={contacts}
//             socials={socials}
//         />
//     );
// };

// export { Footer };


"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
    type FooterComponentProps,
    type FooterContactItem,
    type FooterSocialItem,
} from "@repo/types/types";
import {
    Footer as FooterUI,
} from "@repo/ui";
import { utils } from "@/utils";
import { useLanguageStore } from "@/stores";

const SUPPORTED_LOCALES = new Set(["az", "en", "ru"]);

const Footer = ({ footerMenus, footerSettings, locale }: FooterComponentProps) => {
    const pathname = usePathname();
    const { locale: storedLocale } = useLanguageStore();

    const localeFromPath = pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
    const normalizedStored = storedLocale?.trim().toLowerCase() ?? "";

    const effectiveLocale = SUPPORTED_LOCALES.has(localeFromPath)
        ? localeFromPath
        : SUPPORTED_LOCALES.has(normalizedStored)
            ? normalizedStored
            : locale;

    const dynamicSections = utils.footer.getFooterSections(footerMenus, locale);
    let logo: ReactNode | undefined;
    let description: string | undefined;
    let rightsText: string | undefined;
    let contacts: FooterContactItem[] = [];
    let socials: FooterSocialItem[] = [];

    if (footerSettings) {
        contacts = utils.footer.mapSettingsToContacts(footerSettings);
        socials = utils.footer.mapSettingsToSocials(footerSettings);
        const footerMeta = utils.footer.mapSettingsToFooterMeta(footerSettings);
        logo = footerMeta.logo;
        description = footerMeta.description;
        rightsText = footerMeta.rightsText;
    }

    return (
        <FooterUI
            locale={effectiveLocale}
            logo={logo}
            description={description}
            rightsText={rightsText}
            companyTitle={dynamicSections.companyTitle}
            customerTitle={dynamicSections.customerTitle}
            companyLinks={dynamicSections.companyLinks}
            customerLinks={dynamicSections.customerLinks}
            categoryTitle={dynamicSections.categoryTitle}
            categoryLinks={dynamicSections.categoryLinks}
            contacts={contacts}
            socials={socials}
        />
    );
};

export { Footer };