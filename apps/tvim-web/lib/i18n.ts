import { normalizeLocale, type SiteLocale } from "@/lib/site-locales";

type TranslationDictionary = {
    common: {
        home: string;
        account: string;
        login: string;
        logout: string;
        wishlist: string;
        compare: string;
        cart: string;
        catalog: string;
        continue: string;
        send: string;
        sending: string;
        email: string;
        phone: string;
        address: string;
        callUs: string;
        searchPlaceholder: string;
    };
    breadcrumb: {
        brands: string;
        corporate: string;
        services: string;
    };
    service: {
        comingSoon: string;
    };
    search: {
        title: string;
        emptyQuery: string;
        noResults: string;
        categoryFallback: string;
        sort: {
            newest: string;
            nameAsc: string;
            nameDesc: string;
            price: string;
            priceAsc: string;
            priceDesc: string;
            popular: string;
            mostSale: string;
        };
    };
    account: {
        navigation: string;
        myAccount: string;
        orderHistory: string;
        editAccount: string;
        password: string;
        addressBook: string;
        returns: string;
        favorites: string;
        noReturns: string;
        continueShopping: string;
    };
    product: {
        productCode: string;
        inStock: string;
        outOfStock: string;
        addToCart: string;
        inCart: string;
        byOrder: string;
        about: string;
        features: string;
        comments: string;
        writeComment: string;
        comment: string;
        averageRating: string;
        rating: string;
        name: string;
        termsPrefix: string;
        termsLink: string;
        termsSuffix: string;
        noComments: string;
        addedToCart: string;
        removedFromCart: string;
        cartAddFailed: string;
        cartUpdateFailed: string;
    };
};

