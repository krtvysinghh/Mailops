import React, { useState } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';

export const AuditTimeline: React.FC = () => {
  const { timeline } = useCollaboration();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">📜</span>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Activity Audit Trail & History</h4>
            <p className="text-xs text-gray-500">Append-only chronological timeline of all thread mutations</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
            <span>🛡️</span>
            <span>Chain Valid</span>
          </span>
          <span className="text-xs text-gray-400">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {timeline.map(entry => (
              <div key={entry.id} className="relative text-xs">
                {/* Dot */}
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-gray-300 shadow-2xs flex items-center justify-center text-[10px]">
                  {entry.icon}
                </div>

                <div className="bg-gray-50/70 border border-gray-200/70 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-gray-900">{entry.actor}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-600">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
