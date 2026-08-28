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
        invalidMobile: string;
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
        termsTitle: string;
        termsLoading: string;
        termsError: string;
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
        emptyWishlist: string;
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
        galleryOpen: string;
        galleryClose: string;
        galleryPrevious: string;
        galleryNext: string;
    };
    checkout: {
        loadFailed: string;
        emptyCart: string;
        productFallback: string;
        productWithId: string;
        productCode: string;
        increase: string;
        decrease: string;
        unitPrice: string;
        lineTotal: string;
        removeItem: string;
        summaryTitle: string;
        itemsInCart: string;
        delivery: string;
        subtotal: string;
        grandTotal: string;
        submit: string;
        loading: string;
        select: string;
        noOptions: string;
        step1: string;
        step2: string;
        step3: string;
        step4: string;
        namePlaceholder: string;
        surnamePlaceholder: string;
        phonePlaceholder: string;
        emailPlaceholder: string;
        addressPlaceholder: string;
        commentPlaceholder: string;
        useExistingAddress: string;
        useNewAddress: string;
        deliveryTo: string;
        payAtDoorTerminal: string;
        payAtDoorCash: string;
        payOnlineCard: string;
        /**
         * Keyed by the api's payment method key. The api answers with the same
         * english name in all three languages, so the label is written here
         * instead; a key that is not listed keeps whatever the api sent.
         */
        paymentMethodNames: Record<string, string>;
        monthsSuffix: string;
        installment: string;
        selectPayment: string;
        selectInstallment: string;
        selectAddress: string;
        addressIncomplete: string;
        fillName: string;
        fillAddress: string;
        fillPhone: string;
        paymentLinkFailed: string;
        submitFailed: string;
    };
    filters: {
        title: string;
        button: string;
        showMore: string;
        showLess: string;
        showMoreCount: string;
        filterFallback: string;
        subcategoryFallback: string;
        noProducts: string;
        loadFailed: string;
    };
    login: {
        email: string;
        password: string;
        togglePassword: string;
        forgotPassword: string;
        submit: string;
        noAccountText: string;
        createAccount: string;
        requiredEmail: string;
        requiredPassword: string;
        fillRequired: string;
        sessionFailed: string;
        loginFailed: string;
        tokenMissing: string;
        success: string;
        connectionError: string;
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
        termsTitle: string;
        termsLoading: string;
        termsError: string;
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
            invalidMobile: "Düzgün mobil nömrə daxil edin (010, 050, 051, 055, 060, 070, 077, 099).",
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
            termsTitle: "İstifadə şərtləri",
            termsLoading: "Yüklənir...",
            termsError: "İstifadə şərtlərini yükləmək mümkün olmadı.",
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
            emptyWishlist: "Sizin bəyənilənlər siyahınız boşdur.",
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
            galleryOpen: "Şəkli böyüt",
            galleryClose: "Bağla",
            galleryPrevious: "Əvvəlki şəkil",
            galleryNext: "Növbəti şəkil",
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
        checkout: {
            loadFailed: "Checkout məlumatları yüklənmədi.",
            emptyCart: "Səbətinizdə məhsul yoxdur.",
            productFallback: "Məhsul",
            productWithId: "Məhsul #{id}",
            productCode: "Məhsul kodu",
            increase: "Artır",
            decrease: "Azalt",
            unitPrice: "Qiyməti",
            lineTotal: "Cəmi",
            removeItem: "Səbətdən sil",
            summaryTitle: "Sifarişiniz",
            itemsInCart: "Səbətdəki məhsullar:",
            delivery: "Ünvana çatdırılma",
            subtotal: "Toplam qiymət",
            grandTotal: "Ümumi məbləğ",
            submit: "Sifarişi rəsmiləşdirin",
            loading: "Yüklənir...",
            select: "Seçin",
            noOptions: "Seçim yoxdur",
            step1: "1. Əlaqə məlumatları",
            step2: "2. Ünvan",
            step3: "3. Ödəniş üsulları",
            step4: "4. Şərh",
            namePlaceholder: "Ad *",
            surnamePlaceholder: "Soyad *",
            phonePlaceholder: "Telefon *",
            emailPlaceholder: "Email *",
            addressPlaceholder: "Ünvan *",
            commentPlaceholder: "Şərh",
            useExistingAddress: "Mən mövcud ünvanımı istifadə etmək istəyirəm",
            useNewAddress: "Mən yeni ünvan istifadə etmək istəyirəm",
            deliveryTo: "Ünvana çatdırılma",
            payAtDoorTerminal: "Qapıda post terminalla",
            payAtDoorCash: "Qapıda nəğd pulla",
            payOnlineCard: "Saytda kart ilə ödəniş",
            paymentMethodNames: {
                cash_on_delivery: "Qapıda post terminalla",
                kapitalbank: "Kapital Bank",
            },
            monthsSuffix: "ay",
            installment: "Hissə",
            selectPayment: "Ödəniş üsulunu seçin.",
            selectInstallment: "Hissə sayını seçin.",
            selectAddress: "Ünvan seçin.",
            addressIncomplete: "Çatdırılma ünvanını son səviyyəyə qədər seçin.",
            fillName: "Ad və soyad doldurun.",
            fillAddress: "Ünvan doldurun.",
            fillPhone: "Telefon doldurun.",
            paymentLinkFailed: "Ödəniş linki alınmadı.",
            submitFailed: "Sifariş göndərilərkən xəta baş verdi.",
        },
        filters: {
            title: "Filtrlər",
            button: "Filtr",
            showMore: "Daha çox göstər",
            showLess: "Daha az göstər",
            showMoreCount: "Əlavə {count} ədəd göstər",
            filterFallback: "Filtr",
            subcategoryFallback: "Alt kateqoriya",
            noProducts: "Məhsul tapılmadı.",
            loadFailed: "Məhsullar yüklənmədi.",
        },
        login: {
            email: "E-mail ünvanı",
            password: "Şifrə",
            togglePassword: "Şifrəni göstər/gizlət",
            forgotPassword: "Şifrənizi unutmusunuz?",
            submit: "Giriş",
            noAccountText: "Hesab yaradaraq saytın bütün imkanlarından istifadə edə bilərsiniz.",
            createAccount: "Hesab qeydiyyatı",
            requiredEmail: "Zəhmət olmasa e-mail daxil edin",
            requiredPassword: "Zəhmət olmasa şifrə daxil edin",
            fillRequired: "Zəhmət olmasa məcburi xanaları doldurun.",
            sessionFailed: "Sessiya yaradıla bilmədi.",
            loginFailed: "Giriş zamanı xəta baş verdi.",
            tokenMissing: "Token tapılmadı. Yenidən cəhd edin.",
            success: "Giriş uğurla tamamlandı.",
            connectionError: "Server ilə bağlantı zamanı xəta baş verdi.",
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
            addedToCart: "Siz {product} səbətinizə müvəffəqiyyətlə əlavə etdiniz!",
            addedToCartFallback: "Siz məhsulu səbətinizə müvəffəqiyyətlə əlavə etdiniz!",
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
            termsTitle: "İstifadə şərtləri",
            termsLoading: "Yüklənir...",
            termsError: "İstifadə şərtlərini yükləmək mümkün olmadı.",
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
            invalidMobile: "Enter a valid mobile number (010, 050, 051, 055, 060, 070, 077, 099).",
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
            termsTitle: "Terms of use",
            termsLoading: "Loading...",
            termsError: "The terms of use could not be loaded.",
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
            emptyWishlist: "Your wishlist is empty.",
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
            galleryOpen: "Enlarge image",
            galleryClose: "Close",
            galleryPrevious: "Previous image",
            galleryNext: "Next image",
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
        checkout: {
            loadFailed: "The checkout details could not be loaded.",
            emptyCart: "Your cart is empty.",
            productFallback: "Product",
            productWithId: "Product #{id}",
            productCode: "Product code",
            increase: "Increase",
            decrease: "Decrease",
            unitPrice: "Price",
            lineTotal: "Total",
            removeItem: "Remove from cart",
            summaryTitle: "Your order",
            itemsInCart: "Items in the cart:",
            delivery: "Delivery to the address",
            subtotal: "Subtotal",
            grandTotal: "Total amount",
            submit: "Place the order",
            loading: "Loading...",
            select: "Select",
            noOptions: "No options",
            step1: "1. Contact details",
            step2: "2. Address",
            step3: "3. Payment methods",
            step4: "4. Comment",
            namePlaceholder: "First name *",
            surnamePlaceholder: "Last name *",
            phonePlaceholder: "Phone *",
            emailPlaceholder: "Email *",
            addressPlaceholder: "Address *",
            commentPlaceholder: "Comment",
            useExistingAddress: "I want to use my existing address",
            useNewAddress: "I want to use a new address",
            deliveryTo: "Delivery to the address",
            payAtDoorTerminal: "Card terminal at the door",
            payAtDoorCash: "Cash at the door",
            payOnlineCard: "Card payment on the site",
            paymentMethodNames: {
                cash_on_delivery: "Card terminal at the door",
                kapitalbank: "Kapital Bank",
            },
            monthsSuffix: "months",
            installment: "Instalment",
            selectPayment: "Select a payment method.",
            selectInstallment: "Select the number of instalments.",
            selectAddress: "Select an address.",
            addressIncomplete: "Select the delivery address down to the last level.",
            fillName: "Fill in your first and last name.",
            fillAddress: "Fill in the address.",
            fillPhone: "Fill in the phone number.",
            paymentLinkFailed: "The payment link could not be obtained.",
            submitFailed: "The order could not be placed. Please try again.",
        },
        filters: {
            title: "Filters",
            button: "Filter",
            showMore: "Show more",
            showLess: "Show less",
            showMoreCount: "Show {count} more",
            filterFallback: "Filter",
            subcategoryFallback: "Subcategory",
            noProducts: "No products found.",
            loadFailed: "The products could not be loaded.",
        },
        login: {
            email: "Email address",
            password: "Password",
            togglePassword: "Show/hide password",
            forgotPassword: "Forgot your password?",
            submit: "Sign in",
            noAccountText: "Create an account to use every feature of the site.",
            createAccount: "Create an account",
            requiredEmail: "Please enter your email",
            requiredPassword: "Please enter your password",
            fillRequired: "Please fill in the required fields.",
            sessionFailed: "The session could not be created.",
            loginFailed: "An error occurred while signing in.",
            tokenMissing: "The token was not found. Please try again.",
            success: "You have signed in successfully.",
            connectionError: "An error occurred while connecting to the server.",
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
            addedToCart: "You have added {product} to your shopping cart!",
            addedToCartFallback: "You have added the product to your shopping cart!",
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
            termsTitle: "Terms of use",
            termsLoading: "Loading...",
            termsError: "The terms of use could not be loaded.",
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
            email: "Электронная почта",
            phone: "Телефон",
            address: "Адрес",
            callUs: "Позвоните нам",
            searchPlaceholder: "Поиск товаров",
            invalidMobile: "Введите корректный мобильный номер (010, 050, 051, 055, 060, 070, 077, 099).",
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
                email: "Электронная почта",
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
            termsTitle: "Условия использования",
            termsLoading: "Загрузка...",
            termsError: "Не удалось загрузить условия использования.",
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
            emptyWishlist: "Ваш список избранного пуст.",
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
            galleryOpen: "Увеличить изображение",
            galleryClose: "Закрыть",
            galleryPrevious: "Предыдущее изображение",
            galleryNext: "Следующее изображение",
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
        checkout: {
            loadFailed: "Не удалось загрузить данные оформления заказа.",
            emptyCart: "Ваша корзина пуста.",
            productFallback: "Товар",
            productWithId: "Товар №{id}",
            productCode: "Код товара",
            increase: "Увеличить",
            decrease: "Уменьшить",
            unitPrice: "Цена",
            lineTotal: "Итого",
            removeItem: "Удалить из корзины",
            summaryTitle: "Ваш заказ",
            itemsInCart: "Товаров в корзине:",
            delivery: "Доставка по адресу",
            subtotal: "Сумма товаров",
            grandTotal: "Общая сумма",
            submit: "Оформить заказ",
            loading: "Загрузка...",
            select: "Выберите",
            noOptions: "Нет вариантов",
            step1: "1. Контактные данные",
            step2: "2. Адрес",
            step3: "3. Способы оплаты",
            step4: "4. Комментарий",
            namePlaceholder: "Имя *",
            surnamePlaceholder: "Фамилия *",
            phonePlaceholder: "Телефон *",
            emailPlaceholder: "Электронная почта *",
            addressPlaceholder: "Адрес *",
            commentPlaceholder: "Комментарий",
            useExistingAddress: "Я хочу использовать существующий адрес",
            useNewAddress: "Я хочу использовать новый адрес",
            deliveryTo: "Доставка по адресу",
            payAtDoorTerminal: "Картой через терминал у двери",
            payAtDoorCash: "Наличными у двери",
            payOnlineCard: "Оплата картой на сайте",
            paymentMethodNames: {
                cash_on_delivery: "Картой через терминал у двери",
                kapitalbank: "Kapital Bank",
            },
            monthsSuffix: "мес.",
            installment: "Рассрочка",
            selectPayment: "Выберите способ оплаты.",
            selectInstallment: "Выберите количество платежей.",
            selectAddress: "Выберите адрес.",
            addressIncomplete: "Выберите адрес доставки до последнего уровня.",
            fillName: "Заполните имя и фамилию.",
            fillAddress: "Заполните адрес.",
            fillPhone: "Заполните номер телефона.",
            paymentLinkFailed: "Не удалось получить ссылку на оплату.",
            submitFailed: "Не удалось оформить заказ. Попробуйте ещё раз.",
        },
        filters: {
            title: "Фильтры",
            button: "Фильтр",
            showMore: "Показать больше",
            showLess: "Показать меньше",
            showMoreCount: "Показать ещё {count}",
            filterFallback: "Фильтр",
            subcategoryFallback: "Подкатегория",
            noProducts: "Товары не найдены.",
            loadFailed: "Не удалось загрузить товары.",
        },
        login: {
            email: "Адрес электронной почты",
            password: "Пароль",
            togglePassword: "Показать/скрыть пароль",
            forgotPassword: "Забыли пароль?",
            submit: "Войти",
            noAccountText: "Создайте аккаунт, чтобы пользоваться всеми возможностями сайта.",
            createAccount: "Регистрация аккаунта",
            requiredEmail: "Пожалуйста, введите электронную почту",
            requiredPassword: "Пожалуйста, введите пароль",
            fillRequired: "Пожалуйста, заполните обязательные поля.",
            sessionFailed: "Не удалось создать сессию.",
            loginFailed: "Произошла ошибка при входе.",
            tokenMissing: "Токен не найден. Попробуйте ещё раз.",
            success: "Вход выполнен успешно.",
            connectionError: "Произошла ошибка при подключении к серверу.",
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
            addedToCart: "Вы успешно добавили {product} в вашу корзину!",
            addedToCartFallback: "Вы успешно добавили товар в вашу корзину!",
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
            termsTitle: "Условия использования",
            termsLoading: "Загрузка...",
            termsError: "Не удалось загрузить условия использования.",
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
