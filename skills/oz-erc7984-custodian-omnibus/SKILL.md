---
name: oz-erc7984-custodian-omnibus
description: "Use when designing exchange custody, omnibus wallets, or sub-account patterns with ERC7984. Covers the ERC7984Omnibus extension (encrypted-address events, off-chain sub-account ledgers), deposit and withdrawal flows, reconciliation with observer access, and the custodial trust model."
---

# Exchange Custody and Omnibus Sub-Account Patterns

Use this skill when building custodial infrastructure for confidential tokens.
Exchanges today commingle user funds in a single hot wallet with off-chain
bookkeeping. ERC7984 lets that aggregate holding be confidential, and the
`ERC7984Omnibus` extension makes sub-account movements observable to the
custodian's backend (and any auditor it grants) while keeping sub-account
identities and amounts encrypted from the outside world.

## What ERC7984Omnibus Actually Is

`ERC7984Omnibus` is an `ERC7984` extension from
`@openzeppelin/confidential-contracts`. It adds a new family of transfer
entry points that carry **encrypted sender and encrypted recipient addresses**
(`eaddress`) alongside the encrypted amount, and emits an event per call so
off-chain integrators can reconstruct sub-account attribution.

```solidity
// External (user-encrypted inputs)
confidentialTransferOmnibus(
    address omnibusTo,
    externalEaddress externalSender,
    externalEaddress externalRecipient,
    externalEuint64 externalAmount,
    bytes inputProof
) returns (euint64);

confidentialTransferFromOmnibus(
    address omnibusFrom,
    address omnibusTo,
    externalEaddress externalSender,
    externalEaddress externalRecipient,
    externalEuint64 externalAmount,
    bytes inputProof
) returns (euint64);

// Plus *AndCall overloads:
confidentialTransferAndCallOmnibus(omnibusTo, externalSender, externalRecipient, externalAmount, inputProof, data);
confidentialTransferFromAndCallOmnibus(omnibusFrom, omnibusTo, externalSender, externalRecipient, externalAmount, inputProof, data);

// Plus already-encrypted (no-proof) overloads for each of the four entry points, taking
// `eaddress sender, eaddress recipient, euint64 amount` instead of external + proof.
```

