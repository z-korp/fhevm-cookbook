---
name: oz-utils-safemath
description: "Use when you need overflow-safe encrypted arithmetic on euint64 values. Covers the OpenZeppelin FHESafeMath library (tryIncrease, tryDecrease, tryAdd, trySub), uninitialized-handle semantics, and when to prefer it over raw FHE.add / FHE.sub."
---

# FHESafeMath for Confidential Contracts

Use this skill when a contract mutates encrypted `euint64` balances or counters and must
detect overflow, underflow, or uninitialized-handle edge cases. Raw `FHE.add` and `FHE.sub`
wrap silently and do not tell you whether the result was valid. `FHESafeMath` wraps those
operations, returns an `ebool success` flag, and provides explicit fallback behavior when the
operation would have been unsafe.

## When To Use

- Updating encrypted balances in an ERC7984-style token, vault, or ledger
- Incrementing or decrementing encrypted counters where overflow is possible
- Summing encrypted deltas from untrusted sources (user deposits, stream flows)
- Handling the case where an operand may still be an uninitialized handle
- Replacing ad-hoc `FHE.select(FHE.ge(...), newValue, oldValue)` patterns with the library form

If the operands are bounded by construction (for example, a small fixed-length tally where
you know the sum fits in `euint64`), raw `FHE.add` is fine. Use FHESafeMath where the risk
of wrap-around is real.

## Core Mental Model

Each safe op returns `(ebool success, euint64 updated)`:

- `success` is an encrypted boolean. The caller can forward it through further `FHE.select`
  branches or surface it via async public decryption.
- `updated` follows the specific function's fallback rule: `tryIncrease` / `tryDecrease`
  preserve the previous value on failure, while `tryAdd` / `trySub` fall back to zero.

The library treats an uninitialized handle (`euint64.wrap(bytes32(0))`) as zero. So
`tryIncrease(0-handle, delta)` returns `(true, delta)` without needing you to branch on
`FHE.isInitialized` yourself.

The library returns encrypted handles according to each function's branch. On some
uninitialized-input fast paths it can return an existing handle directly rather than creating a
fresh one. You still need to grant ACL on anything you persist or pass downstream. See
[skills/fhevm-acl-lifecycle/SKILL.md](../fhevm-acl-lifecycle/SKILL.md).

## The Four Operations

| Function | Returns success when | Returns `updated` as |
| --- | --- | --- |
| `tryIncrease(oldValue, delta)` | `oldValue + delta >= oldValue` (no overflow) | `oldValue + delta` on success, else `oldValue` |
| `tryDecrease(oldValue, delta)` | `oldValue >= delta` (no underflow) | `oldValue - delta` on success, else `oldValue` |
| `tryAdd(a, b)` | `a + b >= a` (no overflow) | `a + b` on success, else `0` |
| `trySub(a, b)` | `a - b <= a` (no underflow) | `a - b` on success, else `0` |

Key behavior split: `tryIncrease` / `tryDecrease` fall back to the OLD VALUE on failure;
`tryAdd` / `trySub` fall back to ZERO. Pick the one whose failure mode matches your
invariant. For balance updates you almost always want `tryIncrease` / `tryDecrease`.

## Uninitialized-Handle Semantics

An `euint64` slot that has never been written is `bytes32(0)` and evaluates as plaintext 0.
FHESafeMath checks this explicitly with `FHE.isInitialized`:

- `tryIncrease(uninit, delta)` → `(true, delta)` — no FHE work, just returns `delta`
- `tryDecrease(uninit, delta)` → `(delta == 0, 0)` — decreasing an empty slot by zero is ok, anything else fails
- `tryAdd(uninit, b)` / `tryAdd(a, uninit)` → returns the initialized side with `success = true`
- `trySub(a, uninit)` → returns `a` with `success = true`

This matters when you are reading from a mapping whose default entry may never have been
touched. It keeps the ACL surface and gas cost down in cold-path branches.

## Canonical Usage Pattern

