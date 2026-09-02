import React from 'react';
import { useProductivity } from '../../context/ProductivityContext';

export const OfflineSyncIndicator: React.FC = () => {
  const { isOnline, offlineMutations, syncPendingMutations } = useProductivity();

  const pendingCount = offlineMutations.filter(
    (m) => m.status === 'pending' || m.status === 'syncing'
  ).length;

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-center gap-3 px-3.5 py-2 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md transition ${
          !isOnline
            ? 'bg-amber-500/90 text-black border-amber-600 shadow-amber-500/20'
            : 'bg-zinc-900/90 text-white border-zinc-700/80 shadow-black/30'
        }`}
      >
        <span className="flex h-2 w-2 relative">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              !isOnline ? 'bg-black' : 'bg-blue-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              !isOnline ? 'bg-black' : 'bg-blue-500'
            }`}
          />
        </span>

        <div>
          {!isOnline ? (
            <span>Offline Mode ({pendingCount} queued)</span>
          ) : (
            <span>Syncing {pendingCount} offline changes...</span>
          )}
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            onClick={syncPendingMutations}
            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] rounded transition"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
};
