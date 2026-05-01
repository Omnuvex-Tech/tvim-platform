export type MenuItem = {
    id: number;
    parent_id: number | null;
    // optional discriminator coming from API (e.g. "categories")
    type?: string;
    name: string;
    link: string | null;
    children: MenuItem[];
};

export type FooterMenusData = {
    services: MenuItem[];
    footer: MenuItem[];
};
