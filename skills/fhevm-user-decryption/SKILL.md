---
name: fhevm-user-decryption
description: "Use when implementing client-side decryption of encrypted values in FHEVM. Covers the off-chain reencryption flow, ACL prerequisites, the useUserDecrypt hook, and the boundary between user decryption and public decryption."
---

# FHE User Decryption

Use this skill when building the flow that lets a user read their own encrypted onchain
values (balances, scores, private state) through the browser. This is a purely off-chain
read operation. No transaction is submitted, no gas is spent, and no state changes onchain.

## When To Use

- Implementing balance display for confidential tokens
- Building any UI that shows a user their own encrypted onchain state
- Debugging "decryption failed" errors in the frontend
- Reviewing whether ACL grants are sufficient for user-facing reads
- Deciding between user decryption (read-only) and public decryption (state-changing)

## Core Mental Model

User decryption is reencryption, not onchain decryption. The user signs a typed message
(EIP-712), the relayer SDK uses this signature to reencrypt the handle's value under the
user's public key, and the SDK decrypts it locally in the browser. No write transaction is
sent onchain.

This means:

- No transaction, no gas, no block confirmation
- The user sees the value instantly (network latency only)
- The contract state does not change
- Other users cannot observe that a decryption happened

## Hard Constraints

1. The user MUST have ACL access to the handle. If the contract never called `FHE.allow(handle, user)`, decryption fails.
2. ACL is checked against the current handle, not a previous one. If the contract computed a new balance and stored it under a new handle but forgot to grant ACL on the new handle, the user cannot decrypt.
3. This flow is read-only. It cannot trigger state changes. If you need plaintext for onchain logic, use public decryption instead.
4. The EIP-712 signature proves the user's identity to the relayer. No signature, no decryption.
5. The relayer must be configured and reachable. If the relayer is down, decryption is unavailable.
6. A single user-decryption request is limited by the total ciphertext bit size. The current relayer docs cap one request at 2048 bits across all handles in the batch.

## The ACL Prerequisite

This is where most integration bugs live. The contract must have explicitly granted the
user access to the specific handle they are trying to decrypt.

```solidity
// In the contract: after every balance update
euint64 newBalance = FHE.add(_balances[user], amount);
FHE.allowThis(newBalance);
FHE.allow(newBalance, user);  // THIS is what makes user decryption possible
_balances[user] = newBalance;
```

If you see a contract that updates a balance without calling `FHE.allow(newHandle, user)`,
every user decryption after that update will fail. This is the number one cause of
"decryption stopped working" bugs.

## Frontend: Using useUserDecrypt

The React SDK provides a `useUserDecrypt` hook that wraps the full reencryption
protocol (keypair generation, EIP-712 signing, relayer `userDecrypt`) as a
React-Query mutation:

```typescript
import { useUserDecrypt } from "@zama-fhe/react-sdk";
import type { Hex } from "viem";

function BalanceDisplay({ contractAddress }: { contractAddress: Hex }) {
  const decrypt = useUserDecrypt();
  const [balance, setBalance] = useState<bigint | null>(null);

  const handleDecrypt = async () => {
    // Read the encrypted handle from the contract (a normal view call)
    const handle = (await readContract({
      address: contractAddress,
      abi: tokenAbi,
      functionName: "confidentialBalanceOf",
      args: [userAddress],
    })) as Hex;

    // Decrypt it client-side via the relayer.
    // `mutateAsync` takes a batch of { handle, contractAddress } pairs and
    // returns a Record keyed by handle.
    const results = await decrypt.mutateAsync({
      handles: [{ handle, contractAddress }],
    });

    setBalance(results[handle] as bigint);
  };

  return (
    <div>
      {balance !== null ? formatBalance(balance) : "Encrypted"}
      <button onClick={handleDecrypt} disabled={decrypt.isPending}>
        Reveal Balance
      </button>
    </div>
  );
}
```

