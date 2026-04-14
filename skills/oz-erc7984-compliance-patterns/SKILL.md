---
name: oz-erc7984-compliance-patterns
description: "Use when implementing regulatory compliance on confidential tokens — observer access, freezing, blocklists/allowlists, RWA controls, and selective transparency patterns."
---

# FHE Compliance Patterns

Use this skill when building or reviewing compliance features on confidential tokens.
Pure privacy is a non-starter for institutional adoption. Institutions need auditability.
These patterns make privacy and compliance coexist through layered, opt-in transparency.

## When To Use

- Adding auditor or regulator read access to confidential balances
- Implementing freeze/unfreeze on encrypted amounts
- Adding blocklist or allowlist transfer controls to a confidential token
- Building tokenized securities or regulated financial instruments on FHEVM
- Reviewing whether a compliance design preserves privacy while meeting regulatory requirements
- Evaluating force-transfer or pause capabilities for corporate actions

## Core Mental Model

Confidential tokens are private to the world but selectively transparent to authorized
parties. Compliance is not the opposite of privacy — it is controlled disclosure.

The key insight: **the user's balance stays encrypted for everyone except designated
observers.** The compliance layer does not decrypt balances publicly. It grants specific
roles the ability to read, freeze, or restrict — all operating on encrypted state.

Four OpenZeppelin modules compose into a compliance stack:

| Module | Role |
| ------ | ---- |
| `ERC7984ObserverAccess` | Read access for auditors |
| `ERC7984Freezable` | Freeze encrypted amounts |
| `ERC7984Restricted` | Blocklist or allowlist |
| `ERC7984Rwa` | Freezable + Restricted + pause + force transfer |

## Hard Constraints

1. Observer access is user-initiated. The user designates who can read their balance. The protocol does not force disclosure.
2. Frozen amounts are themselves encrypted. A public observer cannot see how much is frozen without ACL access.
3. Blocklist/allowlist checks happen before transfer execution. A blocked sender's transaction reverts, not silently zeroes.
4. Force-transfer moves tokens by authority. It bypasses the sender's consent. Use only for legally mandated scenarios.
5. Pause halts normal transfer paths. Force transfer remains available to the authorized agent path.

## ERC7984ObserverAccess — Auditor Read Access

Users designate "observers" — auditors, regulators, compliance officers — who get
read access to their current balance handle and to future transferred-amount handles while the
observer relationship is active. The module exposes a single
setter that accepts both the account being observed and the observer being assigned:

```solidity
// Account holder designates their compliance auditor
token.setObserver(msg.sender, auditorAddress);

// Query the current observer
address current = token.observer(msg.sender);

// To revoke, the account (or the existing observer itself) sets the new observer to address(0)
token.setObserver(msg.sender, address(0));
```

Authorization: `setObserver(account, newObserver)` requires the caller to be either
`account` itself, or the existing observer (and in that case `newObserver` must be
`address(0)` — an observer can only abdicate, not transfer). Any other caller reverts
with `Unauthorized()`.

Key properties: user-initiated and per-account. Observers get ACL access to the
encrypted balance handle and to each transferred-amount handle as transfers occur.
They can decrypt but cannot move, freeze, or modify tokens. This does not retroactively
grant access to historical transfer handles from before the observer was set.

Design question to always ask: **who is the observer, and who chose them?** If the issuer
forces a global observer, the design is surveillance, not selective transparency.

## ERC7984Freezable — Encrypted Amount Freezing

An inheriting contract can freeze a specific encrypted amount in a user's account.
Frozen tokens cannot be transferred but remain in the user's balance.

The base module exposes **only an internal helper**, `_setConfidentialFrozen`. There is
no `freeze` / `unfreeze` function — "unfreezing" just means calling the setter again with
a smaller amount (the stored value is the total frozen, not a delta). The public wrapper
lives in `ERC7984Rwa` and looks like:

```solidity
// From ERC7984Rwa: public setter gated by the AGENT_ROLE
function setConfidentialFrozen(
    address account,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
) public onlyAgent;

// Overload taking an already-imported handle
function setConfidentialFrozen(address account, euint64 encryptedAmount) public onlyAgent;
```

