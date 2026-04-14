---
name: fhevm-privacy-constraints
description: "Use when designing product mechanics, rewards, analytics, or compliance flows on FHEVM where hidden balances and confidential transfers constrain what can be known or enforced."
---

# FHE Privacy Constraints

Use this skill when a feature depends on knowing balances, proving holdings, calculating rewards,
or enforcing product rules over confidential token state.

## When To Use

- Designing rewards or incentives for confidential tokens
- Planning analytics, indexing, or Goldsky-derived metrics
- Reviewing whether a contract can read or enforce balance-based rules
- Evaluating sybil resistance claims for privacy-preserving mechanisms
- Choosing between free-transfer privacy and accountable locked balances

## Start With Visibility, Not Assumptions

For each feature, first classify the relevant data:

- public onchain
- hidden but user-readable
- hidden and inaccessible to third parties
- only available after async decrypt

Do not propose a mechanism until the visibility model is explicit.

## Hard Constraints

1. Confidential transfers break public per-user balance reconstruction.
2. A contract cannot synchronously read encrypted balances in Solidity.
3. `require()` cannot branch on encrypted conditions.
4. ACL prevents arbitrary third-party contracts from reading user balances.
5. Any plaintext-dependent flow becomes async and multi-step.

If a proposal violates one of these, redesign it instead of patching around it.

## What Public Data Can Support

Safe inputs for off-chain indexing and rewards are limited to public signals such as:

- wrap amounts
- unwrap amounts
- transfer counts
- participant addresses when events expose them

Unsafe assumption:

- `net shielded = wraps - unwraps` equals a user's real confidential balance

That formula becomes wrong as soon as confidential transfers occur.

## ACL Review Rule

When someone says a reward contract will "read the user's balance," ask how.

Valid answers are limited to:

- the user granted ACL access explicitly
- the token contract grants that access by design
- the tokens are deposited into the reward contract

If none of those is true, the design is not implementable.

## Public vs Hidden Data

| Data | Visibility | Source |
|------|-----------|--------|
| Shield amount (wrap) | **Public** -- plaintext in event | Onchain + indexer |
| Unshield amount (unwrap) | **Public** -- plaintext in event | Onchain + indexer |
| Confidential transfer amount | **Hidden** -- only opaque handle emitted | Parties with ACL on the transferred handle (at least sender and recipient in base ERC7984; observers if configured) |
| Confidential transfer participants | **Public** -- `from` and `to` in event | Onchain + indexer |
| User's encrypted balance | **Hidden** -- encrypted `euint64` onchain | Parties with ACL on that balance handle (typically the user; observers or contract-granted readers are possible) |
| Total Value Shielded (aggregate) | **Public** -- sum of wraps minus unwraps | Indexer |
| Per-user net shielded (inferred) | **Broken** -- only accurate if user never sends/receives confidential transfers | Unreliable |

## Mechanism Evaluation Matrix

| Mechanism | Sacrifices Privacy | Sacrifices Accuracy |
|-----------|-------------------|---------------------|
| Lock / vault | Yes -- tokens immobilized | No |
| Off-chain airdrops (net shielded) | No | Yes -- blind to transfers |
| Onchain tier evaluation | Partially -- tier leaks range | Yes -- sybil-recyclable |
| Wrap-only rewards | No | Yes -- does not measure holding |
| User-initiated balance proof | Partially -- proves point-in-time | Yes -- no continuous tracking |

### Usually Invalid

- Off-chain proportional rewards based on inferred user balances
- Onchain rewards that assume direct balance reads without ACL planning
- Public tier systems that claim sybil resistance from hidden balances alone

### Viable With Clear Tradeoffs

- Wrap-only rewards: incentivizes shielding activity, not holding
- Wrap rewards plus unwrap penalty: adds friction, still does not track real holders
- Lock or vault mechanism: restores accountability by immobilizing tokens
- User-initiated proof flow: reveals point-in-time facts, not continuous ownership
- Utility-driven retention: partner perks, payments, access rights instead of emissions

## Design Heuristic

If the business goal is "reward holding," you must usually give up at least one of these:

- free confidential transferability
- complete privacy of holdings
- simple one-step UX

State the sacrifice explicitly. Hidden tradeoffs create broken tokenomics.

## Anti-Patterns

### Anti-Pattern 1: Reward Real Holders From Public Events Alone

This fails because confidential transfers move balances without revealing amounts.

### Anti-Pattern 2: Enforce Thresholds With Public Tiers

Even if a user proves one account meets a threshold, they may confidentially recycle the same
capital to another account and repeat the proof later.

### Anti-Pattern 3: Assume Hidden Means Sybil Resistant

Privacy hides state. It does not prove uniqueness, continuity, or non-reuse of capital.

## Better Product Framing

When privacy constraints block a requested mechanism, reframe the product around one of these:

1. reward activity instead of holdings
2. lock balances when accountability matters
3. create utility for holding instead of paying balance-based rewards
4. accept selective disclosure from the user at the moment it matters

## Review Checklist

- Which values are public, hidden, or only asynchronously decryptable?
- Does the design rely on inferred balances after confidential transfers?
- Does a third-party contract need ACL access, and is that access actually granted?
- Does any step require plaintext in the same transaction where the encrypted value is computed?
- Is the design claiming sybil resistance without immobilizing capital or using another scarce resource?
- Is the product goal really holding, or is rewarding activity sufficient?

## Output Expectations

When applying this skill, answer in this order:

1. what is knowable
2. what is not knowable
3. what mechanism is still viable
4. what privacy or UX tradeoff the chosen mechanism introduces

## Related Skills

- `skills/fhevm-acl-lifecycle/SKILL.md` — ACL is the gate that decides who can read what
