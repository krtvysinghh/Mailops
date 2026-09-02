import React from 'react';
import { useProductivity } from '../../context/ProductivityContext';

export const BatchActionBar: React.FC = () => {
  const {
    selectedEmailIds,
    clearSelection,
    executeBatchAction,
    lastBatchUndoToken,
    undoLastBatch,
  } = useProductivity();

  if (selectedEmailIds.length === 0 && !lastBatchUndoToken) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 bg-zinc-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-zinc-700/60 backdrop-blur-md text-xs">
        {selectedEmailIds.length > 0 ? (
          <>
            <span className="font-semibold px-2 py-0.5 bg-blue-600 rounded-full text-[11px]">
              {selectedEmailIds.length} selected
            </span>

            <div className="h-4 w-px bg-zinc-700 mx-1" />

            <button
              onClick={() => executeBatchAction('mark_read')}
              className="hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
            >
              <span>👁️</span> Mark Read
            </button>

            <button
              onClick={() => executeBatchAction('archive')}
              className="hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
            >
              <span>📦</span> Archive
            </button>

            <button
              onClick={() => executeBatchAction('star')}
              className="hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
            >
              <span>⭐</span> Star
            </button>

            <button
              onClick={() => executeBatchAction('trash')}
              className="hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg font-medium text-red-400 hover:text-red-300 transition flex items-center gap-1"
            >
              <span>🗑️</span> Trash
            </button>

            <div className="h-4 w-px bg-zinc-700 mx-1" />

            <button
              onClick={clearSelection}
              className="text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-lg"
            >
              Deselect All
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span>Bulk action completed</span>
            <button
              onClick={undoLastBatch}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-md shadow-sm"
            >
              Undo Action
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
