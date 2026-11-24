import type { VideoSound } from "./video-effects";

export type BeatVisualFx =
  | "wings"
  | "sunbeam"
  | "draftingCrosshair"
  | "rightAngleBracket"
  | "hingeArc"
  | "rulerMeasure"
  | "mirrorSweep"
  | "stampAlert"
  | "axisTriad"
  | "cardSheen"
  | "quadrantWave";

export interface NarrationBeat {
  target: string;
  at: number;
  sound: VideoSound;
  fx?: BeatVisualFx;
  mark?: [x: number, y: number];
}

// Seconds relative to each scene, measured from the recorded narration across all 7 episodes.
const tracks: Record<string, Record<string, NarrationBeat[]>> = {
  "ep01-monge": {
    "intro": [
      { target: "3d", at: 11.62, sound: "axisGyro", fx: "axisTriad", mark: [280, 184] },
      { target: "paper", at: 13.34, sound: "paper", fx: "cardSheen", mark: [238, 248] },
    ],
    "ambiguous-shadow": [
      { target: "fly", at: 1.01, sound: "flyBuzz", fx: "wings", mark: [445, 204] },
      { target: "rays", at: 6.5, sound: "lightRay", fx: "sunbeam", mark: [445, 162] },
      { target: "shadow", at: 8.8, sound: "lightRay", fx: "sunbeam", mark: [445, 292] },
      { target: "lowFly", at: 15.71, sound: "flyBuzz", fx: "wings", mark: [360, 218] },
      { target: "highFly", at: 18.75, sound: "flyBuzz", fx: "wings", mark: [360, 112] },
      { target: "sameShadow", at: 22.81, sound: "stampAlert", fx: "stampAlert", mark: [360, 288] },
    ],
    "two-planes": [
      { target: "monge", at: 2.09, sound: "portraitChime", fx: "cardSheen" },
      { target: "planes", at: 7.95, sound: "squareClick", fx: "rightAngleBracket" },
      { target: "floor", at: 9.49, sound: "rulerSlide", fx: "rulerMeasure" },
      { target: "angle", at: 11.4, sound: "squareClick", fx: "rightAngleBracket", mark: [510, 239] },
      { target: "point", at: 18.42, sound: "compassPin", fx: "draftingCrosshair", mark: [333, 166] },
      { target: "horizontal", at: 21.45, sound: "rulerSlide", fx: "draftingCrosshair", mark: [333, 282] },
      { target: "vertical", at: 25.25, sound: "resolve", fx: "draftingCrosshair", mark: [424, 140] },
    ],
    "lt-and-notation": [
      { target: "groundLine", at: 4.54, sound: "pencil", fx: "rulerMeasure", mark: [360, 142] },
      { target: "spaceNotation", at: 14.99, sound: "cardFlip", fx: "cardSheen", mark: [175, 270] },
      { target: "horizontalNotation", at: 17.93, sound: "cardFlip", fx: "cardSheen", mark: [357, 270] },
      { target: "verticalNotation", at: 23.76, sound: "cardFlip", fx: "cardSheen", mark: [539, 270] },
    ],
    "takeaway": [
      { target: "pair", at: 0.58, sound: "resolve", fx: "quadrantWave", mark: [363, 211] },
      { target: "projA", at: 3.9, sound: "compassPin", fx: "draftingCrosshair", mark: [255, 252] },
      { target: "projA2", at: 8.86, sound: "compassPin", fx: "draftingCrosshair", mark: [465, 252] },
      { target: "unique", at: 11.76, sound: "resolve", fx: "cardSheen", mark: [363, 294] },
    ],
  },
  "ep02-coordenadas": {
    "intro": [
      { target: "coord2", at: 9.12, sound: "compassPin", fx: "draftingCrosshair" },
      { target: "coord5", at: 10.82, sound: "compassPin", fx: "draftingCrosshair" },
      { target: "coord3", at: 11.86, sound: "compassPin", fx: "draftingCrosshair" },
      { target: "abscissa", at: 21.09, sound: "cardFlip", fx: "cardSheen", mark: [174, 263] },
      { target: "afastamento", at: 22.17, sound: "cardFlip", fx: "cardSheen", mark: [360, 263] },
      { target: "cota", at: 23.57, sound: "cardFlip", fx: "cardSheen", mark: [546, 263] },
    ],
    "abscissa": [
      { target: "origin", at: 10.15, sound: "compassPin", fx: "draftingCrosshair", mark: [360, 215] },
      { target: "positive", at: 13.28, sound: "pencil", fx: "rulerMeasure", mark: [496, 215] },
      { target: "negative", at: 18.22, sound: "pencil", fx: "rulerMeasure", mark: [224, 215] },
      { target: "callLine", at: 21.01, sound: "pencil", fx: "rightAngleBracket", mark: [496, 151] },
    ],
    "afastamento": [
      { target: "wall", at: 7.79, sound: "rulerSlide", fx: "rulerMeasure", mark: [216, 178] },
      { target: "plus5", at: 11.95, sound: "rulerSlide", fx: "rulerMeasure", mark: [350, 172] },
      { target: "horizontal", at: 22.38, sound: "resolve", fx: "draftingCrosshair", mark: [463, 270] },
    ],
    "cota": [
      { target: "altitude", at: 4.07, sound: "rulerSlide", fx: "rulerMeasure", mark: [410, 180] },
      { target: "plus3", at: 10.79, sound: "compassPin", fx: "draftingCrosshair", mark: [410, 134] },
      { target: "vertical", at: 20.37, sound: "resolve", fx: "draftingCrosshair", mark: [250, 134] },
    ],
    "trap-y": [
      { target: "trap", at: 4.0, sound: "stampAlert", fx: "stampAlert", mark: [360, 74] },
      { target: "fold", at: 13.95, sound: "hingeFold", fx: "hingeArc", mark: [360, 215] },
      { target: "goUp", at: 16.58, sound: "cardFlip", fx: "rulerMeasure", mark: [360, 127] },
      { target: "goDown", at: 22.2, sound: "stampAlert", fx: "stampAlert", mark: [360, 340] },
      { target: "recapUp", at: 28.27, sound: "cardFlip", fx: "rulerMeasure", mark: [360, 127] },
      { target: "recapDown", at: 29.91, sound: "resolve", fx: "quadrantWave", mark: [360, 340] },
    ],
  },
  "ep03-diedros": {
    "intro": [
      { target: "four", at: 2.13, sound: "quadrantChime", fx: "quadrantWave", mark: [360, 230] },
      { target: "cross", at: 7.13, sound: "squareClick", fx: "rightAngleBracket", mark: [360, 230] },
      { target: "turn", at: 19.31, sound: "hingeFold", fx: "hingeArc", mark: [265, 230] },
    ],
    "d1": [
      { target: "first", at: 2.74, sound: "quadrantChime", fx: "quadrantWave", mark: [333, 128] },
      { target: "vertical", at: 17.94, sound: "compassPin", fx: "draftingCrosshair", mark: [505, 142] },
      { target: "horizontal", at: 21.9, sound: "compassPin", fx: "draftingCrosshair", mark: [505, 262] },
    ],
    "d2": [
      { target: "second", at: 2.46, sound: "quadrantChime", fx: "quadrantWave", mark: [157, 128] },
      { target: "vertical", at: 12.3, sound: "compassPin", fx: "draftingCrosshair", mark: [505, 132] },
      { target: "horizontal", at: 18.0, sound: "compassPin", fx: "draftingCrosshair", mark: [505, 166] },
      { target: "pair", at: 22.74, sound: "resolve", fx: "quadrantWave", mark: [505, 149] },
    ],
    "d3": [
      { target: "third", at: 3.32, sound: "quadrantChime", fx: "quadrantWave", mark: [157, 272] },
      { target: "horizontal", at: 15.34, sound: "compassPin", fx: "draftingCrosshair", mark: [505, 138] },
      { target: "vertical", at: 19.18, sound: "compassPin", fx: "draftingCrosshair", mark: [505, 258] },
    ],
    "d4-rule": [
      { target: "fourth", at: 0.97, sound: "quadrantChime", fx: "quadrantWave", mark: [333, 272] },
      { target: "bothDown", at: 10.2, sound: "compassPin", fx: "draftingCrosshair", mark: [505, 253] },
      { target: "pair", at: 17.62, sound: "resolve", fx: "quadrantWave", mark: [371, 362] },
      { target: "even", at: 23.35, sound: "quadrantChime", fx: "quadrantWave", mark: [371, 362] },
    ],
  },
  "ep04-rebatimento": {
    "intro": [
      { target: "planes", at: 9.75, sound: "squareClick", fx: "rightAngleBracket" },
      { target: "square", at: 13.53, sound: "squareClick", fx: "rightAngleBracket", mark: [340, 225] },
      { target: "monge", at: 19.15, sound: "portraitChime", fx: "cardSheen" },
    ],
    "hinge": [
      { target: "wallFixed", at: 3.33, sound: "rulerSlide", fx: "rulerMeasure" },
      { target: "hinge", at: 8.69, sound: "hingeFold", fx: "hingeArc", mark: [340, 225] },
      { target: "turn", at: 10.1, sound: "hingeFold", fx: "hingeArc", mark: [436, 225] },
    ],
    "front-down": [
      { target: "front", at: 6.91, sound: "hingeFold", fx: "hingeArc" },
      { target: "lands", at: 19.7, sound: "resolve", fx: "draftingCrosshair", mark: [340, 321] },
    ],
    "back-up": [
      { target: "back", at: 5.46, sound: "hingeFold", fx: "hingeArc" },
      { target: "lands", at: 16.23, sound: "resolve", fx: "draftingCrosshair", mark: [340, 129] },
    ],
    "chamada": [
      { target: "projA", at: 15.3, sound: "compassPin", fx: "draftingCrosshair", mark: [360, 326] },
      { target: "projA2", at: 16.7, sound: "compassPin", fx: "draftingCrosshair", mark: [360, 128] },
      { target: "callLine", at: 24.43, sound: "resolve", fx: "rightAngleBracket", mark: [360, 220] },
    ],
  },
  "ep05-bissetores": {
    "intro": [
      { target: "zero", at: 11.28, sound: "cardFlip", fx: "cardSheen", mark: [200, 273] },
      { target: "sameSize", at: 14.87, sound: "mirrorGlass", fx: "mirrorSweep", mark: [360, 196] },
    ],
    "zero-cota": [
      { target: "zeroCota", at: 4.39, sound: "rulerSlide", fx: "draftingCrosshair", mark: [210, 220] },
      { target: "zeroAfast", at: 14.93, sound: "rulerSlide", fx: "draftingCrosshair", mark: [510, 220] },
      { target: "zeroBoth", at: 23.24, sound: "resolve", fx: "quadrantWave", mark: [360, 220] },
    ],
    "bisectors-intro": [
      { target: "bisector", at: 2.67, sound: "mirrorGlass", fx: "mirrorSweep", mark: [255, 214] },
      { target: "angle", at: 7.05, sound: "squareClick", fx: "rightAngleBracket", mark: [318, 151] },
    ],
    "b13": [
      { target: "b13", at: 0.37, sound: "mirrorGlass", fx: "mirrorSweep", mark: [321, 148] },
      { target: "symmetry", at: 19.75, sound: "resolve", fx: "mirrorSweep", mark: [542, 214] },
    ],
    "b24": [
      { target: "b24", at: 1.62, sound: "mirrorGlass", fx: "mirrorSweep", mark: [193, 152] },
      { target: "coincident", at: 24.98, sound: "resolve", fx: "mirrorSweep", mark: [542, 150] },
    ],
  },
  "ep06-uerj": {
    "intro": [
      { target: "practice", at: 3.28, sound: "paper", fx: "cardSheen", mark: [360, 269] },
    ],
    "ex1-points": [
      { target: "pointA", at: 3.22, sound: "compassPin", fx: "draftingCrosshair", mark: [480, 148] },
      { target: "pointB", at: 9.75, sound: "compassPin", fx: "draftingCrosshair", mark: [220, 288] },
      { target: "symmetric", at: 27.23, sound: "mirrorGlass", fx: "mirrorSweep", mark: [350, 218] },
    ],
    "ex1-line": [
      { target: "origin", at: 8.23, sound: "resolve", fx: "quadrantWave", mark: [350, 218] },
      { target: "crossZero", at: 35.15, sound: "resolve", fx: "mirrorSweep", mark: [350, 218] },
    ],
    "ex2-points": [
      { target: "pointA", at: 3.95, sound: "compassPin", fx: "draftingCrosshair", mark: [300, 162] },
      { target: "pointB", at: 6.18, sound: "compassPin", fx: "draftingCrosshair", mark: [380, 135] },
      { target: "pointC", at: 8.4, sound: "compassPin", fx: "draftingCrosshair", mark: [460, 108] },
    ],
    "ex2-collinear": [
      { target: "noTriangle", at: 5.16, sound: "stampAlert", fx: "stampAlert", mark: [188, 136] },
      { target: "collinear", at: 8.7, sound: "resolve", fx: "rulerMeasure", mark: [380, 135] },
      { target: "parallel", at: 32.42, sound: "mirrorGlass", fx: "mirrorSweep", mark: [188, 154] },
    ],
  },
  "ep07-yup-zup": {
    "intro": [
      { target: "yUp", at: 10.73, sound: "axisGyro", fx: "axisTriad", mark: [207, 214] },
      { target: "zUp", at: 19.67, sound: "axisGyro", fx: "axisTriad", mark: [509, 214] },
    ],
    "cg-origin": [
      { target: "axisY", at: 9.8, sound: "axisGyro", fx: "axisTriad", mark: [128, 190] },
      { target: "axisZ", at: 18.52, sound: "axisGyro", fx: "axisTriad", mark: [82, 352] },
    ],
    "gd-origin": [
      { target: "floorXY", at: 8.31, sound: "pencil", fx: "rulerMeasure", mark: [215, 290] },
      { target: "axisZ", at: 18.15, sound: "axisGyro", fx: "axisTriad", mark: [112, 130] },
      { target: "cota", at: 18.95, sound: "rulerSlide", fx: "axisTriad", mark: [112, 167] },
    ],
    "translator": [
      { target: "swap", at: 8.22, sound: "axisGyro", fx: "axisTriad", mark: [360, 232] },
      { target: "result", at: 25.7, sound: "resolve", fx: "quadrantWave", mark: [360, 292] },
    ],
  },
};

export function getNarrationBeats(episodeId: string, sceneId: string): NarrationBeat[] {
  return tracks[episodeId]?.[sceneId] ?? [];
}
