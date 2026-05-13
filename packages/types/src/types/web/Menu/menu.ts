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

export type HeaderMenuItem = {
    id?: number | string;
    parent_id?: number | string | null;
    type?: string | null;
    name?: string | null;
    title?: string | null;
    link?: string | null;
    multi_links?: Record<string, string> | null;
    in_header?: boolean | number | string | null;
    [key: string]: unknown;
};

export type HeaderMenuResponseData =
    | HeaderMenuItem[]
    | {
          header?: HeaderMenuItem[];
          menus?: HeaderMenuItem[];
          items?: HeaderMenuItem[];
          data?: HeaderMenuItem[];
          footer?: HeaderMenuItem[];
      };

export type HeaderCategoryItem = HeaderMenuItem;

export type HeaderCategoriesResponseData =
    | HeaderCategoryItem[]
    | {
          data?: HeaderCategoryItem[];
          items?: HeaderCategoryItem[];
          [key: string]: unknown;
      };
