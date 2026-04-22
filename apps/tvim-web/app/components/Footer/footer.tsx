import type { ReactNode } from "react";
import {
    type FooterComponentProps,
    type FooterContactItem,
    type FooterSocialItem,
} from "@repo/types/types";
import {
    Footer as FooterUI,
} from "@repo/ui";
import { utils } from "@/utils";

const Footer = ({ footerMenus, footerSettings }: FooterComponentProps) => {
    const dynamicSections = utils.footer.getFooterSections(footerMenus);
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
            logo={logo}
            description={description}
            rightsText={rightsText}
            companyTitle={dynamicSections.companyTitle}
            customerTitle={dynamicSections.customerTitle}
            companyLinks={dynamicSections.companyLinks}
            customerLinks={dynamicSections.customerLinks}
            contacts={contacts}
            socials={socials}
        />
    );
};

export { Footer };
