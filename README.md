[6 tools called]

### README draft for your project

You can drop this into `README.md` at the root of `lazorkit-starter`.

```markdown
# Lazorkit Starter

A minimal React + Vite starter that shows how to use the `@lazorkit/wallet` SDK to:

- Connect a wallet using **passkeys / WebAuthn**
- **Sign arbitrary messages** via the Lazorkit portal
- **Send gasless Solana transactions** (paymaster as fee payer) to a user-specified recipient and amount

It targets **Solana devnet** out of the box and is meant as a reference / playground for integrating Lazorkit into your own dapps.

---

## Quick start

### Prerequisites

- Node.js 18+ (recommended)
- pnpm / npm / yarn (any package manager)
- A modern browser with passkey/WebAuthn support (Chrome, Edge, Safari, etc.)

### Install dependencies

```bash
# from the lazorkit-starter folder
npm install
# or: pnpm install / yarn install
```

### Run the dev server

```bash
npm run dev
```

Then open the printed localhost URL in your browser.

---

## How the Lazorkit SDK is wired in

The Lazorkit SDK is provided to your React app via `LazorkitProvider`, which wraps the root app and configures the paymaster:

```7:11:src/main.tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazorkitProvider paymasterConfig={{ paymasterUrl: "https://kora.devnet.lazorkit.com" }}>
      <App />
    </LazorkitProvider>
  </StrictMode>,
)
```

- **`LazorkitProvider`**: injects wallet context (connection state, signing, gasless transactions) into the React component tree.
- **`paymasterConfig.paymasterUrl`**: URL for the Lazorkit **devnet paymaster**, which pays transaction fees on behalf of the user (gasless UX).

Inside your components, you use the `useWallet()` hook from `@lazorkit/wallet` to interact with the SDK.

---

## Project structure

Relevant files:

```text
lazorkit-starter/
  src/
    main.tsx          # React root + LazorkitProvider
    App.tsx           # Renders WalletDemo
    WalletDemo.tsx    # High-level page layout for the demo
    components/
      WalletConnection.tsx   # Connect / disconnect wallet with passkeys
      SignMessage.tsx        # Sign arbitrary messages via Lazorkit
      GaslessTransaction.tsx # Send gasless SOL transfers to a recipient
  vite.config.ts      # Vite + React + Tailwind plugin config
  package.json        # Scripts, dependencies, dev tooling
  index.css           # Tailwind entry + base styling
```

High level flow:

- `main.tsx` sets up **React** and **LazorkitProvider**.
- `App.tsx` renders `WalletDemo`.
- `WalletDemo` shows:
  - Connection status + connect/disconnect UI
  - Status messages (e.g. “Opening passkey dialog…”)
  - **Sign message** and **Gasless transaction** cards.

---

## Example: Wallet connection with passkeys

The `WalletConnection` component demonstrates:

- How to access wallet state from `useWallet`.
- How to trigger a passkey-based connect flow.
- How to disconnect and clear state.

Core usage:

```20:29:src/components/WalletConnection.tsx
const {
  wallet,
  isConnected,
  isLoading,
  isConnecting,
  isSigning,
  error,
  connect,
  disconnect,
} = useWallet();
```

Connect / disconnect handlers:

```39:55:src/components/WalletConnection.tsx
const handleConnect = async () => {
  onStatusChange?.('Opening passkey dialog…');
  onConnect?.();
  try {
    await connect({ feeMode: 'paymaster' });
    onStatusChange?.('Connected.');
  } catch (e) {
    onStatusChange?.(null);
    throw e;
  }
};

const handleDisconnect = async () => {
  onStatusChange?.(null);
  onDisconnect?.();
  await disconnect();
};
```

Things to notice:

- `connect({ feeMode: 'paymaster' })`:
  - Starts a WebAuthn/passkey dialog using Lazorkit’s portal.
  - Uses the **paymaster** as fee payer for subsequent transactions.
- `isConnected`, `isLoading`, `isConnecting`, `isSigning`:
  - Control the UI (buttons enabled/disabled, “Working…” labels, etc.).
- `wallet`:
  - Gives you info like `wallet.accountName` and `wallet.smartWallet` for display.

---

## Example: Signing messages via Lazorkit

`SignMessage` showcases signing arbitrary messages with the user’s passkey through Lazorkit:

```9:13:src/components/SignMessage.tsx
const { isConnected, isLoading, isSigning, signMessage } = useWallet();

const [message, setMessage] = useState('Hello from Lazorkit passkeys!');
const [signedMessage, setSignedMessage] =
  useState<{ signature: string; signedPayload: string } | null>(null);
