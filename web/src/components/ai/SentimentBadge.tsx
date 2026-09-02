import React from 'react';
import type { SentimentType } from '../../context/AIContext';

interface SentimentBadgeProps {
  sentiment: SentimentType;
  score: number;
  detectedDeadlines?: string[];
}

const SENTIMENT_STYLES: Record<SentimentType, { bg: string; text: string; icon: string; label: string }> = {
  positive: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: '😊', label: 'Positive' },
  neutral: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', icon: '😐', label: 'Neutral' },
  negative: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: '😟', label: 'Negative' },
  urgent: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: '🔥', label: 'Urgent Action' },
};

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  score,
  detectedDeadlines = [],
}) => {
  const style = SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.neutral;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-2xs ${style.bg} ${style.text}`}
      >
        <span>{style.icon}</span>
        <span>{style.label} ({score > 0 ? `+${score}` : score})</span>
      </span>

      {detectedDeadlines.map((dl, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-red-50/80 border-red-200 text-red-700 text-xs font-medium"
        >
          <span>⏰</span>
          <span>{dl}</span>
        </span>
      ))}
    </div>
  );
};
