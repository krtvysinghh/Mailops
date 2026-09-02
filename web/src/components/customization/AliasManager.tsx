import React, { useState } from 'react';
import { useUI, type AppAlias } from '../../context/UIContext';

export const AliasManager: React.FC = () => {
  const { aliases, setAliases, addNotification } = useUI();

  const [newAliasName, setNewAliasName] = useState('');
  const [targetFolder, setTargetFolder] = useState('inbox');
  const [autoTag, setAutoTag] = useState('');

  // Plus-addressing interactive tester
  const [testInput, setTestInput] = useState('user+receipts@domain.com');

  const handleCreateAlias = async () => {
    if (!newAliasName.trim()) return;

    const alias: AppAlias = {
      id: `alias-${Date.now()}`,
      domainId: 'default',
      aliasName: newAliasName.trim().toLowerCase(),
      targetFolderId: targetFolder,
      autoTagId: autoTag.trim() || null,
      isActive: true,
    };

    setAliases(prev => [...prev, alias]);
    setNewAliasName('');
    setAutoTag('');

    try {
      await fetch('/api/customization/aliases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alias),
      });
    } catch {}

    addNotification({
      title: 'Alias Created',
      message: `Alias "${alias.aliasName}@domain.com" registered.`,
      type: 'system',
    });
  };

  const handleDeleteAlias = (id: string) => {
    setAliases(prev => prev.filter(a => a.id !== id));
  };

  // Test resolution logic
  const parseTest = () => {
    const at = testInput.indexOf('@');
    if (at === -1) return { base: testInput, tag: null, domain: '' };
    const local = testInput.slice(0, at);
    const domain = testInput.slice(at + 1);
    const plusIdx = local.indexOf('+');
    if (plusIdx !== -1) {
      return {
        base: local.slice(0, plusIdx),
        tag: local.slice(plusIdx + 1),
        domain,
      };
    }
    return { base: local, tag: null, domain };
  };

  const testParsed = parseTest();
  const matchedAlias = aliases.find(a => 
    a.aliasName === testParsed.tag || a.aliasName === testParsed.base
  );

  return (
    <div className="bg-[var(--mailops-card)] border border-[var(--mailops-border)] rounded-xl p-5 shadow-sm space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-bold text-[var(--mailops-text)]">
          Plus-Addressing & Custom Aliases
        </h3>
        <p className="text-xs text-slate-500">
          RFC 5233 sub-addressing support and custom alias routing rules.
        </p>
      </div>

      {/* 1. Sub-addressing Live Simulator */}
      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-[var(--mailops-border)] space-y-2 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          RFC 5233 Sub-addressing Simulator:
        </span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="e.g. user+newsletters@company.com"
            className="flex-1 px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent font-mono text-[11px] text-[var(--mailops-text)]"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono pt-1">
          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-[var(--mailops-border)]">
            Base User: <strong className="text-blue-600">{testParsed.base}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-[var(--mailops-border)]">
            Sub-Tag: <strong className="text-purple-600">{testParsed.tag || 'none'}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2 rounded border border-[var(--mailops-border)]">
            Domain: <strong className="text-green-600">{testParsed.domain || 'N/A'}</strong>
          </div>
        </div>
        {matchedAlias && (
          <div className="text-[11px] text-emerald-600 font-medium">
            ✓ Routes to folder <strong>{matchedAlias.targetFolderId}</strong> {matchedAlias.autoTagId ? `with tag #${matchedAlias.autoTagId}` : ''}
          </div>
        )}
      </div>

      {/* 2. Registered Aliases List */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 mb-2">Registered Domain Aliases:</h4>
        <div className="divide-y divide-[var(--mailops-border)] border border-[var(--mailops-border)] rounded-lg overflow-hidden text-xs">
          {aliases.map(a => (
            <div key={a.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900">
              <div>
                <span className="font-semibold text-[var(--mailops-text)] font-mono">{a.aliasName}@domain.com</span>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Folder: <span className="text-slate-600 dark:text-slate-300">{a.targetFolderId || 'inbox'}</span>
                  {a.autoTagId && ` • Tag: #${a.autoTagId}`}
                </div>
              </div>
              <button
                onClick={() => handleDeleteAlias(a.id)}
                className="text-red-500 hover:text-red-700 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Create New Alias Rule */}
      <div className="p-3.5 rounded-lg border border-[var(--mailops-border)] bg-slate-50/50 dark:bg-slate-800/30 space-y-3 text-xs">
        <h4 className="font-semibold text-slate-700 dark:text-slate-200">Add New Inbound Alias Rule:</h4>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="alias (e.g. billing)"
            value={newAliasName}
            onChange={(e) => setNewAliasName(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
          />
          <select
            value={targetFolder}
            onChange={(e) => setTargetFolder(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
          >
            <option value="inbox">Target: Inbox</option>
            <option value="billing">Target: Billing Folder</option>
            <option value="support">Target: Support Folder</option>
            <option value="newsletters">Target: Newsletters</option>
          </select>
          <input
            type="text"
            placeholder="Auto-tag (optional)"
            value={autoTag}
            onChange={(e) => setAutoTag(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
          />
        </div>
        <button
          onClick={handleCreateAlias}
          className="w-full py-2 font-semibold rounded-lg bg-[var(--mailops-accent)] text-white hover:opacity-90 transition"
        >
          + Add Virtual Alias
        </button>
      </div>
    </div>
  );
};
