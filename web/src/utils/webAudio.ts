/**
 * Feature 46: Sound Effects Synthesizer (Zero Audio Assets)
 * Pure W3C Web Audio API oscillator synthesis engine.
 * Generates swoosh, chime, crunch, boop, and alert sound effects without any media files.
 */

export type SoundEffectType = 'swoosh' | 'chime' | 'crunch' | 'boop' | 'alert';

let audioCtxInstance: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtxInstance || audioCtxInstance.state === 'closed') {
    audioCtxInstance = new AudioContextClass();
  }

  // Handle suspended state due to browser autoplay policies
  if (audioCtxInstance.state === 'suspended') {
    audioCtxInstance.resume().catch(() => {});
  }

  return audioCtxInstance;
}

/**
 * Plays a paper swoosh sound effect (Send Email).
 * Smooth upward frequency sweep with exponential gain decay.
 */
export function playSwoosh(volume: number = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.6, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  masterGain.connect(ctx.destination);

  // Main upward sweep oscillator
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(180, now);
  osc1.frequency.exponentialRampToValueAtTime(920, now + 0.32);

  // Harmonic color oscillator
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(240, now);
  osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.32);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.4, now);

  osc1.connect(masterGain);
  osc2.connect(gain2);
  gain2.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.35);
  osc2.stop(now + 0.35);
}

/**
 * Plays a crystal chime chord (Receive Email).
 * Harmonic 4-tone ascending bell chord (C5, E5, G5, C6).
 */
export function playChime(volume: number = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chord = [
    { freq: 523.25, time: 0, dur: 0.5, gain: 0.4 },     // C5
    { freq: 659.25, time: 0.08, dur: 0.45, gain: 0.35 },// E5
    { freq: 783.99, time: 0.16, dur: 0.4, gain: 0.3 },  // G5
    { freq: 1046.50, time: 0.24, dur: 0.35, gain: 0.25 },// C6
  ];

  for (const tone of chord) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const toneStart = now + tone.time;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(tone.freq, toneStart);

    gainNode.gain.setValueAtTime(0, toneStart);
    gainNode.gain.linearRampToValueAtTime(volume * tone.gain, toneStart + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, toneStart + tone.dur);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(toneStart);
    osc.stop(toneStart + tone.dur);
  }
}

/**
 * Plays a crumple / crunch sound effect (Trash / Delete).
 * Low frequency modulated sawtooth crunch.
 */
export function playCrunch(volume: number = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume * 0.5, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  masterGain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

  const subOsc = ctx.createOscillator();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(70, now);
  subOsc.frequency.linearRampToValueAtTime(20, now + 0.2);

  osc.connect(masterGain);
  subOsc.connect(masterGain);

  osc.start(now);
  subOsc.start(now);
  osc.stop(now + 0.25);
  subOsc.stop(now + 0.25);
}

/**
 * Plays a soft marimba pop tone (Archive Email).
 * Quick 440Hz -> 880Hz pop with rapid decay.
 */
export function playBoop(volume: number = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

  gainNode.gain.setValueAtTime(volume * 0.6, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
}

/**
 * Plays a dual-tone pulsating alert sound (Warning / Urgent Alert).
 */
export function playAlert(volume: number = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const tones = [
    { freq: 880, start: 0, dur: 0.14 },
    { freq: 1760, start: 0.16, dur: 0.16 },
  ];

  for (const t of tones) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const toneStart = now + t.start;

    osc.type = 'square';
    osc.frequency.setValueAtTime(t.freq, toneStart);

    gainNode.gain.setValueAtTime(0, toneStart);
    gainNode.gain.linearRampToValueAtTime(volume * 0.25, toneStart + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, toneStart + t.dur);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(toneStart);
    osc.stop(toneStart + t.dur);
  }
}

/**
 * Dispatches the appropriate synthesized sound effect based on type.
 */
export function playSound(type: SoundEffectType, volume: number = 0.5): void {
  const clampedVol = Math.max(0, Math.min(1, volume));
  if (clampedVol <= 0) return;

  switch (type) {
    case 'swoosh':
      playSwoosh(clampedVol);
      break;
    case 'chime':
      playChime(clampedVol);
      break;
    case 'crunch':
      playCrunch(clampedVol);
      break;
    case 'boop':
      playBoop(clampedVol);
      break;
    case 'alert':
      playAlert(clampedVol);
      break;
  }
}
