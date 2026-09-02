import React from 'react';
import { useUI } from '../../context/UIContext';
import type { SoundEffectType } from '../../utils/webAudio';

export const SoundSettings: React.FC = () => {
  const {
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    playSound,
    isDndActive,
    savePreferencesToBackend,
  } = useUI();

  const soundPresets: { type: SoundEffectType; name: string; desc: string; icon: string }[] = [
    { type: 'swoosh', name: 'Paper Swoosh', desc: 'Synthesized frequency sweep on sending email', icon: '🚀' },
    { type: 'chime', name: 'Crystal Chime', desc: 'Harmonic 4-tone C5-E5-G5-C6 chord on receiving', icon: '🔔' },
    { type: 'crunch', name: 'Paper Crumple', desc: 'FM modulation noise burst on trashing email', icon: '🗑️' },
    { type: 'boop', name: 'Soft Pop', desc: 'Crisp wooden sine blip on archiving email', icon: '📦' },
    { type: 'alert', name: 'Priority Alert', desc: 'Dual-pulse warning tone for urgent messages', icon: '⚠️' },
  ];

  return (
    <div className="bg-[var(--mailops-card)] border border-[var(--mailops-border)] rounded-xl p-5 shadow-sm space-y-5 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--mailops-text)]">
            Sound Effects Synthesizer
          </h3>
          <p className="text-xs text-slate-500">
            Zero external audio assets: pure W3C Web Audio API oscillator synthesis.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold">
          0 KB Assets
        </span>
      </div>

      {isDndActive && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span>🌙</span>
          <span>Quiet Hours / DND is active: sound playback is currently muted automatically.</span>
        </div>
      )}

      {/* Master Toggle & Volume */}
      <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-[var(--mailops-border)]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--mailops-text)] flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="rounded text-blue-600 w-4 h-4"
            />
            <span>Enable Synthesized Sound Effects</span>
          </label>
          <span className="text-xs text-slate-400">
            {soundEnabled ? 'Active' : 'Muted'}
          </span>
        </div>

        {soundEnabled && (
          <div className="space-y-1.5 pt-2 border-t border-[var(--mailops-border)] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Master Volume:</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">{Math.round(soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
          </div>
        )}
      </div>

      {/* Preset Preview Buttons */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 mb-2.5">
          Audition Synthesized Effects:
        </h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          {soundPresets.map(preset => (
            <div
              key={preset.type}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--mailops-border)] bg-white dark:bg-slate-900"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{preset.icon}</span>
                <div>
                  <div className="font-semibold text-[var(--mailops-text)]">{preset.name}</div>
                  <div className="text-slate-400 text-[11px]">{preset.desc}</div>
                </div>
              </div>
              <button
                onClick={() => playSound(preset.type)}
                className="px-3 py-1.5 rounded-lg border border-[var(--mailops-border)] hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 text-[var(--mailops-accent)] font-medium transition"
              >
                ▶ Test
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save preferences */}
      <button
        onClick={savePreferencesToBackend}
        className="w-full py-2 text-xs font-semibold rounded-lg bg-[var(--mailops-accent)] text-white hover:opacity-90 transition shadow-sm"
      >
        Save Sound Preferences
      </button>
    </div>
  );
};
