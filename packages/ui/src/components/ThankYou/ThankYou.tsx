import Image from "next/image";
import Link from "next/link";
import styles from "../../styles/ThankYou/thankyou.module.css";

export interface ThankYouProps {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  imageSrc: string;
}

export function ThankYou({
  title,
  subtitle,
  buttonLabel,
  buttonHref,
  imageSrc,
}: ThankYouProps) {
  return (
    <section className={styles.wrapper}>
      {/* The backdrop goes through next/image rather than a css background so
          it arrives as an avif/webp sized for the viewport; as a css url it
          was fetched whole, at full resolution, on every device. It fills the
          first screen, so it is the largest paint and loads with priority. */}
      <Image
        src={imageSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.image}
      />

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
