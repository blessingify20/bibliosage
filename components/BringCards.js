"use client";

/**
 * The "Bring anything" cards.
 *
 * Only one card shows at a time. Every few seconds it slides out to the left,
 * tilting and fading as it goes, while the next card slides in from the right,
 * so it feels like turning a page. It keeps looping.
 *
 * People can move it along themselves: tap a dot, or swipe it on a phone.
 * Hovering or holding a finger pauses the timer, and nothing moves until the
 * cards scroll into view.
 *
 * If the visitor has reduced motion on, the five cards are simply laid out as
 * a plain grid.
 *
 * The icons are named in the page copy, then looked up here, because a
 * component cannot be handed from a server page to a client one.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import useReducedMotion from "./useReducedMotion";
import {
  IconBooks,
  IconNotes,
  IconCourses,
  IconStories,
  IconQuestions,
} from "./Illustrations";
import styles from "./BringCards.module.css";

const ICONS = {
  books: IconBooks,
  notes: IconNotes,
  courses: IconCourses,
  stories: IconStories,
  questions: IconQuestions,
};

const HOLD_MS = 4200; /* how long a card rests before the next one comes */
const SWIPE_PX = 45; /* how far a finger has to travel to count as a swipe */

export default function BringCards({ items }) {
  const reduce = useReducedMotion();

  const boxRef = useRef(null);
  const touchFrom = useRef(null);

  const [top, setTop] = useState(0); /* which card is showing */
  const [onScreen, setOnScreen] = useState(false);
  const [held, setHeld] = useState(false); /* a finger or mouse is on it */

  const count = items.length;
  const running = onScreen && !reduce && !held;

  /* only turn the pages while the cards are actually on screen */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const seen = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.3 }
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  /* move to a card, counting round the loop in both directions */
  const go = useCallback(
    (to) => setTop(((to % count) + count) % count),
    [count]
  );

  /* the timer that keeps the cards turning */
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => go(top + 1), HOLD_MS);
    return () => clearTimeout(timer);
  }, [running, top, go]);

  /* a finger swipe: left goes forward, right goes back */
  const onPointerDown = (event) => {
    touchFrom.current = event.clientX;
  };

  const onPointerUp = (event) => {
    const from = touchFrom.current;
    touchFrom.current = null;
    if (from === null || event.pointerType !== "touch") return;
    const moved = event.clientX - from;
    if (Math.abs(moved) < SWIPE_PX) return;
    go(top + (moved < 0 ? 1 : -1));
  };

  /* where each card sits, counted from the one showing: 0 is showing,
     1 and 2 are waiting on the right, 3 and 4 have already gone left */
  const place = (i) => {
    const d = (i - top + count) % count;
    return d === 0 ? "current" : d <= 2 ? "ahead" : "behind";
  };

  return (
    <div className={styles.box} ref={boxRef}>
      <ul
        className={styles.stage}
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          touchFrom.current = null;
          setHeld(false);
        }}
      >
        {items.map((item, i) => {
          const Icon = ICONS[item.icon];
          const pos = place(i);

          return (
            <li
              key={item.key}
              className={styles.card}
              data-pos={pos}
              /* while the pages are turning, only the card on top is read out;
                 with reduced motion every card is showing, so all stay readable */
              aria-hidden={reduce || pos === "current" ? undefined : "true"}
            >
              <span className={styles.icon}>
                <Icon size={27} />
              </span>
              <p>
                <strong>{item.label}</strong> {item.text}
              </p>
            </li>
          );
        })}
      </ul>

      <div className={styles.dots}>
        {items.map((item, i) => (
          <button
            key={item.key}
            type="button"
            className={styles.dot}
            data-on={i === top}
            aria-current={i === top}
            aria-label={`Show card ${i + 1} of ${count}: ${item.label}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
