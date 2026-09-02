import React from 'react';
import { useProductivity } from '../../context/ProductivityContext';

export const UndoSendBanner: React.FC = () => {
  const { undoTicket, remainingGraceMs, cancelUndoSend } = useProductivity();

  if (!undoTicket || undoTicket.status !== 'buffered' || remainingGraceMs <= 0) {
    return null;
  }

  const remainingSeconds = Math.ceil(remainingGraceMs / 1000);
  const totalMs = undoTicket.gracePeriodSeconds * 1000;
  const progressPercent = Math.max(0, Math.min(100, (remainingGraceMs / totalMs) * 100));

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col bg-zinc-900 text-white rounded-xl shadow-2xl border border-zinc-700/60 overflow-hidden min-w-[320px] max-w-md">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-7 h-7">
              <span className="animate-spin text-sm">⏳</span>
            </div>
            <div>
              <p className="text-sm font-medium">Sending email...</p>
              <p className="text-xs text-zinc-400">
                Grace buffer active ({remainingSeconds}s remaining)
              </p>
            </div>
          </div>

          <button
            onClick={() => cancelUndoSend(undoTicket.token)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-lg transition active:scale-95 shadow-sm"
          >
            Undo Send
          </button>
        </div>

        {/* Dynamic progress bar */}
        <div className="h-1 w-full bg-zinc-800">
          <div
            className="h-full bg-amber-500 transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
