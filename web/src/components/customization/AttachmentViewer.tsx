import React, { useState } from 'react';

export interface AttachmentFile {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  content: string; // Raw text or base64
}

interface AttachmentViewerProps {
  attachments: AttachmentFile[];
  onClose?: () => void;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachments, onClose }) => {
  const [selectedAttId, setSelectedAttId] = useState<string>(attachments[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const currentAtt = attachments.find(a => a.id === selectedAttId) || attachments[0];

  // CSV Parser
  const renderCsvTable = (rawCsv: string) => {
    const lines = rawCsv.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return <div className="text-slate-400">Empty CSV file</div>;

    const headers = lines[0].split(',').map(h => h.replace(/^"(.*)"$/, '$1').trim());
    const rows = lines.slice(1).map(line => line.split(',').map(c => c.replace(/^"(.*)"$/, '$1').trim()));

    // Filter rows if searching
    const filteredRows = searchQuery
      ? rows.filter(r => r.some(cell => cell.toLowerCase().includes(searchQuery.toLowerCase())))
      : rows;

    return (
      <div className="overflow-x-auto border border-[var(--mailops-border)] rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
            <tr>
              <th className="p-2 border-b border-r border-[var(--mailops-border)] w-10 text-center">#</th>
              {headers.map((h, i) => (
                <th key={i} className="p-2 border-b border-r border-[var(--mailops-border)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--mailops-border)]">
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="p-2 text-center text-slate-400 border-r border-[var(--mailops-border)] font-mono">{rIdx + 1}</td>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 border-r border-[var(--mailops-border)] font-mono text-[11px]">
                    {searchQuery && cell.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                      <mark className="bg-yellow-200 dark:bg-yellow-800 dark:text-white px-0.5 rounded">{cell}</mark>
                    ) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // JSON Tree View
  const renderJsonView = (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      const formatted = JSON.stringify(parsed, null, 2);
      return (
        <pre className="p-4 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
          {formatted}
        </pre>
      );
    } catch {
      return (
        <pre className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900 font-mono text-xs overflow-x-auto text-red-500">
          Invalid JSON format
        </pre>
      );
    }
  };

  // Code / Plain Text View with line numbers
  const renderCodeView = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="font-mono text-xs bg-slate-950 text-slate-200 rounded-lg p-3 overflow-x-auto border border-slate-800">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-900">
                <td className="w-10 text-right pr-4 select-none text-slate-600 font-mono text-[11px] align-top">{idx + 1}</td>
                <td className="whitespace-pre-wrap break-all text-[12px] align-top">
                  {searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                    <mark className="bg-yellow-400 text-black px-0.5 rounded">{line}</mark>
                  ) : line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render attachment body based on file type
  const renderContent = () => {
    if (!currentAtt) {
      return <div className="p-8 text-center text-slate-400">No attachment selected</div>;
    }

    const filename = currentAtt.filename.toLowerCase();
    const type = currentAtt.contentType.toLowerCase();

    if (filename.endsWith('.csv') || type.includes('csv')) {
      return renderCsvTable(currentAtt.content);
    }
    if (filename.endsWith('.json') || type.includes('json')) {
      return renderJsonView(currentAtt.content);
    }
    if (type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center p-8 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <img src={currentAtt.content} alt={currentAtt.filename} className="max-h-96 max-w-full rounded shadow" />
        </div>
      );
    }

    return renderCodeView(currentAtt.content);
  };

  return (
    <div className="bg-[var(--mailops-card)] border border-[var(--mailops-border)] rounded-2xl flex flex-col h-[550px] shadow-xl overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-[var(--mailops-border)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📎</span>
          <span className="font-bold text-sm text-[var(--mailops-text)]">
            Attachment Content Indexer & Viewer
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <input
            type="text"
            placeholder="🔍 Full-text search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2.5 py-1 text-xs rounded-lg border border-[var(--mailops-border)] bg-white dark:bg-slate-900 text-[var(--mailops-text)] outline-none focus:border-blue-500"
          />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 p-1">✕</button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Attachment Tabs Sidebar */}
        <div className="w-56 border-r border-[var(--mailops-border)] p-2 space-y-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Files ({attachments.length})
          </span>
          {attachments.map(att => (
            <button
              key={att.id}
              onClick={() => setSelectedAttId(att.id)}
              className={`w-full text-left p-2 rounded-lg text-xs transition flex flex-col ${
                selectedAttId === att.id
                  ? 'bg-[var(--mailops-accent)] text-white font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--mailops-text)]'
              }`}
            >
              <span className="truncate font-medium">{att.filename}</span>
              <span className={`text-[10px] ${selectedAttId === att.id ? 'text-white/80' : 'text-slate-400'}`}>
                {Math.round(att.sizeBytes / 1024)} KB • {att.contentType.split('/')[1] || 'raw'}
              </span>
            </button>
          ))}
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-[var(--mailops-bg)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
