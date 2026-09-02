import React from 'react';
import { useSecurity } from '../../context/SecurityContext';

export function RateLimitToast() {
  const { rateLimitState, dismissRateLimitToast } = useSecurity();

  if (!rateLimitState.active) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce">
      <div className="bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3.5 max-w-sm">
        <span className="text-2xl">⏳</span>
        <div className="flex-1 min-w-0 text-xs">
          <h5 className="font-bold text-sm text-amber-400">Rate Limit Exceeded</h5>
          <p className="text-slate-300 mt-0.5">
            Too many requests. Please wait{' '}
            <span className="font-mono font-bold text-amber-300">
              {rateLimitState.secondsRemaining}s
            </span>{' '}
            before retrying.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissRateLimitToast}
          className="text-slate-400 hover:text-white text-base leading-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
