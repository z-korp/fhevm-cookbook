---
name: oz-erc7984-confidential-governance
description: "Use when designing or implementing confidential governance with ERC7984Votes. Covers private ballot casting, encrypted voting power delegation, tally patterns, and the privacy tradeoffs inherent in onchain governance."
---

# Confidential Governance with ERC7984Votes

Use this skill when building governance where voter privacy matters. Standard ERC20 governance
reveals how many tokens each participant holds through their voting power. ERC7984Votes breaks
this link: delegation is public, but voting power stays encrypted. Voters cast ballots without
revealing their token balance.

## When To Use

- Implementing governance on a confidential token using ERC7984Votes
- Designing a voting system that hides individual voting weight
- Reviewing privacy properties and limitations of confidential governance
- Integrating confidential voting power with a Governor framework

## Core Mental Model

Confidential governance separates two things standard governance conflates:

1. **Who participates** — public (delegation graph, vote timing, proposal interactions)
2. **How much weight they carry** — encrypted (voting power, ballot weight)

You can see that Alice voted, but not whether she controls 100 tokens or 100,000.

## Hard Constraints

1. Delegation is PUBLIC. Who-delegates-to-whom is visible onchain. This is by design.
2. Voting power is ENCRYPTED. It tracks encrypted accumulated delegations.
3. Vote timing is PUBLIC. When you cast a ballot is visible, even though weight is not.
4. Tallying requires encrypted accumulation. No plaintext votes exist to sum.
5. Final tally reveal is an explicit step requiring decryption.
6. `FHE.select` and `FHE.add` work on encrypted ballots. `require()` does not.

## Delegation

Delegation is public, power is encrypted:

```solidity
token.delegate(bob); // public event: Alice -> Bob
// Alice's balance remains encrypted
// Bob's voting power increases by Alice's encrypted balance
// Nobody knows how much power Bob gained
```

Self-delegation activates a user's own voting power. Same pattern as ERC20 governance.

## Private Ballot Casting

The contract adds encrypted voting power to an encrypted tally. No plaintext amount is
ever exposed during voting.

```solidity
contract ConfidentialGovernor {
    mapping(uint256 => mapping(uint8 => euint64)) private _tallies;

    function castVote(uint256 proposalId, uint8 option) external {
        euint64 weight = token.getPastVotes(msg.sender, _proposalSnapshot[proposalId]);
        euint64 newTally = FHE.add(_tallies[proposalId][option], weight);
        FHE.allowThis(newTally);
        _tallies[proposalId][option] = newTally;
    }
}
```

Visible: `msg.sender` voted on `proposalId` for `option`. Hidden: vote weight.

## Tally Patterns

### Encrypted Accumulation, Public Final Result

Accumulate as encrypted and reveal only the aggregate after voting ends. This uses the
standard two-step public-decryption flow (see `skills/fhevm-public-decryption/SKILL.md`):
step 1 marks the tally handle as publicly decryptable; an off-chain caller then fetches
the cleartext + proof via the relayer and submits it in step 2.

```solidity
// Step 1 (onchain): open the tally for off-chain decryption.
function revealTally(uint256 proposalId, uint8 option) external {
    require(block.timestamp > _proposalDeadline[proposalId], "Voting active");
    euint64 tally = _tallies[proposalId][option];
    FHE.makePubliclyDecryptable(tally);
    // Individual weights remain permanently encrypted — only the aggregate is exposed.
}

// Step 2 (onchain): verify the off-chain cleartext and proof, then finalize.
function finalizeTally(
    uint256 proposalId,
    uint8 option,
    uint64 cleartextTally,
    bytes calldata decryptionProof
) external {
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = FHE.toBytes32(_tallies[proposalId][option]);
    FHE.checkSignatures(handles, abi.encode(cleartextTally), decryptionProof);

    _revealedTally[proposalId][option] = cleartextTally;
}
```

Off-chain between the two, the frontend or a keeper calls
`instance.publicDecrypt([handle])` and passes `clearValues` + `decryptionProof` into
`finalizeTally`.

### Threshold-Based Execution

Compute the quorum check as an encrypted bool, mark it publicly decryptable, then
finalize with proof verification. Do not decrypt the running tally to check quorum —
that leaks intermediate totals.

