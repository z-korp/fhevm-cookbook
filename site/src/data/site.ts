export const SITE_NAME = "FHEVM Cookbook";
export const REPO_SLUG = "z-korp/fhevm-cookbook";
export const REPO_URL = `https://github.com/${REPO_SLUG}`;
export const RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO_SLUG}/main`;
export const SKILLS_SH_URL = "https://skills.sh";
export const DOCS_URL = "https://docs.zama.org/protocol";
export const ACTIONS_URL = `${REPO_URL}/actions`;
export const CONTRIBUTING_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;
export const ROUTER_SKILL_PATH = "skills/fhevm-router/SKILL.md";
export const OZ_ERC7984_SKILL_PATH = "skills/oz-erc7984-confidential-tokens/SKILL.md";
export const PRIVACY_SKILL_PATH = "skills/fhevm-privacy-constraints/SKILL.md";
export const ROUTER_SKILL_RAW_URL = `${RAW_BASE_URL}/${ROUTER_SKILL_PATH}`;
export const OZ_ERC7984_SKILL_RAW_URL = `${RAW_BASE_URL}/${OZ_ERC7984_SKILL_PATH}`;
export const PRIVACY_SKILL_RAW_URL = `${RAW_BASE_URL}/${PRIVACY_SKILL_PATH}`;
export const ROUTER_SKILL_GITHUB_URL = `${REPO_URL}/blob/main/${ROUTER_SKILL_PATH}`;
export const OZ_ERC7984_SKILL_GITHUB_URL = `${REPO_URL}/blob/main/${OZ_ERC7984_SKILL_PATH}`;
export const PRIVACY_SKILL_GITHUB_URL = `${REPO_URL}/blob/main/${PRIVACY_SKILL_PATH}`;
export const LLMSTXT_PATH = "/llms.txt";
export const SITE_DATA_PATH = "/data/site-data.json";
export const SKILLS_DATA_PATH = "/data/skills.json";

// ---------------------------------------------------------------------------
// Skill path helper — generates all path/URL constants from a skill ID
// ---------------------------------------------------------------------------
export function makeSkillPaths(id: string, directory = "skills") {
  const path = `${directory}/${id}/SKILL.md`;
  return {
    path,
    rawUrl: `${RAW_BASE_URL}/${path}`,
    githubUrl: `${REPO_URL}/blob/main/${path}`,
  };
}

export const ZAMA_DOCS = {
  quickstart:
    "https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial",
  solidityGuides: "https://docs.zama.org/protocol/solidity-guides",
  relayerGuides: "https://docs.zama.org/protocol/relayer-sdk-guides",
  userDecryption:
    "https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption",
  publicDecryption:
    "https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption",
  webapp: "https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/webapp",
  examples: "https://docs.zama.org/protocol/examples",
  erc7984:
    "https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/integration-guide",
  wrapperRegistry:
    "https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry",
  acl: "https://docs.zama.org/protocol/solidity-guides/smart-contract/acl",
  inputs:
    "https://docs.zama.org/protocol/solidity-guides/smart-contract/inputs",
  operations:
    "https://docs.zama.org/protocol/solidity-guides/smart-contract/operations",
  testing:
    "https://docs.zama.org/protocol/solidity-guides/getting-started/write-contract/testing",
};
