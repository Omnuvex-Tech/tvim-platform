import { routePath } from "@repo/shared/routes";

export const pages = {
    home: {
        az: {
            url: "/az",
            title: "Ana səhifə",
            name: "Ana səhifə",
        },
        ru: {
            url: "/ru",
            title: "Главная",
            name: "Главная",
        },
        en: {
            url: "/en",
            title: "Home",
            name: "Home",
        },
    },
    signin: {
        az: {
            url: routePath("signin", "az"),
            title: "Giriş",
            name: "Giriş",
        },
        ru: {
            url: routePath("signin", "ru"),
            title: "Вход",
            name: "Вход",
        },
        en: {
            url: routePath("signin", "en"),
            title: "Sign in",
            name: "Sign in",
        },
    },
    signup: {
        az: {
            url: routePath("signup", "az"),
            title: "Hesab qeydiyyatı",
            name: "Hesab qeydiyyatı",
        },
        ru: {
            url: routePath("signup", "ru"),
            title: "Регистрация",
            name: "Регистрация",
        },
        en: {
            url: routePath("signup", "en"),
            title: "Sign up",
            name: "Sign up",
        },
    },
    signupVerify: {
        az: {
            url: routePath("signup", "az", "/verify"),
            title: "Kod təsdiqi",
            name: "Kod təsdiqi",
        },
        ru: {
            url: routePath("signup", "ru", "/verify"),
            title: "Подтверждение кода",
            name: "Подтверждение кода",
        },
        en: {
            url: routePath("signup", "en", "/verify"),
            title: "Code verification",
            name: "Code verification",
        },
    },
    forgotPassword: {
        az: {
            url: "/az/forgot-password",
            title: "Şifrəni yeniləyin",
            name: "Şifrəni unutmusunuz?",
        },
        ru: {
            url: "/ru/forgot-password",
            title: "Сброс пароля",
            name: "Забыли пароль?",
        },
        en: {
            url: "/en/forgot-password",
            title: "Reset password",
            name: "Forgot password?",
        },
    },
    resetPassword: {
        az: {
            url: "/az/forgot-password/reset-password",
            title: "Yeni şifrə təyin edin",
            name: "Yeni şifrə",
        },
        ru: {
            url: "/ru/forgot-password/reset-password",
            title: "Установить новый пароль",
            name: "Новый пароль",
        },
        en: {
            url: "/en/forgot-password/reset-password",
            title: "Set new password",
            name: "New password",
        },
    },
    account: {
        az: {
            url: routePath("account", "az"),
            title: "Hesabım",
            name: "Hesabım",
        },
        ru: {
            url: routePath("account", "ru"),
            title: "Мой аккаунт",
            name: "Мой аккаунт",
        },
        en: {
            url: routePath("account", "en"),
            title: "My account",
            name: "My account",
        },
    },
    accountEdit: {
        az: {
            url: routePath("account", "az", "/edit"),
            title: "Məlumatları redaktə et",
            name: "Məlumatları redaktə et",
        },
        ru: {
            url: routePath("account", "ru", "/edit"),
            title: "Редактировать профиль",
            name: "Редактировать профиль",
        },
        en: {
            url: routePath("account", "en", "/edit"),
            title: "Edit profile",
            name: "Edit profile",
        },
    },
    accountPassword: {
        az: {
            url: routePath("account", "az", "/password"),
            title: "Şifrəni dəyiş",
            name: "Şifrəni dəyiş",
        },
        ru: {
            url: routePath("account", "ru", "/password"),
            title: "Сменить пароль",
            name: "Сменить пароль",
        },
        en: {
            url: routePath("account", "en", "/password"),
            title: "Change password",
            name: "Change password",
        },
    },
    accountAddress: {
        az: {
            url: routePath("account", "az", "/address"),
            title: "Ünvan kitabçası",
            name: "Ünvan kitabçası",
        },
        ru: {
            url: routePath("account", "ru", "/address"),
            title: "Адресная книга",
            name: "Адресная книга",
        },
        en: {
            url: routePath("account", "en", "/address"),
            title: "Address book",
            name: "Address book",
        },
    },
    accountReturns: {
        az: {
            url: routePath("account", "az", "/returns"),
            title: "Geri qaytarma",
            name: "Geri qaytarma",
        },
        ru: {
            url: routePath("account", "ru", "/returns"),
            title: "Возврат",
            name: "Возврат",
        },
        en: {
            url: routePath("account", "en", "/returns"),
            title: "Returns",
            name: "Returns",
        },
    },
    orderHistory: {
        az: {
            url: routePath("orders", "az"),
            title: "Sifariş tarixçəsi",
            name: "Sifariş tarixçəsi",
        },
        ru: {
            url: routePath("orders", "ru"),
            title: "История заказов",
            name: "История заказов",
        },
        en: {
            url: routePath("orders", "en"),
            title: "Order history",
            name: "Order history",
        },
    },
    orderDetail: {
        az: {
            url: routePath("orders", "az"),
            title: "Sifariş detalı",
            name: "Sifariş detalı",
        },
        ru: {
            url: routePath("orders", "ru"),
            title: "Детали заказа",
            name: "Детали заказа",
        },
        en: {
            url: routePath("orders", "en"),
            title: "Order details",
            name: "Order details",
        },
    },
    wishlist: {
        az: {
            url: routePath("wishlist", "az"),
            title: "Bəyənilənlər",
            name: "Bəyənilənlər",
        },
        ru: {
            url: routePath("wishlist", "ru"),
            title: "Избранное",
            name: "Избранное",
        },
        en: {
            url: routePath("wishlist", "en"),
            title: "Wishlist",
            name: "Wishlist",
        },
    },
    compare: {
        az: {
            url: routePath("compare", "az"),
            title: "Məhsul müqayisəsi",
            name: "Məhsul müqayisəsi",
        },
        ru: {
            url: routePath("compare", "ru"),
            title: "Сравнение товаров",
            name: "Сравнение товаров",
        },
        en: {
            url: routePath("compare", "en"),
            title: "Compare products",
            name: "Compare products",
        },
    },
    checkout: {
        az: {
            url: routePath("checkout", "az"),
            title: "Sifariş rəsmiləşdirmə",
            name: "Sifariş rəsmiləşdirmə",
        },
        ru: {
            url: routePath("checkout", "ru"),
            title: "Оформление заказа",
            name: "Оформление заказа",
        },
        en: {
            url: routePath("checkout", "en"),
            title: "Checkout",
            name: "Checkout",
        },
    },
} as const;
