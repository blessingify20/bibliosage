"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu if the window grows to desktop width
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 861px)");
    const close = () => setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.logo}>
          Bibliosage
        </Link>

        <nav className={styles.links} aria-label="Main">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/signup" className={styles.login}>
            Log in
          </Link>
          <Link href="/signup" className="btn">
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className={styles.burger}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.burgerBox} data-open={open}>
            <span />
            <span />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={styles.mobile}
        data-open={open}
        hidden={!open}
      >
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <span className={styles.rule} />
        <Link href="/signup" onClick={() => setOpen(false)}>
          Log in
        </Link>
        <Link
          href="/signup"
          className="btn"
          onClick={() => setOpen(false)}
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}
