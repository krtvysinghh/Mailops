import React from 'react';

interface PriorityIndicatorProps {
  score: number;
  isUrgent?: boolean;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
  score,
  isUrgent = false,
}) => {
  // Score color logic
  let color = 'bg-blue-500';
  let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
  let label = 'Normal';

  if (score >= 80 || isUrgent) {
    color = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    label = isUrgent ? 'Urgent' : 'High Priority';
  } else if (score >= 60) {
    color = 'bg-amber-500';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Medium';
  } else if (score < 40) {
    color = 'bg-gray-400';
    badgeColor = 'bg-gray-50 text-gray-600 border-gray-200';
    label = 'Low';
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${badgeColor}`}>
        {isUrgent ? '🚨' : '⚡'} {score} / 100 ({label})
      </span>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
};
