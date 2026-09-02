import React, { useState, useEffect, useRef } from 'react';
import { useProductivity } from '../../context/ProductivityContext';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut: string;
  action: () => void;
}

export const CommandPaletteModal: React.FC = () => {
  const { isCommandPaletteOpen, closeCommandPalette, openScheduleModal } = useProductivity();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'cmd_inbox',
      title: 'Go to Inbox',
      category: 'Navigation',
      shortcut: 'g i',
      action: () => {
        window.location.hash = '#inbox';
      },
    },
    {
      id: 'cmd_sent',
      title: 'Go to Sent',
      category: 'Navigation',
      shortcut: 'g s',
      action: () => {
        window.location.hash = '#sent';
      },
    },
    {
      id: 'cmd_snoozed',
      title: 'Go to Snoozed',
      category: 'Navigation',
      shortcut: 'g b',
      action: () => {
        window.location.hash = '#snoozed';
      },
    },
    {
      id: 'cmd_archive',
      title: 'Archive Current Thread',
      category: 'Actions',
      shortcut: 'e',
      action: () => {},
    },
    {
      id: 'cmd_star',
      title: 'Star / Flag Current Email',
      category: 'Actions',
      shortcut: 's',
      action: () => {},
    },
    {
      id: 'cmd_schedule_send',
      title: 'Schedule Send / Send Later...',
      category: 'Actions',
      shortcut: 'Cmd+Shift+Enter',
      action: () => {
        openScheduleModal();
      },
    },
    {
      id: 'cmd_reply',
      title: 'Reply to Sender',
      category: 'Drafts',
      shortcut: 'r',
      action: () => {},
    },
    {
      id: 'cmd_compose',
      title: 'Compose New Email',
      category: 'Drafts',
      shortcut: 'c',
      action: () => {},
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase()) ||
      c.shortcut.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      closeCommandPalette();
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 gap-3">
          <span className="text-zinc-400 text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((cmd, idx) => (
            <div
              key={cmd.id}
              onClick={() => {
                cmd.action();
                closeCommandPalette();
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition ${
                idx === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    idx === selectedIndex
                      ? 'bg-blue-700 text-blue-100'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {cmd.category}
                </span>
                <span className="text-sm font-medium">{cmd.title}</span>
              </div>

              <kbd
                className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  idx === selectedIndex
                    ? 'bg-blue-700 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}
              >
                {cmd.shortcut}
              </kbd>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-6 text-xs text-zinc-400">No matching commands found.</div>
          )}
        </div>

        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-[11px] text-zinc-400">
          <span>Navigate with &uarr; &darr;</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
