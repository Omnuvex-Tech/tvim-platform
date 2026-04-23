export type MenuItem = {
    id: number;
    parent_id: number | null;
    name: string;
    link: string | null;
    children: MenuItem[];
};

export type FooterMenusData = {
    services: MenuItem[];
    footer: MenuItem[];
};
