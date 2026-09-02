import React, { useState } from 'react';
import { useProductivity } from '../../context/ProductivityContext';

export const FilterRulesManager: React.FC = () => {
  const { rules, addRule, toggleRule, deleteRule } = useProductivity();
  const [showAddModal, setShowAddModal] = useState(false);

  const [ruleName, setRuleName] = useState('');
  const [field, setField] = useState('from');
  const [operator, setOperator] = useState('contains');
  const [val, setVal] = useState('');
  const [actionType, setActionType] = useState('star');
  const [actionVal, setActionVal] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !val) return;

    addRule({
      name: ruleName,
      trigger: 'on_inbound',
      condition: {
        type: 'predicate',
        field,
        operator: operator as any,
        value: val,
      },
      actions: [
        {
          type: actionType as any,
          value: actionVal || undefined,
        },
      ],
      isActive: true,
      orderPriority: rules.length + 1,
    });

    setRuleName('');
    setVal('');
    setActionVal('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>⚡</span> Automation Rules & Filter Engine
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Automatically organize, star, label, forward, and archive inbound emails.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          + Create Rule
        </button>
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {rules.map((rule) => (
          <div key={rule.id} className="py-3 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{rule.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    rule.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                IF <span className="font-mono text-zinc-700 dark:text-zinc-300">{rule.condition.field}</span>{' '}
                {rule.condition.operator} &ldquo;{String(rule.condition.value)}&rdquo; &rarr; THEN{' '}
                {rule.actions.map((a) => `${a.type}${a.value ? ` (${a.value})` : ''}`).join(', ')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleRule(rule.id)}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800"
              >
                {rule.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => deleteRule(rule.id)}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-6 text-sm text-zinc-400">No automation rules configured yet.</div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Create New Filter Rule</h3>

            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Client Label"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Field</label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full px-2 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="from">From (Sender)</option>
                    <option value="to">To (Recipient)</option>
                    <option value="subject">Subject</option>
                    <option value="body">Email Body</option>
                    <option value="header:List-Unsubscribe">Header: List-Unsubscribe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Condition</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-2 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="starts_with">Starts With</option>
                    <option value="ends_with">Ends With</option>
                    <option value="matches_regex">Matches Regex</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Match Value</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme, invoice, urgent"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Action</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-2 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="star">Star Email</option>
                    <option value="apply_label">Apply Label</option>
                    <option value="mark_read">Mark as Read</option>
                    <option value="archive">Archive</option>
                    <option value="trash">Move to Trash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Action Value (if applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clients, Support"
                    value={actionVal}
                    onChange={(e) => setActionVal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
