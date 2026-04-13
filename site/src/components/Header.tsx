import Link from 'next/link';
import { REPO_URL } from '@/data/site';

const NAV_ITEMS = [
  { label: 'Skills', href: '/skills' },
  { label: 'Snippets', href: '/snippets' },
  { label: 'About', href: '/about' },
  { label: 'GitHub', href: REPO_URL, external: true },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-header backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-block size-2.5 rounded-full bg-zama-yellow shadow-[0_0_0_4px_rgba(255,210,8,0.16)]"
          />
          <Link
            href="/"
            className="text-[13px] font-semibold uppercase tracking-[0.18em] text-foreground"
          >
            FHEVM Cookbook
          </Link>
          <span className="hidden text-[10px] tracking-[0.12em] text-muted sm:inline">
            by{' '}
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

        <nav className="hidden flex-1 items-center justify-center gap-6 text-[11px] uppercase tracking-[0.22em] text-secondary md:flex">
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

        <a
          href="#install"
          className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-dark transition-colors hover:bg-zama-yellow hover:text-foreground"
        >
          Install
        </a>
      </div>
    </header>
  );
}
