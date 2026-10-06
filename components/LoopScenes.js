/**
 * Four small animated scenes, one per card in The Bibliosage Loop.
 *
 * Every scene is the same size and the same white line style. They all start
 * in their "before" state and move to their "after" state when `on` becomes
 * true, which happens when the section scrolls into view. The --d delay on
 * each part is what makes them play one after another.
 *
 * If the visitor has reduced motion on, `on` is true straight away, so the
 * finished picture is simply shown.
 */
import styles from "./LoopScenes.module.css";

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/* ---------- 1. Bring: a book, a note and a question float into the box ---------- */

export function BringScene({ on }) {
  return (
    <svg
      viewBox="0 0 120 72"
      className={styles.scene}
      aria-hidden="true"
      focusable="false"
    >
      {/* the input box they land in */}
      <rect x="20" y="34" width="80" height="26" rx="13" {...line} opacity=".6" />

      <g
        className={styles.floatItem}
        data-on={on}
        style={{ "--d": "0ms", "--fx": "-22px", "--fy": "-24px" }}
      >
        {/* a book */}
        <rect x="28" y="39" width="16" height="14" rx="2.5" {...line} />
        <path d="M36 39v14" {...line} />
        <path d="M31.4 43.6h2.6M31.4 47.6h2.6" {...line} opacity=".55" />
      </g>

      <g
        className={styles.floatItem}
        data-on={on}
        style={{ "--d": "360ms", "--fx": "0px", "--fy": "-26px" }}
      >
        {/* a note */}
        <rect x="52" y="38" width="12" height="16" rx="2.5" {...line} />
        <path d="M55 42.6h6M55 46.2h6M55 49.8h3.4" {...line} opacity=".55" />
      </g>

      <g
        className={styles.floatItem}
        data-on={on}
        style={{ "--d": "720ms", "--fx": "22px", "--fy": "-24px" }}
      >
        {/* a question mark */}
        <path
          d="M72 42.6c0-2.6 2-4.4 4.6-4.4s4.6 1.8 4.6 4.4c0 3.4-4.6 3.8-4.6 7"
          {...line}
        />
        <path d="M76.6 53.6v.2" {...line} strokeWidth="2.5" />
      </g>
    </svg>
  );
}

/* ---------- 2. Learn: lines of text appear, a lightbulb glows on ---------- */

export function LearnScene({ on }) {
  return (
    <svg
      viewBox="0 0 120 72"
      className={styles.scene}
      aria-hidden="true"
      focusable="false"
    >
      {/* warm glow behind the bulb */}
      <circle className={styles.glow} data-on={on} cx="95" cy="26" r="17" />

      {/* text lines, one at a time */}
      <rect
        className={styles.growW}
        data-on={on}
        style={{ "--d": "0ms" }}
        x="12"
        y="13"
        width="60"
        height="7"
        rx="3.5"
        {...line}
      />
      <rect
        className={styles.growW}
        data-on={on}
        style={{ "--d": "400ms" }}
        x="12"
        y="31"
        width="72"
        height="7"
        rx="3.5"
        {...line}
      />
      <rect
        className={styles.growW}
        data-on={on}
        style={{ "--d": "800ms" }}
        x="12"
        y="49"
        width="46"
        height="7"
        rx="3.5"
        {...line}
      />

      {/* the bulb itself */}
      <g className={styles.bulb} data-on={on} style={{ "--d": "1000ms" }}>
        <path
          d="M90 22a9 9 0 0 0-5.4 16.3c.9.7 1.4 1.7 1.4 2.8v.4h8v-.4c0-1.1.5-2.1 1.4-2.8A9 9 0 0 0 90 22z"
          {...line}
        />
        <path d="M86.8 45.5h6.4M87.8 49.5h4.4" {...line} opacity=".7" />
      </g>
    </svg>
  );
}

/* ---------- 3. Prove: a question appears, then a tick draws itself ---------- */

export function ProveScene({ on }) {
  return (
    <svg
      viewBox="0 0 120 72"
      className={styles.scene}
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.floatItem} data-on={on} style={{ "--d": "0ms" }}>
        <rect x="12" y="10" width="80" height="24" rx="12" {...line} opacity=".75" />
        <path d="M26 18h34M26 26h20" {...line} opacity=".45" />
      </g>

      <g
        className={styles.floatItem}
        data-on={on}
        style={{ "--d": "560ms", "--fx": "0px", "--fy": "18px" }}
      >
        <path
          d="M48 50c0-3.4 2.5-5.7 6-5.7s6 2.3 6 5.7c0 4.4-6 5-6 8.8"
          {...line}
        />
        <path d="M54 63.6v.2" {...line} strokeWidth="2.5" />
      </g>

      <circle
        className={styles.ring}
        data-on={on}
        style={{ "--d": "780ms" }}
        cx="92"
        cy="49"
        r="16"
        {...line}
        opacity=".5"
      />
      <path
        className={styles.tick}
        data-on={on}
        style={{ "--d": "900ms" }}
        pathLength="1"
        d="M85 49.5l5.4 5.4L100 42.6"
        {...line}
        strokeWidth="2.6"
      />
    </svg>
  );
}

/* ---------- 4. Apply: the sprout grows, three actions tick off ---------- */

export function ApplyScene({ on }) {
  return (
    <svg
      viewBox="0 0 120 72"
      className={styles.scene}
      aria-hidden="true"
      focusable="false"
    >
      {/* the sprout, growing */}
      <g className={styles.miniSprout} data-on={on}>
        <path d="M22 64c3.6 2.4 13.4 2.4 17 0" {...line} opacity=".55" />
        <path d="M30.5 63c-.5-6-.4-12 .3-17.8" {...line} />
        <g className="sproutLeaf" data-on={on} data-origin="right" style={{ "--d": "220ms" }}>
          <path
            d="M30.6 59.4c-5 .5-9.3-2.3-9.7-7 5.3-.3 9.6 2.3 9.7 7z"
            {...line}
          />
        </g>
        <g className="sproutLeaf" data-on={on} data-origin="left" style={{ "--d": "560ms" }}>
          <path
            d="M30.6 55.2c5 .5 9.3-2.3 9.7-7-5.3-.3-9.6 2.3-9.7 7z"
            {...line}
          />
        </g>
        <path
          className="sproutLeaf"
          data-on={on}
          data-origin="right"
          style={{ "--d": "900ms" }}
          d="M30.7 49.6c-3.6.3-6.7-1.6-7-5 3.8-.2 6.9 1.5 7 5z"
          {...line}
        />
        <path d="M30.9 43.4c-2 .1-3.7-.9-3.8-2.8 2-.1 3.7.9 3.8 2.8z" {...line} />
      </g>

      {/* three action lines, each ticking off one by one */}
      {[0, 1, 2].map((i) => (
        <g
          key={i}
          className={styles.floatItem}
          data-on={on}
          style={{ "--d": `${1000 + i * 460}ms`, "--fx": "10px", "--fy": "0px" }}
        >
          <rect
            x="62"
            y={14 + i * 17}
            width="50"
            height="8"
            rx="4"
            {...line}
            opacity=".4"
          />
          <path
            className={styles.tick}
            data-on={on}
            style={{ "--d": `${1180 + i * 460}ms` }}
            pathLength="1"
            d={`M53 ${15.4 + i * 17}l3.6 3.6L63 ${10 + i * 17}`}
            {...line}
            strokeWidth="2.4"
          />
        </g>
      ))}
    </svg>
  );
}