The result of `mutateAsync` is `Record<Handle, ClearValueType>` — one entry per handle
in the input batch. `ClearValueType` is `bigint | boolean | 0x${string}` depending on
the encrypted type of the handle; cast accordingly.

The user clicks "Reveal Balance," signs the EIP-712 message in their wallet, and sees
the plaintext. No transaction is broadcast.

For lower-level relayer usage, `instance.userDecrypt(...)` can batch multiple handles in one
request. Keep the total decrypted bit length within the documented 2048-bit cap.

## When User Decryption Is Wrong

User decryption is for displaying data to the user. It is NOT for:

- Feeding plaintext back into a contract (use public decryption with proof)
- Proving a value to a third party onchain (the relayer result is not an onchain proof)
- Triggering state changes based on the revealed value (the contract cannot see it)

If the plaintext needs to be used onchain, you need the two-step public decryption flow.
See `skills/fhevm-public-decryption/SKILL.md`.

## Decryption Timing and Caching

- Decryption returns the value at the time of the request, based on the current handle
- If the user's balance changes between reading the handle and decrypting, the result
  reflects the state at handle-read time
- Frontends should re-read the handle and re-decrypt after state-changing transactions
- Do not cache decrypted values indefinitely; re-decrypt after any operation that may
  have changed the underlying encrypted state
- Check for a zero handle before decrypting uninitialized state; display a default value like `0` instead of attempting reencryption on `bytes32(0)`

## Anti-Patterns

### Anti-Pattern 1: Assume Decryption Works Without Checking ACL

Building a frontend that calls decrypt without verifying the contract grants
`FHE.allow(handle, user)`. Decryption fails at runtime; surface the SDK error instead of treating
it as missing data.

### Anti-Pattern 2: Use Decrypted Values as Contract Inputs

Taking the plaintext from user decryption and passing it back to a contract function as
a `uint256`. This destroys the trust model. The contract has no proof the value is correct.

### Anti-Pattern 3: Forget to Re-Grant ACL After Balance Updates

The contract updates the user's balance (new handle) but only granted ACL on the old handle.
The user can no longer decrypt their current balance.

### Anti-Pattern 4: Show "Transaction Successful" Without Decryption

In confidential token UIs, transaction success does not mean the transfer succeeded
(see silent-failure model in `skills/fhevm-control-flow/SKILL.md`). The UI should prompt
the user to decrypt their balance to verify the outcome.

### Anti-Pattern 5: Attempt User Decryption On A Zero Handle

Trying to decrypt `bytes32(0)` for an uninitialized balance or value. There is no ciphertext
behind the zero handle. Detect it first and render the default state directly.

## Review Checklist

- Does the contract call `FHE.allow(handle, user)` on every handle the user needs to decrypt?
- After every operation that produces a new handle, is ACL re-granted to the user?
- Does the frontend use `useUserDecrypt` (or equivalent) with the correct contract address and handle?
- Is the decrypted value used only for display, never fed back as plaintext contract input?
- Does the UI prompt re-decryption after state-changing transactions?
- Is there a fallback UX for when the relayer is unavailable?
- If batching decrypt requests, does the total requested ciphertext bit length stay within the 2048-bit limit?
- Does the frontend guard against zero handles before attempting decryption?

## Output Expectations

When applying this skill, structure analysis around:

1. which handles the user needs to decrypt
2. whether ACL is granted on the current handle (not a stale one)
3. whether the decrypted value is used correctly (display only)
4. whether the frontend re-decrypts after state changes

## Related Skills

- `skills/fhevm-acl-lifecycle/SKILL.md` — `FHE.allow(handle, user)` is the hard prerequisite
- `skills/fhevm-public-decryption/SKILL.md` — when you need plaintext onchain instead
- `skills/fhevm-frontend-integration/SKILL.md` — `useUserDecrypt` hook and relayer setup
