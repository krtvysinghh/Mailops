import React, { useState } from 'react';

export interface EncryptedMailViewerProps {
  encryptedEnvelopeJson?: string;
  onDecrypted?: (plaintext: string) => void;
}

export function EncryptedMailViewer({
  encryptedEnvelopeJson,
  onDecrypted,
}: EncryptedMailViewerProps) {
  const [passphrase, setPassphrase] = useState('');
  const [decryptedBody, setDecryptedBody] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  // Client-side PBKDF2 + AES-256-GCM Web Crypto decryption
  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) {
      setError('Please enter decryption password');
      return;
    }

    setDecrypting(true);
    setError(null);

    try {
      if (!encryptedEnvelopeJson) {
        throw new Error('No encrypted envelope data available');
      }

      const envelope = JSON.parse(encryptedEnvelopeJson);
      if (!envelope.salt || !envelope.iv || !envelope.ciphertext) {
        throw new Error('Invalid envelope structure');
      }

      // 1. Decode base64 components
      const salt = Uint8Array.from(atob(envelope.salt), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(envelope.iv), c => c.charCodeAt(0));
      const ciphertext = Uint8Array.from(atob(envelope.ciphertext), c => c.charCodeAt(0));

      // 2. PBKDF2 Key Derivation
      const encoder = new TextEncoder();
      const baseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const aesKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: envelope.iterations || 100000,
          hash: 'SHA-256',
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // 3. Decrypt AES-GCM
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext
      );

      const plaintext = new TextDecoder().decode(decryptedBuffer);
      setDecryptedBody(plaintext);
      if (onDecrypted) onDecrypted(plaintext);
    } catch {
      setError('Decryption failed: Incorrect password or corrupted payload');
    } finally {
      setDecrypting(false);
    }
  };

  if (decryptedBody !== null) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-5">
        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-3">
          <span>🔓</span>
          <span>Message Decrypted (AES-256-GCM)</span>
        </div>
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
          {decryptedBody}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-w-lg mx-auto text-center">
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 text-2xl">
        🔒
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">
        End-to-End Encrypted Message
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        This email payload is encrypted using client-side AES-256-GCM. Enter the sender&apos;s passphrase to decrypt.
      </p>

      <form onSubmit={handleDecrypt} className="space-y-3">
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Enter decryption passphrase"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <div className="text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={decrypting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-md transition-colors disabled:opacity-50"
        >
          {decrypting ? 'Decrypting...' : 'Decrypt Message'}
        </button>
      </form>
    </div>
  );
}
