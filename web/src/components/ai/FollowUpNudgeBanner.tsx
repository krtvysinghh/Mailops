import React from 'react';
import type { NudgeAlert } from '../../context/AIContext';

interface FollowUpNudgeBannerProps {
  nudges: NudgeAlert[];
  onAction?: (threadId: string, actionType: 'followup' | 'reply') => void;
}

export const FollowUpNudgeBanner: React.FC<FollowUpNudgeBannerProps> = ({
  nudges,
  onAction,
}) => {
  if (!nudges || nudges.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {nudges.map(nudge => {
        const isFollowUp = nudge.type === 'need_followup';
        return (
          <div
            key={nudge.threadId}
            className={`flex items-center justify-between p-3 rounded-xl border shadow-xs transition-all ${
              isFollowUp
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-3">
              <span className="text-base">{isFollowUp ? '⏳' : '📬'}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">
                  {isFollowUp
                    ? `Sent ${nudge.daysWaiting} days ago with no response:`
                    : `Received ${nudge.daysWaiting} days ago waiting for your reply:`}
                  <span className="font-normal ml-1">"{nudge.subject}"</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAction?.(nudge.threadId, isFollowUp ? 'followup' : 'reply')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                isFollowUp
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              {isFollowUp ? 'Follow Up Now' : 'Reply Now'}
            </button>
          </div>
        );
      })}
    </div>
  );
};
