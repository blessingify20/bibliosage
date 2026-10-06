"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useRequireAuth from "@/lib/supabase/useRequireAuth";
import AppPanel from "@/components/AppPanel";
import styles from "./plan.module.css";

/* Choosing a plan. Both plans continue to /profile for now: Free is the
   default (a missing subscription row is Free by design, and users cannot
   create subscription rows themselves), and Plus shows "Payment is coming
   next" before continuing as Free until payments exist. */
export default function PlanView() {
  const session = useRequireAuth();
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function pickFree() {
    if (busy) return;
    setNotice("");
    router.push("/profile");
  }

  function pickPlus() {
    if (busy) return;
    setBusy(true);
    setNotice("Payment is coming next — you're on Free for now.");
    timer.current = setTimeout(() => router.push("/profile"), 1400);
  }

  if (session === undefined) {
    return (
      <AppPanel title="Your plan">
        <p className={styles.loading}>
          <span className={styles.spinner} aria-hidden="true" /> Checking your
          session…
        </p>
      </AppPanel>
    );
  }

  if (session === null) return null; // being redirected to /login

  return (
    <AppPanel
      wide
      eyebrow="Your loop"
      title="Pick your plan"
      lead="Reading is just one part of the job — Bibliosage works with you."
    >
      {notice ? (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      ) : null}

      <div className={styles.plans}>
        <section className={`${styles.planCard} ${styles.free}`}>
          <h2 className={styles.planName}>Free</h2>
          <p className={styles.price}>£0 · forever</p>
          <ul className={styles.feats}>
            <li><span aria-hidden="true">✓</span> 10 sessions a month</li>
            <li><span aria-hidden="true">✓</span> Your learning loop</li>
          </ul>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={pickFree}
          >
            Continue with Free
          </button>
        </section>

        <section className={`${styles.planCard} ${styles.plus}`}>
          <h2 className={styles.planName}>Plus</h2>
          <p className={styles.price}>More room to grow</p>
          <ul className={styles.feats}>
            <li><span className={styles.gold} aria-hidden="true">✓</span> 30 sessions a month</li>
            <li><span className={styles.gold} aria-hidden="true">✓</span> Everything in Free</li>
          </ul>
          <button
            type="button"
            className={`btn ${styles.plusBtn}`}
            disabled={busy}
            onClick={pickPlus}
          >
            Get Plus
          </button>
          <p className={styles.coming}>Payment is coming next.</p>
        </section>
      </div>
    </AppPanel>
  );
}