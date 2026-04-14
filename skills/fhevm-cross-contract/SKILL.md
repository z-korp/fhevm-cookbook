---
name: fhevm-cross-contract
description: "Use when passing encrypted handles between contracts, designing multi-contract FHE flows, or debugging handle-not-accessible errors at contract boundaries. Covers allowTransient, allow, permission chains, and factory patterns."
---

# Cross-Contract Encrypted Handle Passing

Use this skill when your architecture involves more than one contract operating on encrypted
values. Every time an encrypted handle crosses a contract boundary, it needs an explicit ACL
grant. Forgetting a single grant in a multi-hop flow breaks the chain at the first real ACL
boundary.

## When To Use

- Contract A computes an encrypted result and Contract B uses it
- Factory contracts deploy new contracts with encrypted initial state
- DeFi composability where encrypted amounts flow through routers, pools, or vaults
- Debugging "handle not accessible" or ACL failures in multi-contract flows

## Core Mental Model

An encrypted handle is a capability token with an explicit access list. Passing it to another
contract hands over the token but NOT the access. Every hop needs its own ACL grant. Think of
it as a permission chain: A grants to B, B computes a new result and grants to C. Each new
computation produces a fresh handle that does not inherit prior persistent grants.

## Hard Constraints

1. Passing a handle as a function parameter does NOT grant the callee access to use it.
2. `FHE.allowTransient(handle, target)` grants access for the current transaction only.
3. `FHE.allow(handle, target)` grants persistent access across transactions.
4. A new handle from any FHE operation does not inherit prior persistent grants.
5. ACL failures in cross-contract calls fail at the contract boundary, typically through an ACL error or an inaccessible downstream handle.

## The Two Grant Types

### Transient: Immediate Downstream Call

```solidity
contract Router {
    function swap(euint64 encryptedAmount, address pool) external {
        euint64 netAmount = FHE.sub(encryptedAmount, fee);
        FHE.allowTransient(netAmount, pool); // pool needs it NOW
        IPool(pool).executeSwap(msg.sender, netAmount);
    }
}
```

### Persistent: Stored for Later Use

```solidity
contract Vault {
    function deposit(euint64 encryptedAmount) external {
        euint64 shares = computeShares(encryptedAmount);
        FHE.allowThis(shares);
        _shares[msg.sender] = shares;
        FHE.allow(shares, address(rewardContract)); // reward contract uses it later
    }
}
```

## Permission Chain Pattern

For multi-hop flows, document and implement the full chain. Each contract grants access
to the next hop; each new FHE operation produces a new handle that needs its own downstream grants.

```solidity
contract ContractA {
    function process(euint64 input) external {
        euint64 result = FHE.mul(input, rate);
        FHE.allowTransient(result, address(contractB));
        contractB.process(result);
    }
}

contract ContractB {
    function process(euint64 input) external {
        euint64 result = FHE.add(input, bonus);
        FHE.allowTransient(result, address(contractC));
        contractC.finalize(result);
    }
}

contract ContractC {
    function finalize(euint64 input) external {
        euint64 finalResult = FHE.sub(input, fee);
        FHE.allowThis(finalResult);
        FHE.allow(finalResult, tx.origin);
        _results[tx.origin] = finalResult;
    }
}
```

## Permission Chain Documentation Template

For any multi-contract flow, document every hop as a table:

| Step | Contract | Operation | Input Handle ACL | Output Handle | Output ACL | Grant |
|------|----------|-----------|-----------------|---------------|------------|-------|
| 1 | A | `fromExternal` | n/a | h1 | [A] | -- |
| 2 | A | `mul(h1, rate)` | [A] | h2 | [A] | -- |
| 3 | A | `allowTransient(h2, B)` | -- | h2 | [A, B*] | transient to B |
| 4 | B | `sub(h2, fee)` | [A, B*] | h3 | [B] | -- |
| 5 | B | `allowTransient(h3, C)` | -- | h3 | [B, C*] | transient to C |
| 6 | C | computation on h3 | [B, C*] | h4 | [C] | -- |
| 7 | C | `allowThis(h4)` | -- | h4 | [C] | persistent to C |
| 8 | C | `allow(h4, user)` | -- | h4 | [C, user] | persistent to user |

