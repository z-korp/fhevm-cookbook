import { DOCS_URL, LLMSTXT_PATH, REPO_URL, SKILLS_DATA_PATH } from "@/data/site";

const ZKORP_URL = "https://zkorp.xyz";
const ZKORP_X_URL = "https://x.com/zKorp_";
const ZKORP_EMAIL = "contact@zkorp.xyz";

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 text-xs text-muted sm:flex-row sm:items-center">
        <p className="font-medium text-secondary">
          Built by{" "}
          <a
            href={ZKORP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground transition-colors hover:text-zama-yellow"
          >
            zKorp
          </a>
          {" "}&mdash; privacy-first builders on Zama FHEVM
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-secondary"
          >
            Repository
          </a>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-secondary"
          >
            Zama Docs
          </a>
          <a href={SKILLS_DATA_PATH} className="transition-colors hover:text-secondary">
            skills.json
          </a>
          <a href={LLMSTXT_PATH} className="transition-colors hover:text-secondary">
            llms.txt
          </a>
          <span className="text-border">|</span>
          <a
            href={ZKORP_X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-secondary"
          >
            @zKorp_
          </a>
          <a
            href={`mailto:${ZKORP_EMAIL}`}
            className="transition-colors hover:text-secondary"
          >
            {ZKORP_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
