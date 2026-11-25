export type CalcFnKind =
  | "constant"
  | "linear"
  | "quadratic"
  | "cubic"
  | "sqrt"
  | "rational"
  | "hole_limit"
  | "abs"
  | "exp"
  | "ln"
  | "trig";

export type CalcLabSubMode = "graph" | "arrows" | "intervals";

export interface CalcParams {
  a: number;
  b: number;
  c: number;
}

export interface CalcLabState {
  subMode?: CalcLabSubMode;
  kind: CalcFnKind;
  params: CalcParams;
  x0: number;
  h: number;
  showDomainImage: boolean;
  showRoots: boolean;
  showTangent: boolean;
  showSecant: boolean;
  showDerivative: boolean;
  showSecondDeriv: boolean;
  showInverse: boolean;
  showAntideriv: boolean;
  antiderivC: number;
  arrowCaseId?: "bijective" | "quadratic" | "missing" | "ambiguous";
  intervalPreset?: {
    a1: number;
    b1: number;
    closedA1: boolean;
    closedB1: boolean;
    a2: number;
    b2: number;
    closedA2: boolean;
    closedB2: boolean;
    op: "union" | "intersection" | "diff";
  };
  inequalityPreset?: {
    mode: "linear" | "quadratic";
    linA?: number;
    linB?: number;
    linSign?: "<=" | ">=";
    r1?: number;
    r2?: number;
    quadSign?: ">=" | "<=";
  };
}

export interface CalcFnMeta {
  kind: CalcFnKind;
  name: string;
  shortTag: string;
  unitTag: string;
  formula: (p: CalcParams) => string;
  derivFormula: (p: CalcParams) => string;
  antiderivFormula: (p: CalcParams, C: number) => string;
  domainLabel: (p: CalcParams) => string;
  imageLabel: (p: CalcParams) => string;
  domainRestriction: (p: CalcParams) => string;
  defaultParams: CalcParams;
  defaultX0: number;
  paramLabels: { a: string; b: string; c: string };
}

export function fmtNum(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Object.is(r, -0) || Math.abs(r) < 1e-6) return "0";
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/\.?0+$/, "");
}

export function fmtSigned(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Object.is(r, -0) || Math.abs(r) < 1e-6) return "0";
  return r > 0 ? `+${fmtNum(r)}` : fmtNum(r);
}

function fmtTermSign(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r) < 1e-6) return "";
  return r > 0 ? ` + ${fmtNum(r)}` : ` − ${fmtNum(Math.abs(r))}`;
}

function fmtShiftX(b: number): string {
  if (Math.abs(b) < 1e-6) return "x";
  return b > 0 ? `x − ${fmtNum(b)}` : `x + ${fmtNum(Math.abs(b))}`;
}

