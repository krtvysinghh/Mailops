import React, { useState } from 'react';

export interface PhishingWarningBannerProps {
  isSuspicious: boolean;
  score: number;
  riskLevel?: 'safe' | 'low' | 'suspicious' | 'malicious';
  flags?: string[];
  flaggedLinks?: Array<{ href: string; anchorText: string; reason: string; severity: string }>;
}

export function PhishingWarningBanner({
  isSuspicious,
  score,
  riskLevel = 'suspicious',
  flags = [],
  flaggedLinks = [],
}: PhishingWarningBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [targetWarningLink, setTargetWarningLink] = useState<string | null>(null);

  if (!isSuspicious && score < 0.35) {
    return null;
  }

  const isMalicious = riskLevel === 'malicious' || score >= 0.70;

  return (
    <>
      <div
        className={`mb-4 p-4 rounded-lg border text-sm ${
          isMalicious
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 font-semibold text-base">
            <span className="text-xl">{isMalicious ? '🚨' : '⚠️'}</span>
            <span>
              {isMalicious
                ? `High-Risk Phishing Warning (Risk Score: ${Math.round(score * 100)}/100)`
                : `Suspicious Email Detected (Risk Score: ${Math.round(score * 100)}/100)`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium underline cursor-pointer hover:opacity-80"
          >
            {expanded ? 'Hide Details' : 'View Security Analysis'}
          </button>
        </div>

        <p className="mt-1 text-xs opacity-90">
          This message contains patterns commonly used in identity theft, credential harvesting, or fake brand impersonation.
          Do not click links or provide sensitive passwords.
        </p>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-current/20 space-y-2 text-xs">
            {flags.length > 0 && (
              <div>
                <strong className="block mb-1">Detected Threat Indicators:</strong>
                <ul className="list-disc list-inside space-y-0.5">
                  {flags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {flaggedLinks.length > 0 && (
              <div className="mt-2">
                <strong className="block mb-1">Flagged Deceptive Hyperlinks:</strong>
                <div className="space-y-1">
                  {flaggedLinks.map((link, idx) => (
                    <div key={idx} className="bg-white/60 p-2 rounded border border-current/20">
                      <div className="font-mono text-[11px] truncate">
                        Visible: <span className="font-bold">{link.anchorText || '(empty)'}</span>
                      </div>
                      <div className="font-mono text-[11px] truncate text-red-600">
                        Target: {link.href}
                      </div>
                      <div className="text-[11px] text-gray-700 italic mt-0.5">
                        Reason: {link.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation modal if user tries to click a flagged link */}
      {targetWarningLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-rose-300 text-gray-900">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold">Potentially Dangerous Website</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You are about to navigate to an external link that was flagged as a potential phishing or spoofing destination:
            </p>
            <div className="bg-gray-100 p-2.5 rounded font-mono text-xs text-gray-800 break-all mb-4">
              {targetWarningLink}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTargetWarningLink(null)}
                className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Cancel (Recommended)
              </button>
              <a
                href={targetWarningLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setTargetWarningLink(null)}
                className="px-4 py-2 text-sm rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                Proceed Anyway
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
