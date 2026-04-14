import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSnippetMetas } from "@/data/snippets";

export const metadata: Metadata = {
  title: "Snippets | FHEVM Cookbook",
  description:
    "Short, copyable recipes for common FHEVM tasks. Each article answers one question with prose and paste-ready code.",
};

const ASCII_SNIPPETS = `███████╗███╗   ██╗██╗██████╗ ██████╗ ███████╗████████╗███████╗
██╔════╝████╗  ██║██║██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝
███████╗██╔██╗ ██║██║██████╔╝██████╔╝█████╗     ██║   ███████╗
╚════██║██║╚██╗██║██║██╔═══╝ ██╔═══╝ ██╔══╝     ██║   ╚════██║
███████║██║ ╚████║██║██║     ██║     ███████╗   ██║   ███████║
╚══════╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝     ╚══════╝   ╚═╝   ╚══════╝`;

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SnippetsIndexPage() {
  const snippets = getSnippetMetas();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-16 pb-20">
        <pre className="ascii-logo mb-10" aria-hidden="true">
          {ASCII_SNIPPETS}
        </pre>

        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Snippets for common FHEVM tasks.
        </h1>
        <p className="mb-12 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
          Short, copyable recipes. Each one answers a single &ldquo;how do I do
          X on FHEVM?&rdquo; with prose, paste-ready code, and the reasoning
          behind the shape.
        </p>

        {snippets.length === 0 ? (
          <p className="text-sm text-secondary">No snippets yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {snippets.map((snippet) => (
              <li key={snippet.slug}>
                <Link
                  href={`/snippets/${snippet.slug}`}
                  className="block rounded-2xl border border-border bg-surface/80 p-5 transition-colors hover:border-zama-yellow/30 hover:bg-surface sm:p-6"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {snippet.title}
                    </h2>
                    {snippet.updated_at && (
                      <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
                        {formatDate(snippet.updated_at)}
                      </span>
                    )}
                  </div>
                  {snippet.summary && (
                    <p className="mt-2 text-sm leading-relaxed text-secondary">
                      {snippet.summary}
                    </p>
                  )}
                  {snippet.tags && snippet.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {snippet.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border bg-background/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}