```

The signing handler:

```16:23:src/components/SignMessage.tsx
const handleSign = async () => {
  onStatusChange?.('Opening passkey dialog to sign…');
  setSignedMessage(null);
  try {
    const res = await signMessage(message);
    setSignedMessage(res);
    onStatusChange?.('Message signed.');
  } catch (e) {
    onStatusChange?.(null);
    throw e;
  }
};
```

As a new dev, the pattern to copy is:

1. Read `isConnected` / `isLoading` / `isSigning` from `useWallet()` to drive UI.
2. Call `await signMessage("your-message")`.
3. Surface status and results via your own state and `onStatusChange`.

---

## Example: Sending a gasless transaction

`GaslessTransaction` shows how to build and send a **System Program transfer** (SOL transfer) using Lazorkit’s **gasless** flow via `signAndSendTransaction`.

Key wallet values:

```14:15:src/components/GaslessTransaction.tsx
const { isConnected, isLoading, isSigning, smartWalletPubkey, signAndSendTransaction } = useWallet();
```

The component lets the user input:

- A **recipient public key** (base58 string).
- An **amount** (interpreted as SOL or lamports, depending on your chosen UX — adapt as needed).

A simplified version of the transfer instruction builder:

```20:33:src/components/GaslessTransaction.tsx
const buildTransferInstruction = (toPubkeyStr: string, lamports: number): TransactionInstruction => {
  if (!smartWalletPubkey) {
    throw new Error('Smart wallet public key not available');
  }

  let to: PublicKey;
  try {
    to = new PublicKey(toPubkeyStr);
  } catch {
    throw new Error('Invalid recipient public key');
  }

  if (!Number.isFinite(lamports) || lamports <= 0) {
    throw new Error('Amount must be a positive number');
  }

  return SystemProgram.transfer({
    fromPubkey: smartWalletPubkey,
    toPubkey: to,
    lamports,
  });
};
```

Sending the gasless transaction:

```35:45:src/components/GaslessTransaction.tsx
const handleSendTx = async () => {
  setTxSig(null);
  onStatusChange?.('Preparing transfer transaction…');
  try {
    // Obtain recipient and amount from the UI
    const lamports = Number(lamportsref.current?.value);
    const recipient = String(recipientref.current?.value);

    const ix = buildTransferInstruction(recipient, lamports);
    onStatusChange?.('Opening passkey dialog to authorize…');

    const signature = await signAndSendTransaction({
      instructions: [ix],
      transactionOptions: { clusterSimulation: 'devnet' },
    });

    setTxSig(signature);
    onStatusChange?.('Transaction sent.');
  } catch (e) {
    onStatusChange?.(null);
    throw e;
  }
};
```

The important pattern:

1. Build one or more `TransactionInstruction`s (here a Solana `SystemProgram.transfer`).
2. Call `signAndSendTransaction({ instructions, transactionOptions })` from `useWallet`.
3. Use `paymasterUrl` in `LazorkitProvider` so that **fees are paid by the paymaster**, not the end user.
4. Optionally, show the transaction in Solana Explorer (this starter uses devnet links).

---

## High-level architecture for new devs

- **State orchestration**:
  - `WalletDemo` keeps a `status` string and passes `setStatus` down as `onStatusChange` to all children (`WalletConnection`, `SignMessage`, `GaslessTransaction`).
  - Each child calls `onStatusChange('...')` to show progress or `onStatusChange(null)` to clear it.

- **Wallet operations** (all via `useWallet`):
  - `connect({ feeMode: 'paymaster' })`: Connect wallet via passkey, set up gasless flow.
  - `disconnect()`: Clear connection.
  - `signMessage(message)`: Ask user to sign arbitrary data via Lazorkit portal.
  - `signAndSendTransaction({ instructions, transactionOptions })`: Build arbitrary Solana transactions and send them gaslessly.

- **UI framework**:
  - React 19 + Vite 7, using functional components and hooks.
  - Tailwind CSS for styling, wired via the Tailwind Vite plugin.

---

## Tooling and plugins

### Vite plugins

Configured in `vite.config.ts`:

```1:6:vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  }
})
```

- **`@vitejs/plugin-react`**:
  - React Fast Refresh
  - JSX/TSX transform
  - Better DX for React in Vite.
- **`@tailwindcss/vite`**:
  - Integrates Tailwind CSS with Vite’s build pipeline.
  - Lets you use Tailwind utility classes directly in JSX.

### Dependencies of interest

From `package.json`:

- **Runtime**
  - `@lazorkit/wallet`: Lazorkit SDK; provides `LazorkitProvider`, `useWallet`, and portal flows for passkeys + paymaster.
  - `@solana/web3.js`: Solana primitives (`PublicKey`, `SystemProgram`, `TransactionInstruction`, etc.).
  - `@coral-xyz/anchor`: Solana/Anchor SDK (available for integration with Anchor programs).
  - `react`, `react-dom`: React itself.
  - `tailwindcss`: Utility-first CSS framework for styling.

- **Dev / linting**
  - `vite`: Bundler/dev server.
  - `typescript`: TypeScript support.
  - `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`: ESLint setup for React + TS.

### NPM scripts

```6:10:package.json
"scripts": {
  "dev": "vite",              # Run dev server
  "build": "tsc -b && vite build",  # Type check + production build
  "lint": "eslint .",         # Lint all files
  "preview": "vite preview"   # Preview built app
}
```

---

## Adapting this starter to your own app

As a new developer, the main steps to integrate Lazorkit into your own project are:

1. **Wrap your app in `LazorkitProvider`** with the correct `paymasterConfig`:
   - Use your own paymaster URL for mainnet / testnet as needed.
2. **Use `useWallet()` in your components**:
   - Check `isConnected`, `isLoading`, `isSigning` to drive UX.
   - Call `connect` / `disconnect` for authentication-type flows.
   - Call `signMessage` for off-chain auth / signatures.
   - Call `signAndSendTransaction` with Solana `TransactionInstruction`s for on-chain interactions (use gasless mode via paymaster).
3. **Follow the patterns in**:
   - `WalletConnection` for connection UX.
   - `SignMessage` for off-chain signing.
   - `GaslessTransaction` for building and sending on-chain gasless transfers.

This starter is intentionally small so you can copy/paste the patterns into your own codebase and then extend them for your specific dapp logic.
```