import React from 'react';

export interface ZenReadingModeProps {
  email: {
    subject: string;
    from: string;
    date: string;
    htmlBody?: string;
    textBody?: string;
  };
  onClose: () => void;
}

export const ZenReadingMode: React.FC<ZenReadingModeProps> = ({ email, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col items-center justify-start overflow-y-auto px-6 py-12">
      <div className="w-full max-w-3xl flex justify-between items-center mb-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Zen Focus View</span>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors"
        >
          Exit Zen Mode (Esc)
        </button>
      </div>

      <article className="w-full max-w-3xl prose dark:prose-invert lg:prose-lg font-serif">
        <h1 className="font-sans font-bold text-3xl mb-4 text-zinc-900 dark:text-zinc-50">{email.subject}</h1>
        <div className="font-sans text-sm text-zinc-500 mb-8 flex justify-between">
          <span>From: <strong>{email.from}</strong></span>
          <span>{email.date}</span>
        </div>

        {email.htmlBody ? (
          <div dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
        ) : (
          <p className="whitespace-pre-line text-zinc-800 dark:text-zinc-200 leading-relaxed">{email.textBody}</p>
        )}
      </article>
    </div>
  );
};
