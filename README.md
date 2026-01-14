# Lazorkit Starter (Passkeys + Gasless Tx Demo)

Single-page demo showing:
- **Passkey wallet connect** (WebAuthn) via `@lazorkit/wallet`
- **Message signing** via passkey
- **Gasless transaction sending** using the Lazorkit paymaster flow

## Run

```bash
npm install
npm run dev
```

## What to expect
- **Connect with Passkey**: opens the Lazorkit portal dialog, creates/restores your smart wallet, and stores it locally.
- **Sign message**: opens the portal signing dialog and returns a signature + signed payload.
- **Send gasless tx**: submits a demo instruction through `signAndSendTransaction` (paymaster pays fees) and shows a devnet explorer link.

## Configuration
By default the app uses the SDK **DEFAULTS** (devnet RPC/portal/paymaster). If you need to override these, pass `rpcUrl`, `portalUrl`, or `paymasterConfig` to `LazorkitProvider` in `src/main.tsx`.
