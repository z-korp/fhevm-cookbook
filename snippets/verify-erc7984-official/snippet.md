---
title: "Verify an ERC7984 token is official"
summary: "Gate every entry point that accepts a confidential token against Zama's onchain wrappers registry, not a hand-rolled allowlist."
tags: [erc7984, security, registry, gating]
updated_at: 2026-04-13
---

Any contract that accepts a confidential token address from user input, like a vendor configuring payments, a vault picking its base asset, or a streamer choosing what to stream, needs to answer one question before anything else: **is this token an official Zama wrapper?**

The naive answer is a hand-rolled allowlist. That rots the moment Zama registers a new token or revokes an old one. The good answer is a single call into Zama's onchain `ConfidentialTokenWrappersRegistry`.

## The registry

Zama operates a public registry that maps each underlying ERC20 to its vetted ERC7984 wrapper:

| Network | Address                                      |
| ------- | -------------------------------------------- |
| Mainnet | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` |
| Sepolia | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` |

For gating, one view function is enough.

## 1. Minimal interface

Keep the interface tight. You only need the one function on the hot path.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IConfidentialTokenWrappersRegistry {
    function isConfidentialTokenValid(
        address confidentialTokenAddress
    ) external view returns (bool);
}
```

## 2. Wire the registry at deploy time

Pass the registry address into `initialize` (or the constructor, for non-upgradeable contracts) and store it on the contract. Do **not** expose a setter. The registry address is network-scoped, not operator-scoped. If it ever changes, redeploy.

```solidity
IConfidentialTokenWrappersRegistry public registry;

error InvalidRegistry();

function initialize(address initialOwner, address registry_) public initializer {
    __Ownable_init(initialOwner);
    // ... other init ...
    _setRegistry(registry_);
}

function _setRegistry(address registry_) internal {
    if (registry_ == address(0)) revert InvalidRegistry();
    registry = IConfidentialTokenWrappersRegistry(registry_);
}
```

## 3. Gate every entry point

One external read, one conditional revert. That is the whole hot path.

```solidity
error TokenNotRegistered();

function _revertIfTokenNotRegistered(address token) internal view {
    if (!registry.isConfidentialTokenValid(token)) {
        revert TokenNotRegistered();
    }
}

function createPayment(
    address token,
    externalEuint64 encryptedPrice,
    bytes calldata inputProof
) external returns (uint256 id) {
    _revertIfTokenNotRegistered(token);
    // ... rest of the flow
}
```

## 4. Mock the registry for unit tests

Integration tests should run against the real registry on a fork. Unit tests want a local mock so the harness stays hermetic.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IConfidentialTokenWrappersRegistry} from "./IConfidentialTokenWrappersRegistry.sol";

contract MockConfidentialTokenWrappersRegistry is IConfidentialTokenWrappersRegistry {
    mapping(address => bool) public validTokens;

    function setTokenValid(address token, bool valid) external {
        validTokens[token] = valid;
    }

    function isConfidentialTokenValid(
        address confidentialTokenAddress
    ) external view override returns (bool) {
        return validTokens[confidentialTokenAddress];
    }
}
```

## Why this shape

A single cold SLOAD is roughly 2600 gas, negligible next to any FHE operation, so there is no real pressure to cache or skip the check. Removing the setter removes an entire class of admin compromise and upgrade bug risk. And critically, this **fails closed**: only registered Zama wrappers get through.

## Off-chain equivalent

Frontends and indexers should run the same check with `eth_call` instead of trusting a static token list:

```ts
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const REGISTRY = "0xeb5015fF021DB115aCe010f23F55C2591059bBA0" as const;

const client = createPublicClient({ chain: mainnet, transport: http() });

const abi = [
  {
    name: "isConfidentialTokenValid",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "confidentialTokenAddress", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export async function isOfficialConfidentialToken(
  token: `0x${string}`,
): Promise<boolean> {
  return client.readContract({
    address: REGISTRY,
    abi,
    functionName: "isConfidentialTokenValid",
    args: [token],
  });
}
```