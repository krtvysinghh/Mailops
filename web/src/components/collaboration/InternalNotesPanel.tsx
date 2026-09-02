import React, { useState } from 'react';
import { useCollaboration } from '../../context/CollaborationContext';

interface InternalNotesPanelProps {
  emailId: string;
}

export const InternalNotesPanel: React.FC<InternalNotesPanelProps> = ({ emailId }) => {
  const { notes, addNote, resolveNote } = useCollaboration();
  const [noteContent, setNoteContent] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

  const emailNotes = notes[emailId] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    await addNote(emailId, noteContent.trim(), replyParentId || undefined);
    setNoteContent('');
    setReplyParentId(null);
  };

  return (
    <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-4 my-4">
      <div className="flex items-center justify-between mb-3 border-b border-amber-200/60 pb-2.5">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔒</span>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Internal Discussion & Notes</h4>
            <p className="text-[11px] text-amber-700/90">
              Strictly internal. Never included in outbound emails or public shares.
            </p>
          </div>
        </div>
        <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
          {emailNotes.length} {emailNotes.length === 1 ? 'Note' : 'Notes'}
        </span>
      </div>

      {/* Note List */}
      <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
        {emailNotes.length === 0 ? (
          <p className="text-xs text-amber-700/70 italic text-center py-4">
            No internal notes on this thread yet. Add a note below to discuss with your team.
          </p>
        ) : (
          emailNotes.map(note => (
            <div
              key={note.id}
              className={`p-3 rounded-lg border text-xs transition-all ${
                note.isResolved
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-amber-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {note.authorName.charAt(0)}
                  </div>
                  <span className="font-semibold text-gray-900">{note.authorName}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {!note.isResolved ? (
                    <button
                      onClick={() => resolveNote(note.id, emailId)}
                      className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium px-1.5 py-0.5 rounded hover:bg-emerald-50"
                    >
                      ✓ Resolve
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              {note.highlight?.quotedSnippet && (
                <div className="border-l-2 border-amber-400 pl-2 my-1 text-gray-500 italic bg-amber-50/50 py-0.5 rounded-r">
                  "{note.highlight.quotedSnippet}"
                </div>
              )}

              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Note Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            rows={2}
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="Write private team note... Type @username to alert team member"
            className="w-full text-xs border border-amber-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-amber-700/50"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-amber-700">Tip: Mentions like @alex trigger in-app alerts</span>
          <button
            type="submit"
            disabled={!noteContent.trim()}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            Post Internal Note
          </button>
        </div>
      </form>
    </div>
  );
};
