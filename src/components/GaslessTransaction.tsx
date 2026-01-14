import { useRef, useState } from 'react';
import { SystemProgram, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { useWallet } from '@lazorkit/wallet';

function explorerTxUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

interface GaslessTransactionProps {
  onStatusChange?: (status: string | null) => void;
}

export default function GaslessTransaction({ onStatusChange }: GaslessTransactionProps) {
  const { isConnected, isLoading, isSigning, smartWalletPubkey, signAndSendTransaction } = useWallet();
  
  const [txSig, setTxSig] = useState<string | null>(null);
  const recipientref= useRef<HTMLInputElement>(null);
  const lamportsref = useRef<HTMLInputElement>(null);

  const canSendTx = !isLoading && isConnected && !!recipientref && !!lamportsref;

  const buildTransferInstruction = (toPubkeyStr: string, lamportsStr: number): TransactionInstruction => {
    if (!smartWalletPubkey) {
      throw new Error('Smart wallet public key not available');
    }
    let to: PublicKey;
    try {
      to = new PublicKey(toPubkeyStr);
    } catch {
      throw new Error('Invalid recipient public key');
    }

    if (!Number.isFinite(lamportsStr) || lamportsStr <= 0) {
      throw new Error('Amount must be a positive number of Solana');
    }
    return SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: to,
      lamports: lamportsStr,
    });
  };

  const handleSendTx = async () => {
    setTxSig(null);
    onStatusChange?.('Preparing transfer transaction…');
    try {
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

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div>
        <div className="font-semibold">Send gasless transaction</div>
        <div className="text-sm text-zinc-400">
          Builds an instruction and calls <span className="font-mono">signAndSendTransaction</span>.
          The SDK uses the paymaster as fee payer and submits the transaction.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-400">Recipient public key</label>
          <input
            type="text"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Enter recipient's public key"
            ref={recipientref}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-zinc-400">Amount (Solana)</label>
          <input
            type="number"
            min="1"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="e.g 1"
            ref = {lamportsref}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded-md bg-white text-black disabled:opacity-50 hover:cursor-pointer"
          disabled={!canSendTx}
          onClick={handleSendTx}
        >
          Send gasless tx
        </button>
        <div className="text-xs text-zinc-400">
          {isSigning ? 'Signing…' : null}
        </div>
      </div>

      {txSig ? (
        <div className="text-sm rounded-md bg-zinc-950/40 border border-zinc-800 p-3 space-y-2">
          <div>
            <div className="text-zinc-400">Signature</div>
            <div className="font-mono break-all">{txSig}</div>
          </div>
          <a
            className="text-sm text-sky-300 hover:underline"
            href={explorerTxUrl(txSig)}
            target="_blank"
          >
            View on Solana Explorer (devnet)
          </a>
        </div>
      ) : null}
    </div>
  );
}
