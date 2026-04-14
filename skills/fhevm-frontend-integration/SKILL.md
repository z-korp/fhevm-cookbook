---
name: fhevm-frontend-integration
description: "Use when integrating Zama frontend SDKs into web applications, handling client-side encryption, relayer setup, wallet connection, and decryption flows across the current `sdk`, `react-sdk`, and `relayer-sdk` packages."
---

# FHE Frontend Integration

Use this skill when building or reviewing web applications that interact with FHEVM contracts.
The browser UI is the encryption boundary. Every integration decision flows from that
constraint, but the current package ecosystem has both browser and node entry points.

## When To Use

- Initializing the Zama SDK in a React or Next.js application
- Encrypting user inputs before sending them to FHEVM contracts
- Decrypting values using the reencryption protocol
- Configuring wallet providers (WalletConnect, Privy) alongside the SDK
- Debugging WASM loading failures, SSR hydration errors, or bundler issues
- Reviewing whether a frontend correctly handles the encrypt-submit-decrypt lifecycle

## Core Mental Model

The frontend is the encryption boundary. Plaintext exists only in the user's browser.
Once encrypted, the ciphertext travels to the contract, which computes on it without
ever seeing the original value. Decryption is a separate, async flow that returns
plaintext only to authorized parties.

Three packages show up in frontend work, but they are not interchangeable:

- `@zama-fhe/relayer-sdk` (v0.4.2) — the lower-level relayer layer documented in the official webapp guides; owns `initSDK` / `createInstance` and exposes `web`, `node`, and `bundle` entry points
- `@zama-fhe/sdk` (v2.2.0) — higher-level TypeScript SDK; exports `RelayerWeb`, `ZamaSDK`, storage helpers, token abstractions, and shared types
- `@zama-fhe/react-sdk` (v2.2.0) — React bindings over `@zama-fhe/sdk`; exports `ZamaProvider`, `useEncrypt`, `useUserDecrypt`, `usePublicDecrypt`, and higher-level token hooks

## SDK Package Inventory

| Package | Version | Role | Runtime |
| ------- | ------- | ---- | ------- |
| `@zama-fhe/relayer-sdk` | 0.4.2 | Low-level relayer client; official `initSDK` / `createInstance` path | `web`, `node`, `bundle` entry points |
| `@zama-fhe/sdk` | 2.2.0 | Higher-level SDK with `RelayerWeb`, `ZamaSDK`, storage, token helpers | Browser-first plus `./node` export |
| `@zama-fhe/react-sdk` | 2.2.0 | React bindings with `ZamaProvider` and hooks | Client-side React |

For browser apps, keep React hooks and browser relayer usage inside client-only boundaries.
Do not describe all three packages as browser-only in general: `@zama-fhe/sdk` and
`@zama-fhe/relayer-sdk` also expose node-oriented entry points.

## Hard Constraints

1. React hooks from `@zama-fhe/react-sdk` must run in client components only.
2. If you follow the official low-level relayer docs, `initSDK` / `createInstance` come from `@zama-fhe/relayer-sdk` (`/bundle`, `/web`, or `/node`), not from `@zama-fhe/sdk`.
3. If you use the current React package, the provider is `ZamaProvider`, not `FheProvider`.
4. Raw user decryption uses `useUserDecrypt` (or higher-level hooks), not an old `useDecrypt` hook.
5. Encryption is bound to a specific `contractAddress` and `userAddress`. Encrypting with the wrong addresses produces ciphertext the contract will reject.
6. Decryption requires the user to hold the correct keypair/credentials and the handle to have ACL access granted onchain.
7. The relayer is an off-chain dependency. If it is unavailable, encryption support services, user decryption, and public decryption flows will fail or time out.

## SDK Initialization

Pick the layer you are actually using.

### Official low-level relayer path

If you follow the official webapp docs directly, initialize the relayer SDK from
`@zama-fhe/relayer-sdk`:

```typescript
useEffect(() => {
  const init = async () => {
    const { initSDK, createInstance, SepoliaConfig } = await import(
      "@zama-fhe/relayer-sdk/bundle"
    );
    await initSDK();
    const instance = await createInstance({
      ...SepoliaConfig,
      network: window.ethereum,
    });
  };
  init();
}, []);
```

### Current React SDK path

If you use `@zama-fhe/react-sdk`, configure a `ZamaProvider` with a relayer instance,
signer, and storage backend. Do not look for `FheProvider`.

```typescript
"use client";

import { useMemo } from "react";
import { sepolia } from "viem/chains";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { WagmiSigner } from "@zama-fhe/react-sdk/wagmi";
import { RelayerWeb, indexedDBStorage } from "@zama-fhe/sdk";

function AppZamaProvider({ children }: { children: React.ReactNode }) {
  const signer = useMemo(() => new WagmiSigner({ config: wagmiConfig }), []);
  const relayer = useMemo(
    () =>
      new RelayerWeb({
        getChainId: () => signer.getChainId(),
        transports: {
          [sepolia.id]: {
            relayerUrl: "/api/relayer/11155111",
            network: "https://sepolia.infura.io/v3/YOUR_KEY",
          },
        },
      }),
    [signer]
  );

  return (
    <ZamaProvider relayer={relayer} signer={signer} storage={indexedDBStorage}>
      {children}
    </ZamaProvider>
  );
}
```

