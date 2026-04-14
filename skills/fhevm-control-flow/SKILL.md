---
name: fhevm-control-flow
description: "Use when replacing if/else, require, or any conditional logic that depends on encrypted values in FHEVM. Covers FHE.select as the inline branching primitive, fallback semantics on encrypted conditions, and async public decryption when logic must branch back to plaintext state."
---

# FHE Control Flow

Use this skill when writing or reviewing any Solidity logic that needs to branch on
encrypted conditions. Normal Solidity control flow does not work with encrypted values.
Every `if`, `require`, and ternary operator on encrypted state must be replaced with
`FHE.select` for inline encrypted branching, or with an async public-decryption flow if the
result must drive plaintext business logic.

## When To Use

- Replacing `if/else` blocks that depend on encrypted balances or state
- Replacing `require()` guards that check encrypted conditions
- Designing error handling and user feedback for confidential operations
- Reviewing contracts for illegal branching on encrypted values
- Planning product UX around silent-failure semantics

## Core Mental Model

In standard Solidity, a failed guard often reverts immediately. In FHEVM, a guard that depends
on encrypted data cannot directly revert on that encrypted condition. Instead, the contract
usually computes a fallback value with `FHE.select`.

This is not a bug. This is the fundamental tradeoff of computing on encrypted data: the
contract cannot see the values, so it cannot branch inline on them like plaintext Solidity.
The false branch often becomes a no-op or a capped/clamped result, but later public checks can
still revert normally.

## Hard Constraints

1. `require(encryptedCondition)` does not work. Encrypted booleans (`ebool`) are not `bool`.
2. `if (encryptedValue > threshold)` does not work. Comparisons on encrypted types return `ebool`, not `bool`. Solidity `if` needs `bool`.
3. `FHE.select(condition, valueIfTrue, valueIfFalse)` is the only inline onchain way to branch on encrypted conditions.
4. If encrypted logic must drive plaintext business logic, you need an async public-decryption flow with proof verification.
5. `FHE.select` returns a new handle. It needs ACL grants like every other FHE operation result.
6. A false encrypted condition yields the configured fallback value, not an automatic revert. Whether the transaction later succeeds still depends on subsequent public logic.

## FHE.select Is Your Only Inline Branch

Replace every encrypted conditional with `FHE.select`:

```solidity
// WRONG: `ebool` is not `bool`, so Solidity `if` cannot consume the comparison
if (FHE.ge(balance, amount)) { ... }

// WRONG: `require` cannot take `ebool` either
require(FHE.ge(balance, amount), "Insufficient balance");

// Also WRONG: there is no synchronous `FHE.decrypt` that returns plaintext
// inside a transaction — plaintext is only available via the two-step
// public-decryption flow (see `fhevm-public-decryption`).

// CORRECT: select between outcomes
ebool hasEnough = FHE.ge(balance, amount);
euint64 actualAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));
```

When the condition is false, `actualAmount` becomes 0. The transfer logic then proceeds with
that fallback amount. No automatic revert occurs on the encrypted condition itself.

## Branching Back To Plaintext Requires Async Decryption

`FHE.select` keeps the entire branch inside encrypted space. If the contract must take a public
action based on an encrypted result, such as revealing a winner, distributing a public prize, or
executing plaintext settlement logic, it cannot branch inline.

That boundary requires:

1. computing and storing the encrypted result onchain
2. making it publicly decryptable
3. decrypting offchain
4. submitting the cleartext plus proof back onchain
5. verifying the proof before taking the plaintext action

Use `skills/fhevm-public-decryption/SKILL.md` for that path.

## The Silent-Failure Model

This is the hardest mental shift for Solidity developers. Every guarded encrypted operation
becomes a fallback path rather than an immediate revert:

| Standard Solidity | FHEVM Equivalent | On Failure |
|---|---|---|
| `require(balance >= amount)` then transfer | `FHE.select` then transfer | Transfers fallback amount (often 0), no automatic revert |
| `require(allowance >= amount)` then spend | `FHE.select` then spend | Spends fallback amount (often 0), no automatic revert |
| `require(deadline > block.timestamp)` | Still works if deadline is public | Reverts normally |

Public values can still use `require` normally. Only encrypted conditions lose revert semantics.

## Composing Multiple Conditions

Chain conditions using `FHE.and` and `FHE.or` before the select:

```solidity
ebool hasBalance = FHE.ge(senderBalance, amount);
ebool isApproved = FHE.ge(allowance, amount);
ebool canTransfer = FHE.and(hasBalance, isApproved);

euint64 actualAmount = FHE.select(canTransfer, amount, FHE.asEuint64(0));

// Deduct from both balance and allowance using actualAmount
senderBalance = FHE.sub(senderBalance, actualAmount);
allowance = FHE.sub(allowance, actualAmount);
FHE.allowThis(senderBalance);
FHE.allowThis(allowance);
```

Every result handle needs ACL grants. Do not forget them after the select.

## Product Design Implications

Because failures are silent, you must design the user experience differently:

1. **Users cannot rely on standard revert errors for encrypted failures.** A failed confidential transfer may look like a successful transaction unless the app verifies the post-state.
2. **Balance-before-and-after is the primary feedback mechanism.** The user decrypts their balance before and after the operation to see if it changed.
3. **Frontend UX must set expectations.** Show "transaction submitted" not "transfer successful" until the user verifies the outcome.
4. **Timeouts and retries need care.** A user who retries a "failed" transfer may double-send if the first one actually succeeded.

## Plaintext to FHE Translation Table

| Plaintext Solidity | FHEVM Equivalent |
|---|---|
| `if (a >= b) { x = a; } else { x = b; }` | `x = FHE.select(FHE.ge(a, b), a, b)` |
| `require(a >= b)` | `ebool ok = FHE.ge(a, b);` then handle via `FHE.select` or async decryption |
| `a > b ? x : y` | `FHE.select(FHE.gt(a, b), x, y)` |
| `a == b` | `FHE.eq(a, b)` returns `ebool` |
| `a != b` | `FHE.ne(a, b)` returns `ebool` |
| `cond1 && cond2` | `FHE.and(cond1, cond2)` |
| `cond1 \|\| cond2` | `FHE.or(cond1, cond2)` |
| `!cond` | `FHE.not(cond)` |
| `min(a, b)` | `FHE.select(FHE.le(a, b), a, b)` or `FHE.min(a, b)` |
| `max(a, b)` | `FHE.select(FHE.ge(a, b), a, b)` or `FHE.max(a, b)` |
| `assert(cond)` | No equivalent -- use `FHE.select` with a safe fallback |

## Nested Selects

For multi-branch logic (like tiered pricing or graduated fees), nest selects:

```solidity
ebool isHighTier = FHE.ge(amount, highThreshold);
ebool isMidTier = FHE.ge(amount, midThreshold);

euint64 fee = FHE.select(isHighTier, highFee,
    FHE.select(isMidTier, midFee, lowFee));
FHE.allowThis(fee);
```

Each nested `FHE.select` returns a new handle. Grant ACL on the outermost result at minimum,
and on intermediates if the contract stores them.

## Anti-Patterns

### Anti-Pattern 1: Decrypt Then Branch

Calling `FHE.decrypt` inside contract logic to get a `bool` or `uint` for an `if` statement.
This defeats confidentiality and is not available in standard contract execution context.

### Anti-Pattern 2: Assume Transaction Success Means The Encrypted Guard Passed

In standard ERC20, a reverted transfer means insufficient balance. In confidential flows,
the transaction may still succeed while the encrypted guard selects a fallback amount. Do not
equate transaction success with business success.

### Anti-Pattern 3: Forget ACL on Select Results

`FHE.select` returns a new handle. If you store it without `FHE.allowThis`, the contract
loses access. If a user needs to decrypt it, they need `FHE.allow`.

### Anti-Pattern 4: Use Public Require for Encrypted State

Mixing `require` with encrypted values by accidentally using a public proxy or stale
cached value instead of the actual encrypted state.

## Review Checklist

- Is every branch on encrypted state using `FHE.select` instead of `if` or `require`?
- If an encrypted result must drive public logic, is the design using async public decryption rather than pretending to branch inline?
- Does the product design account for silent failures in the user experience?
- Are all `FHE.select` result handles granted appropriate ACL?
- Are multiple encrypted conditions composed with `FHE.and`/`FHE.or` before the select?
- Is there any code path that attempts `FHE.decrypt` inside contract logic for branching?
- Does the frontend communicate uncertainty rather than assuming success?

## Output Expectations

When applying this skill, structure recommendations around:

1. which conditions are encrypted vs public
2. where `FHE.select` replaces each branch
3. what the silent-failure behavior is for each guarded operation
4. how the product UX communicates outcomes to users

## Related Skills

- `skills/fhevm-arithmetic-ops/SKILL.md` — comparisons produce the `ebool` that drives `FHE.select`
- `skills/fhevm-security-audit/SKILL.md` — silent-fallback analysis is a top audit procedure
- `skills/fhevm-testing/SKILL.md` — every `FHE.select` false branch needs an explicit test