export const CALC_FUNCTIONS: Record<CalcFnKind, CalcFnMeta> = {
  constant: {
    kind: "constant",
    name: "0) Função Constante (f(x) = c)",
    shortTag: "Constante",
    unitTag: "Pré-Cálculo · Caderno",
    formula: (p) => `f(x) = ${fmtNum(p.c)}`,
    derivFormula: () => "f'(x) = 0 (reta horizontal)",
    antiderivFormula: (p, C) => `F(x) = ${fmtNum(p.c)}x${fmtTermSign(C)}`,
    domainLabel: () => "D_f = ℝ  (]−∞, +∞[)",
    imageLabel: (p) => `Im_f = { ${fmtNum(p.c)} }`,
    domainRestriction: (p) =>
      `Para todo x ∈ ℝ a saída é sempre constante c = ${fmtNum(p.c)}: Im_f é conjunto unitário.`,
    defaultParams: { a: 0, b: 0, c: 2 },
    defaultX0: 1.5,
    paramLabels: { a: "Não usado (a)", b: "Não usado (b)", c: "Constante (c)" },
  },
  linear: {
    kind: "linear",
    name: "1) Função Afim (f(x) = ax + b, a ≠ 0)",
    shortTag: "Afim",
    unitTag: "Pré-Cálculo · Caderno",
    formula: (p) => `f(x) = ${fmtNum(p.a)}x${fmtTermSign(p.b)}`,
    derivFormula: (p) => `f'(x) = ${fmtNum(p.a)}  (tg α = Δy/Δx = a)`,
    antiderivFormula: (p, C) =>
      `F(x) = ${fmtNum(p.a / 2)}x²${p.b !== 0 ? `${fmtTermSign(p.b)}x` : ""}${fmtTermSign(C)}`,
    domainLabel: () => "D_f = ℝ  (]−∞, +∞[)",
    imageLabel: (p) => (Math.abs(p.a) < 1e-6 ? `Im_f = { ${fmtNum(p.b)} }` : "Im_f = ℝ"),
    domainRestriction: (p) =>
      Math.abs(p.a) < 1e-6
        ? `Com a = 0 vira função constante y = ${fmtNum(p.b)}.`
        : `Inclinação a = ${fmtNum(p.a)} (${p.a > 0 ? "subindo" : "descendo"}); raiz x = −b/a = ${fmtNum(-p.b / p.a)}; Im_f = ℝ pois f((y−b)/a) = y.`,
    defaultParams: { a: 1.5, b: -1, c: 0 },
    defaultX0: 1,
    paramLabels: { a: "Inclinação (a = tg α)", b: "Coef. linear (b)", c: "Não usado (c)" },
  },
  quadratic: {
    kind: "quadratic",
    name: "Função Quadrática (Parábola)",
    shortTag: "Quadrática",
    unitTag: "Pré-Cálculo · U3",
    formula: (p) =>
      `f(x) = ${fmtNum(p.a)}x²${p.b !== 0 ? `${fmtTermSign(p.b)}x` : ""}${fmtTermSign(p.c)}`,
    derivFormula: (p) => `f'(x) = ${fmtNum(2 * p.a)}x${fmtTermSign(p.b)}`,
    antiderivFormula: (p, C) =>
      `F(x) = ${fmtNum(p.a / 3)}x³${p.b !== 0 ? `${fmtTermSign(p.b / 2)}x²` : ""}${p.c !== 0 ? `${fmtTermSign(p.c)}x` : ""}${fmtTermSign(C)}`,
    domainLabel: () => "D(f) = ℝ  (]−∞, +∞[)",
    imageLabel: (p) => {
      if (Math.abs(p.a) < 1e-6) return "Im(f) = ℝ";
      const xv = -p.b / (2 * p.a);
      const yv = p.a * xv * xv + p.b * xv + p.c;
      return p.a > 0
        ? `Im(f) = [${fmtNum(yv)}, +∞[`
        : `Im(f) = ]−∞, ${fmtNum(yv)}]`;
    },
    domainRestriction: () => "Polinômio: domínio natural é todo ℝ.",
    defaultParams: { a: 0.5, b: 0, c: -2 },
    defaultX0: 1.5,
    paramLabels: { a: "Concavidade (a)", b: "Termo linear (b)", c: "Corte em Y (c)" },
  },
  cubic: {
    kind: "cubic",
    name: "Cúbica · Máximos, Mínimos & Inflexão",
    shortTag: "Cúbica",
    unitTag: "Unidade 3 · P2",
    formula: (p) =>
      `f(x) = ${fmtNum(p.a)}x³${p.b !== 0 ? `${fmtTermSign(p.b)}x` : ""}${fmtTermSign(p.c)}`,
    derivFormula: (p) => `f'(x) = ${fmtNum(3 * p.a)}x²${fmtTermSign(p.b)}`,
    antiderivFormula: (p, C) =>
      `F(x) = ${fmtNum(p.a / 4)}x⁴${p.b !== 0 ? `${fmtTermSign(p.b / 2)}x²` : ""}${p.c !== 0 ? `${fmtTermSign(p.c)}x` : ""}${fmtTermSign(C)}`,
    domainLabel: () => "D(f) = ℝ",
    imageLabel: () => "Im(f) = ℝ",
    domainRestriction: () => "Polinômio de grau 3: contínua e derivável em todo ℝ.",
    defaultParams: { a: 0.35, b: -2, c: 0 },
    defaultX0: 1.2,
    paramLabels: { a: "Termo cúbico (a)", b: "Termo linear (b)", c: "Desloc. vertical (c)" },
  },
  sqrt: {
    kind: "sqrt",
    name: "Função Raiz Quadrada (Domínio Natural)",
    shortTag: "Raiz √x",
    unitTag: "Pré-Cálculo",
    formula: (p) => `f(x) = ${fmtNum(p.a)}·√(${fmtShiftX(p.b)})${fmtTermSign(p.c)}`,
    derivFormula: (p) => `f'(x) = ${fmtNum(p.a / 2)} / √(${fmtShiftX(p.b)})`,
    antiderivFormula: (p, C) =>
      `F(x) = ${fmtNum((2 * p.a) / 3)}·(${fmtShiftX(p.b)})^(3/2)${p.c !== 0 ? `${fmtTermSign(p.c)}x` : ""}${fmtTermSign(C)}`,
    domainLabel: (p) => `D(f) = [${fmtNum(p.b)}, +∞[`,
    imageLabel: (p) =>
      p.a >= 0
        ? `Im(f) = [${fmtNum(p.c)}, +∞[`
        : `Im(f) = ]−∞, ${fmtNum(p.c)}]`,
    domainRestriction: (p) =>
      `Domínio Natural: radicando ≥ 0 ⇒ ${fmtShiftX(p.b)} ≥ 0 ⇒ x ≥ ${fmtNum(p.b)}.`,
    defaultParams: { a: 1.5, b: -1, c: -1 },
    defaultX0: 2,
    paramLabels: { a: "Escala vertical (a)", b: "Início do domínio (b)", c: "Desloc. vertical (c)" },
  },
  rational: {
    kind: "rational",
    name: "Função Racional · Assíntotas",
    shortTag: "1 / (x−b)",
    unitTag: "Pré-Cálculo · U1",
    formula: (p) => `f(x) = ${fmtNum(p.a)} / (${fmtShiftX(p.b)})${fmtTermSign(p.c)}`,
    derivFormula: (p) => `f'(x) = ${fmtNum(-p.a)} / (${fmtShiftX(p.b)})²`,
    antiderivFormula: (p, C) =>
      `F(x) = ${fmtNum(p.a)}·ln|${fmtShiftX(p.b)}|${p.c !== 0 ? `${fmtTermSign(p.c)}x` : ""}${fmtTermSign(C)}`,
    domainLabel: (p) => `D_f = ]−∞, ${fmtNum(p.b)}[ ∪ ]${fmtNum(p.b)}, +∞[`,
    imageLabel: (p) => `Im_f = ℝ − { ${fmtNum(p.c)} }`,
    domainRestriction: (p) =>
      `Domínio Natural: denominador ≠ 0 ⇒ x ≠ ${fmtNum(p.b)} (não pode dar 0 embaixo!).`,
    defaultParams: { a: 1, b: 1, c: 0 },
    defaultX0: 2.5,
    paramLabels: { a: "Numerador (a)", b: "Assíntota vertical (b)", c: "Assíntota horizontal (c)" },
  },
  hole_limit: {
    kind: "hole_limit",
    name: "Limite 0/0 · Descontinuidade Removível",
    shortTag: "Limite 0/0",
    unitTag: "Unidade 1 · P1",
    formula: (p) => {
      const b2 = fmtNum(p.b * p.b);
      return `f(x) = (x² − ${b2}) / (${fmtShiftX(p.b)})${fmtTermSign(p.c)}`;
    },
    derivFormula: () => "f'(x) = 1  (para x ≠ b)",
    antiderivFormula: (p, C) =>
      `F(x) = 0.5x²${fmtTermSign(p.b + p.c)}x${fmtTermSign(C)}`,
    domainLabel: (p) => `D(f) = ℝ − { ${fmtNum(p.b)} }`,
    imageLabel: (p) => `Im(f) = ℝ − { ${fmtNum(2 * p.b + p.c)} }`,
    domainRestriction: (p) =>
      `Em x = ${fmtNum(p.b)} dá 0/0 (buraco aberto!), mas lim x→${fmtNum(p.b)} f(x) = ${fmtNum(2 * p.b + p.c)}.`,
    defaultParams: { a: 1, b: 1, c: 0 },
    defaultX0: 1.8,
    paramLabels: { a: "Escala (fixa = 1)", b: "Ponto do buraco (b)", c: "Desloc. vertical (c)" },
  },
  abs: {
    kind: "abs",
    name: "Função Modular · Contínua mas com Bico",
    shortTag: "Modular |x|",
    unitTag: "Pré-Cálculo · U2",
    formula: (p) => `f(x) = ${fmtNum(p.a)}·|${fmtShiftX(p.b)}|${fmtTermSign(p.c)}`,
    derivFormula: (p) => `f'(x) = ±${fmtNum(p.a)}  (não existe em x = ${fmtNum(p.b)})`,
    antiderivFormula: (p, C) =>
      `F(x) = ${fmtNum(p.a / 2)}·(${fmtShiftX(p.b)})·|${fmtShiftX(p.b)}|${fmtTermSign(C)}`,
    domainLabel: () => "D(f) = ℝ",
    imageLabel: (p) =>
      p.a >= 0
        ? `Im(f) = [${fmtNum(p.c)}, +∞[`
        : `Im(f) = ]−∞, ${fmtNum(p.c)}]`,
    domainRestriction: (p) =>
      `Contínua em todo ℝ, porém NÃO derivável no bico x = ${fmtNum(p.b)}!`,
    defaultParams: { a: 1.2, b: 1, c: -1.5 },
    defaultX0: 2.2,
    paramLabels: { a: "Abertura (a)", b: "Vértice X (b)", c: "Vértice Y (c)" },
  },
  exp: {
    kind: "exp",
    name: "Função Exponencial (e^x)",
    shortTag: "Exponencial",
    unitTag: "Pré-Cálculo · U2",
    formula: (p) => `f(x) = ${fmtNum(p.a)}·e^(${fmtNum(p.b)}x)${fmtTermSign(p.c)}`,
    derivFormula: (p) => `f'(x) = ${fmtNum(p.a * p.b)}·e^(${fmtNum(p.b)}x)`,
    antiderivFormula: (p, C) =>
      Math.abs(p.b) < 1e-6
        ? `F(x) = ${fmtNum(p.a + p.c)}x${fmtTermSign(C)}`
        : `F(x) = ${fmtNum(p.a / p.b)}·e^(${fmtNum(p.b)}x)${p.c !== 0 ? `${fmtTermSign(p.c)}x` : ""}${fmtTermSign(C)}`,
    domainLabel: () => "D(f) = ℝ",
    imageLabel: (p) =>
      p.a > 0 ? `Im(f) = ]${fmtNum(p.c)}, +∞[` : `Im(f) = ]−∞, ${fmtNum(p.c)}[`,
    domainRestriction: (p) =>
      `Sempre definida em ℝ; assíntota horizontal em y = ${fmtNum(p.c)}.`,
    defaultParams: { a: 1, b: 0.7, c: 0 },
    defaultX0: 1,
    paramLabels: { a: "Fator inicial (a)", b: "Taxa expoente (b)", c: "Assíntota Y (c)" },
  },
  ln: {
    kind: "ln",
    name: "Logaritmo Natural · ln(x − b)",
    shortTag: "Logaritmo ln",
    unitTag: "Pré-Cálculo · U2",
    formula: (p) => `f(x) = ${fmtNum(p.a)}·ln(${fmtShiftX(p.b)})${fmtTermSign(p.c)}`,
    derivFormula: (p) => `f'(x) = ${fmtNum(p.a)} / (${fmtShiftX(p.b)})`,
    antiderivFormula: (p, C) =>
      `F(x) = ${fmtNum(p.a)}[(${fmtShiftX(p.b)})ln(${fmtShiftX(p.b)}) − x]${fmtTermSign(C)}`,
    domainLabel: (p) => `D(f) = ]${fmtNum(p.b)}, +∞[`,
    imageLabel: () => "Im(f) = ℝ",
    domainRestriction: (p) =>
      `Domínio Natural: logaritmando > 0 (estrito!) ⇒ x > ${fmtNum(p.b)}.`,
    defaultParams: { a: 1.5, b: 0, c: 0 },
    defaultX0: 1.5,
    paramLabels: { a: "Escala (a)", b: "Assíntota X (b)", c: "Desloc. vertical (c)" },
  },
  trig: {
    kind: "trig",
    name: "Trigonométrica · sen(bx)",
    shortTag: "Seno",
    unitTag: "Pré-Cálculo · U2",
    formula: (p) => `f(x) = ${fmtNum(p.a)}·sen(${fmtNum(p.b)}x)${fmtTermSign(p.c)}`,
    derivFormula: (p) => `f'(x) = ${fmtNum(p.a * p.b)}·cos(${fmtNum(p.b)}x)`,
    antiderivFormula: (p, C) =>
      Math.abs(p.b) < 1e-6
        ? `F(x) = ${fmtNum(p.c)}x${fmtTermSign(C)}`
        : `F(x) = ${fmtNum(-p.a / p.b)}·cos(${fmtNum(p.b)}x)${p.c !== 0 ? `${fmtTermSign(p.c)}x` : ""}${fmtTermSign(C)}`,
    domainLabel: () => "D(f) = ℝ",
    imageLabel: (p) =>
      `Im(f) = [${fmtNum(p.c - Math.abs(p.a))}, ${fmtNum(p.c + Math.abs(p.a))}]`,
    domainRestriction: () => "Periódica e infinitamente derivável em todo ℝ.",
    defaultParams: { a: 2, b: 1, c: 0 },
    defaultX0: 1,
    paramLabels: { a: "Amplitude (a)", b: "Frequência (b)", c: "Linha média (c)" },
  },
};

