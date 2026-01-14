import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';

interface SignMessageProps {
  onStatusChange?: (status: string | null) => void;
}

export default function SignMessage({ onStatusChange }: SignMessageProps) {
  const { isConnected, isLoading, isSigning, signMessage } = useWallet();
  
  const [message, setMessage] = useState('Hello from Lazorkit passkeys!');
  const [signedMessage, setSignedMessage] = useState<{ signature: string; signedPayload: string } | null>(null);

  const canSignMessage = !isLoading && isConnected;

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

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div>
        <div className="font-semibold">Sign message with passkey</div>
        <div className="text-sm text-zinc-400">
          Uses the SDK portal dialog to sign a message via WebAuthn/passkeys.
        </div>
      </div>

      <textarea
        className="w-full min-h-20 rounded-md bg-zinc-950/40 border border-zinc-800 p-3 text-sm"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message to sign"
      />

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded-md bg-white text-black disabled:opacity-50"
          disabled={!canSignMessage || !message.trim()}
          onClick={handleSign}
        >
          Sign message
        </button>
        <div className="text-xs text-zinc-400">
          {isSigning ? 'Signing…' : null}
        </div>
      </div>

      {signedMessage ? (
        <div className="text-sm rounded-md bg-zinc-950/40 border border-zinc-800 p-3 space-y-2">
          <div>
            <div className="text-zinc-400">Signature</div>
            <div className="font-mono break-all">{signedMessage.signature}</div>
          </div>
          <div>
            <div className="text-zinc-400">Signed payload</div>
            <div className="font-mono break-all">{signedMessage.signedPayload}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
