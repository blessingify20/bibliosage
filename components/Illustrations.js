/**
 * Bibliosage illustrations
 * ------------------------
 * One hand-drawn line-art style used across the whole page.
 * Everything is inline SVG (no image files, nothing to download).
 *
 * Two rules to keep the style consistent:
 *  1. stroke="currentColor" - an icon always matches the text colour around it
 *  2. wobbly paths with round line caps, so it reads as drawn, not stamped
 */

function Line({ children, size = 26, viewBox = "0 0 24 24", ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* =========================================================
   The mascot: a small friendly sprout
   `leaves={1}` is a young sprout, `leaves={2}` has grown a new leaf.
   ========================================================= */

/**
 * The mascot: a small friendly sprout.
 *
 * `leaves` is 0, 1, 2 or 3. Every extra leaf grows in smoothly, so passing a
 * higher number literally grows the plant. Each leaf is drawn with the same
 * wobbly line style as the rest of the page.
 */
export function Sprout({ leaves = 1, size = 48, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {/* soil */}
      <path d="M12.5 41.6c5 3.4 18 3.4 23 0" opacity=".55" />
      {/* stem */}
      <path d="M24 40.5c-.7-6.6-.6-13.2.4-19.9" />

      {/* leaves, lowest and widest first */}
      <g className="sproutLeaf" data-on={leaves > 0} data-origin="right">
        <path d="M24.2 36.2c-6.8.7-12.6-3.2-13.1-9.4 7.2-.4 13 3.2 13.1 9.4z" />
      </g>
      <g className="sproutLeaf" data-on={leaves > 1} data-origin="left">
        <path d="M24.2 31c6.8.7 12.6-3.2 13.1-9.4-7.2-.4-13 3.2-13.1 9.4z" />
      </g>
      <g className="sproutLeaf" data-on={leaves > 2} data-origin="right">
        <path d="M24.3 25.8c-5.6.6-10.4-2.6-10.8-7.8 6-.3 10.8 2.6 10.8 7.8z" />
      </g>

      {/* head */}
      <path d="M24.4 20.6c-3.3 0-5.5-2-5.5-4.8 0-2.9 2.4-5.1 5.7-5.1 3.3 0 5.7 2.2 5.7 5.1 0 2.8-2.4 4.8-5.9 4.8z" />
      {/* eyes */}
      <path d="M22.1 15.2v.6M26.9 15.2v.6" strokeWidth="2.1" />
      {/* smile */}
      <path d="M22.7 17.6c.6 1 2.2 1 2.8 0" />
    </svg>
  );
}

/* a small branch with three leaves, for the founder card */
export function Sprig({ size = 92, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size * 0.55}
      viewBox="0 0 100 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path d="M6 50c22-4 38-16 46-34" />
      <path d="M52 16c-.4-6 3-10.6 8.6-11.6 1 6-2.6 10.8-8.6 11.6z" />
      <path d="M44 24c-6.6-1.4-9.8-6.4-8.4-11.8 6.4 1.2 9.8 6.2 8.4 11.8z" />
      <path d="M32 34c-6.8-1-10.4-5.8-9.2-11.2 6.6.8 10.4 5.6 9.2 11.2z" />
      <path d="M18 44c-6-1.6-9-6.4-7.4-11.4 6 1.4 9 6.2 7.4 11.4z" />
    </svg>
  );
}

/* big soft leaf, used as a shape in section corners */
export function LeafShape({ size = 240, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path d="M8 92C6 54 26 20 92 8c4 52-22 78-84 84z" />
      <path d="M8 92C26 68 44 44 84 12" />
      <path d="M28 70c6-1 11-3 15-7M44 52c6-1 11-3 15-7" opacity=".7" />
    </svg>
  );
}

/* four-point sparkle */
export function Sparkle({ size = 22, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path d="M12 3c.9 5.2 2.8 7.1 8 8-5.2.9-7.1 2.8-8 8-.9-5.2-2.8-7.1-8-8 5.2-.9 7.1-2.8 8-8z" />
    </svg>
  );
}

/* =========================================================
   Section: Sound familiar?
   ========================================================= */

export const IconForgotBook = (p) => (
  <Line {...p}>
    <path d="M3.4 6.2c2.8-1.4 5.6-1.4 8.6.4v13c-3-1.8-5.8-1.8-8.6-.4z" />
    <path d="M20.6 6.2c-2.8-1.4-5.6-1.4-8.6.4v13c3-1.8 5.8-1.8 8.6-.4z" />
    <path d="M6 10.4c1.4-.4 2.6-.3 3.8.2M14 12.8c1.4.3 2.8.2 4-.4" opacity=".65" />
  </Line>
);

export const IconWentNowhere = (p) => (
  <Line {...p}>
    <path d="M20.4 13.8a8.4 8.4 0 1 1-2.5-5.9" />
    <path d="M18.6 3.6l.2 4.6-4.4-.7" />
    <path d="M4 19.4h6" opacity=".6" strokeDasharray="2.4 2.6" />
  </Line>
);

export const IconPassedForgot = (p) => (
  <Line {...p}>
    <path d="M6 3.6h7.4L18 8.2V20a.8.8 0 0 1-.8.8H6a.8.8 0 0 1-.8-.8V4.4a.8.8 0 0 1 .8-.8z" />
    <path d="M13.2 3.8v4.4H18" />
    <path d="M7.4 14.4l2.2 2.2 4-4.4" />
    <path d="M15.6 17.6h1.6" strokeDasharray="2.2 2.4" opacity=".6" />
  </Line>
);

export const IconDidntStick = (p) => (
  <Line {...p}>
    <path d="M14.4 3.6l6 6-7.6 7.6-3-3-3-3z" />
    <path d="M10.8 11.2L6 16a2.4 2.4 0 0 0 3.4 3.4l4.8-4.8" />
    <path d="M4.6 21.4c2.6.8 5 .6 7-.6" opacity=".6" strokeDasharray="2.2 2.6" />
  </Line>
);

/* =========================================================
   Section: Bring anything.
   ========================================================= */

export const IconBooks = (p) => (
  <Line {...p}>
    <path d="M3.6 5.6c2.9-1.3 5.7-1.2 8.4.5v13c-2.7-1.7-5.5-1.8-8.4-.5z" />
    <path d="M20.4 5.6c-2.9-1.3-5.7-1.2-8.4.5v13c2.7-1.7 5.5-1.8 8.4-.5z" />
  </Line>
);

export const IconNotes = (p) => (
  <Line {...p}>
    <path d="M6 3.8h8.6L18.4 7.6V20a.8.8 0 0 1-.8.8H6a.8.8 0 0 1-.8-.8V4.6a.8.8 0 0 1 .8-.8z" />
    <path d="M14.4 4v3.6h3.8" />
    <path d="M8 12.4h7M8 16h4.6" />
  </Line>
);

export const IconCourses = (p) => (
  <Line {...p}>
    <rect x="3.2" y="4.4" width="17.6" height="13" rx="2.2" />
    <path d="M10.4 8.8l4.4 2.6-4.4 2.6z" />
    <path d="M8.4 20.4h7.2" />
  </Line>
);

export const IconStories = (p) => (
  <Line {...p}>
    <path d="M6.6 4.2h10.8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7.6L5.2 20v-3.2a1 1 0 0 1-.6-1V6.2a2 2 0 0 1 2-2z" />
    <path d="M9 8.6h6M9 11.8h3.8" />
  </Line>
);

export const IconQuestions = (p) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M9.8 9.7a2.4 2.4 0 1 1 3.1 2.3c-.6.2-.9.7-.9 1.3v.4" />
    <path d="M12 16.7h.1" strokeWidth="2.1" />
  </Line>
);

