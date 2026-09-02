import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { sanitizeHtml, markdownToHtml, htmlToMarkdown, checkMarkdownShortcutTrigger } from '../../utils/markdownParser';
import { downloadEmlFile } from '../../utils/emlGenerator';

interface RichMarkdownComposerProps {
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSend?: (email: { to: string; subject: string; html: string; text: string; from: string }) => void;
  onClose?: () => void;
}

export const RichMarkdownComposer: React.FC<RichMarkdownComposerProps> = ({
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  onSend,
  onClose,
}) => {
  const {
    playSound,
    signatures,
    defaultSignature,
    aliases,
    addNotification,
  } = useUI();

  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [fromAddress, setFromAddress] = useState('user@domain.com');
  const [plusTag, setPlusTag] = useState('');
  const [mode, setMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [rawMarkdown, setRawMarkdown] = useState(initialBody);

  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && initialBody) {
      editorRef.current.innerHTML = sanitizeHtml(initialBody);
    }
  }, [initialBody]);

  // Execute rich text formatting commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Live markdown shortcut handler on KeyDown/KeyUp in WYSIWYG mode
  const handleEditorKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || !selection.focusNode) return;

      const node = selection.focusNode;
      const textContent = node.textContent || '';
      const trigger = checkMarkdownShortcutTrigger(textContent.trim());

      if (trigger) {
        if (trigger.type === 'heading') {
          execCmd('formatBlock', `<h${trigger.level}>`);
          node.textContent = trigger.text;
        } else if (trigger.type === 'blockquote') {
          execCmd('formatBlock', '<blockquote>');
          node.textContent = trigger.text;
        } else if (trigger.type === 'bullet-list') {
          execCmd('insertUnorderedList');
          node.textContent = trigger.text;
        } else if (trigger.type === 'ordered-list') {
          execCmd('insertOrderedList');
          node.textContent = trigger.text;
        } else if (trigger.type === 'hr') {
          execCmd('insertHorizontalRule');
          node.textContent = '';
        }
      }
    }
  };

  // Toggle between Markdown source and WYSIWYG HTML view
  const toggleViewMode = () => {
    if (mode === 'wysiwyg') {
      const html = editorRef.current?.innerHTML || '';
      const md = htmlToMarkdown(html);
      setRawMarkdown(md);
      setMode('markdown');
    } else {
      const html = markdownToHtml(rawMarkdown);
      setMode('wysiwyg');
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
        }
      }, 0);
    }
  };

  // Insert signature with RFC 3676 standard delimiter
  const insertSignature = (sigHtml: string) => {
    const formattedSig = `<br/><br/><div class="mailops-sig-delimiter" style="color: #94a3b8; font-size: 12px;">-- </div>\n${sigHtml}`;
    if (mode === 'wysiwyg' && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, formattedSig);
    } else {
      setRawMarkdown(prev => `${prev}\n\n-- \n${htmlToMarkdown(sigHtml)}`);
    }
  };

  // Compute final From header with plus-addressing
  const getEffectiveFrom = () => {
    if (!plusTag.trim()) return fromAddress;
    const [baseUser, domain] = fromAddress.split('@');
    const cleanTag = plusTag.trim().replace(/[^a-zA-Z0-9._-]/g, '');
    return `${baseUser}+${cleanTag}@${domain || 'domain.com'}`;
  };

  // Export as .eml
  const handleExportEml = () => {
    const htmlContent = mode === 'wysiwyg' ? editorRef.current?.innerHTML || '' : markdownToHtml(rawMarkdown);
    const textContent = htmlToMarkdown(htmlContent);

    downloadEmlFile({
      from: getEffectiveFrom(),
      to: to || 'recipient@example.com',
      subject: subject || 'Draft Message',
      htmlBody: htmlContent,
      textBody: textContent,
      date: new Date(),
    });

    addNotification({
      title: 'EML Exported',
      message: `Downloaded draft "${subject || 'Untitled'}.eml"`,
      type: 'system',
    });
  };

  // Handle Send action
  const handleSend = () => {
    const htmlContent = mode === 'wysiwyg' ? editorRef.current?.innerHTML || '' : markdownToHtml(rawMarkdown);
    const textContent = htmlToMarkdown(htmlContent);
    const finalFrom = getEffectiveFrom();

    if (!to.trim()) {
      alert('Please enter a recipient email address.');
      return;
    }

    // Play synthesis swoosh sound
    playSound('swoosh');

    if (onSend) {
      onSend({
        to,
        subject,
        html: htmlContent,
        text: textContent,
        from: finalFrom,
      });
    }

    addNotification({
      title: 'Email Sent',
      message: `Message sent to ${to}`,
      type: 'system',
    });

    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--mailops-card)] border border-[var(--mailops-border)] rounded-xl shadow-lg overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-[var(--mailops-border)]">
        <span className="font-semibold text-sm text-[var(--mailops-text)]">
          New Message
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleViewMode}
            className="px-2.5 py-1 text-xs rounded border border-[var(--mailops-border)] hover:bg-slate-200 dark:hover:bg-slate-700 transition text-[var(--mailops-text)]"
            title="Toggle between WYSIWYG & Markdown"
          >
            {mode === 'wysiwyg' ? 'Switch to Markdown' : 'Switch to Visual'}
          </button>
          <button
            onClick={handleExportEml}
            className="px-2 py-1 text-xs rounded border border-[var(--mailops-border)] hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Export as RFC 822 .eml"
          >
            📥 Export .eml
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Recipient & Metadata Inputs */}
      <div className="p-3 border-b border-[var(--mailops-border)] space-y-2 text-xs">
        {/* From / Plus-Addressing Identity */}
        <div className="flex items-center gap-2">
          <span className="w-12 text-slate-500 font-medium">From:</span>
          <select
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            className="px-2 py-1 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
          >
            <option value="user@domain.com">user@domain.com (Primary)</option>
            {aliases.map(a => (
              <option key={a.id} value={`${a.aliasName}@domain.com`}>
                {a.aliasName}@domain.com (Alias)
              </option>
            ))}
          </select>

          {/* Plus-Addressing Sub-tag input */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-[var(--mailops-border)]">
            <span className="text-slate-400 font-mono">+</span>
            <input
              type="text"
              placeholder="tag (e.g. invoices)"
              value={plusTag}
              onChange={(e) => setPlusTag(e.target.value)}
              className="w-24 bg-transparent outline-none font-mono text-[11px] text-[var(--mailops-text)]"
            />
          </div>
          {plusTag && (
            <span className="text-slate-400 text-[11px] font-mono">
              = {getEffectiveFrom()}
            </span>
          )}
        </div>

        {/* To Input */}
        <div className="flex items-center gap-2">
          <span className="w-12 text-slate-500 font-medium">To:</span>
          <input
            type="email"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 px-2 py-1 rounded border border-[var(--mailops-border)] bg-transparent outline-none text-[var(--mailops-text)] focus:border-blue-500"
          />
        </div>

        {/* Subject Input */}
        <div className="flex items-center gap-2">
          <span className="w-12 text-slate-500 font-medium">Subject:</span>
          <input
            type="text"
            placeholder="Subject line..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 px-2 py-1 rounded border border-[var(--mailops-border)] bg-transparent outline-none text-[var(--mailops-text)] font-medium focus:border-blue-500"
          />
        </div>
      </div>

      {/* Formatting Toolbar (WYSIWYG Mode) */}
      {mode === 'wysiwyg' && (
        <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-[var(--mailops-border)] text-xs">
          <button onClick={() => execCmd('bold')} className="p-1 px-2 font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-700">B</button>
          <button onClick={() => execCmd('italic')} className="p-1 px-2 italic rounded hover:bg-slate-200 dark:hover:bg-slate-700">I</button>
          <button onClick={() => execCmd('strikeThrough')} className="p-1 px-2 line-through rounded hover:bg-slate-200 dark:hover:bg-slate-700">S</button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
          <button onClick={() => execCmd('formatBlock', '<h1>')} className="p-1 px-1.5 font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-700">H1</button>
          <button onClick={() => execCmd('formatBlock', '<h2>')} className="p-1 px-1.5 font-semibold rounded hover:bg-slate-200 dark:hover:bg-slate-700">H2</button>
          <button onClick={() => execCmd('formatBlock', '<blockquote>')} className="p-1 px-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">“ Quote</button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
          <button onClick={() => execCmd('insertUnorderedList')} className="p-1 px-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">• List</button>
          <button onClick={() => execCmd('insertOrderedList')} className="p-1 px-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">1. List</button>
          <button onClick={() => execCmd('insertHorizontalRule')} className="p-1 px-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">― Line</button>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
          <button onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) execCmd('createLink', url);
          }} className="p-1 px-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700">🔗 Link</button>
          <button onClick={() => execCmd('removeFormat')} className="p-1 px-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400">Clear</button>

          {/* Signature Insertion Dropdown */}
          <div className="ml-auto flex items-center gap-1">
            <select
              onChange={(e) => {
                const sig = signatures.find(s => s.id === e.target.value);
                if (sig) insertSignature(sig.htmlContent);
                e.target.value = '';
              }}
              defaultValue=""
              className="px-2 py-1 rounded text-[11px] border border-[var(--mailops-border)] bg-transparent"
            >
              <option value="" disabled>+ Insert Signature</option>
              {signatures.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.isDefault ? '(Default)' : ''}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[220px]">
        {mode === 'wysiwyg' ? (
          <div
            ref={editorRef}
            contentEditable
            onKeyUp={handleEditorKeyUp}
            data-placeholder="Write your email here... Type **bold**, # heading, > quote, or - list for instant shortcuts."
            className="w-full h-full outline-none text-sm text-[var(--mailops-text)] leading-relaxed prose dark:prose-invert max-w-none"
          />
        ) : (
          <textarea
            value={rawMarkdown}
            onChange={(e) => setRawMarkdown(e.target.value)}
            placeholder="# Markdown Editor&#10;&#10;Write with **bold**, *italics*, lists, and code blocks."
            className="w-full h-full font-mono text-xs bg-transparent outline-none resize-none text-[var(--mailops-text)]"
          />
        )}
      </div>

      {/* Footer / Send Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-[var(--mailops-border)]">
        <div className="text-xs text-slate-400">
          RFC 3676 & 5233 Compliant
        </div>
        <div className="flex items-center gap-2">
          {defaultSignature && (
            <button
              onClick={() => insertSignature(defaultSignature.htmlContent)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--mailops-border)] hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              + Default Signature
            </button>
          )}
          <button
            onClick={handleSend}
            className="px-5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--mailops-accent)] text-white hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Send</span>
            <span>➤</span>
          </button>
        </div>
      </div>
    </div>
  );
};
