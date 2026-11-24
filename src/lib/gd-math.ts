export type NotationMode = "uerj" | "iso";

export interface GDPoint {
  id: string;
  label: string;
  x: number; // Abscissa (eixo sobre a Linha de Terra)
  y: number; // Afastamento (distância ao Plano Vertical π')
  z: number; // Cota (distância ao Plano Horizontal π)
  color: string;
}

export interface GDSegment {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  extendLine?: boolean;
}

export type PointRegion =
  | "1D"
  | "2D"
  | "3D"
  | "4D"
  | "LT"
  | "PHA"
  | "PHP"
  | "PVS"
  | "PVI";

export interface PointClassification {
  region: PointRegion;
  title: string;
  shortBadge: string;
  bisector: "B13" | "B24" | null;
  bisectorLabel: string | null;
  signPattern: string;
  spatialDescription: string;
  epuraDescription: string;
  diedroNumber: 1 | 2 | 3 | 4 | null;
}

export interface LineAnalysis {
  kind: "segment" | "collinear3" | "triangle";
  passesThroughOrigin: boolean;
  passesThroughLT: boolean;
  ltIntersection: { x: number; y: number; z: number } | null;
  horizontalTrace: { x: number; y: number; z: number } | null; // Traço H (z = 0)
  verticalTrace: { x: number; y: number; z: number } | null; // Traço V (y = 0)
  parallelToB13: boolean;
  parallelToB24: boolean;
  summaryTitle: string;
  summaryText: string;
  diedrosCrossed: string[];
}

export const POINT_COLORS = [
  "#1E56A0", // Azul engenheiro
  "#C94032", // Carmim técnico
  "#0F766E", // Verde prancheta
  "#B45309", // Ocre grafite
  "#6D28D9", // Violeta técnico
  "#BE185D", // Magenta
];

