export const endpoints = {
    auth: {
        login: "/customer/auth/login",
        register: "/customer/auth/register",
        forgotPassword: "/customer/auth/forgot-password",
        otpVerify: "/customer/auth/otp/verify",
        resetPassword: "/customer/auth/reset-password",
        emailVerify: "/customer/auth/email/verify",
        emailResend: "/customer/auth/email/resend",
        logout: "/customer/auth/logout",
        me: "/customer/auth/user",
        user: "/customer/auth/user",
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
        detail: (link: string) => `/menus/detail?link=${link}`,
    },

    settings: {
        get: "/settings",
    },

    subscription: {
        create: "/subscribe",
    },

    mainPage: {
        list: "/main-page",
    },

    products: {
        list: "/products",
        detail: (slug: string) => `/products/${slug}`,
        categories: "/categories",
    },

    favorites: {
        list: "/favorites",
        toggle: "/favorites/toggle",
        token: "/guest-token",
    },

    compare: {
        list: "/compare",
        toggle: "/compare/toggle",
        token: "/guest-token",
    },
} as const;
