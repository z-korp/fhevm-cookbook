import CopyCommandButton from "@/components/CopyCommandButton";
import { FULL_PACK_COMMAND, LIST_SKILLS_COMMAND } from "@/data/install";
import { SKILLS_SH_URL } from "@/data/site";

function CommandRow({
  label,
  command,
}: {
  label: string;
  command: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/30 p-3">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-muted">
        {label}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-foreground">
          {command}
        </code>
        <CopyCommandButton text={command} />
      </div>
    </div>
  );
}

export default function InstallSection() {
  return (
    <section id="install" className="border-t border-border py-16 scroll-mt-24 sm:py-20">
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.32em] text-zama-yellow">
          Install
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Install the cookbook in one command.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-secondary sm:text-base">
          This uses the open{" "}
          <a
            href={SKILLS_SH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-zama-yellow"
          >
            skills
          </a>{" "}
          CLI. Most teams should start with the full install. If you only need one specialist module, the skills catalog below includes a single-skill command on each card.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface/80 p-5 sm:p-6">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-zama-yellow">
          Recommended
        </p>
        <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Install all shipped skills from this repo
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          Start here if you want the router and the full Zama cookbook available in one place.
        </p>

        <div className="mt-4">
          <CommandRow label="Default install" command={FULL_PACK_COMMAND} />
        </div>

        <div className="mt-4">
          <CommandRow label="Inspect before installing" command={LIST_SKILLS_COMMAND} />
        </div>
      </div>
    </section>
  );
}
