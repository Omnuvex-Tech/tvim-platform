import Link from "next/link";
import styles from "../../styles/ThankYou/thankyou.module.css";

export interface ThankYouProps {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  /** Base path of the generated backdrop set, without the `-<width>.<ext>` suffix. */
  imageBase: string;
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
}: ThankYouProps) {
  return (
    <section className={styles.wrapper}>
      {/* The backdrop is a plain <picture> rather than next/image because its
          variants are encoded at build time. It is a flat illustration, so
          avif is worth roughly 4 dB over webp at half the bytes here, but the
          optimizer needs about 4 s to produce avif at full width — a cost that
          would land on the first visitor of the screen this image is the
          largest paint of. Serving the files straight from public/ keeps the
          avif bytes and takes the transcode off the request path entirely.
          The browser still picks a width, so this stays as responsive as the
          next/image version was. */}
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

      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <Link href={buttonHref} className={styles.button}>
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}
