import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadNotifCount,
    markNotificationRead,
    markAllNotificationsRead,
    quietHours,
    setQuietHours,
    isDndActive,
    requestNotificationPermission,
    addNotification,
  } = useUI();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'dnd-settings'>('feed');
  const [startInput, setStartInput] = useState(quietHours.start || '22:00');
  const [endInput, setEndInput] = useState(quietHours.end || '08:00');
  const [tzInput, setTzInput] = useState(quietHours.timezone || 'UTC');

  const handleSaveQuietHours = () => {
    setQuietHours({
      start: startInput,
      end: endInput,
      timezone: tzInput,
    });
    addNotification({
      title: 'Quiet Hours Updated',
      message: `DND active from ${startInput} to ${endInput} (${tzInput}).`,
      type: 'system',
    });
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      addNotification({
        title: 'Desktop Notifications Enabled',
        message: 'You will receive native desktop notifications for incoming mail.',
        type: 'system',
      });
    } else {
      alert('Notification permission was not granted or is blocked in your browser settings.');
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--mailops-text)] transition"
        title="Notification Center & DND"
      >
        <span className="text-base">🔔</span>
        {unreadNotifCount > 0 && (
          <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-500 text-white animate-pulse">
            {unreadNotifCount}
          </span>
        )}
        {isDndActive && (
          <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-1 ring-white" title="Quiet Hours Active" />
        )}
      </button>

      {/* Popover Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[var(--mailops-card)] border border-[var(--mailops-border)] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-xs">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-[var(--mailops-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--mailops-text)]">
                Notification Center
              </span>
              {isDndActive ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium text-[10px]">
                  🌙 DND Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium text-[10px]">
                  🔔 Active
                </span>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>

          {/* Subtabs */}
          <div className="flex border-b border-[var(--mailops-border)] bg-slate-50/50 dark:bg-slate-900/30">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2 text-center font-medium transition ${
                activeTab === 'feed'
                  ? 'border-b-2 border-[var(--mailops-accent)] text-[var(--mailops-accent)] font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Feed ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('dnd-settings')}
              className={`flex-1 py-2 text-center font-medium transition ${
                activeTab === 'dnd-settings'
                  ? 'border-b-2 border-[var(--mailops-accent)] text-[var(--mailops-accent)] font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quiet Hours (DND)
            </button>
          </div>

          {/* Tab 1: Feed */}
          {activeTab === 'feed' && (
            <div className="flex flex-col h-72">
              <div className="flex-1 overflow-y-auto divide-y divide-[var(--mailops-border)]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 transition cursor-pointer flex items-start gap-2.5 ${
                        !n.isRead
                          ? 'bg-blue-50/40 dark:bg-blue-900/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-base mt-0.5">
                        {n.type === 'urgent' ? '🚨' : n.type === 'mention' ? '💬' : '📩'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--mailops-text)] truncate">{n.title}</span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Feed Footer */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-[var(--mailops-border)] flex items-center justify-between">
                <button
                  onClick={handleRequestPermission}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Enable Desktop Alerts
                </button>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: DND & Quiet Hours Scheduler */}
          {activeTab === 'dnd-settings' && (
            <div className="p-4 space-y-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Automatically mute notification sounds and desktop banners during scheduled sleep or focus hours.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={startInput}
                    onChange={(e) => setStartInput(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={endInput}
                    onChange={(e) => setEndInput(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Timezone</label>
                <select
                  value={tzInput}
                  onChange={(e) => setTzInput(e.target.value)}
                  className="w-full px-2 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-[var(--mailops-border)] text-[11px] text-slate-600 dark:text-slate-300">
                ⭐ <strong>Urgent Bypass:</strong> High priority deadlines and emergency VIP emails will still alert you.
              </div>

              <button
                onClick={handleSaveQuietHours}
                className="w-full py-2 font-semibold rounded-lg bg-[var(--mailops-accent)] text-white hover:opacity-90 transition"
              >
                Save Quiet Hours Schedule
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
