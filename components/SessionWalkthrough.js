"use client";

/**
 * "See how a session feels." - an animated walkthrough of one Bibliosage session.
 *
 * THIS IS A VISUAL MOCK ONLY. Nothing here works: the buttons are plain chips,
 * and nothing is saved anywhere. When the real tutor is built, this whole file
 * gets replaced by the live session component.
 *
 * How the animation works:
 *  - `step` counts through the walkthrough (0 to FINAL_STEP)
 *  - every step change schedules the next one with a timer
 *  - `typedUser` and `typedTutor` count how many letters are on screen
 *  - the walkthrough starts when it scrolls into view and pauses when it
 *    leaves the screen again
 *  - with reduced motion on, it jumps straight to the finished picture
 */
import { useEffect, useRef, useState } from "react";
import useReducedMotion from "./useReducedMotion";
import { Sprout } from "./Illustrations";
import styles from "./SessionWalkthrough.module.css";

/* the session being played out */

const USER_TEXT =
  "Opportunity cost is the value of the best option you gave up to say yes to something else.";
const TUTOR_TEXT =
  "Opportunity cost is what you give up. Choosing one path means leaving another untaken. It is not always about money. Sometimes it is attention.";
const QUESTION =
  "Where have you said yes to something recently, and what did it cost you?";
const CHECK_Q = "If you spend Saturday scrolling, what did you give up?";
const ACTIONS = [
  "Write down what you are saying no to this week.",
  "Pick one yes, and check what it quietly costs.",
  "Say one no out loud today.",
];
const BUTTONS = ["Got it", "Explain differently", "Give me an example"];

const SR_TEXT =
  "Preview of one Bibliosage session: you bring a short passage about a concept, the tutor explains it in simple words, it asks one guiding question, you choose how to continue, it checks that you understood, and it gives you three small actions.";

/* the timing of the walkthrough, in milliseconds */

const TYPE_MS = 26;
const FINAL_STEP = 6;
const STEP_MS = [
  700, // 0: an empty session, ready to start
  USER_TEXT.length * TYPE_MS + 900, // 1: the passage is typed in
  TUTOR_TEXT.length * TYPE_MS + 1100, // 2: the explanation is typed out
  1900, // 3: the question and the three choices
  1500, // 4: the cursor presses "Got it"
  2600, // 5: the check question and the tick
  3200, // 6: the three actions arrive, then it starts again
];

const PIP_FOR_STEP = [0, 1, 2, 3, 3, 4, 5];
const PIPS = [1, 2, 3, 4, 5];

export default function SessionWalkthrough() {
  const reduce = useReducedMotion();

  const wrapRef = useRef(null);
  const [step, setStep] = useState(0);
  const [typedUser, setTypedUser] = useState(0);
  const [typedTutor, setTypedTutor] = useState(0);
  const [onScreen, setOnScreen] = useState(false);

  const running = onScreen && !reduce;

  /* start when the section scrolls into view, pause when it leaves */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const seen = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.3 }
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  /* with reduced motion on, show the finished session and leave it there */
  useEffect(() => {
    if (!reduce) return;
    setStep(FINAL_STEP);
    setTypedUser(USER_TEXT.length);
    setTypedTutor(TUTOR_TEXT.length);
  }, [reduce]);

  /* move to the next step */
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      const next = (step + 1) % (FINAL_STEP + 1);
      if (next === 0) {
        setTypedUser(0);
        setTypedTutor(0);
      }
      setStep(next);
    }, STEP_MS[step]);
    return () => clearTimeout(timer);
  }, [step, running]);

  /* typing the passage in */
  useEffect(() => {
    if (!running || step !== 1 || typedUser >= USER_TEXT.length) return;
    const timer = setTimeout(() => setTypedUser((n) => n + 1), TYPE_MS);
    return () => clearTimeout(timer);
  }, [running, step, typedUser]);

  /* typing the explanation out */
  useEffect(() => {
    if (!running || step !== 2 || typedTutor >= TUTOR_TEXT.length) return;
    const timer = setTimeout(() => setTypedTutor((n) => n + 1), TYPE_MS);
    return () => clearTimeout(timer);
  }, [running, step, typedTutor]);

  const replay = () => {
    setTypedUser(0);
    setTypedTutor(0);
    setStep(0);
  };

  const leaves = step >= 5 ? 3 : step >= 2 ? 2 : 1;
  const pip = PIP_FOR_STEP[step];

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <p className="srOnly">{SR_TEXT}</p>

      <div className={styles.stage}>
        {/* the mascot: it grows a new leaf at each stage */}
        <Sprout leaves={leaves} size={86} className={styles.mascot} />

        <div className={styles.card}>
          <div className={styles.chrome} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          {/* Everything is always in the page, so the card never jumps size
              while the walkthrough plays. New parts just fade in. */}
          <div className={styles.inner} aria-hidden="true">
            {/* the passage you bring */}
            <div className={styles.userBox} data-on={step >= 1}>
              <p className={styles.userText}>
                {USER_TEXT.slice(0, typedUser)}
                {step === 1 && <span className={styles.caret} />}
                <span className={styles.tail}>{USER_TEXT.slice(typedUser)}</span>
              </p>
            </div>

            {/* the tutor's explanation */}
            <div className={styles.tutorBox} data-on={step >= 2}>
              <p className={styles.tutorText}>
                {TUTOR_TEXT.slice(0, typedTutor)}
                {step === 2 && <span className={styles.caret} />}
                <span className={styles.tail}>{TUTOR_TEXT.slice(typedTutor)}</span>
              </p>
            </div>

            {/* one guiding question */}
            <div className={styles.question} data-on={step >= 3}>
              <p>{QUESTION}</p>
            </div>

            {/* the three ways to continue (mock only) */}
            <div className={styles.choices} data-on={step >= 3}>
              <span className={styles.choiceSlot}>
                <span
                  className={styles.chip}
                  data-press={step === 4}
                  data-picked={step >= 4}
                >
                  {BUTTONS[0]}
                </span>
                <span
                  className={styles.cursor}
                  data-on={step >= 3}
                  data-press={step === 4}
                >
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                    <path
                      d="M5.6 3.4l12.6 8.2-5.5 1.1-2.6 5.3z"
                      fill="var(--forest)"
                      stroke="#fff"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
              <span className={styles.chip}>{BUTTONS[1]}</span>
              <span className={styles.chip}>{BUTTONS[2]}</span>
            </div>

            {/* a quick check, and a tick that draws itself */}
            <div className={styles.check} data-on={step >= 5}>
              <span className={styles.tickCircle}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                  <path
                    className={styles.tick}
                    data-on={step >= 5}
                    pathLength="1"
                    d="M4.8 12.4l4.6 4.6L19.2 6.6"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p>{CHECK_Q}</p>
            </div>

            {/* your 3 actions, sliding in one by one */}
            <div className={styles.actions} data-on={step >= 6}>
              <p className={styles.actionsHead}>Your 3 actions</p>
              <ul>
                {ACTIONS.map((text, i) => (
                  <li key={text} style={{ "--d": `${i * 200}ms` }}>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* progress dots and a replay button */}
      <div className={styles.controls}>
        <div className={styles.pips} aria-hidden="true">
          {PIPS.map((n, i) => (
            <span key={n} className={styles.pip} data-on={pip >= n} />
          ))}
        </div>
        <button type="button" className={styles.replay} onClick={replay}>
          Replay
        </button>
      </div>
    </div>
  );
}
