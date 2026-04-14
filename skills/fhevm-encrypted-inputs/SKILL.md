---
name: fhevm-encrypted-inputs
description: "Use when implementing or reviewing how encrypted user inputs enter FHEVM contracts. Covers client-side encryption, FHE.fromExternal, inputProof binding, and the distinction between external ciphertexts and onchain handles."
---

# FHE Encrypted Inputs

Use this skill when building or reviewing the path encrypted data takes from a user's
browser into an onchain contract. This is the entry point for all user-supplied confidential
values in FHEVM, and the proof binding is what prevents replay and injection attacks.

## When To Use

- Implementing a contract function that accepts encrypted user input
- Building frontend code that encrypts values before submitting transactions
- Reviewing input validation and proof verification in contract entry points
- Debugging "invalid proof" or "wrong sender" reverts on encrypted input submission
- Designing contract interfaces that accept both external and onchain encrypted values

## Core Mental Model

When a user input must stay confidential, the user does not send plaintext to the chain. They
encrypt the value client-side using the Zama SDK, producing a ciphertext and a cryptographic
proof. The proof binds the ciphertext to a specific sender address AND a specific contract
address. The contract calls `FHE.fromExternal` to import the ciphertext, which verifies the proof
and returns an onchain encrypted handle.

Two completely different types represent encrypted values at different lifecycle stages:

- `externalEuint64 + inputProof`: encrypted client-side, not yet imported onchain
- `euint64`: an onchain handle already living in the coprocessor

These are not interchangeable. A contract that accepts fresh confidential user input needs the
first. A contract that receives an existing onchain handle from storage, another contract, or a
user who already controls that handle needs the second.

## Hard Constraints

1. `FHE.fromExternal(ciphertext, inputProof)` is the only way to import user-encrypted values.
2. The `inputProof` is cryptographically bound to `msg.sender` AND the target contract address.
3. If the proof was generated for a different sender, the call reverts.
4. If the proof was generated for a different contract, the call reverts.
5. The handle returned by `FHE.fromExternal` is immediately usable by the current contract in the same transaction. If the handle must persist beyond the current transaction or be shared, grant ACL explicitly.
6. Proofs are bound to the caller and contract context. Reusing a proof under a different sender or contract address reverts; the local refs do not support a blanket single-use rule across transactions.
7. The contract must inherit a FHEVM config (`ZamaEthereumConfig` from `@fhevm/solidity/config/ZamaConfig.sol`, or the network-specific equivalent). Without it, `FHE.fromExternal` has no coprocessor/ACL/KMS addresses wired and calls revert at runtime.

## Contract-Side: Accepting Encrypted Input

The enclosing contract must inherit a FHEVM config so the `FHE.*` calls know the coprocessor, ACL, and KMS addresses:

```solidity
import { FHE, externalEuint64, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialToken is ZamaEthereumConfig { /* ... */ }
```

Inside the contract, accept the external ciphertext and its proof, then import:

```solidity
function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    // Import the user's encrypted value — verifies proof binding
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Use it in FHE operations
    ebool hasEnough = FHE.ge(_balances[msg.sender], amount);
    euint64 actualAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));

    _balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);

    _balances[to] = FHE.add(_balances[to], actualAmount);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
```

## Frontend-Side: Encrypting Values

Using the Zama React SDK (`@zama-fhe/react-sdk`):

```typescript
import { useEncrypt } from "@zama-fhe/react-sdk";

const encrypt = useEncrypt();

// EncryptParams: { values: EncryptInput[], contractAddress, userAddress }
// EncryptResult: { handles: Uint8Array[], inputProof: Uint8Array }
const encrypted = await encrypt.mutateAsync({
  values: [{ value: amount, type: "euint64" }],
  contractAddress: tokenContractAddress,
  userAddress: account.address,
});

// Each value in `values` produces one entry in `handles`, in the same order.
// `inputProof` is shared across the whole batch.
const encryptedAmount = encrypted.handles[0];
const inputProof = encrypted.inputProof;

// Submit the transaction. Most viem/wagmi pipelines accept Uint8Array for
// `bytes` / `bytes32` parameters directly; convert with `toHex` if your
// toolchain needs a hex string.
await writeContract({
  address: tokenContractAddress,
  abi: tokenAbi,
  functionName: "confidentialTransfer",
  args: [recipientAddress, encryptedAmount, inputProof],
});
```

The `contractAddress` and `userAddress` parameters are critical. They are baked into the proof.
If either is wrong, the onchain `FHE.fromExternal` call reverts.

## Two Input Types: When To Use Which

