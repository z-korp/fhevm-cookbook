import {
  ACTIONS_URL,
  CONTRIBUTING_URL,
  DOCS_URL,
  LLMSTXT_PATH,
  REPO_URL,
  ROUTER_SKILL_GITHUB_URL,
  ROUTER_SKILL_RAW_URL,
  SITE_DATA_PATH,
  SITE_NAME,
  SKILLS_DATA_PATH,
} from "@/data/site";
import { skills } from "@/data/skills";

export const publicArtifacts = [LLMSTXT_PATH, SITE_DATA_PATH, SKILLS_DATA_PATH] as const;

export function getSiteData() {
  return {
    site: SITE_NAME,
    repo: REPO_URL,
    docs: DOCS_URL,
    router_skill_raw: ROUTER_SKILL_RAW_URL,
    counts: {
      shipped_skills: skills.length,
      public_artifacts: publicArtifacts.length,
    },
    artifacts: {
      llms_txt: LLMSTXT_PATH,
      site_data_json: SITE_DATA_PATH,
      skills_json: SKILLS_DATA_PATH,
    },
    skills: skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      path: skill.path,
      raw_url: skill.rawUrl,
      github_url: skill.githubUrl,
    })),
    verify: {
      actions: ACTIONS_URL,
      contributing: CONTRIBUTING_URL,
      router_skill: ROUTER_SKILL_GITHUB_URL,
      repository: REPO_URL,
    },
  };
}

export function getSkillsSnapshot() {
  return {
    source: "shared skill data",
    skills,
  };
}

export function getLlmsText() {
  return [
    SITE_NAME,
    "",
    "Thin skills catalog for working on Zama FHEVM.",
    "",
    "Current scope:",
    ...skills.map((skill) => `- ${skill.name}: ${skill.path}`),
    "",
    "Raw skill URLs:",
    ...skills.map((skill) => `- ${skill.name}: ${skill.rawUrl}`),
    "",
    "What the skills cover:",
    ...skills.flatMap((skill) => skill.covers.map((item) => `- ${skill.name}: ${item}`)),
    "",
    "Machine-readable artifacts:",
    `- ${LLMSTXT_PATH}`,
    `- ${SITE_DATA_PATH}`,
    `- ${SKILLS_DATA_PATH}`,
    "",
    "References:",
    ...skills.flatMap((skill) => skill.docs.map((doc) => `- ${skill.name} / ${doc.label}: ${doc.href}`)),
  ].join("\n");
}
