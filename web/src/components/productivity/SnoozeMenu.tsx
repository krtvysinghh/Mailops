import React, { useState } from 'react';
import { useProductivity } from '../../context/ProductivityContext';

interface SnoozeMenuProps {
  emailId: string;
  onClose?: () => void;
}

export const SnoozeMenu: React.FC<SnoozeMenuProps> = ({ emailId, onClose }) => {
  const { snoozeEmail } = useProductivity();
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSnooze = (preset: string, customTs?: string) => {
    snoozeEmail(emailId, preset, customTs, reason || undefined);
    onClose?.();
  };

  return (
    <div className="w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 z-50 text-sm">
      <div className="px-2 py-1 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <span>⏰</span> Snooze until...
        </span>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xs">
            ✕
          </button>
        )}
      </div>

      <div className="space-y-1">
        <button
          onClick={() => handleSnooze('later_today')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200 transition"
        >
          <span>Later today</span>
          <span className="text-xs text-zinc-400">+4 hours</span>
        </button>

        <button
          onClick={() => handleSnooze('this_evening')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200 transition"
        >
          <span>This evening</span>
          <span className="text-xs text-zinc-400">6:00 PM</span>
        </button>

        <button
          onClick={() => handleSnooze('tomorrow_morning')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200 transition"
        >
          <span>Tomorrow morning</span>
          <span className="text-xs text-zinc-400">Tomorrow 9:00 AM</span>
        </button>

        <button
          onClick={() => handleSnooze('this_weekend')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200 transition"
        >
          <span>This weekend</span>
          <span className="text-xs text-zinc-400">Sat 9:00 AM</span>
        </button>

        <button
          onClick={() => handleSnooze('next_week')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-zinc-800 dark:text-zinc-200 transition"
        >
          <span>Next week</span>
          <span className="text-xs text-zinc-400">Mon 9:00 AM</span>
        </button>

        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-blue-600 dark:text-blue-400 font-medium transition"
        >
          <span>🗓️ Pick date & time...</span>
        </button>
      </div>

      {showCustom && (
        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <input
            type="datetime-local"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
          <input
            type="text"
            placeholder="Reminder reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
          <button
            disabled={!customDate}
            onClick={() => handleSnooze('custom', customDate)}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium"
          >
            Confirm Snooze
          </button>
        </div>
      )}
    </div>
  );
};
