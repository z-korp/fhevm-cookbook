# FHEVM Cookbook Router

This repository is a thin builder and agent layer for Zama FHEVM workflows.

Start with the canonical router skill:

- `skills/fhevm-router/SKILL.md`

Focused local skills also shipped in this repo:

### Core FHE Mechanics

- `skills/oz-erc7984-confidential-tokens/SKILL.md` — confidential token architecture, wrappers, operators, transfer variants, and unwrap correctness
- `skills/fhevm-privacy-constraints/SKILL.md` — incentives, analytics, ACL limits, and privacy-accountability tradeoffs
- `skills/fhevm-acl-lifecycle/SKILL.md` — ACL permissions, handle lifecycle, allow/allowThis/allowTransient
- `skills/fhevm-control-flow/SKILL.md` — FHE.select, silent fallback, non-reverting failure patterns
- `skills/fhevm-encrypted-inputs/SKILL.md` — FHE.fromExternal, input proofs, encrypted user input ingestion

### Decryption Patterns

- `skills/fhevm-user-decryption/SKILL.md` — off-chain reencryption, EIP-712 auth, React hooks
- `skills/fhevm-public-decryption/SKILL.md` — two-step decrypt-verify-finalize, proof verification

### Security & Compliance

- `skills/fhevm-security-audit/SKILL.md` — audit checklist, footgun catalog, ACL and fallback tracing
- `skills/oz-erc7984-compliance-patterns/SKILL.md` — ObserverAccess, Freezable, Restricted, Rwa, institutional adoption

### Operations

- `skills/fhevm-arithmetic-ops/SKILL.md` — FHE arithmetic, ciphertext-scalar, division constraints, overflow
- `skills/fhevm-testing/SKILL.md` — Hardhat plugin, mock utils, debug decrypt, E2E validation
- `skills/fhevm-token-registry/SKILL.md` — official confidential token addresses, decimals, start blocks, wrappers registry

### Advanced Patterns

- `skills/fhevm-frontend-integration/SKILL.md` — Zama SDK, React/Next.js, WASM, wallet providers
- `skills/fhevm-cross-contract/SKILL.md` — encrypted handle passing, multi-contract ACL, composability
- `skills/oz-erc7984-confidential-governance/SKILL.md` — ERC7984Votes, encrypted voting power, private ballots
- `skills/oz-erc7984-custodian-omnibus/SKILL.md` — ERC7984Omnibus, sub-accounts, exchange custody

### OZ Utilities

- `skills/oz-utils-safemath/SKILL.md` — FHESafeMath library for overflow-safe encrypted `euint64` arithmetic

Use the router to triage tasks such as:

1. contract authoring with encrypted types and ACL
2. user decryption in a frontend or web app
3. public decryption plus onchain finalization
4. relayer web app setup
5. ERC7984 wallet and exchange integration
6. testing and security review
7. compliance and regulatory controls
8. cross-contract composition
9. confidential governance
