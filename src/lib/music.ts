import type { AudioBus } from './audioEngine';

// Background music: four short, original chiptune loops composed for Lakbay Rizal, one per
// region, played by a tiny Web Audio sequencer (no audio files, no licences). Each loop is a
// melody and a bass line written as scale steps; the sequencer schedules them a little ahead
// so they keep time, softened by a low-pass filter and kept quiet under the game's sounds.

/** A step: a scale degree (0 = the root; 7 = an octave up in a 7-note scale), or a rest. */
type Step = number | null;

interface Tune {
  /** Beats per minute; one step is `stepBeats` beats. */
  bpm: number;
  stepBeats: number;
  /** MIDI note of the scale's root. */
  root: number;
  /** Semitones above the root. */
  scale: number[];
  lead: Step[];
  bass: Step[];
  leadWave: OscillatorType;
  /** Short plucked notes (Asia) instead of held ones. */
  pluck?: boolean;
}

const MAJOR_PENTA = [0, 2, 4, 7, 9];
const MINOR_PENTA = [0, 3, 5, 7, 10];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const _ = null;

/** Original loops: one per region, plus the landing page ("world") and Settings. The lead
 * and bass arrays are the same length (one loop). */
export const TUNES: Record<string, Tune> = {
  // The landing page: an opening theme, rising like a journey about to begin.
  world: {
    bpm: 132,
    stepBeats: 0.5,
    root: 62, // D
    scale: MAJOR,
    leadWave: 'triangle',
    // prettier-ignore
    lead: [
      0, _, 2, 4, 7, _, 6, 4,
      5, _, 4, 2, 4, _, _, _,
      0, _, 2, 4, 7, _, 9, 7,
      8, _, 7, 6, 7, _, _, _,
    ],
    // prettier-ignore
    bass: [
      -7, _, _, _, -3, _, _, _,
      -4, _, _, _, -3, _, _, _,
      -7, _, _, _, -5, _, _, _,
      -6, _, _, _, -3, _, _, _,
    ],
  },
  // Timeline: a walking tune that steps forward, year by year.
  timeline: {
    bpm: 112,
    stepBeats: 0.5,
    root: 64, // E
    scale: MINOR,
    leadWave: 'triangle',
    // prettier-ignore
    lead: [
      0, _, 2, _, 4, _, 3, 2,
      4, _, 5, _, 4, _, _, _,
      2, _, 4, _, 6, _, 5, 4,
      5, _, 4, _, 2, _, _, _,
    ],
    // prettier-ignore
    bass: [
      -7, _, -3, _, -7, _, -3, _,
      -5, _, -1, _, -5, _, -1, _,
      -6, _, -2, _, -6, _, -2, _,
      -4, _, -3, _, -7, _, _, _,
    ],
  },
  // Scenes: a gentle music-box tune for looking at the pictures.
  scenes: {
    bpm: 96,
    stepBeats: 0.5,
    root: 72, // C
    scale: MAJOR_PENTA,
    leadWave: 'sine',
    pluck: true,
    // prettier-ignore
    lead: [
      0, 2, 4, _, 3, _, 2, _,
      1, 2, 3, _, 2, _, _, _,
      0, 2, 4, _, 5, _, 4, _,
      3, 2, 1, _, 0, _, _, _,
    ],
    // prettier-ignore
    bass: [
      -5, _, _, _, -3, _, _, _,
      -4, _, _, _, -2, _, _, _,
      -5, _, _, _, -3, _, _, _,
      -4, _, _, _, -5, _, _, _,
    ],
  },
  // Settings: a calm, slow, plucked tune.
  settings: {
    bpm: 76,
    stepBeats: 1,
    root: 65, // F
    scale: MAJOR_PENTA,
    leadWave: 'triangle',
    pluck: true,
    // prettier-ignore
    lead: [
      4, _, 3, _, 2, _, _, _,
      3, _, 2, _, 1, _, _, _,
      2, _, 1, _, 0, _, 1, _,
      2, _, _, _, _, _, _, _,
    ],
    // prettier-ignore
    bass: [
      -5, _, _, _, _, _, _, _,
      -4, _, _, _, _, _, _, _,
      -3, _, _, _, _, _, _, _,
      -5, _, _, _, _, _, _, _,
    ],
  },
  // Philippines: a gentle lilting tune in 6/8, like a song heard across the lake at dusk.
  philippines: {
    bpm: 168,
    stepBeats: 1,
    root: 67, // G
    scale: MAJOR_PENTA,
    leadWave: 'triangle',
    lead: [
      2,
      _,
      3,
      4,
      _,
      3,
      2,
      _,
      1,
      0,
      _,
      _,
      1,
      _,
      2,
      3,
      _,
      4,
      3,
      _,
      2,
      1,
      _,
      _,
      2,
      _,
      3,
      4,
      _,
      5,
      6,
      _,
      5,
      4,
      _,
      3,
      2,
      _,
      1,
      2,
      _,
      1,
      0,
      _,
      _,
      _,
      _,
      _,
    ],
    bass: [
      -5,
      _,
      _,
      -3,
      _,
      _,
      -5,
      _,
      _,
      -3,
      _,
      _,
      -4,
      _,
      _,
      -2,
      _,
      _,
      -4,
      _,
      _,
      -2,
      _,
      _,
      -5,
      _,
      _,
      -3,
      _,
      _,
      -2,
      _,
      _,
      -3,
      _,
      _,
      -4,
      _,
      _,
      -2,
      _,
      _,
      -5,
      _,
      _,
      _,
      _,
      _,
    ],
  },
  // Asia: slow plucked notes, spacious, in a minor pentatonic scale.
  asia: {
    bpm: 132,
    stepBeats: 1,
    root: 69, // A
    scale: MINOR_PENTA,
    leadWave: 'triangle',
    pluck: true,
    lead: [
      5,
      _,
      4,
      _,
      3,
      _,
      _,
      2,
      3,
      _,
      _,
      _,
      5,
      _,
      6,
      _,
      7,
      _,
      6,
      5,
      4,
      _,
      _,
      _,
      3,
      _,
      4,
      _,
      5,
      _,
      _,
      3,
      2,
      _,
      1,
      _,
      0,
      _,
      1,
      2,
      3,
      _,
      _,
      _,
      _,
      _,
      _,
      _,
    ],
    bass: [
      -5,
      _,
      _,
      _,
      _,
      _,
      -3,
      _,
      _,
      _,
      _,
      _,
      -4,
      _,
      _,
      _,
      _,
      _,
      -2,
      _,
      _,
      _,
      _,
      _,
      -5,
      _,
      _,
      _,
      _,
      _,
      -3,
      _,
      _,
      _,
      _,
      _,
      -5,
      _,
      _,
      _,
      -4,
      _,
      _,
      _,
      _,
      _,
      _,
      _,
    ],
  },
  // Europe: a small waltz in D minor (3/4): bass on the beat, melody above.
  europe: {
    bpm: 132,
    stepBeats: 1,
    root: 62, // D
    scale: MINOR,
    leadWave: 'square',
    lead: [
      7,
      9,
      8,
      7,
      _,
      4,
      5,
      _,
      6,
      7,
      _,
      _,
      8,
      9,
      10,
      9,
      _,
      7,
      8,
      _,
      6,
      5,
      _,
      _,
      4,
      5,
      6,
      7,
      _,
      9,
      8,
      _,
      7,
      6,
      _,
      4,
      5,
      _,
      6,
      4,
      _,
      2,
      0,
      _,
      _,
      _,
      _,
      _,
    ],
    bass: [
      0,
      _,
      _,
      -3,
      _,
      _,
      -2,
      _,
      _,
      -3,
      _,
      _,
      -4,
      _,
      _,
      -3,
      _,
      _,
      -2,
      _,
      _,
      -7,
      _,
      _,
      -3,
      _,
      _,
      -2,
      _,
      _,
      -4,
      _,
      _,
      -3,
      _,
      _,
      -3,
      _,
      _,
      -7,
      _,
      _,
      0,
      _,
      _,
      _,
      _,
      _,
    ],
  },
  // America: a bright march in 4/4 for the train across the continent.
  america: {
    bpm: 228,
    stepBeats: 1,
    root: 60, // C
    scale: MAJOR,
    leadWave: 'square',
    lead: [
      4,
      _,
      4,
      5,
      7,
      _,
      4,
      _,
      5,
      _,
      3,
      _,
      4,
      _,
      _,
      _,
      2,
      _,
      2,
      3,
      5,
      _,
      2,
      _,
      4,
      _,
      3,
      2,
      1,
      _,
      _,
      _,
      4,
      _,
      4,
      5,
      7,
      _,
      9,
      _,
      8,
      7,
      6,
      5,
      4,
      _,
      7,
      _,
      6,
      _,
      4,
      _,
      5,
      _,
      3,
      _,
      1,
      _,
      2,
      _,
      0,
      _,
      _,
      _,
    ],
    bass: [
      -7,
      _,
      -3,
      _,
      -7,
      _,
      -3,
      _,
      -6,
      _,
      -3,
      _,
      -7,
      _,
      -3,
      _,
      -6,
      _,
      -3,
      _,
      -6,
      _,
      -3,
      _,
      -3,
      _,
      -7,
      _,
      -3,
      _,
      -7,
      _,
      -7,
      _,
      -3,
      _,
      -7,
      _,
      -3,
      _,
      -4,
      _,
      -2,
      _,
      -7,
      _,
      -3,
      _,
      -3,
      _,
      -6,
      _,
      -7,
      _,
      -5,
      _,
      -3,
      _,
      -6,
      _,
      -7,
      _,
      _,
      _,
    ],
  },
};