const translations: Record<SiteLocale, TranslationDictionary> = {
    az: {
        common: {
            home: "Ana səhifə",
            account: "Hesab",
            login: "Giriş",
            logout: "Çıxış",
            wishlist: "Bəyənilənlər",
            compare: "Məhsul müqayisəsi",
            cart: "Səbət",
            catalog: "Kataloq",
            continue: "Davam et",
            send: "Göndər",
            sending: "Göndərilir...",
            email: "Email",
            phone: "Telefon",
            address: "Ünvan",
            callUs: "Bizə zəng edin",
            searchPlaceholder: "Məhsul axtarışı",
        },
        breadcrumb: {
            brands: "Brendlər",
            corporate: "Korporativ",
            services: "Xidmətlər",
        },
        service: {
            comingSoon: "Xidmət haqqında məlumat tezliklə əlavə olunacaq.",
        },
        search: {
            title: "Axtarış",
            emptyQuery: "Axtarış üçün söz daxil edin.",
            noResults: "Nəticə tapılmadı.",
            categoryFallback: "Kateqoriya",
            sort: {
                newest: "Yenilər: üstdə",
                nameAsc: "Ad (A-Z)",
                nameDesc: "Ad (Z-A)",
                price: "Qiymət",
                priceAsc: "Qiymət (artan)",
                priceDesc: "Qiymət (azalan)",
                popular: "Reytinq",
                mostSale: "Model",
            },
        },
        account: {
            navigation: "Naviqasiya",
            myAccount: "Hesabım",
            orderHistory: "Sifariş tarixçəsi",
            editAccount: "Hesabı redaktə et",
            password: "Şifrə",
            addressBook: "Ünvan kitabçası",
            returns: "Geri qaytarma",
            favorites: "Bəyənilənlər",
            noReturns: "Hələ heç bir geri qaytarma sorğunuz yoxdur.",
            continueShopping: "Alış-verişə davam et",
        },
        product: {
            productCode: "Məhsul kodu",
            inStock: "Məhdud saydadır",
            outOfStock: "Stokda yoxdur",
            addToCart: "Səbətə at",
            inCart: "Səbətdə",
            byOrder: "Sifarişlə",
            about: "Məhsul haqqında",
            features: "Xüsusiyyətlər",
            comments: "Şərhlər",
            writeComment: "Şərh yaz",
            comment: "Şərh",
            averageRating: "Orta qiymət",
            rating: "Reytinq",
            name: "Adınız",
            termsPrefix: "Mən",
            termsLink: "istifadə şərtləri",
            termsSuffix: "-ni oxudum və razıyam",
            noComments: "Bu məhsul üçün şərh yazılmayıb.",
            addedToCart: "Məhsul səbətə əlavə edildi.",
            removedFromCart: "Məhsul səbətdən silindi.",
            cartAddFailed: "Səbətə əlavə edilərkən xəta baş verdi.",
            cartUpdateFailed: "Səbət yenilənərkən xəta baş verdi.",
        },
    },
    en: {
        common: {
            home: "Home",
            account: "Account",
            login: "Login",
            logout: "Logout",
            wishlist: "Wishlist",
            compare: "Product comparison",
            cart: "Cart",
            catalog: "Catalog",
            continue: "Continue",
            send: "Send",
            sending: "Sending...",
            email: "Email",
            phone: "Phone",
            address: "Address",
            callUs: "Call us",
            searchPlaceholder: "Search products",
        },
        breadcrumb: {
            brands: "Brands",
            corporate: "Corporate",
            services: "Services",
        },
        service: {
            comingSoon: "Information about this service will be added soon.",
        },
        search: {
            title: "Search",
            emptyQuery: "Type something to search.",
            noResults: "No results found.",
            categoryFallback: "Category",
            sort: {
                newest: "Newest first",
                nameAsc: "Name (A-Z)",
                nameDesc: "Name (Z-A)",
                price: "Price",
                priceAsc: "Price (low-high)",
                priceDesc: "Price (high-low)",
                popular: "Rating",
                mostSale: "Model",
            },
        },
        account: {
            navigation: "Navigation",
            myAccount: "My account",
            orderHistory: "Order history",
            editAccount: "Edit account",
            password: "Password",
            addressBook: "Address book",
            returns: "Returns",
            favorites: "Wishlist",
            noReturns: "You don't have any return requests yet.",
            continueShopping: "Continue Shopping",
        },
        product: {
            productCode: "Product code",
            inStock: "Limited stock",
            outOfStock: "Out of stock",
            addToCart: "Add to cart",
            inCart: "In cart",
            byOrder: "By order",
            about: "About product",
            features: "Features",
            comments: "Comments",
            writeComment: "Write a comment",
            comment: "Comment",
            averageRating: "Average rating",
            rating: "Rating",
            name: "Your name",
            termsPrefix: "I have read and agree to the",
            termsLink: "terms of use",
            termsSuffix: "",
            noComments: "No comments have been written for this product.",
            addedToCart: "Product added to cart.",
            removedFromCart: "Product removed from cart.",
            cartAddFailed: "An error occurred while adding to cart.",
            cartUpdateFailed: "An error occurred while updating the cart.",
        },
    },
    ru: {
        common: {
            home: "Главная",
            account: "Аккаунт",
            login: "Вход",
            logout: "Выход",
            wishlist: "Избранное",
            compare: "Сравнение товаров",
            cart: "Корзина",
            catalog: "Каталог",
            continue: "Продолжить",
            send: "Отправить",
            sending: "Отправляется...",
            email: "Email",
            phone: "Телефон",
            address: "Адрес",
            callUs: "Позвоните нам",
            searchPlaceholder: "Поиск товаров",
        },
        breadcrumb: {
            brands: "Бренды",
            corporate: "Корпоратив",
            services: "Услуги",
        },
        service: {
            comingSoon: "Информация об этой услуге будет добавлена в ближайшее время.",
        },
        search: {
            title: "Поиск",
            emptyQuery: "Введите запрос для поиска.",
            noResults: "Ничего не найдено.",
            categoryFallback: "Категория",
            sort: {
                newest: "Сначала новые",
                nameAsc: "Название (A-Z)",
                nameDesc: "Название (Z-A)",
                price: "Цена",
                priceAsc: "Цена (возр.)",
                priceDesc: "Цена (убыв.)",
                popular: "Рейтинг",
                mostSale: "Модель",
            },
        },
        account: {
            navigation: "Навигация",
            myAccount: "Мой аккаунт",
            orderHistory: "История заказов",
            editAccount: "Редактировать аккаунт",
            password: "Пароль",
            addressBook: "Адресная книга",
            returns: "Возвраты",
            favorites: "Избранное",
            noReturns: "У вас пока нет заявок на возврат.",
            continueShopping: "Продолжить покупки",
        },
        product: {
            productCode: "Код товара",
            inStock: "Ограниченное количество",
            outOfStock: "Нет в наличии",
            addToCart: "В корзину",
            inCart: "В корзине",
            byOrder: "Под заказ",
            about: "О товаре",
            features: "Характеристики",
            comments: "Комментарии",
            writeComment: "Написать комментарий",
            comment: "Комментарий",
            averageRating: "Средняя оценка",
            rating: "Рейтинг",
            name: "Ваше имя",
            termsPrefix: "Я прочитал(а) и согласен(на) с",
            termsLink: "условиями использования",
            termsSuffix: "",
            noComments: "Для этого товара пока нет комментариев.",
            addedToCart: "Товар добавлен в корзину.",
            removedFromCart: "Товар удален из корзины.",
            cartAddFailed: "Ошибка при добавлении в корзину.",
            cartUpdateFailed: "Ошибка при обновлении корзины.",
        },
    },
};

export const getTranslations = (locale: string) => translations[normalizeLocale(locale)];
