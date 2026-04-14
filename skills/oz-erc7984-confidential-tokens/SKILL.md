---
name: oz-erc7984-confidential-tokens
description: "Use when designing, implementing, reviewing, or integrating ERC7984 confidential fungible tokens on Zama FHEVM, especially wrappers, operators, transfer variants, and async unwrap flows."
---

# ERC7984 Confidential Tokens

Use this skill for work involving confidential fungible tokens built on FHEVM.

## When To Use

- Implementing or reviewing an `ERC7984` token
- Building a confidential wrapper around an ERC20
- Designing wallet, app, or exchange flows for confidential transfers
- Reviewing operator permissions and transfer semantics
- Implementing unwrap flows that need verified plaintext finalization
- Comparing a custom token with OpenZeppelin confidential contracts

## Core Mental Model

ERC7984 is not ERC20 with hidden events. It changes the data model and control flow.

- Balances and transfer amounts are encrypted onchain
- `euint64` values are handles to ciphertext, not readable integers
- Contracts can compute on encrypted values, but cannot synchronously read plaintext
- Amount-sensitive flows often become multi-step because plaintext must be proven later

## Non-Negotiable Rules

1. Never treat an `euint64` as if Solidity can inspect it directly.
2. Never write logic that assumes `require()` can branch on encrypted conditions.
3. Never trust a user-supplied plaintext amount after an encrypted check.
4. If plaintext is needed for settlement, use an async decrypt-and-verify flow.
5. Keep the trust boundary explicit: frontend encryption, coprocessor computation, onchain proof verification.

## Handles And Inputs

There are two different encrypted amount inputs:

- `externalEuint64 + inputProof`: encrypted client-side and submitted by a user/app
- `euint64`: an onchain encrypted handle already produced by contract-side FHE logic

Use the right one for the caller boundary:

- Fresh user- or wallet-encrypted value: external ciphertext plus proof
- Existing authorized handle: bare `euint64` handle, whether it is passed by another contract or by a caller that already has ACL access to that handle

Do not describe bare `euint64` as contract-to-contract only. The no-proof overloads are also
valid when the caller already knows and is authorized to use an existing onchain handle.

## Operators Replace Allowances

ERC7984 does not use ERC20 style allowances. It uses time-bounded operators.

- `setOperator(operator, until)` grants all-or-nothing authority
- Authority expires automatically
- This is a trust decision, not a scoped amount approval

When reviewing integrations, check whether the product actually wants:

- a trusted operator model, or
- a direct user-initiated transfer flow

Do not describe operators as private allowances. That is the wrong mental model.

## Transfer Variant Checklist

ERC7984 has 8 transfer variants. They are every combination of 3 binary choices:

1. **Sender** — caller (`confidentialTransfer`) or operator (`confidentialTransferFrom`)
2. **Amount source** — frontend ciphertext (`externalEuint64 + inputProof`) or onchain handle (`euint64`)
3. **Receiver callback** — plain transfer or `AndCall` (invokes `onConfidentialTransferReceived`)

Pick the narrowest variant that matches the product flow. Do not add `AndCall` unless the
receiver contract must react during the transfer. The callback is not just a notification:
the receiver can revert, or it can return encrypted `false` and trigger a refund attempt rather
than a guaranteed full rollback.

| # | Function signature | Sender | Amount | Callback | Typical use case |
| - | ------------------ | ------ | ------ | -------- | ---------------- |
| 1 | `confidentialTransfer(to, amount, proof)` | Caller | Frontend | No | User sends tokens to a friend |
| 2 | `confidentialTransfer(to, handle)` | Caller | Onchain handle | No | Contract forwards tokens it holds |
| 3 | `confidentialTransferFrom(from, to, amount, proof)` | Operator | Frontend | No | DEX pulls tokens from user (frontend-initiated) |
| 4 | `confidentialTransferFrom(from, to, handle)` | Operator | Onchain handle | No | DEX routes tokens between internal pools |
| 5 | `confidentialTransferAndCall(to, amount, proof, data)` | Caller | Frontend | Yes | User deposits into a vault that auto-stakes |
| 6 | `confidentialTransferAndCall(to, handle, data)` | Caller | Onchain handle | Yes | Contract deposits into another contract |
| 7 | `confidentialTransferFromAndCall(from, to, amount, proof, data)` | Operator | Frontend | Yes | DEX pulls tokens and notifies settlement contract |
| 8 | `confidentialTransferFromAndCall(from, to, handle, data)` | Operator | Onchain handle | Yes | Fully contract-to-contract routed transfer with callback |

Most user-facing apps only need #1. The operator and `AndCall` variants become relevant
for DeFi composability (DEXes, vaults, staking).

## Correct Unwrap Pattern

If a confidential token unwraps into a public ERC20 or other plaintext asset, use the two-step pattern.

Step 1 onchain:

- user submits encrypted requested amount
- contract computes the actual encrypted releasable amount
- contract stores the result and makes it publicly decryptable for finalization

Off-chain:

- the frontend, relayer, or a keeper requests public decryption of the stored handle
- the off-chain result is cleartext plus proof bound to that encrypted result

Step 2 onchain:

- a finalizer submits plaintext plus proof
- contract verifies the proof before releasing public assets

This is public decryption, not user decryption. User decryption is for read-only display and does
not produce the onchain proof required to finalize an unwrap.

## Privacy Implications

- Wrap amounts are typically public at the bridge edge
- Unwrap finalization is a privacy exit because plaintext is revealed onchain
- Confidential transfer amounts stay hidden, but participants are still public unless another privacy layer hides them
- Failed unwrap attempts should not leak a balance bound through plaintext request amounts

## OpenZeppelin Mapping

Use these modules intentionally:

- `ERC7984`: base confidential token
- `ERC7984ERC20Wrapper`: public-to-confidential wrapper with correct two-step unwrap
- `ERC7984Freezable`: encrypted freeze amounts for compliance
- `ERC7984ObserverAccess`: selective read access for auditors or observers
- `ERC7984Restricted`: blocklist or allowlist transfer controls
- `ERC7984Rwa`: combined compliance controls for RWAs
- `ERC7984Votes`: confidential governance
- `ERC7984Omnibus`: omnibus and sub-account custody flows

Prefer the audited module over a hand-rolled version unless there is a concrete gap.

## Review Checklist

- Are encrypted inputs bound with `inputProof` at the user entry point?
- Does any code rely on plaintext after an encrypted branch without proof verification?
- Are operator permissions appropriate for the product trust model?
- Is unwrap explicitly modeled as a two-transaction flow?
- Are events and UI copy honest about what becomes public at wrap and unwrap boundaries?
- Is the chosen OZ module set smaller and simpler than a custom implementation?

## Output Expectations

When applying this skill, structure recommendations around:

1. token boundary: public asset vs confidential asset
2. caller boundary: user, operator, or contract
3. decryption boundary: user decrypt, public decrypt, or no decrypt
4. correctness boundary: where proof verification must happen

## Related Skills

- `skills/fhevm-acl-lifecycle/SKILL.md` — ACL mechanics for every handle the token produces
- `skills/fhevm-public-decryption/SKILL.md` — two-step unwrap finalize flow
- `skills/oz-erc7984-compliance-patterns/SKILL.md` — Freezable, Restricted, ObserverAccess, RWA layered on ERC7984
