import { skills } from '@/data/skills';
import { DOCS_URL } from '@/data/site';

const ASCII_TITLE = `███████╗██╗  ██╗███████╗██╗   ██╗███╗   ███╗     ██████╗ ██████╗  ██████╗ ██╗  ██╗██████╗  ██████╗  ██████╗ ██╗  ██╗
██╔════╝██║  ██║██╔════╝██║   ██║████╗ ████║    ██╔════╝██╔═══██╗██╔═══██╗██║ ██╔╝██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝
█████╗  ███████║█████╗  ██║   ██║██╔████╔██║    ██║     ██║   ██║██║   ██║█████╔╝ ██████╔╝██║   ██║██║   ██║█████╔╝
██╔══╝  ██╔══██║██╔══╝  ╚██╗ ██╔╝██║╚██╔╝██║    ██║     ██║   ██║██║   ██║██╔═██╗ ██╔══██╗██║   ██║██║   ██║██╔═██╗
██║     ██║  ██║███████╗ ╚████╔╝ ██║ ╚═╝ ██║    ╚██████╗╚██████╔╝╚██████╔╝██║  ██╗██████╔╝╚██████╔╝╚██████╔╝██║  ██╗
╚═╝     ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝     ╚═╝     ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝`;

const fhevmSkillCount = skills.filter((s) => s.topic === "fhevm" && s.id !== "fhevm-router").length;
const ozErc7984SkillCount = skills.filter((s) => s.topic === "oz-erc7984").length;
const ozUtilsSkillCount = skills.filter((s) => s.topic === "oz-utils").length;

export default function HeroSection() {
  return (
    <section className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center pb-16 pt-12 sm:pt-16">
      <pre className="ascii-logo mb-8" aria-hidden="true">
        {ASCII_TITLE}
      </pre>

      <p className="mb-6 max-w-2xl text-lg leading-relaxed text-secondary sm:text-xl">
        Transparency should not require balances, strategies, or identity to become public by default.
      </p>

      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        FHEVM lets builders keep sensitive onchain state encrypted while still
        making it usable by smart contracts. This cookbook reduces the assembly
        cost with task routing, verified patterns, and one-command `npx skills`
        installs.
      </p>

      <div className="mb-12 flex flex-wrap gap-3">
        <a
          href="#install"
          className="rounded-md bg-zama-yellow px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zama-yellow-hover"
        >
          Install with npx skills
        </a>
        <a
          href="/skills"
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-zama-yellow/40 hover:text-zama-yellow"
        >
          Browse {skills.length} skills
        </a>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-zama-yellow/40 hover:text-secondary"
        >
          Zama Docs
        </a>
      </div>

      <p className="text-[11px] uppercase tracking-[0.28em] text-muted [word-spacing:0.6em] sm:text-xs sm:tracking-[0.32em] sm:[word-spacing:0.7em]">
        {fhevmSkillCount} FHEVM &middot; {ozErc7984SkillCount} ERC7984 &middot; {ozUtilsSkillCount}{" "}<span className="[word-spacing:normal]">OZ UTILS</span>{" "}&middot; 1 router
      </p>
    </section>
  );
}
