"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import useRequireAuth from "@/lib/supabase/useRequireAuth";
import { getProfile } from "@/lib/supabase/data";
import AppPanel from "@/components/AppPanel";
import styles from "./profile.module.css";

const QUESTIONS = [
  {
    key: "life",
    label: "Your life",
    text: "In a sentence or two, describe your day-to-day life.",
    placeholder: "e.g. I work in a busy office, have two children…",
  },
  {
    key: "goal",
    label: "Your goal",
    text: "What are you working toward right now?",
    placeholder: "e.g. I want to lead a team with more confidence…",
  },
  {
    key: "blocker",
    label: "Your blocker",
    text: "What usually stops you from applying what you learn?",
    placeholder: "e.g. I finish books but forget the ideas a week later…",
  },
];

export default function ProfileView() {
  const session = useRequireAuth();
  const router = useRouter();
  const [answers, setAnswers] = useState({ life: "", goal: "", blocker: "" });
  const [loaded, setLoaded] = useState(false);
  const [fetchHint, setFetchHint] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return undefined;
    let alive = true;
    (async () => {
      try {
        const existing = await getProfile(getSupabase(), session.user.id);
        if (alive && existing) {
          setAnswers({
            life: existing.life ?? "",
            goal: existing.goal ?? "",
            blocker: existing.blocker ?? "",
          });
        }
      } catch {
        if (alive) setFetchHint("Couldn't load what you saved before — you can still save below.");
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  function update(key, value) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  async function onSave(event) {
    event.preventDefault();
    if (busy) return;
    setError("");

    const missing = QUESTIONS.some((q) => !answers[q.key].trim());
    if (missing) {
      setError("Please answer all three questions — your context helps the tutor help you.");
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabase();
      const { error: failure } = await supabase.from("profiles").upsert(
        {
          user_id: session.user.id,
          life: answers.life.trim(),
          goal: answers.goal.trim(),
          blocker: answers.blocker.trim(),
        },
        { onConflict: "user_id" }
      );
      if (failure) throw failure;
      router.push("/dashboard");
    } catch {
      setError("We couldn't save your answers just now. Please try again.");
      setBusy(false);
    }
  }

  if (session === undefined || !loaded) {
    return (
      <AppPanel title="Your quick profile">
        <p className={styles.loading}>
          <span className={styles.spinner} aria-hidden="true" /> Loading…
        </p>
      </AppPanel>
    );
  }

  if (session === null) return null; // being redirected to /login

  return (
    <AppPanel
      eyebrow="Just a few quick questions"
      title="Your quick profile"
      lead="These stay private to you and shape how Bibliosage works with your reading."
    >
      {fetchHint ? (
        <p className={styles.hint} role="status">
          {fetchHint}
        </p>
      ) : null}

      <form className={styles.form} onSubmit={onSave} noValidate>
        {QUESTIONS.map((q, i) => (
          <div className={styles.field} key={q.key}>
            <label htmlFor={`profile-${q.key}`}>
              {i + 1}. {q.text}
            </label>
            <textarea
              id={`profile-${q.key}`}
              name={q.key}
              rows={3}
              placeholder={q.placeholder}
              value={answers[q.key]}
              disabled={busy}
              onChange={(event) => update(q.key, event.target.value)}
            />
          </div>
        ))}

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className={`btn ${styles.save}`}
          disabled={busy}
        >
          {busy ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </AppPanel>
  );
}