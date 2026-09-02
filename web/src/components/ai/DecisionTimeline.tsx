import React from 'react';
import type { ExtractedDecision } from '../../context/AIContext';

interface DecisionTimelineProps {
  decisions: ExtractedDecision[];
  isLoading?: boolean;
}

export const DecisionTimeline: React.FC<DecisionTimelineProps> = ({
  decisions,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 my-3 animate-pulse">
        <div className="h-4 bg-emerald-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-emerald-100 rounded w-3/4"></div>
      </div>
    );
  }

  if (!decisions || decisions.length === 0) return null;

  return (
    <div className="bg-white border border-emerald-200/80 rounded-xl p-4 my-3 shadow-xs">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-base">🤝</span>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Key Decisions & Agreements</span>
      </div>

      <div className="relative pl-4 border-l-2 border-emerald-200 space-y-3">
        {decisions.map((dec, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200" />
            
            <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                "{dec.text}"
              </p>
              <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-gray-500">
                <span className="font-medium text-emerald-800">Decided by: {dec.decider}</span>
                <span>{new Date(dec.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
