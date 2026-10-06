"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the visitor has asked their device to reduce motion.
 * Anything animated checks this and shows its final static state instead.
 *
 * It always starts as false so the first render matches the server's HTML,
 * then updates as soon as the page has loaded.
 */
export default function useReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduce(mq.matches);
    setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduce;
}