| Scenario | Parameter Type | Why |
|---|---|---|
| User sends encrypted amount from frontend | `externalEuint64 + inputProof` | Value originates off-chain, needs proof |
| Contract A passes encrypted value to Contract B | `euint64` | Handle already exists onchain, no proof needed |
| User passes an existing onchain handle they already control | `euint64` | Value already exists onchain; verify `FHE.isSenderAllowed` |
| User wraps public tokens into confidential | plaintext amount | Wrap amount is public ERC20 input, not a confidential user input |
| Internal rebalancing between contract storage slots | `euint64` | Contract operates on its own stored handles |

Use `externalEuint64 + inputProof` when the value originates off-chain in this call. Use bare
`euint64` when the caller is expected to pass an existing onchain handle, and verify sender
access with `FHE.isSenderAllowed` when that handle comes from an untrusted caller.

## Common Input Types

| Type | External Type | Bits | Plaintext Equivalent | Typical Use Case |
|---|---|---|---|---|
| `ebool` | `externalEbool` | 2 | `bool` | Encrypted flags |
| `euint8` | `externalEuint8` | 8 | `uint8` | Small counters, percentages |
| `euint16` | `externalEuint16` | 16 | `uint16` | Low-range amounts |
| `euint32` | `externalEuint32` | 32 | `uint32` | Medium values |
| `euint64` | `externalEuint64` | 64 | `uint64` | Token balances, standard amounts |
| `euint128` | `externalEuint128` | 128 | `uint128` | Large amounts, high-precision intermediates |
| `eaddress` | `externalEaddress` | 160 | `address` | Encrypted addresses |
| `euint256` | `externalEuint256` | 256 | `uint256` | Full-width opaque integers |

These are the input types currently documented in the official Zama guides and examples.
`euint64` is the most commonly used type for token balances and transfer amounts in ERC7984 flows.

## Multiple Encrypted Inputs

When multiple encrypted values are produced in the same frontend encryption call, they share a
single `inputProof`:

```solidity
function bid(
    externalEuint64 encryptedPrice,
    externalEuint64 encryptedQuantity,
    bytes calldata inputProof
) external {
    euint64 price = FHE.fromExternal(encryptedPrice, inputProof);
    euint64 quantity = FHE.fromExternal(encryptedQuantity, inputProof);
    // ...
}
```

Frontend encrypts multiple values in one call:

```typescript
const encrypted = await encrypt.mutateAsync({
  values: [
    { value: price, type: "euint64" },
    { value: quantity, type: "euint64" },
  ],
  contractAddress,
  userAddress,
});
// encrypted.handles[0] is price, encrypted.handles[1] is quantity
// encrypted.inputProof covers both
```

## Anti-Patterns

### Anti-Pattern 1: Accept Plaintext Then Encrypt On-Chain

Writing a function that takes `uint256 amount` and calls `FHE.asEuint64(amount)`. This
puts the plaintext onchain in the transaction calldata, destroying confidentiality.

### Anti-Pattern 2: Reuse Proofs Across Contracts

Generating a proof for contract A and submitting it to contract B. The proof is bound to
a specific contract address. It will revert.

### Anti-Pattern 3: Skip ACL When The Imported Handle Persists

Calling `FHE.fromExternal` and then storing or forwarding the imported handle without granting
the required ACL. Same-transaction use works, but future reuse or downstream access breaks.

### Anti-Pattern 4: Accept externalEuint64 for Contract-to-Contract Calls

Using the external input type when the caller is always another contract. This forces
unnecessary proof generation and adds complexity. Use `euint64` for onchain handle passing.

## Review Checklist

- If a function accepts fresh confidential user input, does it use `externalE* + inputProof` rather than plaintext or a bare onchain handle?
- If a `FHE.fromExternal` result is stored or shared, does it get the required ACL grant (`allowThis`, `allow`, or `allowTransient`)?
- Does the frontend encrypt with the correct `contractAddress` and `userAddress`?
- If a user passes an existing onchain handle, does the contract verify `FHE.isSenderAllowed`?
- Are contract-to-contract calls using `euint64` instead of external types?
- Is there any function that accepts plaintext and encrypts it onchain?
- If multiple values come from one encryption call, are the handles paired with that single `inputProof` in the same order?

## Output Expectations

When applying this skill, structure analysis around:

1. where the encryption boundary sits (client vs chain)
2. which functions are user-facing vs contract-facing
3. whether proof binding matches the actual caller and target
4. whether persistent ACL is granted when an imported handle is stored or shared

## Related Skills

- `skills/fhevm-acl-lifecycle/SKILL.md` — when imported handles need persistent or delegated ACL grants
- `skills/fhevm-frontend-integration/SKILL.md` — client-side encryption, proof generation, address binding
- `skills/fhevm-cross-contract/SKILL.md` — when to take `externalEuint64` vs bare `euint64`
