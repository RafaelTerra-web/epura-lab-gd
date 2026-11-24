"use client";

import React, { useEffect, useState } from "react";
import { classifyPoint, formatPointCoords, formatSigned } from "@/lib/gd-math";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { TtsModelTier, VoiceState } from "@/lib/voice";
import {
  ArrowRight,
  Compass,
  Minus,
  Pause,
  Play,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

type ConceptId = "lt" | "abscissa" | "afastamento" | "cota" | "diedros";

interface ConceptAnatomyStageProps {
  dark: boolean;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
  ttsModelTier: TtsModelTier;
  onOpenLabWithPoint?: (x: number, y: number, z: number) => void;
}

const CONCEPTS: Array<{
  id: ConceptId;
  short: string;
  title: string;
  symbol: string;
  color: string;
  badgeBg: string;
  professor: "monge" | "epura";
  oneLiner: string;
  epuraRule: string;
  watchOut: string;
  voiceScript: string;
}> = [
  {
    id: "lt",
    short: "Linha de Terra",
    title: "Linha de Terra (LT)",
    symbol: "LT",
    color: "#0F766E",
    badgeBg: "bg-lt text-white",
    professor: "monge",
    oneLiner:
      "É a dobradiça onde o chão (Plano Horizontal π) encontra a parede (Plano Vertical π').",
    epuraRule:
      "Na folha 2D, é a reta horizontal central com dois tracinhos sob as extremidades. Toda medida de cota e afastamento parte dela!",
    watchOut:
      "Ela divide a folha em 'acima da LT' e 'abaixo da LT' — e serve de eixo de giro para o rebatimento de 90°.",
    voiceScript:
      "A Linha de Terra é o rodapé onde a parede vertical encontra o chão horizontal! Ela funciona como a dobradiça de um caderno aberto. Na épura 2D, desenhamos a Linha de Terra bem firme com dois tracinhos embaixo das pontas, porque todas as alturas e afastamentos são medidos a partir dela!",
  },
  {
    id: "abscissa",
    short: "Abscissa (X)",
    title: "Abscissa (1ª coordenada · X)",
    symbol: "X",
    color: "#0F766E",
    badgeBg: "bg-lt text-white",
    professor: "epura",
    oneLiner:
      "Mede o quanto o ponto anda para a DIREITA (+) ou ESQUERDA (−) ao longo da Linha de Terra.",
    epuraRule:
      "Define exatamente onde você traça a Linha de Chamada vertical (perpendicular à LT) que liga A e A'.",
    watchOut:
      "A e A' de um mesmo ponto (A) têm SEMPRE a mesma abscissa — por isso ficam perfeitamente alinhados na vertical!",
    voiceScript:
      "A Abscissa é sempre o primeiro número das coordenadas, o nosso eixo X! Ela diz o quanto você desliza para a direita ou para a esquerda em cima da Linha de Terra. Assim que você marca a abscissa na régua, sobe e desce uma linha bem fininha chamada Linha de Chamada. As duas projeções A e A linha moram obrigatoriamente nessa mesma coluna!",
  },
  {
    id: "afastamento",
    short: "Afastamento (Y)",
    title: "Afastamento (2ª coordenada · Y)",
    symbol: "Y",
    color: "#1E56A0",
    badgeBg: "bg-ph text-white",
    professor: "monge",
    oneLiner:
      "É a distância do ponto até a PAREDE Vertical (π'): mede se ele está na FRENTE (+) ou ATRÁS (−).",
    epuraRule:
      "Define a projeção horizontal A. Como o piso frontal rebate 90° para baixo, AFASTAMENTO POSITIVO (+) DESCE abaixo da LT!",
    watchOut:
      "Esta é a #1 pegadinha da GD! No plano cartesiano comum +Y sobe, mas na ÉPURA o +Y (afastamento positivo) vai para BAIXO!",
    voiceScript:
      "Preste atenção máxima no Afastamento, o segundo número! Ele mede a distância do ponto até a parede vertical: positivo quando está na frente, negativo quando está atrás. Agora veja a mágica na animação: quando rebatemos o chão em noventa graus para baixo, o afastamento positivo gira para BAIXO da Linha de Terra, enquanto o negativo gira para CIMA!",
  },
  {
    id: "cota",
    short: "Cota (Z)",
    title: "Cota (3ª coordenada · Z)",
    symbol: "Z",
    color: "#C94032",
    badgeBg: "bg-pv text-white",
    professor: "epura",
    oneLiner:
      "É a ALTURA do ponto em relação ao CHÃO Horizontal (π): mede se está ACIMA (+) ou ABAIXO (−).",
    epuraRule:
      "Define a projeção vertical A' na parede fixa: COTA POSITIVA (+) SOBE acima da LT; COTA NEGATIVA (−) DESCE abaixo da LT.",
    watchOut:
      "Na computação 3D (Unity/Three.js), altura costuma ser Y; já na Geometria Descritiva e Engenharia, a altura (Cota) é o eixo Z!",
    voiceScript:
      "A Cota é o terceiro número e representa a altura do ponto em relação ao chão! Como a parede vertical fica parada durante o rebatimento, a Cota é super intuitiva na épura: cota positiva sobe acima da Linha de Terra e marca A linha; cota negativa desce abaixo da Linha de Terra!",
  },
  {
    id: "diedros",
    short: "Os 4 Diedros",
    title: "Os 4 Diedros (1º, 2º, 3º e 4º)",
    symbol: "1–4D",
    color: "#B45309",
    badgeBg: "bg-bisector text-white",
    professor: "monge",
    oneLiner:
      "São os 4 'cômodos' infinitos criados quando π e π' se cruzam a 90°, numerados no sentido anti-horário.",
    epuraRule:
      "Diedros ÍMPARES (1º e 3º): A e A' em lados OPOSTOS da LT. Diedros PARES (2º e 4º): A e A' do MESMO lado da LT!",
    watchOut:
      "Clique nos 4 quadrantes do corte de perfil ao lado para ver na hora como o rebatimento move A enquanto A' fica parada!",
    voiceScript:
      "Os dois planos se cruzam formando quatro regiões infinitas chamadas Diedros, contadas no sentido anti-horário! O primeiro diedro é onde nós estamos: na frente e em cima. O segundo fica atrás e em cima. O terceiro fica atrás e embaixo. E o quarto na frente e embaixo. Clique em cada um dos quatro quadrantes no desenho para ver o rebatimento acontecendo ao vivo!",
  },
];

// Clean isometric projector for the animated architectural diagram:
// GD (x=abscissa, y=afastamento, z=cota) -> SVG (sx, sy)
function isoProject(
  x: number,
  y: number,
  z: number,
  cx = 195,
  cy = 152,
  scale = 18
) {
  // LT goes along (+0.88, +0.28); +Y (front) goes (-0.72, +0.46); +Z (up) goes (0, -1)
  const sx = cx + x * scale * 0.88 - y * scale * 0.68;
  const sy = cy + x * scale * 0.24 + y * scale * 0.44 - z * scale * 0.96;
  return { x: sx, y: sy };
}

export function ConceptAnatomyStage({
  dark,
  voice,
  voiceRate,
  customApiKey,
  ttsModelTier,
  onOpenLabWithPoint,
}: ConceptAnatomyStageProps) {
  const [activeId, setActiveId] = useState<ConceptId>("lt");
  const [x, setX] = useState<number>(2);
  const [y, setY] = useState<number>(4);
  const [z, setZ] = useState<number>(3);
  const [foldDeg, setFoldDeg] = useState<number>(0);
  const [autoFolding, setAutoFolding] = useState<boolean>(false);

  // Smooth fold animation inside the lesson canvas
  useEffect(() => {
    if (!autoFolding) return;
    let raf = 0;
    let dir = foldDeg >= 85 ? -1 : 1;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setFoldDeg((prev) => {
        const next = prev + dir * dt * 52;
        if (next >= 90) {
          setAutoFolding(false);
          return 90;
        }
        if (next <= 0) {
          setAutoFolding(false);
          return 0;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [autoFolding, foldDeg]);

  const active = CONCEPTS.find((c) => c.id === activeId)!;
  const info = classifyPoint(x, y, z, "A");
  const speakId = `anatomy-${active.id}`;
  const isSpeaking = voice.speakingId === speakId;

  // Isometric folded coordinates for horizontal plane (rotates clockwise around LT by foldDeg)
  const rad = (foldDeg * Math.PI) / 180;
  const rotY = (valY: number) => valY * Math.cos(rad);
  const rotZ = (valY: number) => -valY * Math.sin(rad);

  const pOrigin = isoProject(0, 0, 0);
  const pLTStart = isoProject(-5.2, 0, 0);
  const pLTEnd = isoProject(5.2, 0, 0);
  const pOnLT = isoProject(x, 0, 0);
  const pSpace = isoProject(x, y, z);
  const pPv = isoProject(x, 0, z);
  const pPhFolded = isoProject(x, rotY(y), rotZ(y));

  // Plane polygons (PV fixed, PH folds!)
  const pvCorners = [
    isoProject(-5, 0, 4.8),
    isoProject(5, 0, 4.8),
    isoProject(5, 0, -4.4),
    isoProject(-5, 0, -4.4),
  ];
  const phCorners = [
    isoProject(-5, rotY(4.8), rotZ(4.8)),
    isoProject(5, rotY(4.8), rotZ(4.8)),
    isoProject(5, rotY(-4.4), rotZ(-4.4)),
    isoProject(-5, rotY(-4.4), rotZ(-4.4)),
  ];

  // Quarter-circle arc points for A during folding
  const arcPath = (() => {
    if (Math.abs(y) < 0.2) return "";
    const pts: string[] = [];
    const steps = 18;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * (Math.PI / 2);
      const pt = isoProject(x, y * Math.cos(a), -y * Math.sin(a));
      pts.push(`${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`);
    }
    return pts.join(" ");
  })();

  const polyStr = (pts: Array<{ x: number; y: number }>) =>
    pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const spaceOpacity = Math.max(0.12, 1 - (foldDeg / 90) * 1.05);
  const ink = dark ? "#F1F5F9" : "#1C1917";
  const muted = dark ? "#94A3B8" : "#78716C";

  // Select diedro preset when in "diedros" cutaway view
  const selectDiedro = (d: 1 | 2 | 3 | 4) => {
    setFoldDeg(0);
    if (d === 1) {
      setY(3.5);
      setZ(3);
    } else if (d === 2) {
      setY(-3.5);
      setZ(3);
    } else if (d === 3) {
      setY(-3.5);
      setZ(-3);
    } else {
      setY(3.5);
      setZ(-3);
    }
  };

  // Profile cutaway coordinates (for Diedros view): center (170, 145), +Y right, +Z up
  const profCx = 165;
  const profCy = 148;
  const profS = 22;
  const profSpaceX = profCx + y * profS;
  const profSpaceY = profCy - z * profS;
  const profPvX = profCx;
  const profPvY = profCy - z * profS;
  const profPhX = profCx + y * Math.cos(rad) * profS;
  const profPhY = profCy + y * Math.sin(rad) * profS;

  const profArc = (() => {
    if (Math.abs(y) < 0.2) return "";
    const pts: string[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * (Math.PI / 2);
      const ax = profCx + y * Math.cos(a) * profS;
      const ay = profCy + y * Math.sin(a) * profS;
      pts.push(`${i === 0 ? "M" : "L"} ${ax.toFixed(1)} ${ay.toFixed(1)}`);
    }
    return pts.join(" ");
  })();

  return (
    <section className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 sm:p-6 shadow-draft space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ph dark:text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
            Palco Animado · &ldquo;O que é o quê?&rdquo;
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white mt-0.5">
            Anatomia Visual da Geometria Descritiva
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setAutoFolding((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold shadow-sm transition active:scale-95"
        >
          {autoFolding ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pausar Giro
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />{" "}
              {foldDeg >= 85 ? "Voltar ao 3D (0°)" : "Rebater 90° (Motion)"}
            </>
          )}
        </button>
      </div>

      {/* 5 Concept Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CONCEPTS.map((c) => {
          const isSelected = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveId(c.id);
                if (c.id === "afastamento") setFoldDeg(0);
              }}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                isSelected
                  ? "bg-ink-900 text-paper-50 border-ink-900 shadow-sm scale-[1.01] dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                  : "bg-paper-100/80 dark:bg-blueprint-950 text-ink-700 dark:text-slate-200 border-paper-300 dark:border-blueprint-700 hover:bg-paper-200/70"
              }`}
            >
              <span
                className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-extrabold ${
                  isSelected
                    ? "bg-paper-50/20 text-white dark:bg-blueprint-950/20 dark:text-blueprint-950"
                    : c.badgeBg
                }`}
              >
                {c.symbol}
              </span>
              {c.short}
            </button>
          );
        })}
      </div>

      {/* Main Motion Stage Grid: Animated Drawing + Synchronized Mini-Épura & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 items-stretch">
        {/* LEFT: Animated SVG Drawing Theater */}
        <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/80 dark:bg-blueprint-950 p-3 flex flex-col justify-between gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold px-1">
            <span style={{ color: active.color }}>
              ✦ FOCO: {active.title.toUpperCase()}
            </span>
            <span className="text-ink-500 dark:text-slate-400">
              {activeId === "diedros"
                ? "Vista de Perfil (clique nos 4 quadrantes!)"
                : `Rebatimento: ${Math.round(foldDeg)}°`}
            </span>
          </div>

          {activeId === "diedros" ? (
            /* ---- PROFILE CUTAWAY INTERACTIVE DIEDROS STAGE ---- */
            <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_0.85fr] gap-2 items-center">
              <svg
                viewBox="0 0 330 296"
                className="w-full h-auto max-h-[300px] select-none"
              >
                {/* 4 Clickable Diedro Quadrants */}
                {[
                  {
                    d: 1 as const,
                    rx: profCx,
                    ry: 24,
                    w: 138,
                    h: profCy - 24,
                    label: "1º DIEDRO",
                    sub: "+afast, +cota",
                    tx: profCx + 70,
                    ty: 56,
                    col: "#1E56A0",
                  },
                  {
                    d: 2 as const,
                    rx: 26,
                    ry: 24,
                    w: profCx - 26,
                    h: profCy - 24,
                    label: "2º DIEDRO",
                    sub: "−afast, +cota",
                    tx: 94,
                    ty: 56,
                    col: "#0F766E",
                  },
                  {
                    d: 3 as const,
                    rx: 26,
                    ry: profCy,
                    w: profCx - 26,
                    h: 124,
                    label: "3º DIEDRO",
                    sub: "−afast, −cota",
                    tx: 94,
                    ty: 244,
                    col: "#C94032",
                  },
                  {
                    d: 4 as const,
                    rx: profCx,
                    ry: profCy,
                    w: 138,
                    h: 124,
                    label: "4º DIEDRO",
                    sub: "+afast, −cota",
                    tx: profCx + 70,
                    ty: 244,
                    col: "#B45309",
                  },
                ].map((q) => {
                  const isCurr = info.diedroNumber === q.d;
                  return (
                    <g
                      key={q.d}
                      onClick={() => selectDiedro(q.d)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={q.rx}
                        y={q.ry}
                        width={q.w}
                        height={q.h}
                        rx={8}
                        fill={q.col}
                        opacity={isCurr ? 0.16 : 0.04}
                        stroke={isCurr ? q.col : "transparent"}
                        strokeWidth={isCurr ? 2 : 0}
                      />
                      <text
                        x={q.tx}
                        y={q.ty}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="800"
                        fill={q.col}
                        fontFamily="var(--font-mono), monospace"
                      >
                        {q.label}
                      </text>
                      <text
                        x={q.tx}
                        y={q.ty + 14}
                        textAnchor="middle"
                        fontSize="9"
                        fill={muted}
                        fontFamily="var(--font-mono), monospace"
                      >
                        {q.sub}
                      </text>
                    </g>
                  );
                })}

                {/* Fixed Vertical Plane π' */}
                <line
                  x1={profCx}
                  y1={20}
                  x2={profCx}
                  y2={276}
                  stroke="#C94032"
                  strokeWidth="3"
                />
                <text
                  x={profCx + 6}
                  y={22}
                  fontSize="10"
                  fontWeight="800"
                  fill="#C94032"
                  fontFamily="var(--font-mono), monospace"
                >
                  π&apos; (PV)
                </text>

                {/* Folding Horizontal Plane π */}
                <line
                  x1={profCx - 135 * Math.cos(rad)}
                  y1={profCy - 135 * Math.sin(rad)}
                  x2={profCx + 135 * Math.cos(rad)}
                  y2={profCy + 135 * Math.sin(rad)}
                  stroke="#1E56A0"
                  strokeWidth="3"
                />
                <text
                  x={profCx + 110 * Math.cos(rad)}
                  y={profCy + 110 * Math.sin(rad) - 8}
                  fontSize="10"
                  fontWeight="800"
                  fill="#1E56A0"
                  fontFamily="var(--font-mono), monospace"
                >
                  π (PH)
                </text>

                {/* Rebatimento compass arc */}
                {profArc && (
                  <path
                    d={profArc}
                    fill="none"
                    stroke="#1E56A0"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-dash-flow"
                  />
                )}

                {/* Observer eye icon in 1st Diedro */}
                <text x={282} y={96} fontSize="14">
                  👁️
                </text>
                <text
                  x={290}
                  y={110}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill={muted}
                >
                  Observador
                </text>

                {/* Orthogonal projecting rays */}
                <g opacity={spaceOpacity}>
                  <line
                    x1={profSpaceX}
                    y1={profSpaceY}
                    x2={profPvX}
                    y2={profPvY}
                    stroke="#1E56A0"
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1={profSpaceX}
                    y1={profSpaceY}
                    x2={profCx + y * profS}
                    y2={profCy}
                    stroke="#C94032"
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={profSpaceX}
                    cy={profSpaceY}
                    r={11}
                    fill="#B45309"
                    opacity={0.2}
                    className="animate-radar"
                  />
                  <circle
                    cx={profSpaceX}
                    cy={profSpaceY}
                    r={6.5}
                    fill="#B45309"
                    stroke="#FAF8F3"
                    strokeWidth="2"
                  />
                  <text
                    x={profSpaceX + (y >= 0 ? 10 : -26)}
                    y={profSpaceY - 8}
                    fontSize="11"
                    fontWeight="800"
                    fill={ink}
                    fontFamily="var(--font-mono), monospace"
                  >
                    (A)
                  </text>
                </g>

                {/* LT hinge center dot */}
                <circle cx={profCx} cy={profCy} r={5} fill="#0F766E" />

                {/* Projection A' on PV */}
                <circle
                  cx={profPvX}
                  cy={profPvY}
                  r={5.5}
                  fill="#C94032"
                  stroke="#FAF8F3"
                  strokeWidth="1.5"
                />
                <text
                  x={profPvX - 18}
                  y={profPvY + 4}
                  fontSize="11"
                  fontWeight="800"
                  fill="#C94032"
                  fontFamily="var(--font-mono), monospace"
                >
                  A&apos;
                </text>

                {/* Projection A on folding PH */}
                <circle
                  cx={profPhX}
                  cy={profPhY}
                  r={5.5}
                  fill="#1E56A0"
                  stroke="#FAF8F3"
                  strokeWidth="1.5"
                />
                <text
                  x={profPhX + 9}
                  y={profPhY + 4}
                  fontSize="11"
                  fontWeight="800"
                  fill="#1E56A0"
                  fontFamily="var(--font-mono), monospace"
                >
                  A
                </text>
              </svg>

              {/* Live Epura Strip right next to Profile Cutaway */}
              <div className="rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3 space-y-2">
                <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-center text-ink-500">
                  Resultado na Épura 2D
                </div>
                <svg viewBox="0 0 180 210" className="w-full h-auto">
                  <line
                    x1="14"
                    y1="105"
                    x2="166"
                    y2="105"
                    stroke="#0F766E"
                    strokeWidth="2.4"
                  />
                  <text
                    x="156"
                    y="99"
                    fontSize="10"
                    fontWeight="800"
                    fill="#0F766E"
                    fontFamily="var(--font-mono), monospace"
                  >
                    LT
                  </text>
                  <line
                    x1="90"
                    y1={Math.min(105, 105 - z * 18, 105 + y * 18)}
                    x2="90"
                    y2={Math.max(105, 105 - z * 18, 105 + y * 18)}
                    stroke={muted}
                    strokeDasharray="4 3"
                    strokeWidth="1.5"
                  />
                  {/* A' */}
                  <circle cx="90" cy={105 - z * 18} r="6.5" fill="#C94032" />
                  <text
                    x="102"
                    y={109 - z * 18}
                    fontSize="12"
                    fontWeight="800"
                    fill="#C94032"
                    fontFamily="var(--font-mono), monospace"
                  >
                    A&apos; ({formatSigned(z)})
                  </text>
                  {/* A */}
                  <circle cx="90" cy={105 + y * 18} r="6.5" fill="#1E56A0" />
                  <text
                    x="78"
                    y={109 + y * 18}
                    textAnchor="end"
                    fontSize="12"
                    fontWeight="800"
                    fill="#1E56A0"
                    fontFamily="var(--font-mono), monospace"
                  >
                    A ({formatSigned(y)})
                  </text>
                </svg>
                <div className="text-center text-xs font-extrabold text-ink-900 dark:text-white">
                  {info.title} · {info.signPattern}
                </div>
              </div>
            </div>
          ) : (
            /* ---- ISOMETRIC ANIMATED CONCEPT STAGE (LT / ABSCISSA / AFASTAMENTO / COTA) ---- */
            <div className="grid grid-cols-1 sm:grid-cols-[1.22fr_0.78fr] gap-2 items-center">
              <svg
                key={activeId}
                viewBox="0 0 390 295"
                className="w-full h-auto max-h-[300px] select-none"
              >
                {/* Fixed Vertical Plane π' */}
                <polygon
                  points={polyStr(pvCorners)}
                  fill="#C94032"
                  fillOpacity={activeId === "cota" ? 0.14 : 0.07}
                  stroke="#C94032"
                  strokeOpacity={activeId === "cota" ? 0.65 : 0.3}
                  strokeWidth={activeId === "cota" ? 1.8 : 1}
                />

                {/* Folding Horizontal Plane π */}
                <polygon
                  points={polyStr(phCorners)}
                  fill="#1E56A0"
                  fillOpacity={activeId === "afastamento" ? 0.16 : 0.08}
                  stroke="#1E56A0"
                  strokeOpacity={activeId === "afastamento" ? 0.7 : 0.32}
                  strokeWidth={activeId === "afastamento" ? 1.8 : 1}
                />

                {/* Plane Badges */}
                <text
                  x={pvCorners[0].x + 12}
                  y={pvCorners[0].y + 18}
                  fontSize="11"
                  fontWeight="800"
                  fill="#C94032"
                  fontFamily="var(--font-mono), monospace"
                >
                  π&apos; (Parede)
                </text>
                <text
                  x={phCorners[1].x - 16}
                  y={phCorners[1].y - 10}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="800"
                  fill="#1E56A0"
                  fontFamily="var(--font-mono), monospace"
                >
                  π (Chão)
                </text>

                {/* LINHA DE TERRA (LT) */}
                <line
                  x1={pLTStart.x}
                  y1={pLTStart.y}
                  x2={pLTEnd.x}
                  y2={pLTEnd.y}
                  stroke="#0F766E"
                  strokeWidth={activeId === "lt" ? 4.5 : 2.6}
                  strokeLinecap="round"
                  className={activeId === "lt" ? "animate-draw-stroke" : ""}
                />
                {/* Origin O(0) on LT */}
                <circle
                  cx={pOrigin.x}
                  cy={pOrigin.y}
                  r={activeId === "abscissa" || activeId === "lt" ? 5 : 3.5}
                  fill="#0F766E"
                />
                <text
                  x={pOrigin.x - 10}
                  y={pOrigin.y + 16}
                  fontSize="10"
                  fontWeight="700"
                  fill="#0F766E"
                  fontFamily="var(--font-mono), monospace"
                >
                  0
                </text>
                <text
                  x={pLTEnd.x + 6}
                  y={pLTEnd.y + 5}
                  fontSize="12"
                  fontWeight="800"
                  fill="#0F766E"
                  fontFamily="var(--font-mono), monospace"
                >
                  LT
                </text>

                {/* ABSCISSA HIGHLIGHT SEGMENT (Origin -> x on LT) */}
                <line
                  x1={pOrigin.x}
                  y1={pOrigin.y}
                  x2={pOnLT.x}
                  y2={pOnLT.y}
                  stroke="#0F766E"
                  strokeWidth={activeId === "abscissa" ? 5.5 : 2.5}
                  strokeLinecap="round"
                  opacity={activeId === "abscissa" ? 1 : 0.45}
                  className={activeId === "abscissa" ? "animate-draw-stroke" : ""}
                />
                {activeId === "abscissa" && (
                  <g className="animate-float-gentle">
                    <rect
                      x={(pOrigin.x + pOnLT.x) / 2 - 42}
                      y={(pOrigin.y + pOnLT.y) / 2 + 12}
                      width="84"
                      height="21"
                      rx="7"
                      fill="#0F766E"
                    />
                    <text
                      x={(pOrigin.x + pOnLT.x) / 2}
                      y={(pOrigin.y + pOnLT.y) / 2 + 26}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="800"
                      fill="#FFFFFF"
                      fontFamily="var(--font-mono), monospace"
                    >
                      Abscissa {formatSigned(x)}
                    </text>
                  </g>
                )}

                {/* Rebatimento compass arc */}
                {arcPath && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke="#1E56A0"
                    strokeWidth={activeId === "afastamento" ? 2.2 : 1.3}
                    strokeDasharray="4 3"
                    opacity={activeId === "afastamento" || foldDeg > 5 ? 0.85 : 0.32}
                    className="animate-dash-flow"
                  />
                )}

                {/* COTA SEGMENT (LT -> A' on PV) */}
                <line
                  x1={pOnLT.x}
                  y1={pOnLT.y}
                  x2={pPv.x}
                  y2={pPv.y}
                  stroke="#C94032"
                  strokeWidth={activeId === "cota" ? 4.2 : 1.8}
                  strokeDasharray={activeId === "cota" ? undefined : "4 3"}
                  className={activeId === "cota" ? "animate-draw-stroke" : ""}
                />

                {/* AFASTAMENTO SEGMENT (LT -> A on folding PH) */}
                <line
                  x1={pOnLT.x}
                  y1={pOnLT.y}
                  x2={pPhFolded.x}
                  y2={pPhFolded.y}
                  stroke="#1E56A0"
                  strokeWidth={activeId === "afastamento" ? 4.2 : 1.8}
                  strokeDasharray={activeId === "afastamento" ? undefined : "4 3"}
                  className={activeId === "afastamento" ? "animate-draw-stroke" : ""}
                />

                {/* Spatial Point (A) & Projecting Rays */}
                <g opacity={spaceOpacity}>
                  {/* Ray (A) -> A' (equals Afastamento!) */}
                  <line
                    x1={pSpace.x}
                    y1={pSpace.y}
                    x2={pPv.x}
                    y2={pPv.y}
                    stroke="#1E56A0"
                    strokeWidth={activeId === "afastamento" ? 3 : 1.5}
                    strokeDasharray="5 3"
                    className={activeId === "afastamento" ? "animate-dash-flow" : ""}
                  />
                  {/* Ray (A) -> A (equals Cota!) */}
                  <line
                    x1={pSpace.x}
                    y1={pSpace.y}
                    x2={isoProject(x, y, 0).x}
                    y2={isoProject(x, y, 0).y}
                    stroke="#C94032"
                    strokeWidth={activeId === "cota" ? 3 : 1.5}
                    strokeDasharray="5 3"
                    className={activeId === "cota" ? "animate-dash-flow" : ""}
                  />

                  <circle
                    cx={pSpace.x}
                    cy={pSpace.y}
                    r={12}
                    fill={active.color}
                    opacity={0.22}
                    className="animate-radar"
                  />
                  <circle
                    cx={pSpace.x}
                    cy={pSpace.y}
                    r={6.5}
                    fill={ink}
                    stroke="#FAF8F3"
                    strokeWidth="2"
                  />
                  <text
                    x={pSpace.x + 10}
                    y={pSpace.y - 8}
                    fontSize="12"
                    fontWeight="800"
                    fill={ink}
                    fontFamily="var(--font-mono), monospace"
                  >
                    (A)
                  </text>

                  {/* Dynamic callout pill for Cota or Afastamento */}
                  {activeId === "cota" && (
                    <g className="animate-float-gentle">
                      <rect
                        x={pPv.x + 12}
                        y={(pOnLT.y + pPv.y) / 2 - 11}
                        width="74"
                        height="21"
                        rx="7"
                        fill="#C94032"
                      />
                      <text
                        x={pPv.x + 49}
                        y={(pOnLT.y + pPv.y) / 2 + 3}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="800"
                        fill="#FFFFFF"
                        fontFamily="var(--font-mono), monospace"
                      >
                        Cota {formatSigned(z)}
                      </text>
                    </g>
                  )}

                  {activeId === "afastamento" && (
                    <g className="animate-float-gentle">
                      <rect
                        x={(pOnLT.x + pPhFolded.x) / 2 - 44}
                        y={(pOnLT.y + pPhFolded.y) / 2 + 12}
                        width="88"
                        height="21"
                        rx="7"
                        fill="#1E56A0"
                      />
                      <text
                        x={(pOnLT.x + pPhFolded.x) / 2}
                        y={(pOnLT.y + pPhFolded.y) / 2 + 26}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="800"
                        fill="#FFFFFF"
                        fontFamily="var(--font-mono), monospace"
                      >
                        Afast. {formatSigned(y)}
                      </text>
                    </g>
                  )}
                </g>

                {/* Projection A' */}
                <circle
                  cx={pPv.x}
                  cy={pPv.y}
                  r={5.5}
                  fill="#C94032"
                  stroke="#FAF8F3"
                  strokeWidth="1.5"
                />
                <text
                  x={pPv.x - 16}
                  y={pPv.y - 6}
                  fontSize="12"
                  fontWeight="800"
                  fill="#C94032"
                  fontFamily="var(--font-mono), monospace"
                >
                  A&apos;
                </text>

                {/* Projection A (folds with π!) */}
                <circle
                  cx={pPhFolded.x}
                  cy={pPhFolded.y}
                  r={5.5}
                  fill="#1E56A0"
                  stroke="#FAF8F3"
                  strokeWidth="1.5"
                />
                <text
                  x={pPhFolded.x - 16}
                  y={pPhFolded.y + 15}
                  fontSize="12"
                  fontWeight="800"
                  fill="#1E56A0"
                  fontFamily="var(--font-mono), monospace"
                >
                  A
                </text>
              </svg>

              {/* Synchronized Mini-Épura 2D Card */}
              <div className="rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono font-extrabold text-ink-500">
                  <span>ÉPURA 2D</span>
                  <span className="text-ph dark:text-sky-400">
                    {formatPointCoords("A", x, y, z)}
                  </span>
                </div>
                <svg viewBox="0 0 190 190" className="w-full h-auto">
                  {/* LT */}
                  <line
                    x1="12"
                    y1="95"
                    x2="178"
                    y2="95"
                    stroke="#0F766E"
                    strokeWidth={activeId === "lt" ? 3.5 : 2}
                  />
                  <line x1="14" y1="100" x2="28" y2="100" stroke="#0F766E" strokeWidth="1.4" />
                  <line x1="162" y1="100" x2="176" y2="100" stroke="#0F766E" strokeWidth="1.4" />
                  {/* Origin 0 */}
                  <circle cx="95" cy="95" r="2.8" fill="#0F766E" />
                  {/* Abscissa highlight */}
                  <line
                    x1="95"
                    y1="95"
                    x2={95 + x * 15}
                    y2="95"
                    stroke="#0F766E"
                    strokeWidth={activeId === "abscissa" ? 4.5 : 2}
                  />
                  {/* Linha de Chamada */}
                  <line
                    x1={95 + x * 15}
                    y1={Math.min(95, 95 - z * 15, 95 + y * 15)}
                    x2={95 + x * 15}
                    y2={Math.max(95, 95 - z * 15, 95 + y * 15)}
                    stroke={activeId === "abscissa" ? "#0F766E" : muted}
                    strokeWidth={activeId === "abscissa" ? 2.2 : 1.4}
                    strokeDasharray="4 3"
                  />
                  {/* A' */}
                  <circle
                    cx={95 + x * 15}
                    cy={95 - z * 15}
                    r={activeId === "cota" ? 7.5 : 5.5}
                    fill="#C94032"
                  />
                  <text
                    x={95 + x * 15 + 10}
                    y={99 - z * 15}
                    fontSize="11"
                    fontWeight="800"
                    fill="#C94032"
                    fontFamily="var(--font-mono), monospace"
                  >
                    A&apos;
                  </text>
                  {/* A */}
                  <circle
                    cx={95 + x * 15}
                    cy={95 + y * 15}
                    r={activeId === "afastamento" ? 7.5 : 5.5}
                    fill="#1E56A0"
                  />
                  <text
                    x={95 + x * 15 - 10}
                    y={99 + y * 15}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="800"
                    fill="#1E56A0"
                    fontFamily="var(--font-mono), monospace"
                  >
                    A
                  </text>
                  {/* Direction reminders */}
                  <text x="8" y="18" fontSize="8.5" fontWeight="700" fill="#C94032" fontFamily="var(--font-mono), monospace">
                    +Cota ↑
                  </text>
                  <text x="128" y="180" fontSize="8.5" fontWeight="700" fill="#1E56A0" fontFamily="var(--font-mono), monospace">
                    +Afast. ↓
                  </text>
                </svg>
              </div>
            </div>
          )}

          {/* Tactile Mini-Sliders directly beneath the Motion Canvas */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              {
                label: "Abscissa (X)",
                val: x,
                set: setX,
                col: "text-lt",
                highlight: activeId === "abscissa",
              },
              {
                label: "Afastam. (Y)",
                val: y,
                set: setY,
                col: "text-ph",
                highlight: activeId === "afastamento" || activeId === "diedros",
              },
              {
                label: "Cota (Z)",
                val: z,
                set: setZ,
                col: "text-pv",
                highlight: activeId === "cota" || activeId === "diedros",
              },
            ].map((ctrl) => (
              <div
                key={ctrl.label}
                className={`rounded-xl border p-2 transition ${
                  ctrl.highlight
                    ? "bg-paper-50 dark:bg-blueprint-900 border-ph ring-2 ring-ph/20"
                    : "bg-paper-50/70 dark:bg-blueprint-900/60 border-paper-300 dark:border-blueprint-800"
                }`}
              >
                <div className="text-[10px] font-bold text-ink-600 dark:text-slate-300 text-center truncate">
                  {ctrl.label}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => ctrl.set((v) => Math.max(-4, v - 1))}
                    className="w-6 h-6 rounded-md bg-paper-200/80 dark:bg-blueprint-800 flex items-center justify-center"
                    aria-label={`Diminuir ${ctrl.label}`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className={`font-mono text-xs font-extrabold w-7 text-center ${ctrl.col}`}>
                    {formatSigned(ctrl.val)}
                  </span>
                  <button
                    type="button"
                    onClick={() => ctrl.set((v) => Math.min(4, v + 1))}
                    className="w-6 h-6 rounded-md bg-paper-200/80 dark:bg-blueprint-800 flex items-center justify-center"
                    aria-label={`Aumentar ${ctrl.label}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Professor Speech Card + Clear "O que é" Breakdown */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/70 dark:bg-blueprint-950 p-4">
          <div className="space-y-3.5">
            {/* Avatar + Voice CTA */}
            <div className="flex items-center gap-3">
              <ProfessorAvatar
                professor="monge"
                size="lg"
                mood={isSpeaking ? "explaining" : "friendly"}
                speaking={isSpeaking}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-ink-900 dark:text-white">
                  Prof. Monge explica:
                </div>
                <div className="text-[11px] font-mono text-ink-500 dark:text-slate-400">
                  {voice.engine === "gemini-3.8"
                    ? `✦ ${voice.modelUsed}`
                    : "Gemini 3.8 TTS · fallback pt-BR"}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  voice.speak(
                    speakId,
                    active.voiceScript,
                    "monge",
                    voiceRate,
                    customApiKey,
                    ttsModelTier
                  )
                }
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  isSpeaking
                    ? "bg-pv text-white"
                    : "bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950"
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

            {/* Speech Bubble Cards */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-paper-50 dark:bg-blueprint-900 border border-paper-200 dark:border-blueprint-800 space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-lt">
                  Em 1 frase
                </div>
                <p className="text-xs sm:text-sm font-semibold text-ink-900 dark:text-white leading-relaxed">
                  {active.oneLiner}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-paper-50 dark:bg-blueprint-900 border border-paper-200 dark:border-blueprint-800 space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-ph dark:text-sky-400">
                  Como aparece na Épura 2D
                </div>
                <p className="text-xs text-ink-700 dark:text-slate-200 leading-relaxed">
                  {active.epuraRule}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-300/70 dark:border-amber-700/60 space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-bisector dark:text-amber-300">
                  ⚡ Atenção / Pegadinha
                </div>
                <p className="text-xs text-ink-700 dark:text-amber-100 leading-relaxed">
                  {active.watchOut}
                </p>
              </div>
            </div>
          </div>

          {onOpenLabWithPoint && (
            <button
              type="button"
              onClick={() => onOpenLabWithPoint(x, y, z)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ph/15 hover:bg-ph/25 text-ph dark:bg-sky-500/15 dark:text-sky-300 text-xs font-extrabold transition"
            >
              <Compass className="w-4 h-4" />
              Testar {formatPointCoords("A", x, y, z)} no Lab 3D Completo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
