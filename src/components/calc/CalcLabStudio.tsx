"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CALC_FUNCTIONS,
  CALC_PRESETS,
  CalcFnKind,
  CalcLabState,
  CalcLabSubMode,
  evalCalcAntideriv,
  evalCalcDeriv,
  evalCalcFn,
  evalCalcInverse,
  evalCalcSecondDeriv,
  findCriticalPointsInRange,
  findRootsInRange,
  fmtNum,
  fmtSigned,
} from "@/lib/calc-math";
import { ProfessorAvatar } from "@/components/ProfessorAvatar";
import { TtsModelTier, VoiceState } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Layers,
  Pause,
  Play,
  RotateCcw,
  TrendingUp,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";

interface CalcLabStudioProps {
  state: CalcLabState;
  setState: React.Dispatch<React.SetStateAction<CalcLabState>>;
  dark: boolean;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
  ttsModelTier: TtsModelTier;
}

const VIEW_W = 680;
const VIEW_H = 440;
const X_MIN = -6;
const X_MAX = 6;
const Y_MIN = -4.5;
const Y_MAX = 4.5;

function toSvgX(x: number): number {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * VIEW_W;
}

function toSvgY(y: number): number {
  return VIEW_H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * VIEW_H;
}

function fromSvgX(px: number, width: number): number {
  return X_MIN + (px / Math.max(1, width)) * (X_MAX - X_MIN);
}

function buildCurvePaths(
  evalFn: (x: number) => number | null,
  steps = 320
): string[] {
  const segments: string[] = [];
  let current: string[] = [];
  let prevY: number | null = null;

  for (let i = 0; i <= steps; i++) {
    const x = X_MIN + (i / steps) * (X_MAX - X_MIN);
    const y = evalFn(x);
    const valid =
      y !== null && Number.isFinite(y) && y >= Y_MIN - 2 && y <= Y_MAX + 2;
    const hugeJump = prevY !== null && y !== null && Math.abs(y - prevY) > 4.5;

    if (!valid || hugeJump) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
      prevY = valid ? y : null;
      if (valid && y !== null) {
        current.push(`M ${toSvgX(x).toFixed(1)} ${toSvgY(y).toFixed(1)}`);
      }
      continue;
    }

    const cmd = current.length === 0 ? "M" : "L";
    current.push(`${cmd} ${toSvgX(x).toFixed(1)} ${toSvgY(y!).toFixed(1)}`);
    prevY = y;
  }
  if (current.length > 1) segments.push(current.join(" "));
  return segments;
}

const ARROW_CASES = {
  bijective: {
    id: "bijective" as const,
    title: "f(x) = x + 1 (Função Bijetora)",
    valid: true,
    ruleLabel: "Regra: f(x) = x + 1",
    domain: [-1, 0, 1, 2],
    codomain: [0, 1, 2, 3],
    arrows: [
      { from: 0, to: 0 },
      { from: 1, to: 1 },
      { from: 2, to: 2 },
      { from: 3, to: 3 },
    ],
    explanation:
      "É FUNÇÃO! Todo elemento do domínio A dispara exatamente 1 flecha, e toda a chegada B é atingida (Im(f) = B).",
  },
  quadratic: {
    id: "quadratic" as const,
    title: "f(x) = x² (Imagem ⊂ Contradomínio)",
    valid: true,
    ruleLabel: "Regra: f(x) = x²",
    domain: [-2, -1, 0, 1, 2],
    codomain: [0, 1, 2, 4, 5],
    arrows: [
      { from: 0, to: 3 },
      { from: 1, to: 1 },
      { from: 2, to: 0 },
      { from: 3, to: 1 },
      { from: 4, to: 3 },
    ],
    explanation:
      "É FUNÇÃO! Dois valores distintos de A (−2 e +2) podem apontar para o mesmo y = 4, e podem sobrar elementos em B (2 e 5) fora da Imagem Im(f) = {0, 1, 4}.",
  },
  missing: {
    id: "missing" as const,
    title: "Falta flecha em A (NÃO é função!)",
    valid: false,
    ruleLabel: "Viola a EXISTÊNCIA",
    domain: [-1, 0, 1, 2],
    codomain: [0, 1, 2, 3],
    arrows: [
      { from: 0, to: 0 },
      { from: 1, to: 1 },
      { from: 3, to: 3 },
    ],
    explanation:
      "NÃO É FUNÇÃO! O elemento x = 1 do domínio A ficou sem flecha (sem imagem). Na definição, TODO x ∈ A precisa de destino!",
  },
  ambiguous: {
    id: "ambiguous" as const,
    title: "2 flechas do mesmo x (NÃO é função!)",
    valid: false,
    ruleLabel: "Viola a UNICIDADE",
    domain: [0, 1, 4],
    codomain: [-2, -1, 0, 1, 2],
    arrows: [
      { from: 0, to: 2 },
      { from: 1, to: 1 },
      { from: 1, to: 3 },
      { from: 2, to: 0 },
      { from: 2, to: 4 },
    ],
    explanation:
      "NÃO É FUNÇÃO! Os valores x = 1 e x = 4 disparam DUAS flechas cada (±√x). Em função real, cada entrada só pode ter UMA única saída!",
  },
};

const NUMBER_SAMPLES = [
  { label: "3", value: 3, sets: ["ℕ", "ℤ", "ℚ", "ℝ"], note: "Natural positivo: pertence a ℕ, ℤ, ℚ e ℝ." },
  { label: "0", value: 0, sets: ["ℤ", "ℚ", "ℝ"], note: "Inteiro nulo (alguns livros incluem em ℕ₀); pertence a ℤ, ℚ e ℝ." },
  { label: "−4", value: -4, sets: ["ℤ", "ℚ", "ℝ"], note: "Inteiro negativo: está em ℤ, ℚ (−4/1) e ℝ, mas NÃO em ℕ." },
  { label: "1/2", value: 0.5, sets: ["ℚ", "ℝ"], note: "Fração a/b (b ≠ 0): é Racional (ℚ) e Real (ℝ), mas NÃO é inteiro (ℤ)!" },
  { label: "√2", value: Math.SQRT2, sets: ["𝕀", "ℝ"], note: "Irracional (≈ 1,4142...): não vira fração a/b; mora em 𝕀 e completa ℝ." },
  { label: "π", value: Math.PI, sets: ["𝕀", "ℝ"], note: "Irracional transcendente (≈ 3,14159...): está em 𝕀 e na reta real ℝ." },
];

