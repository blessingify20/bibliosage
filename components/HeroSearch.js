"use client";

/**
 * The hero's search-style input box.
 *
 * It is not a real input yet - it is a visual mock. The placeholder types out
 * the prompt first, then cycles through a few examples, the way a real
 * product would hint at what you can bring.
 *
 * With reduced motion on it simply shows the prompt and stays still.
 */
import { useEffect, useState } from "react";
import useReducedMotion from "./useReducedMotion";
import styles from "./HeroSearch.module.css";

const PROMPT = "What are you learning today?";

/* the placeholder rotates through these, and the prompt comes back around */
const ROTATION = [
  "a chapter from my book",
  "a concept like critical thinking",
  "my class notes",
  PROMPT,
];

const LEAD_MS = 3200; /* how long the prompt sits there before the first example */
const TYPE_MS = 58;
const HOLD_MS = 2400;
const ERASE_MS = 26;
const GAP_MS = 700;

export default function HeroSearch() {
  const reduce = useReducedMotion();
  const [which, setWhich] = useState(0);
  const [typed, setTyped] = useState(PROMPT);

  useEffect(() => {
    if (reduce) return;

    const current = ROTATION[which];
    const typeFor = LEAD_MS + current.length * TYPE_MS;
    const eraseFor = typeFor + HOLD_MS + current.length * ERASE_MS;

    /* one small timer per letter is simpler to read than one timer
       that has to keep track of where it is */
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    for (let n = 1; n <= current.length; n++) {
      later(() => setTyped(current.slice(0, n)), LEAD_MS + n * TYPE_MS);
    }
    for (let n = current.length - 1; n >= 0; n--) {
      later(
        () => setTyped(current.slice(0, n)),
        typeFor + HOLD_MS + (current.length - n) * ERASE_MS
      );
    }
    later(() => setWhich((i) => (i + 1) % ROTATION.length), eraseFor + GAP_MS);

    return () => timers.forEach(clearTimeout);
  }, [which, reduce]);

  return (
    <div className={styles.box}>
      <span className="srOnly">{PROMPT}</span>
      <span className={styles.text} aria-hidden="true">
        {typed}
      </span>
    </div>
  );
}
