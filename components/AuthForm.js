"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import styles from "./AuthForm.module.css";

/* The same card powers /signup and /login — only the wording and the
   Supabase call change. */
const COPY = {
  signup: {
    eyebrow: "Start learning",
    title: "Create your account",
    lead: "Free to start. Your books, your loop, your pace.",
    submit: "Create account",
    busy: "Creating your account…",
    altQuestion: "Already have an account?",
    altLabel: "Log in",
    altHref: "/login",
    confirm:
      "Almost there! We've sent a confirmation link to your inbox — open it, then log in.",
    welcome: "You're in! Opening your dashboard…",
  },
  login: {
    eyebrow: "Welcome back",
    title: "Log in",
    lead: "Pick up your learning loop right where you left off.",
    submit: "Log in",
    busy: "Logging you in…",
    altQuestion: "New to Bibliosage?",
    altLabel: "Sign up",
    altHref: "/signup",
    welcome: "Opening your dashboard…",
  },
};

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email, password, mode) {
  const value = email.trim();
  if (!value) return "Please enter your email address.";
  if (!EMAIL_SHAPE.test(value))
    return "That doesn't look like an email address — please check it.";
  if (!password) {
    return mode === "signup"
      ? "Please choose a password."
      : "Please enter your password.";
  }
  if (mode === "signup" && password.length < 6)
    return "Your password needs at least 6 characters.";
  return "";
}

/* Supabase hands back developer-ish strings; visitors get kind sentences
   instead, and the common cases name the next step. */
function friendlyError(raw, mode) {
  const message = String(raw || "").toLowerCase();

  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("invalid login credentials"))
    return "That email and password don't match. Check them and try again.";
  if (message.includes("already registered"))
    return "This email already has an account — try logging in instead.";
  if (message.includes("password") && message.includes("at least"))
    return "Your password needs at least 6 characters.";
  if (message.includes("email not confirmed"))
    return "Please confirm your email first — open the link we sent you, then log in.";
  if (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("security purposes")
  )
    return "Too many attempts. Give it a minute, then try again.";
  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch failed")
  )
    return "We couldn't reach Bibliosage. Check your connection and try again.";

  return mode === "login"
    ? "We couldn't log you in just now. Please try again."
    : "We couldn't create your account just now. Please try again.";
}

export default function AuthForm({ mode }) {
  const router = useRouter();
  const copy = COPY[mode] ?? COPY.login;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const problem = validate(email, password, mode);
    if (problem) {
      setError(problem);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError(
        "This isn't connected to Bibliosage yet — the Supabase settings are missing."
      );
      return;
    }

    setError("");
    setNotice("");
    setBusy(true);

    const trimmed = email.trim();

    try {
      if (mode === "signup") {
        const { data, error: failure } = await supabase.auth.signUp({
          email: trimmed,
          password,
        });

        if (failure) {
          setError(friendlyError(failure.message, mode));
          setBusy(false);
          return;
        }

        // No session means the project asks people to confirm by email first.
        if (!data.session) {
          setNotice(COPY.signup.confirm);
          setBusy(false);
          return;
        }

        setNotice(COPY.signup.welcome);
        router.push("/dashboard");
        return;
      }

      const { error: failure } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (failure) {
        setError(friendlyError(failure.message, mode));
        setBusy(false);
        return;
      }

      setNotice(COPY.login.welcome);
      router.push("/dashboard");
    } catch (failure) {
      setError(friendlyError(failure?.message, mode));
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.card} aria-labelledby="auth-title">
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="auth-title" className={styles.title}>
          {copy.title}
        </h1>
        <p className={styles.lead}>{copy.lead}</p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              placeholder={
                mode === "signup" ? "At least 6 characters" : "Your password"
              }
              value={password}
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mode === "signup" ? (
              <p className={styles.hint}>Use at least 6 characters.</p>
            ) : null}
          </div>

          <button type="submit" className={`btn ${styles.submit}`} disabled={busy}>
            {busy ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                {copy.busy}
              </>
            ) : (
              copy.submit
            )}
          </button>
        </form>

        <p className={styles.alt}>
          {copy.altQuestion} <Link href={copy.altHref}>{copy.altLabel}</Link>
        </p>
      </section>
    </div>
  );
}