export function evalCalcFn(kind: CalcFnKind, x: number, p: CalcParams): number | null {
  switch (kind) {
    case "constant":
      return p.c;
    case "linear":
      return p.a * x + p.b;
    case "quadratic":
      return p.a * x * x + p.b * x + p.c;
    case "cubic":
      return p.a * x * x * x + p.b * x + p.c;
    case "sqrt": {
      const inner = x - p.b;
      if (inner < -1e-6) return null;
      return p.a * Math.sqrt(Math.max(0, inner)) + p.c;
    }
    case "rational": {
      const denom = x - p.b;
      if (Math.abs(denom) < 0.04) return null;
      return p.a / denom + p.c;
    }
    case "hole_limit": {
      if (Math.abs(x - p.b) < 0.04) return null;
      return x + p.b + p.c;
    }
    case "abs":
      return p.a * Math.abs(x - p.b) + p.c;
    case "exp": {
      const val = p.a * Math.exp(p.b * x) + p.c;
      return Number.isFinite(val) && Math.abs(val) < 1e4 ? val : null;
    }
    case "ln": {
      const inner = x - p.b;
      if (inner <= 0.015) return null;
      return p.a * Math.log(inner) + p.c;
    }
    case "trig":
      return p.a * Math.sin(p.b * x) + p.c;
  }
}

