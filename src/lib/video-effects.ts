import type { VideoSceneCue } from "./video-episodes";
import { getNarrationBeats } from "./video-narration-beats";

export type VideoSound = "paper" | "trace" | "point" | "turn" | "resolve" | "click";

interface VideoSoundCue {
  at: number;
  sound: VideoSound;
}

export const MONGE_BEATS = {
  portrait: [0.31, 0.39],
  planes: [0.36, 0.49],
  point: [0.50, 0.57],
  horizontal: [0.65, 0.73],
  vertical: [0.80, 0.88],
} as const;

export function getVideoSoundCues(episodeId: string, scenes: VideoSceneCue[]): VideoSoundCue[] {
  return scenes.flatMap((scene) => {
    const mentions = getNarrationBeats(episodeId, scene.id);
    return [
      { at: scene.startSec + 0.15, sound: scene.id === "intro" ? "paper" : "click" },
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
  paper: [{ from: 168, to: 110, length: 0.19, level: 0.055 }],
  trace: [{ from: 520, to: 760, length: 0.15, level: 0.019, type: "triangle" }],
  point: [{ from: 780, to: 520, length: 0.105, level: 0.042 }],
  turn: [{ from: 200, to: 410, length: 0.24, level: 0.028, type: "triangle" }],
  resolve: [
    { from: 392, to: 392, length: 0.19, level: 0.028 },
    { from: 659, to: 659, length: 0.24, level: 0.023, delay: 0.075 },
  ],
  click: [{ from: 630, to: 325, length: 0.034, level: 0.035, type: "triangle" }],
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

  if (sound === "paper" || sound === "trace" || sound === "turn") {
    const length = sound === "turn" ? 0.22 : 0.15;
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
    filter.frequency.setValueAtTime(sound === "trace" ? 2100 : 1050, now);
    filter.frequency.exponentialRampToValueAtTime(sound === "trace" ? 1250 : 520, now + length);
    filter.Q.value = 0.85;
    const gain = ctx.createGain();
    gain.gain.value = sound === "paper" ? 0.095 : 0.045;
    texture.connect(filter).connect(gain).connect(output);
    texture.start(now);
    texture.onended = () => {
      texture.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
}
