import Link from "next/link";
import { skills } from "@/data/skills";
import { CATEGORY_LABELS } from "@/data/install";
import type { Skill } from "@/types";

const FEATURED_IDS = [
  "fhevm-router",
  "erc7984-confidential-tokens",
  "fhevm-privacy-constraints",
];

function FeaturedCard({ skill, index }: { skill: Skill; index: number }) {
  const slotLabel = String(index + 1).padStart(2, "0");
  const categoryLabel = skill.category ? CATEGORY_LABELS[skill.category] : skill.topic;

  return (
    <Link
      href={`/skills#${skill.id}`}
      className={`group flex flex-col rounded-2xl p-6 ${index === 0 ? "border-beam-card" : "border border-border bg-surface transition-colors hover:border-foreground"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
          {slotLabel} · {skill.topic}
        </p>
        <span aria-hidden="true" className="size-[6px] rounded-full bg-zama-yellow" />
      </div>

      <h3 className="mt-5 font-mono text-[22px] font-semibold leading-[1.15] tracking-[-0.015em] text-foreground">
        {skill.name}
      </h3>

      <p className="mt-5 flex-1 text-[13px] leading-[1.55] text-secondary">
        {skill.description}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-secondary">
          {categoryLabel}
        </p>
        <p className="text-[11px] uppercase tracking-[0.22em] text-secondary transition-colors group-hover:text-foreground">
          View →
        </p>
      </div>
    </Link>
  );
}

export default function FeaturedSkillsSection() {
  const featured = FEATURED_IDS.map((id, index) => {
    const skill = skills.find((s) => s.id === id);
    return skill ? { skill, index } : null;
  }).filter((entry): entry is { skill: Skill; index: number } => entry !== null);

  return (
    <section className="border-b border-border py-20 sm:py-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-foreground">
            ▸ 02 · Catalog
          </p>
          <h2 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.025em] text-foreground sm:text-[44px]">
            Featured skills.
          </h2>
        </div>
        <Link
          href="/skills"
          className="border-beam-pill inline-flex items-center rounded-full border border-border-strong px-5 py-[10px] text-[12px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:border-foreground"
        >
          All {skills.length} →
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featured.map(({ skill, index }) => (
          <FeaturedCard key={skill.id} skill={skill} index={index} />
        ))}
      </div>
    </section>
  );
}
