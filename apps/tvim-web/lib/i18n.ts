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
        price: string;
        allSpecs: string;
        noFeatures: string;
        relatedProducts: string;
        linkedProducts: string;
        increase: string;
        decrease: string;
        favorites: string;
        compareLabel: string;
        favoriteAdded: string;
        favoriteRemoved: string;
        compareAdded: string;
        compareRemoved: string;
        favoriteUpdateFailed: string;
        compareUpdateFailed: string;
        cartAddBlocked: string;
        outOfStockToast: string;
        productFallback: string;
        userFallback: string;
        yourName: string;
        writeCommentPlaceholder: string;
        send: string;
        commentSent: string;
        commentFailed: string;
        variationNotFound: string;
        enterName: string;
        enterComment: string;
        ratingRange: string;
    };
    home: {
        selected: string;
        special: string;
        latest: string;
    };
    quickOrder: {
        title: string;
        fullName: string;
        phone: string;
        product: string;
        quantity: string;
        submit: string;
        submitting: string;
        close: string;
        nameTooShort: string;
        invalidPhone: string;
        invalidQuantity: string;
        missingProduct: string;
        success: string;
        failed: string;
    };
    cart: {
        title: string;
        unitPrice: string;
        lineTotal: string;
        total: string;
        continueShopping: string;
        checkout: string;
        remove: string;
        addedToCart: string;
        addedToCartFallback: string;
        addToCartFailed: string;
        favoriteFailed: string;
        favoriteError: string;
        compareFailed: string;
        compareError: string;
    };
    register: {
        intro: string;
        name: string;
        surname: string;
        phone: string;
        email: string;
        password: string;
        passwordConfirm: string;
        togglePassword: string;
        toggleConfirmPassword: string;
        subscribe: string;
        yes: string;
        no: string;
        termsPrefix: string;
        termsLink: string;
        termsSuffix: string;
        closeTerms: string;
        submit: string;
        haveAccountPrefix: string;
        haveAccountLink: string;
        haveAccountSuffix: string;
        required: string;
        passwordMismatch: string;
        fillRequired: string;
        acceptTerms: string;
        captchaMissingConfig: string;
        captchaRequired: string;
        captchaExpired: string;
        captchaNotLoaded: string;
        captchaReload: string;
        captchaScriptFailed: string;
        captchaFailed: string;
        captchaError: string;
        registerFailed: string;
        registerSuccess: string;
        subscribeFailed: string;
        subscribeConnectionFailed: string;
        connectionError: string;
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
            price: "Qiymət",
            allSpecs: "Bütün xüsusiyyətlər",
            noFeatures: "Xüsusiyyət tapılmadı.",
            relatedProducts: "Oxşar məhsullar",
            linkedProducts: "Əlaqəli məhsullar",
            increase: "Artır",
            decrease: "Azalt",
            favorites: "Seçilmişlər",
            compareLabel: "Müqayisə",
            favoriteAdded: "Məhsul seçilmişlərə əlavə edildi.",
            favoriteRemoved: "Məhsul seçilmişlərdən silindi.",
            compareAdded: "Məhsul müqayisəyə əlavə edildi.",
            compareRemoved: "Məhsul müqayisədən silindi.",
            favoriteUpdateFailed: "Favori yenilənərkən xəta baş verdi.",
            compareUpdateFailed: "Müqayisə yenilənərkən xəta baş verdi.",
            cartAddBlocked: "Bu məhsul səbətə əlavə edilə bilmədi.",
            outOfStockToast: "Bu məhsul stokda yoxdur.",
            productFallback: "Məhsul",
            userFallback: "İstifadəçi",
            yourName: "Adınız",
            writeCommentPlaceholder: "Şərh yazın",
            send: "Göndər",
            commentSent: "Şərhiniz göndərildi.",
            commentFailed: "Şərh göndərilərkən xəta baş verdi.",
            variationNotFound: "Məhsul variasiyası tapılmadı.",
            enterName: "Adınızı daxil edin.",
            enterComment: "Şərh mətnini daxil edin.",
            ratingRange: "Reytinq 1-5 aralığında olmalıdır.",
        },
        quickOrder: {
            title: "Məhsulu sifariş etmək istəyirsiniz?",
            fullName: "Ad və soyadınız *",
            phone: "Nömrəniz *",
            product: "Məhsul",
            quantity: "Miqdar",
            submit: "Sorğunu göndər",
            submitting: "Göndərilir...",
            close: "Bağla",
            nameTooShort: "Ad və soyad ən azı 2 simvol olmalıdır.",
            invalidPhone: "Zəhmət olmasa düzgün telefon nömrəsi daxil edin.",
            invalidQuantity: "Miqdar 1 ilə 999 arasında olmalıdır.",
            missingProduct: "Bu məhsul üçün sifariş göndərilə bilmədi.",
            success: "Sorğu uğurla göndərildi.",
            failed: "Sorğu göndərilərkən xəta baş verdi.",
        },
        home: {
            selected: "Sizin üçün seçdiklərimiz",
            special: "Xüsusi endirimlər",
            latest: "Son məhsullar",
        },
        cart: {
            title: "Səbət",
            unitPrice: "Bir ədəd üçün qiymət",
            lineTotal: "Cəmi",
            total: "Toplam qiymət",
            continueShopping: "Alış-verişə davam et",
            checkout: "Sifarişi rəsmiləşdir",
            remove: "Səbətdən sil",
            addedToCart: "{product} səbətinizə müvəffəqiyyətlə əlavə edildi!",
            addedToCartFallback: "Məhsul səbətinizə müvəffəqiyyətlə əlavə edildi!",
            addToCartFailed: "Səbətə əlavə edərkən xəta baş verdi.",
            favoriteFailed: "Bu məhsul favorilərə əlavə edilə bilmədi.",
            favoriteError: "Favorilərə əlavə edilərkən xəta baş verdi.",
            compareFailed: "Bu məhsul müqayisəyə əlavə edilə bilmədi.",
            compareError: "Müqayisə yenilənərkən xəta baş verdi.",
        },
        register: {
            intro: "Əlaqə məlumatlarınız yalnız sifariş vermək və saytda daha rahat işləmək üçün istifadə olunacaq",
            name: "Ad",
            surname: "Soyad",
            phone: "Telefon",
            email: "E-poçtunuz",
            password: "Şifrə yaradın",
            passwordConfirm: "Şifrəni təkrarlayın",
            togglePassword: "Şifrəni göstər/gizlət",
            toggleConfirmPassword: "Şifrə təkrarını göstər/gizlət",
            subscribe: "Abunə ol",
            yes: "Bəli",
            no: "Xeyr",
            termsPrefix: "Mən",
            termsLink: "İstifadə şərtləri",
            termsSuffix: "-ni oxudum və razıyam",
            closeTerms: "İstifadə şərtlərini bağla",
            submit: "Davam et",
            haveAccountPrefix: "Əgər artıq hesabınızı yaratmısınızsa,",
            haveAccountLink: "giriş səhifəsinə",
            haveAccountSuffix: "keçin.",
            required: "Zəhmət olmasa boş buraxmayın",
            passwordMismatch: "Şifrə təkrarı uyğun deyil",
            fillRequired: "Zəhmət olmasa məcburi xanaları doldurun.",
            acceptTerms: "Davam etmək üçün istifadə şərtlərini qəbul edin.",
            captchaMissingConfig: "reCAPTCHA konfiqurasiyası tapılmadı.",
            captchaRequired: "Zəhmət olmasa reCAPTCHA təsdiqləyin.",
            captchaExpired: "reCAPTCHA vaxtı bitdi. Yenidən təsdiqləyin.",
            captchaNotLoaded: "reCAPTCHA yüklənmədi. Bir daha yoxlayın.",
            captchaReload: "reCAPTCHA yüklənmədi. Səhifəni yeniləyin.",
            captchaScriptFailed: "reCAPTCHA skripti yüklənmədi.",
            captchaFailed: "reCAPTCHA təsdiqlənmədi. Yenidən cəhd edin.",
            captchaError: "reCAPTCHA yoxlanışı zamanı xəta baş verdi.",
            registerFailed: "Qeydiyyat zamanı xəta baş verdi.",
            registerSuccess: "Hesabınız uğurla yaradıldı! Email təsdiqi üçün kod göndərildi.",
            subscribeFailed: "Abunəlik zamanı xəta baş verdi.",
            subscribeConnectionFailed: "Abunəlik üçün serverə qoşulmaq mümkün olmadı.",
            connectionError: "Server ilə bağlantı zamanı xəta baş verdi.",
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
            price: "Price",
            allSpecs: "All specifications",
            noFeatures: "No specifications found.",
            relatedProducts: "Similar products",
            linkedProducts: "Related products",
            increase: "Increase",
            decrease: "Decrease",
            favorites: "Favourites",
            compareLabel: "Compare",
            favoriteAdded: "The product has been added to favourites.",
            favoriteRemoved: "The product has been removed from favourites.",
            compareAdded: "The product has been added to comparison.",
            compareRemoved: "The product has been removed from comparison.",
            favoriteUpdateFailed: "An error occurred while updating favourites.",
            compareUpdateFailed: "An error occurred while updating the comparison.",
            cartAddBlocked: "This product could not be added to the cart.",
            outOfStockToast: "This product is out of stock.",
            productFallback: "Product",
            userFallback: "User",
            yourName: "Your name",
            writeCommentPlaceholder: "Write a comment",
            send: "Send",
            commentSent: "Your comment has been sent.",
            commentFailed: "An error occurred while sending the comment.",
            variationNotFound: "The product variation was not found.",
            enterName: "Enter your name.",
            enterComment: "Enter the comment text.",
            ratingRange: "The rating must be between 1 and 5.",
        },
        quickOrder: {
            title: "Would you like to order this product?",
            fullName: "Your full name *",
            phone: "Your number *",
            product: "Product",
            quantity: "Quantity",
            submit: "Send the request",
            submitting: "Sending...",
            close: "Close",
            nameTooShort: "The full name must be at least 2 characters.",
            invalidPhone: "Please enter a valid phone number.",
            invalidQuantity: "The quantity must be between 1 and 999.",
            missingProduct: "The request could not be sent for this product.",
            success: "The request has been sent successfully.",
            failed: "An error occurred while sending the request.",
        },
        home: {
            selected: "Our Picks for You",
            special: "Specials",
            latest: "Latest Products",
        },
        cart: {
            title: "Cart",
            unitPrice: "Price per item",
            lineTotal: "Total",
            total: "Total price",
            continueShopping: "Continue shopping",
            checkout: "Place the order",
            remove: "Remove from cart",
            addedToCart: "{product} has been added to your cart!",
            addedToCartFallback: "The product has been added to your cart!",
            addToCartFailed: "An error occurred while adding to the cart.",
            favoriteFailed: "This product could not be added to favourites.",
            favoriteError: "An error occurred while adding to favourites.",
            compareFailed: "This product could not be added to comparison.",
            compareError: "An error occurred while updating the comparison.",
        },
        register: {
            intro: "Your contact details will only be used to place orders and to make using the site more convenient",
            name: "First name",
            surname: "Last name",
            phone: "Phone",
            email: "Your email",
            password: "Create a password",
            passwordConfirm: "Repeat the password",
            togglePassword: "Show/hide password",
            toggleConfirmPassword: "Show/hide password confirmation",
            subscribe: "Subscribe",
            yes: "Yes",
            no: "No",
            termsPrefix: "I have read and agree to the",
            termsLink: "Terms of use",
            termsSuffix: "",
            closeTerms: "Close the terms of use",
            submit: "Continue",
            haveAccountPrefix: "If you already have an account,",
            haveAccountLink: "go to the sign-in page",
            haveAccountSuffix: "",
            required: "Please do not leave this field empty",
            passwordMismatch: "The passwords do not match",
            fillRequired: "Please fill in the required fields.",
            acceptTerms: "Accept the terms of use to continue.",
            captchaMissingConfig: "reCAPTCHA configuration was not found.",
            captchaRequired: "Please complete the reCAPTCHA.",
            captchaExpired: "The reCAPTCHA has expired. Please verify again.",
            captchaNotLoaded: "The reCAPTCHA did not load. Please try again.",
            captchaReload: "The reCAPTCHA did not load. Please refresh the page.",
            captchaScriptFailed: "The reCAPTCHA script did not load.",
            captchaFailed: "The reCAPTCHA was not verified. Please try again.",
            captchaError: "An error occurred while verifying the reCAPTCHA.",
            registerFailed: "An error occurred during registration.",
            registerSuccess: "Your account has been created. A confirmation code has been sent to your email.",
            subscribeFailed: "An error occurred while subscribing.",
            subscribeConnectionFailed: "Could not reach the server to complete the subscription.",
            connectionError: "An error occurred while connecting to the server.",
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
            price: "Цена",
            allSpecs: "Все характеристики",
            noFeatures: "Характеристики не найдены.",
            relatedProducts: "Похожие товары",
            linkedProducts: "Сопутствующие товары",
            increase: "Увеличить",
            decrease: "Уменьшить",
            favorites: "Избранное",
            compareLabel: "Сравнение",
            favoriteAdded: "Товар добавлен в избранное.",
            favoriteRemoved: "Товар удалён из избранного.",
            compareAdded: "Товар добавлен к сравнению.",
            compareRemoved: "Товар удалён из сравнения.",
            favoriteUpdateFailed: "Произошла ошибка при обновлении избранного.",
            compareUpdateFailed: "Произошла ошибка при обновлении сравнения.",
            cartAddBlocked: "Этот товар не удалось добавить в корзину.",
            outOfStockToast: "Этого товара нет в наличии.",
            productFallback: "Товар",
            userFallback: "Пользователь",
            yourName: "Ваше имя",
            writeCommentPlaceholder: "Напишите комментарий",
            send: "Отправить",
            commentSent: "Ваш комментарий отправлен.",
            commentFailed: "Произошла ошибка при отправке комментария.",
            variationNotFound: "Вариация товара не найдена.",
            enterName: "Введите ваше имя.",
            enterComment: "Введите текст комментария.",
            ratingRange: "Оценка должна быть от 1 до 5.",
        },
        quickOrder: {
            title: "Хотите заказать товар?",
            fullName: "Ваше имя и фамилия *",
            phone: "Ваш номер *",
            product: "Товар",
            quantity: "Количество",
            submit: "Отправить запрос",
            submitting: "Отправка...",
            close: "Закрыть",
            nameTooShort: "Имя и фамилия должны содержать не менее 2 символов.",
            invalidPhone: "Пожалуйста, введите корректный номер телефона.",
            invalidQuantity: "Количество должно быть от 1 до 999.",
            missingProduct: "Не удалось отправить запрос по этому товару.",
            success: "Запрос успешно отправлен.",
            failed: "Произошла ошибка при отправке запроса.",
        },
        home: {
            selected: "Наш выбор для вас",
            special: "Специальные скидки",
            latest: "Новые товары",
        },
        cart: {
            title: "Корзина",
            unitPrice: "Цена за единицу",
            lineTotal: "Итого",
            total: "Общая сумма",
            continueShopping: "Продолжить покупки",
            checkout: "Оформить заказ",
            remove: "Удалить из корзины",
            addedToCart: "{product} успешно добавлен в вашу корзину!",
            addedToCartFallback: "Товар успешно добавлен в вашу корзину!",
            addToCartFailed: "Произошла ошибка при добавлении в корзину.",
            favoriteFailed: "Этот товар не удалось добавить в избранное.",
            favoriteError: "Произошла ошибка при добавлении в избранное.",
            compareFailed: "Этот товар не удалось добавить к сравнению.",
            compareError: "Произошла ошибка при обновлении сравнения.",
        },
        register: {
            intro: "Ваши контактные данные будут использованы только для оформления заказов и удобной работы с сайтом",
            name: "Имя",
            surname: "Фамилия",
            phone: "Телефон",
            email: "Ваша электронная почта",
            password: "Придумайте пароль",
            passwordConfirm: "Повторите пароль",
            togglePassword: "Показать/скрыть пароль",
            toggleConfirmPassword: "Показать/скрыть повтор пароля",
            subscribe: "Подписаться",
            yes: "Да",
            no: "Нет",
            termsPrefix: "Я прочитал(а) и согласен(на) с",
            termsLink: "условиями использования",
            termsSuffix: "",
            closeTerms: "Закрыть условия использования",
            submit: "Продолжить",
            haveAccountPrefix: "Если у вас уже есть аккаунт,",
            haveAccountLink: "перейдите на страницу входа",
            haveAccountSuffix: "",
            required: "Пожалуйста, заполните это поле",
            passwordMismatch: "Пароли не совпадают",
            fillRequired: "Пожалуйста, заполните обязательные поля.",
            acceptTerms: "Примите условия использования, чтобы продолжить.",
            captchaMissingConfig: "Конфигурация reCAPTCHA не найдена.",
            captchaRequired: "Пожалуйста, подтвердите reCAPTCHA.",
            captchaExpired: "Срок действия reCAPTCHA истёк. Подтвердите ещё раз.",
            captchaNotLoaded: "reCAPTCHA не загрузилась. Попробуйте ещё раз.",
            captchaReload: "reCAPTCHA не загрузилась. Обновите страницу.",
            captchaScriptFailed: "Скрипт reCAPTCHA не загрузился.",
            captchaFailed: "reCAPTCHA не подтверждена. Попробуйте ещё раз.",
            captchaError: "Произошла ошибка при проверке reCAPTCHA.",
            registerFailed: "Произошла ошибка при регистрации.",
            registerSuccess: "Аккаунт успешно создан! Код подтверждения отправлен на вашу почту.",
            subscribeFailed: "Произошла ошибка при оформлении подписки.",
            subscribeConnectionFailed: "Не удалось подключиться к серверу для оформления подписки.",
            connectionError: "Произошла ошибка при подключении к серверу.",
        },
    },
};

export const getTranslations = (locale: string) => translations[normalizeLocale(locale)];
