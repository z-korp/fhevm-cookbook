import Link from "next/link";
import { skills } from "@/data/skills";
import { CATEGORY_LABELS } from "@/data/install";
import type { Skill } from "@/types";

const FEATURED_IDS = [
  "fhevm-router",
  "fhevm-privacy-constraints",
  "fhevm-acl-lifecycle",
  "fhevm-encrypted-inputs",
  "fhevm-control-flow",
  "fhevm-user-decryption",
  "erc7984-confidential-tokens",
];

function FeaturedCard({ skill, index }: { skill: Skill; index: number }) {
  const slotLabel = String(index + 1).padStart(2, "0");
  const isPrimary = skill.id === FEATURED_IDS[0];
  const categoryLabel = skill.category ? CATEGORY_LABELS[skill.category] : skill.topic;

  return (
    <Link
      href={`/skills?skill=${encodeURIComponent(skill.id)}`}
      className={`group flex flex-col rounded-2xl p-7 ${isPrimary ? "border-beam-card" : "border border-border bg-surface transition-colors hover:border-foreground"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
          {slotLabel} · {skill.topic}
        </p>
        <span aria-hidden="true" className="size-[6px] rounded-full bg-zama-yellow" />
      </div>

      <h3 className="mt-5 font-mono text-[24px] font-semibold leading-[1.15] tracking-[-0.015em] text-foreground">
        {skill.name}
      </h3>

      <p className="mt-5 flex-1 text-[14px] leading-[1.6] text-secondary">
        {skill.description}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <p className="text-[12px] uppercase tracking-[0.22em] text-secondary">
          {categoryLabel}
        </p>
        <p className="text-[12px] uppercase tracking-[0.22em] text-secondary transition-colors group-hover:text-foreground">
          View →
        </p>
      </div>
    </Link>
  );
}

export default function FeaturedSkillsSection() {
  const featured = FEATURED_IDS.map((id) => {
    const skill = skills.find((s) => s.id === id);
    return skill ? { skill } : null;
  }).filter((entry): entry is { skill: Skill } => entry !== null)
    .sort(
      (a, b) =>
        skills.findIndex((skill) => skill.id === a.skill.id) -
        skills.findIndex((skill) => skill.id === b.skill.id),
    );

  return (
    <section className="border-b border-border py-20 sm:py-24">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground">
            ▸ 02 · Catalog
          </p>
          <h2 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] text-foreground sm:text-[48px]">
            Custom FHEVM Skills.
          </h2>
          <p className="mt-4 max-w-[40rem] text-[16px] leading-[1.6] text-secondary">
            Curated skills for builders who want the exact FHEVM pattern, snippet, or agent workflow
            they need without digging through the full catalog first.
          </p>
        </div>
        <Link
          href="/skills"
          className="border-beam-pill inline-flex items-center rounded-full border border-border-strong px-5 py-[10px] text-[12px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:border-foreground"
        >
          All {skills.length} custom skills →
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featured.map(({ skill }, index) => (
          <FeaturedCard key={skill.id} skill={skill} index={index} />
        ))}
      </div>
    </section>
  );
}
