// SRS v2.3 §3.11 sound. Effects are short square/triangle-wave blips made with the Web Audio
// API (no files, no licences). Music is optional: public/audio/music/<region>.ogg, if the team
// adds CC0 loops; missing files mean no music and no error. Nothing plays before the player's
// first click or key press (browser autoplay rules), and the final stop is silent (GD-6).
import { useEffect } from 'react';
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

/** The final stop (GD-6) and tests switch sound off here. */
export function setQuiet(value: boolean): void {
  quiet = value;
}

/** Call once at start: sound is allowed from the first click or key press on. */
export function unlockOnFirstGesture(): () => void {
  const unlock = () => {
    unlocked = true;
    void context?.resume();
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
    context ??= new AudioContext();
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

/** Optional music: a region's loop if the file exists and Music is on (default off). */
export function useMusic(region: string | undefined): void {
  const { music, volume } = useProgress((s) => s.settings);
  useEffect(() => {
    if (!region || !music || quiet) return;
    let audio: HTMLAudioElement | null = null;
    let cancelled = false;
    const src = `${import.meta.env.BASE_URL}audio/music/${region}.ogg`;
    fetch(src, { method: 'HEAD' })
      .then((response) => {
        if (cancelled || !response.ok) return;
        audio = new Audio(src);
        audio.loop = true;
        audio.volume = 0.3 * volume;
        const start = () => void audio?.play().catch(() => undefined);
        if (unlocked) start();
        else window.addEventListener('pointerdown', start, { once: true });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      audio?.pause();
    };
  }, [region, music, volume]);
}
