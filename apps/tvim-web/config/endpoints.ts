export const endpoints = {
    auth: {
        login: "/auth/login",
        register: "/auth/register",
        logout: "/auth/logout",
        me: "/auth/me",
    },

    languages: {
        list: "/languages",
    },

    translations: {
        list: "/translations",
    },

    sliders: {
        list: "/sliders",
    },
    
    menus: {
        list: "/menus",
    },

    settings: {
        get: "/settings",
    },

    mainPage: {
        list: "/main-page",
    },

    products: {
        list: "/products",
        detail: (slug: string) => `/products/${slug}`,
        categories: "/categories",
    },
} as const;
