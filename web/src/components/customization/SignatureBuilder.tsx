import React, { useState } from 'react';
import { useUI, type AppSignature } from '../../context/UIContext';
import { sanitizeHtml } from '../../utils/markdownParser';

interface TemplateVars {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  disclaimer: string;
}

const DEFAULT_VARS: TemplateVars = {
  name: 'Alex Johnson',
  title: 'Lead Software Architect',
  company: 'Mailops Technologies Inc.',
  phone: '+1 (555) 234-5678',
  email: 'alex@mailops.local',
  website: 'https://mailops.dev',
  disclaimer: 'The information in this email is confidential and intended solely for the addressee.',
};

export const SignatureBuilder: React.FC = () => {
  const { signatures, setSignatures, addNotification } = useUI();

  const [selectedSigId, setSelectedSigId] = useState<string | null>(signatures[0]?.id || null);
  const [sigName, setSigName] = useState('My Signature');
  const [templateType, setTemplateType] = useState<'minimal' | 'corporate' | 'technical'>('corporate');
  const [vars, setVars] = useState<TemplateVars>(DEFAULT_VARS);
  const [customHtml, setCustomHtml] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  // Generate HTML from template and current vars
  const generateTemplateHtml = (type: 'minimal' | 'corporate' | 'technical', v: TemplateVars): string => {
    switch (type) {
      case 'minimal':
        return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.4;">
  <p style="margin: 0; font-weight: 700; color: #0f172a;">${v.name}</p>
  <p style="margin: 0; color: #64748b; font-size: 12px;">${[v.title, v.company].filter(Boolean).join(' • ')}</p>
  <p style="margin: 3px 0 0 0; color: #94a3b8; font-size: 11px;">${[v.email, v.phone, v.website].filter(Boolean).join(' | ')}</p>
</div>`.trim();

      case 'technical':
        return `
<div style="font-family: 'JetBrains Mono', Menlo, Monaco, Consolas, monospace; font-size: 12px; color: #334155; border-left: 3px solid #10b981; padding-left: 10px; margin-top: 10px;">
  <div><strong style="color: #047857;">&gt; ${v.name}</strong> <span style="color: #6b7280;">(${v.title})</span></div>
  <div style="color: #4b5563;">${v.company}</div>
  <div style="color: #6b7280; font-size: 11px;">✉️ ${v.email} | 🌐 ${v.website}</div>
</div>`.trim();

      case 'corporate':
      default:
        return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1e293b; border-top: 2px solid #2563eb; padding-top: 10px; margin-top: 12px;">
  <tr>
    <td style="vertical-align: top;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${v.name}</div>
      <div style="font-size: 12px; color: #2563eb; font-weight: 600;">${[v.title, v.company].filter(Boolean).join(' | ')}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">📞 ${v.phone} • ✉️ <a href="mailto:${v.email}" style="color: #2563eb; text-decoration: none;">${v.email}</a></div>
      <div style="font-size: 11px; color: #64748b;">🌐 <a href="${v.website}" style="color: #2563eb; text-decoration: none;">${v.website}</a></div>
      ${v.disclaimer ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 8px; font-style: italic; max-width: 440px;">${v.disclaimer}</div>` : ''}
    </td>
  </tr>
</table>`.trim();
    }
  };

  const currentPreviewHtml = isCustomMode ? customHtml : generateTemplateHtml(templateType, vars);

  // Save Signature
  const handleSaveSignature = async () => {
    const finalHtml = sanitizeHtml(currentPreviewHtml);
    const newSig: AppSignature = {
      id: selectedSigId || `sig-${Date.now()}`,
      domainId: 'default',
      name: sigName.trim() || 'Untitled Signature',
      htmlContent: finalHtml,
      isDefault: isDefault,
      createdAt: new Date(),
    };

    setSignatures(prev => {
      let updated = prev.map(s => isDefault ? { ...s, isDefault: false } : s);
      const exists = updated.some(s => s.id === newSig.id);
      if (exists) {
        return updated.map(s => s.id === newSig.id ? newSig : s);
      }
      return [newSig, ...updated];
    });

    try {
      await fetch('/api/customization/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSig),
      });
    } catch {}

    addNotification({
      title: 'Signature Saved',
      message: `Signature "${newSig.name}" saved successfully (RFC 3676 compliant).`,
      type: 'system',
    });
  };

  const handleDeleteSignature = (id: string) => {
    setSignatures(prev => prev.filter(s => s.id !== id));
    if (selectedSigId === id) setSelectedSigId(null);
  };

  return (
    <div className="bg-[var(--mailops-card)] border border-[var(--mailops-border)] rounded-xl p-5 shadow-sm space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--mailops-text)]">
            Custom Signature Builder
          </h3>
          <p className="text-xs text-slate-500">
            Rich HTML signatures per domain with RFC 3676 delimiter standard.
          </p>
        </div>
        <div className="text-xs font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          RFC 3676 (-- \n)
        </div>
      </div>

      {/* Signature Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {signatures.map(s => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedSigId(s.id);
              setSigName(s.name);
              setCustomHtml(s.htmlContent);
              setIsCustomMode(true);
              setIsDefault(s.isDefault);
            }}
            className={`px-3 py-1.5 rounded-lg border font-medium shrink-0 transition ${
              selectedSigId === s.id
                ? 'border-[var(--mailops-accent)] bg-blue-50 dark:bg-blue-900/30 text-[var(--mailops-accent)]'
                : 'border-[var(--mailops-border)] hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {s.name} {s.isDefault ? '⭐' : ''}
          </button>
        ))}
        <button
          onClick={() => {
            setSelectedSigId(null);
            setSigName('New Signature');
            setIsCustomMode(false);
            setIsDefault(false);
          }}
          className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500 font-medium shrink-0"
        >
          + Create New
        </button>
      </div>

      {/* Controls & Variables */}
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Signature Name</label>
            <input
              type="text"
              value={sigName}
              onChange={(e) => setSigName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-medium mb-1">Template Style</label>
            <select
              value={templateType}
              onChange={(e) => {
                setTemplateType(e.target.value as any);
                setIsCustomMode(false);
              }}
              className="w-full px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            >
              <option value="corporate">Corporate Card (Accent + Contact)</option>
              <option value="minimal">Minimal Clean (2-line)</option>
              <option value="technical">Technical / Developer (Monospace)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Fields */}
        {!isCustomMode ? (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <input
              type="text"
              placeholder="Full Name"
              value={vars.name}
              onChange={(e) => setVars({ ...vars, name: e.target.value })}
              className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            />
            <input
              type="text"
              placeholder="Title / Role"
              value={vars.title}
              onChange={(e) => setVars({ ...vars, title: e.target.value })}
              className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            />
            <input
              type="text"
              placeholder="Company"
              value={vars.company}
              onChange={(e) => setVars({ ...vars, company: e.target.value })}
              className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            />
            <input
              type="text"
              placeholder="Phone"
              value={vars.phone}
              onChange={(e) => setVars({ ...vars, phone: e.target.value })}
              className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            />
            <input
              type="email"
              placeholder="Email"
              value={vars.email}
              onChange={(e) => setVars({ ...vars, email: e.target.value })}
              className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            />
            <input
              type="text"
              placeholder="Website URL"
              value={vars.website}
              onChange={(e) => setVars({ ...vars, website: e.target.value })}
              className="px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            />
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Legal Disclaimer / Note (optional)"
                value={vars.disclaimer}
                onChange={(e) => setVars({ ...vars, disclaimer: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-slate-500 font-medium mb-1">Custom Raw HTML</label>
            <textarea
              value={customHtml}
              onChange={(e) => setCustomHtml(e.target.value)}
              rows={4}
              className="w-full p-2 font-mono text-xs rounded border border-[var(--mailops-border)] bg-transparent text-[var(--mailops-text)]"
            />
          </div>
        )}

        <div className="flex items-center gap-4 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Set as default signature</span>
          </label>
          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-blue-500 hover:underline"
          >
            {isCustomMode ? 'Use Template Form' : 'Edit Raw HTML'}
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Live Rendered Preview (with RFC 3676 Delimiter):
        </label>
        <div className="p-4 rounded-lg border border-[var(--mailops-border)] bg-white dark:bg-slate-900 shadow-inner">
          <div className="text-slate-400 font-mono text-xs mb-2">-- </div>
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentPreviewHtml) }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--mailops-border)]">
        {selectedSigId ? (
          <button
            onClick={() => handleDeleteSignature(selectedSigId)}
            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
          >
            Delete Signature
          </button>
        ) : <div />}
        <button
          onClick={handleSaveSignature}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--mailops-accent)] text-white hover:opacity-90 transition shadow-sm"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};
