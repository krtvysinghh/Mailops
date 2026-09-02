import React, { useState } from 'react';
import { useProductivity } from '../../context/ProductivityContext';

interface ScheduledSendModalProps {
  onSchedule?: (timestamp: number) => void;
  onClose?: () => void;
}

export const ScheduledSendModal: React.FC<ScheduledSendModalProps> = ({ onSchedule, onClose }) => {
  const { isScheduleModalOpen, closeScheduleModal } = useProductivity();
  const [selectedOption, setSelectedOption] = useState<string>('tomorrow_morning');
  const [customDateTime, setCustomDateTime] = useState<string>('');

  if (!isScheduleModalOpen) return null;

  const handleClose = () => {
    closeScheduleModal();
    onClose?.();
  };

  const getComputedTimestamp = (): number => {
    const now = new Date();

    if (selectedOption === 'later_today') {
      return now.getTime() + 4 * 60 * 60 * 1000;
    }

    if (selectedOption === 'tomorrow_morning') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.getTime();
    }

    if (selectedOption === 'tomorrow_afternoon') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(13, 0, 0, 0);
      return tomorrow.getTime();
    }

    if (selectedOption === 'monday_morning') {
      const monday = new Date(now);
      const day = monday.getDay();
      const daysUntilMon = day === 1 ? 7 : (1 - day + 7) % 7;
      monday.setDate(monday.getDate() + (daysUntilMon === 0 ? 7 : daysUntilMon));
      monday.setHours(9, 0, 0, 0);
      return monday.getTime();
    }

    if (selectedOption === 'custom' && customDateTime) {
      return new Date(customDateTime).getTime();
    }

    return now.getTime() + 24 * 60 * 60 * 1000;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ts = getComputedTimestamp();
    onSchedule?.(ts);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Schedule Send (Send Later)</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-medium"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Choose when you would like this email to be automatically dispatched.
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition">
              <input
                type="radio"
                name="scheduleOption"
                value="later_today"
                checked={selectedOption === 'later_today'}
                onChange={() => setSelectedOption('later_today')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Later Today</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">+4 hours from now</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition">
              <input
                type="radio"
                name="scheduleOption"
                value="tomorrow_morning"
                checked={selectedOption === 'tomorrow_morning'}
                onChange={() => setSelectedOption('tomorrow_morning')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Tomorrow Morning</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">9:00 AM</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition">
              <input
                type="radio"
                name="scheduleOption"
                value="tomorrow_afternoon"
                checked={selectedOption === 'tomorrow_afternoon'}
                onChange={() => setSelectedOption('tomorrow_afternoon')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Tomorrow Afternoon</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">1:00 PM</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition">
              <input
                type="radio"
                name="scheduleOption"
                value="monday_morning"
                checked={selectedOption === 'monday_morning'}
                onChange={() => setSelectedOption('monday_morning')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Next Monday Morning</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Monday at 9:00 AM</div>
              </div>
            </label>

            <label className="flex flex-col gap-2 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="scheduleOption"
                  value="custom"
                  checked={selectedOption === 'custom'}
                  onChange={() => setSelectedOption('custom')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Pick date & time</span>
              </div>
              {selectedOption === 'custom' && (
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  required
                />
              )}
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition"
            >
              Schedule Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
