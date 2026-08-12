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
        form: {
            name: string;
            surname: string;
            email: string;
            phone: string;
            save: string;
            cancel: string;
            edit: string;
            remove: string;
            yes: string;
            no: string;
            loading: string;
            select: string;
            noOptions: string;
            serverError: string;
            requiredName: string;
            requiredSurname: string;
            requiredEmail: string;
            togglePassword: string;
            toggleConfirmation: string;
        };
        profile: {
            updated: string;
            updateFailed: string;
        };
        passwordForm: {
            password: string;
            confirmation: string;
            requiredPassword: string;
            requiredConfirmation: string;
            mismatch: string;
            missingProfile: string;
            failed: string;
            success: string;
        };
        address: {
            heading: string;
            newAddress: string;
            addTitle: string;
            editTitle: string;
            primary: string;
            label: string;
            labelPlaceholder: string;
            country: string;
            region: string;
            city: string;
            addressLine: string;
            requiredCity: string;
            requiredAddress: string;
            incompleteRegion: string;
            notFound: string;
            added: string;
            updated: string;
            saveFailed: string;
            deleted: string;
            deleteFailed: string;
        };
        orders: {
            all: string;
            processing: string;
            delivered: string;
            cancelled: string;
            loadFailed: string;
            empty: string;
            orderNumber: string;
            model: string;
            quantity: string;
            paymentMethod: string;
            amount: string;
            productAlt: string;
        };
        orderDetail: {
            loadFailed: string;
            statusCode: string;
            orderNumber: string;
            customer: string;
            delivery: string;
            products: string;
            payment: string;
            payments: string;
            summary: string;
            promo: string;
            statusHistory: string;
            name: string;
            emailLabel: string;
            phoneLabel: string;
            addressLabel: string;
            addressExtra: string;
            postalCode: string;
            country: string;
            note: string;
            tag: string;
            quantity: string;
            unitPrice: string;
            lineTotal: string;
            method: string;
            installment: string;
            monthsSuffix: string;
            initialPayment: string;
            monthlyAmount: string;
            monthly: string;
            percent: string;
            remainingAmount: string;
            firstPayment: string;
            paymentStatus: string;
            gateway: string;
            comment: string;
            subtotal: string;
            hourDiscount: string;
            promoDiscount: string;
            remainingPart: string;
            payable: string;
            code: string;
            discount: string;
            changedFrom: string;
            changedBy: string;
        };
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
            form: {
                name: "Ad",
                surname: "Soyad",
                email: "Email",
                phone: "Telefon",
                save: "Yadda saxla",
                cancel: "Ləğv et",
                edit: "Redaktə et",
                remove: "Sil",
                yes: "Bəli",
                no: "Xeyr",
                loading: "Yüklənir...",
                select: "Seçin",
                noOptions: "Seçim yoxdur",
                serverError: "Server ilə bağlantı zamanı xəta baş verdi.",
                requiredName: "Ad tələb olunur.",
                requiredSurname: "Soyad tələb olunur.",
                requiredEmail: "Email tələb olunur.",
                togglePassword: "Şifrəni göstər/gizlət",
                toggleConfirmation: "Şifrə təkrarını göstər/gizlət",
            },
            profile: {
                updated: "Profil yeniləndi.",
                updateFailed: "Profil yenilənmədi.",
            },
            passwordForm: {
                password: "Yeni şifrə",
                confirmation: "Yeni şifrənin təkrarı",
                requiredPassword: "Yeni şifrə tələb olunur.",
                requiredConfirmation: "Şifrənin təkrarı tələb olunur.",
                mismatch: "Şifrələr uyğun gəlmir.",
                missingProfile: "Profil məlumatları tapılmadı.",
                failed: "Şifrə yenilənmədi.",
                success: "Şifrə yeniləndi.",
            },
            address: {
                heading: "Ünvanlar",
                newAddress: "Yeni ünvan",
                addTitle: "Ünvan əlavə et",
                editTitle: "Ünvanı redaktə et",
                primary: "Əsas ünvan",
                label: "Başlıq",
                labelPlaceholder: "Məsələn: Ev, İş",
                country: "Ölkə",
                region: "Region",
                city: "Şəhər",
                addressLine: "Ünvan",
                requiredCity: "Şəhər tələb olunur.",
                requiredAddress: "Ünvan tələb olunur.",
                incompleteRegion: "Ölkə/region seçimi tamamlanmayıb.",
                notFound: "Ünvan tapılmadı.",
                added: "Ünvan əlavə olundu.",
                updated: "Ünvan yeniləndi.",
                saveFailed: "Ünvan əlavə edilmədi.",
                deleted: "Ünvan silindi.",
                deleteFailed: "Ünvan silinmədi.",
            },
            orders: {
                all: "Hamısı",
                processing: "Prosessdə",
                delivered: "Təhvil verildi",
                cancelled: "Ləğv edildi",
                loadFailed: "Sifarişlər yüklənmədi.",
                empty: "Sizin hər hansı bir sifarişiniz mövcud deyil!",
                orderNumber: "Sifariş №",
                model: "Model",
                quantity: "Sayı",
                paymentMethod: "Ödəmə metodu",
                amount: "Məbləğ",
                productAlt: "Məhsul",
            },
            orderDetail: {
                loadFailed: "Sifariş detalı yüklənmədi.",
                statusCode: "Status kodu",
                orderNumber: "Sifariş nömrəsi",
                customer: "Müştəri",
                delivery: "Çatdırılma",
                products: "Məhsullar",
                payment: "Ödəniş",
                payments: "Ödənişlər",
                summary: "Yekun",
                promo: "Promo",
                statusHistory: "Status tarixçəsi",
                name: "Ad",
                emailLabel: "E-poçt",
                phoneLabel: "Telefon",
                addressLabel: "Ünvan",
                addressExtra: "Əlavə ünvan",
                postalCode: "İndeks",
                country: "Ölkə",
                note: "Qeyd",
                tag: "Etiket",
                quantity: "Say",
                unitPrice: "Vahid",
                lineTotal: "Cəmi",
                method: "Metod",
                installment: "Hissə",
                monthsSuffix: "ay",
                initialPayment: "İlkin ödəniş",
                monthlyAmount: "Aylıq məbləğ",
                monthly: "Aylıq",
                percent: "Faiz",
                remainingAmount: "Qalan məbləğ",
                firstPayment: "İlk ödəniş",
                paymentStatus: "Ödəniş statusu",
                gateway: "Gateway",
                comment: "Şərh",
                subtotal: "Aralıq cəm",
                hourDiscount: "Saat endirimi",
                promoDiscount: "Promo endirimi",
                remainingPart: "Qalan hissə",
                payable: "Ödəniləcək",
                code: "Kod",
                discount: "Endirim",
                changedFrom: "Dəyişdi",
                changedBy: "Kim tərəfindən",
            },
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
            form: {
                name: "First name",
                surname: "Last name",
                email: "Email",
                phone: "Phone",
                save: "Save",
                cancel: "Cancel",
                edit: "Edit",
                remove: "Delete",
                yes: "Yes",
                no: "No",
                loading: "Loading...",
                select: "Select",
                noOptions: "No options",
                serverError: "Could not reach the server.",
                requiredName: "First name is required.",
                requiredSurname: "Last name is required.",
                requiredEmail: "Email is required.",
                togglePassword: "Show/hide password",
                toggleConfirmation: "Show/hide password confirmation",
            },
            profile: {
                updated: "Profile updated.",
                updateFailed: "Profile was not updated.",
            },
            passwordForm: {
                password: "New password",
                confirmation: "Repeat new password",
                requiredPassword: "New password is required.",
                requiredConfirmation: "Password confirmation is required.",
                mismatch: "Passwords do not match.",
                missingProfile: "Profile details were not found.",
                failed: "Password was not updated.",
                success: "Password updated.",
            },
            address: {
                heading: "Addresses",
                newAddress: "New address",
                addTitle: "Add address",
                editTitle: "Edit address",
                primary: "Default address",
                label: "Title",
                labelPlaceholder: "For example: Home, Work",
                country: "Country",
                region: "Region",
                city: "City",
                addressLine: "Address",
                requiredCity: "City is required.",
                requiredAddress: "Address is required.",
                incompleteRegion: "The country/region selection is incomplete.",
                notFound: "Address not found.",
                added: "Address added.",
                updated: "Address updated.",
                saveFailed: "Address was not saved.",
                deleted: "Address deleted.",
                deleteFailed: "Address was not deleted.",
            },
            orders: {
                all: "All",
                processing: "Processing",
                delivered: "Delivered",
                cancelled: "Cancelled",
                loadFailed: "Orders could not be loaded.",
                empty: "You do not have any orders yet!",
                orderNumber: "Order no.",
                model: "Model",
                quantity: "Quantity",
                paymentMethod: "Payment method",
                amount: "Amount",
                productAlt: "Product",
            },
            orderDetail: {
                loadFailed: "Order details could not be loaded.",
                statusCode: "Status code",
                orderNumber: "Order number",
                customer: "Customer",
                delivery: "Delivery",
                products: "Products",
                payment: "Payment",
                payments: "Payments",
                summary: "Summary",
                promo: "Promo",
                statusHistory: "Status history",
                name: "Name",
                emailLabel: "Email",
                phoneLabel: "Phone",
                addressLabel: "Address",
                addressExtra: "Additional address",
                postalCode: "Postal code",
                country: "Country",
                note: "Note",
                tag: "Label",
                quantity: "Qty",
                unitPrice: "Unit",
                lineTotal: "Total",
                method: "Method",
                installment: "Instalment",
                monthsSuffix: "months",
                initialPayment: "Down payment",
                monthlyAmount: "Monthly amount",
                monthly: "Monthly",
                percent: "Interest",
                remainingAmount: "Remaining amount",
                firstPayment: "First payment",
                paymentStatus: "Payment status",
                gateway: "Gateway",
                comment: "Comment",
                subtotal: "Subtotal",
                hourDiscount: "Hourly discount",
                promoDiscount: "Promo discount",
                remainingPart: "Remaining instalment",
                payable: "Payable",
                code: "Code",
                discount: "Discount",
                changedFrom: "Changed",
                changedBy: "Changed by",
            },
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
            form: {
                name: "Имя",
                surname: "Фамилия",
                email: "Email",
                phone: "Телефон",
                save: "Сохранить",
                cancel: "Отмена",
                edit: "Редактировать",
                remove: "Удалить",
                yes: "Да",
                no: "Нет",
                loading: "Загрузка...",
                select: "Выберите",
                noOptions: "Нет вариантов",
                serverError: "Не удалось связаться с сервером.",
                requiredName: "Укажите имя.",
                requiredSurname: "Укажите фамилию.",
                requiredEmail: "Укажите email.",
                togglePassword: "Показать/скрыть пароль",
                toggleConfirmation: "Показать/скрыть повтор пароля",
            },
            profile: {
                updated: "Профиль обновлён.",
                updateFailed: "Профиль не обновлён.",
            },
            passwordForm: {
                password: "Новый пароль",
                confirmation: "Повтор нового пароля",
                requiredPassword: "Укажите новый пароль.",
                requiredConfirmation: "Повторите пароль.",
                mismatch: "Пароли не совпадают.",
                missingProfile: "Данные профиля не найдены.",
                failed: "Пароль не обновлён.",
                success: "Пароль обновлён.",
            },
            address: {
                heading: "Адреса",
                newAddress: "Новый адрес",
                addTitle: "Добавить адрес",
                editTitle: "Редактировать адрес",
                primary: "Основной адрес",
                label: "Название",
                labelPlaceholder: "Например: Дом, Работа",
                country: "Страна",
                region: "Регион",
                city: "Город",
                addressLine: "Адрес",
                requiredCity: "Укажите город.",
                requiredAddress: "Укажите адрес.",
                incompleteRegion: "Выбор страны/региона не завершён.",
                notFound: "Адрес не найден.",
                added: "Адрес добавлен.",
                updated: "Адрес обновлён.",
                saveFailed: "Адрес не сохранён.",
                deleted: "Адрес удалён.",
                deleteFailed: "Адрес не удалён.",
            },
            orders: {
                all: "Все",
                processing: "В процессе",
                delivered: "Доставлено",
                cancelled: "Отменено",
                loadFailed: "Не удалось загрузить заказы.",
                empty: "У вас пока нет заказов!",
                orderNumber: "Заказ №",
                model: "Модель",
                quantity: "Количество",
                paymentMethod: "Способ оплаты",
                amount: "Сумма",
                productAlt: "Товар",
            },
            orderDetail: {
                loadFailed: "Не удалось загрузить детали заказа.",
                statusCode: "Код статуса",
                orderNumber: "Номер заказа",
                customer: "Клиент",
                delivery: "Доставка",
                products: "Товары",
                payment: "Оплата",
                payments: "Платежи",
                summary: "Итого",
                promo: "Промокод",
                statusHistory: "История статусов",
                name: "Имя",
                emailLabel: "Эл. почта",
                phoneLabel: "Телефон",
                addressLabel: "Адрес",
                addressExtra: "Дополнительный адрес",
                postalCode: "Индекс",
                country: "Страна",
                note: "Примечание",
                tag: "Метка",
                quantity: "Кол-во",
                unitPrice: "Цена",
                lineTotal: "Сумма",
                method: "Метод",
                installment: "Рассрочка",
                monthsSuffix: "мес.",
                initialPayment: "Первый взнос",
                monthlyAmount: "Ежемесячный платёж",
                monthly: "Ежемесячно",
                percent: "Процент",
                remainingAmount: "Остаток",
                firstPayment: "Первый платёж",
                paymentStatus: "Статус оплаты",
                gateway: "Шлюз",
                comment: "Комментарий",
                subtotal: "Промежуточный итог",
                hourDiscount: "Часовая скидка",
                promoDiscount: "Скидка по промокоду",
                remainingPart: "Остаток рассрочки",
                payable: "К оплате",
                code: "Код",
                discount: "Скидка",
                changedFrom: "Изменено",
                changedBy: "Кем изменено",
            },
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
