import { ThankYou } from "@repo/ui";
import { getTranslations } from "@/lib/i18n";
import { localizedHref } from "@/lib/routes";
import type { SiteLocale } from "@/lib/site-locales";

/**
 * The only screen a payment gets of its own. A successful one ends on the
 * shared thank-you page, where every other completed form ends.
 */
export function PaymentErrorView({ locale }: { locale: SiteLocale }) {
  const copy = getTranslations(locale).paymentError;

  return (
    <ThankYou
      title={copy.title}
      subtitle={copy.subtitle}
      buttonLabel={copy.button}
      buttonHref={localizedHref("checkout", locale)}
      secondaryLabel={copy.secondary}
      secondaryHref={`/${locale}`}
      tone="error"
      // No backdrop: the illustration celebrates, which would contradict this.
    />
  );
}
