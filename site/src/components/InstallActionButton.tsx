"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CopyCommandButton from "@/components/CopyCommandButton";
import { FULL_PACK_COMMAND } from "@/data/install";

export default function InstallActionButton() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isInstallOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsInstallOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isInstallOpen]);

  if (isHome) {
    return (
      <a
        href="#install"
        className="inline-flex items-center rounded-full bg-foreground px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-on-dark transition-colors hover:bg-zama-yellow hover:text-foreground"
      >
        Skills install
      </a>
    );
  }

  const modal = mounted && isInstallOpen ? createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4 backdrop-blur-md sm:p-6"
      role="presentation"
      onClick={() => setIsInstallOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install skills"
        className="w-full max-w-[min(92vw,52rem)] rounded-3xl border border-foreground bg-foreground p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zama-yellow">
            Recommended / Default install
          </p>
          <button
            type="button"
            onClick={() => setIsInstallOpen(false)}
            className="rounded-full border border-zama-yellow bg-zama-yellow px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-zama-yellow-hover"
          >
            Close
          </button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <code className="min-w-0 flex-1 break-all font-mono text-[14px] leading-[1.55] text-on-dark sm:text-[15px]">
            {FULL_PACK_COMMAND}
          </code>
          <CopyCommandButton text={FULL_PACK_COMMAND} variant="yellow" />
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsInstallOpen(true)}
        className="inline-flex items-center rounded-full bg-foreground px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-on-dark transition-colors hover:bg-zama-yellow hover:text-foreground"
      >
        Skills install
      </button>
      {modal}
    </>
  );
}