export function formatSigned(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  if (Object.is(rounded, -0) || rounded === 0) return "0";
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function formatPointCoords(
  label: string,
  x: number,
  y: number,
  z: number
): string {
  return `(${label})(${formatSigned(x)}; ${formatSigned(y)}; ${formatSigned(z)})`;
}

export function getProjectionLabels(label: string, mode: NotationMode) {
  if (mode === "iso") {
    return {
      space: `(${label})`,
      horizontal: `${label}₁`,
      vertical: `${label}₂`,
      phName: "π₁ (PH)",
      pvName: "π₂ (PV)",
      phShort: "π₁",
      pvShort: "π₂",
    };
  }
  return {
    space: `(${label})`,
    horizontal: `${label}`,
    vertical: `${label}'`,
    phName: "π (PH)",
    pvName: "π' (PV)",
    phShort: "π",
    pvShort: "π'",
  };
}

export function getLineProjectionLabels(label: string, mode: NotationMode) {
  if (mode === "iso") {
    return { space: `(${label})`, horizontal: `${label}₁`, vertical: `${label}₂` };
  }
  return { space: `(${label})`, horizontal: `${label}`, vertical: `${label}'` };
}

export function classifyPoint(
  x: number,
  y: number,
  z: number,
  label = "A",
  mode: NotationMode = "uerj"
): PointClassification {
  const eps = 1e-6;
  const p = getProjectionLabels(label, mode);
  const absY = Math.abs(Math.round(y * 10) / 10);
  const absZ = Math.abs(Math.round(z * 10) / 10);

  let bisector: "B13" | "B24" | null = null;
  let bisectorLabel: string | null = null;
  if (Math.abs(y) > eps || Math.abs(z) > eps) {
    if (Math.abs(y - z) < eps) {
      bisector = "B13";
      bisectorLabel = "1º Bissetor (β₁₃): projeções simétricas em relação à LT";
    } else if (Math.abs(y + z) < eps) {
      bisector = "B24";
      bisectorLabel = `2º Bissetor (β₂₄): projeções coincidentes (${p.horizontal} ≡ ${p.vertical})`;
    }
  }

  const signY = Math.abs(y) < eps ? "0" : y > 0 ? "+" : "−";
  const signZ = Math.abs(z) < eps ? "0" : z > 0 ? "+" : "−";
  const signPattern = `(${signY}; ${signZ})`;

  // Sobre a Linha de Terra
  if (Math.abs(y) < eps && Math.abs(z) < eps) {
    return {
      region: "LT",
      title: "Sobre a Linha de Terra (LT)",
      shortBadge: "Na LT",
      bisector: null,
      bisectorLabel: "Pertence à interseção de π, π', β₁₃ e β₂₄",
      signPattern: "(0; 0)",
      spatialDescription:
        "Afastamento = 0 e cota = 0: o ponto está exatamente sobre a dobradiça (Linha de Terra) que une os dois planos.",
      epuraDescription: `Na épura, ${p.vertical} e ${p.horizontal} coincidem exatamente sobre a Linha de Terra na abscissa ${formatSigned(x)}.`,
      diedroNumber: null,
    };
  }

  // Sobre o Plano Horizontal (cota = 0)
  if (Math.abs(z) < eps) {
    if (y > 0) {
      return {
        region: "PHA",
        title: "Semiplano Horizontal Anterior (πA)",
        shortBadge: "Sobre πA",
        bisector: null,
        bisectorLabel: null,
        signPattern,
        spatialDescription:
          "Cota = 0 e afastamento positivo: o ponto repousa sobre o piso frontal (fronteira entre 1º e 4º diedros).",
        epuraDescription: `Na épura, ${p.vertical} fica sobre a LT (cota 0) e ${p.horizontal} desce ${absY} un. abaixo da LT.`,
        diedroNumber: null,
      };
    }
    return {
      region: "PHP",
      title: "Semiplano Horizontal Posterior (πP)",
      shortBadge: "Sobre πP",
      bisector: null,
      bisectorLabel: null,
      signPattern,
      spatialDescription:
        "Cota = 0 e afastamento negativo: o ponto repousa no piso traseiro (fronteira entre 2º e 3º diedros).",
      epuraDescription: `Na épura, ${p.vertical} fica sobre a LT (cota 0) e ${p.horizontal} sobe ${absY} un. acima da LT.`,
      diedroNumber: null,
    };
  }

  // Sobre o Plano Vertical (afastamento = 0)
  if (Math.abs(y) < eps) {
    if (z > 0) {
      return {
        region: "PVS",
        title: "Semiplano Vertical Superior (π'S)",
        shortBadge: "Sobre π'S",
        bisector: null,
        bisectorLabel: null,
        signPattern,
        spatialDescription:
          "Afastamento = 0 e cota positiva: o ponto está encostado na parede superior (fronteira entre 1º e 2º diedros).",
        epuraDescription: `Na épura, ${p.horizontal} fica sobre a LT (afastamento 0) e ${p.vertical} sobe ${absZ} un. acima da LT.`,
        diedroNumber: null,
      };
    }
    return {
      region: "PVI",
      title: "Semiplano Vertical Inferior (π'I)",
      shortBadge: "Sobre π'I",
      bisector: null,
      bisectorLabel: null,
      signPattern,
      spatialDescription:
        "Afastamento = 0 e cota negativa: o ponto está na parede inferior (fronteira entre 3º e 4º diedros).",
      epuraDescription: `Na épura, ${p.horizontal} fica sobre a LT (afastamento 0) e ${p.vertical} desce ${absZ} un. abaixo da LT.`,
      diedroNumber: null,
    };
  }

  // 1º Diedro: y > 0, z > 0
  if (y > 0 && z > 0) {
    return {
      region: "1D",
      title: "1º Diedro",
      shortBadge: "1º Diedro",
      bisector,
      bisectorLabel,
      signPattern,
      spatialDescription:
        "À frente do Plano Vertical (afastamento +) e acima do Plano Horizontal (cota +). É a região do observador!",
      epuraDescription: `Na épura, ${p.vertical} fica ${absZ} un. ACIMA da LT (cota +) e ${p.horizontal} fica ${absY} un. ABAIXO da LT (afastamento + rebate para baixo).`,
      diedroNumber: 1,
    };
  }

  // 2º Diedro: y < 0, z > 0
  if (y < 0 && z > 0) {
    return {
      region: "2D",
      title: "2º Diedro",
      shortBadge: "2º Diedro",
      bisector,
      bisectorLabel,
      signPattern,
      spatialDescription:
        "Atrás do Plano Vertical (afastamento −) e acima do Plano Horizontal (cota +).",
      epuraDescription: `Na épura, AMBAS as projeções ficam ACIMA da LT: ${p.vertical} a ${absZ} un. e ${p.horizontal} a ${absY} un. (o piso traseiro rebateu para cima!).`,
      diedroNumber: 2,
    };
  }

  // 3º Diedro: y < 0, z < 0
  if (y < 0 && z < 0) {
    return {
      region: "3D",
      title: "3º Diedro",
      shortBadge: "3º Diedro",
      bisector,
      bisectorLabel,
      signPattern,
      spatialDescription:
        "Atrás do Plano Vertical (afastamento −) e abaixo do Plano Horizontal (cota −). Oposto ao 1º Diedro!",
      epuraDescription: `Na épura, inverte em relação ao 1º Diedro: ${p.horizontal} fica ${absY} un. ACIMA da LT (afastamento − sobe) e ${p.vertical} fica ${absZ} un. ABAIXO da LT (cota − desce).`,
      diedroNumber: 3,
    };
  }

  // 4º Diedro: y > 0, z < 0
  return {
    region: "4D",
    title: "4º Diedro",
    shortBadge: "4º Diedro",
    bisector,
    bisectorLabel,
    signPattern,
    spatialDescription:
      "À frente do Plano Vertical (afastamento +) e abaixo do Plano Horizontal (cota −).",
    epuraDescription: `Na épura, AMBAS as projeções ficam ABAIXO da LT: ${p.vertical} a ${absZ} un. (cota −) e ${p.horizontal} a ${absY} un. (afastamento + rebate para baixo).`,
    diedroNumber: 4,
  };
}

export function analyzePointsGeometry(points: GDPoint[]): LineAnalysis | null {
  if (points.length < 2) return null;
  const eps = 1e-5;
  const a = points[0];
  const b = points[1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;

  // Traços da reta AB:
  // Horizontal trace H (z = 0)
  let horizontalTrace: { x: number; y: number; z: number } | null = null;
  if (Math.abs(dz) > eps) {
    const t = -a.z / dz;
    horizontalTrace = {
      x: Math.round((a.x + t * dx) * 100) / 100,
      y: Math.round((a.y + t * dy) * 100) / 100,
      z: 0,
    };
  }

  // Vertical trace V (y = 0)
  let verticalTrace: { x: number; y: number; z: number } | null = null;
  if (Math.abs(dy) > eps) {
    const t = -a.y / dy;
    verticalTrace = {
      x: Math.round((a.x + t * dx) * 100) / 100,
      y: 0,
      z: Math.round((a.z + t * dz) * 100) / 100,
    };
  }

  const passesThroughLT =
    horizontalTrace !== null &&
    verticalTrace !== null &&
    Math.abs(horizontalTrace.x - verticalTrace.x) < 1e-3 &&
    Math.abs(horizontalTrace.y) < 1e-3 &&
    Math.abs(verticalTrace.z) < 1e-3;

  const ltIntersection = passesThroughLT ? horizontalTrace : null;
  const passesThroughOrigin =
    ltIntersection !== null && Math.abs(ltIntersection.x) < 1e-3;

  const parallelToB13 =
    (Math.abs(dy) > eps || Math.abs(dz) > eps) && Math.abs(dy - dz) < eps;
  const parallelToB24 =
    (Math.abs(dy) > eps || Math.abs(dz) > eps) && Math.abs(dy + dz) < eps;

  // Quais diedros a reta percorre
  const diedroSet = new Set<string>();
  for (let t = -3; t <= 3; t += 0.15) {
    const py = a.y + t * dy;
    const pz = a.z + t * dz;
    if (Math.abs(py) < 0.05 || Math.abs(pz) < 0.05) continue;
    if (py > 0 && pz > 0) diedroSet.add("1º Diedro");
    else if (py < 0 && pz > 0) diedroSet.add("2º Diedro");
    else if (py < 0 && pz < 0) diedroSet.add("3º Diedro");
    else if (py > 0 && pz < 0) diedroSet.add("4º Diedro");
  }
  const diedrosCrossed = Array.from(diedroSet);

  // Se houver 3 pontos, verificar colinearidade
  if (points.length === 3) {
    const c = points[2];
    const v1 = [b.x - a.x, b.y - a.y, b.z - a.z];
    const v2 = [c.x - a.x, c.y - a.y, c.z - a.z];
    const cross = [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0],
    ];
    const crossMag = Math.hypot(cross[0], cross[1], cross[2]);
    if (crossMag < 1e-4) {
      return {
        kind: "collinear3",
        passesThroughOrigin,
        passesThroughLT,
        ltIntersection,
        horizontalTrace,
        verticalTrace,
        parallelToB13,
        parallelToB24,
        diedrosCrossed,
        summaryTitle: "3 Pontos Colineares (NÃO formam triângulo!)",
        summaryText: parallelToB13
          ? `Os pontos (${a.label}), (${b.label}) e (${c.label}) estão perfeitamente alinhados sobre uma única reta! Além disso, como Δafastamento = Δcota (${formatSigned(dy)}), a reta é paralela ao 1º Bissetor (β₁₃) e suas projeções na épura formam ângulos simétricos com a LT.`
          : `Os pontos (${a.label}), (${b.label}) e (${c.label}) pertencem à mesma reta no espaço: a figura formada ao uni-los é um segmento de reta, e não um triângulo.`,
      };
    }
    return {
      kind: "triangle",
      passesThroughOrigin,
      passesThroughLT,
      ltIntersection,
      horizontalTrace,
      verticalTrace,
      parallelToB13,
      parallelToB24,
      diedrosCrossed,
      summaryTitle: "Triângulo Espacial",
      summaryText: `Os 3 pontos não são colineares e definem o triângulo (${a.label})(${b.label})(${c.label}) no espaço, com projeções triangulares na épura.`,
    };
  }

  if (passesThroughOrigin) {
    return {
      kind: "segment",
      passesThroughOrigin: true,
      passesThroughLT: true,
      ltIntersection,
      horizontalTrace,
      verticalTrace,
      parallelToB13,
      parallelToB24,
      diedrosCrossed,
      summaryTitle: "Reta concorrente com a Linha de Terra na Origem O(0; 0; 0)",
      summaryText: `(${a.label}) e (${b.label}) atravessam a Linha de Terra exatamente na origem O(0; 0; 0)! Na épura, tanto a projeção vertical r' quanto a projeção horizontal r cruzam a LT no mesmo ponto x = 0. O segmento passa direto entre ${diedrosCrossed.join(" e ")}.`,
    };
  }

  if (passesThroughLT && ltIntersection) {
    return {
      kind: "segment",
      passesThroughOrigin: false,
      passesThroughLT: true,
      ltIntersection,
      horizontalTrace,
      verticalTrace,
      parallelToB13,
      parallelToB24,
      diedrosCrossed,
      summaryTitle: `Reta concorrente com a LT em x = ${formatSigned(ltIntersection.x)}`,
      summaryText: `A reta fura simultaneamente os dois planos de projeção sobre a Linha de Terra em (${formatSigned(ltIntersection.x)}; 0; 0).`,
    };
  }

  return {
    kind: "segment",
    passesThroughOrigin: false,
    passesThroughLT: false,
    ltIntersection: null,
    horizontalTrace,
    verticalTrace,
    parallelToB13,
    parallelToB24,
    diedrosCrossed,
    summaryTitle: `Segmento e Reta (${a.label})(${b.label})`,
    summaryText: `A reta percorre: ${diedrosCrossed.join(", ") || "plano de projeção"}. ${
      horizontalTrace
        ? `Fura o plano horizontal π em H(${formatSigned(horizontalTrace.x)}; ${formatSigned(horizontalTrace.y)}; 0). `
        : "É paralela ao plano horizontal π. "
    }${
      verticalTrace
        ? `Fura o plano vertical π' em V(${formatSigned(verticalTrace.x)}; 0; ${formatSigned(verticalTrace.z)}).`
        : "É paralela ao plano vertical π'."
    }`,
  };
}

export interface ScenePreset {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  points: GDPoint[];
  segments: GDSegment[];
  showBisectors?: boolean;
  narration: string;
}

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "uerj-ex1",
    badge: "UERJ · Aula 1 · Ex. 1",
    title: "Exercício 1 da UERJ",
    subtitle: "(A)(+2; +5; +3) e (B)(-2; -5; -3) + reta (r)",
    points: [
      { id: "a", label: "A", x: 2, y: 5, z: 3, color: "#1E56A0" },
      { id: "b", label: "B", x: -2, y: -5, z: -3, color: "#C94032" },
    ],
    segments: [{ id: "r", fromId: "a", toId: "b", label: "r", extendLine: true }],
    narration:
      "Este é exatamente o Exercício 1 da sua Aula 1 na UERJ! O ponto A está no primeiro diedro com abscissa mais 2, afastamento mais 5 e cota mais 3. Já o ponto B tem todos os sinais invertidos e está no terceiro diedro. Ao ligar A e B, o segmento atravessa a Linha de Terra exatamente na origem zero, zero, zero! Experimente deslizar o rebatimento até 90 graus para ver r e r linha cruzando a Linha de Terra no mesmo ponto.",
  },
  {
    id: "uerj-ex2",
    badge: "UERJ · Aula 1 · Ex. 2",
    title: "Exercício 2 da UERJ",
    subtitle: "(A)(+1;+2;+3), (B)(+2;+3;+4) e (C)(+3;+4;+5)",
    points: [
      { id: "a", label: "A", x: 1, y: 2, z: 3, color: "#1E56A0" },
      { id: "b", label: "B", x: 2, y: 3, z: 4, color: "#0F766E" },
      { id: "c", label: "C", x: 3, y: 4, z: 5, color: "#C94032" },
    ],
    segments: [
      { id: "ab", fromId: "a", toId: "b", label: "r", extendLine: true },
      { id: "bc", fromId: "b", toId: "c", extendLine: false },
    ],
    showBisectors: true,
    narration:
      "Olha a pegadinha genial do Exercício 2 da sua Aula 1 na UERJ! Muita gente espera formar um triângulo com três pontos, mas repare que de A para B e de B para C cada coordenada cresce sempre em mais um. Por isso os três pontos são colineares: formam uma única reta no primeiro diedro, paralela ao primeiro bissetor!",
  },
  {
    id: "single-explore",
    badge: "Exploração Livre",
    title: "Ponto no 1º Diedro",
    subtitle: "(A)(+2; +4; +3) — arraste no 2D e veja o 3D",
    points: [{ id: "a", label: "A", x: 2, y: 4, z: 3, color: "#1E56A0" }],
    segments: [],
    narration:
      "Comece por um único ponto no primeiro diedro: abscissa mais 2 ao longo da Linha de Terra, afastamento mais 4 à frente da parede vertical e cota mais 3 acima do chão horizontal. Arraste A ou A linha na épura e veja o ponto se mover ao vivo no espaço tridimensional.",
  },
  {
    id: "four-diedros",
    badge: "Comparativo",
    title: "Os 4 Diedros lado a lado",
    subtitle: "Um ponto em cada diedro para comparar na épura",
    points: [
      { id: "d1", label: "A", x: -3, y: 3, z: 4, color: "#1E56A0" },
      { id: "d2", label: "B", x: -1, y: -3, z: 4, color: "#0F766E" },
      { id: "d3", label: "C", x: 1, y: -3, z: -4, color: "#C94032" },
      { id: "d4", label: "D", x: 3, y: 3, z: -4, color: "#B45309" },
    ],
    segments: [],
    narration:
      "Aqui temos um ponto em cada um dos quatro diedros! Observe na épura: no primeiro diedro A linha sobe e A desce; no segundo ambos sobem; no terceiro A sobe e A linha desce; e no quarto ambos descem.",
  },
  {
    id: "bisectors",
    badge: "Planos Bissetores",
    title: "1º e 2º Bissetores (β₁₃ e β₂₄)",
    subtitle: "Projeções simétricas vs projeções coincidentes",
    points: [
      { id: "b1", label: "A", x: -2, y: 3, z: 3, color: "#1E56A0" },
      { id: "b2", label: "B", x: 2, y: -3, z: 3, color: "#B45309" },
    ],
    segments: [],
    showBisectors: true,
    narration:
      "O ponto A está no primeiro bissetor porque tem afastamento e cota iguais a mais 3: na épura, A linha e A ficam simétricos em relação à Linha de Terra. Já o ponto B está no segundo bissetor com afastamento menos 3 e cota mais 3: na épura, B e B linha coincidem exatamente no mesmo ponto!",
  },
  {
    id: "special-planes",
    badge: "Casos Especiais",
    title: "Sobre os Planos e a LT",
    subtitle: "Quando afastamento ou cota vale zero",
    points: [
      { id: "p1", label: "A", x: -3, y: 4, z: 0, color: "#1E56A0" },
      { id: "p2", label: "B", x: 0, y: 0, z: 0, color: "#0F766E" },
      { id: "p3", label: "C", x: 3, y: 0, z: 4, color: "#C94032" },
    ],
    segments: [],
    narration:
      "Quando uma coordenada é zero, o ponto encosta no plano! A tem cota zero e repousa no plano horizontal anterior, então A linha cai na Linha de Terra. B tem tudo zero e fica na própria Linha de Terra. C tem afastamento zero e encosta na parede vertical, então C cai na Linha de Terra.",
  },
];
