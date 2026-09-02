import React, { useState } from 'react';
import type { ToneMode } from '../../context/AIContext';

interface DraftToneSelectorProps {
  currentDraftText: string;
  onApplyPolishedText: (polishedText: string) => void;
  onPolishRequested: (text: string, tone: ToneMode) => Promise<{ polishedText: string; changesCount: number }>;
}

const TONES: { mode: ToneMode; label: string; icon: string; desc: string }[] = [
  { mode: 'professional', label: 'Professional', icon: '👔', desc: 'Formal phrasing & no contractions' },
  { mode: 'casual', label: 'Casual', icon: '☕', desc: 'Friendly, warm & conversational' },
  { mode: 'concise', label: 'Concise', icon: '✂️', desc: 'Strips fluff & filler words' },
  { mode: 'expanded', label: 'Expanded', icon: '📝', desc: 'Adds helpful clarifications' },
];

export const DraftToneSelector: React.FC<DraftToneSelectorProps> = ({
  currentDraftText,
  onApplyPolishedText,
  onPolishRequested,
}) => {
  const [selectedTone, setSelectedTone] = useState<ToneMode>('professional');
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [changesCount, setChangesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const handlePolish = async (tone: ToneMode) => {
    setSelectedTone(tone);
    if (!currentDraftText.trim()) return;

    setIsLoading(true);
    try {
      const res = await onPolishRequested(currentDraftText, tone);
      setPreviewText(res.polishedText);
      setChangesCount(res.changesCount);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (previewText) {
      onApplyPolishedText(previewText);
      setPreviewText(null);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 my-2 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span>✨</span> AI Tone & Polish Re-phraser
        </span>
        {changesCount > 0 && previewText && (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {changesCount} adjustment{changesCount > 1 ? 's' : ''} made
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
        {TONES.map(t => (
          <button
            key={t.mode}
            type="button"
            onClick={() => handlePolish(t.mode)}
            disabled={isLoading || !currentDraftText.trim()}
            className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
              selectedTone === t.mode
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 disabled:opacity-50'
            }`}
          >
            <span className="text-xs font-bold flex items-center gap-1">
              <span>{t.icon}</span> {t.label}
            </span>
            <span className={`text-[10px] mt-0.5 leading-tight ${selectedTone === t.mode ? 'text-blue-100' : 'text-slate-500'}`}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      {previewText && (
        <div className="mt-2.5 p-2.5 bg-white border border-blue-200 rounded-lg">
          <div className="text-[11px] font-semibold text-blue-900 mb-1">Preview Polished Draft:</div>
          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {previewText}
          </p>
          <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPreviewText(null)}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 shadow-2xs"
            >
              Apply to Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
