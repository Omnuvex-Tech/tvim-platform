import type { MenuItem } from "../Menu/menu";

export type ProjectSettingsPhone = {
    label: string;
    number: string;
    is_whatsapp: boolean;
};

export type ProjectSettingsGeneral = {
    site_title: string;
    site_about: string;
    site_header_text: string;
    address: string;
    email: string;
    phones: ProjectSettingsPhone[];
    images: {
        logo: string | null;
    };
};

export type ProjectSettingsSocialEntry = {
    icon?: string;
    link: string | null;
    active?: string;
};

export type ProjectSettingsData = {
    general: ProjectSettingsGeneral;
    social: {
        facebook?: ProjectSettingsSocialEntry;
        instagram?: ProjectSettingsSocialEntry;
        twitter?: ProjectSettingsSocialEntry;
        linkedin?: ProjectSettingsSocialEntry;
    };
};

export type ProjectSettingsResponseData = {
    data: ProjectSettingsData;
};

export type ProjectSettingsSocialConfigItem = {
    key: keyof ProjectSettingsData["social"];
    label: string;
    short: string;
};

export type FooterComponentProps = {
    footerMenus: MenuItem[];
    footerSettings?: ProjectSettingsData;
};
