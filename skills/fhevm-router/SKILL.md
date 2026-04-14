---
name: fhevm-router
description: Routes Zama FHEVM tasks to the right official docs path and next step
---

# fhevm-router

Use this router when you are working on Zama FHEVM and need the smallest correct next step.

Use this router when the task has not yet been narrowed to a more specific local skill. Only rely
on specialist cookbook modules that are actually present in this repo's `skills/` directory —
do not route to a module that has not been installed.

Specialist modules in this cookbook:

- `oz-erc7984-confidential-tokens`
- `fhevm-privacy-constraints`
- `fhevm-acl-lifecycle`
- `fhevm-control-flow`
- `fhevm-encrypted-inputs`
- `fhevm-user-decryption`
- `fhevm-public-decryption`
- `fhevm-frontend-integration`
- `fhevm-arithmetic-ops`
- `fhevm-security-audit`
- `oz-erc7984-compliance-patterns`
- `fhevm-testing`
- `fhevm-cross-contract`
- `oz-erc7984-confidential-governance`
- `oz-erc7984-custodian-omnibus`
- `fhevm-token-registry`
- `oz-utils-safemath`

## What this skill does

1. identifies whether the task is contract-side, frontend-side, wallet-side, or review-oriented
2. points to the narrowest official Zama docs page or pages that match the task
3. points back to the official Zama docs that should remain the source of truth
4. keeps the installed skill set explicit instead of routing to modules that aren't available

## Decision tree: pick the right specialist skill

Work top-down. Start with the first matching row, then add any other relevant skills. If
nothing matches, fall back to the Zama docs below.

1. **Auditing or reviewing contract code for correctness?**
   → `fhevm-security-audit` (then pull in any domain-specific skill below)
2. **Product design: can this feature even exist given what FHE hides?**
   → `fhevm-privacy-constraints` before anything else
3. **Contract authoring — choose by what the code is doing:**
   - granting `FHE.allow` / `allowThis` / `allowTransient`, debugging inaccessible handles → `fhevm-acl-lifecycle`
   - accepting `externalEuint64` + `inputProof` from a user → `fhevm-encrypted-inputs`
   - `FHE.add`/`sub`/`mul`/`div`, comparisons, overflow, type casts → `fhevm-arithmetic-ops`
   - overflow-safe balance updates on encrypted `euint64` (tryIncrease/tryDecrease/tryAdd/trySub) → `oz-utils-safemath`
   - replacing `if` / `require` with `FHE.select`, handling silent fallbacks → `fhevm-control-flow`
   - passing handles across contracts, multi-contract ACL flows → `fhevm-cross-contract`
4. **Decryption — which side needs the plaintext?**
   - user's browser reading their own state (read-only, no gas) → `fhevm-user-decryption`
   - contract must act on plaintext (unwrap, settlement, two-step + proof) → `fhevm-public-decryption`
5. **Frontend / SDK integration (WASM, SSR, wallet, encryption hooks)** → `fhevm-frontend-integration`
6. **Known token deployment lookup (address, underlying ERC20, decimals, start block, wrappers registry)**
   → `fhevm-token-registry`
7. **Tests pass locally but fail on testnet; deciding mocked vs real protocol** → `fhevm-testing`
8. **Regulatory / compliance controls (observers, freezing, blocklists, RWA)** → `oz-erc7984-compliance-patterns`
9. **Building a specific application:**
   - confidential fungible token (ERC7984, wrappers, operators, unwrap) → `oz-erc7984-confidential-tokens`
   - governance with encrypted voting power (ERC7984Votes) → `oz-erc7984-confidential-governance`
   - exchange custody, omnibus accounts, sub-account ledgers → `oz-erc7984-custodian-omnibus`

If the task spans multiple rows (common), start with the first applicable row above, then add any
other relevant skills in that same order: audit first, then product framing, then mechanics, then
application.

## Route by task

1. Contract authoring with encrypted types, ACL, and inputs
   - Keep open: https://docs.zama.org/protocol/solidity-guides/smart-contract/configure
   - Keep open: https://docs.zama.org/protocol/solidity-guides/smart-contract/acl
   - Keep open: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input
2. Frontend or app-side user decryption
   - Keep open: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption
