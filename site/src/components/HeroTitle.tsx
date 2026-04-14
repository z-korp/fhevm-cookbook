"use client";

import { useRef } from "react";
import ScrambleText, { type ScrambleTextHandle } from "./ScrambleText";

/**
 * Hero headline with a ciphertext → plaintext decrypt animation.
 * Runs on mount and replays on hover.
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
      className="max-w-[13ch] text-[32px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:max-w-none sm:text-[42px] lg:text-[52px]"
    >
      <ScrambleText ref={line1} text="The FHEVM cookbook" />
      <br />
      <ScrambleText
        ref={line2}
        text="for privacy builders."
        className="text-secondary"
        delay={220}
      />
    </h1>
  );
}
