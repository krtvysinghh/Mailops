import React, { useState } from 'react';

export interface TrackingShieldBadgeProps {
  strippedCount: number;
  privacySummary?: string;
  blockedTrackers?: Array<{ type: string; url: string; reason: string }>;
}

export function TrackingShieldBadge({
  strippedCount,
  privacySummary,
  blockedTrackers = [],
}: TrackingShieldBadgeProps) {
  const [showPopover, setShowPopover] = useState(false);

  if (strippedCount <= 0) {
    return null;
  }

  return (
    <div className="relative inline-block text-xs">
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
        title="Privacy Shield: Tracking pixels stripped"
      >
        <span>🛡️</span>
        <span>
          {strippedCount} Spy Pixel{strippedCount > 1 ? 's' : ''} Blocked
        </span>
      </button>

      {showPopover && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 text-gray-800">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-2">
            <h4 className="font-semibold text-sm text-indigo-900 flex items-center gap-1.5">
              <span>🛡️ Privacy Shield Active</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowPopover(false)}
              className="text-gray-400 hover:text-gray-600 text-base leading-none"
            >
              &times;
            </button>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            {privacySummary ||
              `Mailops blocked ${strippedCount} hidden tracking pixel(s). The sender cannot track your open time, location, or device.`}
          </p>

          {blockedTrackers.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              <strong className="block text-[11px] text-gray-500 uppercase">
                Blocked Endpoints:
              </strong>
              {blockedTrackers.map((t, idx) => (
                <div key={idx} className="bg-gray-50 p-1.5 rounded text-[11px] border border-gray-100">
                  <div className="font-medium text-gray-800">{t.reason}</div>
                  <div className="font-mono text-[10px] text-gray-400 truncate">{t.url}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
