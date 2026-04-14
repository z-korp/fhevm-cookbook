import { DOCS_URL, LLMSTXT_PATH, REPO_URL, SKILLS_DATA_PATH } from "@/data/site";

const ZKORP_URL = "https://zkorp.xyz";
const ZKORP_X_URL = "https://x.com/zKorp_";

export default function Footer() {
  return (
    <footer className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 text-[11px] uppercase tracking-[0.22em] text-muted sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-zama-yellow" />
          <p className="normal-case tracking-normal text-[13px] text-secondary">
            Built by{" "}
            <a
              href={ZKORP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground transition-colors hover:underline"
            >
              zKorp
            </a>
            {" "}privacy-first builders on Zama FHEVM.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-7">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Repository
          </a>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Zama Docs
          </a>
          <a href={SKILLS_DATA_PATH} className="transition-colors hover:text-foreground">
            skills.json
          </a>
          <a href={LLMSTXT_PATH} className="transition-colors hover:text-foreground">
            llms.txt
          </a>
          <span aria-hidden="true" className="text-border">|</span>
          <a
            href={ZKORP_X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            @zKorp_
          </a>
        </div>
      </div>
    </footer>
  );
}
