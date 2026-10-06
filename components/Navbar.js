"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import useSession from "@/lib/supabase/useSession";
import styles from "./Navbar.module.css";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  // undefined = still checking, so the bar doesn't flash the wrong links.
  const session = useSession();

  // Close the mobile menu if the window grows to desktop width
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 861px)");
    const close = () => setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  async function onLogout() {
    setOpen(false);
    const supabase = getSupabase();
    try {
      if (supabase) await supabase.auth.signOut();
    } catch {
      // The local session is cleared even when the network call fails.
    }
  }

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
          {session === undefined ? null : session ? (
            <>
              <Link href="/dashboard" className={styles.login}>
                Dashboard
              </Link>
              <button
                type="button"
                className={`btn ${styles.navBtn}`}
                onClick={onLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.login}>
                Log in
              </Link>
              <Link href="/signup" className="btn">
                Sign up
              </Link>
            </>
          )}
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
        {session === undefined ? null : session ? (
          <>
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <button
              type="button"
              className={`btn ${styles.navBtn}`}
              onClick={onLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn"
              onClick={() => setOpen(false)}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
