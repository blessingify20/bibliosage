"use client";

/**
 * The questions-and-answers accordion.
 *
 * The answer is wrapped in a grid row that grows from 0 to full height, which
 * is what makes the open and close smooth. Only one answer is open at a time.
 *
 * With reduced motion on, the transition is turned off in the CSS.
 */
import { useState } from "react";
import styles from "./Faq.module.css";

export default function Faq({ items }) {
  const [open, setOpen] = useState(null);

  return (
    <div className={styles.list}>
      {items.map(({ q, a }, i) => (
        <div key={q} className={`card ${styles.item}`} data-open={open === i}>
          <button
            type="button"
            className={styles.trigger}
            aria-expanded={open === i}
            aria-controls={`faq-answer-${i}`}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{q}</span>
            <span className={styles.icon} aria-hidden="true" />
          </button>

          <div className={styles.answerWrap} id={`faq-answer-${i}`}>
            <div className={styles.answer}>
              <p>{a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
