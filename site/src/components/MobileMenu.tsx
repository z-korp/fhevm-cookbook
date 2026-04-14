"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { REPO_URL } from "@/data/site";

const NAV_ITEMS = [
  { label: "Skills", href: "/skills" },
  { label: "Snippets", href: "/snippets" },
  { label: "About", href: "/about" },
  { label: "GitHub", href: REPO_URL, external: true },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const panel = mounted
    ? createPortal(
        <>
          {open && (
            <div
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
          )}

          <nav
            className={`fixed right-0 top-0 z-[60] flex h-full w-64 flex-col bg-white pt-5 shadow-xl transition-transform duration-250 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex justify-end px-4 pb-4">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-black/5"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-foreground">
                  <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <ul className="flex flex-col gap-1 px-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-md px-4 py-3 text-[13px] uppercase tracking-[0.2em] text-secondary transition-colors hover:bg-black/5 hover:text-foreground"
                    >
                      {item.label}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-40"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-4 py-3 text-[13px] uppercase tracking-[0.2em] text-secondary transition-colors hover:bg-black/5 hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </>,
        document.body,
      )
    : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative z-[70] flex size-9 items-center justify-center rounded-lg border border-border bg-white/60 backdrop-blur-sm transition-all hover:border-foreground/20 hover:bg-white"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-foreground transition-transform duration-200"
        >
          <path
            d={open ? "M3 3L13 13M13 3L3 13" : "M2 4h12M2 8h8M2 12h10"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {panel}
    </div>
  );
}
