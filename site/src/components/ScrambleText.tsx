"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

// Hex cipher charset — reads as encoded bytes, and the characters share a
// similar visual weight so the text doesn't jitter too much during decrypt.
const CIPHER = "0123456789ABCDEF";

function randomCipherChar(): string {
  return CIPHER[Math.floor(Math.random() * CIPHER.length)];
}

export type ScrambleTextHandle = {
  scramble: () => void;
};

type Props = {
  text: string;
  className?: string;
  /** Total decrypt duration in ms. */
  duration?: number;
  /** Delay before the decrypt starts, in ms. */
  delay?: number;
  /** Auto-run on mount. */
  autoStart?: boolean;
};

/**
 * Renders text that decrypts from hex ciphertext into its final form.
 *
 * Each character is assigned a random reveal time within `duration`. Until its
 * reveal time, it shows a mutating hex char; after, it settles to the target.
 * Expose an imperative `scramble()` method so a parent can replay the effect
 * (e.g. on hover of the whole title).
 */
const ScrambleText = forwardRef<ScrambleTextHandle, Props>(function ScrambleText(
  { text, className, duration = 1100, delay = 0, autoStart = true },
  ref
) {
  // Start with the real text so SSR and first client paint agree — the scramble
  // kicks in inside useEffect, where a hydration mismatch would be invisible.
  const [display, setDisplay] = useState(text);
  const rafRef = useRef<number | null>(null);

  const run = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const chars = Array.from(text);
    const reveals = chars.map((c) => {
      if (c === " ") return 0;
      // Spread reveal times across the whole duration so some chars settle
      // early, others linger — gives the effect a natural decay.
      return Math.random() * duration;
    });
    const start = performance.now() + delay;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 0) {
        // Render a fully-scrambled frame during the delay window so the text
        // doesn't sit as plain text before the run starts.
        setDisplay(
          chars.map((c) => (c === " " ? " " : randomCipherChar())).join("")
        );
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      let done = true;
      let next = "";
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (c === " " || elapsed >= reveals[i]) {
          next += c;
        } else {
          next += randomCipherChar();
          done = false;
        }
      }
      setDisplay(next);
      if (done) {
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [text, duration, delay]);

  useImperativeHandle(ref, () => ({ scramble: run }), [run]);

  useEffect(() => {
    if (autoStart) run();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <span className={className}>{display}</span>;
});

export default ScrambleText;
