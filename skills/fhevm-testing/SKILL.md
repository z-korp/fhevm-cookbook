---
name: fhevm-testing
description: "Use when writing, structuring, or debugging tests for FHEVM contracts. Covers mocked mode vs real protocol, Hardhat decrypt helpers, input encryption in tests, and the false-confidence gap between local and testnet behavior."
---

# Testing FHE Contracts with Hardhat

Use this skill when setting up a test suite for FHEVM contracts, deciding between mocked and
real protocol testing, or diagnosing why tests pass locally but fail on testnet. The encryption
layer introduces bugs that only surface under specific runtime conditions.

## When To Use

- Setting up a Hardhat test suite for an FHEVM contract
- Choosing between mocked mode and real protocol testing
- Debugging a test that passes locally but fails on testnet
- Writing tests for ACL flows, encrypted inputs, or decryption paths

## Core Mental Model

The Hardhat plugin gives you two local mock modes plus one real-encryption mode:

- Hardhat in-memory network: mock encryption, fast, ephemeral
- Hardhat node / `localhost`: mock encryption, persistent, useful for local app integration
- Sepolia testnet: real encryption, real relayer/coprocessor path

Neither mocked mode is sufficient alone. Mocked modes give fast feedback on logic. Sepolia
catches ACL, gas, and timing bugs that mocked execution structurally cannot.

Think of mocked mode as a type-checker. Think of real protocol as an integration test.

## Hard Constraints

1. Mocked modes do NOT give trustworthy ACL coverage. Handles that would fail under real ACL checks can appear to work locally.
2. Mocked modes do NOT reflect real gas costs. FHE operations are orders of magnitude more expensive than mocked arithmetic.
3. Mocked modes do NOT reproduce real relayer/coprocessor latency or off-chain sequencing. Real decrypt/finalize flows need Sepolia coverage.
4. The canonical Hardhat-side decrypt helpers are exposed through `hre.fhevm` (`userDecryptEuint`, `userDecryptEbool`, `userDecryptEaddress`). Treat any additional mock debug helpers as local-only diagnostics, not onchain APIs.
5. A green mocked suite is necessary but not sufficient. It proves logic correctness, not deployment readiness.

## Tooling

- `@fhevm/hardhat-plugin` — Hardhat integration for local FHE testing
- `@fhevm/mock-utils` — Mock FHE operations and debug helpers for unit tests

```javascript
// hardhat.config.js — mocked mode is the default, no coprocessor needed
require("@fhevm/hardhat-plugin");
module.exports = { solidity: "0.8.24", defaultNetwork: "hardhat" };
```

### Input Encryption in Tests

Prefer the official Hardhat runtime API from `hre.fhevm` / `import { fhevm } from "hardhat"`:

```javascript
const { fhevm } = require("hardhat");
const input = fhevm.createEncryptedInput(contractAddress, signerAddress);
input.add64(1000n);
const enc = await input.encrypt();
await contract.transfer(recipient, enc.handles[0], enc.inputProof);
```

`@fhevm/mock-utils` is the underlying mock library, but for test suites the official docs now
lead with the Hardhat plugin API rather than importing low-level mock helpers directly.

### Test Decrypt Helpers

Prefer the Hardhat decrypt helpers when you want test assertions that match the actual decrypt
flow more closely:

```javascript
const { fhevm } = require("hardhat");
const { FhevmType } = require("@fhevm/hardhat-plugin");

const handle = await token.balanceOf(alice.address);
const clearBalance = await fhevm.userDecryptEuint(
  FhevmType.euint64,
  handle,
  contractAddress,
  alice
);
```

If your setup exposes mock debug decrypt helpers, treat them as local inspection tools for
diagnosis, not as proof that the real user decryption flow works.

## Mocked vs Real Protocol Comparison

| Dimension | Mocked Mode | Real Protocol (Testnet) |
|-----------|-------------|------------------------|
| Setup | `npx hardhat test --network hardhat` or `--network localhost` -- no real encryption | Testnet RPC, funded accounts, real relayer/coprocessor path |
| Speed | Fast local feedback | Slower due to real off-chain round-trips |
| FHE arithmetic | Simulated locally -- correct results | Real coprocessor -- correct results |
| ACL enforcement | Not representative of real ACL boundaries | Real ACL enforced |
| Gas costs | Not representative of real FHE costs | Realistic and materially higher |
| Async decrypt timing | Local mock execution, no representative off-chain latency | Real latency, separate off-chain step and follow-up tx |
| Cross-contract ACL | Works without grants (false positive) | Requires explicit `allowTransient`/`allow` |
| What it proves | Logic correctness, arithmetic, control flow | Deployment readiness, ACL correctness, gas feasibility |

### Bugs mocked mode structurally cannot catch

A green mocked suite can still hide these classes of bugs. Plan dedicated testnet coverage for each:

