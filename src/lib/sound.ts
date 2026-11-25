// SRS v2.3 §3.11 sound. Effects are short square/triangle-wave blips made with the Web Audio
// API (no files, no licences). Music is the game's own chiptune loops (music.ts), one per
// region, on by default and quiet. Nothing plays before the player's first click or key press
// (browser autoplay rules), and the final stop is silent (GD-6).
import { useEffect, useState } from 'react';
import { playTune, type Player } from './music';
import { useProgress } from '../store/progress';

export type Effect = 'page' | 'tick' | 'correct' | 'wrong' | 'stamp' | 'achievement' | 'build';

type Note = { freq: number; at: number; length: number; wave?: OscillatorType; gain?: number };

/** Each effect as notes: frequency (Hz), start and length (seconds). */
const EFFECTS: Record<Effect, Note[]> = {
  page: [{ freq: 660, at: 0, length: 0.05, wave: 'triangle', gain: 0.5 }],
  tick: [{ freq: 1200, at: 0, length: 0.015, wave: 'square', gain: 0.12 }],
  correct: [
    { freq: 784, at: 0, length: 0.09, wave: 'square', gain: 0.35 },
    { freq: 1175, at: 0.09, length: 0.16, wave: 'square', gain: 0.35 },
  ],
  wrong: [{ freq: 150, at: 0, length: 0.22, wave: 'square', gain: 0.3 }],
  stamp: [{ freq: 90, at: 0, length: 0.14, wave: 'triangle', gain: 0.9 }],
  achievement: [
    { freq: 523, at: 0, length: 0.08, wave: 'square', gain: 0.3 },
    { freq: 659, at: 0.08, length: 0.08, wave: 'square', gain: 0.3 },
    { freq: 784, at: 0.16, length: 0.08, wave: 'square', gain: 0.3 },
    { freq: 1047, at: 0.24, length: 0.2, wave: 'square', gain: 0.3 },
  ],
  build: [
    { freq: 110, at: 0, length: 0.1, wave: 'triangle', gain: 0.8 },
    { freq: 82, at: 0.1, length: 0.14, wave: 'triangle', gain: 0.8 },
  ],
};

let context: AudioContext | null = null;
let unlocked = false;
let quiet = false;

let music: { region: string; player: Player } | null = null;
const listeners = new Set<() => void>();

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  context ??= new AudioContext();
  return context;
}

/** The final stop (GD-6) switches all sound off here; music stops at once. */
export function setQuiet(value: boolean): void {
  quiet = value;
  if (value) stopMusic();
  listeners.forEach((listener) => listener());
}

function stopMusic() {
  music?.player.stop();
  music = null;
}

/** Call once at start: sound is allowed from the first click or key press on. */
export function unlockOnFirstGesture(): () => void {
  const unlock = () => {
    unlocked = true;
    void context?.resume();
    listeners.forEach((listener) => listener());
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
}

export function play(effect: Effect): void {
  const { sound, volume } = useProgress.getState().settings;
  if (!sound || quiet || !unlocked || volume <= 0 || typeof AudioContext === 'undefined') return;
  try {
    const context = audio();
    if (!context) return;
    const start = context.currentTime + 0.01;
    for (const note of EFFECTS[effect]) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = note.wave ?? 'square';
      osc.frequency.value = note.freq;
      const peak = 0.15 * volume * (note.gain ?? 0.4);
      gain.gain.setValueAtTime(peak, start + note.at);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.length);
      osc.connect(gain).connect(context.destination);
      osc.start(start + note.at);
      osc.stop(start + note.at + note.length + 0.02);
    }
  } catch {
    // No audio on this device: the game is complete without it.
  }
}

/** The region's loop while Music is on (after the first click; never on the final stop). */
export function useMusic(region: string | undefined): void {
  const on = useProgress((s) => s.settings.music && s.settings.volume > 0);
  const volume = useProgress((s) => s.settings.volume);
  const [ready, setReady] = useState(unlocked && !quiet);

  useEffect(() => {
    const update = () => setReady(unlocked && !quiet);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  useEffect(() => {
    if (!region || !on || !ready) {
      stopMusic();
      return;
    }
    if (music?.region === region) return;
    stopMusic();
    const context = audio();
    const player = context
      ? playTune(context, region, useProgress.getState().settings.volume)
      : null;
    if (player) music = { region, player };
  }, [region, on, ready]);

  useEffect(() => music?.player.setVolume(volume), [volume]);
  useEffect(() => () => stopMusic(), []);
}
