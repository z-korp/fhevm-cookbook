---
name: fhevm-security-audit
description: "Use when auditing or reviewing FHEVM contracts for correctness, security, and privacy — covering ACL completeness, silent fallbacks, handle lifecycle, unwrap flows, and common footguns."
---

# FHE Security Audit

Use this skill when reviewing FHEVM contract code for correctness and security issues.
FHE contracts fail differently from plaintext Solidity. Many bugs are silent — no revert,
no obvious error, just wrong encrypted state that nobody can detect until decryption.

## When To Use

- Auditing a new FHEVM contract before deployment
- Reviewing a pull request that modifies encrypted state logic
- Investigating unexpected behavior in an existing FHEVM contract
- Verifying that ACL grants are complete across all code paths
- Checking that unwrap or decryption flows cannot be exploited
- Validating that events do not leak private information

## Core Mental Model

An FHEVM audit traces **handles**, not values. You cannot inspect what an encrypted value
contains. Instead, you trace the lifecycle of each handle: where it is created, what
operations consume it, what new handles those operations produce, who gets ACL access,
and where the handle is stored or discarded.

Every handle that exists without ACL access is a dead value. Every `FHE.select` with an
undocumented false branch is a latent bug. Every plaintext used after an encrypted check
without proof verification is a security hole.

## Hard Constraints

1. `require()` cannot branch on `ebool`. Any code that attempts this is broken.
2. `FHE.select` does not revert on the false branch. It silently returns the fallback (usually zero).
3. Encrypted division requires a plaintext divisor. Encrypted divisors revert or produce incorrect results.
4. Every FHE operation returns a new handle. The old handles still exist but are not the result.
5. Handles without ACL grants are inaccessible. They exist on the coprocessor but cannot be decrypted or used cross-transaction.

## Audit Procedure: ACL Completeness

For every function that performs FHE operations:

1. List every FHE operation call (`FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.select`, etc.)
2. For each, identify the returned handle
3. Verify the handle receives appropriate ACL grants:
   - `FHE.allowThis(handle)` if the contract needs it in future calls
   - `FHE.allow(handle, address)` for each party that must decrypt or reuse it
4. Verify the handle is stored in contract state if it persists across transactions

```solidity
// AUDIT: trace handles
euint64 newBalance = FHE.sub(balance, amount);    // new handle created
FHE.allowThis(newBalance);                         // contract can reuse
FHE.allow(newBalance, account);                    // user can decrypt
balances[account] = newBalance;                    // stored in state
// PASS: handle is granted, stored, and accessible
```

For a balance-style handle (written to state, read back next transaction, decrypted by the owner), missing any of these grants is a bug. For handles that are write-only or never reused, scope each grant to the access that is actually needed. The severity depends on who loses access.

## Audit Procedure: Silent Fallback Analysis

For every `FHE.select` call:

1. Identify the condition (`ebool`)
2. Identify the true-branch value and the false-branch value
3. Document what happens downstream when the false branch executes
4. Determine whether the silent zero (or other fallback) creates an exploitable state

```solidity
ebool hasEnough = FHE.ge(balance, amount);
euint64 actual = FHE.select(hasEnough, amount, FHE.asEuint64(0));
euint64 newBalance = FHE.sub(balance, actual);
// False branch: actual = 0, newBalance = balance (unchanged)
// Question: does the caller know the transfer silently failed?
// Question: does any event or state change misleadingly suggest success?
```

If the false branch produces a misleading success signal, flag it.

## Audit Procedure: Two-Step Unwrap Verification

Any flow that converts encrypted state to plaintext assets must use two steps.

**Step 1** (onchain):
- User submits encrypted request
- Contract computes the encrypted releasable amount using `FHE.select`
- Contract stores the result handle and grants ACL for decryption

**Off-chain**:
- An off-chain caller requests public decryption through the relayer SDK
- The caller obtains plaintext plus cryptographic proof

**Step 2** (onchain):
- User submits plaintext plus proof
- Contract verifies proof matches the stored encrypted result
- Only then does the contract release public assets

**The critical check**: does the contract verify the proof BEFORE using the plaintext?
If it uses the user-claimed plaintext without proof verification, the user can claim
any amount regardless of their actual encrypted balance.

## Top 10 Common Footguns

The bugs below show up repeatedly in FHEVM code review. Scan every change against this list
before approving.

| # | Footgun | Severity | Impact |
| - | ------- | -------- | ------ |
| 1 | Single-step unwrap (no proof verification) | Critical | User can claim any amount, drains funds |
| 2 | Trust user-supplied plaintext after encrypted check | Critical | Bypasses `FHE.select` protection entirely |
| 3 | Emit decrypted plaintext in events | Critical | Permanently publishes private data onchain |
| 4 | Missing or bypassed input-proof binding | Critical | Attacker submits arbitrary ciphertext or wrong-context input |
| 5 | Missing `FHE.allow(handle, user)` after balance update | High | User's previous ACL pointed at a stale handle; decrypt silently fails |
| 6 | Missing `FHE.allowThis` on stored handles | High | Contract cannot reuse its own computed values in later transactions |
| 7 | Encrypted divisor in `FHE.div` / `FHE.rem` | High | Reverts or produces incorrect results — not supported |
| 8 | `require()` on `ebool` | High | Will not compile, or caller bypasses the intended check |
| 9 | Undocumented `FHE.select` false branch creates misleading success | High | Silent zero looks like a successful operation to downstream code and UI |
| 10 | Leak balance through request amount on failed unwrap | Medium-High | Public request + zero result implies `balance < request`, leaks a bound |

