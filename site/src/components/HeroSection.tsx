import { skills } from '@/data/skills';
import { DOCS_URL } from '@/data/site';
import CubeField from '@/components/CubeField';
import HeroArtifacts from '@/components/HeroArtifacts';

const fhevmSkillCount = skills.filter((s) => s.topic === 'fhevm' && s.id !== 'fhevm-router').length;
const erc7984SkillCount = skills.filter((s) => s.topic === 'erc7984').length;

export default function HeroSection() {
  return (
    <section className="relative border-b border-border py-20 sm:py-24 lg:py-28">
      {/* Diffuse artifact layer — sparse blinking cubes across the whole hero,
          tying the CubeField blob to the surrounding copy so the section
          reads as a single scene. */}
      <HeroArtifacts />
      <div className="relative z-10 grid gap-14 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
        <div className="max-w-[620px]">
          {/* Version badge */}
          <div className="mb-16 inline-flex items-center gap-2 rounded-full border border-border-strong pl-3 pr-4 py-[6px]">
            <span aria-hidden="true" className="size-[6px] rounded-full bg-zama-yellow" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground">
              FHEVM Cookbook · v0.1
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[56px] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-[72px] lg:text-[88px]">
            Confidential
            <br />
            contracts,
            <br />
            <span className="text-secondary">without the guesswork.</span>
          </h1>

          <p className="mt-10 max-w-[576px] text-[17px] leading-[1.55] text-secondary">
            A builder and agent layer for Zama FHEVM — task routing, verified
            patterns, and a one-command install. Transparency should not
            require balances, strategies, or identity to become public by
            default.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#install"
              className="inline-flex items-center rounded-full bg-foreground px-6 py-[14px] text-[13px] font-semibold tracking-[0.025em] text-on-dark transition-colors hover:bg-zama-yellow hover:text-foreground"
            >
              Install with npx skills →
            </a>
            <a
              href="/skills"
              className="inline-flex items-center rounded-full border border-border-strong px-6 py-[13px] text-[13px] font-semibold tracking-[0.025em] text-foreground transition-colors hover:border-foreground"
            >
              Browse {skills.length} skills
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-[14px] text-[13px] font-medium tracking-[0.025em] text-muted underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Zama Docs ↗
            </a>
          </div>

          <div className="mt-12 flex items-center gap-6 border-t border-border pt-8 text-[11px] font-semibold uppercase tracking-[0.3em]">
            <span className="text-foreground">
              {fhevmSkillCount}{' '}
              <span className="font-normal text-muted">FHEVM</span>
            </span>
            <span aria-hidden="true" className="h-px w-6 bg-border" />
            <span className="text-foreground">
              {erc7984SkillCount}{' '}
              <span className="font-normal text-muted">ERC7984</span>
            </span>
            <span aria-hidden="true" className="h-px w-6 bg-border" />
            <span className="text-foreground">
              1 <span className="font-normal text-muted">router</span>
            </span>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <CubeField />
        </div>
      </div>
    </section>
  );
}
