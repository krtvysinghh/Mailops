import React, { useState } from 'react';
import type { EmailSummary } from '../../context/AIContext';

interface EmailSummarizerCardProps {
  summary: EmailSummary | null;
  isLoading?: boolean;
}

export const EmailSummarizerCard: React.FC<EmailSummarizerCardProps> = ({
  summary,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 my-3 animate-pulse">
        <div className="h-4 bg-blue-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-blue-100 rounded w-3/4"></div>
      </div>
    );
  }

  if (!summary || !summary.tldr) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-purple-50/40 border border-blue-100/80 rounded-xl p-4 my-3 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">✨</span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900">AI Summary & TL;DR</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
          <span className="bg-white/80 border border-gray-200/60 px-2 py-0.5 rounded-md shadow-2xs">
            ⏱ {summary.readingTimeSeconds}s read ({summary.wordCount} words)
          </span>
          {summary.keyPoints && summary.keyPoints.length > 1 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline underline-offset-2"
            >
              {isExpanded ? 'Show Less' : `Key Points (${summary.keyPoints.length})`}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm font-medium text-gray-800 leading-relaxed">
        {summary.tldr}
      </p>

      {isExpanded && summary.keyPoints && summary.keyPoints.length > 1 && (
        <div className="mt-3 pt-3 border-t border-blue-100/60">
          <div className="text-xs font-semibold text-gray-600 mb-1.5">Key Takeaways:</div>
          <ul className="space-y-1.5">
            {summary.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-normal">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