const midiOf = (tune: Tune, degree: number) => {
  const n = tune.scale.length;
  const octave = Math.floor(degree / n);
  return tune.root + (tune.scale[((degree % n) + n) % n] ?? 0) + 12 * octave;
};
const freqOf = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export interface Player {
  stop: () => void;
  setVolume: (volume: number) => void;
}

/** Music level next to the effects, before the player's volume. */
const MUSIC_LEVEL = 0.05;

/** Starts a region's loop, fading in; returns how to stop it (it fades out). */
export function playTune(bus: AudioBus, name: string, volume: number): Player | null {
  const tune = TUNES[name];
  if (!tune) return null;
  const { context } = bus;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(
    Math.max(MUSIC_LEVEL * volume, 0.0002),
    context.currentTime + 1.5,
  );
  // Square leads are softened more than triangle ones.
  const soften = context.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = tune.leadWave === 'square' ? 1700 : 2600;
  soften.Q.value = 0.5;
  master.connect(soften).connect(bus.out);
  const send = context.createGain();
  send.gain.value = 0.45;
  soften.connect(send).connect(bus.room);

  const stepTime = (60 / tune.bpm) * tune.stepBeats;
  let step = 0;
  let nextAt = context.currentTime + 0.1;

  const note = (
    degree: Step,
    at: number,
    wave: OscillatorType,
    level: number,
    length: number,
    lead: boolean,
  ) => {
    if (degree === null) return;
    const gain = context.createGain();
    // A soft rise (no click), a gentle fall, then silence.
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + (lead ? 0.025 : 0.015));
    gain.gain.exponentialRampToValueAtTime(level * 0.55, at + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    gain.connect(master);
    // The lead is two voices a few cents apart (a warmer sound); the bass is one.
    for (const detune of lead ? [-5, 5] : [0]) {
      const osc = context.createOscillator();
      osc.type = wave;
      osc.detune.value = detune;
      osc.frequency.value = freqOf(midiOf(tune, degree));
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + length + 0.05);
    }
  };

  // A held note lasts until the next note in its line.
  const length = (line: Step[], i: number) => {
    if (tune.pluck) return stepTime * 1.6;
    let n = 1;
    while (n < line.length && line[(i + n) % line.length] === null) n++;
    return Math.min(n, 4) * stepTime * 0.95;
  };

  const schedule = () => {
    while (nextAt < context.currentTime + 0.3) {
      const i = step % tune.lead.length;
      note(tune.lead[i] ?? null, nextAt, tune.leadWave, 0.42, length(tune.lead, i), true);
      note(tune.bass[i] ?? null, nextAt, 'triangle', 0.8, length(tune.bass, i), false);
      step += 1;
      nextAt += stepTime;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 50);

  return {
    stop: () => {
      window.clearInterval(timer);
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(0.0001, context.currentTime, 0.3);
      window.setTimeout(() => master.disconnect(), 1600);
    },
    setVolume: (v) =>
      master.gain.setTargetAtTime(Math.max(MUSIC_LEVEL * v, 0.0001), context.currentTime, 0.1),
  };
}
