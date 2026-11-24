import type { VideoSceneCue } from "./video-episodes";
import { getNarrationBeats } from "./video-narration-beats";

export type VideoSound =
  | "paper"
  | "whoosh"
  | "pop"
  | "point"
  | "trace"
  | "turn"
  | "alert"
  | "sparkle"
  | "resolve"
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
    return [
      { at: scene.startSec + 0.12, sound: scene.id === "intro" ? "paper" : "whoosh" },
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
}

const tones: Record<VideoSound, Tone[]> = {
  paper: [{ from: 185, to: 115, length: 0.19, level: 0.1 }],
  whoosh: [{ from: 260, to: 520, length: 0.2, level: 0.055, type: "triangle" }],
  pop: [
    { from: 390, to: 760, length: 0.065, level: 0.12 },
    { from: 760, to: 540, length: 0.07, level: 0.085, delay: 0.055 },
  ],
  point: [
    { from: 660, to: 587, length: 0.12, level: 0.105 },
    { from: 1320, to: 1174, length: 0.08, level: 0.045 },
  ],
  trace: [{ from: 560, to: 840, length: 0.16, level: 0.065, type: "triangle" }],
  turn: [{ from: 210, to: 430, length: 0.25, level: 0.095, type: "triangle" }],
  alert: [
    { from: 523, to: 500, length: 0.08, level: 0.095, type: "triangle" },
    { from: 392, to: 370, length: 0.13, level: 0.09, delay: 0.085, type: "triangle" },
  ],
  sparkle: [
    { from: 587, to: 587, length: 0.13, level: 0.085 },
    { from: 740, to: 740, length: 0.13, level: 0.085, delay: 0.055 },
    { from: 880, to: 880, length: 0.14, level: 0.085, delay: 0.11 },
  ],
  resolve: [
    { from: 392, to: 392, length: 0.22, level: 0.09 },
    { from: 523, to: 523, length: 0.22, level: 0.09, delay: 0.05 },
    { from: 659, to: 659, length: 0.24, level: 0.09, delay: 0.105 },
  ],
  click: [{ from: 680, to: 360, length: 0.036, level: 0.075, type: "triangle" }],
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
    oscillator.frequency.exponentialRampToValueAtTime(tone.to, start + tone.length);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(tone.level, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + tone.length);
    oscillator.connect(envelope).connect(output);
    oscillator.start(start);
    oscillator.stop(start + tone.length + 0.015);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  if (sound === "paper" || sound === "whoosh" || sound === "trace" || sound === "turn") {
    const length =
      sound === "whoosh" || sound === "turn"
        ? 0.22
        : sound === "trace"
          ? 0.17
          : 0.15;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) {
      const fraction = index / samples.length;
      samples[index] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * fraction), 2);
    }
    const texture = ctx.createBufferSource();
    texture.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";

    if (sound === "whoosh") {
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1750, now + length * 0.45);
      filter.frequency.exponentialRampToValueAtTime(650, now + length);
    } else if (sound === "trace") {
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + length);
    } else if (sound === "turn") {
      filter.frequency.setValueAtTime(1100, now);
      filter.frequency.exponentialRampToValueAtTime(540, now + length);
    } else {
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(480, now + length);
    }

    filter.Q.value = sound === "whoosh" ? 0.75 : 0.85;
    const gain = ctx.createGain();
    gain.gain.value =
      sound === "paper"
        ? 0.145
        : sound === "whoosh"
          ? 0.13
          : sound === "trace"
            ? 0.1
            : 0.09;
    texture.connect(filter).connect(gain).connect(output);
    texture.start(now);
    texture.onended = () => {
      texture.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
}
