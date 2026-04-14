---
name: fhevm-arithmetic-ops
description: "Use when writing, reviewing, or optimizing FHE arithmetic in FHEVM contracts — add, sub, mul, div, comparisons, bitwise, and type casting across encrypted operands."
---

# FHE Arithmetic Operations

Use this skill when a contract performs computation on encrypted values. Every FHE operation
has constraints that differ from plaintext Solidity math. Some misuse panics immediately
(for example encrypted divisors in `div`/`rem`), while other mistakes create silent
fallbacks or inaccessible handles.

## When To Use

- Writing arithmetic logic over `euint64`, `euint128`, or `ebool` values
- Reviewing whether division or modulo uses a plaintext divisor
- Checking for overflow in encrypted computations
- Deciding which operands should be public vs encrypted
- Optimizing gas by restructuring operations to use ciphertext-scalar forms
- Implementing comparisons or conditional logic with `FHE.select`

## Core Mental Model

FHE arithmetic produces new ciphertext handles. Every operation returns a fresh handle
that must be stored, granted ACL access, or passed to the next operation. There is no
in-place mutation. Think of it as functional transforms on opaque pointers, not register
arithmetic.

The golden rule: **if an operand can be plaintext without leaking private information,
keep it plaintext.** Ciphertext-scalar operations are significantly cheaper than
ciphertext-ciphertext operations.

## Hard Constraints

1. `FHE.div(a, b)` and `FHE.rem(a, b)` are only supported when `b` is plaintext. Passing an encrypted right-hand side panics.
2. Arithmetic on `euint8`, `euint16`, `euint32`, `euint64`, and `euint128` is unchecked and wraps modulo the type width. There is no automatic overflow or underflow detection.
3. `euint256` does not support add/sub/mul/div/rem/min/max or ordered comparisons (`ge`, `gt`, `le`, `lt`). Treat it as bitwise/opaque integer space.
4. Every FHE operation returns a NEW handle. The old handle still exists but is not the result. You must use and store the new handle.
5. New handles need ACL grants. If you compute `c = FHE.add(a, b)` but never grant ACL on `c`, no one can decrypt or use `c` in future transactions.
6. `require()` cannot branch on `ebool`. Use `FHE.select` for inline encrypted branching, or async public decryption if the result must drive plaintext logic.

## Operation Support By Type

| Type | Supported operation families |
| --------- | ------- |
| `ebool` | `and`, `or`, `xor`, `eq`, `ne`, `not`, `select`, `randEbool()` |
| `euint8`, `euint16`, `euint32`, `euint64`, `euint128` | `add`, `sub`, `mul`, `div` (plaintext rhs only), `rem` (plaintext rhs only), `and`, `or`, `xor`, `shl`, `shr`, `rotl`, `rotr`, `eq`, `ne`, `ge`, `gt`, `le`, `lt`, `min`, `max`, `neg`, `not`, `select`, `randEuintX()`, `randEuintX(upperBound)` |
| `eaddress` | `eq`, `ne`, `select` |
| `euint256` | `and`, `or`, `xor`, `shl`, `shr`, `rotl`, `rotr`, `eq`, `ne`, `neg`, `not`, `select`, `randEuint256()`, `randEuint256(upperBound)` |

Use the official types page or `FHE.sol` when you need the full per-type overload matrix. The
sections below summarize the operator families that matter most in cookbook work.

## Common Operation Families

### Arithmetic

| Operation | Syntax | Divisor/Operand Rule |
| --------- | ------ | -------------------- |
| Add | `FHE.add(a, b)` | Both can be encrypted |
| Subtract | `FHE.sub(a, b)` | Both can be encrypted |
| Multiply | `FHE.mul(a, b)` | Both can be encrypted |
| Divide | `FHE.div(a, b)` | `b` MUST be plaintext |
| Remainder | `FHE.rem(a, b)` | `b` MUST be plaintext |
| Min | `FHE.min(a, b)` | Both can be encrypted |
| Max | `FHE.max(a, b)` | Both can be encrypted |
| Negation | `FHE.neg(a)` | Unary; supported on encrypted integer types |