Usage from a custom extension: inherit `ERC7984Freezable` and expose your own authorized
wrapper around `_setConfidentialFrozen(account, euint64)` — for example gated on a
freezer role.

How transfer checks work (see `ERC7984Freezable._update`):

```
unfrozen = balance - frozen   // via FHESafeMath.tryDecrease
transferred = FHE.select(FHE.le(requestedAmount, unfrozen), requestedAmount, 0)
```

Key properties: frozen amounts are encrypted. Setting a new frozen amount **replaces**
the previous one (it does not accumulate — the module stores a single total per account).
The freezer role must be carefully governed — it is a powerful privilege.

## ERC7984Restricted — Blocklist and Allowlist

Transfer controls that gate who can send and receive via the virtual `canTransact(address)`
function. The base module defines a three-value enum (`Restriction.{DEFAULT, BLOCKED, ALLOWED}`)
and only exposes **internal** helpers: `_blockUser`, `_allowUser`, `_resetUser`. Inheriting
contracts wire those into their own authorized entry points.

Blocklist is the default behavior of `canTransact` — `DEFAULT` and `ALLOWED` accounts
can transact; only `BLOCKED` cannot. To get allowlist semantics, override `canTransact`:

```solidity
// From ERC7984Restricted: the default (blocklist) implementation
function canTransact(address account) public view virtual returns (bool) {
    return getRestriction(account) != Restriction.BLOCKED; // DEFAULT and ALLOWED pass
}

// Override in your token for allowlist semantics
function canTransact(address account) public view virtual override returns (bool) {
    return getRestriction(account) == Restriction.ALLOWED;
}
```

Expose the internal helpers through authorized public wrappers. `ERC7984Rwa` already
does this:

```solidity
// From ERC7984Rwa
function blockUser(address account) public onlyAgent { _blockUser(account); }
function unblockUser(address account) public onlyAgent { _resetUser(account); }
```

Note that RWA's `unblockUser` calls `_resetUser` (restores `DEFAULT`), not `_allowUser`
(sets `ALLOWED`). If you need the allowlist path you must expose `_allowUser` yourself.

Key properties: checks happen at transfer time in `_update`. Restricted users still
hold tokens but cannot move them. Blocklist suits sanctions compliance. Allowlist suits
regulated securities where only verified investors can trade.

## ERC7984Rwa — Combined Compliance for Regulated Assets

For tokenized securities, real estate, or regulated financial instruments, `ERC7984Rwa`
combines the compliance modules into a single base with access control:

- Freezable (set frozen encrypted amounts)
- Restricted (blocklist via `blockUser` / `unblockUser`)
- Pause (halt all transfers)
- Force transfer (move tokens by legal authority, bypassing pause + sender restriction,
  but not bypassing frozen balances)

`ERC7984Rwa` uses two roles: `DEFAULT_ADMIN_ROLE` (manages agents) and `AGENT_ROLE`
(performs the compliance actions: pause, block, freeze, mint, burn, force transfer).

**Force transfer**: the real function name is `forceConfidentialTransferFrom`, not
`forceTransfer`. Two overloads:

```solidity
function forceConfidentialTransferFrom(
    address from,
    address to,
    externalEuint64 encryptedAmount,
    bytes calldata inputProof
) public onlyAgent returns (euint64);

function forceConfidentialTransferFrom(
    address from,
    address to,
    euint64 encryptedAmount
) public onlyAgent returns (euint64);
```

Bypasses the sender's restriction check and `Pausable` gating, but frozen balances are
still respected — unfreeze first if you need to force-transfer locked tokens. Not a
product feature — it is a legal compliance tool. Document the governance and
authorization chain.

**Pause**: `token.pause()` / `token.unpause()` halts the normal transfer paths for corporate
actions, regulatory holds, or emergency stops. It is not selective, but it does not disable
`forceConfidentialTransferFrom`.

## Module Reference

