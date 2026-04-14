"use client";

import { useEffect, useState } from "react";
import { skills } from "@/data/skills";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  makeSkillInstallCommand,
} from "@/data/install";
import CopyCommandButton from "@/components/CopyCommandButton";
import type { Skill } from "@/types";

function groupSkillsByCategory(items: Skill[]) {
  return CATEGORY_ORDER.filter((category) => category !== "router")
    .map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: items.filter((skill) => skill.category === category),
    }))
    .filter((group) => group.items.length > 0);
}

function SkillCard({
  skill,
  isOpen = false,
  onToggle,
}: {
  skill: Skill;
  isOpen?: boolean;
  onToggle: (skillId: string, isOpen: boolean) => void;
}) {
  const isRouter = skill.id === "fhevm-router";
  const installCommand = makeSkillInstallCommand(skill);

  return (
    <details
      id={skill.id}
      open={isOpen}
      onToggle={(event) => onToggle(skill.id, event.currentTarget.open)}
      className="group scroll-mt-24 rounded-2xl border border-border bg-surface/80 transition-colors open:border-zama-yellow/50 open:bg-black open:shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
    >
      <summary className="flex cursor-pointer list-none items-start gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden group-open:bg-black group-open:text-zama-yellow">
        <div className="min-w-0 flex-1">
          {isRouter && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-foreground group-open:text-zama-yellow">
              start here
            </p>
          )}
          <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl group-open:text-zama-yellow">
            {skill.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-secondary group-open:text-zinc-200">
            {skill.description}
          </p>
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mt-1 size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180 group-open:text-zama-yellow"
        >
          <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="border-t border-border px-5 pb-5 pt-4 sm:px-6 sm:pb-6 group-open:border-zama-yellow/30 group-open:bg-black">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-muted group-open:text-zama-yellow">
          what it covers
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-secondary marker:text-muted group-open:text-zinc-200 group-open:marker:text-zama-yellow">
          {skill.covers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="mt-5 rounded-xl border border-border bg-background/30 p-3 group-open:border-zama-yellow/30 group-open:bg-zinc-950">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-muted group-open:text-zama-yellow">
            install this skill
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-foreground group-open:text-white">
              {installCommand}
            </code>
            <CopyCommandButton text={installCommand} variant="yellow" />
          </div>
        </div>

        <p className="mt-5 text-xs text-muted group-open:text-zinc-300">
          Repo path: <code className="font-mono text-foreground group-open:text-white">{skill.path}</code>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={skill.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-secondary transition-colors hover:border-zama-yellow/40 hover:text-foreground group-open:border-zama-yellow/40 group-open:bg-zama-yellow group-open:text-black"
          >
            Source
          </a>
          <a
            href={skill.rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-secondary transition-colors hover:border-zama-yellow/40 hover:text-foreground group-open:border-zama-yellow/40 group-open:bg-zama-yellow group-open:text-black"
          >
            Raw URL
          </a>
        </div>
      </div>
    </details>
  );
}

function TopicHeading({ id, title, tagline, count }: { id: string; title: string; tagline: string; count: number }) {
  return (
    <header id={id} className="mb-6 border-t border-border pt-8 scroll-mt-24">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.32em] text-foreground">
        {title} · {count}
      </p>
      <p className="text-sm text-secondary sm:text-base">{tagline}</p>
    </header>
  );
}

export default function SkillsList({ openSkillId }: { openSkillId?: string }) {
  const [activeSkillId, setActiveSkillId] = useState(openSkillId);

  useEffect(() => {
    setActiveSkillId(openSkillId);
  }, [openSkillId]);

  function handleSkillToggle(skillId: string, isOpen: boolean) {
    setActiveSkillId((currentSkillId) => {
      if (isOpen) {
        return skillId;
      }

      return currentSkillId === skillId ? undefined : currentSkillId;
    });
  }

  const router = skills.find((s) => s.id === "fhevm-router");
  const fhevmSkills = skills.filter((s) => s.topic === "fhevm" && s.id !== "fhevm-router");
  const ozErc7984Skills = skills.filter((s) => s.topic === "oz-erc7984");
  const ozUtilsSkills = skills.filter((s) => s.topic === "oz-utils");

  const fhevmGrouped = groupSkillsByCategory(fhevmSkills);
  const ozErc7984Grouped = groupSkillsByCategory(ozErc7984Skills);
  const ozUtilsGrouped = groupSkillsByCategory(ozUtilsSkills);

  return (
    <section className="py-2">
      <nav className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.28em] text-muted">
        <span>jump to:</span>
        <a
          href="#fhevm"
          className="text-secondary transition-colors hover:text-foreground"
        >
          FHEVM ({fhevmSkills.length})
        </a>
        <span aria-hidden="true" className="text-border">·</span>
        <a
          href="#oz-erc7984"
          className="text-secondary transition-colors hover:text-foreground"
        >
          ERC7984 ({ozErc7984Skills.length})
        </a>
        <span aria-hidden="true" className="text-border">·</span>
        <a
          href="#oz-utils"
          className="text-secondary transition-colors hover:text-foreground"
        >
          OZ Utilities ({ozUtilsSkills.length})
        </a>
      </nav>

      {router && (
        <div className="mb-12">
          <SkillCard
            skill={router}
            isOpen={activeSkillId === router.id}
            onToggle={handleSkillToggle}
          />
        </div>
      )}

      <div className="mb-16">
        <TopicHeading
          id="fhevm"
          title="FHEVM"
          tagline="Protocol primitives: ACL, encrypted inputs, control flow, decryption, arithmetic, and the patterns that ship confidential contracts."
          count={fhevmSkills.length}
        />
        <div className="space-y-10">
          {fhevmGrouped.map((group) => (
            <div key={group.category}>
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-muted">
                {group.label} · {group.items.length}
              </h3>
              <div className="grid gap-4">
                {group.items.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isOpen={activeSkillId === skill.id}
                    onToggle={handleSkillToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-16">
        <TopicHeading
          id="oz-erc7984"
          title="ERC7984"
          tagline="Confidential token layer: tokens, compliance, governance, and custodian patterns built on top of FHEVM."
          count={ozErc7984Skills.length}
        />
        <div className="space-y-10">
          {ozErc7984Grouped.map((group) => (
            <div key={group.category}>
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-muted">
                {group.label} · {group.items.length}
              </h3>
              <div className="grid gap-4">
                {group.items.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isOpen={activeSkillId === skill.id}
                    onToggle={handleSkillToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <TopicHeading
          id="oz-utils"
          title="OZ Utilities"
          tagline="OpenZeppelin confidential-contracts helper libraries: safe arithmetic, handle access, and building blocks shared across ERC7984 modules."
          count={ozUtilsSkills.length}
        />
        <div className="space-y-10">
          {ozUtilsGrouped.map((group) => (
            <div key={group.category}>
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-muted">
                {group.label} · {group.items.length}
              </h3>
              <div className="grid gap-4">
                {group.items.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isOpen={activeSkillId === skill.id}
                    onToggle={handleSkillToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
