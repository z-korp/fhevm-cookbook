---
name: fhevm-acl-lifecycle
description: "Use when granting, auditing, or debugging ACL permissions on encrypted handles in FHEVM. Covers FHE.allow, FHE.allowThis, FHE.allowTransient, and the critical rule that new handles do not inherit prior persistent ACL grants."
---

# FHE ACL Lifecycle

Use this skill when writing, reviewing, or debugging any contract that touches encrypted values
on FHEVM. Every encrypted value is a handle managed by the coprocessor, and every handle has
its own independent ACL. If you do not manage ACLs deliberately, your encrypted results become
unusable.

## When To Use

- Writing a contract that performs FHE operations (add, sub, mul, select, comparisons)
- Reviewing whether a contract correctly propagates ACL access after computations
- Debugging "handle not accessible" or decryption failures
- Designing inter-contract flows where encrypted handles cross contract boundaries
- Auditing whether users can actually decrypt values the contract claims to expose

## Core Mental Model

Every FHE operation returns a NEW handle. Prior persistent ACL permissions do NOT transfer from
input handles to the output handle. The current caller gets transient access to the fresh result
inside the same transaction, but any cross-transaction or cross-principal access still has to be
granted explicitly. This is the single most common source of bugs in FHEVM contracts.

Think of it like file permissions: copying a file does not copy its permission bits. Every
result must be explicitly granted access.

## Hard Constraints

