import { ThankYou } from "@repo/ui";
import type { SiteLocale } from "@/lib/site-locales";

const THANK_YOU_COPY: Record<SiteLocale, { title: string; subtitle: string; button: string }> = {
  az: {
    title: "Təşəkkür edirik!",
    subtitle:
      "Müraciətiniz uğurla göndərildi. Komandamız yaxın zamanda sizinlə əlaqə saxlayacaq.",
    button: "Ana səhifəyə qayıt",
  },
  ru: {
    title: "Спасибо!",
    subtitle:
      "Ваша заявка успешно отправлена. Наша команда свяжется с вами в ближайшее время.",
    button: "Вернуться на главную",
  },
  en: {
    title: "Thank you!",
    subtitle:
      "Your submission was sent successfully. Our team will get back to you shortly.",
    button: "Back to homepage",
  },
};

export function ThankYouWrapper({ locale }: { locale: SiteLocale }) {
  const copy = THANK_YOU_COPY[locale] ?? THANK_YOU_COPY.az;

  return (
    <ThankYou
      title={copy.title}
      subtitle={copy.subtitle}
      buttonLabel={copy.button}
      buttonHref={`/${locale}`}
      imageBase="/images/thank-you/bg"
    />
  );
}