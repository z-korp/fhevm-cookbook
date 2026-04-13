"use client";

import { useState } from "react";

type Variant = "outline" | "yellow" | "dark";

const VARIANT_CLASSES: Record<Variant, string> = {
  outline:
    "border border-border text-secondary hover:border-foreground hover:text-foreground",
  yellow:
    "bg-zama-yellow text-foreground hover:bg-zama-yellow-hover",
  dark:
    "bg-foreground text-on-dark hover:bg-zama-yellow hover:text-foreground",
};

export default function CopyCommandButton({
  text,
  variant = "outline",
}: {
  text: string;
  variant?: Variant;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${VARIANT_CLASSES[variant]}`}
      aria-label={copied ? "Copied command" : "Copy command"}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