export function evalCalcDeriv(kind: CalcFnKind, x: number, p: CalcParams): number | null {
  switch (kind) {
    case "constant":
      return 0;
    case "linear":
      return p.a;
    case "quadratic":
      return 2 * p.a * x + p.b;
    case "cubic":
      return 3 * p.a * x * x + p.b;
    case "sqrt": {
      const inner = x - p.b;
      if (inner <= 0.02) return null;
      return p.a / (2 * Math.sqrt(inner));
    }
    case "rational": {
      const d = x - p.b;
      if (Math.abs(d) < 0.05) return null;
      return -p.a / (d * d);
    }
    case "hole_limit":
      if (Math.abs(x - p.b) < 0.04) return null;
      return 1;
    case "abs":
      if (Math.abs(x - p.b) < 0.05) return null;
      return x > p.b ? p.a : -p.a;
    case "exp": {
      const val = p.a * p.b * Math.exp(p.b * x);
      return Number.isFinite(val) && Math.abs(val) < 1e4 ? val : null;
    }
    case "ln": {
      const inner = x - p.b;
      if (inner <= 0.02) return null;
      return p.a / inner;
    }
    case "trig":
      return p.a * p.b * Math.cos(p.b * x);
  }
}

export function evalCalcSecondDeriv(
  kind: CalcFnKind,
  x: number,
  p: CalcParams
): number | null {
  switch (kind) {
    case "constant":
    case "linear":
    case "hole_limit":
      return 0;
    case "quadratic":
      return 2 * p.a;
    case "cubic":
      return 6 * p.a * x;
    case "sqrt": {
      const inner = x - p.b;
      if (inner <= 0.03) return null;
      return -p.a / (4 * Math.pow(inner, 1.5));
    }
    case "rational": {
      const d = x - p.b;
      if (Math.abs(d) < 0.06) return null;
      return (2 * p.a) / (d * d * d);
    }
    case "abs":
      return Math.abs(x - p.b) < 0.05 ? null : 0;
    case "exp": {
      const val = p.a * p.b * p.b * Math.exp(p.b * x);
      return Number.isFinite(val) && Math.abs(val) < 1e4 ? val : null;
    }
    case "ln": {
      const inner = x - p.b;
      if (inner <= 0.03) return null;
      return -p.a / (inner * inner);
    }
    case "trig":
      return -p.a * p.b * p.b * Math.sin(p.b * x);
  }
}