If any row is missing a required grant, the chain breaks at that boundary.

## allowTransient vs allow Scenario Matrix

| Scenario | Grant Type | Reason |
|----------|-----------|--------|
| Immediate call to another contract in same tx | `allowTransient` | Access needed only now |
| Handle stored in receiving contract for later use | `allow` (persistent) | Must survive end-of-tx |
| User needs to decrypt a result via SDK | `allow(handle, user)` | Persistent read access |
| Another contract reads stored handle in a future tx | `allow(handle, contract)` | Cross-tx access |
| Factory initializing a new contract | `allow(handle, newContract)` | New contract stores it |
| Contract stores its own computed result | `allowThis(handle)` | Self-access across txs |

## Factory Pattern

Factories must grant ACL to the newly created contract before it can use encrypted state:

```solidity
contract VaultFactory {
    function createVault(euint64 initialDeposit) external returns (address) {
        Vault vault = new Vault();
        FHE.allow(initialDeposit, address(vault)); // grant BEFORE initialize
        vault.initialize(initialDeposit, msg.sender);
        return address(vault);
    }
}

contract Vault {
    function initialize(euint64 initialDeposit, address owner) external {
        FHE.allowThis(initialDeposit); // vault stores it for future txs
        FHE.allow(initialDeposit, owner);
        _balances[owner] = initialDeposit;
    }
}
```

## DeFi Composability: DEX Router Example

```solidity
contract DEXRouter {
    function swap(externalEuint64 encAmount, bytes calldata proof, address pool) external {
        euint64 amount = FHE.fromExternal(encAmount, proof);
        FHE.allowTransient(amount, pool);
        IPool(pool).swap(msg.sender, amount, msg.sender);
    }
}

contract Pool {
    function swap(address sender, euint64 amountIn, address recipient) external {
        euint64 amountOut = computeOutput(amountIn);
        FHE.allowThis(amountOut);
        FHE.allow(amountOut, recipient); // recipient can decrypt
    }
}
```

## Anti-Patterns

### Anti-Pattern 1: Pass Handle Without Granting Access
Calling `target.doSomething(handle)` without `allowTransient` or `allow`. Handle arrives, every operation fails.

### Anti-Pattern 2: allowTransient for Stored Handles
Granting transient access for a handle the target stores. Access expires end-of-transaction.

### Anti-Pattern 3: Assume New Handles Inherit Permissions
`FHE.add(handle, x)` produces a fresh result handle. Prior persistent grants on the input do not carry over.

### Anti-Pattern 4: Factory Forgets Created Contract
Factory deploys, passes encrypted state, but never calls `FHE.allow(handle, newContract)`.

### Anti-Pattern 5: Missing Intermediate Grants
In A -> B -> C, A grants to B but B forgets to grant to C. The flow breaks at B-to-C.

## Review Checklist

- At every contract boundary, is there an explicit `allowTransient` or `allow`?
- Is the grant type correct? Transient for same-tx, persistent for stored handles.
- After every FHE operation in the receiver, does the result get `allowThis`?
- In factory patterns, does the factory grant ACL before initialization completes?
- In multi-hop flows, does every intermediate contract grant to the next hop?
- Is the full permission chain documented for reviewers?

## Output Expectations

When applying this skill, structure analysis around:

1. the full contract call graph involving encrypted handles
2. which handles cross which boundaries
3. which grant type is appropriate at each boundary
4. where grants are missing or wrong

## Related Skills

- `skills/fhevm-acl-lifecycle/SKILL.md` — the grant primitives this skill composes
- `skills/fhevm-encrypted-inputs/SKILL.md` — `externalEuint64` vs onchain `euint64` at the boundary
