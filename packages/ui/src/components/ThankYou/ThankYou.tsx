import type { ReactNode } from "react";
import Link from "next/link";
import styles from "../../styles/ThankYou/thankyou.module.css";

/**
 * `brand` is the screen this component was built as, in the site's blue and
 * behind the celebratory backdrop. `success` and `error` recolour the title
 * and button to match the mark above them, and are meant to be used without
 * that backdrop: it would contradict the message on a failed payment, and on
 * a confirmed one the mark is what the eye lands on.
 */
export type ThankYouTone = "brand" | "success" | "error";

const TONE_TITLE = {
  brand: "",
  success: "titleSuccess",
  error: "titleError",
} as const;

const TONE_BUTTON = {
  brand: "",
  success: "buttonSuccess",
  error: "buttonError",
} as const;

export interface ThankYouProps {
  title: string;
  /** Left out where the title says everything, as on a placed cash order. */
  subtitle?: string;
  buttonLabel: string;
  buttonHref: string;
  /** Base path of the generated backdrop set, without the `-<width>.<ext>` suffix. */
  imageBase?: string;
  tone?: ThankYouTone;
  /** Shown above the title. Carries the screen when there is no backdrop. */
  icon?: ReactNode;
  /** Optional secondary action, rendered as a plain link under the button. */
  secondaryLabel?: string;
  secondaryHref?: string;
}

// Kept in step with apps/tvim-web/scripts/build-thank-you-image.mjs, which
// writes the files these names point at.
const WIDTHS = [640, 750, 1080, 1440, 1902];

const srcSet = (base: string, ext: string) =>
  WIDTHS.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");

export function ThankYou({
  title,
  subtitle,
  buttonLabel,
  buttonHref,
  imageBase,
  tone = "brand",
  icon,
  secondaryLabel,
  secondaryHref,
}: ThankYouProps) {
  const titleTone = styles[TONE_TITLE[tone]] ?? "";
  const buttonTone = styles[TONE_BUTTON[tone]] ?? "";

  return (
    <section className={`${styles.wrapper} ${imageBase ? "" : styles.compact}`}>
      {/* The backdrop is a plain <picture> rather than next/image because its
          variants are encoded at build time. It is a flat illustration, so
          avif is worth roughly 4 dB over webp at half the bytes here, but the
          optimizer needs about 4 s to produce avif at full width — a cost that
          would land on the first visitor of the screen this image is the
          largest paint of. Serving the files straight from public/ keeps the
          avif bytes and takes the transcode off the request path entirely.
          The browser still picks a width, so this stays as responsive as the
          next/image version was. */}
      {imageBase ? (
        <picture>
          <source type="image/avif" srcSet={srcSet(imageBase, "avif")} sizes="100vw" />
          <source type="image/webp" srcSet={srcSet(imageBase, "webp")} sizes="100vw" />
          <img
            src={`${imageBase}-1902.webp`}
            alt=""
            fetchPriority="high"
            decoding="async"
            className={styles.image}
          />
        </picture>
      ) : null}

      <div className={styles.content}>
        {icon ? <div className={styles.iconWrap}>{icon}</div> : null}
        <h1 className={`${styles.title} ${titleTone} ${subtitle ? "" : styles.titleAlone}`}>
          {title}
        </h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        <Link href={buttonHref} className={`${styles.button} ${buttonTone}`}>
          {buttonLabel}
        </Link>
        {secondaryLabel && secondaryHref ? (
          <Link href={secondaryHref} className={styles.secondary}>
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
