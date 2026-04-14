import Link from 'next/link';
import { skills } from '@/data/skills';
import { DOCS_URL } from '@/data/site';
import HeroTitle from '@/components/HeroTitle';
import HeroBustWrapper from '@/components/HeroBustWrapper';

const fhevmSkillCount = skills.filter((s) => s.topic === 'fhevm' && s.id !== 'fhevm-router').length;
const erc7984SkillCount = skills.filter((s) => s.topic === 'oz-erc7984').length;
const ozUtilsSkillCount = skills.filter((s) => s.topic === 'oz-utils').length;

export default function HeroSection() {
  return (
    <section className="relative py-20 sm:py-24 lg:py-28 overflow-hidden">
      {/* Subtle grid that fades out toward the bottom */}
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-0"
      />

      {/* 3D bust on the right — hidden on small screens */}
      <div className="hidden lg:block absolute right-0 top-8 bottom-8 w-[420px] z-0">
        <HeroBustWrapper />
      </div>

      <div className="relative z-10 max-w-[620px]">
        <HeroTitle />

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
          <Link
            href="/skills"
            className="border-beam-pill inline-flex items-center rounded-full border border-border-strong px-6 py-[13px] text-[13px] font-semibold tracking-[0.025em] text-foreground transition-colors hover:border-foreground"
          >
            Browse {skills.length} skills
          </Link>
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
            {ozUtilsSkillCount}{' '}
            <span className="font-normal text-muted">OZ UTILS</span>
          </span>
          <span aria-hidden="true" className="h-px w-6 bg-border" />
          <span className="text-foreground">
            1 <span className="font-normal text-muted">router</span>
          </span>
        </div>
      </div>
    </section>
  );
}
