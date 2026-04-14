import { REPO_SLUG } from "@/data/site";
import type { Skill, SkillCategory } from "@/types";

export const CATEGORY_ORDER: SkillCategory[] = [
  "router",
  "core-mechanics",
  "decryption",
  "operations",
  "security",
  "advanced",
];

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  router: "Start here",
  "core-mechanics": "Core FHE mechanics",
  decryption: "Decryption patterns",
  operations: "Operations",
  security: "Security & compliance",
  advanced: "Advanced patterns",
};

export const LIST_SKILLS_COMMAND = `npx skills add ${REPO_SLUG} --list`;
export const FULL_PACK_COMMAND = `npx skills add ${REPO_SLUG} --all`;

function uniqueSkillIds(skillIds: string[]) {
  return skillIds.filter((id, index) => skillIds.indexOf(id) === index);
}

export function makeInstallCommand(skillIds: string[]) {
  const ids = uniqueSkillIds(skillIds);

  if (ids.length === 0) {
    return `npx skills add ${REPO_SLUG}`;
  }

  return `npx skills add ${REPO_SLUG}${ids.map((id) => ` --skill ${id}`).join("")}`;
}

export function makeSkillInstallCommand(skill: Skill) {
  return makeInstallCommand([skill.id]);
}
