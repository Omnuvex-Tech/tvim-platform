export const endpoints = {
    pages: {
        giris: {
            az: {
                url: "/giris",
                title: "Giriş",
                name: "Giriş",
            },
            ru: {
                url: "/giris",
                title: "Вход",
                name: "Вход",
            },
            en: {
                url: "/giris",
                title: "Login",
                name: "Login",
            },
        },
        anaSehife: {
            az: {
                url: "/",
                title: "Ana səhifə",
                name: "Ana səhifə",
            },
            ru: {
                url: "/",
                title: "Главная",
                name: "Главная",
            },
            en: {
                url: "/",
                title: "Home",
                name: "Home",
            },
        },
    },

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
