import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';

export interface TwoFactorSetupModalProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  onClose: () => void;
}

export function TwoFactorSetupModal({
  isOpen,
  userId,
  userEmail,
  onClose,
}: TwoFactorSetupModalProps) {
  const {
    is2FaEnabled,
    setup2FaData,
    initiate2FaSetup,
    verify2FaCode,
    disable2Fa,
  } = useSecurity();

  const [step, setStep] = useState<'init' | 'scan' | 'verified'>('init');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    const ok = await initiate2FaSetup(userId, userEmail);
    setLoading(false);
    if (ok) {
      setStep('scan');
    } else {
      setError('Failed to initiate 2FA setup. Please try again.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 && code.length !== 8 && code.length !== 9) {
      setError('Enter a valid 6-digit code or 8-digit backup code');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await verify2FaCode(userId, code);
    setLoading(false);

    if (res.success) {
      setStep('verified');
    } else {
      setError(res.error || 'Invalid 2FA code. Please check your authenticator app.');
    }
  };

  const handleDisable = async () => {
    const inputCode = prompt('Enter a 6-digit 2FA code to confirm disabling:');
    if (!inputCode) return;
    setLoading(true);
    const ok = await disable2Fa(userId, inputCode);
    setLoading(false);
    if (ok) {
      alert('2FA successfully disabled.');
      onClose();
    } else {
      alert('Failed to disable 2FA. Incorrect confirmation code.');
    }
  };

  const copySecret = () => {
    if (setup2FaData?.secret) {
      navigator.clipboard.writeText(setup2FaData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 text-gray-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔐</span>
            <h3 className="text-base font-bold">Two-Factor Authentication (2FA)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {is2FaEnabled && step !== 'verified' ? (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <strong className="block text-emerald-900">2FA is currently active</strong>
                <span className="text-xs text-emerald-700">Your account is secured with RFC 6238 TOTP authentication.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDisable}
              disabled={loading}
              className="w-full py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-medium text-sm transition-colors"
            >
              {loading ? 'Processing...' : 'Disable Two-Factor Authentication'}
            </button>
          </div>
        ) : step === 'init' ? (
          <div className="space-y-4 text-sm">
            <p className="text-gray-600 text-xs">
              Enhance your Mailops account security with an authenticator app (Google Authenticator, 1Password, Authy).
            </p>
            <button
              type="button"
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors"
            >
              {loading ? 'Generating Secrets...' : 'Enable 2FA Authenticator'}
            </button>
          </div>
        ) : step === 'scan' && setup2FaData ? (
          <div className="space-y-4 text-sm">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-3">
                Scan this QR code with your mobile authenticator app:
              </p>

              {/* QR Code SVG */}
              <div
                className="w-48 h-48 mx-auto p-2 bg-white border border-gray-200 rounded-lg shadow-inner flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: setup2FaData.qrSvg }}
              />

              <div className="mt-3">
                <span className="text-[11px] text-gray-500 block mb-1">Manual Base32 Key:</span>
                <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded font-mono text-xs font-bold text-gray-800">
                  <span>{setup2FaData.secret}</span>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="text-blue-600 hover:underline text-[11px]"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-gray-700">
                Enter 6-digit Code from Authenticator
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center tracking-widest text-lg font-mono font-bold px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />

              {error && <div className="text-xs text-rose-600 font-medium text-center">{error}</div>}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Activate 2FA'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-center">
              <span className="text-3xl block mb-1">🎉</span>
              <strong className="block text-base">2FA Activated Successfully!</strong>
              <span className="text-xs">Save your emergency backup recovery codes in a safe place.</span>
            </div>

            {setup2FaData?.backupCodes && (
              <div>
                <span className="block text-xs font-bold text-gray-700 mb-2">Emergency Recovery Backup Codes (Single-Use):</span>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 font-mono text-xs text-center font-semibold text-gray-800">
                  {setup2FaData.backupCodes.map((c, i) => (
                    <div key={i} className="bg-white py-1 rounded border border-gray-100">{c}</div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-medium rounded-lg shadow"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
