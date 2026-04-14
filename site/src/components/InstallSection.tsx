import CopyCommandButton from "@/components/CopyCommandButton";
import { FULL_PACK_COMMAND, LIST_SKILLS_COMMAND } from "@/data/install";
import { SKILLS_SH_URL } from "@/data/site";

export default function InstallSection() {

  return (
    <section
      id="install"
      className="scroll-mt-24 border-b border-border py-20 sm:py-24"
    >
      <div className="grid gap-12 lg:grid-cols-[470px_1fr] lg:items-start lg:gap-16">
        {/* Left column */}
        <div className="max-w-[470px]">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground">
            ▸ 01 · Install
          </p>
          <h2 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] text-foreground sm:text-[48px]">
            One command.
            <br />
            Fully wired.
          </h2>
          <p className="mt-6 text-[16px] leading-[1.6] text-secondary">
            Uses the open{" "}
            <a
              href={SKILLS_SH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              skills
            </a>{" "}
            CLI. Most teams should start with the full install. Single-skill
            commands are available on each catalog card.
          </p>
        </div>

        {/* Right column - commands */}
        <div className="flex flex-col gap-3">
          {/* Primary (dark) command card */}
          <div
            className="relative rounded-2xl border border-foreground bg-foreground p-6 sm:p-7"
          >
            <div className="relative z-10">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zama-yellow">
                  Recommended · Default install
                </p>
                <span className="rounded-full bg-zama-yellow px-3 py-[4px] text-[10px] font-bold uppercase tracking-[0.22em] text-foreground">
                  Recommended
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="min-w-0 flex-1 break-all font-mono text-[14px] leading-[1.5] text-on-dark">
                  {FULL_PACK_COMMAND}
                </code>
                <CopyCommandButton text={FULL_PACK_COMMAND} variant="yellow" />
              </div>
            </div>
          </div>

          {/* Secondary (light) command card */}
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-muted">
              Inspect before installing
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <code className="min-w-0 flex-1 break-all font-mono text-[14px] leading-[1.5] text-foreground">
                {LIST_SKILLS_COMMAND}
              </code>
              <CopyCommandButton text={LIST_SKILLS_COMMAND} variant="dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