In either path, avoid top-level initialization in files that can be evaluated during SSR.

## Encryption Flow

Encryption happens before the transaction is submitted. The SDK encrypts plaintext values
into a ciphertext that is bound to the contract and user.

```typescript
const encrypted = await encrypt.mutateAsync({
  values: [{ type: "euint64", value: amountBigInt }],
  contractAddress,
  userAddress,
});

// encrypted.handles[0] and encrypted.inputProof go into the contract call
await contract.transfer(recipient, encrypted.handles[0], encrypted.inputProof);
```

Key rules:

- `contractAddress` must match the contract that will process the ciphertext
- `userAddress` must match `msg.sender` at execution time
- `type` must use the encrypted type name expected by the SDK, such as `euint64`
- Mismatched addresses cause the onchain import to revert or the frontend to target the wrong handle

## Decryption Flow

Decryption is async and multi-step. In the current React package, raw user decryption is
handled by `useUserDecrypt`, while public decrypt-to-cleartext is handled by
`usePublicDecrypt`. Higher-level token hooks may hide these details for common ERC7984 flows.

1. Contract either grants ACL for user decryption or marks a handle publicly decryptable for public decryption
2. Frontend requests decryption through the relayer
3. For user decryption, the relayer/coprocessor returns reencrypted ciphertext; for public decryption, it returns clear values plus proof
4. The SDK decrypts locally for user reads, or the app submits the public-decryption result back onchain for verification

Do not attempt to decrypt a handle that lacks ACL access. The relayer request should fail.
Surface that SDK error in the UI instead of rendering blank or misleading data.

## Wallet Provider Strategy

Choose based on your user base:

- **WalletConnect**: for crypto-native users who already have MetaMask, Rabby, or hardware wallets
- **Privy**: for email/social onboarding where users do not have an existing wallet

Both work with the SDK. The critical requirement is that the connected wallet address
matches the `userAddress` passed to encryption. If using Privy embedded wallets, verify
that the embedded wallet address is the one used for encryption, not a social login identifier.

## Bundler Configuration

WASM files and workers must be served correctly. If you are integrating the low-level
`@zama-fhe/relayer-sdk` directly, prefer the official `/bundle` entrypoint or CDN path from the
webapp docs before reaching for custom bundler workarounds. Framework-specific webpack or Vite
overrides are toolchain-dependent and should be treated as troubleshooting, not the canonical path.

If the app loads but SDK initialization or encryption fails, check the browser network tab for
404s on `.wasm` files. This is the most common integration failure.

## Anti-Patterns

### Anti-Pattern 1: Initialize SDK at Module Scope

Importing and calling `initSDK()` at the top level of a module breaks SSR. The WASM
binary cannot load in a Node.js environment. Always guard with `useEffect` or `ssr: false`.

### Anti-Pattern 2: Encrypt With Hardcoded Addresses

Using a fixed contract address or ignoring the connected wallet address during encryption
produces ciphertext that the contract rejects. Always derive both addresses dynamically.

### Anti-Pattern 3: Assume Decryption Is Synchronous

Decryption depends on the relayer and reencryption protocol. It can take seconds. Never
block the UI or assume the value is available immediately after requesting it. Show loading
states and handle timeouts.

### Anti-Pattern 4: Use The Old Provider / Hook Names

Looking for `FheProvider` or `useDecrypt` in the current React package. The current surface is
`ZamaProvider`, `useUserDecrypt`, `usePublicDecrypt`, and higher-level token hooks.

## Review Checklist

- If using the low-level relayer path, is `initSDK` / `createInstance` imported from `@zama-fhe/relayer-sdk`, not `@zama-fhe/sdk`?
- If using the React SDK path, does the app provide `ZamaProvider` with a relayer, signer, and storage backend?
- Does `contractAddress` in encryption match the target contract?
- Does `userAddress` in encryption match the connected wallet's address?
- Are current hook names used (`useEncrypt`, `useUserDecrypt`, `usePublicDecrypt`, or higher-level token hooks)?
- Are WASM files loading successfully (check network tab)?
- Does the UI handle decryption loading states and errors?
- Is there a fallback for relayer unavailability?
- Are wallet addresses validated before encryption?

## Output Expectations

When applying this skill, structure guidance around:

1. initialization boundary: where and how the SDK starts
2. encryption boundary: what gets encrypted, with what bindings
3. decryption boundary: what ACL is needed, what the user sees
4. error boundary: what fails explicitly and how to surface it

## Related Skills

- `skills/fhevm-encrypted-inputs/SKILL.md` — what the SDK encrypts and how proofs bind
- `skills/fhevm-user-decryption/SKILL.md` — the `useUserDecrypt` reencryption flow
- `skills/fhevm-public-decryption/SKILL.md` — relayer role in two-step decryption
