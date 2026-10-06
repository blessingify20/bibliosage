import styles from "./AppPanel.module.css";

/* The centred card every signed-in screen uses, so /plan, /profile and
   /dashboard feel like one family with /signup and /login. */
export default function AppPanel({ eyebrow, title, lead, wide, children }) {
  return (
    <div className={styles.wrap}>
      <section
        className={`${styles.card}${wide ? ` ${styles.cardWide}` : ""}`}
        aria-labelledby="panel-title"
      >
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 id="panel-title" className={styles.title}>
          {title}
        </h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children}
      </section>
    </div>
  );
}