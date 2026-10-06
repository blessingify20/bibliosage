"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import useRequireAuth from "@/lib/supabase/useRequireAuth";
import { countSessionsThisMonth, getSubscription } from "@/lib/supabase/data";
import AppPanel from "@/components/AppPanel";
import styles from "./dashboard.module.css";

const LIMITS = { free: 10, plus: 30 };
const PLAN_NAMES = { free: "Free", plus: "Plus" };

export default function DashboardView() {
  const session = useRequireAuth();
  const router = useRouter();

  const [plan, setPlan] = useState(null); // 'free' | 'plus'
  const [planHint, setPlanHint] = useState("");
  const [used, setUsed] = useState(null);
  const [usageError, setUsageError] = useState("");

  const [gain, setGain] = useState("");
  const [inputType, setInputType] = useState("paste");
  const [inputText, setInputText] = useState("");
  const [composerError, setComposerError] = useState("");
  const [tutorNotice, setTutorNotice] = useState("");

  async function loadCounters() {
    const supabase = getSupabase();
    if (!supabase || !session) return;

    // Plan: a missing subscription row means Free. If the fetch itself fails
    // (e.g. schema.sql not run yet), show Free and say so.
    try {
      const p = await getSubscription(supabase, session.user.id);
      setPlan(p);
      setPlanHint("");
    } catch {
      setPlan("free");
      setPlanHint("Couldn't check your plan — showing Free.");
    }

    try {
      const n = await countSessionsThisMonth(supabase, session.user.id);
      setUsed(n);
      setUsageError("");
    } catch {
      setUsed(null);
      setUsageError(
        "Couldn't load your session count. Check that supabase/schema.sql has been run in the Supabase SQL Editor."
      );
    }
  }

  useEffect(() => {
    if (session?.user?.id) loadCounters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  async function onLogout() {
    const supabase = getSupabase();
    try {
      if (supabase) await supabase.auth.signOut();
    } catch {
      // local session is cleared even if the network call fails
    }
    router.push("/login");
  }

  function onStart() {
    setComposerError("");
    setTutorNotice("");
    if (!gain.trim()) {
      setComposerError("Tell us what you'd like to gain from this session, then press Start.");
      return;
    }
    setTutorNotice("The tutor is coming next.");
  }

  if (session === undefined || (plan === null && !planHint)) {
    return (
      <AppPanel title="Welcome to Bibliosage">
        <p className={styles.loading}>
          <span className={styles.spinner} aria-hidden="true" /> Loading your
          workspace…
        </p>
      </AppPanel>
    );
  }

  if (session === null) return null; // being redirected to /login

  const limit = LIMITS[plan] ?? LIMITS.free;
  const planName = PLAN_NAMES[plan] ?? "Free";
  const pct = used === null ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <AppPanel
      wide
      eyebrow="Your loop"
      title="Welcome to Bibliosage"
      lead="Becoming wise through books — one session at a time."
    >
      <div className={styles.topRow}>
        <span className={styles.planChip}>{planName} plan</span>
        {planHint ? (
          <p className={styles.planHint} role="status">
            {planHint}
          </p>
        ) : null}
      </div>

      <section className={styles.block} aria-label="Sessions used this month">
        <h2 className={styles.blockTitle}>This month</h2>
        {usageError ? (
          <div className={styles.usageError} role="alert">
            <p>{usageError}</p>
            <button type="button" className={styles.retry} onClick={loadCounters}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className={styles.usageText}>
              {used} of {limit} sessions used this month ({planName})
            </p>
            <div className={styles.bar} aria-hidden="true">
              <span className={styles.barFill} style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </section>

      <section className={styles.block} aria-label="New session">
        <h2 className={styles.blockTitle}>New session</h2>
        <div className={styles.field}>
          <label htmlFor="gain">What do you want to gain from this session?</label>
          <input
            id="gain"
            type="text"
            placeholder="e.g. Remember the key ideas from my reading"
            value={gain}
            onChange={(event) => setGain(event.target.value)}
          />
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Session input type">
          <button
            type="button"
            role="tab"
            aria-selected={inputType === "paste"}
            className={inputType === "paste" ? styles.tabActive : styles.tab}
            onClick={() => {
              setInputType("paste");
              setTutorNotice("");
            }}
          >
            Paste it
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputType === "topic"}
            className={inputType === "topic" ? styles.tabActive : styles.tab}
            onClick={() => {
              setInputType("topic");
              setTutorNotice("");
            }}
          >
            Type a topic
          </button>
        </div>

        <textarea
          className={styles.textbox}
          rows={6}
          placeholder={
            inputType === "paste"
              ? "Paste the passage you want to work through…"
              : "Type a topic you want to explore…"
          }
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
        />

        {composerError ? (
          <p className={styles.error} role="alert">
            {composerError}
          </p>
        ) : null}
        {tutorNotice ? (
          <p className={styles.notice} role="status">
            {tutorNotice}
          </p>
        ) : null}

        <button type="button" className={`btn ${styles.start}`} onClick={onStart}>
          Start
        </button>
      </section>

      <section className={styles.block} aria-label="Your sessions">
        <h2 className={styles.blockTitle}>Your sessions</h2>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No sessions yet</p>
          <p className={styles.emptyCopy}>
            Tell your tutor what you&apos;d like to gain above and press Start —
            every session will live here.
          </p>
        </div>
      </section>

      <div className={styles.footerRow}>
        <span className={styles.email}>{session.user.email}</span>
        <button type="button" className={styles.logout} onClick={onLogout}>
          Log out
        </button>
      </div>
    </AppPanel>
  );
}