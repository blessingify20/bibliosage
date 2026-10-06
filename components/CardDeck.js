"use client";

/**
 * A deck of cards for The Bibliosage Loop.
 *
 * Only one card is fully visible at a time: the rest sit behind it, a little
 * lower and a little smaller, like a pack of cards on a table. The top card
 * waits about four seconds, then slides away sideways and fades, and the next
 * one comes forward. It keeps looping.
 *
 * People can move it along themselves too: tap a dot, click the deck, or
 * swipe it on a phone. Hovering or holding a finger pauses the timer.
 *
 * Nothing moves until the deck scrolls into view, and if the visitor has
 * reduced motion on, the cards are simply laid out as a plain grid.
 *
 * `onChange` is told which card is on top, which is how the photographs
 * behind the deck keep in step with it.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import useReducedMotion from "./useReducedMotion";
import {
  IconBring,
  IconLearn,
  IconProve,
  IconApply,
} from "./Illustrations";
import { BringScene, LearnScene, ProveScene, ApplyScene } from "./LoopScenes";
import styles from "./CardDeck.module.css";

/* the icons are named in the page copy, then looked up here, because a
   component cannot be handed from a server page to a client one */
const ICONS = {
  bring: IconBring,
  learn: IconLearn,
  prove: IconProve,
  apply: IconApply,
};

const SCENES = {
  bring: BringScene,
  learn: LearnScene,
  prove: ProveScene,
  apply: ApplyScene,
};

const HOLD_MS = 4000; /* how long the top card rests before it moves on */
const SLIDE_MS = 700; /* how long the slide away takes */
const SWIPE_PX = 45; /* how far a finger has to travel to count as a swipe */

export default function CardDeck({ items, onChange }) {
  const reduce = useReducedMotion();

  const deckRef = useRef(null);
  const touchFrom = useRef(null);

  const [top, setTop] = useState(0); /* which card is on top */
  const [leaving, setLeaving] = useState(null); /* the one sliding away */
  const [onScreen, setOnScreen] = useState(false);
  const [held, setHeld] = useState(false); /* a finger or mouse is on it */

  const count = items.length;
  const running = onScreen && !reduce && !held;

  /* only play while the deck is actually on screen */
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const seen = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.25 }
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  /* tell the page which card is showing, so the background can follow it */
  useEffect(() => {
    if (onChange) onChange(top);
  }, [top, onChange]);

  /* slide the front card away and bring another one forward.
     Called with no argument it moves on, with a number it jumps there. */
  const step = useCallback(
    (to) => {
      const wanted = to === undefined ? top + 1 : to;
      const next = ((wanted % count) + count) % count;
      setLeaving(next === top ? null : top);
      setTop(next);
    },
    [top, count]
  );

  /* once the card that slid away is out of sight, park it silently behind
     the deck, so it can rise to the front again later without flying back in */
  useEffect(() => {
    if (leaving === null) return;
    const timer = setTimeout(() => setLeaving(null), SLIDE_MS + 80);
    return () => clearTimeout(timer);
  }, [leaving]);

  /* the timer that keeps the deck moving */
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => step(), HOLD_MS);
    return () => clearTimeout(timer);
  }, [running, top, step]);

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
    step(moved < 0 ? top + 1 : top - 1);
  };

  /* how far back in the pack each card sits, and what it is doing */
  const place = (i) => {
    const depth = (i - top + count) % count;
    if (i === leaving) return { state: "leaving", depth, z: 20 };
    if (depth === 0) return { state: "top", depth, z: 10 };
    if (depth === count - 1) return { state: "gone", depth, z: 9 - depth };
    return { state: "stacked", depth, z: 9 - depth };
  };

  return (
    <div className={styles.deck} ref={deckRef}>
      <ul
        className={styles.stage}
        onClick={() => step()}
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
          const { state, depth, z } = place(i);
          const Icon = ICONS[item.icon];
          const Scene = SCENES[item.scene];

          return (
            <li
              key={item.key}
              className={styles.card}
              data-state={state}
              style={{ "--d": depth, zIndex: z }}
              /* while the deck is moving, only the card on top is read out;
                 with reduced motion every card is showing, so all stay readable */
              aria-hidden={
                reduce || state === "top" ? undefined : "true"
              }
            >
              <span className={styles.icon}>
                <Icon size={27} />
              </span>
              <h3>{item.label}</h3>
              <p>{item.text}</p>
              {Scene ? (
                <div className={styles.sceneBox}>
                  <Scene on={reduce ? true : state === "top" && onScreen} />
                </div>
              ) : null}
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
            onClick={() => step(i)}
          />
        ))}
      </div>
    </div>
  );
}
