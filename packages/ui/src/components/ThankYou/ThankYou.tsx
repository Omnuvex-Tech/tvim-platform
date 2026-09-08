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
    <section
      className={styles.wrapper}
      style={{ backgroundImage: `url(${imageSrc})` }}
    >
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