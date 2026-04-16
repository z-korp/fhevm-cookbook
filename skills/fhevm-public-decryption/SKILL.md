---
name: fhevm-public-decryption
description: "Use when implementing two-step public decryption for state-changing operations in FHEVM. Covers makePubliclyDecryptable, off-chain proof retrieval, onchain verification with checkSignatures, and the critical single-step unwrap bug."
---

# FHE Public Decryption

Use this skill when a contract needs to USE plaintext onchain, not just show it to a user.
Public decryption is a two-step process: the contract marks an encrypted result for decryption,
then a second transaction submits the proven plaintext back. This is the only safe way to
bridge encrypted computation into plaintext onchain actions.

## When To Use

- Implementing unwrap flows (confidential token to public ERC20)
- Building settlement logic that releases public assets based on encrypted computation
- Designing any flow where the contract must act on a plaintext value
- Reviewing code that converts encrypted results into onchain plaintext actions
- Debugging two-step flows where the finalization transaction fails

## Core Mental Model

A contract cannot read encrypted values. It computes on them but cannot extract plaintext
synchronously. To act on a result, it must:

1. Compute the encrypted result and mark it for public decryption
2. Wait for off-chain decryption to produce a proven plaintext
3. Accept the proven plaintext in a second transaction and verify the proof

Any design that skips step 2 or 3 has a security bug.

## Hard Constraints

1. A contract CANNOT read an encrypted value synchronously. There is no `FHE.decrypt` that returns plaintext in the same transaction.
2. `FHE.makePubliclyDecryptable(handle)` marks a handle as publicly decryptable. This is a public visibility boundary: any entity can request the off-chain cleartext afterward.
3. The relayer's exact `publicDecrypt` API takes an ordered list of handles and returns `clearValues`, `abiEncodedClearValues`, and `decryptionProof`.
4. `FHE.checkSignatures(...)` verifies an ordered `bytes32[]` handle list against the matching ABI-encoded cleartexts and the proof. There is no single-handle shortcut in `FHE.sol`.
5. If you batch multiple handles, the order used in `publicDecrypt([...])`, `abi.encode(...)`, and `checkSignatures(...)` must match exactly.
6. Finalization must consume or clear the pending request state after successful verification, or the same verified result may be replayed.
7. If you skip proof verification and use user-claimed plaintext, the FHE.select protection is bypassed. This is a critical security bug.

## Two-Step Stage Summary

| Stage | Where | What Happens | Key Function |
|-------|-------|-------------|-------------|
| Step 1 | Onchain (tx 1) | Contract computes encrypted result, deducts balance, marks handle for decryption | `FHE.makePubliclyDecryptable(handle)` |
| Off-chain | Relayer / coprocessor | Decrypts the ordered handle list and returns `clearValues`, `abiEncodedClearValues`, `decryptionProof` | `instance.publicDecrypt([handle])` |
| Step 2 | Onchain (tx 2) | Submitter provides cleartext(s) and proof, contract verifies ordered handles plus ABI-encoded cleartexts, then uses verified plaintext | `FHE.checkSignatures(handlesList, abiEncodedCleartexts, decryptionProof)` |

Any design that skips the off-chain step or merges both transactions has a security bug.

## Ordering Is Part Of The Proof

If a flow decrypts more than one handle, the proof is bound to the exact input order.

- `publicDecrypt([h1, h2])` and `publicDecrypt([h2, h1])` produce different proofs
- `FHE.checkSignatures` must receive the handles in that same order
- The cleartexts must be ABI-encoded in that same order

For a single-handle unwrap this is trivial, but for auctions, batched settlement, or multi-value
finalization it is a hard correctness rule.

## The Two-Step Pattern

### Step 1: Encrypted Computation and Decryption Request (On-Chain)

```solidity
function initiateUnwrap(externalEuint64 encryptedAmount, bytes calldata proof) external {
    euint64 requested = FHE.fromExternal(encryptedAmount, proof);

    // Encrypted check: does the user have enough?
    ebool hasEnough = FHE.ge(_balances[msg.sender], requested);
    euint64 actual = FHE.select(hasEnough, requested, FHE.asEuint64(0));
    FHE.allowThis(actual);

    // Deduct from encrypted balance immediately
    _balances[msg.sender] = FHE.sub(_balances[msg.sender], actual);
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);

    // Mark for public decryption
    FHE.makePubliclyDecryptable(actual);

    // Store the handle for finalization
    _pendingUnwraps[msg.sender] = actual;
}
```

### Off-Chain: Relayer Retrieves Proven Plaintext

The frontend or relayer calls `publicDecrypt` on an ordered handle list. For a single-handle
unwrap, extract the cleartext from the returned map:

```typescript
const results = await instance.publicDecrypt([pendingHandle]);
const cleartext = results.clearValues[pendingHandle];
const decryptionProof = results.decryptionProof;
```

If you batch multiple handles in one request, keep the total ciphertext bit length within the
documented 2048-bit relayer limit.

### Step 2: Finalization With Proof Verification (On-Chain)

