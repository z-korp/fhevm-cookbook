import Link from "next/link";
import { CONTENT_LAST_UPDATED_ISO, CONTENT_LAST_UPDATED_LABEL } from "@/data/content-last-updated";
import { REPO_URL } from "@/data/site";
import InstallActionButton from "@/components/InstallActionButton";

const NAV_ITEMS = [
  { label: "Skills", href: "/skills" },
  { label: "Snippets", href: "/snippets" },
  { label: "About", href: "/about" },
  { label: "GitHub", href: REPO_URL, external: true },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-header backdrop-blur-md">
      <div className="mx-auto flex max-w-[90rem] items-start justify-between gap-6 px-5 py-3 sm:items-center sm:px-6 lg:px-9">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block size-2.5 rounded-full bg-zama-yellow shadow-[0_0_0_4px_rgba(255,210,8,0.16)]"
            />
            <Link
              href="/"
              className="text-[14px] font-semibold uppercase tracking-[0.18em] text-foreground"
            >
              FHEVM Cookbook
            </Link>
            <span className="hidden text-[11px] tracking-[0.12em] text-muted sm:inline">
              by{" "}
              <a
                href="https://zkorp.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                zKorp
              </a>
            </span>
          </div>
          <p className="text-[11px] tracking-[0.16em] text-muted">
            Content updated{" "}
            <time dateTime={CONTENT_LAST_UPDATED_ISO}>{CONTENT_LAST_UPDATED_LABEL}</time>
          </p>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-7 text-[12px] uppercase tracking-[0.22em] text-secondary md:flex">
          {NAV_ITEMS.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <InstallActionButton />
      </div>
    </header>
  );
}
