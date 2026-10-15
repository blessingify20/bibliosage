"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import useRequireAuth from "@/lib/supabase/useRequireAuth";
import {
  countSessionsThisMonth,
  getSubscription,
  listSessions,
} from "@/lib/supabase/data";
import AppPanel from "@/components/AppPanel";
import styles from "./dashboard.module.css";

const LIMITS = { free: 10, plus: 30 };
const PLAN_NAMES = { free: "Free", plus: "Plus" };
const MAX_PASTE = 6000;

function preview(text) {
  if (!text) return "Session";
  const t = String(text).replace(/\s+/g, " ").trim();
  return t.length > 90 ? t.slice(0, 90) + "…" : t;
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function DashboardView() {
  const session = useRequireAuth();
  const router = useRouter();

  const [plan, setPlan] = useState(null); // 'free' | 'plus'
  const [planHint, setPlanHint] = useState("");
  const [used, setUsed] = useState(null);
  const [usageError, setUsageError] = useState("");

  const [sessions, setSessions] = useState(null);
  const [sessionsError, setSessionsError] = useState("");

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
    let resolvedPlan = "free";
    try {
      resolvedPlan = await getSubscription(supabase, session.user.id);
      setPlan(resolvedPlan);
      setPlanHint("");
    } catch {
      resolvedPlan = "free";
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

    try {
      const rows = await listSessions(
        supabase,
        session.user.id,
        resolvedPlan === "plus" ? 100 : 3
      );
      setSessions(rows);
      setSessionsError("");
    } catch {
      setSessions(null);
      setSessionsError("Couldn't load your sessions just now.");
    }
  }

  useEffect(() => {
    if (session?.user?.id) loadCounters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Refresh when the tab regains focus, so a finished session shows up after
  // coming back from /session/[id].
  useEffect(() => {
    function onFocus() {
      if (session?.user?.id) loadCounters();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
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

  const limit = LIMITS[plan] ?? LIMITS.free;
  const planName = PLAN_NAMES[plan] ?? "Free";
  const limitReached = used !== null && used >= limit;
  const overPaste = inputText.length > MAX_PASTE;

  function onStart() {
    setComposerError("");
    setTutorNotice("");

    if (inputType === "topic") {
      setTutorNotice("The tutor is coming next.");
      return;
    }
    if (!gain.trim()) {
      setComposerError("Tell us what you'd like to gain from this session, then press Start.");
      return;
    }
    if (!inputText.trim()) {
      setComposerError("Paste the passage you want to work through, then press Start.");
      return;
    }
    if (overPaste) {
      setComposerError(
        `That's ${inputText.length.toLocaleString()} characters — one session works best with 6,000 or fewer. Please trim it a little.`
      );
      return;
    }
    if (limitReached) {
      setComposerError(
        `You've used all ${limit} sessions on the ${planName} plan this month.`
      );
      return;
    }

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2);
    try {
      sessionStorage.setItem(
        "bibliosage.pending." + id,
        JSON.stringify({ inputText: inputText.trim(), sessionGoal: gain.trim() })
      );
    } catch {
      setComposerError("We couldn't start the session in this browser. Please try again.");
      return;
    }
    router.push("/session/" + id);
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

        {inputType === "paste" ? (
          <p
            className={overPaste ? styles.counterOver : styles.counter}
            aria-live="polite"
          >
            {inputText.length.toLocaleString()} / {MAX_PASTE.toLocaleString()} characters
            {overPaste ? " — please trim to 6,000 or fewer." : ""}
          </p>
        ) : null}

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

        {inputType === "paste" && limitReached ? (
          <div className={styles.limitBox} role="status">
            <p>
              You&apos;ve used all {limit} sessions on the {planName} plan this
              month. Sessions reset at the start of next month.
            </p>
            <Link className={`btn ${styles.upgrade}`} href="/plan">
              {planName === "Free" ? "Upgrade to Plus" : "See your plan"}
            </Link>
          </div>
        ) : (
          <button type="button" className={`btn ${styles.start}`} onClick={onStart}>
            Start
          </button>
        )}
      </section>

      <section className={styles.block} aria-label="Your sessions">
        <h2 className={styles.blockTitle}>Your sessions</h2>
        {sessionsError ? (
          <div className={styles.usageError} role="alert">
            <p>{sessionsError}</p>
            <button type="button" className={styles.retry} onClick={loadCounters}>
              Try again
            </button>
          </div>
        ) : sessions === null ? (
          <p className={styles.loadingSmall}>
            <span className={styles.spinner} aria-hidden="true" /> Loading your
            sessions…
          </p>
        ) : sessions.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No sessions yet</p>
            <p className={styles.emptyCopy}>
              Tell your tutor what you&apos;d like to gain above and press Start —
              every session will live here.
            </p>
          </div>
        ) : (
          <>
            <ul className={styles.sessionList}>
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link className={styles.sessionItem} href={`/session/${s.id}`}>
                    <span className={styles.sessionTitle}>
                      {s.session_goal?.trim() || preview(s.input_text)}
                    </span>
                    <span className={styles.sessionMeta}>
                      {formatDate(s.created_at)}
                      {s.actions && s.actions.length
                        ? ` · ${s.actions.length} action${s.actions.length === 1 ? "" : "s"}`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {plan !== "plus" ? (
              <p className={styles.sessionNote}>
                Free shows your last 3 sessions —{" "}
                <Link className={styles.inlineLink} href="/plan">
                  upgrade to Plus
                </Link>{" "}
                to keep them all.
              </p>
            ) : null}
          </>
        )}
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
