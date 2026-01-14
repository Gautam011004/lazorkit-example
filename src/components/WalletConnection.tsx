import { useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';

function short(value: string, head = 6, tail = 6) {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

interface WalletConnectionProps {
  onStatusChange?: (status: string | null) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function WalletConnection({ 
  onStatusChange, 
  onConnect, 
  onDisconnect 
}: WalletConnectionProps) {
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

  const canConnect = !isLoading && !isConnected;
  const canDisconnect = !isLoading && isConnected;

  const smartWalletDisplay = useMemo(() => {
    const addr = wallet?.smartWallet;
    return addr ? short(addr) : null;
  }, [wallet?.smartWallet]);

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

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-zinc-400">Status</div>
          <div className="font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
            {(isConnecting || isSigning) ? (
              <span className="text-zinc-400"> · Working…</span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-md bg-white text-black disabled:opacity-50 hover:cursor-pointer"
            disabled={!canConnect}
            onClick={handleConnect}
          >
            Connect with Passkey
          </button>

          <button
            className="px-3 py-2 rounded-md border border-zinc-700 text-white disabled:opacity-50 hover:cursor-pointer"
            disabled={!canDisconnect}
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-zinc-950/40 border border-zinc-800 p-3">
          <div className="text-zinc-400">Account name</div>
          <div className="font-medium">{wallet?.accountName ?? '—'}</div>
        </div>
        <div className="rounded-md bg-zinc-950/40 border border-zinc-800 p-3">
          <div className="text-zinc-400">Smart wallet</div>
          <div className="font-medium">{smartWalletDisplay ?? '—'}</div>
        </div>
      </div>

      {error ? (
        <div className="text-sm rounded-md border border-red-900/50 bg-red-950/40 p-3 text-red-200">
          {error.message}
        </div>
      ) : null}
    </div>
  );
}
