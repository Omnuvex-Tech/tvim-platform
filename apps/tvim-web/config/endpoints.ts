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

    products: {
        list: "/products",
        detail: (slug: string) => `/products/${slug}`,
        categories: "/categories",
    },
} as const;