export function evalCalcAntideriv(
  kind: CalcFnKind,
  x: number,
  p: CalcParams,
  C: number
): number | null {
  switch (kind) {
    case "constant":
      return p.c * x + C;
    case "linear":
      return 0.5 * p.a * x * x + p.b * x + C;
    case "quadratic":
      return (p.a / 3) * x * x * x + 0.5 * p.b * x * x + p.c * x + C;
    case "cubic":
      return 0.25 * p.a * x * x * x * x + 0.5 * p.b * x * x + p.c * x + C;
    case "sqrt": {
      const inner = x - p.b;
      if (inner < 0) return null;
      return ((2 * p.a) / 3) * Math.pow(inner, 1.5) + p.c * x + C;
    }
    case "rational": {
      const d = Math.abs(x - p.b);
      if (d < 0.04) return null;
      return p.a * Math.log(d) + p.c * x + C;
    }
    case "hole_limit":
      return 0.5 * x * x + (p.b + p.c) * x + C;
    case "abs": {
      const u = x - p.b;
      return 0.5 * p.a * u * Math.abs(u) + p.c * x + C;
    }
    case "exp": {
      if (Math.abs(p.b) < 1e-4) return (p.a + p.c) * x + C;
      const val = (p.a / p.b) * Math.exp(p.b * x) + p.c * x + C;
      return Number.isFinite(val) && Math.abs(val) < 1e4 ? val : null;
    }
    case "ln": {
      const u = x - p.b;
      if (u <= 0.02) return null;
      return p.a * (u * Math.log(u) - u) + p.c * x + C;
    }
    case "trig":
      if (Math.abs(p.b) < 1e-4) return p.c * x + C;
      return (-p.a / p.b) * Math.cos(p.b * x) + p.c * x + C;
  }
}

