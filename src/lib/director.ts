export type SpotlightTarget =
  | "none"
  | "lt"
  | "abscissa"
  | "afastamento"
  | "cota"
  | "point_space"
  | "origin"
  | "coincident"
  | "line";

export interface LabSpotlight {
  target: SpotlightTarget;
  pointLabel?: string;
  caption: string;
  professor?: "monge" | "epura";
}

export interface TutorDirectorCommand {
  presetId?: string;
  points?: Array<{ label: string; x: number; y: number; z: number }>;
  connectLine?: boolean;
  foldAngle?: number;
  cameraPreset?: "iso" | "profile" | "front" | "top";
  showBisectors?: boolean;
  showXYZ?: boolean;
  spotlight?: LabSpotlight;
}

export interface TutorApiResponse {
  answer: string;
  professor: "monge" | "epura";
  source: string;
  director?: TutorDirectorCommand;
}