```solidity
// Step 1 (onchain): compute and expose the encrypted quorum bit.
function requestQuorumCheck(uint256 proposalId) external {
    ebool quorumMet = FHE.ge(_tallies[proposalId][VOTE_FOR], FHE.asEuint64(quorumThreshold));
    FHE.allowThis(quorumMet);
    _quorumMetHandle[proposalId] = quorumMet;
    FHE.makePubliclyDecryptable(quorumMet);
}

// Step 2 (onchain): verify the cleartext bit and take public action.
function finalizeQuorumCheck(
    uint256 proposalId,
    bool quorumMetClear,
    bytes calldata decryptionProof
) external {
    bytes32[] memory handles = new bytes32[](1);
    handles[0] = FHE.toBytes32(_quorumMetHandle[proposalId]);
    FHE.checkSignatures(handles, abi.encode(quorumMetClear), decryptionProof);

    if (quorumMetClear) {
        _markProposalPassed(proposalId);
    }
}
```

## Privacy Tradeoffs

| Private | NOT Private |
|---------|-------------|
| Individual voting power | Delegation graph (who -> whom) |
| Individual delegation weight | Vote timing |
| Running tally (until reveal) | Vote choice (FOR/AGAINST/ABSTAIN) |
| | Participation (whether you voted) |
| | Final tally (after reveal) |

### Metadata Leakage Risks

- Few voters + revealed tally = individual inference. Set minimum participation thresholds.
- Delegation patterns reveal political alignment.
- A whale who self-delegates and votes alone effectively reveals their balance through the tally.

## ERC20 Governance vs ERC7984Votes

| Aspect | ERC20 Governance (ERC20Votes) | ERC7984Votes |
|--------|-------------------------------|-------------|
| Token balance | Public `uint256` | Encrypted `euint64` |
| Voting power | Public -- anyone can look up | Encrypted -- only parties with ACL access under the token's handle-access policy can decrypt it |
| Delegation | Public | Public (same) |
| Vote weight | Visible in tx or event | Hidden -- added to encrypted tally |
| Running tally | Can be computed by anyone | Encrypted until explicit reveal |
| Quorum check | `totalVotes >= quorum` in plain Solidity | `FHE.ge(totalVotes, quorum)` -- async |
| Proposal execution | Same tx as quorum check | Two-step: decrypt tally, then execute |
| Gas cost | Low | Higher -- FHE operations per vote |
| Snapshot | Checkpoint-based, public | Checkpoint-based, encrypted |
| Vote buying resistance | Low -- voter's power is visible | Higher -- voter cannot prove their weight to a buyer |

## Governor Integration

Key integration points with a Governor framework:

- `getPastVotes(account, timepoint)` returns the encrypted voting power `euint64` at a checkpoint
- The Governor accumulates votes using FHE operations, not plaintext arithmetic
- Proposal execution is a two-step flow: `FHE.makePubliclyDecryptable` on the tally → off-chain `publicDecrypt` → `FHE.checkSignatures` + execute in a follow-up tx
- Quorum checks use `FHE.ge` to produce an `ebool` which is then decrypted via the same two-step pattern — never by decrypting the running tally

## Anti-Patterns

### Anti-Pattern 1: Reveal Individual Vote Weight
Decrypting per-voter weight for "transparency" defeats the purpose. Only decrypt aggregates.

### Anti-Pattern 2: Assume Delegation Privacy
Promising "fully private voting" without disclosing the public delegation graph. Users who
delegate reveal their political associations.

### Anti-Pattern 3: Low-Participation Tally Reveals
Revealing a tally with one or two voters. The aggregate is effectively the individual.

### Anti-Pattern 4: Plaintext Quorum Checks
Decrypting the running tally to check quorum leaks intermediate results. Use `FHE.ge`.

## Review Checklist

- Does the system distinguish public data (delegation, timing) from private data (weight)?
- Is voting power accumulated using FHE operations, never plaintext?
- Is the tally revealed only after voting ends?
- Are minimum participation thresholds set to prevent individual inference?
- Is the delegation graph's public nature documented for users?
- Does tally reveal and quorum check use the two-step `makePubliclyDecryptable` + `checkSignatures` flow rather than a single-tx decrypt?

## Output Expectations

When applying this skill, structure analysis around:

1. what governance data is public vs encrypted
2. where metadata leakage occurs and whether it is acceptable
3. how tally accumulation preserves individual privacy
4. whether privacy properties match what the product promises users

## Related Skills

- `skills/oz-erc7984-confidential-tokens/SKILL.md` — ERC7984Votes builds on the confidential token
- `skills/fhevm-privacy-constraints/SKILL.md` — metadata leakage and minimum-participation thresholds
- `skills/fhevm-acl-lifecycle/SKILL.md` — ACL on voting-power handles across snapshots
