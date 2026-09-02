import React from 'react';
import type { SmartReplyOption, SmartReplyTone } from '../../context/AIContext';

interface SmartReplyBarProps {
  replies: SmartReplyOption[];
  onSelectReply: (replyText: string) => void;
  isLoading?: boolean;
}

const TONE_BADGES: Record<SmartReplyTone, { label: string; bg: string; text: string; icon: string }> = {
  enthusiastic: { label: 'Enthusiastic', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'text-emerald-700', icon: '✨' },
  neutral: { label: 'Neutral', bg: 'bg-gray-50 border-gray-200 text-gray-700', text: 'text-gray-700', icon: '💬' },
  deferral: { label: 'Deferral', bg: 'bg-amber-50 border-amber-200 text-amber-700', text: 'text-amber-700', icon: '⏳' },
  inquisitive: { label: 'Inquisitive', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', text: 'text-indigo-700', icon: '❓' },
};

export const SmartReplyBar: React.FC<SmartReplyBarProps> = ({
  replies,
  onSelectReply,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 py-2 px-3 bg-gray-50 rounded-lg animate-pulse border border-gray-100">
        <span className="text-xs text-gray-400">Generating AI smart replies...</span>
      </div>
    );
  }

  if (!replies || replies.length === 0) return null;

  return (
    <div className="py-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        <span>⚡</span> Suggested Smart Replies
      </div>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply, idx) => {
          const toneInfo = TONE_BADGES[reply.tone] || TONE_BADGES.neutral;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectReply(reply.text)}
              className={`group flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-sm hover:shadow hover:scale-[1.01] active:scale-[0.99] ${toneInfo.bg}`}
            >
              <span>{toneInfo.icon}</span>
              <span className="text-gray-800">{reply.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
