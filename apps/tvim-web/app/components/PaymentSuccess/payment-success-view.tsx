import { ThankYou } from "@repo/ui";
import { getTranslations } from "@/lib/i18n";
import { localizedHref } from "@/lib/routes";
import type { SiteLocale } from "@/lib/site-locales";

/**
 * The counterpart of the mark on the failure screen, in the confirmation
 * colour. Like that one it carries the page on its own: this screen has no
 * illustration behind it, so without the icon it reads as a line of text
 * floating in an empty page.
 */
function PaymentPaidMark() {
  return (
    <svg
      width="132"
      height="132"
      viewBox="0 0 132 132"
      fill="none"
      role="presentation"
      aria-hidden="true"
    >
      {/* Rays, matching the ones drawn around the failure cross. */}
      <g stroke="#9AD8A8" strokeWidth="5" strokeLinecap="round">
        <path d="M66 4v13" />
        <path d="M27.5 14.3l6.5 11.3" />
        <path d="M104.5 14.3L98 25.6" />
        <path d="M4 66h13" />
        <path d="M115 66h13" />
      </g>
      <circle cx="66" cy="70" r="40" fill="#16A34A" />
      <path
        d="M52 70l10 11 20-22"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Where a paid order lands. It used to share the thank-you screen with every
 * other completed form, which told a shopper their message had been sent
 * rather than that their payment had gone through.
 */
export function PaymentSuccessView({ locale }: { locale: SiteLocale }) {
  const copy = getTranslations(locale).paymentSuccess;

  return (
    <ThankYou
      title={copy.title}
      subtitle={copy.subtitle}
      icon={<PaymentPaidMark />}
      // Home is the primary action, as on the failure and thank-you screens.
      // The order itself stays one click away underneath.
      buttonLabel={copy.button}
      buttonHref={`/${locale}`}
      secondaryLabel={copy.secondary}
      secondaryHref={localizedHref("orders", locale)}
    />
  );
}