/* =========================================================
   Section: The Bibliosage Loop (drawn in white on dark)
   ========================================================= */

export const IconBring = (p) => (
  <Line {...p}>
    <path d="M12 3.6v10.2" />
    <path d="M8.6 10.4L12 13.8l3.4-3.4" />
    <path d="M4.4 15.2v3a2 2 0 0 0 2 2h11.2a2 2 0 0 0 2-2v-3" />
  </Line>
);

export const IconLearn = (p) => (
  <Line {...p}>
    <path d="M12 6.2c-2-1.4-4.2-2-6.6-1.9v13c2.4-.1 4.6.5 6.6 1.9" />
    <path d="M12 6.2c2-1.4 4.2-2 6.6-1.9v13c-2.4-.1-4.6.5-6.6 1.9" />
    <path d="M12 6.2v13" opacity=".55" />
  </Line>
);

export const IconProve = (p) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M8.3 12.3l2.6 2.6 4.9-5.4" />
  </Line>
);

export const IconApply = (p) => (
  <Line {...p}>
    <path d="M6 20.4V4.2h12l-3 4 3 4H6" />
    <path d="M9.4 16.4h5" opacity=".6" strokeDasharray="2.2 2.6" />
  </Line>
);

/* =========================================================
   Pricing
   ========================================================= */

/**
 * The check mark in the pricing list. It draws itself once the list item
 * scrolls into view (see the .tickDraw rule in globals.css).
 */
export function Tick({ size = 16, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path className="tickDraw" pathLength="1" d="M4.6 12.6l4.4 4.4L19.4 6.4" />
    </svg>
  );
}
