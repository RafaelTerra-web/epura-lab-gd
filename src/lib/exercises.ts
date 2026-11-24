import { classifyPoint, formatSigned, PointRegion } from "./gd-math";

export type ExerciseMode =
  | "identify_diedro"
  | "draw_epura"
  | "read_epura"
  | "special_cases"
  | "coord_order"
  | "cg_vs_gd";

export interface GeneratedExercise {
  id: string;
  mode: ExerciseMode;
  topicKey:
    | "diedros"
    | "desenhar_epura"
    | "ler_epura"
    | "bissetores_planos"
    | "ordem_xyz";
  difficulty: 1 | 2 | 3;
  point: { label: string; x: number; y: number; z: number };
  prompt: string;
  hint: string;
  explanation: string;
  choices?: Array<{ id: string; label: string; sub?: string }>;
  correctChoiceId?: string;
}

const LABELS = ["A", "B", "C", "P", "M", "Q"];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min: number, max: number): number {
  let v = 0;
  while (v === 0) v = randInt(min, max);
  return v;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateExercise(
  mode: ExerciseMode,
  difficulty: 1 | 2 | 3 = 1
): GeneratedExercise {
  const id = `${mode}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const label = pick(LABELS);

  if (mode === "identify_diedro") {
    const x = randInt(-4, 4);
    const y = randNonZero(-5, 5);
    const z = randNonZero(-5, 5);
    const info = classifyPoint(x, y, z, label);
    return {
      id,
      mode,
      topicKey: "diedros",
      difficulty,
      point: { label, x, y, z },
      prompt: `Em qual diedro está o ponto (${label})(${formatSigned(x)}; ${formatSigned(y)}; ${formatSigned(z)})?`,
      hint: `Lembre da ordem: (abscissa; afastamento; cota). Olhe os sinais do 2º número (afastamento = ${formatSigned(y)}) e do 3º número (cota = ${formatSigned(z)}).`,
      explanation: `Afastamento é ${formatSigned(y)} (${y > 0 ? "à frente de π'" : "atrás de π'"}) e cota é ${formatSigned(z)} (${z > 0 ? "acima de π" : "abaixo de π"}). Logo, (${label}) está no ${info.title}! ${info.epuraDescription}`,
      choices: [
        { id: "1D", label: "1º Diedro", sub: "afast. (+), cota (+)" },
        { id: "2D", label: "2º Diedro", sub: "afast. (−), cota (+)" },
        { id: "3D", label: "3º Diedro", sub: "afast. (−), cota (−)" },
        { id: "4D", label: "4º Diedro", sub: "afast. (+), cota (−)" },
      ],
      correctChoiceId: info.region,
    };
  }

  if (mode === "draw_epura") {
    const x = randInt(-4, 4);
    const y = difficulty === 1 ? randInt(1, 5) : randInt(-5, 5);
    const z = difficulty === 1 ? randInt(1, 5) : randInt(-5, 5);
    const info = classifyPoint(x, y, z, label);
    return {
      id,
      mode,
      topicKey: "desenhar_epura",
      difficulty,
      point: { label, x, y, z },
      prompt: `Desenhe na épura as projeções ${label}' (vertical) e ${label} (horizontal) do ponto (${label})(${formatSigned(x)}; ${formatSigned(y)}; ${formatSigned(z)}).`,
      hint: `Passo 1: ache x = ${formatSigned(x)} na Linha de Terra. Passo 2: marque a cota (${formatSigned(z)}) para ${label}' (positivo sobe, negativo desce). Passo 3: marque o afastamento (${formatSigned(y)}) para ${label} — lembre que POSITIVO DESCE!`,
      explanation: `${info.title}. ${info.epuraDescription}`,
    };
  }

  if (mode === "read_epura") {
    const x = randInt(-4, 4);
    const y = difficulty === 1 ? randNonZero(-4, 4) : randInt(-5, 5);
    const z = difficulty === 1 ? randNonZero(-4, 4) : randInt(-5, 5);
    const info = classifyPoint(x, y, z, label);
    return {
      id,
      mode,
      topicKey: "ler_epura",
      difficulty,
      point: { label, x, y, z },
      prompt: `Observe a épura desenhada abaixo e descubra as coordenadas (${label})(abscissa; afastamento; cota):`,
      hint: `Leia primeiro a posição da linha de chamada na LT (abscissa x). Depois olhe ${label} para o afastamento (ABAIXO da LT é positivo; ACIMA é negativo!). Por fim olhe ${label}' para a cota (ACIMA é positivo; ABAIXO é negativo).`,
      explanation: `Na épura, a linha de chamada está em x = ${formatSigned(x)}. Como ${label} está ${y === 0 ? "sobre a LT" : y > 0 ? `${Math.abs(y)} un. abaixo da LT` : `${Math.abs(y)} un. acima da LT`}, o afastamento é ${formatSigned(y)}. Como ${label}' está ${z === 0 ? "sobre a LT" : z > 0 ? `${Math.abs(z)} un. acima da LT` : `${Math.abs(z)} un. abaixo da LT`}, a cota é ${formatSigned(z)}. (${info.title})`,
    };
  }

  if (mode === "special_cases") {
    const templates: Array<{
      x: number;
      y: number;
      z: number;
      correct: string;
      desc: string;
    }> = [
      {
        x: randInt(-3, 3),
        y: 3,
        z: 3,
        correct: "B13",
        desc: "Afastamento (+3) e cota (+3) são iguais com mesmo sinal: pertence ao 1º Bissetor (β₁₃), gerando projeções simétricas em relação à LT.",
      },
      {
        x: randInt(-3, 3),
        y: -4,
        z: 4,
        correct: "B24",
        desc: "Afastamento (−4) e cota (+4) têm mesmo módulo e sinais opostos: pertence ao 2º Bissetor (β₂₄), então A e A' coincidem na épura!",
      },
      {
        x: randInt(-3, 3),
        y: 4,
        z: 0,
        correct: "PHA",
        desc: "Cota = 0 e afastamento positivo: o ponto está exatamente apoiado no Semiplano Horizontal Anterior (πA).",
      },
      {
        x: randInt(-3, 3),
        y: 0,
        z: 3,
        correct: "PVS",
        desc: "Afastamento = 0 e cota positiva: o ponto está encostado no Semiplano Vertical Superior (π'S).",
      },
      {
        x: randInt(-3, 3),
        y: 0,
        z: 0,
        correct: "LT",
        desc: "Afastamento = 0 e cota = 0: o ponto está exatamente sobre a Linha de Terra (LT).",
      },
    ];
    const t = pick(templates);
    return {
      id,
      mode,
      topicKey: "bissetores_planos",
      difficulty: 2,
      point: { label, x: t.x, y: t.y, z: t.z },
      prompt: `Qual posição especial descreve com precisão o ponto (${label})(${formatSigned(t.x)}; ${formatSigned(t.y)}; ${formatSigned(t.z)})?`,
      hint: `Compare se alguma coordenada vale zero (encosta num plano ou na LT) ou se |afastamento| = |cota| (pertence a um bissetor!).`,
      explanation: t.desc,
      choices: [
        { id: "B13", label: "1º Bissetor (β₁₃)", sub: "afast. = cota (simétricos)" },
        { id: "B24", label: "2º Bissetor (β₂₄)", sub: "afast. = −cota (coincidentes)" },
        { id: "PHA", label: "Plano Horizontal Anterior (πA)", sub: "cota = 0, afast. > 0" },
        { id: "PVS", label: "Plano Vertical Superior (π'S)", sub: "afast. = 0, cota > 0" },
        { id: "LT", label: "Sobre a Linha de Terra (LT)", sub: "afast. = 0 e cota = 0" },
      ],
      correctChoiceId: t.correct,
    };
  }

  if (mode === "cg_vs_gd") {
    const x = randNonZero(-4, 4);
    let y = randNonZero(-5, 5);
    let z = randNonZero(-5, 5);
    while (y === z) z = randNonZero(-5, 5);
    while (x === y || x === z) {
      y = randNonZero(-5, 5);
      if (y === z) z = randNonZero(-5, 5);
      break;
    }
    const correctVec = `Vector3(${formatSigned(x)}, ${formatSigned(z)}, ${formatSigned(y)})`;
    const wrongSameOrder = `Vector3(${formatSigned(x)}, ${formatSigned(y)}, ${formatSigned(z)})`;
    const wrongNegY = `Vector3(${formatSigned(x)}, ${formatSigned(z)}, ${formatSigned(-y)})`;
    const wrongSwapXZ = `Vector3(${formatSigned(z)}, ${formatSigned(y)}, ${formatSigned(x)})`;
    const opts = [
      { id: "correct", label: correctVec, sub: "Altura (Cota Z) vira Y; Afast. (Y) vira Z" },
      { id: "same", label: wrongSameOrder, sub: "Mantendo a ordem sem trocar Y ↔ Z" },
      { id: "negy", label: wrongNegY, sub: "Invertendo o sinal da profundidade" },
      { id: "xz", label: wrongSwapXZ, sub: "Trocando Abscissa (X) com Cota (Z)" },
    ].sort(() => Math.random() - 0.5);

    return {
      id,
      mode: "cg_vs_gd",
      topicKey: "ordem_xyz",
      difficulty: 2,
      point: { label, x, y, z },
      prompt: `Em Geometria Descritiva (Z-Up) temos (${label})(${formatSigned(x)}; ${formatSigned(y)}; ${formatSigned(z)}). Como esse MESMO ponto espacial é escrito em Three.js / Unity (Y-Up)?`,
      hint: `Em GD (Z-Up): X = Abscissa, Y = Afastamento (frente/trás), Z = Cota (altura). Em Three.js/Unity (Y-Up): Y é altura e Z é profundidade — então Y e Z trocam de lugar!`,
      explanation: `Perfeito! Em GD a altura (Cota) é Z = ${formatSigned(z)} e a profundidade (Afastamento) é Y = ${formatSigned(y)}. Ao traduzir para engines Y-Up (Three.js/Unity), a altura passa para o 2º slot (Y) e a profundidade vai para o 3º slot (Z): ${correctVec}!`,
      choices: opts,
      correctChoiceId: "correct",
    };
  }

  // coord_order
  const x = randNonZero(-4, 4);
  let y = randNonZero(-5, 5);
  let z = randNonZero(-5, 5);
  while (y === x) y = randNonZero(-5, 5);
  while (z === y || z === x) z = randNonZero(-5, 5);

  const askWhich = pick(["abscissa", "afastamento", "cota"] as const);
  const correctVal = askWhich === "abscissa" ? x : askWhich === "afastamento" ? y : z;
  const meaning =
    askWhich === "abscissa"
      ? "a distância sobre a Linha de Terra (1ª coordenada, eixo X)"
      : askWhich === "afastamento"
        ? "a distância ao Plano Vertical π' (2ª coordenada, eixo Y)"
        : "a distância ao Plano Horizontal π (3ª coordenada, eixo Z)";

  const uniqueChoices = Array.from(new Set([x, y, z, -correctVal])).slice(0, 4);
  return {
    id,
    mode: "coord_order",
    topicKey: "ordem_xyz",
    difficulty: 1,
    point: { label, x, y, z },
    prompt: `No ponto (${label})(${formatSigned(x)}; ${formatSigned(y)}; ${formatSigned(z)}), qual valor representa ${askWhich === "abscissa" ? "a ABSCISSA" : askWhich === "afastamento" ? "o AFASTAMENTO" : "a COTA"}?`,
    hint: "A ordem brasileira é sempre alfabética: (Abscissa; Afastamento; Cota) = (X; Y; Z).",
    explanation: `Na convenção adotada na UERJ (Abscissa; Afastamento; Cota), ${askWhich} é ${meaning}. Portanto vale ${formatSigned(correctVal)}.`,
    choices: uniqueChoices.map((v) => ({
      id: String(v),
      label: formatSigned(v),
    })),
    correctChoiceId: String(correctVal),
  };
}

export function getRegionColor(region: PointRegion): string {
  switch (region) {
    case "1D":
      return "#1E56A0";
    case "2D":
      return "#0F766E";
    case "3D":
      return "#C94032";
    case "4D":
      return "#B45309";
    default:
      return "#44403C";
  }
}