**Critical fact from the OZ API reference:** "There is no onchain accounting
for sub-accounts — integrators must track sub-account balances externally."
The module only emits events with encrypted addresses. The tokens themselves
move between **omnibus addresses** (the custodian's onchain EOA or contract),
not between sub-accounts. Sub-account balances live in the custodian's
off-chain ledger and are reconciled against the onchain omnibus aggregate.

## When To Use

- Building exchange or custodian infrastructure for confidential tokens
- Designing deposit and withdrawal flows where many users share one onchain address
- Adding auditor or regulator visibility to a custodial system via ObserverAccess
- Cross-custodian internal transfers where only the counterparties should see
  sub-account identities

## Core Mental Model

```
Onchain                             Off-chain (custodian backend)
-----------------------             ---------------------------------
omnibus address A (eaddr)           sub-account ledger for A
├── aggregate balance (euint64)     ├── alice  → balance_a (euint64 handle)
                                    └── bob    → balance_b (euint64 handle)

omnibus address B (eaddr)           sub-account ledger for B
├── aggregate balance (euint64)     └── carol  → balance_c (euint64 handle)
```

Tokens move between omnibus addresses onchain. Sub-account attribution is
encrypted into event topics and reconstructed by whoever holds ACL access to
those `eaddress` handles. The custodian is still a trusted party for
operational correctness (it decides which user corresponds to which
`eaddress`); the FHE layer enforces that aggregates conserve and that
sub-account amounts stay confidential.

## Hard Constraints

1. The custodian is a trusted party. Users trust it to correctly attribute
   deposits, debit withdrawals honestly, and not delay transfers.
2. `ERC7984Omnibus` does **not** maintain onchain sub-account balances. Every
   deployment needs an external ledger (a Postgres table, an indexer, a
   sidecar contract — your choice).
3. Encrypted sender/recipient addresses (`eaddress`) need ACL grants for
   anyone who must reconstruct them. Without the grant they are just opaque
   32-byte handles in events.
4. `confidentialTransferOmnibus` still moves real ERC7984 balance from
   `msg.sender` to `omnibusTo`. Operator-mediated movement from another omnibus
   address uses `confidentialTransferFromOmnibus`. The sub-account fields
   are **additive metadata**, not a substitute for the underlying transfer
   and its ACL.
5. The aggregate balance of the omnibus address equals the sum of its
   sub-account balances, enforced by the custodian's bookkeeping, not by the
   module.
6. Observer access for auditors must be explicitly granted on individual
   handles.
7. The omnibus entry points **automatically grant ACL** on the encrypted
   `sender` and `recipient` handles to both `omnibusFrom` and `omnibusTo`
   (see `_confidentialTransferFromOmnibus` in the OZ source). Custodians do
   not need to hand-grant these to themselves — they do need to forward
   grants to any additional indexer, counterpart custodian, or auditor.

## Using the Module

### 1. External-input entry point (fresh ciphertext from a frontend)

```solidity
import {ERC7984Omnibus} from "@openzeppelin/confidential-contracts/token/ERC7984Omnibus.sol";

contract ExchangeToken is ERC7984Omnibus { /* constructor, metadata, … */ }
```

A user wiring an internal transfer from their exchange account to another
user's exchange account encrypts `(senderSubAccount, recipientSubAccount, amount)`
client-side, bound to the exchange contract address, and calls:

```solidity
// Called by the custodian's hot wallet after the off-chain request is validated
function moveInternal(
    address omnibusTo,                    // often == address(this) when staying in-house
    externalEaddress externalSender,
    externalEaddress externalRecipient,
    externalEuint64 externalAmount,
    bytes calldata inputProof
) external onlyCustodian returns (euint64) {
    return confidentialTransferOmnibus(
        omnibusTo,
        externalSender,
        externalRecipient,
        externalAmount,
        inputProof
    );
}
```

Emits `OmnibusConfidentialTransfer(omnibusFrom, omnibusTo, sender, recipient, amount)`
carrying the encrypted sub-account addresses and the encrypted amount. The
custodian's indexer listens for this event, uses its ACL grant on those
`eaddress` handles to resolve them off-chain, and updates its own ledger.

### 2. Internal overload (already-encrypted handles)

Use when the sub-account identities are produced inside the contract or
derived from existing `eaddress` handles the custodian already holds.

```solidity
function moveInternalFromHandles(
    address omnibusTo,
    eaddress sender,
    eaddress recipient,
    euint64 amount
) internal returns (euint64) {
    return confidentialTransferOmnibus(omnibusTo, sender, recipient, amount);
}
```

### 3. Cross-custodian transfer via `confidentialTransferFromOmnibus`

When tokens move between two distinct omnibus addresses (e.g. ExchangeA →
ExchangeB) with sub-account attribution visible only to the two custodians:

```solidity
confidentialTransferFromOmnibus(
    omnibusFrom,      // ExchangeA
    omnibusTo,        // ExchangeB
    externalSender,   // alice on ExchangeA
    externalRecipient,// bob on ExchangeB
    externalAmount,
    inputProof
);
```

The caller needs the standard ERC7984 operator approval from `omnibusFrom`.

## Deposit Flow (Standard ERC7984 Transfer In)

Deposits are just ordinary `ERC7984` transfers to the omnibus address. The
`Omnibus` variants are only needed for intra-custodian movements and
attributed outbound transfers.

```
1. User sends ERC7984 tokens to the omnibus address via confidentialTransfer
2. The omnibus aggregate balance increases onchain
3. Custodian detects the event, identifies the depositor (off-chain KYC),
   and credits the corresponding sub-account in its ledger
```

```solidity
// In the custodian's backend, not onchain:
//   on ConfidentialTransfer(from, to == omnibus, amount) →
//     resolve depositor → credit sub-account[depositor] += amount
```

## Withdrawal Flow

Withdrawals debit a sub-account in the custodian's ledger and issue a
standard ERC7984 transfer out of the omnibus address to the user's own
address.

```
1. User requests withdrawal amount X
2. Custodian backend checks sub-account[user] >= X
3. Custodian calls confidentialTransfer(user, X) from the omnibus address
4. Custodian debits sub-account[user] -= X
```

Since the custodian is authorising the onchain transfer, the FHE layer
cannot stop it from over-debiting the sub-account ledger. This is an
operational trust boundary: the aggregate is cryptographically enforced
(the omnibus cannot transfer more than its onchain balance), but
per-sub-account honesty is custodial.

## ACL Grants for Auditors

Grant auditors access explicitly on the encrypted handles they need to inspect.
`ERC7984ObserverAccess` helps for ERC7984 balance and transferred-amount handles at the
token-account level, but it does not manage arbitrary omnibus sub-account `eaddress` handles.

```solidity
function grantAuditAccessOnEaddress(eaddress subAccountId, address auditor) external onlyCustodian {
    FHE.allow(subAccountId, auditor);
}
```

With an ACL grant on the relevant `eaddress` handles from the emitted
events, the auditor can reconstruct sub-account identities off-chain,
tally per-user movements, and compare against the onchain omnibus
aggregate. This is strictly stronger than traditional proof-of-reserves,
where the exchange's internal ledger is opaque.

## Alternative: Onchain Sub-Account Ledger Using ERC7984 Primitives

If a deployment wants sub-account balances tracked onchain (e.g. for a
programmable vault where smart contracts need per-user conditional
releases), `ERC7984Omnibus` is not the right tool — it does not maintain
per-user balance state. Build an explicit ledger on top of the underlying
ERC7984:

```solidity
mapping(bytes32 userId => euint64) private _subBalances;

function creditSubAccount(bytes32 userId, euint64 amount) external onlyCustodian {
    euint64 newBalance = FHE.add(_subBalances[userId], amount);
    FHE.allowThis(newBalance);
    _subBalances[userId] = newBalance;
}

function debitSubAccount(bytes32 userId, euint64 amount) external onlyCustodian {
    ebool sufficient = FHE.ge(_subBalances[userId], amount);
    euint64 debitAmount = FHE.select(sufficient, amount, FHE.asEuint64(0));
    euint64 newBalance = FHE.sub(_subBalances[userId], debitAmount);
    FHE.allowThis(newBalance);
    _subBalances[userId] = newBalance;
}
```

This is a **custom pattern**, not `ERC7984Omnibus`. The insufficient-balance
branch silently zeroes (`FHE.select`) rather than reverting — the custodian
must verify the outcome (see `fhevm-control-flow` and `fhevm-public-decryption`).
Choose this path only when programmability needs onchain state; otherwise
the module's event-based approach is simpler and does not bloat storage.

## Trust Model

| Action                            | Who decides | What is cryptographically enforced            |
|-----------------------------------|-------------|-----------------------------------------------|
| Credit a sub-account              | Custodian   | Aggregate onchain balance (cannot inflate)    |
| Debit a sub-account               | Custodian   | Aggregate onchain balance (cannot overspend)  |
| Sub-account identity resolution   | Custodian   | Encrypted sender/recipient `eaddress` handles |
| Grant observer access             | Custodian   | ACL on individual handles                     |
| Sub-account per-user honesty      | Custodian   | Not enforced — operational trust              |

Users trust the custodian to: credit deposits to the correct sub-account,
process withdrawals honestly, attribute internal transfers truthfully.
Users do **not** need to trust the custodian to: report accurate aggregate
balances (cryptographic), remain solvent against onchain aggregate
(cryptographic), deny an auditor's independent reconciliation
(auditor verifies through their own ACL grants).

## Composing with Other Modules

- **ObserverAccess**: optional auditor read access on omnibus-account balances
  and transferred amounts; use raw ACL grants for sub-account `eaddress`
  handles emitted by `ERC7984Omnibus`
- **Freezable**: freeze the omnibus aggregate (or a specific sub-account
  balance on the custom-ledger variant)
- **Restricted**: block sanctioned user addresses from depositing to or
  withdrawing from the omnibus

## Anti-Patterns

### Anti-Pattern 1: Treat `ERC7984Omnibus` as an onchain per-user wallet
The module emits events; it does not store per-user balances. Deployments
that need onchain sub-account state must build the ledger themselves on top
of ERC7984 primitives.

### Anti-Pattern 2: Claim trustlessness
The custodian is trusted for operational correctness. The FHE layer
enforces aggregate conservation and confidentiality, not per-sub-account
honesty.

### Anti-Pattern 3: Emit plaintext sub-account identifiers
Logging a plaintext user ID next to the encrypted event defeats the
privacy benefit. Keep identifiers behind `eaddress` / `euint` handles and
hand out ACL grants selectively.

### Anti-Pattern 4: Skip observer grants and claim auditability
Without explicit ACL grants on the emitted handles, an auditor cannot
reconstruct sub-account state. A pure proof-of-aggregate is weaker than a
classic audit and should not be marketed otherwise.

### Anti-Pattern 5: Assume `FHE.select` reverts on insufficient balance
When using the onchain sub-account ledger pattern, `FHE.select` produces
zero, not a revert. The custodian backend must check the outcome before
treating the debit as successful.

### Anti-Pattern 6: Single custodian key
No multisig, no rotation, no recovery. Losing the key loses the ability to
process all user withdrawals. Treat it like a bank's master signing key.

## Review Checklist

- Is `ERC7984Omnibus` used for its actual purpose (encrypted-address event
  emission) and is there a documented off-chain ledger?
- If onchain sub-account state is needed, is it clearly labelled as a
  custom pattern rather than `ERC7984Omnibus`?
- Are ACL grants on the `eaddress` sender/recipient handles documented for
  each principal who needs to reconstruct attribution (custodian indexer,
  counterpart custodian, auditor)?
- Is the custodian key protected by multisig or hardware with rotation?
- Is there an audit path via documented ACL grants, and where relevant
  `ERC7984ObserverAccess`, with clear criteria for grant/revoke?
- Do withdrawals handle insufficient ledger balance in the backend before
  submitting the onchain transfer?
- Is composition with `Freezable` / `Restricted` spelled out (which state
  is frozen — aggregate or sub-account — and by whom)?
- Is the trust boundary between user and custodian documented so users
  understand what is cryptographic vs operational?

## Output Expectations

When applying this skill, structure analysis around:

1. whether the deployment needs `ERC7984Omnibus` events or a custom onchain
   ledger (or both)
2. the ACL plan for `eaddress` sub-account handles and `euint64` amounts
3. the trust boundary between the custodian and its users, and what the FHE
   layer does vs does not enforce
4. deposit / withdrawal / internal-transfer flows and their failure modes
5. audit and compliance integration through `ObserverAccess` and
   `Freezable` / `Restricted`

## Related Skills

- `skills/oz-erc7984-confidential-tokens/SKILL.md` — the underlying token the
  omnibus aggregates and how transfer variants work
- `skills/oz-erc7984-compliance-patterns/SKILL.md` — ObserverAccess, Freezable,
  Restricted for audits and controls
- `skills/fhevm-acl-lifecycle/SKILL.md` — auditor and custodian ACL grants
  on sub-account handles
- `skills/fhevm-control-flow/SKILL.md` — silent-zero semantics when the
  custom onchain ledger uses `FHE.select` for insufficient-balance checks
