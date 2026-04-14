export interface DocLink {
  label: string;
  href: string;
}

export type SkillCategory =
  | "router"
  | "core-mechanics"
  | "decryption"
  | "security"
  | "operations"
  | "advanced";

export type SkillTopic = "fhevm" | "oz-erc7984" | "oz-utils";

export interface Skill {
  id: string;
  name: string;
  description: string;
  topic: SkillTopic;
  category?: SkillCategory;
  source: string;
  path: string;
  rawUrl: string;
  githubUrl: string;
  covers: string[];
  docs: DocLink[];
}

export interface SnippetFrontmatter {
  title: string;
  summary: string;
  tags?: string[];
  updated_at: string;
}

export interface SnippetMeta extends SnippetFrontmatter {
  slug: string;
}

export interface Snippet extends SnippetMeta {
  body: string;
}
