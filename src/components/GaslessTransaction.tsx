import { useState } from 'react';
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

  const canSendTx = !isLoading && isConnected;

  const buildDemoInstruction = (): TransactionInstruction => {
    if (!smartWalletPubkey) {
      throw new Error('Smart wallet public key not available');
    }

    // A harmless demo instruction: 0-lamport self transfer.
    // This still demonstrates the full passkey + paymaster execution path.
    const to = new PublicKey(smartWalletPubkey.toBase58());
    return SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: to,
      lamports: 0,
    });
  };

  const handleSendTx = async () => {
    setTxSig(null);
    onStatusChange?.('Preparing demo transaction…');
    try {
      const ix = buildDemoInstruction();
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

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded-md bg-white text-black disabled:opacity-50"
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
            rel="noreferrer"
          >
            View on Solana Explorer (devnet)
          </a>
        </div>
      ) : null}
    </div>
  );
}
