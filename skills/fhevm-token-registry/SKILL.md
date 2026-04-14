---
name: fhevm-token-registry
description: "Use when looking up Zama confidential token addresses, their underlying ERC20 counterparts, decimals, or deployment start blocks on Sepolia or Ethereum mainnet. Consult this skill any time the user mentions cUSDC, cUSDT, cWETH, cBRON, cZAMA, ctGBP, cXAUt, or needs to wire an FHEVM app, indexer, or test fixture to a known Zama token deployment."
---

# FHEVM Token Registry

Use this skill whenever a task needs a concrete Zama confidential token address, its underlying ERC20, decimals, or the block to start indexing from.

The canonical data lives in `tokens.json` next to this file. Treat that file as the source of truth.

## When To Use

- Wiring a dApp, script, or subgraph to a confidential token on Sepolia or mainnet
- Setting up test fixtures or forked-network tests that need real deployments
- Building a wallet, explorer, or indexer that surfaces confidential balances
- Answering "what is the address of cUSDC / cZAMA / ... on Sepolia / mainnet?"
- Backfilling historical events from the right deployment block

## Config Shape

`tokens.json` is keyed by network, then by symbol:

```json
{
  "sepolia": {
    "chainId": 11155111,
    "USDC":  { "address": "0x...", "decimals": 6,  "startBlock": 10162066 },
    "cUSDC": { "address": "0x...", "decimals": 6,  "startBlock": 10162158 }
  },
  "mainnet": {
    "chainId": 1,
    "USDC":  { "address": "0x...", "decimals": 6,  "startBlock": 6082464 },
    "cUSDC": { "address": "0x...", "decimals": 6,  "startBlock": 24096696 }
  }
}
```

Two networks are supported: `sepolia` (chainId `11155111`) and `mainnet` (chainId `1`).

## Token Pairing Model

Every entry comes in two flavors:

- **Plain symbol** (`USDC`, `WETH`, `ZAMA`, ...) — the standard ERC20. On mainnet these are the real, canonical tokens (for example Circle's USDC, Tether's USDT, WETH9). On Sepolia they are test deployments maintained by the Zama registry.
- **`c` prefix** (`cUSDC`, `cWETH`, `cZAMA`, ...) — the **confidential** (ERC7984) counterpart wrapping the plain token. Balances and transfer amounts are encrypted onchain.

The confidential token's `decimals` are `6` across the registry, independent of the underlying's decimals (for example `cWETH.decimals = 6` even though `WETH.decimals = 18`). Do not assume the decimals carry over from the underlying ERC20.

## Currently Registered Tokens

Both networks ship the same symbol set:

- `USDC` / `cUSDC` — confidential USDC
- `USDT` / `cUSDT` — confidential USDT
- `WETH` / `cWETH` — confidential wrapped ether
- `BRON` / `cBRON` — Brale-issued token
- `ZAMA` / `cZAMA` — the Zama token
- `tGBP` / `ctGBP` — tokenized GBP
- `XAUt` / `cXAUt` — tokenized gold

## Rules

1. Never hardcode a confidential token address in a skill or snippet. Read it from `tokens.json` at the correct network key.
2. Use `decimals` exactly as declared. In particular, `c*` tokens are 6-decimal regardless of the underlying.
3. Use `startBlock` as the indexer's `fromBlock` — it is the deployment block of that specific contract on that specific network. Indexing earlier wastes RPC calls and returns no events.
4. When switching networks in an app, switch the whole `tokens[network]` object, not just the address. `chainId`, `decimals`, and `startBlock` must stay in sync with the address.
5. When the user gives a symbol without a network, ask which one they mean before returning an address. Sepolia and mainnet addresses are different.

## Typical Lookups

- "Address of cZAMA on mainnet" → `tokens.mainnet.cZAMA.address`
- "Start block for the ctGBP indexer on Sepolia" → `tokens.sepolia.ctGBP.startBlock`
- "Decimals to format a cWETH balance" → `tokens.<network>.cWETH.decimals` (always `6`)
- "Address of the Zama wrappers registry on mainnet" → `tokens.mainnet.wrappersRegistry`

## Onchain Wrappers Registry

Zama operates an onchain `ConfidentialTokenWrappersRegistry` that maps each underlying ERC20 to its official ERC7984 confidential wrapper. It is the canonical source for "is this confidential token official?". The addresses are in `tokens.json` under `wrappersRegistry`:

| Network | Address                                      |
| ------- | -------------------------------------------- |
| Mainnet | `0xeb5015fF021DB115aCe010f23F55C2591059bBA0` |
| Sepolia | `0x2f0750Bbb0A246059d80e94c454586a7F27a128e` |

For validation flows you only need one function:

```solidity
function isConfidentialTokenValid(address confidentialTokenAddress) external view returns (bool);
```

## Gating Pattern: Verify A Token Is Official

When a contract accepts a confidential token address from user input (for example a vendor configuring a payment accepting `cUSDC`), it must verify the token is registered. Do not hand-roll an allowlist — defer to the onchain registry. This is the pattern used by `zkorp/confidential-payments`.

### 1. Minimal interface

Keep the interface tight — one view function is enough for the hot path.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IConfidentialTokenWrappersRegistry {
    function isConfidentialTokenValid(
        address confidentialTokenAddress
    ) external view returns (bool);
}
```

### 2. Wire the registry at deploy time

Pass the registry address into `initialize` (or the constructor, for non-upgradeable contracts) and store it in an immutable-style slot. Do not expose a setter — mutability on this surface is a foot-gun, and the registry address is network-scoped, not operator-scoped.

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

### 3. Gate every entry point that takes a token address

One registry read, one conditional revert. That is the entire hot path.

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

### 4. Mock the registry for unit tests

Integration tests should use the real registry on a fork; unit tests want a local mock so the test harness stays hermetic.

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

### Why this shape

- **Single external read**: ~2600 gas cold SLOAD, negligible next to any FHE op. There is no real motivation to cache or skip it.
- **No mutable admin surface**: removing a setter removes an entire class of compromise and upgrade bugs. Redeploy if the registry address ever changes.
- **Registry is the source of truth, not a static list**: relying on `tokens.json` alone would silently drift as Zama registers or revokes tokens. The JSON is for tooling and indexing; the onchain registry is for authorization.
- **Fails closed**: an unregistered, revoked, or malicious `c*` lookalike cannot slip through.

### Off-chain equivalents

For frontends or indexers the same check is available via `eth_call`:

```ts
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import registry from "./tokens.json";

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
  network: "mainnet" | "sepolia",
  token: `0x${string}`,
): Promise<boolean> {
  return client.readContract({
    address: registry[network].wrappersRegistry as `0x${string}`,
    abi,
    functionName: "isConfidentialTokenValid",
    args: [token],
  });
}
```

## Keeping the Registry Honest

This registry reflects what is currently deployed. When a new confidential token ships or an address changes:

1. Update `tokens.json` with the new entry (address, decimals, startBlock).
2. Update the token list in this skill so the two files stay aligned.
3. Do not leave stale entries for redeployed contracts — replace them, and note the change in the commit message so downstream consumers can refresh caches.

## Related Skills

- `skills/fhevm-token-registry/tokens.json` — source of truth for the registry data
- `skills/oz-erc7984-confidential-tokens/SKILL.md` — how the `c*` tokens behave onchain
