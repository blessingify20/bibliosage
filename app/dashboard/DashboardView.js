"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import useSession from "@/lib/supabase/useSession";
import styles from "./dashboard.module.css";

/* The protected page. The session lives in this browser, so the check
   happens as soon as the page opens: no session -> straight to /login.
   While the check is running we show a spinner, never the content. */
export default function DashboardView() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  async function onLogout() {
    const supabase = getSupabase();
    try {
      if (supabase) await supabase.auth.signOut();
    } catch {
      // Even if the network call fails, the local session is gone —
      // the redirect below still sends the visitor to /login.
    }
    router.push("/login");
  }

  if (session === undefined) {
    return (
      <div className={styles.wrap}>
        <section className={styles.card}>
          <p className={styles.loading}>
            <span className={styles.spinner} aria-hidden="true" />
            Checking your session…
          </p>
        </section>
      </div>
    );
  }

  if (session === null) return null; // being redirected to /login

  return (
    <div className={styles.wrap}>
      <section className={styles.card} aria-labelledby="welcome">
        <p className={styles.eyebrow}>You&apos;re logged in</p>
        <h1 id="welcome" className={styles.title}>
          Welcome to Bibliosage
        </h1>
        <p className={styles.lead}>Becoming wise through books.</p>

        <p className={styles.emailRow}>
          <span className={styles.emailLabel}>Signed in as</span>
          <span className={styles.email}>{session.user.email}</span>
        </p>

        <button type="button" className={styles.logout} onClick={onLogout}>
          Log out
        </button>
      </section>
    </div>
  );
}
