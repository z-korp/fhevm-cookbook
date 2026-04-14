"use client";

import { useState } from "react";

export default function CopyCommandButton({ text }: { text: string }) {
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
      className="shrink-0 rounded-md border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary transition-colors hover:border-zama-yellow/40 hover:text-foreground"
      aria-label={copied ? "Copied command" : "Copy command"}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
