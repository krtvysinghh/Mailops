import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';

export interface GdprExportCardProps {
  userId: string;
}

export function GdprExportCard({ userId }: GdprExportCardProps) {
  const { exportUserData, purgeUserAccount } = useSecurity();
  const [downloading, setDownloading] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const data = await exportUserData(userId);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mailops-data-export-${userId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download GDPR export bundle.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePurge = async () => {
    if (confirmText !== 'DELETE_FOREVER') return;
    setPurging(true);
    try {
      const res = await purgeUserAccount(userId);
      setPurgeResult(res.complianceAttestation);
      setShowPurgeModal(false);
    } catch {
      alert('Failed to complete account cryptographic erasure.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">📜</span>
        <h3 className="text-base font-bold text-gray-900">Privacy & Data Governance (GDPR / CCPA)</h3>
      </div>
      <p className="text-xs text-gray-600 mb-5">
        Manage your personal data, request full portable archives, or exercise your Right to be Forgotten under GDPR Article 17 / CCPA.
      </p>

      {purgeResult && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
          <strong>Account Purged:</strong> {purgeResult}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <strong className="block text-xs text-gray-900 font-semibold">Download Complete Data Archive</strong>
            <span className="text-[11px] text-gray-500">Export all profile metadata, contacts, and raw RFC 822 EML email records as JSON.</span>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={downloading}
            className="px-3.5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            {downloading ? 'Bundling Archive...' : 'Download JSON / EML'}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-rose-50/60 rounded-lg border border-rose-200">
          <div>
            <strong className="block text-xs text-rose-900 font-semibold">Right to be Forgotten (Scrub & Purge)</strong>
            <span className="text-[11px] text-rose-700">Permanently and cryptographically shred all emails, drafts, and account records.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPurgeModal(true)}
            className="px-3.5 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            Purge Account
          </button>
        </div>
      </div>

      {showPurgeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-300 text-gray-900">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base mb-2">
              <span>⚠️</span>
              <h4>Irreversible Account Cryptographic Erasure</h4>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              This action permanently overwrites and deletes all emails, contacts, keys, and metadata. This cannot be undone.
              To confirm, type <strong className="font-mono text-rose-700">DELETE_FOREVER</strong> below:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE_FOREVER"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-4 font-mono font-bold"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={purging || confirmText !== 'DELETE_FOREVER'}
                className="px-4 py-2 text-sm rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium disabled:opacity-50"
              >
                {purging ? 'Shredding Data...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