These arithmetic operators are available on `euint8`, `euint16`, `euint32`, `euint64`, and
`euint128`. They are not available on `euint256`.

### Comparisons

All comparison operators return `ebool`.

- `FHE.eq`, `FHE.ne` support encrypted booleans, encrypted integers, and `eaddress`
- `FHE.ge`, `FHE.gt`, `FHE.le`, `FHE.lt` support `euint8`, `euint16`, `euint32`, `euint64`, and `euint128`
- Ciphertext-scalar overloads exist for the numeric integer types above

### Bitwise

| Operation | Syntax | Notes |
| --------- | ------ | ----- |
| AND | `FHE.and(a, b)` | Ciphertext-ciphertext or ciphertext-scalar |
| OR | `FHE.or(a, b)` | Ciphertext-ciphertext or ciphertext-scalar |
| XOR | `FHE.xor(a, b)` | Ciphertext-ciphertext or ciphertext-scalar |
| NOT | `FHE.not(a)` | Unary bitwise/boolean inversion |
| Shift left | `FHE.shl(a, b)` | `b` is `uint8` or `euint8`; shift count is modulo bit width |
| Shift right | `FHE.shr(a, b)` | `b` is `uint8` or `euint8`; shift count is modulo bit width |
| Rotate left | `FHE.rotl(a, b)` | `b` is `uint8` or `euint8`; rotate count is modulo bit width |
| Rotate right | `FHE.rotr(a, b)` | `b` is `uint8` or `euint8`; rotate count is modulo bit width |

Shifts and rotations are supported on encrypted integer types, including `euint256`.

### Conditional Selection

| Operation | Syntax | Notes |
| --------- | ------ | ----- |
| Select | `FHE.select(cond, a, b)` | `cond` is `ebool`. Returns `a` if true, `b` if false. Does NOT revert. |

`FHE.select` supports `ebool`, `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256`,
and `eaddress`.

### Random

| Operation | Syntax | Notes |
| --------- | ------ | ----- |
| Random bool | `FHE.randEbool()` | Transaction-only; cannot be used via `eth_call` |
| Random integer | `FHE.randEuintX()` | Available for `euint8/16/32/64/128/256` |
| Bounded random integer | `FHE.randEuintX(upperBound)` | `upperBound` must be a power of 2 |

### Type Conversion

| Operation | Syntax | Notes |
| --------- | ------ | ----- |
| Plaintext to encrypted int | `FHE.asEuint8/16/32/64/128/256(value)` | Converts matching-width plaintext integers to encrypted values |
| Plaintext to encrypted address | `FHE.asEaddress(value)` | Converts `address` to `eaddress` |
| Encrypted integer cast | `FHE.asEuintX(value)` | Casts between encrypted integer widths, including from `ebool` |
| From external | `FHE.fromExternal(externalE*, inputProof)` | Imports supported external encrypted inputs into onchain handles |

## The Plaintext Divisor Rule

This is the most common source of bugs. Division and remainder require a plaintext
second operand. If you need to divide by a value derived from user input, the design
must ensure that value is public.

```solidity
// CORRECT: elapsed and duration are plaintext (public timing)
euint128 deposit128 = FHE.asEuint128(deposit);
euint128 streamed = FHE.div(FHE.mul(deposit128, elapsed), duration);

// WRONG: encrypted divisor — will panic
euint64 result = FHE.div(amount, encryptedRate); // NOT SUPPORTED
```

Design pattern: keep time, rates, denominators, and divisors PUBLIC. Structure your
formulas so division always uses a plaintext value.

## Overflow Handling

`euint64` has a maximum of `2^64 - 1` (roughly 18.4 * 10^18). Addition, subtraction,
and multiplication on encrypted integers are unchecked and wrap modulo the bit width.
Multiplication of two large `euint64` values can therefore overflow silently.

Mitigation: use `euint128` for intermediate precision when multiplying before dividing.
Do not assume `euint256` is a drop-in wider arithmetic type; the current library does not
provide `add/sub/mul/div/rem` on `euint256`.