When a finding maps to one of these, cite the row by number in the audit report — it gives
reviewers a shared vocabulary and makes repeated patterns obvious across audits.

## Audit Procedure: Input Validation

For every function that accepts `externalEuint64` plus `inputProof`:

1. Verify the proof is validated against `msg.sender` (the submitter)
2. Verify the proof is validated against the contract address
3. Check that the encrypted input is not reusable across contracts or users

If `inputProof` validation is missing, an attacker can submit arbitrary ciphertext.

## Audit Procedure: Event Privacy

For every event emission: verify no plaintext values derived from encrypted state appear
in event parameters. Emitting handles as `uint256` is safe (opaque). Emitting decrypted
amounts, balances, or comparison results permanently leaks private data onchain.

## Audit Procedure: Arithmetic Overflow

For every multiplication chain: calculate maximum operand values, verify the product fits
`euint64` (2^64 - 1) or that `euint128` is used, and confirm the contract intentionally
handles wraparound if it relies on raw FHE arithmetic.

## Code Review Red Flags

Quick-scan patterns that should trigger deeper investigation:

| Red Flag | What to Investigate |
| -------- | ------------------- |
| `require` near any `ebool` or `euint*` variable | Likely attempting to branch on encrypted value |
| `FHE.div` with a variable (not constant) second argument | May be encrypted divisor |
| State assignment without nearby `FHE.allowThis` | Missing ACL on stored handle |
| Single function that accepts plaintext and releases assets | Possible single-step unwrap vulnerability |
| Event with `uint256` parameter in encrypted context | May be emitting plaintext from encrypted state |
| `FHE.select` without NatSpec comment | Undocumented silent fallback path |
| `FHE.mul` of two non-scalar operands without `euint128` | Potential overflow |
| No `FHE.allow(handle, msg.sender)` after balance update | User cannot decrypt their own balance |
| Finalize function that trusts `msg.sender` without binding pending state | Public-decryption follow-up tx can be submitted by any caller or proxy unless the contract ties state to the intended beneficiary |
| Handle passed to external contract without `FHE.allow` | Cross-contract handle will be inaccessible |

## Anti-Patterns

### Anti-Pattern 1: Trust User-Supplied Plaintext After Encrypted Check

The contract runs `FHE.select` to validate, then uses a separate user-supplied plaintext
for the actual operation. This bypasses the encrypted check entirely.

### Anti-Pattern 2: Grant ACL Only to Contract, Not to User

`FHE.allowThis` without `FHE.allow(handle, user)`. The user cannot decrypt their own
balance. Computed correctly but invisible.

### Anti-Pattern 3: Emit Decrypted Values in Events

Logging plaintext from async public-decryption finalization permanently publishes private data onchain.

### Anti-Pattern 4: Reuse Input Proof Across Contracts Or Users

Each `inputProof` is bound to a specific `msg.sender` and contract address. Reusing it under a
different user or contract context breaks the intended flow. Reviewers should verify the code
relies on `FHE.fromExternal` rather than trying to bypass proof binding.

## Review Checklist

- [ ] Every FHE operation's returned handle has appropriate ACL grants
- [ ] Every `FHE.select` has documented false-branch behavior
- [ ] No `require()` is called on `ebool` values
- [ ] Every unwrap/decryption flow is two-step with proof verification before asset release
- [ ] Every `FHE.div` / `FHE.rem` uses a plaintext divisor
- [ ] Every `inputProof` is validated against `msg.sender` and contract address
- [ ] No event emits plaintext values derived from encrypted state
- [ ] Overflow bounds are documented for multiplication chains
- [ ] `FHE.allowThis` is called for handles the contract reuses across transactions
- [ ] No user-supplied plaintext is trusted without proof verification

## Output Expectations

When applying this skill, produce an audit report structured as:

1. handle lifecycle trace: creation, ACL, storage, consumption
2. silent fallback inventory: every `FHE.select` and its false-branch consequence
3. trust boundary map: where plaintext enters, where proof verification happens
4. findings: severity (Critical / High / Medium / Low), location, description, fix

## Related Skills

- `skills/fhevm-acl-lifecycle/SKILL.md` — ACL completeness is the most common audit finding
- `skills/fhevm-control-flow/SKILL.md` — silent fallback analysis
- `skills/fhevm-public-decryption/SKILL.md` — two-step unwrap verification
- `skills/fhevm-privacy-constraints/SKILL.md` — whether the promised privacy is actually delivered
