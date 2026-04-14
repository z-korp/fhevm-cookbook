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
      <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.18em] uppercase text-zama-yellow"
          >
            FHEVM Cookbook
          </Link>
          <span className="text-[10px] tracking-[0.12em] text-muted">
            by{' '}
            <a
              href="https://zkorp.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-secondary"
            >
              zKorp
            </a>
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-secondary sm:gap-5 sm:text-xs">
          {NAV_ITEMS.map((item) => (
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
            )
          ))}
        </nav>
      </div>
    </header>
  );
}
