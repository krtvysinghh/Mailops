import React, { useState } from 'react';
import { useProductivity, type CannedTemplateState } from '../../context/ProductivityContext';

interface TemplateSelectorProps {
  onSelectTemplate: (renderedBody: string, renderedSubject?: string) => void;
  contextData?: Record<string, any>;
  onClose?: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  contextData = {},
  onClose,
}) => {
  const { templates } = useProductivity();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.shortcutKey && t.shortcutKey.toLowerCase().includes(search.toLowerCase())) ||
      t.body.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApply = (tpl: CannedTemplateState) => {
    let body = tpl.body;
    let subject = tpl.subject || '';

    // Interpolate common placeholders
    const merged = {
      name: 'Valued Contact',
      date: new Date().toLocaleDateString(),
      time: '10:00 AM',
      ...contextData,
    };

    for (const [k, v] of Object.entries(merged)) {
      body = body.replace(new RegExp(`\\{\\{\\s*${k}[^}]*\\}\\}`, 'gi'), String(v));
      subject = subject.replace(new RegExp(`\\{\\{\\s*${k}[^}]*\\}\\}`, 'gi'), String(v));
    }

    // Clean remaining placeholders with defaults
    body = body.replace(/\{\{[^}]+\||\s*default:\s*['"]([^'"]+)['"][^}]*\}\}/gi, '$1');
    body = body.replace(/\{\{[^}]+\}\}/gi, '');

    onSelectTemplate(body, subject || undefined);
    onClose?.();
  };

  return (
    <div className="w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 z-50 text-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <span>📝</span> Canned Templates
        </span>
        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xs">
            ✕
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search templates or shortcuts (e.g. !meeting)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
      />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {['all', 'scheduling', 'general', 'support'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => handleApply(tpl)}
            className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100">{tpl.title}</span>
              {tpl.shortcutKey && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  {tpl.shortcutKey}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{tpl.body}</p>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-4 text-xs text-zinc-400">No templates found</div>
        )}
      </div>
    </div>
  );
};
