import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { common } from "lowlight";
import { solidity } from "@/lib/highlight-solidity";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSnippet, getSnippetSlugs } from "@/data/snippets";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getSnippetSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const snippet = getSnippet(slug);
  if (!snippet) return { title: "Snippet not found | FHEVM Cookbook" };
  return {
    title: `${snippet.title} | FHEVM Cookbook`,
    description: snippet.summary,
  };
}

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

export default async function SnippetPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const snippet = getSnippet(slug);
  if (!snippet) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-16 pb-20">
        <Link
          href="/snippets"
          className="mb-8 inline-block text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
        >
          ← All snippets
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {snippet.title}
          </h1>
          {snippet.summary && (
            <p className="mt-3 text-base leading-relaxed text-secondary">
              {snippet.summary}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted">
            {snippet.updated_at && <span>{formatDate(snippet.updated_at)}</span>}
            {snippet.tags && snippet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {snippet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-background/30 px-2 py-0.5 font-mono normal-case tracking-[0.12em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        <article className="snippet-prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              [
                rehypeHighlight,
                {
                  detect: true,
                  ignoreMissing: true,
                  languages: { ...common, solidity },
                },
              ],
            ]}
          >
            {snippet.body}
          </ReactMarkdown>
        </article>
      </main>
      <Footer />
    </>
  );
}
