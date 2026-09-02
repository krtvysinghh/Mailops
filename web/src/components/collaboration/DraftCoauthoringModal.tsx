import React, { useState } from 'react';
import { useCollaboration, type DraftReviewStatus } from '../../context/CollaborationContext';

export const DraftCoauthoringModal: React.FC = () => {
  const {
    activeDraft,
    saveDraft,
    lockDraft,
    unlockDraft,
    setDraftReview,
    currentUserId,
  } = useCollaboration();

  const [toAddr, setToAddr] = useState(activeDraft?.toAddr || '');
  const [subject, setSubject] = useState(activeDraft?.subject || '');
  const [body, setBody] = useState(activeDraft?.body || '');
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiffView, setShowDiffView] = useState(false);

  if (!activeDraft) return null;

  const isLockedByOther =
    activeDraft.lockedByUserId && activeDraft.lockedByUserId !== currentUserId;

  const handleToggleLock = async () => {
    if (isLockedByMe) {
      await unlockDraft(activeDraft.id);
      setIsLockedByMe(false);
    } else {
      const success = await lockDraft(activeDraft.id);
      if (success) setIsLockedByMe(true);
      else alert('Draft is locked by another co-author.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await saveDraft(activeDraft.id, { toAddr, subject, body });
    setIsSaving(false);
  };

  const getStatusBadge = (st: DraftReviewStatus) => {
    switch (st) {
      case 'approved':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">Approved ✓</span>;
      case 'in_review':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">In Review ⏳</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-bold">Draft ✏️</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">✍️</span>
            <h3 className="text-base font-bold text-gray-900">Collaborative Draft Co-Authoring</h3>
            <span className="text-xs bg-gray-100 text-gray-700 font-mono px-2 py-0.5 rounded">
              v{activeDraft.version}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Optimistic concurrency, peer reviews & multi-author lock sync
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {getStatusBadge(activeDraft.reviewStatus)}
          <button
            onClick={handleToggleLock}
            disabled={!!isLockedByOther}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isLockedByMe
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isLockedByMe ? '🔓 Release Lock' : '🔒 Acquire Exclusive Lock'}
          </button>
        </div>
      </div>

      {isLockedByOther && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-lg my-3 flex items-center justify-between">
          <span>⚠️ Another user is actively editing this draft. Edits are currently read-only.</span>
        </div>
      )}

      {/* Editor Fields */}
      <div className="space-y-3 my-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
          <input
            type="email"
            value={toAddr}
            disabled={!!isLockedByOther}
            onChange={e => setToAddr(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            disabled={!!isLockedByOther}
            onChange={e => setSubject(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700">Body</label>
            <button
              onClick={() => setShowDiffView(!showDiffView)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showDiffView ? 'Hide Diff' : 'Compare 3-Way Diff'}
            </button>
          </div>
          <textarea
            rows={6}
            value={body}
            disabled={!!isLockedByOther}
            onChange={e => setBody(e.target.value)}
            className="w-full font-mono text-xs border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
          />
        </div>
      </div>

      {/* 3-Way Diff Simulation Panel */}
      {showDiffView && (
        <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono mb-4 space-y-1">
          <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">
            3-Way Diff & Concurrency Analysis
          </div>
          <div className="text-emerald-400">+ [Co-Author Sarah] Added SLA guarantee 99.99%</div>
          <div className="text-blue-400">  [Base Text] Standard 1-hour P1 response</div>
          <div className="text-gray-400">✓ Auto-merged cleanly with zero merge conflicts</div>
        </div>
      )}

      {/* Review Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {activeDraft.reviewStatus === 'draft' && (
            <button
              onClick={() => setDraftReview(activeDraft.id, 'in_review')}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-xs"
            >
              Request Peer Review
            </button>
          )}
          {activeDraft.reviewStatus === 'in_review' && (
            <button
              onClick={() => setDraftReview(activeDraft.id, 'approved')}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-xs"
            >
              Approve Draft for Sending
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={!!isLockedByOther || isSaving}
            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-1.5 rounded-lg shadow-xs"
          >
            {isSaving ? 'Saving...' : 'Save Draft (Increment Version)'}
          </button>
        </div>
      </div>
    </div>
  );
};
