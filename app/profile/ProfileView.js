"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import useRequireAuth from "@/lib/supabase/useRequireAuth";
import { getProfile } from "@/lib/supabase/data";
import AppPanel from "@/components/AppPanel";
import styles from "./profile.module.css";

/* The first three are the original quick-profile questions and stay required.
   The last five are optional and make the tutor's examples personal. */
const CORE = [
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

const EXTRA = [
  {
    key: "doing",
    label: "Right now",
    text: "What are you doing right now? Studying, working, serving, running something?",
    placeholder: "e.g. Working full-time, studying part-time…",
  },
  {
    key: "enjoy",
    label: "Outside work or school",
    text: "What do you enjoy outside work or school?",
    placeholder: "e.g. Playing five-a-side football, cooking, gardening…",
  },
  {
    key: "situation",
    label: "A real situation",
    text: "Tell us about a real situation you're dealing with right now where you'd like to use what you learn.",
    placeholder: "e.g. A difficult conversation with a colleague…",
  },
  {
    key: "strongAt",
    label: "Something you're good at",
    text: "Is there something you're good at or have lived through that we can compare new ideas to?",
    placeholder: "e.g. I've trained new staff for years…",
  },
  {
    key: "learnStyle",
    label: "How you learn",
    text: "How do you like to learn? Stories and examples, step by step, big picture first, or by trying it yourself?",
    placeholder: "e.g. Stories and examples first, then the detail…",
  },
];

const ALL = [...CORE, ...EXTRA];
const BLANK = ALL.reduce((acc, q) => ({ ...acc, [q.key]: "" }), {});

const NOTE =
  "This only helps us make examples about your life. You can edit or delete it anytime. Please don't share passwords, health, or money details.";

/* "more" may not exist yet (supabase/profile_more.sql not run) — then save
   without it instead of failing. */
function isMissingMore(error) {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "PGRST204" ||
    code === "42703" ||
    msg.includes("could not find the 'more'") ||
    msg.includes("column \"more\"")
  );
}

export default function ProfileView({ edit = false }) {
  const session = useRequireAuth();
  const router = useRouter();
  const [answers, setAnswers] = useState({ ...BLANK });
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
          const more =
            existing.more && typeof existing.more === "object" ? existing.more : {};
          setAnswers({
            life: existing.life ?? "",
            goal: existing.goal ?? "",
            blocker: existing.blocker ?? "",
            doing: more.doing ?? "",
            enjoy: more.enjoy ?? "",
            situation: more.situation ?? "",
            strongAt: more.strongAt ?? "",
            learnStyle: more.learnStyle ?? "",
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

  const answered = ALL.filter((q) => answers[q.key].trim()).length;
  const progress = Math.round((answered / ALL.length) * 100);

  async function onSave(event) {
    event.preventDefault();
    if (busy) return;
    setError("");

    const missingCore = CORE.some((q) => !answers[q.key].trim());
    if (missingCore) {
      setError("Please answer the first three questions — they help your tutor most.");
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabase();
      const more = {};
      for (const q of EXTRA) {
        const value = answers[q.key].trim();
        if (value) more[q.key] = value;
      }
      const base = {
        user_id: session.user.id,
        life: answers.life.trim(),
        goal: answers.goal.trim(),
        blocker: answers.blocker.trim(),
      };
      let { error: failure } = await supabase
        .from("profiles")
        .upsert({ ...base, more }, { onConflict: "user_id" });
      if (failure && isMissingMore(failure)) {
        const retry = await supabase
          .from("profiles")
          .upsert(base, { onConflict: "user_id" });
        failure = retry.error;
      }
      if (failure) throw failure;
      router.push("/dashboard");
    } catch {
      setError("We couldn't save your answers just now. Please try again.");
      setBusy(false);
    }
  }

  if (session === undefined || !loaded) {
    return (
      <AppPanel title={edit ? "Your profile" : "Your quick profile"}>
        <p className={styles.loading}>
          <span className={styles.spinner} aria-hidden="true" /> Loading…
        </p>
      </AppPanel>
    );
  }

  if (session === null) return null; // being redirected to /login

  return (
    <AppPanel
      eyebrow={edit ? "Make your examples more personal" : "Just a few quick questions"}
      title={edit ? "Your profile" : "Your quick profile"}
      lead={
        edit
          ? "Update anything here — the more your tutor knows, the more the examples sound like your life."
          : "These stay private to you and shape how Bibliosage works with your reading."
      }
    >
      <p className={styles.note} role="note">
        {NOTE}
      </p>

      {fetchHint ? (
        <p className={styles.hint} role="status">
          {fetchHint}
        </p>
      ) : null}

      <div className={styles.progressWrap}>
        <div className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.progressText}>
          {answered} of {ALL.length} answered
        </p>
      </div>

      <form className={styles.form} onSubmit={onSave} noValidate>
        {CORE.map((q, i) => (
          <div className={styles.cardQ} key={q.key}>
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

        <p className={styles.sectionTitle}>A little more, all optional</p>

        {EXTRA.map((q) => (
          <div className={styles.cardQ} key={q.key}>
            <label htmlFor={`profile-${q.key}`}>
              {q.text} <span className={styles.optional}>optional</span>
            </label>
            <textarea
              id={`profile-${q.key}`}
              name={q.key}
              rows={2}
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

        <button type="submit" className={`btn ${styles.save}`} disabled={busy}>
          {busy ? "Saving…" : edit ? "Save changes" : "Save and continue"}
        </button>
      </form>
    </AppPanel>
  );
}
