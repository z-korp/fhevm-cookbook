import Link from "next/link";
import { getSnippetMetas } from "@/data/snippets";

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

export default function SpecificSnippetsSection() {
  const snippets = getSnippetMetas().slice(0, 3);

  return (
    <section className="border-b border-border py-16 sm:py-20 lg:py-24">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end sm:gap-6">
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground">
            ▸ 03 · Specific Snippets
          </p>
          <h2 className="text-[36px] font-semibold leading-[1.02] tracking-[-0.025em] text-foreground sm:text-[48px]">
            Specific Snippets.
          </h2>
          <p className="mt-4 max-w-[44rem] text-[16px] leading-[1.6] text-secondary">
            Direct answers to the questions builders actually ask: how to solve a specific FHEVM
            problem, or how to make a precise thing happen in a real project.
          </p>
        </div>
        <Link
          href="/snippets"
          className="border-beam-pill inline-flex items-center rounded-full border border-border-strong px-5 py-[10px] text-[12px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:border-foreground"
        >
          All snippets →
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {snippets.map((snippet, index) => (
          <Link
            key={snippet.slug}
            href={`/snippets/${snippet.slug}`}
            className={`group flex flex-col rounded-2xl p-5 sm:p-7 ${
              index === 0 ? "border-beam-card" : "border border-border bg-surface transition-colors hover:border-foreground"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
                {String(index + 1).padStart(2, "0")} · Specific answer
              </p>
              {snippet.updated_at && (
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  {formatDate(snippet.updated_at)}
                </span>
              )}
            </div>
            <h3 className="mt-5 font-mono text-[20px] font-semibold leading-[1.15] tracking-[-0.015em] text-foreground sm:text-[24px]">
              {snippet.title}
            </h3>
            {snippet.summary && (
              <p className="mt-5 flex-1 text-[14px] leading-[1.6] text-secondary">
                {snippet.summary}
              </p>
            )}
            <p className="mt-6 text-[12px] uppercase tracking-[0.22em] text-secondary transition-colors group-hover:text-foreground">
              Read snippet →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
