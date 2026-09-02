import React, { useState } from 'react';
import type { UnsubscribeResult } from '../../context/AIContext';

interface UnsubscribeBannerProps {
  unsubscribeInfo: UnsubscribeResult | null;
  onUnsubscribeSuccess?: () => void;
}

export const UnsubscribeBanner: React.FC<UnsubscribeBannerProps> = ({
  unsubscribeInfo,
  onUnsubscribeSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);

  if (!unsubscribeInfo || (!unsubscribeInfo.unsubscribeUrl && !unsubscribeInfo.mailtoTarget)) {
    return null;
  }

  const handleUnsubscribe = async () => {
    setIsProcessing(true);
    try {
      if (unsubscribeInfo.method === 'one-click-post' && unsubscribeInfo.unsubscribeUrl) {
        // Send RFC 8058 POST request
        await fetch(unsubscribeInfo.unsubscribeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'List-Unsubscribe=One-Click',
          mode: 'no-cors',
        });
      } else if (unsubscribeInfo.mailtoTarget) {
        window.location.href = unsubscribeInfo.mailtoTarget;
      } else if (unsubscribeInfo.unsubscribeUrl) {
        window.open(unsubscribeInfo.unsubscribeUrl, '_blank', 'noopener,noreferrer');
      }

      setUnsubscribed(true);
      onUnsubscribeSuccess?.();
    } catch (err) {
      console.error('Failed to execute unsubscribe:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (unsubscribed) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium mb-3">
        <span className="flex items-center gap-1.5">
          <span>✅</span> Unsubscribe request sent successfully!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2.5 bg-gray-50/90 border border-gray-200 rounded-lg mb-3 shadow-2xs">
      <div className="flex items-center gap-2 min-w-0 pr-3">
        <span className="text-sm">📫</span>
        <span className="text-xs text-gray-600 truncate">
          This email is from a mailing list or newsletter.
        </span>
      </div>

      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={isProcessing}
        className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-100 transition-colors shadow-2xs whitespace-nowrap cursor-pointer disabled:opacity-50"
      >
        {isProcessing
          ? 'Unsubscribing...'
          : unsubscribeInfo.canOneClick
          ? '1-Click Unsubscribe'
          : 'Unsubscribe'}
      </button>
    </div>
  );
};
