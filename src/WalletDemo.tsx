import { useState } from 'react';
import WalletConnection from './components/WalletConnection';
import SignMessage from './components/SignMessage';
import GaslessTransaction from './components/GaslessTransaction';

export default function WalletDemo() {
  const [status, setStatus] = useState<string | null>(null);

  const handleConnect = () => {
    setStatus(null);
  };

  const handleDisconnect = () => {
    setStatus(null);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-2xl p-6">
        <div className="mb-6">
          <div className="text-2xl font-semibold">Lazorkit Starter</div>
          <div className="text-sm text-zinc-400">
            Passkeys + gasless transactions demo (devnet defaults)
          </div>
        </div>

        <WalletConnection 
          onStatusChange={setStatus}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        {status ? (
          <div className="mt-3 text-sm text-zinc-300">{status}</div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4">
          <SignMessage onStatusChange={setStatus} />
          <GaslessTransaction onStatusChange={setStatus} />
        </div>
      </div>
    </div>
  );
}
