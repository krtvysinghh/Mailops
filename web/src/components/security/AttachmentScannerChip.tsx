import React from 'react';

export interface AttachmentScannerChipProps {
  filename: string;
  sizeBytes: number;
  quarantineStatus?: 'clean' | 'quarantined' | 'suspicious';
  detectedMime?: string;
  riskReasons?: string[];
  downloadUrl?: string;
}

export function AttachmentScannerChip({
  filename,
  sizeBytes,
  quarantineStatus = 'clean',
  detectedMime,
  riskReasons = [],
  downloadUrl,
}: AttachmentScannerChipProps) {
  const isDangerous = quarantineStatus === 'quarantined';
  const isSuspicious = quarantineStatus === 'suspicious';
  const isClean = quarantineStatus === 'clean';

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`inline-flex items-center gap-3 p-2.5 rounded-lg border text-xs max-w-sm transition-all ${
        isDangerous
          ? 'bg-rose-50 border-rose-300 text-rose-900'
          : isSuspicious
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : 'bg-white border-gray-200 text-gray-800 shadow-sm hover:border-gray-300'
      }`}
    >
      <div className="text-xl">
        {isDangerous ? '🚫' : isSuspicious ? '⚠️' : '📎'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate" title={filename}>
          {filename}
        </div>
        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
          <span>{formatSize(sizeBytes)}</span>
          <span>•</span>
          {isClean ? (
            <span className="text-emerald-600 font-medium">Clean (Magic Bytes Verified)</span>
          ) : isDangerous ? (
            <span className="text-rose-600 font-bold">Blocked / Quarantined</span>
          ) : (
            <span className="text-amber-600 font-medium">Suspicious File</span>
          )}
        </div>
        {riskReasons.length > 0 && (
          <div className="text-[10px] text-rose-700 italic mt-1 truncate" title={riskReasons.join('; ')}>
            {riskReasons[0]}
          </div>
        )}
      </div>

      <div>
        {isDangerous ? (
          <button
            type="button"
            disabled
            className="px-2.5 py-1 text-[11px] bg-gray-200 text-gray-400 rounded cursor-not-allowed font-medium"
            title="Download disabled for quarantined attachments"
          >
            Blocked
          </button>
        ) : (
          <a
            href={downloadUrl || '#'}
            download={filename}
            className="px-2.5 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors"
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
}
