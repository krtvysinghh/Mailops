import React from 'react';

export interface DlpViolationItem {
  category: string;
  matchedText: string;
  maskedText: string;
  description: string;
}

export interface DlpWarningModalProps {
  isOpen: boolean;
  violations: DlpViolationItem[];
  onRedactAndSend: () => void;
  onOverrideAndSend: () => void;
  onCancel: () => void;
}

export function DlpWarningModal({
  isOpen,
  violations,
  onRedactAndSend,
  onOverrideAndSend,
  onCancel,
}: DlpWarningModalProps) {
  if (!isOpen || violations.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 text-gray-900">
        <div className="flex items-center gap-3 text-amber-600 mb-2">
          <span className="text-2xl">🛡️</span>
          <h3 className="text-lg font-bold">Data Loss Prevention (DLP) Alert</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Mailops detected sensitive confidential data or PII in your outgoing email draft. Sending unredacted secrets may violate compliance policies (GDPR, PCI-DSS, SOC2).
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-48 overflow-y-auto mb-5 space-y-2">
          {violations.map((v, idx) => (
            <div key={idx} className="text-xs bg-white/80 p-2 rounded border border-amber-200">
              <div className="font-semibold text-amber-900 flex justify-between">
                <span>{v.description}</span>
                <span className="uppercase text-[10px] bg-amber-100 text-amber-800 px-1 rounded">
                  {v.category}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[11px]">
                <span className="text-gray-400">Masked Preview:</span>
                <span className="text-emerald-700 font-bold">{v.maskedText}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Cancel & Edit Draft
          </button>
          <button
            type="button"
            onClick={onOverrideAndSend}
            className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold"
          >
            Override & Send Raw
          </button>
          <button
            type="button"
            onClick={onRedactAndSend}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow"
          >
            Redact Sensitive Data & Send
          </button>
        </div>
      </div>
    </div>
  );
}
