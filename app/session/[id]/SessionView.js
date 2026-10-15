"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import useRequireAuth from "@/lib/supabase/useRequireAuth";
import { getSession } from "@/lib/supabase/data";
import styles from "./session.module.css";

const MAX_EXPLAIN_TURNS = 10;
const TOPIC_LABEL = "AI overview, not from a specific book. Double-check important facts.";

const ERROR_COPY = {
  busy: "The tutor is busy, try again in a minute.",
  limit: "You've used all your sessions this month.",
  config: "The tutor isn't set up yet. Please try again later.",
  auth: "Your session expired. Please log in again.",
  input: "That text can't be used for a session.",
  groq: "The tutor couldn't reply just now. Please try again.",
};

/* The "notes"/"books" columns may not exist yet (SQL not run) — treat that
   single case as "save without them" rather than a hard failure. */
function isMissingColumn(error) {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "PGRST204" ||
    code === "42703" ||
    msg.includes("could not find the 'notes'") ||
    msg.includes("could not find the 'books'") ||
    msg.includes("column \"notes\"") ||
    msg.includes("column \"books\"")
  );
}

export default function SessionView() {
  const session = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [mode, setMode] = useState("new"); // new | replay
  const [startupError, setStartupError] = useState("");

  const [inputType, setInputType] = useState("paste"); // paste | topic
  const [inputText, setInputText] = useState("");
  const [goal, setGoal] = useState("");
  const [messages, setMessages] = useState([]); // { role: 'tutor'|'user', text }
  const [phase, setPhase] = useState("explain"); // explain | check | done
  const [explainTurns, setExplainTurns] = useState(0);
  const [actions, setActions] = useState([]);
  const [books, setBooks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [callError, setCallError] = useState("");
  const [reply, setReply] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const startedRef = useRef(false);
  const savedRef = useRef(false);
  const busyRef = useRef(false);
  const messagesRef = useRef([]);
  const notesRef = useRef({});
  const inputTypeRef = useRef("paste");
  const explainRef = useRef(0);
  const checkAnswersRef = useRef(0);
  const sendRef = useRef(() => {});

  // Load the session: either a saved one to replay, or a new one started
  // from the dashboard (its text/goal/type wait in sessionStorage).
  useEffect(() => {
    if (session === undefined || !id) return; // still checking auth
    if (session === null) return; // the hook redirects to /login
    let alive = true;

    (async () => {
      try {
        const row = await getSession(getSupabase(), id);
        if (!alive) return;

        if (row && row.user_id === session.user.id) {
          const savedType = row.input_type === "topic" ? "topic" : "paste";
          setMode("replay");
          setInputType(savedType);
          inputTypeRef.current = savedType;
          setInputText(row.input_text || "");
          setGoal(row.session_goal || "");
          const convo = Array.isArray(row.conversation) ? row.conversation : [];
          setMessages(convo);
          messagesRef.current = convo;
          setActions(Array.isArray(row.actions) ? row.actions : []);
          setBooks(Array.isArray(row.books) ? row.books : []);
          if (row.notes && typeof row.notes === "object") notesRef.current = row.notes;
          setPhase("done");
          setSaved(true);
          savedRef.current = true;
          setStatus("ready");
          return;
        }

        // A brand new session.
        let pending = null;
        try {
          const raw = sessionStorage.getItem("bibliosage.pending." + id);
          if (raw) pending = JSON.parse(raw);
        } catch {
          pending = null;
        }
        if (!pending?.inputText) {
          setStartupError(
            "This session wasn't started from your dashboard. Head back and press Start so your tutor knows what to work on."
          );
          setStatus("error");
          return;
        }
        const pendingType = pending.inputType === "topic" ? "topic" : "paste";
        setInputType(pendingType);
        inputTypeRef.current = pendingType;
        setInputText(pending.inputText);
        setGoal(pending.sessionGoal || "");
        setStatus("ready");
      } catch {
        if (!alive) return;
        setStartupError("We couldn't open this session. Please try again.");
        setStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, [session, id]);

  async function persist(convo, acts, bookList) {
    if (savedRef.current) return;
    savedRef.current = true;
    setSaving(true);
    try {
      const supabase = getSupabase();
      const baseRow = {
        id,
        user_id: session.user.id,
        input_type: inputTypeRef.current,
        input_text: inputText,
        session_goal: goal || null,
        conversation: convo,
        actions: acts,
      };
      const fullRow = {
        ...baseRow,
        notes: notesRef.current || {},
        books: Array.isArray(bookList) ? bookList : [],
      };
      let { error } = await supabase.from("sessions").insert(fullRow);
      if (error && isMissingColumn(error)) {
        const retry = await supabase.from("sessions").insert(baseRow);
        error = retry.error;
      }
      if (error && error.code !== "23505") throw error;
      setSaved(true);
    } catch {
      savedRef.current = false;
      setCallError(
        "Your session finished, but we couldn't save it. You can try saving again below."
      );
    } finally {
      setSaving(false);
    }
  }

  async function send(directive, opts = {}) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setCallError("");

    const isExplain = ["start", "got_it", "diff", "example", "reply"].includes(directive);
    const userText = typeof opts.userText === "string" ? opts.userText.trim() : "";

    let history = messagesRef.current;
    if (userText) {
      history = [...history, { role: "user", text: userText }];
      messagesRef.current = history;
      setMessages(history);
    }

    const checkAnswersToSend =
      directive === "check_answer" ? checkAnswersRef.current + 1 : checkAnswersRef.current;

    try {
      const supabase = getSupabase();
      const { data: sb } = await supabase.auth.getSession();
      const token = sb?.session?.access_token;
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          directive,
          inputType: inputTypeRef.current,
          inputText,
          sessionGoal: goal,
          history,
          notes: notesRef.current,
          explainTurns: explainRef.current,
          checkAnswers: checkAnswersToSend,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setCallError(ERROR_COPY.auth);
          return;
        }
        setCallError(ERROR_COPY[data?.code] || ERROR_COPY.groq);
        return;
      }

      const stage = ["explain", "check", "actions"].includes(data.stage)
        ? data.stage
        : "explain";
      if (data.notes && typeof data.notes === "object") {
        notesRef.current = data.notes;
      }
      const tutorText =
        [String(data.say || "").trim(), String(data.question || "").trim()]
          .filter(Boolean)
          .join("\n\n") || "Let's keep going.";
      const withTutor = [...history, { role: "tutor", text: tutorText }];
      messagesRef.current = withTutor;
      setMessages(withTutor);

      if (isExplain) {
        explainRef.current += 1;
        setExplainTurns(explainRef.current);
      }
      if (directive === "begin_checks") setPhase("check");
      if (directive === "check_answer") {
        checkAnswersRef.current = checkAnswersToSend;
      }

      if (stage === "actions") {
        const acts = Array.isArray(data.actions) ? data.actions.slice(0, 5) : [];
        const bk =
          inputTypeRef.current === "topic" && Array.isArray(data.books)
            ? data.books.slice(0, 3)
            : [];
        setActions(acts);
        setBooks(bk);
        setPhase("done");
        await persist(withTutor, acts, bk);
      } else if (directive === "begin_checks" || directive === "check_answer") {
        setPhase("check");
      }
    } catch {
      setCallError(ERROR_COPY.groq);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  sendRef.current = send;

  // Kick off the first explanation for a brand new session.
  useEffect(() => {
    if (status !== "ready" || mode !== "new" || startedRef.current) return;
    startedRef.current = true;
    sendRef.current("start");
  }, [status, mode]);

  function submitReply() {
    const text = reply.trim();
    if (!text || busy) return;
    setReply("");
    if (phase === "check") sendRef.current("check_answer", { userText: text });
    else sendRef.current("reply", { userText: text });
  }

  function onReplyKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitReply();
    }
  }

  if (session === undefined || status === "loading") {
    return (
      <div className={styles.wrap}>
        <section className={styles.card}>
          <div className={styles.loading}>
            <span className={styles.spinner} aria-hidden="true" />
            <span>Opening your session…</span>
          </div>
        </section>
      </div>
    );
  }

  if (session === null) return null;

  if (status === "error") {
    return (
      <div className={styles.wrap}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Session</p>
          <h1 className={styles.title}>We couldn&apos;t start this one</h1>
          <p className={styles.lead} role="alert">
            {startupError}
          </p>
          <Link className={`btn ${styles.primary}`} href="/dashboard">
            Back to dashboard
          </Link>
        </section>
      </div>
    );
  }

  const atExplainCap = explainTurns >= MAX_EXPLAIN_TURNS;
  const isTopic = inputType === "topic";
  const firstTutorIndex = messages.findIndex((m) => m.role === "tutor");
  const phaseLabel =
    phase === "done" ? "Finished" : phase === "check" ? "Checking understanding" : "Learning";

  return (
    <div className={styles.wrap}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>
              {mode === "replay"
                ? "Saved session"
                : isTopic
                  ? "Topic · session"
                  : "Paste it · session"}
            </p>
            <h1 className={styles.title}>{goal ? goal : "Your session"}</h1>
          </div>
          <span className={styles.badge}>
            {phaseLabel}
            {phase === "explain" ? ` · ${Math.min(explainTurns, MAX_EXPLAIN_TURNS)}/${MAX_EXPLAIN_TURNS}` : ""}
          </span>
        </header>

        {isTopic ? (
          <p className={styles.modeLabel} data-topic-label="1">
            {TOPIC_LABEL}
          </p>
        ) : null}

        <div className={styles.thread} data-messages>
          {messages.map((m, i) => (
            <Fragment key={i}>
              {isTopic && i === firstTutorIndex ? (
                <p className={styles.msgLabel}>{TOPIC_LABEL}</p>
              ) : null}
              <div
                className={m.role === "tutor" ? styles.tutorRow : styles.userRow}
                data-tutor={m.role === "tutor" ? "1" : undefined}
                data-user={m.role !== "tutor" ? "1" : undefined}
              >
                <div className={m.role === "tutor" ? styles.tutorBubble : styles.userBubble}>
                  {m.text}
                </div>
              </div>
            </Fragment>
          ))}

          {busy ? (
            <div className={styles.thinking} data-thinking="1">
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
              <em>Thinking…</em>
            </div>
          ) : null}
        </div>

        {phase === "explain" && !busy ? (
          <div className={styles.controls}>
            {atExplainCap ? (
              <p className={styles.capNote}>
                You&apos;ve gone deep on the explanations — time to check what you&apos;ve
                understood.
              </p>
            ) : (
              <div className={styles.chips}>
                <button type="button" className={styles.chip} onClick={() => sendRef.current("got_it")}>
                  Got it
                </button>
                <button type="button" className={styles.chip} onClick={() => sendRef.current("diff")}>
                  Explain differently
                </button>
                <button type="button" className={styles.chip} onClick={() => sendRef.current("example")}>
                  Give me an example
                </button>
              </div>
            )}

            <div className={styles.replyRow}>
              <input
                className={styles.replyInput}
                data-reply="1"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={onReplyKeyDown}
                placeholder="Or reply in your own words…"
                aria-label="Reply to your tutor"
                disabled={atExplainCap}
              />
              <button
                type="button"
                className={styles.sendBtn}
                data-send="1"
                onClick={submitReply}
                disabled={!reply.trim() || atExplainCap}
              >
                Send
              </button>
            </div>

            <button
              type="button"
              className={`btn ${styles.understand}`}
              onClick={() => sendRef.current("begin_checks")}
            >
              I understand — check me
            </button>
          </div>
        ) : null}

        {phase === "check" && !busy ? (
          <div className={styles.controls}>
            <label className={styles.checkLabel} htmlFor="check-answer">
              Your answer
            </label>
            <div className={styles.replyRow}>
              <input
                id="check-answer"
                className={styles.replyInput}
                data-reply="1"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={onReplyKeyDown}
                placeholder="Answer in a sentence or two…"
                autoFocus
              />
              <button
                type="button"
                className={styles.sendBtn}
                data-send="1"
                onClick={submitReply}
                disabled={!reply.trim()}
              >
                Send
              </button>
            </div>
          </div>
        ) : null}

        {phase === "done" ? (
          <div className={styles.done}>
            <h2 className={styles.doneTitle}>Try this week</h2>
            <div className={styles.actionGrid} data-actions>
              {actions.map((a, i) => (
                <article key={i} className={styles.actionCard} data-action-card="1">
                  <h3 className={styles.actionTitle}>{a.title}</h3>
                  <p className={styles.actionBody}>{a.body}</p>
                </article>
              ))}
            </div>

            {isTopic ? (
              <section className={styles.books} data-books>
                <h2 className={styles.booksTitle}>Books to explore</h2>
                {books.length > 0 ? (
                  <ul className={styles.bookList}>
                    {books.map((b, i) => (
                      <li key={i} className={styles.bookItem} data-book="1">
                        <span className={styles.bookTitle}>{b.title}</span>
                        {b.author ? (
                          <span className={styles.bookAuthor}> — {b.author}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.booksEmpty}>
                    I&apos;m not certain of any specific books — search a library or
                    bookstore for this topic.
                  </p>
                )}
                <p className={styles.booksNote}>Double-check titles before you buy.</p>
              </section>
            ) : null}

            {!saved ? (
              <div className={styles.saveRow}>
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={() => persist(messagesRef.current, actions, books)}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save this session"}
                </button>
              </div>
            ) : null}

            <Link className={`btn ${styles.primary}`} href="/dashboard">
              Back to dashboard
            </Link>
          </div>
        ) : null}

        {callError ? (
          <p className={styles.error} role="alert">
            {callError}
          </p>
        ) : null}
      </section>
    </div>
  );
}
