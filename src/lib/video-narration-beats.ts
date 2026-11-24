import type { VideoSound } from "./video-effects";

export interface NarrationBeat {
  target: string;
  at: number;
  sound: VideoSound;
  mark?: [x: number, y: number];
}

// Seconds relative to each scene, measured from the recorded narration.
const tracks: Record<string, Record<string, NarrationBeat[]>> = {
  "ep01-monge": {
    "intro": [
      { target: "paper", at: 13.34, sound: "paper", mark: [238, 250] },
    ],
    "ambiguous-shadow": [
      { target: "fly", at: 1.01, sound: "point" },
      { target: "shadow", at: 8.8, sound: "trace", mark: [435, 288] },
      { target: "lowFly", at: 15.71, sound: "point" },
      { target: "highFly", at: 18.75, sound: "point" },
      { target: "sameShadow", at: 22.81, sound: "resolve", mark: [360, 288] },
    ],
    "two-planes": [
      { target: "planes", at: 7.95, sound: "turn" },
      { target: "floor", at: 9.49, sound: "trace" },
      { target: "angle", at: 11.4, sound: "point", mark: [510, 239] },
      { target: "point", at: 18.42, sound: "point" },
      { target: "horizontal", at: 21.45, sound: "trace" },
      { target: "vertical", at: 25.25, sound: "resolve" },
    ],
    "lt-and-notation": [
      { target: "groundLine", at: 4.54, sound: "trace", mark: [360, 142] },
      { target: "spaceNotation", at: 14.99, sound: "point", mark: [175, 233] },
      { target: "horizontalNotation", at: 17.93, sound: "point", mark: [357, 233] },
      { target: "verticalNotation", at: 23.76, sound: "point", mark: [539, 233] },
    ],
    "takeaway": [
      { target: "pair", at: 0.58, sound: "resolve", mark: [363, 226] },
    ],
  },
  "ep02-coordenadas": {
    "intro": [
      { target: "abscissa", at: 21.09, sound: "point", mark: [170, 263] },
      { target: "afastamento", at: 22.17, sound: "point", mark: [360, 263] },
      { target: "cota", at: 23.57, sound: "point", mark: [550, 263] },
    ],
    "abscissa": [
      { target: "origin", at: 10.15, sound: "point", mark: [360, 215] },
      { target: "positive", at: 13.28, sound: "trace", mark: [496, 215] },
      { target: "callLine", at: 21.01, sound: "trace", mark: [496, 151] },
    ],
    "afastamento": [
      { target: "wall", at: 7.79, sound: "trace", mark: [204, 185] },
      { target: "horizontal", at: 22.38, sound: "point", mark: [463, 255] },
    ],
    "cota": [
      { target: "altitude", at: 4.07, sound: "trace", mark: [410, 170] },
      { target: "vertical", at: 20.37, sound: "point", mark: [250, 135] },
    ],
    "trap-y": [
      { target: "goUp", at: 16.58, sound: "point", mark: [360, 127] },
      { target: "goDown", at: 22.2, sound: "point", mark: [360, 340] },
    ],
  },
  "ep03-diedros": {
    "intro": [
      { target: "four", at: 2.13, sound: "point", mark: [360, 230] },
      { target: "turn", at: 19.31, sound: "turn", mark: [265, 230] },
    ],
    "d1": [
      { target: "first", at: 2.74, sound: "point", mark: [333, 128] },
      { target: "vertical", at: 17.94, sound: "point", mark: [505, 142] },
      { target: "horizontal", at: 21.9, sound: "point", mark: [505, 262] },
    ],
    "d2": [
      { target: "second", at: 2.46, sound: "point", mark: [157, 128] },
      { target: "pair", at: 22.74, sound: "resolve", mark: [505, 149] },
    ],
    "d3": [
      { target: "third", at: 3.32, sound: "point", mark: [157, 272] },
      { target: "vertical", at: 19.18, sound: "point", mark: [505, 258] },
    ],
    "d4-rule": [
      { target: "fourth", at: 0.97, sound: "point", mark: [333, 272] },
      { target: "pair", at: 17.62, sound: "resolve", mark: [371, 344] },
    ],
  },
  "ep04-rebatimento": {
    "intro": [
      { target: "square", at: 13.53, sound: "point", mark: [340, 225] },
    ],
    "hinge": [
      { target: "hinge", at: 8.69, sound: "point", mark: [340, 225] },
      { target: "turn", at: 10.1, sound: "turn", mark: [436, 225] },
    ],
    "front-down": [
      { target: "front", at: 6.91, sound: "trace" },
      { target: "lands", at: 19.7, sound: "point", mark: [340, 321] },
    ],
    "back-up": [
      { target: "back", at: 5.46, sound: "trace" },
      { target: "lands", at: 16.23, sound: "point", mark: [340, 129] },
    ],
    "chamada": [
      { target: "callLine", at: 24.43, sound: "resolve", mark: [360, 220] },
    ],
  },
  "ep05-bissetores": {
    "intro": [
      { target: "zero", at: 11.28, sound: "point", mark: [200, 273] },
    ],
    "zero-cota": [
      { target: "zeroCota", at: 4.39, sound: "point", mark: [210, 220] },
      { target: "zeroAfast", at: 14.93, sound: "point", mark: [510, 220] },
      { target: "zeroBoth", at: 23.24, sound: "resolve", mark: [360, 220] },
    ],
    "bisectors-intro": [
      { target: "bisector", at: 2.67, sound: "trace", mark: [255, 214] },
      { target: "angle", at: 7.05, sound: "point", mark: [318, 151] },
    ],
    "b13": [
      { target: "b13", at: 0.37, sound: "trace", mark: [321, 148] },
      { target: "symmetry", at: 19.75, sound: "resolve", mark: [542, 214] },
    ],
    "b24": [
      { target: "b24", at: 1.62, sound: "trace", mark: [193, 152] },
      { target: "coincident", at: 24.98, sound: "resolve", mark: [542, 150] },
    ],
  },
  "ep06-uerj": {
    "intro": [
      { target: "practice", at: 3.28, sound: "paper", mark: [360, 269] },
    ],
    "ex1-points": [
      { target: "pointA", at: 3.22, sound: "point", mark: [480, 148] },
      { target: "pointB", at: 9.75, sound: "point", mark: [220, 288] },
    ],
    "ex1-line": [
      { target: "origin", at: 8.23, sound: "resolve", mark: [350, 218] },
    ],
    "ex2-points": [
      { target: "pointA", at: 3.95, sound: "point", mark: [300, 162] },
      { target: "pointB", at: 6.18, sound: "point", mark: [380, 135] },
      { target: "pointC", at: 8.4, sound: "point", mark: [460, 108] },
    ],
    "ex2-collinear": [
      { target: "collinear", at: 8.7, sound: "resolve", mark: [380, 135] },
      { target: "parallel", at: 32.42, sound: "trace", mark: [188, 168] },
    ],
  },
  "ep07-yup-zup": {
    "intro": [
      { target: "yUp", at: 10.73, sound: "point", mark: [204, 205] },
      { target: "zUp", at: 19.67, sound: "point", mark: [509, 205] },
    ],
    "cg-origin": [
      { target: "axisY", at: 9.8, sound: "point", mark: [128, 190] },
      { target: "axisZ", at: 18.52, sound: "turn", mark: [82, 352] },
    ],
    "gd-origin": [
      { target: "axisZ", at: 18.15, sound: "point", mark: [112, 130] },
      { target: "cota", at: 18.95, sound: "trace", mark: [112, 167] },
    ],
    "translator": [
      { target: "swap", at: 8.22, sound: "turn", mark: [360, 245] },
      { target: "result", at: 25.7, sound: "resolve", mark: [360, 321] },
    ],
  },
};

export function getNarrationBeats(episodeId: string, sceneId: string): NarrationBeat[] {
  return tracks[episodeId]?.[sceneId] ?? [];
}
