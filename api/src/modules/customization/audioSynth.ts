/**
 * Feature 46: Sound Effects Synthesizer (Zero Audio Assets)
 * Pure TypeScript synthesis parameter definitions, envelope curves,
 * and frequency structures for W3C Web Audio API oscillators.
 */

export type SoundEffectType = 'swoosh' | 'chime' | 'crunch' | 'boop' | 'alert';

export interface OscillatorStep {
  frequency: number;
  type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  gain: number;
  startTime: number;  // Relative to note start in seconds
  duration: number;   // Duration in seconds
  frequencyRamp?: {
    targetFrequency: number;
    rampType: 'exponential' | 'linear';
  };
}

export interface SoundPreset {
  id: SoundEffectType;
  name: string;
  description: string;
  totalDuration: number; // in seconds
  oscillators: OscillatorStep[];
}

export const SOUND_PRESETS: Record<SoundEffectType, SoundPreset> = {
  swoosh: {
    id: 'swoosh',
    name: 'Paper Swoosh (Send)',
    description: 'Upward frequency sweep simulating paper sending through the air',
    totalDuration: 0.35,
    oscillators: [
      {
        frequency: 180,
        type: 'sine',
        gain: 0.6,
        startTime: 0,
        duration: 0.35,
        frequencyRamp: { targetFrequency: 920, rampType: 'exponential' },
      },
      {
        frequency: 240,
        type: 'triangle',
        gain: 0.25,
        startTime: 0.05,
        duration: 0.25,
        frequencyRamp: { targetFrequency: 1100, rampType: 'exponential' },
      },
    ],
  },
  chime: {
    id: 'chime',
    name: 'Crystal Chime (Receive)',
    description: 'Harmonic 4-tone ascending bell chord on incoming message',
    totalDuration: 0.6,
    oscillators: [
      { frequency: 523.25, type: 'sine', gain: 0.4, startTime: 0, duration: 0.5 },    // C5
      { frequency: 659.25, type: 'sine', gain: 0.35, startTime: 0.08, duration: 0.45 }, // E5
      { frequency: 783.99, type: 'sine', gain: 0.3, startTime: 0.16, duration: 0.4 },  // G5
      { frequency: 1046.50, type: 'sine', gain: 0.25, startTime: 0.24, duration: 0.35 },// C6
    ],
  },
  crunch: {
    id: 'crunch',
    name: 'Paper Crumple (Trash)',
    description: 'Low-frequency descending FM crunch for trashing emails',
    totalDuration: 0.25,
    oscillators: [
      {
        frequency: 120,
        type: 'sawtooth',
        gain: 0.4,
        startTime: 0,
        duration: 0.2,
        frequencyRamp: { targetFrequency: 35, rampType: 'exponential' },
      },
      {
        frequency: 70,
        type: 'triangle',
        gain: 0.5,
        startTime: 0.04,
        duration: 0.18,
        frequencyRamp: { targetFrequency: 20, rampType: 'linear' },
      },
    ],
  },
  boop: {
    id: 'boop',
    name: 'Soft Pop (Archive)',
    description: 'Crisp wooden marimba pop tone for instant archiving',
    totalDuration: 0.12,
    oscillators: [
      {
        frequency: 440,
        type: 'sine',
        gain: 0.5,
        startTime: 0,
        duration: 0.1,
        frequencyRamp: { targetFrequency: 880, rampType: 'exponential' },
      },
    ],
  },
  alert: {
    id: 'alert',
    name: 'Priority Alert (Urgent/Error)',
    description: 'Dual-pulse warning alert for urgent emails or errors',
    totalDuration: 0.4,
    oscillators: [
      { frequency: 880, type: 'square', gain: 0.25, startTime: 0, duration: 0.15 },
      { frequency: 1760, type: 'square', gain: 0.25, startTime: 0.18, duration: 0.18 },
    ],
  },
};

/**
 * Validates volume setting between 0.0 and 1.0.
 */
export function clampVolume(volume: number): number {
  if (isNaN(volume)) return 0.5;
  return Math.max(0.0, Math.min(1.0, volume));
}

/**
 * Computes the total active notes count and time span of a preset.
 */
export function analyzePreset(preset: SoundPreset): {
  noteCount: number;
  totalDuration: number;
  maxFrequency: number;
  minFrequency: number;
} {
  let maxFreq = 0;
  let minFreq = Infinity;

  for (const osc of preset.oscillators) {
    maxFreq = Math.max(maxFreq, osc.frequency, osc.frequencyRamp?.targetFrequency ?? 0);
    minFreq = Math.min(minFreq, osc.frequency, osc.frequencyRamp?.targetFrequency ?? osc.frequency);
  }

  return {
    noteCount: preset.oscillators.length,
    totalDuration: preset.totalDuration,
    maxFrequency: maxFreq,
    minFrequency: minFreq === Infinity ? 0 : minFreq,
  };
}