export function evalCalcInverse(
  kind: CalcFnKind,
  x: number,
  p: CalcParams
): number | null {
  switch (kind) {
    case "linear":
      return Math.abs(p.a) < 1e-4 ? null : (x - p.b) / p.a;
    case "sqrt": {
      if (Math.abs(p.a) < 1e-4) return null;
      const u = (x - p.c) / p.a;
      if (u < 0) return null;
      return u * u + p.b;
    }
    case "exp": {
      if (Math.abs(p.a) < 1e-4 || Math.abs(p.b) < 1e-4) return null;
      const u = (x - p.c) / p.a;
      if (u <= 0.02) return null;
      return Math.log(u) / p.b;
    }
    case "ln": {
      if (Math.abs(p.a) < 1e-4) return null;
      const val = Math.exp((x - p.c) / p.a) + p.b;
      return Number.isFinite(val) && Math.abs(val) < 1e4 ? val : null;
    }
    case "rational": {
      const denom = x - p.c;
      if (Math.abs(denom) < 0.04) return null;
      return p.a / denom + p.b;
    }
    default:
      return null;
  }
}

export function findRootsInRange(
  kind: CalcFnKind,
  p: CalcParams,
  minX = -6,
  maxX = 6
): number[] {
  const roots: number[] = [];
  const steps = 240;
  const dx = (maxX - minX) / steps;
  let prevX = minX;
  let prevY = evalCalcFn(kind, prevX, p);

  for (let i = 1; i <= steps; i++) {
    const curX = minX + i * dx;
    const curY = evalCalcFn(kind, curX, p);
    if (curY !== null && Math.abs(curY) < 0.02) {
      if (!roots.some((r) => Math.abs(r - curX) < 0.15)) {
        roots.push(Math.round(curX * 100) / 100);
      }
    } else if (
      prevY !== null &&
      curY !== null &&
      prevY * curY < 0 &&
      Math.abs(curY - prevY) < 8
    ) {
      // Bisection refinement
      let lo = prevX;
      let hi = curX;
      let yLo = prevY;
      for (let k = 0; k < 14; k++) {
        const mid = (lo + hi) / 2;
        const yMid = evalCalcFn(kind, mid, p);
        if (yMid === null) break;
        if (yLo * yMid <= 0) {
          hi = mid;
        } else {
          lo = mid;
          yLo = yMid;
        }
      }
      const root = Math.round(((lo + hi) / 2) * 100) / 100;
      if (!roots.some((r) => Math.abs(r - root) < 0.12)) {
        roots.push(root);
      }
    }
    prevX = curX;
    prevY = curY;
  }
  return roots;
}

