import type { VideoSceneCue } from "./video-episodes";
import { getNarrationBeats } from "./video-narration-beats";

export type VideoSound =
  | "flyBuzz"
  | "lightRay"
  | "paper"
  | "pencil"
  | "compassPin"
  | "squareClick"
  | "hingeFold"
  | "rulerSlide"
  | "quadrantChime"
  | "mirrorGlass"
  | "stampAlert"
  | "axisGyro"
  | "portraitChime"
  | "cardFlip"
  | "resolve"
  | "whoosh"
  | "click";

interface VideoSoundCue {
  at: number;
  sound: VideoSound;
}

export const MONGE_BEATS = {
  portrait: [0.31, 0.39],
  planes: [0.36, 0.49],
  point: [0.5, 0.57],
  horizontal: [0.65, 0.73],
  vertical: [0.8, 0.88],
} as const;

export function getVideoSoundCues(episodeId: string, scenes: VideoSceneCue[]): VideoSoundCue[] {
  return scenes.flatMap((scene) => {
    const mentions = getNarrationBeats(episodeId, scene.id);
    const transition =
      scene.id === "intro" ? [] : [{ at: scene.startSec + 0.12, sound: "whoosh" as const }];
    return [
      ...transition,
      ...mentions.map((beat) => ({ at: scene.startSec + beat.at, sound: beat.sound })),
    ];
  });
}

interface Tone {
  from: number;
  to: number;
  length: number;
  level: number;
  delay?: number;
  type?: OscillatorType;
  fmFreq?: number;
  fmDepth?: number;
}

interface NoiseSpec {
  length: number;
  freqStart: number;
  freqEnd: number;
  q: number;
  level: number;
  filterType?: BiquadFilterType;
}

const tones: Record<VideoSound, Tone[]> = {
  flyBuzz: [
    { from: 205, to: 185, length: 0.2, level: 0.055, type: "triangle", fmFreq: 34, fmDepth: 28 },
    { from: 410, to: 375, length: 0.16, level: 0.025, type: "sine", delay: 0.02 },
  ],
  lightRay: [
    { from: 1175, to: 880, length: 0.18, level: 0.055, type: "sine" },
    { from: 1760, to: 1320, length: 0.15, level: 0.032, type: "sine", delay: 0.035 },
  ],
  paper: [{ from: 180, to: 112, length: 0.14, level: 0.055, type: "sine" }],
  pencil: [{ from: 720, to: 960, length: 0.09, level: 0.035, type: "triangle" }],
  compassPin: [
    { from: 980, to: 620, length: 0.055, level: 0.075, type: "triangle" },
    { from: 520, to: 494, length: 0.09, level: 0.055, delay: 0.012, type: "sine" },
  ],
  squareClick: [
    { from: 680, to: 420, length: 0.042, level: 0.065, type: "triangle" },
    { from: 860, to: 540, length: 0.048, level: 0.055, delay: 0.052, type: "triangle" },
  ],
  hingeFold: [{ from: 195, to: 390, length: 0.24, level: 0.075, type: "triangle" }],
  rulerSlide: [{ from: 320, to: 510, length: 0.14, level: 0.048, type: "sine" }],
  quadrantChime: [
    { from: 392, to: 392, length: 0.16, level: 0.065, type: "sine" },
    { from: 587.3, to: 587.3, length: 0.18, level: 0.055, delay: 0.045, type: "triangle" },
  ],
  mirrorGlass: [
    { from: 880, to: 1046.5, length: 0.16, level: 0.055, type: "sine" },
    { from: 1318.5, to: 1568, length: 0.15, level: 0.038, delay: 0.025, type: "sine" },
  ],
  stampAlert: [
    { from: 290, to: 145, length: 0.08, level: 0.085, type: "triangle" },
    { from: 220, to: 118, length: 0.12, level: 0.075, delay: 0.075, type: "triangle" },
  ],
  axisGyro: [
    { from: 340, to: 680, length: 0.15, level: 0.06, type: "sine" },
    { from: 510, to: 1020, length: 0.12, level: 0.038, delay: 0.04, type: "triangle" },
  ],
  portraitChime: [
    { from: 329.6, to: 329.6, length: 0.22, level: 0.065, type: "sine" },
    { from: 493.9, to: 493.9, length: 0.24, level: 0.055, delay: 0.065, type: "triangle" },
  ],
  cardFlip: [{ from: 460, to: 690, length: 0.085, level: 0.055, type: "sine" }],
  resolve: [
    { from: 392, to: 392, length: 0.22, level: 0.072, type: "sine" },
    { from: 493.9, to: 493.9, length: 0.22, level: 0.068, delay: 0.048, type: "sine" },
    { from: 587.3, to: 587.3, length: 0.25, level: 0.068, delay: 0.098, type: "sine" },
  ],
  whoosh: [{ from: 240, to: 430, length: 0.16, level: 0.04, type: "triangle" }],
  click: [{ from: 660, to: 350, length: 0.034, level: 0.065, type: "triangle" }],
};

const noises: Partial<Record<VideoSound, NoiseSpec>> = {
  flyBuzz: { length: 0.2, freqStart: 780, freqEnd: 520, q: 1.4, level: 0.06 },
  paper: { length: 0.14, freqStart: 1050, freqEnd: 460, q: 0.85, level: 0.11 },
  pencil: { length: 0.13, freqStart: 2700, freqEnd: 1750, q: 1.25, level: 0.085, filterType: "bandpass" },
  rulerSlide: { length: 0.15, freqStart: 920, freqEnd: 1680, q: 1.1, level: 0.075 },
  hingeFold: { length: 0.2, freqStart: 880, freqEnd: 460, q: 0.9, level: 0.07 },
  cardFlip: { length: 0.11, freqStart: 1450, freqEnd: 820, q: 0.9, level: 0.08 },
  whoosh: { length: 0.18, freqStart: 560, freqEnd: 1420, q: 0.75, level: 0.09 },
};

export function playVideoSound(ctx: AudioContext, output: AudioNode, sound: VideoSound) {
  if (ctx.state !== "running") return;
  const now = ctx.currentTime;

  for (const tone of tones[sound]) {
    const start = now + (tone.delay ?? 0);
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, tone.to), start + tone.length);

    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (tone.fmFreq && tone.fmDepth) {
      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(tone.fmFreq, start);
      lfoGain.gain.setValueAtTime(tone.fmDepth, start);
      lfo.connect(lfoGain).connect(oscillator.frequency);
      lfo.start(start);
      lfo.stop(start + tone.length + 0.02);
    }

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(tone.level, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + tone.length);
    oscillator.connect(envelope).connect(output);
    oscillator.start(start);
    oscillator.stop(start + tone.length + 0.015);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      lfo?.disconnect();
      lfoGain?.disconnect();
    };
  }

  const noise = noises[sound];
  if (noise) {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noise.length), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) {
      const fraction = index / samples.length;
      samples[index] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * fraction), 2);
    }
    const texture = ctx.createBufferSource();
    texture.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = noise.filterType ?? "bandpass";
    filter.frequency.setValueAtTime(noise.freqStart, now);
    filter.frequency.exponentialRampToValueAtTime(noise.freqEnd, now + noise.length);
    filter.Q.value = noise.q;
    const gain = ctx.createGain();
    gain.gain.value = noise.level;
    texture.connect(filter).connect(gain).connect(output);
    texture.start(now);
    texture.onended = () => {
      texture.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
}
