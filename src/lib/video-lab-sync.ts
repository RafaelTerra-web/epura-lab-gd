import type { LabSpotlight } from "./director";
import type { GDPoint, GDSegment } from "./gd-math";

export interface LabLaunchPayload {
  points: GDPoint[];
  segments: GDSegment[];
  foldAngle: number;
  showBisectors?: boolean;
  showXYZ?: boolean;
  cameraPreset?: "iso" | "profile" | "front" | "top";
  spotlight?: LabSpotlight | null;
}

export interface VideoPointExample {
  id: string;
  sceneId: string;
  minSceneSec?: number;
  maxSceneSec?: number;
  chipLabel: string;
  coordsLabel: string;
  payload: LabLaunchPayload;
}

const COLORS = {
  A: "#1E56A0",
  B: "#0F766E",
  C: "#C94032",
  D: "#B45309",
} as const;

const pt = (
  id: string,
  label: string,
  x: number,
  y: number,
  z: number,
  color: string
): GDPoint => ({ id, label, x, y, z, color });

export const VIDEO_POINT_EXAMPLES: Record<string, VideoPointExample[]> = {
  "ep01-monge": [
    {
      id: "ep01-fly-space",
      sceneId: "ambiguous-shadow",
      minSceneSec: 0,
      maxSceneSec: 10.5,
      chipLabel: "Mosca (A) no 3D",
      coordsLabel: "(A)(0; +2; +2)",
      payload: {
        points: [pt("fly-a", "A", 0, 2, 2, COLORS.A)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: false,
        cameraPreset: "iso",
        spotlight: {
          target: "point_space",
          pointLabel: "A",
          caption: "Mosca (A) no espaço 3D · sombra vertical no chão π",
          professor: "monge",
        },
      },
    },
    {
      id: "ep01-fly-ambiguity",
      sceneId: "ambiguous-shadow",
      minSceneSec: 10.5,
      chipLabel: "Mosca 1m vs 3m",
      coordsLabel: "A(0;+2;+1) · B(0;+2;+3)",
      payload: {
        points: [
          pt("fly-1m", "A", 0, 2, 1, COLORS.C),
          pt("fly-3m", "B", 0, 2, 3, COLORS.D),
        ],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "cota",
          pointLabel: "B",
          caption: "Alturas 1m e 3m produzem exatamente a mesma sombra A = B em π!",
          professor: "monge",
        },
      },
    },
    {
      id: "ep01-monge-pair",
      sceneId: "two-planes",
      chipLabel: "Ponto (A) nos 2 Planos",
      coordsLabel: "(A)(+1; +4; +3)",
      payload: {
        points: [pt("m1", "A", 1, 4, 3, COLORS.A)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: false,
        cameraPreset: "iso",
        spotlight: {
          target: "point_space",
          pointLabel: "A",
          caption: "1 ponto (A) ⇄ 2 projeções ortogonais (A em π e A' em π')",
          professor: "monge",
        },
      },
    },
  ],
  "ep02-coordenadas": [
    {
      id: "ep02-point-pos",
      sceneId: "intro",
      chipLabel: "Exemplo (A)(+2; +5; +3)",
      coordsLabel: "(A)(+2; +5; +3)",
      payload: {
        points: [pt("c1", "A", 2, 5, 3, COLORS.A)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "point_space",
          pointLabel: "A",
          caption: "X=+2 (Abscissa) · Y=+5 (Afastamento) · Z=+3 (Cota)",
          professor: "monge",
        },
      },
    },
    {
      id: "ep02-absc-neg",
      sceneId: "abscissa",
      minSceneSec: 17,
      chipLabel: "Abscissa Negativa (X=−2)",
      coordsLabel: "(A)(−2; +5; +3)",
      payload: {
        points: [pt("c-neg", "A", -2, 5, 3, COLORS.A)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "abscissa",
          pointLabel: "A",
          caption: "Abscissa negativa (−2) desloca 2 unidades à esquerda na LT",
          professor: "monge",
        },
      },
    },
    {
      id: "ep02-trap-epura",
      sceneId: "trap-y",
      chipLabel: "Pegadinha +Y na Épura",
      coordsLabel: "(A)(+2; +5; +3) · 90°",
      payload: {
        points: [pt("c1", "A", 2, 5, 3, COLORS.A)],
        segments: [],
        foldAngle: 90,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "front",
        spotlight: {
          target: "afastamento",
          pointLabel: "A",
          caption: "Na Épura 2D: Cota +3 sobe para A' e Afastamento +5 desce para A",
          professor: "monge",
        },
      },
    },
  ],
  "ep03-diedros": [
    {
      id: "ep03-d1",
      sceneId: "d1",
      chipLabel: "1º Diedro (+ ; +)",
      coordsLabel: "(A)(0; +3; +4)",
      payload: {
        points: [pt("d1", "A", 0, 3, 4, COLORS.A)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "point_space",
          pointLabel: "A",
          caption: "1º Diedro (+;+): à frente de π' e acima de π",
          professor: "monge",
        },
      },
    },
    {
      id: "ep03-d2",
      sceneId: "d2",
      chipLabel: "2º Diedro (− ; +)",
      coordsLabel: "(B)(0; −3; +4)",
      payload: {
        points: [pt("d2", "B", 0, -3, 4, COLORS.B)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "point_space",
          pointLabel: "B",
          caption: "2º Diedro (−;+): atrás de π' e acima de π (ambas sobem!)",
          professor: "monge",
        },
      },
    },
    {
      id: "ep03-d3",
      sceneId: "d3",
      chipLabel: "3º Diedro (− ; −)",
      coordsLabel: "(C)(0; −3; −4)",
      payload: {
        points: [pt("d3", "C", 0, -3, -4, COLORS.C)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "point_space",
          pointLabel: "C",
          caption: "3º Diedro (−;−): atrás de π' e abaixo de π (espelho do 1º)",
          professor: "monge",
        },
      },
    },
    {
      id: "ep03-d4",
      sceneId: "d4-rule",
      minSceneSec: 0,
      maxSceneSec: 16.5,
      chipLabel: "4º Diedro (+ ; −)",
      coordsLabel: "(D)(0; +3; −4)",
      payload: {
        points: [pt("d4", "D", 0, 3, -4, COLORS.D)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "point_space",
          pointLabel: "D",
          caption: "4º Diedro (+;−): à frente de π' e abaixo de π (ambas descem!)",
          professor: "monge",
        },
      },
    },
    {
      id: "ep03-all",
      sceneId: "intro",
      chipLabel: "Todos os 4 Diedros",
      coordsLabel: "A(1º) · B(2º) · C(3º) · D(4º)",
      payload: {
        points: [
          pt("d1", "A", -3, 3, 4, COLORS.A),
          pt("d2", "B", -1, -3, 4, COLORS.B),
          pt("d3", "C", 1, -3, -4, COLORS.C),
          pt("d4", "D", 3, 3, -4, COLORS.D),
        ],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "lt",
          caption: "Regra: Ímpares (1º,3º) lados opostos · Pares (2º,4º) mesmo lado",
          professor: "monge",
        },
      },
    },
  ],
  "ep04-rebatimento": [
    {
      id: "ep04-3d",
      sceneId: "intro",
      chipLabel: "Planos a 90° em 3D",
      coordsLabel: "A(−2;+4;+3) · B(+2;−3;+4)",
      payload: {
        points: [
          pt("r1", "A", -2, 4, 3, COLORS.A),
          pt("r2", "B", 2, -3, 4, COLORS.B),
        ],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "lt",
          caption: "LT funciona como dobradiça para girar o plano π em 90°",
          professor: "monge",
        },
      },
    },
    {
      id: "ep04-front",
      sceneId: "front-down",
      chipLabel: "Piso Frontal πA Desce (+Y)",
      coordsLabel: "(A)(−2; +4; +3) · 90°",
      payload: {
        points: [pt("r1", "A", -2, 4, 3, COLORS.A)],
        segments: [],
        foldAngle: 90,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "afastamento",
          pointLabel: "A",
          caption: "Piso anterior (+Y=+4) gira 90° para BAIXO da LT",
          professor: "monge",
        },
      },
    },
    {
      id: "ep04-back",
      sceneId: "back-up",
      chipLabel: "Piso Traseiro πP Sobe (−Y)",
      coordsLabel: "(B)(+2; −3; +4) · 90°",
      payload: {
        points: [pt("r2", "B", 2, -3, 4, COLORS.B)],
        segments: [],
        foldAngle: 90,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "afastamento",
          pointLabel: "B",
          caption: "Piso posterior (−Y=−3) gira 90° para CIMA da LT",
          professor: "monge",
        },
      },
    },
    {
      id: "ep04-chamada",
      sceneId: "chamada",
      chipLabel: "Épura com Linha de Chamada",
      coordsLabel: "A(−2;+4;+3) · B(+2;−3;+4) · 90°",
      payload: {
        points: [
          pt("r1", "A", -2, 4, 3, COLORS.A),
          pt("r2", "B", 2, -3, 4, COLORS.B),
        ],
        segments: [],
        foldAngle: 90,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "front",
        spotlight: {
          target: "abscissa",
          pointLabel: "A",
          caption: "A e A' alinham sempre na mesma perpendicular à LT",
          professor: "monge",
        },
      },
    },
  ],
  "ep05-bissetores": [
    {
      id: "ep05-zero-cota",
      sceneId: "zero-cota",
      minSceneSec: 0,
      maxSceneSec: 12.5,
      chipLabel: "Cota = 0 (no chão π)",
      coordsLabel: "(A)(−2; +3; 0)",
      payload: {
        points: [pt("zc", "A", -2, 3, 0, COLORS.A)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "lt",
          pointLabel: "A",
          caption: "Cota = 0 → ponto apoiado no chão π e projeção A' cai na LT",
          professor: "monge",
        },
      },
    },
    {
      id: "ep05-zero-afast",
      sceneId: "zero-cota",
      minSceneSec: 12.5,
      maxSceneSec: 21,
      chipLabel: "Afast. = 0 (na parede π')",
      coordsLabel: "(C)(+2; 0; +3)",
      payload: {
        points: [pt("za", "C", 2, 0, 3, COLORS.C)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "lt",
          pointLabel: "C",
          caption: "Afastamento = 0 → ponto colado em π' e projeção C cai na LT",
          professor: "monge",
        },
      },
    },
    {
      id: "ep05-zero-all",
      sceneId: "zero-cota",
      minSceneSec: 21,
      chipLabel: "Cota=0, Afast=0 e LT (0;0)",
      coordsLabel: "A(−2;+3;0) · O(0;0;0) · C(+2;0;+3)",
      payload: {
        points: [
          pt("zc", "A", -2, 3, 0, COLORS.A),
          pt("z0", "O", 0, 0, 0, COLORS.D),
          pt("za", "C", 2, 0, 3, COLORS.C),
        ],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "origin",
          pointLabel: "O",
          caption: "Coordenadas zero apoiam o ponto em π, em π' ou na própria LT",
          professor: "monge",
        },
      },
    },
    {
      id: "ep05-b13",
      sceneId: "b13",
      chipLabel: "1º Bissetor β₁₃ (+3; +3)",
      coordsLabel: "(A)(0; +3; +3)",
      payload: {
        points: [pt("sp1", "A", 0, 3, 3, COLORS.A)],
        segments: [],
        foldAngle: 0,
        showBisectors: true,
        showXYZ: true,
        cameraPreset: "profile",
        spotlight: {
          target: "point_space",
          pointLabel: "A",
          caption: "β₁₃ (+3; +3): A' e A ficam perfeitamente simétricos na LT!",
          professor: "monge",
        },
      },
    },
    {
      id: "ep05-b24",
      sceneId: "b24",
      chipLabel: "2º Bissetor β₂₄ (−3; +3)",
      coordsLabel: "(B)(0; −3; +3)",
      payload: {
        points: [pt("sp2", "B", 0, -3, 3, COLORS.D)],
        segments: [],
        foldAngle: 90,
        showBisectors: true,
        showXYZ: true,
        cameraPreset: "front",
        spotlight: {
          target: "coincident",
          pointLabel: "B",
          caption: "β₂₄ (−3; +3): projeções B e B' coincidem fora da LT!",
          professor: "monge",
        },
      },
    },
  ],
  "ep06-uerj": [
    {
      id: "ep06-ex1-pts",
      sceneId: "ex1-points",
      chipLabel: "Ex. 1 · Pontos (A) e (B)",
      coordsLabel: "A(+2;+5;+3) · B(−2;−5;−3)",
      payload: {
        points: [
          pt("a", "A", 2, 5, 3, COLORS.A),
          pt("b", "B", -2, -5, -3, COLORS.C),
        ],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "origin",
          caption: "Ex. 1 UERJ: (A) no 1º Diedro e (B) simétrico no 3º Diedro",
          professor: "monge",
        },
      },
    },
    {
      id: "ep06-ex1-line",
      sceneId: "ex1-line",
      chipLabel: "Ex. 1 · Reta (r) pela Origem",
      coordsLabel: "r: A(+2;+5;+3) ⇄ B(−2;−5;−3)",
      payload: {
        points: [
          pt("a", "A", 2, 5, 3, COLORS.A),
          pt("b", "B", -2, -5, -3, COLORS.C),
        ],
        segments: [{ id: "r", fromId: "a", toId: "b", label: "r", extendLine: true }],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "line",
          pointLabel: "A",
          caption: "Reta (r) e suas projeções r / r' cruzam na Origem O(0;0;0)!",
          professor: "monge",
        },
      },
    },
    {
      id: "ep06-ex2-pts",
      sceneId: "ex2-points",
      chipLabel: "Ex. 2 · 3 Pontos no 1ºD",
      coordsLabel: "A(1;2;3) · B(2;3;4) · C(3;4;5)",
      payload: {
        points: [
          pt("a", "A", 1, 2, 3, COLORS.A),
          pt("b", "B", 2, 3, 4, COLORS.B),
          pt("c", "C", 3, 4, 5, COLORS.C),
        ],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "point_space",
          pointLabel: "B",
          caption: "Ex. 2 UERJ: passo constante (+1; +1; +1) no 1º Diedro",
          professor: "monge",
        },
      },
    },
    {
      id: "ep06-ex2-collinear",
      sceneId: "ex2-collinear",
      chipLabel: "Ex. 2 · Reta Colinear // β₁₃",
      coordsLabel: "A(1;2;3)—B(2;3;4)—C(3;4;5)",
      payload: {
        points: [
          pt("a", "A", 1, 2, 3, COLORS.A),
          pt("b", "B", 2, 3, 4, COLORS.B),
          pt("c", "C", 3, 4, 5, COLORS.C),
        ],
        segments: [
          { id: "s1", fromId: "a", toId: "b", label: "s", extendLine: true },
          { id: "s2", fromId: "b", toId: "c", extendLine: false },
        ],
        foldAngle: 0,
        showBisectors: true,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "line",
          pointLabel: "B",
          caption: "Sem triângulo: A, B e C são colineares e paralelos ao β₁₃!",
          professor: "monge",
        },
      },
    },
  ],
  "ep07-yup-zup": [
    {
      id: "ep07-coord",
      sceneId: "translator",
      chipLabel: "Ponto (A)(+2; +5; +3) em 3D",
      coordsLabel: "GD(+2;+5;+3) = Three.js(2,3,5)",
      payload: {
        points: [pt("a", "A", 2, 5, 3, COLORS.A)],
        segments: [],
        foldAngle: 0,
        showBisectors: false,
        showXYZ: true,
        cameraPreset: "iso",
        spotlight: {
          target: "cota",
          pointLabel: "A",
          caption: "Na UERJ Z (+3) é altura e Y (+5) é afastamento — eixos XYZ ligados!",
          professor: "monge",
        },
      },
    },
  ],
};