export function findCriticalPointsInRange(
  kind: CalcFnKind,
  p: CalcParams,
  minX = -5.5,
  maxX = 5.5
): Array<{ x: number; y: number; kind: "max" | "min" | "inflection" }> {
  const pts: Array<{ x: number; y: number; kind: "max" | "min" | "inflection" }> = [];
  if (kind === "quadratic" && Math.abs(p.a) > 1e-4) {
    const xv = -p.b / (2 * p.a);
    const yv = evalCalcFn(kind, xv, p);
    if (yv !== null && xv >= minX && xv <= maxX) {
      pts.push({ x: xv, y: yv, kind: p.a > 0 ? "min" : "max" });
    }
    return pts;
  }
  if (kind === "cubic" && Math.abs(p.a) > 1e-4) {
    const val = -p.b / (3 * p.a);
    if (val > 0) {
      const r = Math.sqrt(val);
      for (const x of [-r, r]) {
        const y = evalCalcFn(kind, x, p);
        const d2 = evalCalcSecondDeriv(kind, x, p);
        if (y !== null && d2 !== null && x >= minX && x <= maxX) {
          pts.push({ x, y, kind: d2 > 0 ? "min" : "max" });
        }
      }
    }
    const yInf = evalCalcFn(kind, 0, p);
    if (yInf !== null) pts.push({ x: 0, y: yInf, kind: "inflection" });
    return pts;
  }
  if (kind === "abs") {
    const yv = evalCalcFn(kind, p.b, p);
    if (yv !== null && p.b >= minX && p.b <= maxX) {
      pts.push({ x: p.b, y: yv, kind: p.a >= 0 ? "min" : "max" });
    }
  }
  return pts;
}

export interface CalcPreset {
  id: string;
  label: string;
  badge: string;
  description: string;
  state: CalcLabState;
}

export const DEFAULT_CALC_LAB_STATE: CalcLabState = {
  subMode: "graph",
  kind: "quadratic",
  params: { a: 0.5, b: 0, c: -2 },
  x0: 2,
  h: 1.5,
  showDomainImage: true,
  showRoots: true,
  showTangent: false,
  showSecant: false,
  showDerivative: false,
  showSecondDeriv: false,
  showInverse: false,
  showAntideriv: false,
  antiderivC: 0,
};

