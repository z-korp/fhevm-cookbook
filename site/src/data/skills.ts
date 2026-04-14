import {
  REPO_SLUG,
  OZ_ERC7984_SKILL_GITHUB_URL,
  OZ_ERC7984_SKILL_PATH,
  OZ_ERC7984_SKILL_RAW_URL,
  PRIVACY_SKILL_GITHUB_URL,
  PRIVACY_SKILL_PATH,
  PRIVACY_SKILL_RAW_URL,
  ROUTER_SKILL_GITHUB_URL,
  ROUTER_SKILL_PATH,
  ROUTER_SKILL_RAW_URL,
  ZAMA_DOCS,
  makeSkillPaths,
} from "@/data/site";
import type { Skill } from "@/types";

// ---------------------------------------------------------------------------
// Generated paths for new skills
// ---------------------------------------------------------------------------
const aclPaths = makeSkillPaths("fhevm-acl-lifecycle");
const controlFlowPaths = makeSkillPaths("fhevm-control-flow");
const inputsPaths = makeSkillPaths("fhevm-encrypted-inputs");
const userDecryptPaths = makeSkillPaths("fhevm-user-decryption");
const publicDecryptPaths = makeSkillPaths("fhevm-public-decryption");
const frontendPaths = makeSkillPaths("fhevm-frontend-integration");
const arithmeticPaths = makeSkillPaths("fhevm-arithmetic-ops");
const auditPaths = makeSkillPaths("fhevm-security-audit");
const compliancePaths = makeSkillPaths("oz-erc7984-compliance-patterns");
const testingPaths = makeSkillPaths("fhevm-testing");
const crossContractPaths = makeSkillPaths("fhevm-cross-contract");
const governancePaths = makeSkillPaths("oz-erc7984-confidential-governance");
const custodianPaths = makeSkillPaths("oz-erc7984-custodian-omnibus");
const tokenRegistryPaths = makeSkillPaths("fhevm-token-registry");
const safemathPaths = makeSkillPaths("oz-utils-safemath");

