import Link from "next/link";

const SUPPORTED_LOCALES = ["az", "ru", "en"] as const;

type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

const copy = {
    az: {
        title: "Üzr istəyirik, lakin daxil olmağa çalışdığınız səhifəni tapmaq mümkün deyil.",
        button: "Ana səhifə",
    },
    ru: {
        title: "К сожалению, страницу, которую вы ищете, найти не удалось.",
        button: "На главную",
    },
    en: {
        title: "Sorry, the page you are looking for cannot be found.",
        button: "Home",
    },
} as const;

const normalizeLocale = (locale: string): LocaleCode => {
    const normalized = locale.trim().toLowerCase();
    return SUPPORTED_LOCALES.includes(normalized as LocaleCode) ? (normalized as LocaleCode) : "az";
};

export function NotFoundPage({ locale }: { locale: string }) {
    const currentLocale = normalizeLocale(locale);
    const t = copy[currentLocale];

    return (
        <section className="flex w-full items-center justify-center py-8 sm:py-10">
            <div className="w-full text-center">
                <h1 className="text-[clamp(28px,3vw,40px)] leading-[1.2] font-semibold tracking-[-0.04em] text-[#111111]">
                    {t.title}
                </h1>

                <div className="mt-8">
                    <Link
                        href={`/${currentLocale}`}
                        className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[#0f57d6] px-8 py-3.5 text-[17px] font-semibold text-white transition-colors hover:bg-[#0c4fc6]"
                    >
                        {t.button}
                    </Link>
                </div>
            </div>
        </section>
    );
}
