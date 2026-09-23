import { ThankYou } from "@repo/ui";
import { getTranslations } from "@/lib/i18n";
import { localizedHref } from "@/lib/routes";
import type { SiteLocale } from "@/lib/site-locales";

/**
 * Mirrors the mark on the thank-you backdrop, in the failure colour. This
 * screen has no illustration behind it, so the icon is what keeps it from
 * reading as a line of text floating in an empty page.
 */
function PaymentFailedMark() {
  return (
    <svg
      width="132"
      height="132"
      viewBox="0 0 132 132"
      fill="none"
      role="presentation"
      aria-hidden="true"
    >
      {/* Rays, matching the ones drawn around the thank-you check. */}
      <g stroke="#F0A0A0" strokeWidth="5" strokeLinecap="round">
        <path d="M66 4v13" />
        <path d="M27.5 14.3l6.5 11.3" />
        <path d="M104.5 14.3L98 25.6" />
        <path d="M4 66h13" />
        <path d="M115 66h13" />
      </g>
      <circle cx="66" cy="70" r="40" fill="#DC2626" />
      <path
        d="M54 58l24 24M78 58L54 82"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Where a declined payment lands. Its counterpart is the payment success
 * screen; the shared thank-you page is only for the other completed forms.
 */
export function PaymentErrorView({ locale }: { locale: SiteLocale }) {
  const copy = getTranslations(locale).paymentError;

  return (
    <ThankYou
      title={copy.title}
      subtitle={copy.subtitle}
      icon={<PaymentFailedMark />}
      // Home is the primary action, as on the thank-you screen. Retry stays
      // reachable underneath so a declined card is not a dead end.
      buttonLabel={copy.button}
      buttonHref={`/${locale}`}
      secondaryLabel={copy.secondary}
      secondaryHref={localizedHref("checkout", locale)}
      tone="error"
    />
  );
}