```solidity
function finalizeUnwrap(uint64 cleartext, bytes calldata decryptionProof) external {
    euint64 handle = _pendingUnwraps[msg.sender];
    require(euint64.unwrap(handle) != bytes32(0), "No pending unwrap");

    // Verify the proof — this is the critical security check
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = FHE.toBytes32(handle);
    FHE.checkSignatures(handles, abi.encode(cleartext), decryptionProof);

    // Clean up to prevent replay against the same pending request
    delete _pendingUnwraps[msg.sender];

    // Now safe to use the verified plaintext
    if (cleartext > 0) {
        publicToken.transfer(msg.sender, cleartext);
    }
}
```

## The Critical Single-Step Unwrap Bug

This is the most dangerous pattern in FHEVM development:

```solidity
// CRITICAL BUG: single-step unwrap
function brokenUnwrap(externalEuint64 encAmount, bytes calldata proof, uint64 claimedAmount) external {
    euint64 requested = FHE.fromExternal(encAmount, proof);
    ebool hasEnough = FHE.ge(_balances[msg.sender], requested);
    euint64 actual = FHE.select(hasEnough, requested, FHE.asEuint64(0));

    // Bug: contract cannot read "actual" — it might be 0
    // Using claimedAmount bypasses the FHE.select check entirely
    publicToken.transfer(msg.sender, claimedAmount);
}
```

`FHE.select` may have zeroed the amount, but the contract cannot read the result.
The user submits any `claimedAmount` they want, bypassing the check entirely.
This is a direct theft vector.

## What The Two-Step Pattern Protects

When step 1 computes `actual = FHE.select(hasEnough, requested, 0)`:

- If the user had enough: `actual` = requested amount, step 2 reveals that amount
- If the user did NOT: `actual` = 0, step 2 reveals 0

The attacker cannot claim a different amount because the proof is bound to the specific
handle from step 1. Failed attempts do not leak the user's balance.

## Finalization Is Frontend-Driven

The second transaction does not happen automatically. The user's frontend, a backend service, or
a keeper bot must submit it. Design the UX to make this pending state explicit.

## Common Applications

- Unwrap: deduct encrypted balance, mark for decrypt, then verify proof and transfer public tokens
- Sealed-bid auction: select winner encrypted, then verify and settle
- Compliance reporting: compute encrypted aggregate, then verify and submit it to the destination contract or reporting pipeline
- Escrow release: select release amount encrypted, then verify and release funds

## Anti-Patterns

### Anti-Pattern 1: Single-Step Unwrap

Accepting user-claimed plaintext in the same transaction as the encrypted computation.
This bypasses all encrypted checks. See the critical bug section above.

### Anti-Pattern 2: Skip checkSignatures

Accepting `(cleartext, proof)` in the finalization step but not calling
`FHE.checkSignatures`. The proof is useless if not verified.

### Anti-Pattern 3: Assume Automatic Finalization

Designing the contract as if step 2 happens automatically after step 1. It does not.
The frontend or a relayer must explicitly submit the second transaction.

### Anti-Pattern 4: Leak Balance Through Request Amounts

If step 1 reveals the requested amount publicly and step 2 reveals 0, an observer learns the
balance is less than requested. Keep request amounts encrypted (`externalEuint64`, not `uint256`).

### Anti-Pattern 5: Verify The Proof But Keep The Pending Request Reusable

If finalization verifies the proof and transfers public assets but leaves the same pending handle
active, the same verified result can be replayed. Consume the request state immediately after
successful verification.

### Anti-Pattern 6: Reorder Handles Between Decrypt And Verification

For batched public decryption, changing the handle order between `publicDecrypt`, ABI encoding,
and `checkSignatures` breaks verification. The order is part of the proof.

## Review Checklist

- Is the flow split into two separate onchain transactions with an off-chain step between them?
- Does step 1 use `FHE.makePubliclyDecryptable` on the computed result handle?
- Does step 2 call the canonical `FHE.checkSignatures(handlesList, abiEncodedCleartexts, decryptionProof)` form before using the plaintext?
- Is there any code path where user-supplied plaintext is used without proof verification?
- Is the request amount encrypted (not public) to prevent balance leakage on failed attempts?
- Does the frontend or relayer handle the finalization step explicitly?
- If multiple handles are decrypted together, is the exact handle order preserved through `publicDecrypt`, ABI encoding, and `checkSignatures`?
- If batching off-chain decrypts, does the request stay within the 2048-bit limit?
- Does finalization consume pending state so the same verified result cannot be replayed?
- Is there a timeout or cleanup mechanism for pending decryption requests that are never finalized?

## Output Expectations

When applying this skill, structure analysis around:

1. what encrypted computation happens in step 1
2. what the off-chain decryption flow looks like
3. what proof verification happens in step 2
4. where the single-step bypass risk exists if the flow is not correctly split

## Related Skills

- `skills/fhevm-user-decryption/SKILL.md` — contrast: off-chain read-only, no proof, no state change
- `skills/oz-erc7984-confidential-tokens/SKILL.md` — canonical unwrap application of this flow
- `skills/fhevm-security-audit/SKILL.md` — single-step unwrap is footgun #1
