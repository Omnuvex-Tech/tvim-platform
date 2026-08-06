const GUEST_TOKEN_ENDPOINT = "/guest-token" as const;

export const endpoints = {
    auth: {
        login: "/customer/auth/login",
        register: "/customer/auth/register",
        forgotPassword: "/customer/auth/forgot-password",
        otpVerify: "/customer/auth/otp/verify",
        resetPassword: "/customer/auth/reset-password",
        emailVerify: "/customer/auth/otp/verify",
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
        detail: (link: string, dataSlug?: string) => {
            const base = `/menus/detail?link=${encodeURIComponent(link)}`;
            return dataSlug ? `${base}&data_slug=${encodeURIComponent(dataSlug)}` : base;
        },
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
        paginatedList: "/product/list",
        detailBySlug: (slug: string) => `/product/detail/${slug}`,
        categories: "/categories",
        purchaseRequests: "/product/purchase-requests",
    },

    productComments: {
        list: "/product/comments",
        create: "/product/comments",
    },

    favorites: {
        list: "/favorites",
        toggle: "/favorites/toggle",
        token: GUEST_TOKEN_ENDPOINT,
    },

    compare: {
        list: "/compare",
        toggle: "/compare/toggle",
        token: GUEST_TOKEN_ENDPOINT,
    },

    cart: {
        active: "/cart",
        items: "/cart/items",
        updateItem: (variationId: number | string) => `/cart/items/${variationId}`,
    },
} as const;
