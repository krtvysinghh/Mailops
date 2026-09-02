import React, { useState } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';

export const MentionNotificationsFeed: React.FC = () => {
  const { notifications, unreadNotificationCount, markNotificationRead } = useCollaboration();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Mention Alerts & Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
            {unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100 overflow-hidden">
          <div className="p-3 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm">📣</span>
              <h4 className="text-xs font-bold text-gray-900">Mentions & Alerts</h4>
            </div>
            <span className="text-[11px] text-gray-500">
              {unreadNotificationCount} unread
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No mention alerts at this time.
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-3 text-xs cursor-pointer transition-colors ${
                    notif.isRead ? 'bg-white hover:bg-gray-50 opacity-75' : 'bg-blue-50/50 hover:bg-blue-50 font-medium'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-gray-900 font-semibold">{notif.title}</span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <p className="text-gray-600 text-[11px] line-clamp-2">{notif.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