3. Public decryption plus onchain verification and state finalization
   - Keep open: https://docs.zama.org/protocol/solidity-guides/smart-contract/oracle
   - Keep open: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/public-decryption
4. Relayer SDK setup inside React or Next.js
   - Keep open: https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/webapp
   - Keep open: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization
5. Wallet or exchange support for ERC7984 flows
   - Keep open: https://docs.zama.org/protocol/examples/integration-guide
6. Known confidential token deployment or wrappers registry lookup
   - Use `fhevm-token-registry` as the source of truth for deployment addresses, decimals, and start blocks
   - Keep open: https://docs.zama.org/protocol/protocol-apps/registry-contract
7. Testing or debugging
   - Keep open: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/write_test
   - Keep open: https://docs.zama.org/protocol/solidity-guides/development-guide/hardhat/run_test
8. Security review
   - Keep open: https://docs.zama.org/protocol/solidity-guides/smart-contract/acl
   - Keep open: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input
   - Keep open: https://docs.zama.org/protocol/solidity-guides/smart-contract/oracle

## Operating rules

1. start with the first matching row, then add any other relevant skills
2. cite the exact official Zama docs page for protocol semantics and API details
3. keep ACL, trust boundaries, and decryption boundaries explicit
4. if the task spans contract and frontend work, split the plan by boundary before writing code
5. if a specialized cookbook module is not installed, stay in router mode and work from docs

## Local skill handoff

### Core FHE Mechanics

1. For ACL grants, handle permissions, FHE.allow/allowThis/allowTransient, and debugging inaccessible handles:
   use `fhevm-acl-lifecycle`
2. For client-side encryption, FHE.fromExternal, inputProof binding, and external vs onchain handles:
   use `fhevm-encrypted-inputs`
3. For FHE arithmetic (add/sub/mul/div), comparisons, bitwise ops, overflow, and type casting:
   use `fhevm-arithmetic-ops`
4. For replacing if/else/require with FHE.select, silent-failure semantics, and encrypted branching:
   use `fhevm-control-flow`

### Decryption

5. For client-side balance display, useUserDecrypt hook, reencryption protocol, and read-only decryption:
   use `fhevm-user-decryption`
6. For two-step public decryption, makePubliclyDecryptable, checkSignatures, and unwrap finalization:
   use `fhevm-public-decryption`

### Tokens & Privacy

7. For ERC7984 token design, wrappers, operators, transfer variants, and unwrap correctness:
   use `oz-erc7984-confidential-tokens`
8. For rewards, analytics, balance inference limits, ACL-driven product constraints, and privacy tradeoffs:
   use `fhevm-privacy-constraints`

### Security & Compliance

9. For auditing FHEVM contracts — ACL completeness, silent fallbacks, handle lifecycle, and security review:
   use `fhevm-security-audit`
10. For regulatory compliance — observer access, freezing, blocklists, allowlists, and RWA controls:
    use `oz-erc7984-compliance-patterns`

### Operations

11. For testing FHE contracts — Hardhat plugin, mock utils, debug decrypt, and E2E validation:
    use `fhevm-testing`
12. For overflow-safe encrypted arithmetic on `euint64` with the OZ FHESafeMath library (tryIncrease / tryDecrease / tryAdd / trySub):
    use `oz-utils-safemath`

### Frontend & Advanced

13. For Zama SDK initialization, client-side encryption/decryption, WASM setup, and wallet integration:
    use `fhevm-frontend-integration`
14. For passing encrypted handles between contracts, multi-contract ACL flows, and DeFi composability:
    use `fhevm-cross-contract`
15. For confidential governance — ERC7984Votes, encrypted voting power, and private ballot casting:
    use `oz-erc7984-confidential-governance`
16. For omnibus and custodian patterns — ERC7984Omnibus, sub-accounts, and exchange custody:
    use `oz-erc7984-custodian-omnibus`
17. For looking up Zama confidential token addresses, their underlying ERC20, decimals, or deployment start blocks on Sepolia or mainnet:
    use `fhevm-token-registry`

## Fallback overviews

Use these only when no narrower page above clearly fits the task:

1. Solidity guides: https://docs.zama.org/protocol/solidity-guides
2. Relayer SDK guides: https://docs.zama.org/protocol/relayer-sdk-guides
3. Examples: https://docs.zama.org/protocol/examples
