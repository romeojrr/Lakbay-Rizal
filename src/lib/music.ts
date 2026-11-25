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

/** Four original loops. The lead and bass arrays are the same length (one loop). */
export const TUNES: Record<string, Tune> = {
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

/** Starts a region's loop; returns how to stop it. */
export function playTune(context: AudioContext, name: string, volume: number): Player | null {
  const tune = TUNES[name];
  if (!tune) return null;
  const master = context.createGain();
  master.gain.value = 0.045 * volume;
  const soften = context.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 2400;
  master.connect(soften).connect(context.destination);

  const stepTime = (60 / tune.bpm) * tune.stepBeats;
  let step = 0;
  let nextAt = context.currentTime + 0.1;

  const note = (degree: Step, at: number, wave: OscillatorType, level: number, length: number) => {
    if (degree === null) return;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = wave;
    osc.frequency.value = freqOf(midiOf(tune, degree));
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(level * 0.5, at + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + length + 0.02);
  };

  // A held note lasts until the next note in its line.
  const length = (line: Step[], i: number) => {
    if (tune.pluck) return stepTime * 1.4;
    let n = 1;
    while (n < line.length && line[(i + n) % line.length] === null) n++;
    return Math.min(n, 4) * stepTime * 0.9;
  };

  const schedule = () => {
    while (nextAt < context.currentTime + 0.25) {
      const i = step % tune.lead.length;
      note(tune.lead[i] ?? null, nextAt, tune.leadWave, 0.5, length(tune.lead, i));
      note(tune.bass[i] ?? null, nextAt, 'triangle', 0.8, length(tune.bass, i));
      step += 1;
      nextAt += stepTime;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 60);

  return {
    stop: () => {
      window.clearInterval(timer);
      master.gain.setTargetAtTime(0.0001, context.currentTime, 0.15);
      window.setTimeout(() => master.disconnect(), 600);
    },
    setVolume: (v) => master.gain.setTargetAtTime(0.045 * v, context.currentTime, 0.1),
  };
}
