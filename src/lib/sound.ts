// SRS v2.3 §3.11 sound. Effects are made with the Web Audio API (no files, no licences): soft
// layered voices — two slightly detuned oscillators through a filter, and filtered noise for
// paper, taps and air — sent through a shared bus with a gentle limiter and a small room
// (audioEngine.ts). Music is the game's own loops (music.ts), one per region, on by default and
// quiet; it fades in and out. Nothing plays before the player's first click or key press
// (browser autoplay rules), sound pauses while the tab is hidden, and the final stop is silent
// (GD-6).
import { useEffect, useState } from 'react';
import { envelope, getAudio, noiseBuffer, type AudioBus } from './audioEngine';
import { playTune, type Player } from './music';
import { useProgress } from '../store/progress';

export type Effect =
  'page' | 'tick' | 'correct' | 'wrong' | 'stamp' | 'achievement' | 'build' | 'whoosh' | 'talk';

interface Tone {
  kind: 'tone';
  freq: number;
  /** Slide to this pitch over the note (a thump that drops, a soft "bonk"). */
  glideTo?: number;
  at: number;
  length: number;
  wave?: OscillatorType;
  gain: number;
  attack?: number;
  /** Low-pass cut-off in Hz (softens bright waves). */
  cutoff?: number;
  /** Share sent to the room reverb, 0–1. */
  room?: number;
  pan?: number;
}

interface Noise {
  kind: 'noise';
  at: number;
  length: number;
  gain: number;
  filter: BiquadFilterType;
  freq: number;
  /** Sweep the filter to this frequency (air rushing past). */
  freqTo?: number;
  q?: number;
  attack?: number;
  room?: number;
}

type Voice = Tone | Noise;

const t = (v: Omit<Tone, 'kind'>): Tone => ({ kind: 'tone', ...v });
const n = (v: Omit<Noise, 'kind'>): Noise => ({ kind: 'noise', ...v });

/** Each effect as layered voices: start and length in seconds. */
const EFFECTS: Record<Effect, () => Voice[]> = {
  // A page turning: a short brush of paper.
  page: () => [
    n({ at: 0, length: 0.11, gain: 0.35, filter: 'bandpass', freq: 2600, freqTo: 1300, q: 0.9 }),
  ],
  // Rizal talks on the welcome card: three soft, quick blips, like a voice.
  talk: () => [
    t({ freq: 523, glideTo: 587, at: 0, length: 0.07, wave: 'triangle', gain: 0.22, cutoff: 1800 }),
    t({
      freq: 659,
      glideTo: 622,
      at: 0.08,
      length: 0.07,
      wave: 'triangle',
      gain: 0.2,
      cutoff: 1800,
    }),
    t({
      freq: 587,
      glideTo: 698,
      at: 0.16,
      length: 0.09,
      wave: 'triangle',
      gain: 0.2,
      cutoff: 1800,
    }),
  ],
  // The typewriter: a tiny tap, a little different each time.
  tick: () => [
    n({
      at: 0,
      length: 0.018,
      gain: 0.07,
      filter: 'highpass',
      freq: 2800 + Math.random() * 900,
      attack: 0.001,
    }),
  ],
  // Correct: two bright bell notes going up.
  correct: () => [
    t({ freq: 784, at: 0, length: 0.32, wave: 'sine', gain: 0.5, room: 0.35, pan: -0.15 }),
    t({ freq: 1568, at: 0, length: 0.2, wave: 'sine', gain: 0.12 }),
    t({ freq: 1175, at: 0.1, length: 0.5, wave: 'sine', gain: 0.5, room: 0.4, pan: 0.15 }),
    t({ freq: 2350, at: 0.1, length: 0.3, wave: 'sine', gain: 0.1 }),
  ],
  // Wrong: a soft, low "bonk" — never harsh.
  wrong: () => [
    t({ freq: 233, glideTo: 165, at: 0, length: 0.28, wave: 'triangle', gain: 0.45, cutoff: 900 }),
    t({
      freq: 175,
      glideTo: 123,
      at: 0.12,
      length: 0.32,
      wave: 'triangle',
      gain: 0.35,
      cutoff: 800,
    }),
  ],
  // A stamp: a deep thump with a little paper slap.
  stamp: () => [
    t({ freq: 150, glideTo: 55, at: 0, length: 0.22, wave: 'sine', gain: 1, attack: 0.003 }),
    n({ at: 0, length: 0.06, gain: 0.35, filter: 'lowpass', freq: 1400, attack: 0.002 }),
  ],
  // Achievement: a rising arpeggio with a sparkle on top.
  achievement: () => [
    ...[523, 659, 784, 1047].map((freq, i) =>
      t({
        freq,
        at: i * 0.075,
        length: 0.4,
        wave: 'triangle',
        gain: 0.32,
        cutoff: 3200,
        room: 0.4,
      }),
    ),
    t({ freq: 2093, at: 0.3, length: 0.6, wave: 'sine', gain: 0.12, room: 0.6, pan: 0.3 }),
    t({ freq: 3136, at: 0.36, length: 0.5, wave: 'sine', gain: 0.06, room: 0.6, pan: -0.3 }),
  ],
  // Building: two wooden knocks.
  build: () =>
    [0, 0.13].flatMap((at, i) => [
      t({
        freq: i ? 165 : 196,
        glideTo: i ? 140 : 170,
        at,
        length: 0.12,
        wave: 'triangle',
        gain: 0.7,
        attack: 0.002,
        cutoff: 1200,
      }),
      n({ at, length: 0.035, gain: 0.25, filter: 'bandpass', freq: 900, q: 2, attack: 0.001 }),
    ]),
  // U9 fly-down: air rushing past, falling in pitch.
  whoosh: () => [
    n({
      at: 0,
      length: 1.1,
      gain: 0.5,
      filter: 'bandpass',
      freq: 500,
      freqTo: 1800,
      q: 0.7,
      attack: 0.35,
      room: 0.3,
    }),
    n({
      at: 0.55,
      length: 0.9,
      gain: 0.35,
      filter: 'bandpass',
      freq: 1600,
      freqTo: 300,
      q: 0.7,
      attack: 0.2,
      room: 0.3,
    }),
    t({
      freq: 330,
      glideTo: 165,
      at: 0.2,
      length: 1.2,
      wave: 'sine',
      gain: 0.18,
      attack: 0.3,
      room: 0.4,
    }),
  ],
};