export function CalcLabStudio({
  state,
  setState,
  dark,
  voice,
  voiceRate,
  customApiKey,
  ttsModelTier,
}: CalcLabStudioProps) {
  const subMode: CalcLabSubMode = state.subMode ?? "graph";
  const meta = CALC_FUNCTIONS[state.kind];
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [animatingH, setAnimatingH] = useState(false);
  const [selectedArrowIdx, setSelectedArrowIdx] = useState<number | null>(null);
  const [selectedNumIdx, setSelectedNumIdx] = useState(3); // starts on 1/2 to reinforce ℚ vs ℤ!
  const [ineqA, setIneqA] = useState(-2);
  const [ineqB, setIneqB] = useState(4);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const intervalState = state.intervalPreset ?? {
    a1: -2,
    b1: 3,
    closedA1: true,
    closedB1: true,
    a2: 0,
    b2: 4,
    closedA2: false,
    closedB2: true,
    op: "intersection" as const,
  };

  const setIntervalState = (
    patch: Partial<NonNullable<CalcLabState["intervalPreset"]>>
  ) => {
    setState((prev) => ({
      ...prev,
      intervalPreset: {
        ...(prev.intervalPreset ?? intervalState),
        ...patch,
      },
    }));
  };

  // Smooth h -> 0.05 secant-to-tangent animation
  useEffect(() => {
    if (!animatingH) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setState((prev) => {
        const nextH = prev.h - dt * 1.1;
        if (nextH <= 0.05) {
          setAnimatingH(false);
          return { ...prev, h: 0.05, showSecant: true, showTangent: true };
        }
        return { ...prev, h: Math.round(nextH * 100) / 100 };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animatingH, setState]);

  const fPaths = useMemo(
    () => buildCurvePaths((x) => evalCalcFn(state.kind, x, state.params)),
    [state.kind, state.params]
  );

  const d1Paths = useMemo(
    () =>
      state.showDerivative
        ? buildCurvePaths((x) => evalCalcDeriv(state.kind, x, state.params))
        : [],
    [state.kind, state.params, state.showDerivative]
  );

  const d2Paths = useMemo(
    () =>
      state.showSecondDeriv
        ? buildCurvePaths((x) => evalCalcSecondDeriv(state.kind, x, state.params))
        : [],
    [state.kind, state.params, state.showSecondDeriv]
  );

  const invPaths = useMemo(
    () =>
      state.showInverse
        ? buildCurvePaths((x) => evalCalcInverse(state.kind, x, state.params))
        : [],
    [state.kind, state.params, state.showInverse]
  );

  const antiPaths = useMemo(
    () =>
      state.showAntideriv
        ? buildCurvePaths((x) =>
            evalCalcAntideriv(state.kind, x, state.params, state.antiderivC)
          )
        : [],
    [state.kind, state.params, state.showAntideriv, state.antiderivC]
  );

  const roots = useMemo(
    () => findRootsInRange(state.kind, state.params, X_MIN, X_MAX),
    [state.kind, state.params]
  );

  const criticals = useMemo(
    () => findCriticalPointsInRange(state.kind, state.params, X_MIN + 0.5, X_MAX - 0.5),
    [state.kind, state.params]
  );

  const y0 = evalCalcFn(state.kind, state.x0, state.params);
  const dy0 = evalCalcDeriv(state.kind, state.x0, state.params);
  const d2y0 = evalCalcSecondDeriv(state.kind, state.x0, state.params);
  const x1 = state.x0 + state.h;
  const y1 = evalCalcFn(state.kind, x1, state.params);
  const secantSlope =
    y0 !== null && y1 !== null && Math.abs(state.h) > 1e-4
      ? (y1 - y0) / state.h
      : null;

  const hoverY = hoverX !== null ? evalCalcFn(state.kind, hoverX, state.params) : null;

  // Domain visual range on X axis
  const domainRange = useMemo((): [number, number] => {
    if (state.kind === "sqrt") return [Math.max(X_MIN, state.params.b), X_MAX];
    if (state.kind === "ln") return [Math.max(X_MIN, state.params.b + 0.06), X_MAX];
    return [X_MIN, X_MAX];
  }, [state.kind, state.params.b]);

  // Visible image range on Y axis sampled over visible domain
  const imageRange = useMemo((): [number, number] | null => {
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i <= 120; i++) {
      const x = domainRange[0] + (i / 120) * (domainRange[1] - domainRange[0]);
      const y = evalCalcFn(state.kind, x, state.params);
      if (y !== null && Number.isFinite(y)) {
        const clamped = Math.max(Y_MIN, Math.min(Y_MAX, y));
        if (clamped < minY) minY = clamped;
        if (clamped > maxY) maxY = clamped;
      }
    }
    return Number.isFinite(minY) ? [minY, maxY] : null;
  }, [domainRange, state.kind, state.params]);

  const speakId = `calc-lab-${state.kind}`;
  const isSpeaking = voice.speakingId === speakId;
  const buildNarration = () => {
    const rText =
      roots.length > 0
        ? `As raízes visíveis no eixo X são ${roots.map(fmtNum).join(" e ")}.`
        : "Não há raízes reais neste trecho do eixo X.";
    return `Estamos visualizando ${meta.name}: ${meta.formula(state.params)}. ${meta.domainRestriction(state.params)} ${rText} No ponto x igual a ${fmtNum(state.x0)}, ${
      y0 !== null ? `f de x vale ${fmtNum(y0)}` : "a função não está definida"
    }${dy0 !== null ? ` e a inclinação da tangente, derivada f linha, vale ${fmtNum(dy0)}.` : "."}`;
  };

  const arrowCase = ARROW_CASES[state.arrowCaseId ?? "quadratic"];

  // Compute exact interval intersection/union/difference on [-5, 5]
  const intervalResult = useMemo(() => {
    const xLo = Math.min(intervalState.a1, intervalState.b1);
    const xHi = Math.max(intervalState.a1, intervalState.b1);
    const yLo = Math.min(intervalState.a2, intervalState.b2);
    const yHi = Math.max(intervalState.a2, intervalState.b2);
    const cXLo = intervalState.a1 <= intervalState.b1 ? intervalState.closedA1 : intervalState.closedB1;
    const cXHi = intervalState.a1 <= intervalState.b1 ? intervalState.closedB1 : intervalState.closedA1;
    const cYLo = intervalState.a2 <= intervalState.b2 ? intervalState.closedA2 : intervalState.closedB2;
    const cYHi = intervalState.a2 <= intervalState.b2 ? intervalState.closedB2 : intervalState.closedA2;

    const fmtBracket = (lo: number, hi: number, cLo: boolean, cHi: boolean) =>
      `${cLo ? "[" : "]"}${fmtNum(lo)}, ${fmtNum(hi)}${cHi ? "]" : "["}`;

    const xLabel = fmtBracket(xLo, xHi, cXLo, cXHi);
    const yLabel = fmtBracket(yLo, yHi, cYLo, cYHi);

    if (intervalState.op === "intersection") {
      const lo = Math.max(xLo, yLo);
      const hi = Math.min(xHi, yHi);
      const cLo = xLo > yLo ? cXLo : yLo > xLo ? cYLo : cXLo && cYLo;
      const cHi = xHi < yHi ? cXHi : yHi < xHi ? cYHi : cXHi && cYHi;
      const empty = lo > hi || (lo === hi && !(cLo && cHi));
      return {
        xLabel,
        yLabel,
        title: "Interseção (X ∩ Y)",
        empty,
        segments: empty ? [] : [{ lo, hi, cLo, cHi }],
        notation: empty
          ? "∅ (Conjunto vazio — sem sobreposição!)"
          : `${fmtBracket(lo, hi, cLo, cHi)} = { x ∈ ℝ / ${fmtNum(lo)} ${cLo ? "≤" : "<"} x ${cHi ? "≤" : "<"} ${fmtNum(hi)} }`,
      };
    }

    if (intervalState.op === "union") {
      const disjoint =
        xHi < yLo ||
        yHi < xLo ||
        (xHi === yLo && !cXHi && !cYLo) ||
        (yHi === xLo && !cYHi && !cXLo);
      if (disjoint) {
        const first = xLo < yLo ? { lo: xLo, hi: xHi, cLo: cXLo, cHi: cXHi } : { lo: yLo, hi: yHi, cLo: cYLo, cHi: cYHi };
        const second = xLo < yLo ? { lo: yLo, hi: yHi, cLo: cYLo, cHi: cYHi } : { lo: xLo, hi: xHi, cLo: cXLo, cHi: cXHi };
        return {
          xLabel,
          yLabel,
          title: "União (X ∪ Y)",
          empty: false,
          segments: [first, second],
          notation: `${fmtBracket(first.lo, first.hi, first.cLo, first.cHi)} ∪ ${fmtBracket(second.lo, second.hi, second.cLo, second.cHi)}`,
        };
      }
      const lo = Math.min(xLo, yLo);
      const hi = Math.max(xHi, yHi);
      const cLo = xLo < yLo ? cXLo : yLo < xLo ? cYLo : cXLo || cYLo;
      const cHi = xHi > yHi ? cXHi : yHi > xHi ? cYHi : cXHi || cYHi;
      return {
        xLabel,
        yLabel,
        title: "União (X ∪ Y)",
        empty: false,
        segments: [{ lo, hi, cLo, cHi }],
        notation: `${fmtBracket(lo, hi, cLo, cHi)} = { x ∈ ℝ / ${fmtNum(lo)} ${cLo ? "≤" : "<"} x ${cHi ? "≤" : "<"} ${fmtNum(hi)} }`,
      };
    }

    // Difference X - Y
    const segs: Array<{ lo: number; hi: number; cLo: boolean; cHi: boolean }> = [];
    if (xLo < yLo || (xLo === yLo && cXLo && !cYLo)) {
      const hi = Math.min(xHi, yLo);
      const cHi = xHi < yLo ? cXHi : !cYLo;
      segs.push({ lo: xLo, hi, cLo: cXLo, cHi });
    }
    if (xHi > yHi || (xHi === yHi && cXHi && !cYHi)) {
      const lo = Math.max(xLo, yHi);
      const cLo = xLo > yHi ? cXLo : !cYHi;
      segs.push({ lo, hi: xHi, cLo, cHi: cXHi });
    }
    return {
      xLabel,
      yLabel,
      title: "Diferença (X − Y)",
      empty: segs.length === 0,
      segments: segs,
      notation:
        segs.length === 0
          ? "∅ (Todo X está contido em Y)"
          : segs.map((s) => fmtBracket(s.lo, s.hi, s.cLo, s.cHi)).join(" ∪ "),
    };
  }, [intervalState]);

  const axisColor = dark ? "#94A3B8" : "#334155";
  const gridColor = dark ? "rgba(148,163,184,0.14)" : "rgba(15,23,42,0.09)";

  return (
    <div className="space-y-4">
      {/* Sub-Mode Switcher for Cálculo 1 Lab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-paper-200/80 dark:bg-blueprint-900 border border-paper-300 dark:border-blueprint-700">
        {(
          [
            {
              id: "graph" as const,
              icon: TrendingUp,
              title: "Gráfico de Funções (Gr_f)",
              sub: "Domínio, Raízes, Limites, Tangente & Integral",
            },
            {
              id: "arrows" as const,
              icon: GitBranch,
              title: "Diagrama de Flechas (A → B)",
              sub: "Pré-Cálculo · Domínio, Contradomínio & Imagem",
            },
            {
              id: "intervals" as const,
              icon: Layers,
              title: "Reta Real, Intervalos & Conjuntos",
              sub: "Pré-Cálculo · ℕ⊂ℤ⊂ℚ⊂ℝ, [a,b], Venn & Inequação",
            },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = subMode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sfx.click();
                setState((prev) => ({ ...prev, subMode: item.id }));
              }}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition ${
                active
                  ? "bg-paper-50 dark:bg-blueprint-800 shadow-sm ring-1 ring-ink-900/10 dark:ring-sky-400/30"
                  : "hover:bg-paper-50/50 dark:hover:bg-blueprint-800/50 opacity-80 hover:opacity-100"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  active
                    ? "bg-ink-900 text-paper-50 dark:bg-sky-500 dark:text-blueprint-950"
                    : "bg-paper-100 dark:bg-blueprint-950 text-ph dark:text-sky-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-ink-900 dark:text-white truncate">
                  {item.title}
                </div>
                <div className="text-[10.5px] text-ink-500 dark:text-slate-400 truncate">
                  {item.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ================== SUB-MODE 1: INTERACTIVE FUNCTION GRAPH ================== */}
      {subMode === "graph" && (
        <div className="space-y-4">
          {/* Quick Presets Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CALC_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  sfx.click();
                  setAnimatingH(false);
                  setState({ ...preset.state });
                }}
                className="shrink-0 px-3 py-1.5 rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 hover:border-ph text-left transition"
              >
                <div className="text-[9.5px] font-mono font-extrabold text-ph dark:text-sky-400">
                  {preset.badge}
                </div>
                <div className="text-xs font-bold text-ink-900 dark:text-white">
                  {preset.label}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-4 items-start">
            {/* LEFT: Interactive Cartesian Plane */}
            <div className="space-y-3">
              <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-950 p-3 sm:p-4 shadow-draft space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div>
                    <div className="text-[10.5px] font-mono font-extrabold text-ph dark:text-sky-400">
                      {meta.unitTag} · {meta.name}
                    </div>
                    <div className="font-mono text-sm sm:text-base font-extrabold text-ink-900 dark:text-white">
                      {meta.formula(state.params)}
                    </div>
                  </div>
                  <div className="font-mono text-xs px-2.5 py-1 rounded-xl bg-paper-100 dark:bg-blueprint-900 border border-paper-300/80 dark:border-blueprint-700 text-ink-700 dark:text-slate-200">
                    {hoverX !== null
                      ? `Cursor: (${fmtNum(hoverX)}; ${hoverY !== null ? fmtNum(hoverY) : "∄"})`
                      : `x₀ = ${fmtNum(state.x0)} → f(x₀) = ${y0 !== null ? fmtNum(y0) : "∄"}`}
                  </div>
                </div>

                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  className="w-full h-auto rounded-2xl border border-paper-300/80 dark:border-blueprint-800 bg-paper-100/70 dark:bg-[#08101E] touch-none cursor-crosshair select-none"
                  onPointerMove={(event) => {
                    const rect = svgRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = fromSvgX(event.clientX - rect.left, rect.width);
                    setHoverX(Math.max(X_MIN, Math.min(X_MAX, Math.round(x * 10) / 10)));
                  }}
                  onPointerLeave={() => setHoverX(null)}
                  onClick={(event) => {
                    const rect = svgRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const x = fromSvgX(event.clientX - rect.left, rect.width);
                    const snapped = Math.max(-5, Math.min(5, Math.round(x * 4) / 4));
                    sfx.tick();
                    setState((prev) => ({ ...prev, x0: snapped }));
                  }}
                >
                  {/* Grid */}
                  {Array.from({ length: X_MAX - X_MIN + 1 }, (_, i) => X_MIN + i).map((gx) => (
                    <g key={`gx-${gx}`}>
                      <line x1={toSvgX(gx)} y1={0} x2={toSvgX(gx)} y2={VIEW_H} stroke={gridColor} strokeWidth="1" />
                      {gx !== 0 && (
                        <text
                          x={toSvgX(gx)}
                          y={toSvgY(0) + 14}
                          textAnchor="middle"
                          fontSize="10"
                          fill={axisColor}
                          opacity="0.7"
                          fontFamily="var(--font-mono), monospace"
                        >
                          {gx}
                        </text>
                      )}
                    </g>
                  ))}
                  {Array.from({ length: 9 }, (_, i) => -4 + i).map((gy) => (
                    <g key={`gy-${gy}`}>
                      <line x1={0} y1={toSvgY(gy)} x2={VIEW_W} y2={toSvgY(gy)} stroke={gridColor} strokeWidth="1" />
                      {gy !== 0 && (
                        <text
                          x={toSvgX(0) - 8}
                          y={toSvgY(gy) + 3.5}
                          textAnchor="end"
                          fontSize="10"
                          fill={axisColor}
                          opacity="0.7"
                          fontFamily="var(--font-mono), monospace"
                        >
                          {gy}
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Axes X and Y */}
                  <line x1={0} y1={toSvgY(0)} x2={VIEW_W} y2={toSvgY(0)} stroke={axisColor} strokeWidth="1.8" />
                  <line x1={toSvgX(0)} y1={0} x2={toSvgX(0)} y2={VIEW_H} stroke={axisColor} strokeWidth="1.8" />
                  <text x={VIEW_W - 14} y={toSvgY(0) - 8} fontSize="12" fontWeight="800" fill={axisColor} fontFamily="var(--font-mono), monospace">x</text>
                  <text x={toSvgX(0) + 10} y={16} fontSize="12" fontWeight="800" fill={axisColor} fontFamily="var(--font-mono), monospace">y</text>

                  {/* Domain & Image Projections on Axes (mirroring the student's notebook!) */}
                  {state.showDomainImage && (
                    <g>
                      <line
                        x1={toSvgX(domainRange[0])}
                        y1={toSvgY(0)}
                        x2={toSvgX(domainRange[1])}
                        y2={toSvgY(0)}
                        stroke="#0EA5E9"
                        strokeWidth="6"
                        strokeOpacity="0.45"
                        strokeLinecap="round"
                      />
                      {imageRange && (
                        <line
                          x1={toSvgX(0)}
                          y1={toSvgY(imageRange[0])}
                          x2={toSvgX(0)}
                          y2={toSvgY(imageRange[1])}
                          stroke="#14B8A6"
                          strokeWidth="6"
                          strokeOpacity="0.45"
                          strokeLinecap="round"
                        />
                      )}
                      {y0 !== null && (
                        <g opacity="0.75">
                          <line
                            x1={toSvgX(state.x0)}
                            y1={toSvgY(0)}
                            x2={toSvgX(state.x0)}
                            y2={toSvgY(y0)}
                            stroke="#0EA5E9"
                            strokeDasharray="4 4"
                            strokeWidth="1.5"
                          />
                          <line
                            x1={toSvgX(0)}
                            y1={toSvgY(y0)}
                            x2={toSvgX(state.x0)}
                            y2={toSvgY(y0)}
                            stroke="#14B8A6"
                            strokeDasharray="4 4"
                            strokeWidth="1.5"
                          />
                        </g>
                      )}
                    </g>
                  )}

                  {/* Vertical Asymptote for rational / ln */}
                  {(state.kind === "rational" || state.kind === "ln") && (
                    <line
                      x1={toSvgX(state.params.b)}
                      y1={0}
                      x2={toSvgX(state.params.b)}
                      y2={VIEW_H}
                      stroke="#EF4444"
                      strokeDasharray="6 5"
                      strokeWidth="1.8"
                      opacity="0.75"
                    />
                  )}
                  {(state.kind === "rational" || state.kind === "exp") && (
                    <line
                      x1={0}
                      y1={toSvgY(state.params.c)}
                      x2={VIEW_W}
                      y2={toSvgY(state.params.c)}
                      stroke="#F59E0B"
                      strokeDasharray="5 5"
                      strokeWidth="1.4"
                      opacity="0.6"
                    />
                  )}

                  {/* Inverse y = x mirror & f^-1(x) */}
                  {state.showInverse && (
                    <g>
                      <line
                        x1={toSvgX(X_MIN)}
                        y1={toSvgY(X_MIN)}
                        x2={toSvgX(X_MAX)}
                        y2={toSvgY(X_MAX)}
                        stroke="#94A3B8"
                        strokeDasharray="5 5"
                        strokeWidth="1.5"
                      />
                      {invPaths.map((d, i) => (
                        <path key={`inv-${i}`} d={d} fill="none" stroke="#A855F7" strokeWidth="2.5" strokeDasharray="6 4" />
                      ))}
                    </g>
                  )}

                  {/* Antiderivative F(x) + C */}
                  {state.showAntideriv &&
                    antiPaths.map((d, i) => (
                      <path key={`anti-${i}`} d={d} fill="none" stroke="#10B981" strokeWidth="2.6" strokeDasharray="7 4" />
                    ))}

                  {/* Derivative f'(x) & f''(x) */}
                  {state.showDerivative &&
                    d1Paths.map((d, i) => (
                      <path key={`d1-${i}`} d={d} fill="none" stroke="#F97316" strokeWidth="2.2" strokeDasharray="5 4" />
                    ))}
                  {state.showSecondDeriv &&
                    d2Paths.map((d, i) => (
                      <path key={`d2-${i}`} d={d} fill="none" stroke="#EC4899" strokeWidth="1.8" strokeDasharray="3 4" />
                    ))}

                  {/* Main Function Curve f(x) */}
                  {fPaths.map((d, i) => (
                    <path
                      key={`f-${i}`}
                      d={d}
                      fill="none"
                      stroke={dark ? "#38BDF8" : "#1E56A0"}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  ))}

                  {/* Open circle hole for 0/0 Limit! */}
                  {state.kind === "hole_limit" && (
                    <g>
                      <circle
                        cx={toSvgX(state.params.b)}
                        cy={toSvgY(2 * state.params.b + state.params.c)}
                        r="6.5"
                        fill={dark ? "#08101E" : "#FAF8F3"}
                        stroke="#EF4444"
                        strokeWidth="2.6"
                      />
                      <text
                        x={toSvgX(state.params.b) + 12}
                        y={toSvgY(2 * state.params.b + state.params.c) - 10}
                        fontSize="11"
                        fontWeight="800"
                        fill="#EF4444"
                        fontFamily="var(--font-mono), monospace"
                      >
                        Buraco 0/0 → L = {fmtNum(2 * state.params.b + state.params.c)}
                      </text>
                    </g>
                  )}

                  {/* Secant Line connecting (x0, y0) and (x0+h, y1) */}
                  {state.showSecant && y0 !== null && y1 !== null && secantSlope !== null && (
                    <g>
                      <line
                        x1={toSvgX(X_MIN)}
                        y1={toSvgY(y0 + secantSlope * (X_MIN - state.x0))}
                        x2={toSvgX(X_MAX)}
                        y2={toSvgY(y0 + secantSlope * (X_MAX - state.x0))}
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                      />
                      <circle cx={toSvgX(x1)} cy={toSvgY(y1)} r="5.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                    </g>
                  )}

                  {/* Tangent Line at (x0, y0) */}
                  {state.showTangent && y0 !== null && dy0 !== null && (
                    <line
                      x1={toSvgX(X_MIN)}
                      y1={toSvgY(y0 + dy0 * (X_MIN - state.x0))}
                      x2={toSvgX(X_MAX)}
                      y2={toSvgY(y0 + dy0 * (X_MAX - state.x0))}
                      stroke="#EF4444"
                      strokeWidth="2.4"
                    />
                  )}

                  {/* Roots markers */}
                  {state.showRoots &&
                    roots.map((r) => (
                      <g key={`root-${r}`}>
                        <circle cx={toSvgX(r)} cy={toSvgY(0)} r="5.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                        <text
                          x={toSvgX(r)}
                          y={toSvgY(0) - 10}
                          textAnchor="middle"
                          fontSize="10.5"
                          fontWeight="800"
                          fill="#10B981"
                          fontFamily="var(--font-mono), monospace"
                        >
                          raiz {fmtNum(r)}
                        </text>
                      </g>
                    ))}

                  {/* Critical & Inflection markers when Derivative is visible */}
                  {(state.showDerivative || state.showSecondDeriv) &&
                    criticals.map((cp, idx) => (
                      <g key={`cp-${idx}`}>
                        <circle
                          cx={toSvgX(cp.x)}
                          cy={toSvgY(cp.y)}
                          r="5.5"
                          fill={cp.kind === "inflection" ? "#EC4899" : "#F97316"}
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      </g>
                    ))}

                  {/* Active point (x0, f(x0)) */}
                  {y0 !== null && (
                    <circle
                      cx={toSvgX(state.x0)}
                      cy={toSvgY(y0)}
                      r="6.5"
                      fill="#EF4444"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  )}

                  {/* Hover crosshair */}
                  {hoverX !== null && hoverY !== null && (
                    <circle
                      cx={toSvgX(hoverX)}
                      cy={toSvgY(hoverY)}
                      r="4.5"
                      fill="#38BDF8"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      opacity="0.85"
                    />
                  )}
                </svg>

                {/* Visual Layer Toggles */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { key: "showDomainImage" as const, label: "Domínio & Imagem", activeCls: "bg-ph text-white border-ph" },
                    { key: "showRoots" as const, label: "Raízes f(x)=0", activeCls: "bg-emerald-600 text-white border-emerald-600" },
                    { key: "showSecant" as const, label: "Secante (h)", activeCls: "bg-amber-600 text-white border-amber-600" },
                    { key: "showTangent" as const, label: "Tangente f'(x₀)", activeCls: "bg-pv text-white border-pv" },
                    { key: "showDerivative" as const, label: "Derivada f'(x)", activeCls: "bg-orange-600 text-white border-orange-600" },
                    { key: "showSecondDeriv" as const, label: "2ª Deriv. f''(x)", activeCls: "bg-pink-600 text-white border-pink-600" },
                    { key: "showInverse" as const, label: "Inversa f⁻¹ (y=x)", activeCls: "bg-purple-600 text-white border-purple-600" },
                    { key: "showAntideriv" as const, label: "Integral F(x)+C", activeCls: "bg-teal-600 text-white border-teal-600" },
                  ].map((tog) => {
                    const on = state[tog.key];
                    return (
                      <button
                        key={tog.key}
                        type="button"
                        onClick={() => {
                          sfx.tick();
                          setState((prev) => ({ ...prev, [tog.key]: !prev[tog.key] }));
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                          on
                            ? tog.activeCls
                            : "bg-paper-100 dark:bg-blueprint-900 text-ink-600 dark:text-slate-300 border-paper-300 dark:border-blueprint-700"
                        }`}
                      >
                        {tog.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Domain / Image / Calculus Diagnostic Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="rounded-2xl border border-ph/30 bg-paper-50 dark:bg-blueprint-900 p-3 space-y-1">
                  <div className="text-[10px] font-mono font-extrabold uppercase text-ph dark:text-sky-400">
                    Domínio Natural &amp; Imagem
                  </div>
                  <div className="font-mono text-xs font-extrabold text-ink-900 dark:text-white">
                    {meta.domainLabel(state.params)}
                  </div>
                  <div className="font-mono text-xs font-bold text-lt dark:text-teal-300">
                    {meta.imageLabel(state.params)}
                  </div>
                  <p className="text-[11px] text-ink-500 dark:text-slate-400 leading-snug">
                    {meta.domainRestriction(state.params)}
                  </p>
                </div>

                <div className="rounded-2xl border border-pv/30 bg-paper-50 dark:bg-blueprint-900 p-3 space-y-1">
                  <div className="text-[10px] font-mono font-extrabold uppercase text-pv dark:text-red-400">
                    No Ponto x₀ = {fmtNum(state.x0)}
                  </div>
                  <div className="font-mono text-xs font-extrabold text-ink-900 dark:text-white">
                    f({fmtNum(state.x0)}) = {y0 !== null ? fmtNum(y0) : "Não definida"}
                  </div>
                  <div className="font-mono text-xs font-bold text-orange-600 dark:text-orange-300">
                    f&apos;({fmtNum(state.x0)}) = {dy0 !== null ? fmtNum(dy0) : "Não derivável"}
                  </div>
                  <div className="font-mono text-[11px] text-ink-500 dark:text-slate-400">
                    {secantSlope !== null && state.showSecant
                      ? `Secante (h=${fmtNum(state.h)}): Δy/Δx = ${fmtNum(secantSlope)}`
                      : d2y0 !== null
                        ? `f''(${fmtNum(state.x0)}) = ${fmtNum(d2y0)} (${d2y0 > 0 ? "conc. ∪" : d2y0 < 0 ? "conc. ∩" : "reta/inflexão"})`
                        : meta.derivFormula(state.params)}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-paper-50 dark:bg-blueprint-900 p-3 space-y-1">
                  <div className="text-[10px] font-mono font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                    Raízes &amp; Integral Indefinida
                  </div>
                  <div className="font-mono text-xs font-extrabold text-ink-900 dark:text-white">
                    {roots.length > 0
                      ? `Raízes: x = ${roots.map(fmtNum).join(", ")}`
                      : "Sem raízes reais visíveis"}
                  </div>
                  <div className="font-mono text-[11px] text-teal-700 dark:text-teal-300 leading-snug">
                    {meta.antiderivFormula(state.params, state.antiderivC)}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Function Selector, Sliders & Narrator */}
            <div className="space-y-3">
              {/* Narrator */}
              <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft flex items-center gap-3">
                <ProfessorAvatar professor="monge" size="md" speaking={isSpeaking} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-ink-900 dark:text-white">
                    Leitura da Função
                  </div>
                  <div className="text-[11px] text-ink-500 dark:text-slate-400">
                    Ouça domínio, raízes e derivada
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    voice.speak(
                      speakId,
                      buildNarration(),
                      "monge",
                      voiceRate,
                      customApiKey,
                      ttsModelTier
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isSpeaking
                      ? "bg-pv text-white"
                      : "bg-ink-900 text-paper-50 dark:bg-sky-500 dark:text-blueprint-950"
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" /> Parar
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" /> Ouvir
                    </>
                  )}
                </button>
              </div>

              {/* Function Family Picker */}
              <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                  Funções Elementares &amp; Casos
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(CALC_FUNCTIONS) as CalcFnKind[]).map((k) => {
                    const active = state.kind === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          sfx.click();
                          const fn = CALC_FUNCTIONS[k];
                          setAnimatingH(false);
                          setState((prev) => ({
                            ...prev,
                            kind: k,
                            params: { ...fn.defaultParams },
                            x0: fn.defaultX0,
                          }));
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border text-left transition ${
                          active
                            ? "bg-ink-900 text-paper-50 border-ink-900 dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                            : "bg-paper-100 dark:bg-blueprint-950 text-ink-700 dark:text-slate-300 border-paper-300 dark:border-blueprint-800"
                        }`}
                      >
                        {CALC_FUNCTIONS[k].shortTag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Parameter Sliders */}
              <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                    Parâmetros ao Vivo
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.tick();
                      setState((prev) => ({
                        ...prev,
                        params: { ...meta.defaultParams },
                        x0: meta.defaultX0,
                        h: 1.5,
                      }));
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-ph dark:text-sky-400 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" /> Resetar
                  </button>
                </div>

                {(["a", "b", "c"] as const).map((key) => (
                  <label key={key} className="block space-y-1">
                    <div className="flex justify-between text-xs font-bold text-ink-700 dark:text-slate-200">
                      <span>{meta.paramLabels[key]}</span>
                      <span className="font-mono text-ph dark:text-sky-400">
                        {fmtSigned(state.params[key])}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.25}
                      value={state.params[key]}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          params: { ...prev.params, [key]: Number(e.target.value) },
                        }))
                      }
                      className="w-full accent-ph cursor-pointer"
                    />
                  </label>
                ))}

                <label className="block space-y-1 pt-2 border-t border-paper-200 dark:border-blueprint-800">
                  <div className="flex justify-between text-xs font-bold text-pv dark:text-red-400">
                    <span>Ponto analisado (x₀)</span>
                    <span className="font-mono">{fmtSigned(state.x0)}</span>
                  </div>
                  <input
                    type="range"
                    min={-5}
                    max={5}
                    step={0.25}
                    value={state.x0}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, x0: Number(e.target.value) }))
                    }
                    className="w-full accent-pv cursor-pointer"
                  />
                </label>

                {state.showSecant && (
                  <div className="space-y-1.5 pt-2 border-t border-paper-200 dark:border-blueprint-800">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-300">
                      <span>Passo da Secante (h)</span>
                      <span className="font-mono">h = {fmtNum(state.h)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={3}
                      step={0.05}
                      value={state.h}
                      onChange={(e) => {
                        setAnimatingH(false);
                        setState((prev) => ({ ...prev, h: Number(e.target.value) }));
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        sfx.click();
                        if (state.h <= 0.1) {
                          setState((prev) => ({ ...prev, h: 2.5, showSecant: true, showTangent: true }));
                          setAnimatingH(true);
                        } else {
                          setAnimatingH((v) => !v);
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition"
                    >
                      {animatingH ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pausar h → 0
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> Animar Secante → Tangente (h → 0)
                        </>
                      )}
                    </button>
                  </div>
                )}

                {state.showAntideriv && (
                  <label className="block space-y-1 pt-2 border-t border-paper-200 dark:border-blueprint-800">
                    <div className="flex justify-between text-xs font-bold text-teal-600 dark:text-teal-300">
                      <span>Constante de Integração (+C)</span>
                      <span className="font-mono">{fmtSigned(state.antiderivC)}</span>
                    </div>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.5}
                      value={state.antiderivC}
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, antiderivC: Number(e.target.value) }))
                      }
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================== SUB-MODE 2: INTERACTIVE ARROW DIAGRAM (A -> B) ================== */}
      {subMode === "arrows" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 items-start">
          <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-950 p-4 sm:p-5 shadow-draft space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono font-extrabold text-ph dark:text-sky-400">
                  PRÉ-CÁLCULO · DEFINIÇÃO DE FUNÇÃO (AULA 1 DO CADERNO)
                </div>
                <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">
                  {arrowCase.title}
                </h3>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                  arrowCase.valid
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30"
                }`}
              >
                {arrowCase.valid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> É Função Válida
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> NÃO é Função
                  </>
                )}
              </span>
            </div>

            <svg viewBox="0 0 600 320" className="w-full h-auto rounded-2xl bg-paper-100/80 dark:bg-[#08101E] border border-paper-300/70 dark:border-blueprint-800">
              <defs>
                <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
                </marker>
                <marker id="arrowRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
                </marker>
              </defs>

              <text x="145" y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
                Domínio A (&ldquo;de onde sai&rdquo;)
              </text>
              <text x="455" y="34" textAnchor="middle" fontSize="14" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                Contradomínio B (&ldquo;para onde vai&rdquo;)
              </text>
              <text x="300" y="300" textAnchor="middle" fontSize="12" fontWeight="700" fill={dark ? "#CBD5E1" : "#475569"} fontFamily="var(--font-mono), monospace">
                {arrowCase.ruleLabel} · clique em um elemento de A para destacar sua flecha
              </text>

              {/* Set A Oval */}
              <ellipse cx="145" cy="164" rx="76" ry="108" fill="rgba(56,189,248,0.12)" stroke="#38BDF8" strokeWidth="2.5" />
              {/* Set B Oval */}
              <ellipse cx="455" cy="164" rx="82" ry="112" fill="rgba(45,212,191,0.1)" stroke="#2DD4BF" strokeWidth="2.5" />

              {/* Arrows */}
              {arrowCase.arrows.map((ar, idx) => {
                const yA = 94 + ar.from * (145 / Math.max(1, arrowCase.domain.length - 1));
                const yB = 90 + ar.to * (152 / Math.max(1, arrowCase.codomain.length - 1));
                const focused = selectedArrowIdx === null || selectedArrowIdx === ar.from;
                const bad = !arrowCase.valid && arrowCase.id === "ambiguous" && (ar.from === 1 || ar.from === 2);
                return (
                  <path
                    key={idx}
                    d={`M 162 ${yA} C 260 ${yA}, 340 ${yB}, 434 ${yB}`}
                    fill="none"
                    stroke={bad ? "#EF4444" : "#38BDF8"}
                    strokeWidth={focused ? 2.6 : 1.2}
                    opacity={focused ? 0.95 : 0.22}
                    markerEnd={bad ? "url(#arrowRed)" : "url(#arrowBlue)"}
                  />
                );
              })}

              {/* Elements of A */}
              {arrowCase.domain.map((val, idx) => {
                const y = 94 + idx * (145 / Math.max(1, arrowCase.domain.length - 1));
                const hasOut = arrowCase.arrows.some((a) => a.from === idx);
                const selected = selectedArrowIdx === idx;
                return (
                  <g
                    key={`a-${idx}`}
                    className="cursor-pointer"
                    onClick={() => {
                      sfx.tick();
                      setSelectedArrowIdx((prev) => (prev === idx ? null : idx));
                    }}
                  >
                    <circle
                      cx="145"
                      cy={y}
                      r={selected ? 16 : 13}
                      fill={!hasOut ? "#EF4444" : selected ? "#0EA5E9" : "#1E56A0"}
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                    />
                    <text x="145" y={y + 4.5} textAnchor="middle" fontSize="12" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Elements of B */}
              {arrowCase.codomain.map((val, idx) => {
                const y = 90 + idx * (152 / Math.max(1, arrowCase.codomain.length - 1));
                const inImage = arrowCase.arrows.some((a) => a.to === idx);
                return (
                  <g key={`b-${idx}`}>
                    <circle
                      cx="455"
                      cy={y}
                      r="13"
                      fill={inImage ? "#0F766E" : "rgba(148,163,184,0.28)"}
                      stroke={inImage ? "#5EEAD4" : "#94A3B8"}
                      strokeWidth="1.8"
                    />
                    <text x="455" y={y + 4.5} textAnchor="middle" fontSize="12" fontWeight="800" fill={inImage ? "#FFFFFF" : dark ? "#CBD5E1" : "#334155"} fontFamily="var(--font-mono), monospace">
                      {val}
                    </text>
                    {inImage && (
                      <text x="480" y={y + 4} fontSize="10" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                        ∈ Im(f)
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 shadow-draft space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                Testar Casos de Definição
              </div>
              <div className="space-y-1.5">
                {Object.values(ARROW_CASES).map((item) => {
                  const active = arrowCase.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setSelectedArrowIdx(null);
                        setState((prev) => ({ ...prev, arrowCaseId: item.id }));
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition ${
                        active
                          ? "bg-ink-900 text-paper-50 border-ink-900 dark:bg-sky-500 dark:text-blueprint-950"
                          : "bg-paper-100 dark:bg-blueprint-950 text-ink-700 dark:text-slate-200 border-paper-300 dark:border-blueprint-800"
                      }`}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  arrowCase.valid
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300/60 dark:border-emerald-700 text-ink-800 dark:text-emerald-100"
                    : "bg-red-50 dark:bg-red-950/30 border-red-300/60 dark:border-red-700 text-ink-800 dark:text-red-100"
                }`}
              >
                {arrowCase.explanation}
              </div>
            </div>

            <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 shadow-draft space-y-2 text-xs text-ink-700 dark:text-slate-200">
              <div className="font-extrabold text-ink-900 dark:text-white">
                Os 3 Requisitos do seu Caderno
              </div>
              <p><strong>1. Domínio (A):</strong> de onde saem todas as entradas.</p>
              <p><strong>2. Contradomínio (B):</strong> conjunto universo de chegada.</p>
              <p><strong>3. Regra f(x):</strong> associa cada x ∈ A a exatamente um único y = f(x) ∈ B.</p>
              <p className="text-lt dark:text-teal-300 font-semibold">
                Imagem Im(f) ⊆ B são somente os pontos de B que recebem flecha!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================== SUB-MODE 3: REAL LINE, SETS, INTERVALS & INEQUALITIES ================== */}
      {subMode === "intervals" && (
        <div className="space-y-4">
          {/* Part A: Number Hierarchy ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ */}
          <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 shadow-draft space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono font-extrabold text-ph dark:text-sky-400">
                  AULA 2 DO CADERNO · O QUE É UM NÚMERO REAL?
                </div>
                <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">
                  Hierarquia dos Conjuntos Numéricos: ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ (e Irracionais 𝕀)
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {NUMBER_SAMPLES.map((n, idx) => (
                  <button
                    key={n.label}
                    type="button"
                    onClick={() => {
                      sfx.tick();
                      setSelectedNumIdx(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold border transition ${
                      selectedNumIdx === idx
                        ? "bg-ink-900 text-paper-50 border-ink-900 dark:bg-sky-500 dark:text-blueprint-950"
                        : "bg-paper-100 dark:bg-blueprint-950 text-ink-700 dark:text-slate-200 border-paper-300 dark:border-blueprint-800"
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(["ℕ", "ℤ", "ℚ", "𝕀", "ℝ"] as const).map((setSym) => {
                const sample = NUMBER_SAMPLES[selectedNumIdx];
                const belongs = sample.sets.includes(setSym);
                const labels: Record<string, string> = {
                  "ℕ": "Naturais {1,2,3...}",
                  "ℤ": "Inteiros {...,-1,0,1...}",
                  "ℚ": "Racionais {a/b, b≠0}",
                  "𝕀": "Irracionais (√2, π)",
                  "ℝ": "Reais (ℚ ∪ 𝕀)",
                };
                return (
                  <div
                    key={setSym}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      belongs
                        ? "bg-ph/15 dark:bg-sky-500/20 border-ph dark:border-sky-400"
                        : "bg-paper-100/60 dark:bg-blueprint-950 border-paper-200 dark:border-blueprint-800 opacity-55"
                    }`}
                  >
                    <div className="font-mono text-lg font-extrabold text-ink-900 dark:text-white">
                      {setSym}
                    </div>
                    <div className="text-[10px] text-ink-600 dark:text-slate-300 mt-0.5">
                      {labels[setSym]}
                    </div>
                    <div className="font-mono text-[10px] font-bold mt-1 text-ph dark:text-sky-300">
                      {belongs ? `${sample.label} ∈ ${setSym}` : `${sample.label} ∉ ${setSym}`}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-ink-700 dark:text-slate-200 bg-paper-100 dark:bg-blueprint-950 rounded-xl px-3 py-2 border border-paper-200 dark:border-blueprint-800">
              <strong className="font-mono">{NUMBER_SAMPLES[selectedNumIdx].label}:</strong>{" "}
              {NUMBER_SAMPLES[selectedNumIdx].note}
            </p>
          </div>

          {/* Part B: Interactive Intervals + Venn + Inequality Solver */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4 items-start">
            <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-950 p-4 shadow-draft space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono font-extrabold text-lt dark:text-teal-300">
                    INTERVALOS DA RETA &amp; OPERAÇÕES (X ∪ Y, X ∩ Y, X − Y)
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-extrabold text-ink-900 dark:text-white mt-0.5">
                    {intervalResult.title}: {intervalResult.notation}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: "union" as const, lbl: "X ∪ Y" },
                      { id: "intersection" as const, lbl: "X ∩ Y" },
                      { id: "diff" as const, lbl: "X − Y" },
                    ] as const
                  ).map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setIntervalState({ op: op.id });
                      }}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold border transition ${
                        intervalState.op === op.id
                          ? "bg-ink-900 text-paper-50 border-ink-900 dark:bg-sky-500 dark:text-blueprint-950"
                          : "bg-paper-100 dark:bg-blueprint-900 text-ink-700 dark:text-slate-300 border-paper-300 dark:border-blueprint-700"
                      }`}
                    >
                      {op.lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stacked Number Lines */}
              <svg viewBox="0 0 600 220" className="w-full h-auto rounded-2xl bg-paper-100/80 dark:bg-[#08101E] border border-paper-300/70 dark:border-blueprint-800">
                {[
                  { label: `X = ${intervalResult.xLabel}`, y: 48, color: "#38BDF8", segs: [{ lo: Math.min(intervalState.a1, intervalState.b1), hi: Math.max(intervalState.a1, intervalState.b1), cLo: intervalState.a1 <= intervalState.b1 ? intervalState.closedA1 : intervalState.closedB1, cHi: intervalState.a1 <= intervalState.b1 ? intervalState.closedB1 : intervalState.closedA1 }] },
                  { label: `Y = ${intervalResult.yLabel}`, y: 112, color: "#A855F7", segs: [{ lo: Math.min(intervalState.a2, intervalState.b2), hi: Math.max(intervalState.a2, intervalState.b2), cLo: intervalState.a2 <= intervalState.b2 ? intervalState.closedA2 : intervalState.closedB2, cHi: intervalState.a2 <= intervalState.b2 ? intervalState.closedB2 : intervalState.closedA2 }] },
                  { label: intervalResult.title, y: 176, color: "#10B981", segs: intervalResult.segments },
                ].map((row) => {
                  const mapX = (v: number) => 56 + ((v + 5) / 10) * 510;
                  return (
                    <g key={row.label}>
                      <text x="56" y={row.y - 16} fontSize="11.5" fontWeight="800" fill={row.color} fontFamily="var(--font-mono), monospace">
                        {row.label}
                      </text>
                      <line x1="48" y1={row.y} x2="574" y2={row.y} stroke={axisColor} strokeOpacity="0.45" strokeWidth="1.6" />
                      {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((t) => (
                        <g key={t}>
                          <line x1={mapX(t)} y1={row.y - 4} x2={mapX(t)} y2={row.y + 4} stroke={axisColor} strokeOpacity="0.5" />
                          <text x={mapX(t)} y={row.y + 17} textAnchor="middle" fontSize="9.5" fill={axisColor} opacity="0.7" fontFamily="var(--font-mono), monospace">
                            {t}
                          </text>
                        </g>
                      ))}
                      {row.segs.map((s, si) => (
                        <g key={si}>
                          <line x1={mapX(s.lo)} y1={row.y} x2={mapX(s.hi)} y2={row.y} stroke={row.color} strokeWidth="6" strokeLinecap="round" />
                          <circle
                            cx={mapX(s.lo)}
                            cy={row.y}
                            r="5.5"
                            fill={s.cLo ? row.color : dark ? "#08101E" : "#FAF8F3"}
                            stroke={row.color}
                            strokeWidth="2.4"
                          />
                          <circle
                            cx={mapX(s.hi)}
                            cy={row.y}
                            r="5.5"
                            fill={s.cHi ? row.color : dark ? "#08101E" : "#FAF8F3"}
                            stroke={row.color}
                            strokeWidth="2.4"
                          />
                        </g>
                      ))}
                    </g>
                  );
                })}
              </svg>

              {/* Controls for X and Y */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-paper-100 dark:bg-blueprint-900 border border-ph/30 space-y-2">
                  <div className="flex items-center justify-between font-bold text-ph dark:text-sky-300">
                    <span>Intervalo X</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setIntervalState({ closedA1: !intervalState.closedA1 })}
                        className="px-2 py-0.5 rounded bg-paper-50 dark:bg-blueprint-800 border border-paper-300 dark:border-blueprint-700 font-mono text-[10px]"
                      >
                        Esq: {intervalState.closedA1 ? "[ ●" : "] ○"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIntervalState({ closedB1: !intervalState.closedB1 })}
                        className="px-2 py-0.5 rounded bg-paper-50 dark:bg-blueprint-800 border border-paper-300 dark:border-blueprint-700 font-mono text-[10px]"
                      >
                        Dir: {intervalState.closedB1 ? "● ]" : "○ ["}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono w-10">a={intervalState.a1}</span>
                    <input type="range" min={-5} max={4} step={1} value={intervalState.a1} onChange={(e) => setIntervalState({ a1: Number(e.target.value) })} className="flex-1 accent-ph" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono w-10">b={intervalState.b1}</span>
                    <input type="range" min={-4} max={5} step={1} value={intervalState.b1} onChange={(e) => setIntervalState({ b1: Number(e.target.value) })} className="flex-1 accent-ph" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-paper-100 dark:bg-blueprint-900 border border-purple-400/35 space-y-2">
                  <div className="flex items-center justify-between font-bold text-purple-600 dark:text-purple-300">
                    <span>Intervalo Y</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setIntervalState({ closedA2: !intervalState.closedA2 })}
                        className="px-2 py-0.5 rounded bg-paper-50 dark:bg-blueprint-800 border border-paper-300 dark:border-blueprint-700 font-mono text-[10px]"
                      >
                        Esq: {intervalState.closedA2 ? "[ ●" : "] ○"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIntervalState({ closedB2: !intervalState.closedB2 })}
                        className="px-2 py-0.5 rounded bg-paper-50 dark:bg-blueprint-800 border border-paper-300 dark:border-blueprint-700 font-mono text-[10px]"
                      >
                        Dir: {intervalState.closedB2 ? "● ]" : "○ ["}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono w-10">c={intervalState.a2}</span>
                    <input type="range" min={-5} max={4} step={1} value={intervalState.a2} onChange={(e) => setIntervalState({ a2: Number(e.target.value) })} className="flex-1 accent-purple-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono w-10">d={intervalState.b2}</span>
                    <input type="range" min={-4} max={5} step={1} value={intervalState.b2} onChange={(e) => setIntervalState({ b2: Number(e.target.value) })} className="flex-1 accent-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Venn Diagram + Linear Inequality Solver */}
            <div className="space-y-3">
              {/* Venn Diagram mirroring the notebook drawing! */}
              <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 shadow-draft space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                  Diagrama de Venn · {intervalResult.title}
                </div>
                <svg viewBox="0 0 320 145" className="w-full h-auto">
                  <defs>
                    <clipPath id="vennLeft">
                      <circle cx="122" cy="72" r="52" />
                    </clipPath>
                    <clipPath id="vennRight">
                      <circle cx="198" cy="72" r="52" />
                    </clipPath>
                  </defs>
                  {intervalState.op === "union" && (
                    <>
                      <circle cx="122" cy="72" r="52" fill="#10B981" fillOpacity="0.32" />
                      <circle cx="198" cy="72" r="52" fill="#10B981" fillOpacity="0.32" />
                    </>
                  )}
                  {intervalState.op === "intersection" && (
                    <circle cx="198" cy="72" r="52" fill="#10B981" fillOpacity="0.48" clipPath="url(#vennLeft)" />
                  )}
                  {intervalState.op === "diff" && (
                    <>
                      <circle cx="122" cy="72" r="52" fill="#10B981" fillOpacity="0.38" />
                      <circle cx="198" cy="72" r="52" fill={dark ? "#0F172A" : "#FAF8F3"} clipPath="url(#vennLeft)" />
                    </>
                  )}
                  <circle cx="122" cy="72" r="52" fill="none" stroke="#38BDF8" strokeWidth="2.4" />
                  <circle cx="198" cy="72" r="52" fill="none" stroke="#A855F7" strokeWidth="2.4" />
                  <text x="95" y="76" textAnchor="middle" fontSize="15" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">X</text>
                  <text x="225" y="76" textAnchor="middle" fontSize="15" fontWeight="800" fill="#A855F7" fontFamily="var(--font-mono), monospace">Y</text>
                </svg>
              </div>

              {/* Inequality Interactive Demo */}
              <div className="rounded-2xl border border-amber-300/70 dark:border-amber-700/60 bg-paper-50 dark:bg-blueprint-900 p-4 shadow-draft space-y-2.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-bisector dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" /> Desigualdade (Inequação)
                </div>
                <div className="font-mono text-sm font-extrabold text-ink-900 dark:text-white">
                  {fmtNum(ineqA)}x {ineqB >= 0 ? `+ ${fmtNum(ineqB)}` : `− ${fmtNum(Math.abs(ineqB))}`} ≥ 0
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono w-14">a = {fmtSigned(ineqA)}</span>
                    <input type="range" min={-4} max={4} step={1} value={ineqA} onChange={(e) => setIneqA(Number(e.target.value) || 1)} className="flex-1 accent-amber-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono w-14">b = {fmtSigned(ineqB)}</span>
                    <input type="range" min={-6} max={6} step={1} value={ineqB} onChange={(e) => setIneqB(Number(e.target.value))} className="flex-1 accent-amber-500" />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800 font-mono text-xs space-y-1">
                  <div>
                    1. {fmtNum(ineqA)}x ≥ {fmtNum(-ineqB)}
                  </div>
                  <div className="font-extrabold text-ink-900 dark:text-amber-200">
                    2.{" "}
                    {ineqA < 0
                      ? `Divide por ${ineqA} (negativo → INVERTE ≥ para ≤!): x ≤ ${fmtNum(-ineqB / ineqA)} ⇒ ]−∞, ${fmtNum(-ineqB / ineqA)}]`
                      : `Divide por +${ineqA} (mantém ≥): x ≥ ${fmtNum(-ineqB / ineqA)} ⇒ [${fmtNum(-ineqB / ineqA)}, +∞[`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
