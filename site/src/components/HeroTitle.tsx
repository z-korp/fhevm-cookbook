"use client";

import { useRef } from "react";
import ScrambleText, { type ScrambleTextHandle } from "./ScrambleText";

/**
 * Hero headline with a ciphertext → plaintext decrypt animation. Runs on mount
 * and replays when the user hovers the title — "without the guesswork" only
 * after watching it resolve, for a beat.
 */
export default function HeroTitle() {
  const line1 = useRef<ScrambleTextHandle>(null);
  const line2 = useRef<ScrambleTextHandle>(null);

  const replay = () => {
    line1.current?.scramble();
    line2.current?.scramble();
  };

  return (
    <h1
      onMouseEnter={replay}
      className="whitespace-nowrap text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[36px] lg:text-[44px]"
    >
      <ScrambleText ref={line1} text="Confidential contracts." />
      <br />
      <ScrambleText
        ref={line2}
        text="Without the guesswork."
        className="text-secondary"
        delay={220}
      />
    </h1>
  );
}