/** How loud effects are next to the music, before the player's volume. */
const EFFECTS_LEVEL = 0.22;

let unlocked = false;
let quiet = false;
let music: { region: string; player: Player } | null = null;
const listeners = new Set<() => void>();

/** The final stop (GD-6) switches all sound off here; music fades out at once. */
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
    void getAudio()?.context.resume();
    listeners.forEach((listener) => listener());
  };
  // Hidden tab: pause everything (music too); back again: carry on.
  const visibility = () => {
    const context = getAudio()?.context;
    if (!context || !unlocked) return;
    void (document.hidden ? context.suspend() : context.resume());
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  document.addEventListener('visibilitychange', visibility);
  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    document.removeEventListener('visibilitychange', visibility);
  };
}

function connect(bus: AudioBus, node: AudioNode, room = 0, pan = 0) {
  const { context } = bus;
  let tail: AudioNode = node;
  if (pan !== 0 && typeof context.createStereoPanner === 'function') {
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    tail = tail.connect(panner);
  }
  tail.connect(bus.out);
  if (room > 0) {
    const send = context.createGain();
    send.gain.value = room;
    tail.connect(send).connect(bus.room);
  }
}

function voice(bus: AudioBus, v: Voice, start: number, level: number) {
  const { context } = bus;
  const at = start + v.at;
  const end = at + v.length;
  const gain = context.createGain();
  envelope(gain.gain, at, level * v.gain, v.attack ?? 0.006, v.length);

  if (v.kind === 'tone') {
    // Two oscillators a few cents apart: a warmer, fuller voice than one bare wave.
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = v.cutoff ?? 6000;
    filter.connect(gain);
    for (const detune of [-4, 4]) {
      const osc = context.createOscillator();
      osc.type = v.wave ?? 'triangle';
      osc.detune.value = detune;
      osc.frequency.setValueAtTime(v.freq, at);
      if (v.glideTo) osc.frequency.exponentialRampToValueAtTime(v.glideTo, end);
      osc.connect(filter);
      osc.start(at);
      osc.stop(end + 0.05);
    }
  } else {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer(context);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = v.filter;
    filter.Q.value = v.q ?? 0.8;
    filter.frequency.setValueAtTime(v.freq, at);
    if (v.freqTo) filter.frequency.exponentialRampToValueAtTime(v.freqTo, end);
    source.connect(filter).connect(gain);
    source.start(at, Math.random() * 0.5);
    source.stop(end + 0.05);
  }
  connect(bus, gain, v.room ?? 0.12, v.kind === 'tone' ? (v.pan ?? 0) : 0);
}

export function play(effect: Effect): void {
  const { sound, volume } = useProgress.getState().settings;
  if (!sound || quiet || !unlocked || volume <= 0) return;
  try {
    const bus = getAudio();
    if (!bus) return;
    const start = bus.context.currentTime + 0.005;
    const level = EFFECTS_LEVEL * volume;
    for (const v of EFFECTS[effect]()) voice(bus, v, start, level);
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
    // The old region's loop fades out while the new one fades in.
    stopMusic();
    const bus = getAudio();
    const player = bus ? playTune(bus, region, useProgress.getState().settings.volume) : null;
    if (player) music = { region, player };
  }, [region, on, ready]);

  useEffect(() => music?.player.setVolume(volume), [volume]);
  useEffect(() => () => stopMusic(), []);
}