export function getEpisodePointExamples(episodeId: string): VideoPointExample[] {
  return VIDEO_POINT_EXAMPLES[episodeId] ?? [];
}

export function resolveVideoLabMoment(
  episodeId: string,
  sceneId: string,
  sceneSeconds: number,
  fallback: LabLaunchPayload
): VideoPointExample {
  const examples = VIDEO_POINT_EXAMPLES[episodeId] ?? [];
  const exact = examples.find(
    (ex) =>
      ex.sceneId === sceneId &&
      (ex.minSceneSec === undefined || sceneSeconds >= ex.minSceneSec) &&
      (ex.maxSceneSec === undefined || sceneSeconds < ex.maxSceneSec)
  );
  if (exact) return exact;

  // Map intro / bridge / summary scenes to the clearest canonical example of the episode
  const fallbackIds: Record<string, Record<string, string>> = {
    "ep01-monge": {
      intro: "ep01-monge-pair",
      "lt-and-notation": "ep01-monge-pair",
      takeaway: "ep01-monge-pair",
    },
    "ep02-coordenadas": {
      abscissa: "ep02-point-pos",
      afastamento: "ep02-point-pos",
      cota: "ep02-point-pos",
    },
    "ep03-diedros": {
      "d4-rule": "ep03-all",
    },
    "ep04-rebatimento": {
      hinge: "ep04-3d",
    },
    "ep05-bissetores": {
      intro: "ep05-b13",
      "bisectors-intro": "ep05-b13",
    },
    "ep06-uerj": {
      intro: "ep06-ex1-pts",
    },
    "ep07-yup-zup": {
      intro: "ep07-coord",
      "cg-origin": "ep07-coord",
      "gd-origin": "ep07-coord",
    },
  };

  const mappedId = fallbackIds[episodeId]?.[sceneId];
  if (mappedId) {
    const mapped = examples.find((ex) => ex.id === mappedId);
    if (mapped) return mapped;
  }

  return (
    examples[0] ?? {
      id: `${episodeId}-default`,
      sceneId,
      chipLabel: "Cena da Aula",
      coordsLabel: fallback.points
        .map((p) => `(${p.label})(${p.x};${p.y};${p.z})`)
        .join(" · "),
      payload: fallback,
    }
  );
}