- **Missing `FHE.allowThis` / `FHE.allow`** — mocked flows can appear to work despite missing grants. On testnet the next read, decrypt, or downstream computation fails.
- **Stale ACL after a new handle is written** — a balance update produces a new handle; if `FHE.allow(newHandle, user)` is missing, user decryption breaks only in production.
- **Cross-contract ACL gaps** — contract A hands a handle to contract B without `allowTransient` / `allow`; contract B fails at the real coprocessor boundary.
- **Async decrypt sequencing** — mocked local flows do not model the real off-chain wait and follow-up transaction timing. Contracts or UIs that assume immediate finalization break on testnet.
- **Relayer failure modes** — user and public decryption require a reachable relayer; mocked runs never touch one.
- **End-to-end relayer / coprocessor behavior** — mocked mode simulates input proof handling locally, but it does not exercise the real off-chain services or their timing/failure modes.
- **Real gas cost explosions** — one extra ciphertext-ciphertext multiply may push a transaction past the block gas limit. Mocked gas numbers are meaningless.

## Test Patterns

### Test ACL Flows Explicitly

```javascript
it("grants ACL to recipient after transfer", async function () {
  await token.connect(sender).transfer(recipient, encAmount, proof);
  const canDecrypt = await acl.isAllowed(await token.balanceOf(recipient), recipient.address);
  expect(canDecrypt).to.be.true;
});
```

### Test Silent Fallback Paths

Many encrypted token flows implement failure paths via `FHE.select` rather than reverting on the
encrypted condition itself:

```javascript
it("insufficient balance results in zero transfer", async function () {
  await token.connect(sender).transfer(recipient, encAmount200, proof);
  const senderHandle = await token.balanceOf(sender.address);
  const balance = await fhevm.userDecryptEuint(
    FhevmType.euint64,
    senderHandle,
    contractAddress,
    sender
  );
  expect(balance).to.equal(100n); // unchanged — transfer silently failed
});
```

### Test Overflow Behavior

Encrypted arithmetic wraps on overflow. Test boundaries if your contract does not guard them.

## E2E Validation on Testnet

Before mainnet, run these on testnet with the real coprocessor:

1. Full transfer cycle: encrypt, submit, verify recipient can decrypt
2. Cross-contract flows: verify ACL grants propagate correctly
3. Async public decryption: verify off-chain timing and finalization
4. Gas profiling: measure actual FHE operation costs against block limits

Do not treat testnet runs as optional.

## Pre-Deployment Checklist

Treat these as signoff gates, not aspirations. A single missing item can mean funds-at-risk on mainnet.

**Gate 1 — Mocked suite (fast feedback, logic only)**

- [ ] All functional paths tested, including silent-failure branches (insufficient balance, zero transfers, overflow)
- [ ] Every `FHE.select` has at least one test that exercises the false branch
- [ ] Mock-only debugger helpers are used for diagnostics only, never as the sole assertion
- [ ] Tests cover every branch that modifies encrypted state

**Gate 2 — Testnet suite with real coprocessor (integration, must catch what mocked cannot)**

- [ ] Full encrypt → submit → decrypt round trip verified for every user-facing flow
- [ ] Every stored handle is reachable via user decryption from a fresh frontend session (catches missing `FHE.allow`)
- [ ] Cross-contract flows verified end-to-end with real ACL (no transient grants outliving their transaction, no missing `allowThis` on the receiving side)
- [ ] Every async decrypt / public decryption flow exercised — both happy path and finalization never submitted
- [ ] `inputProof` rejection tested with a mismatched sender and a mismatched contract address
- [ ] Gas profiled under realistic load; no hot path approaches the practical gas ceiling on the target network
- [ ] Relayer downtime simulated — frontend degrades gracefully

**Gate 3 — Pre-mainnet review**

- [ ] `fhevm-security-audit` checklist completed against the final code
- [ ] Every finding from mocked/testnet gates resolved, not waived
- [ ] Monitoring and alerting configured for relayer health and pending public-decryption finalizations

Ship only when all three gates pass. Mocked-mode green with no testnet run is a common path to a production incident.

## Anti-Patterns

### Anti-Pattern 1: 100% Mocked, 0% Testnet

False confidence. ACL bugs, gas issues, and timing problems surface in production.

### Anti-Pattern 2: Mock-Only Decrypt Inspection as Only Assertion

Tests validate nothing about real user experience if every assertion relies on mock-only decrypt inspection.

### Anti-Pattern 3: Skipping Silent Failure Tests

Without failure-path tests, you have no idea what happens when contract-specific encrypted flows
fall back, transfers fail, or ACL access is missing.

### Anti-Pattern 4: Gas Estimates From Mocked Mode

Mocked FHE costs near-zero gas. Real contracts may exceed block gas limits.

## Review Checklist

- Does the suite cover both mocked mode (logic) and testnet (integration)?
- Are ACL grants tested explicitly, not assumed from logic correctness?
- Are silent failure paths (insufficient balance, overflow) tested?
- Are mock-only debugger helpers used for diagnostics, not as a substitute for real decrypt tests?
- Are gas costs profiled on testnet for FHE-heavy operations?
- Do cross-contract tests verify handle accessibility at each boundary?

## Output Expectations

When applying this skill, structure test plans around:

1. what the mocked suite validates (logic, arithmetic, control flow)
2. what it cannot validate (ACL, gas, timing)
3. which flows must be tested on testnet before deployment
4. where mock-only decrypt inspection masks a real test gap

## Related Skills

- `skills/fhevm-acl-lifecycle/SKILL.md` — the class of bugs mocked mode cannot catch
- `skills/fhevm-security-audit/SKILL.md` — what to assert against, especially silent fallbacks