export const skills: Skill[] = [
  {
    id: "fhevm-router",
    name: "fhevm-router",
    topic: "fhevm",
    category: "router",
    description:
      "General-purpose skill that triages a Zama FHEVM task, points to the right official docs, and keeps contract and frontend responsibilities separated.",
    source: REPO_SLUG,
    path: ROUTER_SKILL_PATH,
    rawUrl: ROUTER_SKILL_RAW_URL,
    githubUrl: ROUTER_SKILL_GITHUB_URL,
    covers: [
      "Classifies the task as contract, frontend, wallet, or review oriented",
      "Points to the narrowest official Zama docs page to keep open while working",
      "Calls out trust boundaries, ACL concerns, and decryption boundaries early",
      "Keeps the repo honest about current scope instead of routing to missing modules",
    ],
    docs: [
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
      { label: "User decryption", href: ZAMA_DOCS.userDecryption },
      { label: "Public decryption", href: ZAMA_DOCS.publicDecryption },
      { label: "Web app guide", href: ZAMA_DOCS.webapp },
      { label: "ERC7984 integration", href: ZAMA_DOCS.erc7984 },
    ],
  },
  {
    id: "oz-erc7984-confidential-tokens",
    name: "oz-erc7984-confidential-tokens",
    topic: "oz-erc7984",
    category: "core-mechanics",
    description:
      "Designing, implementing, or reviewing ERC7984 confidential tokens, especially wrappers, operators, transfer variants, and unwrap correctness.",
    source: REPO_SLUG,
    path: OZ_ERC7984_SKILL_PATH,
    rawUrl: OZ_ERC7984_SKILL_RAW_URL,
    githubUrl: OZ_ERC7984_SKILL_GITHUB_URL,
    covers: [
      "Frames ERC7984 around token, caller, decryption, and proof-verification boundaries",
      "Calls out operator semantics instead of drifting back to ERC20 allowance mental models",
      "Keeps unwrap flows honest as async decrypt-and-verify, not single-step plaintext settlement",
      "Maps custom designs back to the smallest OpenZeppelin confidential token module set",
    ],
    docs: [
      { label: "ERC7984 integration", href: ZAMA_DOCS.erc7984 },
      { label: "Examples", href: ZAMA_DOCS.examples },
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
    ],
  },
  {
    id: "fhevm-privacy-constraints",
    name: "fhevm-privacy-constraints",
    topic: "fhevm",
    category: "core-mechanics",
    description:
      "Product and mechanism design when confidential balances, ACL boundaries, and async decryption change what can actually be measured or enforced.",
    source: REPO_SLUG,
    path: PRIVACY_SKILL_PATH,
    rawUrl: PRIVACY_SKILL_RAW_URL,
    githubUrl: PRIVACY_SKILL_GITHUB_URL,
    covers: [
      "Separates what is public, hidden, user-readable, or only available after async decrypt",
      "Explains why balance-based rewards and threshold checks break under confidential transfers",
      "Forces ACL access plans to be explicit before proposing on-chain reads or enforcement",
      "Reframes blocked mechanisms toward wrap activity, lockups, utility, or user-initiated proofs",
    ],
    docs: [
      { label: "Examples", href: ZAMA_DOCS.examples },
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
      { label: "ERC7984 integration", href: ZAMA_DOCS.erc7984 },
    ],
  },

  // ---------------------------------------------------------------------------
  // Core FHE Mechanics
  // ---------------------------------------------------------------------------
  {
    id: "fhevm-acl-lifecycle",
    name: "fhevm-acl-lifecycle",
    topic: "fhevm",
    category: "core-mechanics",
    description:
      "Managing encrypted value permissions: FHE.allow, FHE.allowThis, FHE.allowTransient, handle re-creation, and the critical rule that new handles carry no permissions.",
    source: REPO_SLUG,
    path: aclPaths.path,
    rawUrl: aclPaths.rawUrl,
    githubUrl: aclPaths.githubUrl,
    covers: [
      "Explains why FHE operations return NEW handles that need fresh ACL grants",
      "Distinguishes allow, allowThis, and allowTransient for different trust scenarios",
      "Traces permission chains across multi-step encrypted computations",
      "Catches the #1 FHEVM bug: assuming permissions transfer to derived values",
    ],
    docs: [
      { label: "ACL semantics", href: ZAMA_DOCS.acl },
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
    ],
  },
  {
    id: "fhevm-control-flow",
    name: "fhevm-control-flow",
    topic: "fhevm",
    category: "core-mechanics",
    description:
      "Replacing if/else and require patterns with FHE equivalents: FHE.select, silent zeroing, and designing UX around non-reverting failures.",
    source: REPO_SLUG,
    path: controlFlowPaths.path,
    rawUrl: controlFlowPaths.rawUrl,
    githubUrl: controlFlowPaths.githubUrl,
    covers: [
      "Explains why require(ebool) does not exist and what replaces it",
      "Shows FHE.select as the only way to branch on encrypted conditions",
      "Covers silent fallback to zero and its impact on user experience",
      "Guides product design for non-reverting failure modes",
    ],
    docs: [
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
      { label: "Operations", href: ZAMA_DOCS.operations },
    ],
  },
  {
    id: "fhevm-encrypted-inputs",
    name: "fhevm-encrypted-inputs",
    topic: "fhevm",
    category: "core-mechanics",
    description:
      "Accepting user-encrypted values in contracts: FHE.fromExternal, input proofs, caller binding, and replay prevention.",
    source: REPO_SLUG,
    path: inputsPaths.path,
    rawUrl: inputsPaths.rawUrl,
    githubUrl: inputsPaths.githubUrl,
    covers: [
      "Explains the FHE.fromExternal(ciphertext, inputProof) ingestion pattern",
      "Shows how input proofs bind ciphertext to msg.sender and contract address",
      "Covers client-side encryption with the Zama SDK",
      "Prevents replay and cross-contract ciphertext injection attacks",
    ],
    docs: [
      { label: "Input handling", href: ZAMA_DOCS.inputs },
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
    ],
  },

  // ---------------------------------------------------------------------------
  // Decryption Patterns
  // ---------------------------------------------------------------------------
  {
    id: "fhevm-user-decryption",
    name: "fhevm-user-decryption",
    topic: "fhevm",
    category: "decryption",
    description:
      "Client-side decryption: off-chain reencryption, EIP-712 authorization, React hooks, and ACL pre-grant requirements.",
    source: REPO_SLUG,
    path: userDecryptPaths.path,
    rawUrl: userDecryptPaths.rawUrl,
    githubUrl: userDecryptPaths.githubUrl,
    covers: [
      "Explains the off-chain reencryption flow: sign, decrypt, display",
      "Shows ACL pre-grant as a prerequisite for user decryption",
      "Covers EIP-712 typed signatures for reencryption authorization",
      "Guides React and Next.js integration with the relayer SDK",
    ],
    docs: [
      { label: "User decryption", href: ZAMA_DOCS.userDecryption },
      { label: "Relayer guides", href: ZAMA_DOCS.relayerGuides },
    ],
  },
  {
    id: "fhevm-public-decryption",
    name: "fhevm-public-decryption",
    topic: "fhevm",
    category: "decryption",
    description:
      "Two-step decrypt-verify-finalize flows: public decryption, on-chain proof verification, and state-changing plaintext settlement.",
    source: REPO_SLUG,
    path: publicDecryptPaths.path,
    rawUrl: publicDecryptPaths.rawUrl,
    githubUrl: publicDecryptPaths.githubUrl,
    covers: [
      "Explains the two-step pattern: compute encrypted result, then finalize with proof",
      "Shows FHE.makePubliclyDecryptable and relayer publicDecrypt flow",
      "Covers on-chain proof verification with FHE.checkSignatures",
      "Prevents the single-step unwrap bug where user-claimed plaintext bypasses FHE checks",
    ],
    docs: [
      { label: "Public decryption", href: ZAMA_DOCS.publicDecryption },
      { label: "Relayer guides", href: ZAMA_DOCS.relayerGuides },
    ],
  },

  // ---------------------------------------------------------------------------
  // Security & Compliance
  // ---------------------------------------------------------------------------
  {
    id: "fhevm-security-audit",
    name: "fhevm-security-audit",
    topic: "fhevm",
    category: "security",
    description:
      "Auditing and reviewing confidential contracts: ACL flow verification, silent fallback tracing, handle lifecycle, and a catalog of common footguns.",
    source: REPO_SLUG,
    path: auditPaths.path,
    rawUrl: auditPaths.rawUrl,
    githubUrl: auditPaths.githubUrl,
    covers: [
      "Provides a systematic audit checklist for FHEVM contracts",
      "Traces ACL permission flows across multi-step operations",
      "Catalogs known footguns: missing ACL, silent zero, wrong unwrap, handle reuse",
      "Covers arithmetic constraint verification and overflow behavior",
    ],
    docs: [
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
      { label: "Examples", href: ZAMA_DOCS.examples },
    ],
  },
  {
    id: "oz-erc7984-compliance-patterns",
    name: "oz-erc7984-compliance-patterns",
    topic: "oz-erc7984",
    category: "security",
    description:
      "Implementing regulatory compliance on confidential tokens: observer access, freezing, blocklists, RWA controls, and institutional adoption patterns.",
    source: REPO_SLUG,
    path: compliancePaths.path,
    rawUrl: compliancePaths.rawUrl,
    githubUrl: compliancePaths.githubUrl,
    covers: [
      "Maps OpenZeppelin compliance modules: ObserverAccess, Freezable, Restricted, Rwa",
      "Explains selective transparency for auditors without breaking user privacy",
      "Covers force-transfer, pause, and encrypted freeze amount mechanics",
      "Guides institutional adoption: how to satisfy regulators while preserving confidentiality",
    ],
    docs: [
      { label: "ERC7984 integration", href: ZAMA_DOCS.erc7984 },
      { label: "Examples", href: ZAMA_DOCS.examples },
    ],
  },

  // ---------------------------------------------------------------------------
  // Operations
  // ---------------------------------------------------------------------------
  {
    id: "fhevm-arithmetic-ops",
    name: "fhevm-arithmetic-ops",
    topic: "fhevm",
    category: "operations",
    description:
      "FHE arithmetic: add/sub/mul, ciphertext-scalar vs ciphertext-ciphertext costs, division constraints, euint64 limits, and operation chaining.",
    source: REPO_SLUG,
    path: arithmeticPaths.path,
    rawUrl: arithmeticPaths.rawUrl,
    githubUrl: arithmeticPaths.githubUrl,
    covers: [
      "Lists supported vs unsupported FHE operations with type constraints",
      "Explains why ciphertext-scalar is far cheaper than ciphertext-ciphertext",
      "Shows division requires a plaintext divisor (no encrypted denominators)",
      "Covers euint64 overflow behavior and safe arithmetic patterns",
    ],
    docs: [
      { label: "Operations", href: ZAMA_DOCS.operations },
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
    ],
  },
  {
    id: "fhevm-testing",
    name: "fhevm-testing",
    topic: "fhevm",
    category: "operations",
    description:
      "Testing FHE contracts: Hardhat plugin, mock utils, mocked vs real protocol, debug decrypt, and end-to-end validation.",
    source: REPO_SLUG,
    path: testingPaths.path,
    rawUrl: testingPaths.rawUrl,
    githubUrl: testingPaths.githubUrl,
    covers: [
      "Shows @fhevm/hardhat-plugin and @fhevm/mock-utils setup for local testing",
      "Explains mocked mode vs real protocol: what each catches and misses",
      "Covers debug decrypt for inspecting encrypted values during development",
      "Guides end-to-end validation on testnet before mainnet deployment",
    ],
    docs: [
      { label: "Testing", href: ZAMA_DOCS.testing },
      { label: "Examples", href: ZAMA_DOCS.examples },
    ],
  },
  {
    id: "fhevm-token-registry",
    name: "fhevm-token-registry",
    topic: "fhevm",
    category: "operations",
    description:
      "Looking up official Zama confidential token deployments, wrappers registry addresses, decimals, and safe indexer start blocks on Sepolia or mainnet.",
    source: REPO_SLUG,
    path: tokenRegistryPaths.path,
    rawUrl: tokenRegistryPaths.rawUrl,
    githubUrl: tokenRegistryPaths.githubUrl,
    covers: [
      "Looks up official plain-token and confidential-token addresses by network",
      "Keeps `c*` token decimals and start blocks aligned with the right deployment",
      "Uses the wrappers registry as the canonical validation layer for official confidential tokens",
      "Prevents wrong-network or wrong-token wiring in apps, indexers, scripts, and test fixtures",
    ],
    docs: [
      { label: "Wrapper registry", href: ZAMA_DOCS.wrapperRegistry },
      { label: "ERC7984 integration", href: ZAMA_DOCS.erc7984 },
    ],
  },

  // ---------------------------------------------------------------------------
  // Advanced Patterns
  // ---------------------------------------------------------------------------
  {
    id: "fhevm-frontend-integration",
    name: "fhevm-frontend-integration",
    topic: "fhevm",
    category: "advanced",
    description:
      "Integrating the Zama SDK into web apps: React, Next.js, relayer setup, SSR boundaries, and browser-side encryption.",
    source: REPO_SLUG,
    path: frontendPaths.path,
    rawUrl: frontendPaths.rawUrl,
    githubUrl: frontendPaths.githubUrl,
    covers: [
      "Shows @zama-fhe/react-sdk and @zama-fhe/sdk setup in React and Next.js",
      "Explains SSR boundaries: SDK must run client-side only",
      "Covers relayer SDK integration for reencryption and decryption",
      "Guides WalletConnect vs Privy auth patterns for different user bases",
    ],
    docs: [
      { label: "Web app guide", href: ZAMA_DOCS.webapp },
      { label: "Relayer guides", href: ZAMA_DOCS.relayerGuides },
    ],
  },
  {
    id: "fhevm-cross-contract",
    name: "fhevm-cross-contract",
    topic: "fhevm",
    category: "advanced",
    description:
      "Passing encrypted handles between contracts: multi-contract ACL flows, DeFi composability, and permission chain patterns.",
    source: REPO_SLUG,
    path: crossContractPaths.path,
    rawUrl: crossContractPaths.rawUrl,
    githubUrl: crossContractPaths.githubUrl,
    covers: [
      "Explains how to pass encrypted handles across contract boundaries",
      "Shows multi-contract ACL grant chains: allowTransient for immediate forwarding",
      "Covers factory and proxy patterns that preserve encrypted state",
      "Guides composable DeFi flows where encrypted values traverse multiple protocols",
    ],
    docs: [
      { label: "ACL semantics", href: ZAMA_DOCS.acl },
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
    ],
  },
  {
    id: "oz-erc7984-confidential-governance",
    name: "oz-erc7984-confidential-governance",
    topic: "oz-erc7984",
    category: "advanced",
    description:
      "Confidential governance: ERC7984Votes, encrypted voting power, public delegation, private ballot casting, and tally patterns.",
    source: REPO_SLUG,
    path: governancePaths.path,
    rawUrl: governancePaths.rawUrl,
    githubUrl: governancePaths.githubUrl,
    covers: [
      "Explains ERC7984Votes: delegation is public but voting power stays encrypted",
      "Shows private ballot casting without revealing token holdings",
      "Covers tally and reveal patterns for confidential vote counting",
      "Guides integration with existing DAO governance frameworks",
    ],
    docs: [
      { label: "ERC7984 integration", href: ZAMA_DOCS.erc7984 },
      { label: "Examples", href: ZAMA_DOCS.examples },
    ],
  },
  {
    id: "oz-erc7984-custodian-omnibus",
    name: "oz-erc7984-custodian-omnibus",
    topic: "oz-erc7984",
    category: "advanced",
    description:
      "Omnibus and custodian patterns: ERC7984Omnibus, sub-account management, exchange custody, and reconciliation under encryption.",
    source: REPO_SLUG,
    path: custodianPaths.path,
    rawUrl: custodianPaths.rawUrl,
    githubUrl: custodianPaths.githubUrl,
    covers: [
      "Explains ERC7984Omnibus for managing sub-accounts under one on-chain address",
      "Shows exchange deposit and withdrawal flows with encrypted amounts",
      "Covers per-user accounting within omnibus wallets",
      "Guides reconciliation and audit patterns under encrypted custodian state",
    ],
    docs: [
      { label: "ERC7984 integration", href: ZAMA_DOCS.erc7984 },
      { label: "Examples", href: ZAMA_DOCS.examples },
    ],
  },

  // ---------------------------------------------------------------------------
  // OpenZeppelin Confidential Contracts Utilities
  // ---------------------------------------------------------------------------
  {
    id: "oz-utils-safemath",
    name: "oz-utils-safemath",
    topic: "oz-utils",
    category: "operations",
    description:
      "Overflow-safe encrypted arithmetic with the OpenZeppelin FHESafeMath library: tryIncrease, tryDecrease, tryAdd, trySub, uninitialized-handle semantics, and when to prefer it over raw FHE.add/sub.",
    source: REPO_SLUG,
    path: safemathPaths.path,
    rawUrl: safemathPaths.rawUrl,
    githubUrl: safemathPaths.githubUrl,
    covers: [
      "Wraps raw FHE.add/sub with encrypted success flags so overflow does not corrupt balances",
      "Distinguishes tryIncrease/tryDecrease (fall back to old value) from tryAdd/trySub (fall back to zero)",
      "Explains uninitialized-handle semantics so mappings with unset slots stay correct",
      "Calls out the ACL plumbing the library does NOT do for you",
    ],
    docs: [
      { label: "Operations", href: ZAMA_DOCS.operations },
      { label: "Solidity guides", href: ZAMA_DOCS.solidityGuides },
    ],
  },
];
