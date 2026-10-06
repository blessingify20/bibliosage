import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <p className={styles.logo}>Bibliosage</p>
          <p className={styles.tagline}>Becoming wise through books.</p>
        </div>

        <nav className={styles.links} aria-label="Footer">
          <Link href="#how-it-works">How it works</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="#faq">FAQ</Link>
          <Link href="#">Terms</Link>
          <Link href="#">Privacy</Link>
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>
          Bibliosage is learning support, not professional advice. Please paste
          only material you're allowed to use.
        </p>
        <p>© 2026 Bibliosage</p>
      </div>
    </footer>
  );
}