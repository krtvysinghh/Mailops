import React from 'react';
import { sanitizeHtml } from '../../utils/markdownParser';
import { downloadEmlFile, printEmailElement } from '../../utils/emlGenerator';

interface PrintExportEmail {
  id?: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  date?: string | Date;
  htmlBody?: string;
  textBody?: string;
  attachments?: { filename: string; sizeBytes: number; contentType: string }[];
}

interface PrintExportModalProps {
  email: PrintExportEmail;
  onClose: () => void;
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({ email, onClose }) => {
  const formattedDate = email.date ? new Date(email.date).toLocaleString() : new Date().toLocaleString();

  const handleDownloadEml = () => {
    downloadEmlFile({
      from: email.from,
      to: email.to,
      cc: email.cc,
      subject: email.subject,
      date: email.date,
      htmlBody: email.htmlBody,
      textBody: email.textBody,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-[var(--mailops-card)] border border-[var(--mailops-border)] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-[var(--mailops-border)]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖨️</span>
            <span className="font-bold text-sm text-[var(--mailops-text)]">
              Print & Export Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadEml}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--mailops-border)] hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
            >
              <span>📥 Download RFC 822 .eml</span>
            </button>
            <button
              onClick={printEmailElement}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--mailops-accent)] text-white hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="mailops-print-container flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          {/* Printable Header */}
          <div className="mailops-print-header border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Mailops Email Archive
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {formattedDate}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              {email.subject || '(No Subject)'}
            </h1>
            <div className="grid grid-cols-1 gap-1 text-xs text-slate-600 dark:text-slate-300">
              <div><strong className="text-slate-800 dark:text-slate-100">From:</strong> {email.from}</div>
              <div><strong className="text-slate-800 dark:text-slate-100">To:</strong> {email.to}</div>
              {email.cc && <div><strong className="text-slate-800 dark:text-slate-100">Cc:</strong> {email.cc}</div>}
            </div>
          </div>

          {/* Printable Body */}
          <div className="mailops-print-body prose dark:prose-invert max-w-none text-sm leading-relaxed mb-8">
            {email.htmlBody ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.htmlBody) }} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans">{email.textBody}</pre>
            )}
          </div>

          {/* Printable Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mailops-print-attachments border-t border-dashed border-slate-400 pt-4 text-xs text-slate-600 dark:text-slate-400">
              <strong>Attachments ({email.attachments.length}):</strong>
              <ul className="mt-1 list-disc list-inside">
                {email.attachments.map((att, idx) => (
                  <li key={idx}>
                    {att.filename} ({Math.round(att.sizeBytes / 1024)} KB) - {att.contentType}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
