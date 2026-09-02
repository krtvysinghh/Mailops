import React, { useState } from 'react';
import { useProductivity } from '../../context/ProductivityContext';

export const VacationResponderSettings: React.FC = () => {
  const { vacationSettings, updateVacationSettings } = useProductivity();

  const [isActive, setIsActive] = useState(vacationSettings?.isActive ?? false);
  const [subject, setSubject] = useState(
    vacationSettings?.subject ?? 'Out of Office: Automated Response'
  );
  const [body, setBody] = useState(
    vacationSettings?.body ??
      'Thank you for reaching out. I am currently out of the office with limited access to email and will respond upon my return.'
  );
  const [startDate, setStartDate] = useState(
    vacationSettings?.startDate
      ? new Date(vacationSettings.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(
    vacationSettings?.endDate
      ? new Date(vacationSettings.endDate).toISOString().slice(0, 16)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateVacationSettings({
      domainId: vacationSettings?.domainId || 'default',
      userEmail: vacationSettings?.userEmail || 'user@mailops.dev',
      subject,
      body,
      startDate: new Date(startDate).getTime(),
      endDate: new Date(endDate).getTime(),
      isActive,
      cooldownHours: 24,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6 text-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>🏖️</span> Out-of-Office / Vacation Responder
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            RFC 3834 compliant automatic replies with 24-hour cooldown loop prevention.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {isActive ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Subject Line
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Auto-Reply Message Body
          </label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold">RFC 3834 Safety & Loop Prevention Rules:</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
            <li>Auto-replies only sent once every 24 hours per unique sender.</li>
            <li>Suppressed for mailing lists (List-Id / Precedence: bulk).</li>
            <li>Suppressed for bounce daemons (mailer-daemon, postmaster, noreply).</li>
          </ul>
        </div>

        <div className="flex justify-end items-center gap-3 pt-2">
          {isSaved && <span className="text-xs text-emerald-600 font-medium">✓ Settings saved successfully</span>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Save Vacation Responder
          </button>
        </div>
      </form>
    </div>
  );
};
