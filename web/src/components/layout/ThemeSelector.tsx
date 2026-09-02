import React, { useState } from 'react';
import { useUI, type ThemeMode, type DensityMode } from '../../context/UIContext';

const ACCENT_PRESETS = [
  { name: 'Classic Blue', hex: '#2563eb' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Royal Purple', hex: '#7c3aed' },
  { name: 'Crimson Rose', hex: '#e11d48' },
  { name: 'Amber Glow', hex: '#d97706' },
  { name: 'Teal Cyan', hex: '#0891b2' },
];

function hexToLuminance(hex: string): number {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length !== 6) return 0.5;
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const transform = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

function calculateContrast(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export const ThemeSelector: React.FC = () => {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    density,
    setDensity,
    savePreferencesToBackend,
  } = useUI();

  const [savedSuccess, setSavedSuccess] = useState(false);

  const whiteContrast = calculateContrast(accentColor, '#ffffff');
  const blackContrast = calculateContrast(accentColor, '#000000');
  const bestText = whiteContrast >= 4.5 ? '#ffffff' : '#000000';
  const bestContrast = Math.max(whiteContrast, blackContrast);

  const handleSave = async () => {
    await savePreferencesToBackend();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="p-4 bg-[var(--mailops-card)] border border-[var(--mailops-border)] rounded-xl max-w-md shadow-sm">
      <h3 className="text-base font-semibold text-[var(--mailops-text)] mb-3">
        Appearance & Theme
      </h3>

      {/* 1. Theme Mode Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Color Theme
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(
            [
              { id: 'light', label: '☀️ Clean Light' },
              { id: 'dark', label: '🌙 Midnight Dark' },
              { id: 'solarized', label: '🪐 Solarized Dark' },
              { id: 'high-contrast', label: '👁️ High Contrast (A11y)' },
            ] as { id: ThemeMode; label: string }[]
          ).map(item => (
            <button
              key={item.id}
              onClick={() => setTheme(item.id)}
              className={`p-2.5 rounded-lg border text-left font-medium transition ${
                theme === item.id
                  ? 'border-[var(--mailops-accent)] bg-blue-50/50 dark:bg-blue-900/20 text-[var(--mailops-accent)]'
                  : 'border-[var(--mailops-border)] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Accent Color Picker */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Accent Color
        </label>
        <div className="flex items-center gap-2 mb-2">
          {ACCENT_PRESETS.map(preset => (
            <button
              key={preset.hex}
              onClick={() => {
                setAccentColor(preset.hex);
              }}
              title={preset.name}
              style={{ backgroundColor: preset.hex }}
              className={`w-7 h-7 rounded-full transition-transform ${
                accentColor.toLowerCase() === preset.hex.toLowerCase()
                  ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                  : 'hover:scale-105'
              }`}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={(e) => {
              setAccentColor(e.target.value);
            }}
            className="w-7 h-7 rounded-md cursor-pointer border-0 p-0"
            title="Custom Color"
          />
        </div>

        {/* Contrast Ratio Indicator */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs border border-[var(--mailops-border)]">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: accentColor, color: bestText }}
              className="px-2 py-0.5 rounded font-mono font-bold text-[11px]"
            >
              {accentColor}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              WCAG Contrast: <strong>{bestContrast}:1</strong>
            </span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${
              bestContrast >= 7.0
                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                : bestContrast >= 4.5
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
            }`}
          >
            {bestContrast >= 7.0 ? 'AAA Pass' : bestContrast >= 4.5 ? 'AA Pass' : 'Low Contrast'}
          </span>
        </div>
      </div>

      {/* 3. Density Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Display Density
        </label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {(
            [
              { id: 'compact', label: 'Compact' },
              { id: 'normal', label: 'Normal' },
              { id: 'comfortable', label: 'Comfortable' },
            ] as { id: DensityMode; label: string }[]
          ).map(d => (
            <button
              key={d.id}
              onClick={() => setDensity(d.id)}
              className={`p-2 text-center rounded-lg border font-medium transition ${
                density === d.id
                  ? 'border-[var(--mailops-accent)] bg-blue-50/50 dark:bg-blue-900/20 text-[var(--mailops-accent)]'
                  : 'border-[var(--mailops-border)] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-[var(--mailops-accent)] text-white hover:opacity-90 transition flex items-center justify-center gap-1.5"
      >
        {savedSuccess ? '✓ Preferences Saved' : 'Save Preferences'}
      </button>
    </div>
  );
};