```solidity
// Safe pattern: upcast, multiply, divide, then use result
euint128 a128 = FHE.asEuint128(amount);
euint128 product = FHE.mul(a128, rate); // rate is plaintext
euint128 result128 = FHE.div(product, PRECISION);
// Store or use result128, or downcast if within euint64 range
```

Always reason about the maximum possible value at each step. Document the overflow
bounds in comments.

## ACL Grants for New Handles

Every FHE operation creates a new handle. The current caller can use that fresh handle in the
same transaction, but prior persistent grants do not carry over to it.

```solidity
euint64 newBalance = FHE.add(oldBalance, amount);
// newBalance is a new handle — grant access
FHE.allowThis(newBalance);          // contract can use it later
FHE.allow(newBalance, msg.sender);  // user can decrypt it
```

Missing `FHE.allowThis` means the contract cannot use `newBalance` in a subsequent
transaction. Missing `FHE.allow` means the intended reader cannot decrypt it.

## Conditional Logic With FHE.select

Since `require()` does not work on `ebool`, use `FHE.select` for branching:

```solidity
ebool hasEnough = FHE.ge(balance, amount);
euint64 transferAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));
euint64 newBalance = FHE.sub(balance, transferAmount);
```

Critical: when the condition is false, `FHE.select` returns the fallback value (usually
zero). This is a **silent fallback**, not a revert from `FHE.select` itself. The enclosing
transaction may still revert later on public checks. Document what happens in the false
branch for every `FHE.select`.

## Anti-Patterns

### Anti-Pattern 1: Encrypted Divisor

Using an encrypted value as the second argument to `FHE.div` or `FHE.rem`. Restructure
the formula so the divisor is always plaintext.

### Anti-Pattern 2: Ignoring New Handles

Computing `FHE.add(a, b)` but continuing to use `a` as if it were updated. FHE operations
are not in-place. Always capture and use the returned handle.

### Anti-Pattern 3: Missing ACL on Computed Values

Creating a new handle via arithmetic but never calling `FHE.allowThis` or `FHE.allow`.
The value exists but is inaccessible in future transactions.

### Anti-Pattern 4: Overflow Without Upcasting

Multiplying two `euint64` values without considering that the product can exceed
`2^64 - 1`. Use `euint128` for intermediates.

### Anti-Pattern 4b: Assume `euint256` Supports Normal Arithmetic

Using `euint256` as if it were just a wider `euint128` for `add`, `sub`, `mul`, `div`,
or ordered comparisons. In the current library, `euint256` supports bitwise operations,
`eq`/`ne`, `neg`, `not`, `select`, and random generation, but not the usual arithmetic
operator set.

### Anti-Pattern 5: Assuming FHE.select Reverts

Treating `FHE.select` as equivalent to `require`. It does not revert. The false branch
silently produces the fallback value. If the false case is a critical error, the contract
must handle it through a separate mechanism.

## Review Checklist

- Does every `FHE.div` and `FHE.rem` use a plaintext divisor?
- Is every new handle from an FHE operation stored and granted appropriate ACL?
- Are overflow bounds documented for multiplication chains?
- Does every `FHE.select` have a documented false-branch behavior?
- Are ciphertext-scalar forms used wherever an operand can safely be public?
- Is `euint128` used for intermediate precision when multiplying before dividing?
- Does the contract call `FHE.allowThis` on handles it needs in future transactions?

## Output Expectations

When applying this skill, structure analysis around:

1. operation correctness: are operand types valid for each FHE function?
2. handle lifecycle: is every new handle stored, granted ACL, or consumed?
3. overflow bounds: what is the maximum value at each computation step?
4. privacy tradeoff: which operands are public, and is that acceptable?

## Related Skills

- `skills/fhevm-control-flow/SKILL.md` — comparisons feed `FHE.select` for conditional logic
- `skills/fhevm-acl-lifecycle/SKILL.md` — every arithmetic result is a new handle that needs ACL
