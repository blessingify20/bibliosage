"use client";

/**
 * The Bibliosage Loop: the card deck, and the photographs behind it.
 *
 * Each card has its own photograph. When the card on top changes, the photo
 * behind the whole section crossfades to the next one, so the background and
 * the card always match. The photographs sit under a deep forest tint, which
 * keeps the white text easy to read.
 *
 * With reduced motion on there is nothing to crossfade, so the first photo is
 * simply left showing.
 *
 * The first photo is loaded straight away, because it is the one on screen as
 * soon as the section arrives. The other three are fetched only if the visitor
 * stays long enough to reach them.
 */
import Image from "next/image";
import { useState } from "react";
import CardDeck from "./CardDeck";
import useReducedMotion from "./useReducedMotion";
import styles from "./LoopShowcase.module.css";

export default function LoopShowcase({ items, photos }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const active = reduce ? 0 : shown;

  return (
    <>
      <div className={styles.backdrop} aria-hidden="true">
        {photos.map((photo, i) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt=""
            fill
            sizes="100vw"
            priority={i === 0}
            className={styles.photo}
            data-on={i === active}
          />
        ))}
        <span className={styles.tint} />
      </div>

      <div className="container">
        <div data-reveal>
          <CardDeck items={items} onChange={setShown} />
        </div>
      </div>
    </>
  );
}