export const CALC_PRESETS: CalcPreset[] = [
  {
    id: "caderno-ex1-sqrt",
    label: "Caderno Ex 1: √x",
    badge: "Domínio Natural",
    description: "Ex 1 da aula: f(x) = √x tem D_f = { x ∈ ℝ | x ≥ 0 } = [0, +∞[.",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "sqrt",
      params: { a: 1, b: 0, c: 0 },
      x0: 4,
      showDomainImage: true,
      showRoots: true,
    },
  },
  {
    id: "caderno-ex2-rational",
    label: "Caderno Ex 2: 1/(x−1)",
    badge: "Domínio Natural",
    description: "Ex 2 da aula: denominador ≠ 0 ⇒ D_f = ]−∞, 1[ ∪ ]1, +∞[.",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "rational",
      params: { a: 1, b: 1, c: 0 },
      x0: 2,
      showDomainImage: true,
      showRoots: false,
    },
  },
  {
    id: "caderno-afim",
    label: "Afim: tg α = Δy/Δx = a",
    badge: "Funções Elementares",
    description: "Função Afim f(x) = ax + b (a ≠ 0): inclinação tg α = a, raiz x = −b/a e prova de Im_f = ℝ.",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "linear",
      params: { a: 1, b: 1, c: 0 },
      x0: 1,
      showDomainImage: true,
      showRoots: true,
    },
  },
  {
    id: "caderno-constante",
    label: "Constante: f(x) = c",
    badge: "Funções Elementares",
    description: "Item 0 do caderno: f: ℝ → ℝ constante com D_f = ℝ e Im_f = { c }.",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "constant",
      params: { a: 0, b: 0, c: 2 },
      x0: 1.5,
      showDomainImage: true,
      showRoots: false,
    },
  },
  {
    id: "caderno-ineq-quad",
    label: "x² + x − 2 ≥ 0 (Fatorada)",
    badge: "Desigualdades",
    description: "Parábola (x+2)(x−1): positiva (≥ 0) em ]−∞, −2] ∪ [1, +∞[!",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "quadratic",
      params: { a: 1, b: 1, c: -2 },
      x0: 1,
      showDomainImage: true,
      showRoots: true,
    },
  },
  {
    id: "precalc-inverse",
    label: "Inversa: e^x ⇄ ln(x)",
    badge: "Ementa 1.3",
    description: "Função exponencial e sua inversa espelhadas perfeitamente na reta y = x.",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "exp",
      params: { a: 1, b: 0.8, c: 0 },
      x0: 1,
      showDomainImage: false,
      showRoots: false,
      showInverse: true,
    },
  },
  {
    id: "u1-limit-hole",
    label: "Limite 0/0 (Buraco)",
    badge: "Unidade 1 · P1",
    description: "(x² − 1)/(x − 1) não existe em x = 1, mas o limite lateral tende a L = 2!",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "hole_limit",
      params: { a: 1, b: 1, c: 0 },
      x0: 1.6,
      showDomainImage: true,
      showRoots: true,
    },
  },
  {
    id: "u2-secant-tangent",
    label: "Derivada: Secante → Tangente",
    badge: "Unidade 2 · P2",
    description: "Aproxime h → 0 e veja a reta secante virar a reta tangente em x₀!",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "quadratic",
      params: { a: 0.5, b: 0, c: -1 },
      x0: 1.5,
      h: 2.0,
      showDomainImage: false,
      showRoots: false,
      showSecant: true,
      showTangent: true,
    },
  },
  {
    id: "u3-extrema-inflection",
    label: "Máx, Mín & Inflexão",
    badge: "Unidade 3 · P2",
    description: "Cúbica com f'(x) = 0 nos pontos críticos e f''(x) = 0 no ponto de inflexão.",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "cubic",
      params: { a: 0.35, b: -2, c: 0 },
      x0: 1.4,
      showDomainImage: false,
      showRoots: true,
      showDerivative: true,
    },
  },
  {
    id: "u4-antideriv",
    label: "Integral Indefinida + C",
    badge: "Unidade 4 · P3",
    description: "Família de primitivas F(x) + C variando o deslocamento vertical C.",
    state: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "linear",
      params: { a: 1, b: 0, c: 0 },
      x0: 2,
      showDomainImage: false,
      showRoots: false,
      showAntideriv: true,
      antiderivC: -1.5,
    },
  },
];

export function getCalcPreset(id: string): CalcLabState {
  const found = CALC_PRESETS.find((p) => p.id === id);
  return found ? { ...found.state } : { ...DEFAULT_CALC_LAB_STATE };
}