| Module | Purpose | Key Surface (real signatures) | Controlled By |
| ------ | ------- | ----------------------------- | ------------- |
| `ERC7984ObserverAccess` | Auditor read access | `setObserver(account, newObserver)`, `observer(account)` | Account holder (or observer self-revoking) |
| `ERC7984Freezable` | Freeze encrypted amounts | internal `_setConfidentialFrozen(account, euint64)`; RWA wraps it as `setConfidentialFrozen(...)` | Inheriting contract's authorized role |
| `ERC7984Restricted` | Blocklist or allowlist | `Restriction` enum, `getRestriction(account)`, internal `_blockUser` / `_allowUser` / `_resetUser`; override `canTransact` for allowlist | Inheriting contract's authorized role |
| `ERC7984Rwa` | Full RWA compliance suite | Everything above plus `pause()`, `unpause()`, `blockUser`, `unblockUser`, `setConfidentialFrozen`, `confidentialMint`, `confidentialBurn`, `forceConfidentialTransferFrom`, `addAgent`, `removeAgent` | `DEFAULT_ADMIN_ROLE` + `AGENT_ROLE` |

## Minimum Modules by Use Case

| Use Case | Minimum Modules | Notes |
| -------- | --------------- | ----- |
| Payment stablecoin | Restricted (blocklist) + Freezable | Sanctions + court-order freeze |
| Confidential DeFi token | ObserverAccess (optional) | User-optional auditor access |
| Tokenized equity | Rwa + ObserverAccess | Full suite for securities law |
| Tokenized bond | Rwa + ObserverAccess | Full suite + coupon payment support |
| Privacy-focused utility token | None | No compliance module needed |
| Institutional custody token | Freezable + Restricted (allowlist) | Freeze + permissioned transfers |

## Composing Compliance Modules

Modules compose in layers: `ERC7984` (base) + `ObserverAccess` (transparency) +
`Freezable` (enforcement) + `Restricted` (access control). `Rwa` bundles Freezable,
Restricted, pause, and force transfer, but observer access must still be added separately.

Use the minimum set. A payment token might only need ObserverAccess. A tokenized bond
needs the full Rwa stack. Unnecessary modules increase attack surface.

## Anti-Patterns

### Anti-Pattern 1: Global Mandatory Observer

Forcing all users to have a single global observer defeats selective transparency. If
every balance is readable by one entity, you have a surveillance token, not a private one.
Design for user-initiated observer selection.

### Anti-Pattern 2: Freeze Without Governance

Granting freeze authority to a single EOA without multisig, timelock, or governance.
Freeze is a powerful privilege. Unilateral freezing without accountability creates
censorship risk.

### Anti-Pattern 3: Allowlist as Privacy Feature

Using allowlist mode and claiming it provides privacy because only approved addresses
exist. The allowlist controls transfer access, not balance visibility. These are
orthogonal concerns.

### Anti-Pattern 4: Force-Transfer as Product Feature

Using force-transfer for business logic (rebalancing, fee collection) instead of
reserving it for legally mandated scenarios. Force-transfer bypasses consent. Using it
routinely undermines user trust and may violate regulations in some jurisdictions.

## Review Checklist

- Is observer access user-initiated, not issuer-forced?
- Is the freezer role governed by multisig or governance, not a single EOA?
- Does the restriction mode (blocklist vs allowlist) match the regulatory requirement?
- Is force-transfer limited to legally mandated scenarios with documented authorization?
- Is pause documented as affecting all accounts and all transfers?
- Are frozen amounts encrypted, not leaked through events or state?
- Does the compliance module set match the actual regulatory need (minimum viable compliance)?
- Is the governance and role assignment model documented and auditable?

## Output Expectations

When applying this skill, structure recommendations around:

1. regulatory requirement: what specific compliance need drives the design
2. module selection: which ERC7984 modules satisfy the requirement
3. role governance: who holds each privileged role and how that authority is checked
4. privacy preservation: what remains private after compliance modules are added

## Related Skills

- `skills/oz-erc7984-confidential-tokens/SKILL.md` — the base token compliance modules extend
- `skills/fhevm-privacy-constraints/SKILL.md` — what a compliance control can actually enforce
- `skills/fhevm-security-audit/SKILL.md` — reviewing compliance controls for correctness