```solidity
import {FHESafeMath} from "@openzeppelin/confidential-contracts/utils/FHESafeMath.sol";
import {FHE, ebool, euint64} from "@fhevm/solidity/lib/FHE.sol";

contract Vault {
    using FHESafeMath for euint64;

    mapping(address => euint64) private _balances;

    function deposit(address to, euint64 amount) internal {
        (ebool ok, euint64 updated) = FHESafeMath.tryIncrease(_balances[to], amount);
        // On overflow `ok` is false and `updated == _balances[to]` — the write is a no-op
        _balances[to] = updated;
        FHE.allowThis(updated);
        FHE.allow(updated, to);
        // Optionally propagate `ok` (e.g. via a transient flag or async public decryption)
    }

    function withdraw(address from, euint64 amount) internal returns (ebool ok) {
        euint64 updated;
        (ok, updated) = FHESafeMath.tryDecrease(_balances[from], amount);
        _balances[from] = updated;
        FHE.allowThis(updated);
        FHE.allow(updated, from);
    }
}
```

## Hard Rules

1. The library operates on `euint64` only. Cast to/from other widths explicitly before and after.
2. Every returned handle that you persist or share still needs the appropriate ACL grants — call `FHE.allowThis` before relying on it in a later transaction, and `FHE.allow` for any decryption authority.
3. `success` is encrypted. You cannot `require(ok)`. Forward it through `FHE.select`, store it, or use async public decryption — see [skills/fhevm-control-flow/SKILL.md](../fhevm-control-flow/SKILL.md).
4. The library adds FHE ops (comparison + select) on top of the raw arithmetic. Expect a measurable gas overhead versus raw `FHE.add` / `FHE.sub`.
5. Failure is silent at the contract level. If you need to reject the caller on failure, plumb `ok` through to an async decryption step that reverts, or design the UX around a best-effort update.

## Anti-Patterns

### Anti-Pattern 1: Ignoring `success`

```solidity
(, euint64 updated) = FHESafeMath.tryDecrease(balance, amount);
balance = updated;
```

The balance is safe, but you have discarded the information about whether the decrease
happened. Downstream checks on totals, receipts, or events will be wrong whenever the
operation silently no-oped. Always either persist `success`, fold it into the caller's
return value, or log it.

### Anti-Pattern 2: Using `tryAdd` for a balance update

`tryAdd` returns zero on failure. Wiring it into a balance map means an overflow wipes
the balance. Use `tryIncrease` for balance updates; reserve `tryAdd` for sums where the
accumulator is a scratch value with no persistence guarantee.

### Anti-Pattern 3: Forgetting ACL on the new handle

```solidity
(, euint64 updated) = FHESafeMath.tryIncrease(balance, delta);
_balances[user] = updated;
// missing FHE.allowThis(updated) and FHE.allow(updated, user)
```

The next transaction cannot read the balance, and the user cannot decrypt it. Safe math
does not do the ACL plumbing for you.

### Anti-Pattern 4: Wrapping already-safe arithmetic

If both operands are bounded by construction (for example a small fixed-size accumulator
over encrypted votes where `totalSupply * maxCount` fits in `euint64`), the extra
`FHE.ge` + `FHE.select` only adds gas. Use raw `FHE.add` in hot paths where the invariant
is already proven.

## Review Checklist

- Is the operation `Increase/Decrease` (preserves old value on failure) or `Add/Sub`
  (zeros out on failure)? Does that match the invariant?
- Is `success` used, persisted, or asynchronously decrypted — not discarded?
- Does the caller grant ACL on the returned handle to every party that needs it?
- Is the uninitialized-handle path handled intentionally, or are you relying on the
  library's implicit zero-treatment?
- On hot paths, has overflow safety been traded off against gas cost?

## Related Skills

- [skills/fhevm-arithmetic-ops/SKILL.md](../fhevm-arithmetic-ops/SKILL.md) — raw FHE arithmetic, overflow behavior, and when bounds are already safe
- [skills/fhevm-acl-lifecycle/SKILL.md](../fhevm-acl-lifecycle/SKILL.md) — granting ACL on the new handles returned by safe ops
- [skills/fhevm-control-flow/SKILL.md](../fhevm-control-flow/SKILL.md) — forwarding the `ebool success` through `FHE.select`
- [skills/oz-erc7984-confidential-tokens/SKILL.md](../oz-erc7984-confidential-tokens/SKILL.md) — primary consumer of safe math in OZ confidential contracts

## Reference

- Source: [OpenZeppelin `FHESafeMath.sol`](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts/blob/master/contracts/utils/FHESafeMath.sol)