1. A handle without ACL access for the caller is unusable for computation or decryption by that caller. The raw handle can still be returned from a view function or forwarded as calldata.
2. Every FHE operation (add, sub, mul, select, comparisons) produces a fresh handle. Prior persistent grants do not carry over to that new handle.
3. `FHE.allow` is persistent and onchain. It survives across transactions.
4. `FHE.allowTransient` lasts only for the current transaction. Use it when passing a handle to an immediate downstream call.
5. `FHE.allowThis` authorizes the current contract to reuse a ciphertext handle in a future transaction (per the [official ACL docs](https://docs.zama.org/protocol/solidity-guides/smart-contract/acl)). Storing a handle in storage does not by itself require `allowThis` — only reuse across transactions does. In practice, any handle written to a mapping the contract reads back later (balances, accumulators) needs it.
6. If a function accepts an existing onchain handle from an untrusted caller, verify sender access with `FHE.isSenderAllowed(handle)` before using it. Otherwise, the contract can become vulnerable to inference attacks.
7. If ACL is missing, downstream computation or decryption fails. Model and test that failure path explicitly instead of assuming the UI can infer what happened.
8. The enclosing contract must inherit a FHEVM config (`ZamaEthereumConfig`, or the provider-specific equivalent from `@fhevm/solidity/config/ZamaConfig.sol`). Without it, the ACL, coprocessor, and KMS addresses are unset and every `FHE.allow*` call fails at runtime.

## The Three Grant Functions

### `FHE.allowThis(handle)`

Grants the current contract persistent access so it can reuse the handle in a future
transaction. Call this on every result the contract will read back and operate on later
(balances, accumulators, cached intermediates). A handle that the contract writes once and
never touches again does not need it.

```solidity
euint64 newBalance = FHE.add(balance, amount);
FHE.allowThis(newBalance);  // contract can use newBalance in future transactions
_balances[user] = newBalance;
```

### `FHE.allow(handle, address)`

Grants a specific address persistent access. Call this when a user needs to decrypt a value
via the client SDK.

```solidity
euint64 newBalance = FHE.add(balance, amount);
FHE.allowThis(newBalance);
FHE.allow(newBalance, user);  // user can now decrypt their balance client-side
_balances[user] = newBalance;
```

### `FHE.allowTransient(handle, target)`

Grants short-lived access for the current transaction only. Use this when passing a handle
to another contract in a cross-contract call within the same transaction.

```solidity
euint64 result = FHE.mul(price, quantity);
FHE.allowTransient(result, address(settlementContract));
settlementContract.settle(result);
```

## The Mandatory Pattern

After every FHE operation that produces a result you intend to keep or expose:

```solidity
euint64 result = FHE.someOperation(a, b);
FHE.allowThis(result);             // if the contract will reuse it in a later transaction
FHE.allow(result, relevantUser);   // if a user needs to decrypt it
```

This is not optional. This is not a best practice. This is a correctness requirement.

## Verify Access On Incoming Handles

Granting ACL is only half of the job. When a function accepts an existing onchain handle
(`euint64`, `ebool`, etc.) from an untrusted caller, verify that the caller is authorized to use
that handle before consuming it.

This matters because ACL does not hide the raw handle itself. A caller can still forward someone
else's ciphertext handle as calldata. Without an explicit sender-access check, the contract may
leak information through success/failure or output behavior.

```solidity
function transfer(address to, euint64 encryptedAmount) external {
    require(FHE.isSenderAllowed(encryptedAmount), "Unauthorized encrypted amount");

    ebool hasEnough = FHE.le(encryptedAmount, _balances[msg.sender]);
    euint64 actual = FHE.select(hasEnough, encryptedAmount, FHE.asEuint64(0));
    FHE.allowThis(actual);

    euint64 newBalance = FHE.sub(_balances[msg.sender], actual);
    FHE.allowThis(newBalance);
    FHE.allow(newBalance, msg.sender);
    _balances[msg.sender] = newBalance;
}
```

Use this check for incoming onchain handles. Do not use it for `externalEuint64 + inputProof`
flows; `FHE.fromExternal` already verifies the proof binding for that case.

## ACL Propagation in Multi-Step Computations

When chaining operations, every intermediate result the contract will reuse in a later
transaction needs `FHE.allowThis`. An intermediate that only lives inside the current
function does not. Only the final result a user reads needs `FHE.allow`.

```solidity
euint64 fee = FHE.mul(amount, feeRate);
_accumulatedFees = FHE.add(_accumulatedFees, fee);
FHE.allowThis(_accumulatedFees);  // contract will read this accumulator in a later tx

euint64 net = FHE.sub(amount, fee);
FHE.allowThis(net);               // contract will read _balances[recipient] in a later tx
FHE.allow(net, recipient);        // recipient can decrypt their net amount

_balances[recipient] = net;
```

Here `fee` itself does not get `allowThis` — it is only used within this transaction. The
accumulator and the stored balance do, because the contract reads them back later. If you
store a handle that the contract needs to operate on in a later transaction without
granting `allowThis`, that handle is dead from the contract's perspective.

## Grant-Type Decision Table

| Question | If yes | If no |
|---|---|---|
| Will the current contract reuse this handle in a later transaction? | `FHE.allowThis(handle)` | Skip (but be sure) |
| Does a user need to decrypt this handle? | `FHE.allow(handle, user)` | Skip |
| Is this an incoming onchain handle from an untrusted caller? | `require(FHE.isSenderAllowed(handle))` | Skip for `externalEuint* + inputProof` |
| Is another contract using this handle only in this tx? | `FHE.allowTransient(handle, target)` | Use `FHE.allow` instead |
| Is another contract storing this handle? | `FHE.allow(handle, target)` | Use `FHE.allowTransient` |
| Is this an intermediate result used only in this function? | No grant needed | -- |

## Cross-Contract ACL

When contract A computes a handle and passes it to contract B:

- Use `FHE.allowTransient(handle, addressB)` if B only needs it in the current transaction
- Use `FHE.allow(handle, addressB)` if B needs it across transactions

Contract B must have persistent ACL on that handle if it stores it for later use. If A already
granted `FHE.allow(handle, addressB)`, B does not need to call `FHE.allowThis(handle)` again.

## Anti-Patterns

### Anti-Pattern 1: Grant ACL Only on the Final Result

Skipping `FHE.allowThis` on handles the contract reads back in a later transaction (stored
balances, accumulators, cached computations). The contract loses access to its own data on
the next read.

### Anti-Pattern 2: Assume ACL Transfers Through Operations

Writing `result = FHE.add(a, b)` and assuming `result` inherits the ACL of `a` or `b`.
It does not. The result has zero permissions.

### Anti-Pattern 3: Forget User ACL After Balance Updates

Updating a stored balance with a new handle but not calling `FHE.allow(newBalance, user)`.
The user's next decrypt call fails because their ACL pointed at the old handle.

### Anti-Pattern 4: Use allowTransient When Persistent Is Needed

Granting transient access for a handle that gets stored. The access vanishes after the
transaction, and the target contract cannot use the handle later.

### Anti-Pattern 5: Accept An Onchain Handle Without Verifying Sender Access

Taking an `euint64` parameter from `msg.sender` and using it directly without
`FHE.isSenderAllowed(handle)`. This can enable inference attacks because the caller may pass a
handle they are not authorized to use.

## Review Checklist

- Does every FHE operation result the contract will reuse in a later transaction have `FHE.allowThis`?
- Does every result a user needs to decrypt have `FHE.allow(result, user)`?
- Are cross-contract handle transfers using the right grant type (transient vs persistent)?
- If the function accepts an existing onchain handle from a caller, does it verify `FHE.isSenderAllowed`?
- After a balance update, does the user still have ACL on the new handle?
- Are intermediate results that the contract reuses in later transactions granted `allowThis`?
- Is there any stored handle that will be consumed later (by the contract or a user) without a matching ACL grant?

## Output Expectations

When applying this skill, structure analysis around:

1. which handles are produced by which operations
2. which handles are stored vs used transiently
3. which addresses need access to which handles
4. where ACL grants are missing or using the wrong grant type

## Related Skills

- `skills/fhevm-encrypted-inputs/SKILL.md` — grant ACL immediately after `FHE.fromExternal`
- `skills/fhevm-cross-contract/SKILL.md` — `allowTransient` vs `allow` across contract boundaries
- `skills/fhevm-user-decryption/SKILL.md` — `FHE.allow(handle, user)` is the prerequisite for user decrypt
