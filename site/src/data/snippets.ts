import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Snippet, SnippetMeta } from "@/types";

// Snippets live at <repo-root>/snippets/<slug>/snippet.md.
// During `next dev` and `next build`, process.cwd() is the site/ directory.
const SNIPPETS_DIR = path.resolve(process.cwd(), "..", "snippets");

function readSnippetFile(slug: string): Snippet | null {
  const filePath = path.join(SNIPPETS_DIR, slug, "snippet.md");
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const title = typeof data.title === "string" ? data.title : slug;
  const summary = typeof data.summary === "string" ? data.summary : "";
  const updated_at = typeof data.updated_at === "string" ? data.updated_at : "";
  const tags = Array.isArray(data.tags)
    ? data.tags.filter((t): t is string => typeof t === "string")
    : [];

  return {
    slug,
    title,
    summary,
    tags,
    updated_at,
    body: content,
  };
}

function byUpdatedAtDesc<T extends { updated_at: string; title: string; slug: string }>(a: T, b: T) {
  const dateOrder = b.updated_at.localeCompare(a.updated_at);
  if (dateOrder !== 0) return dateOrder;

  const titleOrder = a.title.localeCompare(b.title);
  if (titleOrder !== 0) return titleOrder;

  return a.slug.localeCompare(b.slug);
}

export function getAllSnippets(): Snippet[] {
  if (!fs.existsSync(SNIPPETS_DIR)) return [];

  return fs
    .readdirSync(SNIPPETS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readSnippetFile(entry.name))
    .filter((s): s is Snippet => s !== null)
    .sort(byUpdatedAtDesc);
}

export function getSnippetMetas(): SnippetMeta[] {
  return getAllSnippets().map((snippet) => {
    const { slug, title, summary, tags, updated_at } = snippet;
    return { slug, title, summary, tags, updated_at };
  });
}

export function getSnippet(slug: string): Snippet | null {
  return readSnippetFile(slug);
}

export function getSnippetSlugs(): string[] {
  if (!fs.existsSync(SNIPPETS_DIR)) return [];
  return fs
    .readdirSync(SNIPPETS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}
