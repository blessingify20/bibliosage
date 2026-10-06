import Link from "next/link";
import styles from "./page.module.css";
import HeroSearch from "@/components/HeroSearch";
import BringCards from "@/components/BringCards";
import LoopShowcase from "@/components/LoopShowcase";
import SessionWalkthrough from "@/components/SessionWalkthrough";
import Faq from "@/components/Faq";
import {
  Sprout,
  Sprig,
  LeafShape,
  Sparkle,
  IconForgotBook,
  IconWentNowhere,
  IconPassedForgot,
  IconDidntStick,
  Tick,
} from "@/components/Illustrations";

const START = "Start Learning →";

/* ---------- Section 1: Hero ---------- */

function Hero() {
  return (
    <section className={styles.hero}>
      {/* leaves drifting slowly in the background */}
      <LeafShape className={`deco ${styles.driftA}`} size={300} />
      <LeafShape className={`deco ${styles.driftB}`} size={120} />
      <LeafShape className={`deco ${styles.driftC}`} size={150} />

      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <h1 data-reveal>
            You&apos;ve read the books. Now let them{" "}
            <span className="underline">
              change you
              <svg viewBox="0 0 300 24" preserveAspectRatio="none">
                <path
                  pathLength="1"
                  d="M3 16 C 55 4, 110 14, 175 8 C 220 3, 265 12, 297 6"
                  stroke="var(--gold)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
            .
          </h1>

          <p className={styles.lead} data-reveal>
            Reading is just one part of the job. Bibliosage helps you understand
            what you read, think it through, and use it in your life.
          </p>

          <div className={styles.searchRow} data-reveal>
            <HeroSearch />
            <Link href="/signup" className="btn">
              {START}
            </Link>
          </div>
        </div>

        <div className={styles.heroPanel} data-reveal>
          <LeafShape className={styles.panelLeaf} size={190} />
          <p>Understand.</p>
          <p>Think.</p>
          <p>Apply.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 2: Sound familiar? ---------- */

const FAMILIAR = [
  {
    icon: IconForgotBook,
    text: "You finish a book, and a month later you can't remember what it said.",
  },
  {
    icon: IconWentNowhere,
    text: "You understood it while reading, but nothing in your life changed.",
  },
  {
    icon: IconPassedForgot,
    text: "You studied hard, passed the exam, and forgot everything.",
  },
  {
    icon: IconDidntStick,
    text: "You've tried highlighting, note-taking and re-reading, and it still doesn't stick.",
  },
];

function SoundFamiliar() {
  return (
    <section className="section">
      <div className="container">
        <div className="sectionHead">
          <h2 data-reveal>Sound familiar?</h2>
        </div>

        <ul className={styles.familiarList}>
          {FAMILIAR.map(({ icon: Icon, text }, i) => (
            <li
              key={text}
              className={`card lift ${styles.familiarCard}`}
              data-reveal
              data-memory={i === 0 ? "true" : undefined}
              style={{ "--i": i }}
            >
              <span className={styles.cardIcon}>
                <Icon size={26} />
              </span>
              <p>{text}</p>
            </li>
          ))}
        </ul>

        <div className={styles.familiarClose} data-reveal>
          <p>
            The problem was never that you don&apos;t read enough. You just
            don&apos;t know how to turn it into something you use.
          </p>
          <Sprout leaves={1} size={40} className={styles.closeSprout} />
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 3: The Shift ---------- */

const BRING = [
  { key: "books", icon: "books", label: "Books", text: "A book you're reading." },
  { key: "notes", icon: "notes", label: "Notes", text: "Your own notes or a passage." },
  {
    key: "courses",
    icon: "courses",
    label: "Courses",
    text: "A course you're trying to understand.",
  },
  {
    key: "stories",
    icon: "stories",
    label: "Stories",
    text: "A story you can't stop thinking about.",
  },
  {
    key: "questions",
    icon: "questions",
    label: "Questions",
    text: "A question you've been carrying around.",
  },
];

function Shift() {
  return (
    <section className={`section tint`}>
      <LeafShape className={`deco ${styles.decoShift}`} size={250} />

      <div className={`container ${styles.shiftGrid}`}>
        <div className={styles.shiftText}>
          <h2 data-reveal>What if learning didn&apos;t stop at understanding?</h2>
          <p className={styles.shiftCopy} data-reveal>
            With Bibliosage, you don&apos;t just move on after you&apos;ve
            understood something. You sit with it. Think about it. Look at it
            differently. Connect it to your life. See what you can do with it.
            Because sometimes, the best part of learning begins after
            you&apos;ve understood the words.
          </p>

          <p className={styles.bringNote} data-reveal>
            Bring it to Bibliosage. We&apos;ll help you slow down, make sense of
            it, and see where it connects to you.
          </p>
        </div>

        <div className={styles.shiftCards}>
          <h3 className={styles.subhead} data-reveal>
            Bring anything.
          </h3>

          <div data-reveal>
            <BringCards items={BRING} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 4: The Bibliosage Loop (the only dark section) ---------- */

const LOOP = [
  {
    key: "bring",
    icon: "bring",
    scene: "bring",
    label: "1. Bring",
    text: "Paste what you're studying, or type a topic you want to understand.",
  },
  {
    key: "learn",
    icon: "learn",
    scene: "learn",
    label: "2. Learn",
    text: "Go through it piece by piece, with simple words and everyday comparisons, until it clicks.",
  },
  {
    key: "prove",
    icon: "prove",
    scene: "prove",
    label: "3. Prove",
    text: "Answer a few questions to be sure you really get it.",
  },
  {
    key: "apply",
    icon: "apply",
    scene: "apply",
    label: "4. Apply",
    text: "Leave with 3 to 5 small actions made for your life, saved so you can come back to them.",
  },
];

/* one free photograph behind each card, in the same order as the cards */

const LOOP_PHOTOS = [
  { key: "bring", src: "/images/loop/bring.jpg" },
  { key: "learn", src: "/images/loop/learn.jpg" },
  { key: "prove", src: "/images/loop/prove.jpg" },
  { key: "apply", src: "/images/loop/apply.jpg" },
];

function Loop() {
  return (
    <section id="how-it-works" className={`section dark ${styles.loop}`}>
      <LeafShape className={`deco ${styles.decoLoop}`} size={280} />

      <div className="container">
        <div className="sectionHead sectionHead--center">
          <h2 data-reveal>The Bibliosage Loop</h2>
        </div>
      </div>

      <LoopShowcase items={LOOP} photos={LOOP_PHOTOS} />
    </section>
  );
}

/* ---------- Section 5: See how a session feels ---------- */

function SessionFeel() {
  return (
    <section className={`section tint`}>
      <div className="container">
        <div className="sectionHead sectionHead--center">
          <h2 data-reveal>See how a session feels.</h2>
        </div>

        <div data-reveal>
          <SessionWalkthrough />
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 6: Why I built this ---------- */

function Why() {
  return (
    <section className={`section tint`}>
      <div className={`container ${styles.whyGrid}`}>
        <div>
          <div className="sectionHead">
            <h2 data-reveal>Why I built this</h2>
          </div>
          <div className={styles.whyCopy} data-reveal>
            <p>For many of us, learning looks like this:</p>
            <p className={styles.cycle}>
              <span>Read.</span> <span>Cram.</span> <span>Pass.</span>{" "}
              <span>Forget.</span>
            </p>
            <p>
              I know that cycle too well. I could read a book again and again,
              feel inspired, and months later my life looked almost the same.
            </p>
            <p>
              The problem wasn&apos;t that I couldn&apos;t read. I couldn&apos;t
              always turn what I read into something I understood, remembered,
              and used.
            </p>
            <p>
              So I&apos;m building Bibliosage, to help us go from cramming to
              learning, from reading to understanding, and from understanding to
              doing.
            </p>
            <p className={styles.signature}>— Blessing, Founder</p>
          </div>
        </div>

        <aside className={`card ${styles.pullQuote}`} data-reveal>
          <Sprig size={104} className={styles.sprig} />
          <p>
            Reading changes you only when you{" "}
            <span className={styles.quoteAccent}>use it</span>.
          </p>
        </aside>
      </div>
    </section>
  );
}

/* ---------- Section 7: Pricing ---------- */

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "₦0",
    badge: null,
    button: "Start free →",
    features: [
      "10 learning sessions every month",
      "Paste your own material or explore any topic",
      "Step-by-step explanations and understanding checks",
      "3 to 5 personal actions every session",
      "Your last 3 sessions saved",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    price: "₦3,000",
    badge: "Most popular",
    button: "Get Plus →",
    features: [
      "Everything in Free",
      "30 learning sessions every month",
      "All your sessions saved in one place",
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="container">
        <div className="sectionHead sectionHead--center">
          <h2 data-reveal>Start free. Upgrade when you&apos;re ready.</h2>
        </div>

        <div className={styles.priceGrid}>
          {PLANS.map((plan, cardIndex) => (
            <div
              key={plan.key}
              className={`card ${styles.priceCard}`}
              data-reveal
              style={{ "--i": cardIndex }}
            >
              <div className={styles.planTop}>
                <p className={styles.planName}>{plan.name}</p>
                {plan.badge ? (
                  <p className={styles.badge}>{plan.badge}</p>
                ) : null}
              </div>

              <p className={styles.planPrice}>
                <span>{plan.price}</span> / month
              </p>
              <hr className="dashRule" />
              <ul className={styles.featureList}>
                {plan.features.map((item, i) => (
                  <li key={item} data-reveal style={{ "--i": i }}>
                    <span className={styles.check}>
                      <Tick size={16} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`btn ${styles.priceBtn}`}>
                {plan.button}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 8: FAQ ---------- */

const FAQ = [
  {
    q: "Is this just another book summary tool?",
    a: "No. A summary tells you what a book says. Bibliosage helps you understand it, check that you've understood it, and decide what to do with it.",
  },
  {
    q: "Do I need to have the book?",
    a: "No. Bring the part you're reading, your own notes, or just type a topic you want to understand.",
  },
  {
    q: "Does it work for fiction and school work?",
    a: "Yes. Stories, textbooks, courses, and big questions all work. Anything you want to understand and think about more deeply.",
  },
  {
    q: "Is my information private?",
    a: "Yes. Your profile and your sessions belong to you. We don't show them to other users.",
  },
  {
    q: "Is the AI always right?",
    a: "No AI is. When you paste something, Bibliosage works from what you gave it. When it explains a topic on its own, it tells you so. Always double-check book titles and important facts. Bibliosage is learning support, not medical, legal or financial advice.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className={`section tint`}>
      <LeafShape className={`deco ${styles.decoFaq}`} size={220} />

      <div className="container">
        <div className="sectionHead">
          <h2 data-reveal>Questions, answered.</h2>
        </div>

        <div data-reveal>
          <Faq items={FAQ} />
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 9: Final CTA ---------- */

function FinalCta() {
  return (
    <section className={`section ${styles.cta}`}>
      <Sprout leaves={2} size={52} className={styles.ctaSprout} />
      <Sparkle className={`deco ${styles.ctaSparkle}`} size={18} />

      <div className="container">
        <h2 data-reveal>
          Your next book could be the one that changes something.
        </h2>
        <p data-reveal>
          Bring whatever you&apos;re learning. We&apos;ll help you make it
          stick, and make it yours.
        </p>
        <div data-reveal>
          <Link href="/signup" className="btn">
            {START}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */

export default function Home() {
  return (
    <>
      <Hero />
      <SoundFamiliar />
      <Shift />
      <Loop />
      <SessionFeel />
      <Why />
      <Pricing />
      <FaqSection />
      <FinalCta />
    </>
  );
}
