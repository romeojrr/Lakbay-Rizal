// One shared Web Audio graph for the game's effects and music (no audio files).
//
//   voices ─┬─────────────────────────────► master ─► compressor ─► speakers
//           └─► room (a short, soft reverb) ─┘
//
// The compressor keeps loud moments (a stamp over the music) from clipping; the small room
// makes the synth voices sound less like bare beeps. Everything is made in code.

export interface AudioBus {
  context: AudioContext;
  /** Dry input. */
  out: AudioNode;
  /** Reverb send (mixed in quietly). */
  room: AudioNode;
}

let bus: AudioBus | null = null;
let noise: AudioBuffer | null = null;

/** A stereo impulse response: decaying noise, so no recorded room is needed. */
function impulse(context: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
    }
  }
  return buffer;
}

export function getAudio(): AudioBus | null {
  if (typeof AudioContext === 'undefined') return null;
  if (bus) return bus;
  try {
    const context = new AudioContext({ latencyHint: 'interactive' });
    const master = context.createGain();
    master.gain.value = 0.9;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.25;
    master.connect(compressor).connect(context.destination);

    const reverb = context.createConvolver();
    reverb.buffer = impulse(context, 1.4, 2.6);
    const wet = context.createGain();
    wet.gain.value = 0.22;
    reverb.connect(wet).connect(master);

    bus = { context, out: master, room: reverb };
    return bus;
  } catch {
    return null;
  }
}

/** One second of white noise, made once (paper, taps, the fly-down's air). */
export function noiseBuffer(context: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === context.sampleRate) return noise;
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noise = buffer;
  return buffer;
}

/** A smooth envelope with no clicks: a short rise, then an exponential fall to silence. */
export function envelope(
  param: AudioParam,
  at: number,
  peak: number,
  attack: number,
  length: number,
) {
  param.cancelScheduledValues(at);
  param.setValueAtTime(0.0001, at);
  param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + attack);
  param.exponentialRampToValueAtTime(0.0001, at + Math.max(length, attack + 0.01));
}
