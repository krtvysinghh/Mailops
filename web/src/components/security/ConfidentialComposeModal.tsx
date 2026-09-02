import React, { useState } from 'react';

export interface ConfidentialSettings {
  enabled: boolean;
  ttlSeconds: number;
  maxViews: number;
  passcode?: string;
}

export interface ConfidentialComposeModalProps {
  isOpen: boolean;
  settings: ConfidentialSettings;
  onSave: (settings: ConfidentialSettings) => void;
  onClose: () => void;
}

export function ConfidentialComposeModal({
  isOpen,
  settings,
  onSave,
  onClose,
}: ConfidentialComposeModalProps) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [ttl, setTtl] = useState(settings.ttlSeconds || 86400);
  const [maxViews, setMaxViews] = useState(settings.maxViews || 1);
  const [passcode, setPasscode] = useState(settings.passcode || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      enabled,
      ttlSeconds: Number(ttl),
      maxViews: Number(maxViews),
      passcode: passcode.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-gray-900">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <h3 className="text-base font-bold">Confidential Mode & Expiration</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-semibold block text-gray-900">Enable Confidential Self-Destruct</span>
              <span className="text-xs text-gray-500">Recipients cannot forward, copy, or print this email.</span>
            </div>
          </label>

          {enabled && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Access Expiration
                </label>
                <select
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3600}>1 Hour</option>
                  <option value={86400}>1 Day (24 Hours)</option>
                  <option value={259200}>3 Days</option>
                  <option value={604800}>1 Week (7 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Maximum Views ("Burn After Reading")
                </label>
                <select
                  value={maxViews}
                  onChange={(e) => setMaxViews(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 View (Burn immediately upon opening)</option>
                  <option value={3}>3 Views</option>
                  <option value={10}>10 Views</option>
                  <option value={999999}>Unlimited views until expiration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Optional PIN Passcode Protection
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter 4-8 digit passcode (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-gray-500">
                  If set, recipient must enter this passcode to unlock and decrypt message.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
