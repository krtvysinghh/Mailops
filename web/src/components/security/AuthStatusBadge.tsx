import React, { useState } from 'react';

export interface AuthStatusBadgeProps {
  verdict?: 'PASS' | 'FAIL' | 'TEMPFAIL' | 'NONE';
  spfStatus?: string | null;
  dkimStatus?: string | null;
  dmarcStatus?: string | null;
  fromAddr?: string;
}

export function AuthStatusBadge({
  verdict = 'NONE',
  spfStatus,
  dkimStatus,
  dmarcStatus,
  fromAddr,
}: AuthStatusBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isPass = verdict === 'PASS' || (spfStatus === 'pass' && dkimStatus === 'pass');
  const isFail = verdict === 'FAIL' || spfStatus === 'fail' || dkimStatus === 'fail' || dmarcStatus === 'fail';

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
          isPass
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            : isFail
            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
        }`}
        title="Click to view email authentication details (SPF, DKIM, DMARC)"
      >
        {isPass ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>🛡️ Verified Sender (DKIM & SPF Pass)</span>
          </>
        ) : isFail ? (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>⚠️ Unverified / Spoofing Risk</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span>Auth: None</span>
          </>
        )}
      </button>

      {showDetails && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 text-gray-800">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <span>Authentication Report</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600 text-base leading-none"
            >
              &times;
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {fromAddr && (
              <div className="text-gray-500 truncate pb-1">
                Sender: <span className="font-mono text-gray-700">{fromAddr}</span>
              </div>
            )}

            <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded">
              <span className="font-medium">SPF (RFC 7208)</span>
              <span
                className={`font-semibold uppercase px-1.5 py-0.5 rounded text-[10px] ${
                  spfStatus === 'pass'
                    ? 'bg-emerald-100 text-emerald-800'
                    : spfStatus === 'fail'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {spfStatus || 'None'}
              </span>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded">
              <span className="font-medium">DKIM (RFC 6376)</span>
              <span
                className={`font-semibold uppercase px-1.5 py-0.5 rounded text-[10px] ${
                  dkimStatus === 'pass'
                    ? 'bg-emerald-100 text-emerald-800'
                    : dkimStatus === 'fail'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {dkimStatus || 'None'}
              </span>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded">
              <span className="font-medium">DMARC (RFC 7489)</span>
              <span
                className={`font-semibold uppercase px-1.5 py-0.5 rounded text-[10px] ${
                  dmarcStatus === 'pass'
                    ? 'bg-emerald-100 text-emerald-800'
                    : dmarcStatus === 'fail'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {dmarcStatus || 'None'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
