"use client";

import React from "react";
import type { CalcListEpisode, CalcListSceneCue } from "@/lib/calc-list-episodes";

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function easeOut(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

const BOX = { x: 86, y: 90, w: 626, h: 318 };

function mapXY(
  x: number,
  y: number,
  xMin = -4,
  xMax = 4,
  yMin = -3,
  yMax = 3,
  box = BOX
) {
  return {
    px: box.x + ((x - xMin) / (xMax - xMin)) * box.w,
    py: box.y + box.h - ((y - yMin) / (yMax - yMin)) * box.h,
  };
}

function buildCurve(
  fn: (x: number) => number | null,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  progress = 1,
  box = BOX,
  steps = 140
): string {
  const maxI = Math.max(1, Math.floor(steps * clamp01(progress)));
  const segs: string[] = [];
  let prevY: number | null = null;
  for (let i = 0; i <= maxI; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = fn(x);
    const ok = y !== null && Number.isFinite(y) && y >= yMin - 2 && y <= yMax + 2;
    const jump = prevY !== null && y !== null && Math.abs(y - prevY) > (yMax - yMin) * 0.7;
    if (!ok || jump) {
      prevY = null;
      continue;
    }
    const { px, py } = mapXY(x, y!, xMin, xMax, yMin, yMax, box);
    segs.push(`${prevY === null ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
    prevY = y;
  }
  return segs.join(" ");
}

function Axes({
  xMin = -4,
  xMax = 4,
  yMin = -3,
  yMax = 3,
  xLabel = "x",
  yLabel = "y",
  xTicks,
  yTicks,
  clipId = "listPlotClip",
  box = BOX,
}: {
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  xLabel?: string;
  yLabel?: string;
  xTicks?: Array<{ v: number; lbl?: string }>;
  yTicks?: Array<{ v: number; lbl?: string }>;
  clipId?: string;
  box?: typeof BOX;
}) {
  const o = mapXY(0, 0, xMin, xMax, yMin, yMax, box);
  const autoX: Array<{ v: number; lbl?: string }> =
    xTicks ??
    Array.from(
      { length: Math.floor(xMax) - Math.ceil(xMin) + 1 },
      (_, i) => ({ v: Math.ceil(xMin) + i })
    );
  const autoY: Array<{ v: number; lbl?: string }> =
    yTicks ??
    Array.from(
      { length: Math.floor(yMax) - Math.ceil(yMin) + 1 },
      (_, i) => ({ v: Math.ceil(yMin) + i })
    );

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={box.x + 2} y={box.y + 2} width={box.w - 4} height={box.h - 4} rx="14" />
        </clipPath>
      </defs>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx="16"
        fill="#0A1324"
        stroke="rgba(148,163,184,0.22)"
        strokeWidth="1.5"
      />
      {autoX.map((tk) => {
        const { px } = mapXY(tk.v, 0, xMin, xMax, yMin, yMax, box);
        return (
          <g key={`x-${tk.v}`}>
            <line x1={px} y1={box.y + 8} x2={px} y2={box.y + box.h - 8} stroke="rgba(148,163,184,0.1)" />
            {Math.abs(tk.v) > 1e-6 && (
              <text
                x={px}
                y={Math.min(box.y + box.h - 8, Math.max(box.y + 18, o.py + 16))}
                textAnchor="middle"
                fontSize="10.5"
                fill="#94A3B8"
                fontFamily="var(--font-mono), monospace"
              >
                {tk.lbl ?? String(tk.v)}
              </text>
            )}
          </g>
        );
      })}
      {autoY.map((tk) => {
        const { py } = mapXY(0, tk.v, xMin, xMax, yMin, yMax, box);
        return (
          <g key={`y-${tk.v}`}>
            <line x1={box.x + 8} y1={py} x2={box.x + box.w - 8} y2={py} stroke="rgba(148,163,184,0.1)" />
            {Math.abs(tk.v) > 1e-6 && (
              <text
                x={Math.max(box.x + 28, Math.min(box.x + box.w - 14, o.px - 9))}
                y={py + 4}
                textAnchor="end"
                fontSize="10.5"
                fill="#94A3B8"
                fontFamily="var(--font-mono), monospace"
              >
                {tk.lbl ?? String(tk.v)}
              </text>
            )}
          </g>
        );
      })}
      {yMin <= 0 && yMax >= 0 && (
        <line x1={box.x + 10} y1={o.py} x2={box.x + box.w - 10} y2={o.py} stroke="#CBD5E1" strokeWidth="1.8" />
      )}
      {xMin <= 0 && xMax >= 0 && (
        <line x1={o.px} y1={box.y + 10} x2={o.px} y2={box.y + box.h - 10} stroke="#CBD5E1" strokeWidth="1.8" />
      )}
      <text
        x={box.x + box.w - 16}
        y={Math.max(box.y + 20, Math.min(box.y + box.h - 14, o.py - 8))}
        textAnchor="end"
        fontSize="12.5"
        fontWeight="800"
        fill="#E2E8F0"
        fontFamily="var(--font-mono), monospace"
      >
        {xLabel}
      </text>
      <text
        x={Math.max(box.x + 16, o.px + 10)}
        y={box.y + 22}
        fontSize="12.5"
        fontWeight="800"
        fill="#E2E8F0"
        fontFamily="var(--font-mono), monospace"
      >
        {yLabel}
      </text>
    </g>
  );
}

function StepBoard({
  title,
  lines,
  t,
  accent,
}: {
  title: string;
  lines: Array<{ tag: string; expr: string; note?: string; color?: string }>;
  t: number;
  accent: string;
}) {
  return (
    <g>
      <text x="86" y="114" fontSize="21" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
        {title}
      </text>
      {lines.map((ln, idx) => {
        const d = idx * 0.2;
        const p = Math.max(0.32, easeOut((t - d) * 3.2));
        const y = 136 + idx * 72;
        const col = ln.color ?? accent;
        return (
          <g key={idx} transform={`translate(${86 + (1 - p) * 20}, ${y})`} opacity={p}>
            <rect width="626" height="60" rx="14" fill="#0A1324" stroke={col} strokeOpacity="0.65" strokeWidth="1.8" />
            <rect x="12" y="13" width="94" height="34" rx="9" fill={col} fillOpacity="0.18" />
            <text x="59" y="35" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={col} fontFamily="var(--font-mono), monospace">
              {ln.tag}
            </text>
            <text x="122" y={ln.note ? 28 : 35} fontSize="15.5" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-mono), monospace">
              {ln.expr}
            </text>
            {ln.note && (
              <text x="122" y="48" fontSize="11.5" fill="#94A3B8" fontFamily="var(--font-mono), monospace">
                {ln.note}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function NumberLineRow({
  y,
  label,
  color,
  minV,
  maxV,
  ticks,
  segments,
}: {
  y: number;
  label: string;
  color: string;
  minV: number;
  maxV: number;
  ticks: Array<{ v: number; lbl?: string }>;
  segments: Array<{ lo: number; hi: number; cLo?: boolean; cHi?: boolean; arrowL?: boolean; arrowR?: boolean }>;
}) {
  const x0 = 112;
  const x1 = 682;
  const mapX = (v: number) => x0 + ((v - minV) / (maxV - minV)) * (x1 - x0);
  return (
    <g>
      <text x={x0} y={y - 18} fontSize="13" fontWeight="800" fill={color} fontFamily="var(--font-mono), monospace">
        {label}
      </text>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke="#475569" strokeWidth="2.2" />
      {ticks.map((tk) => (
        <g key={tk.v}>
          <line x1={mapX(tk.v)} y1={y - 5} x2={mapX(tk.v)} y2={y + 5} stroke="#94A3B8" strokeWidth="1.6" />
          <text x={mapX(tk.v)} y={y + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="#CBD5E1" fontFamily="var(--font-mono), monospace">
            {tk.lbl ?? String(tk.v)}
          </text>
        </g>
      ))}
      {segments.map((s, idx) => (
        <g key={idx}>
          <line x1={mapX(s.lo)} y1={y} x2={mapX(s.hi)} y2={y} stroke={color} strokeWidth="7" strokeLinecap="round" />
          {!s.arrowL && (
            <circle cx={mapX(s.lo)} cy={y} r="6.5" fill={s.cLo ? color : "#0A1324"} stroke={color} strokeWidth="2.8" />
          )}
          {!s.arrowR && (
            <circle cx={mapX(s.hi)} cy={y} r="6.5" fill={s.cHi ? color : "#0A1324"} stroke={color} strokeWidth="2.8" />
          )}
        </g>
      ))}
    </g>
  );
}

export function CalcListSceneCanvas({
  episode,
  scene,
  t,
}: {
  episode: CalcListEpisode;
  scene: CalcListSceneCue;
  t: number;
}) {
  const q = episode.qNum;
  const sc = scene.id;
  const ac = episode.themeAccent;

  /* ==================== Q01: RACIONAIS, IRRACIONAIS & PROVA √2 ==================== */
  if (q === 1) {
    if (sc === "items-ab") {
      return (
        <StepBoard
          title="Questão 1 · Itens (a) e (b): Simplifique Antes de Classificar!"
          t={t}
          accent={ac}
          lines={[
            { tag: "Item (a)", expr: "√45 = √(9 · 5) = 3√5", note: "√5 ∉ ℚ ⇒ 3√5 é IRRACIONAL (𝕀)", color: "#FB7185" },
            { tag: "Item (b)", expr: "√18 / √2 = √(18 / 2) = √9 = 3", note: "3 = 3/1 ∈ ℚ ⇒ RACIONAL!", color: "#34D399" },
            { tag: "Dica UERJ", expr: "Nunca julgue antes de simplificar!", note: "Duas raízes irracionais podem se cancelar numa razão racional.", color: "#FBBF24" },
          ]}
        />
      );
    }
    if (sc === "items-cd") {
      return (
        <StepBoard
          title="Questão 1 · Itens (c) Dízima 0,2727... e (d) Produto Notável"
          t={t}
          accent={ac}
          lines={[
            { tag: "(c) Passo 1", expr: "x = 0,2727...  ⇒  100x = 27,2727...", note: "Período de 2 dígitos ⇒ multiplica por 100", color: "#38BDF8" },
            { tag: "(c) Passo 2", expr: "100x − x = 27  ⇒  99x = 27  ⇒  x = 3/11", note: "Fração de inteiros ⇒ RACIONAL (ℚ)!", color: "#34D399" },
            { tag: "(d)", expr: "(√2 + 1)(√2 − 1) = (√2)² − 1² = 2 − 1 = 1", note: "Diferença de quadrados (a+b)(a−b) = a²−b² ⇒ RACIONAL!", color: "#A855F7" },
          ]}
        />
      );
    }
    if (sc === "diag-setup") {
      const diagP = Math.max(0.35, easeOut(t * 2.2));
      return (
        <g>
          <text x="86" y="114" fontSize="21" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            Diagonal do Quadrado de Lado 1 · Teorema de Pitágoras
          </text>
          <rect x="120" y="160" width="180" height="180" rx="6" fill="rgba(56,189,248,0.12)" stroke="#38BDF8" strokeWidth="3" />
          <line x1="120" y1="340" x2={120 + diagP * 180} y2={340 - diagP * 180} stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
          <rect x="280" y="320" width="20" height="20" fill="none" stroke="#38BDF8" strokeWidth="2" />
          <text x="210" y="366" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">lado = 1</text>
          <text x="316" y="256" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">1</text>
          <text x="184" y="236" fontSize="17" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">d = √2</text>

          <rect x="370" y="156" width="342" height="194" rx="16" fill="#0A1324" stroke="#F59E0B" strokeWidth="1.8" />
          <text x="392" y="190" fontSize="15" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">1. Pitágoras:</text>
          <text x="392" y="216" fontSize="14.5" fill="#F8FAFC" fontFamily="var(--font-mono), monospace">d² = 1² + 1² = 2  ⇒  d = √2</text>
          <text x="392" y="256" fontSize="15" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">2. Hipótese (por absurdo):</text>
          <text x="392" y="284" fontSize="14.5" fill="#E2E8F0" fontFamily="var(--font-mono), monospace">Suponha √2 = p / q ∈ ℚ</text>
          <text x="392" y="310" fontSize="12.5" fill="#94A3B8" fontFamily="var(--font-mono), monospace">fração IRREDUTÍVEL (mdc(p,q)=1)</text>
          <text x="392" y="332" fontSize="12.5" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">p e q NÃO podem ser ambos pares!</text>
        </g>
      );
    }
    return (
      <StepBoard
        title="Prova por Absurdo: Por que √2 é Irracional!"
        t={t}
        accent="#34D399"
        lines={[
          { tag: "Passo 1", expr: "√2 = p/q  ⇒  2 = p²/q²  ⇒  p² = 2q²", note: "p² é par ⇒ pelo fato dado, p é PAR (p = 2k)!", color: "#38BDF8" },
          { tag: "Passo 2", expr: "(2k)² = 2q²  ⇒  4k² = 2q²  ⇒  q² = 2k²", note: "q² também é par ⇒ q também é PAR!", color: "#F59E0B" },
          { tag: "Absurdo!", expr: "p e q são AMBOS pares (divisíveis por 2)!", note: "Contradiz mdc(p,q) = 1 (fração irredutível) ⇒ √2 ∈ 𝕀!", color: "#EF4444" },
        ]}
      />
    );
  }

  /* ==================== Q02: INTERVALOS A=[-2,3) & B=(1,5] ==================== */
  if (q === 2) {
    if (sc === "inter-union") {
      const tk = [-2, -1, 0, 1, 2, 3, 4, 5].map((v) => ({ v }));
      return (
        <g>
          <rect x="86" y="92" width="626" height="320" rx="18" fill="#0A1324" stroke="rgba(148,163,184,0.22)" strokeWidth="1.5" />
          <NumberLineRow y={142} label="A = [−2, 3)" color="#38BDF8" minV={-3} maxV={6} ticks={tk} segments={[{ lo: -2, hi: 3, cLo: true, cHi: false }]} />
          <NumberLineRow y={214} label="B = (1, 5]" color="#A855F7" minV={-3} maxV={6} ticks={tk} segments={[{ lo: 1, hi: 5, cLo: false, cHi: true }]} />
          <NumberLineRow y={288} label="(a) A ∩ B = (1, 3)  — ambos abertos!" color="#10B981" minV={-3} maxV={6} ticks={tk} segments={[{ lo: 1, hi: 3, cLo: false, cHi: false }]} />
          <NumberLineRow y={362} label="(b) A ∪ B = [−2, 5]  — cobertura total!" color="#F59E0B" minV={-3} maxV={6} ticks={tk} segments={[{ lo: -2, hi: 5, cLo: true, cHi: true }]} />
        </g>
      );
    }
    if (sc === "complement") {
      const tk = [-3, -2, -1, 0, 1, 2, 3, 4].map((v) => ({ v }));
      return (
        <g>
          <rect x="86" y="102" width="626" height="278" rx="18" fill="#0A1324" stroke="#EF4444" strokeOpacity="0.55" strokeWidth="1.8" />
          <NumberLineRow y={178} label="A = [−2, 3)   (−2 entra ● · 3 fica fora ○)" color="#38BDF8" minV={-4} maxV={5} ticks={tk} segments={[{ lo: -2, hi: 3, cLo: true, cHi: false }]} />
          <NumberLineRow
            y={284}
            label="(c) ℝ \ A = (−∞, −2) ∪ [3, +∞)   (extremos INVERTEM!)"
            color="#EF4444"
            minV={-4}
            maxV={5}
            ticks={tk}
            segments={[
              { lo: -4, hi: -2, arrowL: true, cHi: false },
              { lo: 3, hi: 5, cLo: true, arrowR: true },
            ]}
          />
          <text x="399" y="354" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
            −2 ∈ A ⇒ −2 ∉ ℝ\A (○)   ·   3 ∉ A ⇒ 3 ∈ ℝ\A (●)
          </text>
        </g>
      );
    }
    const isMax = sc === "no-max";
    const mPos = isMax ? 540 + t * 50 : 250 - t * 55;
    const midPos = isMax ? (mPos + 610) / 2 : (175 + mPos) / 2;
    return (
      <g>
        <text x="86" y="122" fontSize="21" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
          {isMax ? "Por que (1, 3) NÃO tem Maior Elemento?" : "Por que (1, 3) NÃO tem Menor Elemento?"}
        </text>
        <rect x="86" y="148" width="626" height="238" rx="18" fill="#0A1324" stroke="#2DD4BF" strokeWidth="1.8" />
        <line x1="130" y1="248" x2="660" y2="248" stroke="#475569" strokeWidth="2.5" />
        <line x1="175" y1="248" x2="610" y2="248" stroke="#2DD4BF" strokeWidth="8" />
        <circle cx="175" cy="248" r="8" fill="#0A1324" stroke="#2DD4BF" strokeWidth="3" />
        <circle cx="610" cy="248" r="8" fill="#0A1324" stroke="#2DD4BF" strokeWidth="3" />
        <text x="175" y="280" textAnchor="middle" fontSize="14" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">1 (○)</text>
        <text x="610" y="280" textAnchor="middle" fontSize="14" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">3 (○)</text>
        <circle cx={mPos} cy="248" r="7" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
        <text x={mPos} y="220" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">{isMax ? "M" : "m"}</text>
        <circle cx={midPos} cy="248" r="7" fill="#EF4444" stroke="#FFF" strokeWidth="2" />
        <text x={midPos} y="298" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
          {isMax ? "(M+3)/2 > M!" : "(1+m)/2 < m!"}
        </text>
        <text x="399" y="356" textAnchor="middle" fontSize="14" fontWeight="800" fill="#E2E8F0" fontFamily="var(--font-mono), monospace">
          {isMax ? "1 < M < (M+3)/2 < 3 ⇒ sempre cabe um maior!" : "1 < (1+m)/2 < m < 3 ⇒ sempre cabe um menor!"}
        </text>
      </g>
    );
  }

  /* ==================== Q03: DESIGUALDADES ==================== */
  if (q === 3) {
    if (sc === "item-a" || sc === "item-b-signs") {
      const isA = sc === "item-a";
      const r1 = isA ? -3 : -2;
      const r2 = 1;
      return (
        <g>
          <text x="86" y="108" fontSize="20" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            {isA ? "(a) (x − 1)(x + 3) ≤ 0 · Quadro de Sinais" : "(b) (x − 1) / (x + 2) > 0 · Quadro de Sinais"}
          </text>
          <rect x="86" y="128" width="626" height="200" rx="16" fill="#0A1324" stroke="#334155" strokeWidth="2" />
          <rect x="86" y="128" width="626" height="40" rx="14" fill="#1E293B" />
          <text x="160" y="153" textAnchor="middle" fontSize="13" fontWeight="800" fill="#CBD5E1" fontFamily="var(--font-mono), monospace">Fator</text>
          <text x="320" y="153" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">x &lt; {r1}</text>
          <text x="470" y="153" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">{r1} &lt; x &lt; {r2}</text>
          <text x="620" y="153" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">x &gt; {r2}</text>

          <text x="160" y="198" textAnchor="middle" fontSize="14" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">{isA ? "(x + 3)" : "(x + 2) ≠ 0"}</text>
          <text x="320" y="198" textAnchor="middle" fontSize="19" fontWeight="800" fill="#FB7185">−</text>
          <text x="470" y="198" textAnchor="middle" fontSize="19" fontWeight="800" fill="#34D399">+</text>
          <text x="620" y="198" textAnchor="middle" fontSize="19" fontWeight="800" fill="#34D399">+</text>

          <text x="160" y="246" textAnchor="middle" fontSize="14" fontWeight="800" fill="#A855F7" fontFamily="var(--font-mono), monospace">(x − 1)</text>
          <text x="320" y="246" textAnchor="middle" fontSize="19" fontWeight="800" fill="#FB7185">−</text>
          <text x="470" y="246" textAnchor="middle" fontSize="19" fontWeight="800" fill="#FB7185">−</text>
          <text x="620" y="246" textAnchor="middle" fontSize="19" fontWeight="800" fill="#34D399">+</text>

          <line x1="100" y1="268" x2="698" y2="268" stroke="#F59E0B" strokeWidth="2" />
          <text x="160" y="303" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">{isA ? "Produto" : "Quociente"}</text>
          <text x="320" y="303" textAnchor="middle" fontSize="17" fontWeight="800" fill={isA ? "#94A3B8" : "#34D399"} fontFamily="var(--font-mono), monospace">{isA ? "(+)" : "(+) ✓"}</text>
          <text x="470" y="303" textAnchor="middle" fontSize="17" fontWeight="800" fill={isA ? "#34D399" : "#FB7185"} fontFamily="var(--font-mono), monospace">{isA ? "(−) ✓" : "(−)"}</text>
          <text x="620" y="303" textAnchor="middle" fontSize="17" fontWeight="800" fill={isA ? "#94A3B8" : "#34D399"} fontFamily="var(--font-mono), monospace">{isA ? "(+)" : "(+) ✓"}</text>

          <NumberLineRow
            y={386}
            label={isA ? "Solução: S = [−3, 1]" : "Solução: S = (−∞, −2) ∪ (1, +∞)"}
            color="#10B981"
            minV={-4}
            maxV={3}
            ticks={[-3, -2, -1, 0, 1, 2].map((v) => ({ v }))}
            segments={
              isA
                ? [{ lo: -3, hi: 1, cLo: true, cHi: true }]
                : [
                    { lo: -4, hi: -2, arrowL: true, cHi: false },
                    { lo: 1, hi: 3, cLo: false, arrowR: true },
                  ]
            }
          />
        </g>
      );
    }
    if (sc === "item-b-trap") {
      return (
        <StepBoard
          title="⚠️ Cuidado ao Multiplicar (x−1)/(x+2) > 0 por (x + 2)!"
          t={t}
          accent="#EF4444"
          lines={[
            { tag: "Erro fatal", expr: "Passar (x+2) multiplicando ⇒ x − 1 > 0 ⇒ x > 1", note: "PERDE metade da resposta (−∞, −2)!", color: "#EF4444" },
            { tag: "Caso 1 (+)", expr: "Se x + 2 > 0 (x > −2): mantém '>' ⇒ x > 1", note: "Interseção: (1, +∞)", color: "#34D399" },
            { tag: "Caso 2 (−)", expr: "Se x + 2 < 0 (x < −2): INVERTE '<' ⇒ x < 1", note: "Interseção com x < −2 devolve (−∞, −2)!", color: "#F59E0B" },
          ]}
        />
      );
    }
    return (
      <g>
        <Axes xMin={-4} xMax={4} yMin={-5} yMax={5} clipId="q03cClip" />
        <g clipPath="url(#q03cClip)">
          <path d={buildCurve((x) => x * x - 4, -4, 4, -5, 5, Math.max(0.4, easeOut(t * 2)))} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
          <line x1={mapXY(-2, 0, -4, 4, -5, 5).px} y1={mapXY(-2, 0, -4, 4, -5, 5).py} x2={mapXY(2, 0, -4, 4, -5, 5).px} y2={mapXY(2, 0, -4, 4, -5, 5).py} stroke="#10B981" strokeWidth="8" />
          <circle cx={mapXY(-2, 0, -4, 4, -5, 5).px} cy={mapXY(-2, 0, -4, 4, -5, 5).py} r="7" fill="#0A1324" stroke="#10B981" strokeWidth="3" />
          <circle cx={mapXY(2, 0, -4, 4, -5, 5).px} cy={mapXY(2, 0, -4, 4, -5, 5).py} r="7" fill="#0A1324" stroke="#10B981" strokeWidth="3" />
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="15" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
          (c) x² &lt; 4 ⇔ (x − 2)(x + 2) &lt; 0  ⇒  S = (−2, 2)
        </text>
      </g>
    );
  }

  /* ==================== Q04: DOMÍNIO REAL (5 EXPRESSÕES) ==================== */
  if (q === 4) {
    if (sc === "items-ab") {
      return (
        <StepBoard
          title="Questão 4 · Itens (a) √(5 − 2x) e (b) 1/(x² − 4)"
          t={t}
          accent={ac}
          lines={[
            { tag: "(a) Raiz", expr: "5 − 2x ≥ 0  ⇒  −2x ≥ −5  ⇒  x ≤ 5/2", note: "Dividiu por −2 ⇒ INVERTE sinal! D_f = (−∞, 5/2]", color: "#38BDF8" },
            { tag: "(b) Fração", expr: "x² − 4 ≠ 0  ⇒  (x − 2)(x + 2) ≠ 0", note: "Exclui x = −2 e x = +2!", color: "#F59E0B" },
            { tag: "D_g", expr: "D_g = (−∞, −2) ∪ (−2, 2) ∪ (2, +∞)", note: "Reta real com 2 furos abertos ○", color: "#34D399" },
          ]}
        />
      );
    }
    if (sc === "item-c") {
      const tk = [-2, -1, 0, 1, 2, 3, 4].map((v) => ({ v }));
      return (
        <g>
          <rect x="86" y="102" width="626" height="292" rx="18" fill="#0A1324" stroke="#A855F7" strokeWidth="1.8" />
          <NumberLineRow y={168} label="1. Numerador √(x + 1): x ≥ −1" color="#38BDF8" minV={-3} maxV={5} ticks={tk} segments={[{ lo: -1, hi: 5, cLo: true, arrowR: true }]} />
          <NumberLineRow y={248} label="2. Denominador (x − 2) ≠ 0: exclui x = 2" color="#EF4444" minV={-3} maxV={5} ticks={tk} segments={[{ lo: -3, hi: 2, arrowL: true, cHi: false }, { lo: 2, hi: 5, cLo: false, arrowR: true }]} />
          <NumberLineRow y={332} label="Interseção ⇒ D_h = [−1, 2) ∪ (2, +∞)" color="#10B981" minV={-3} maxV={5} ticks={tk} segments={[{ lo: -1, hi: 2, cLo: true, cHi: false }, { lo: 2, hi: 5, cLo: false, arrowR: true }]} />
        </g>
      );
    }
    if (sc === "item-d") {
      const tk = [-3, -2, -1, 0, 1, 2, 3].map((v) => ({ v }));
      return (
        <g>
          <text x="86" y="114" fontSize="20" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            (d) p(x) = √((x − 1)/(x + 2)) · Quociente Inteiro ≥ 0!
          </text>
          <rect x="86" y="136" width="626" height="252" rx="18" fill="#0A1324" stroke="#38BDF8" strokeWidth="1.8" />
          <text x="114" y="176" fontSize="14.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">
            Reaproveita Q03(b): (−)/(−) = (+) p/ x &lt; −2  e  (+)/(+) = (+) p/ x &gt; 1
          </text>
          <text x="114" y="208" fontSize="14" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
            • Em x = 1: √(0/3) = 0 EXISTE ⇒ 1 ENTRA FECHADO [1 !
          </text>
          <text x="114" y="236" fontSize="14" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
            • Em x = −2: denominador zera ⇒ −2 FICA ABERTO (−2 !
          </text>
          <NumberLineRow
            y={324}
            label="D_p = (−∞, −2) ∪ [1, +∞)"
            color="#10B981"
            minV={-4}
            maxV={4}
            ticks={tk}
            segments={[
              { lo: -4, hi: -2, arrowL: true, cHi: false },
              { lo: 1, hi: 4, cLo: true, arrowR: true },
            ]}
          />
        </g>
      );
    }
    return (
      <g>
        <Axes xMin={-4.5} xMax={4.5} yMin={-4} yMax={10} yTicks={[{ v: -3 }, { v: 3 }, { v: 6 }, { v: 9 }]} clipId="q04eClip" />
        <g clipPath="url(#q04eClip)">
          <path d={buildCurve((x) => 9 - x * x, -4.5, 4.5, -4, 10, Math.max(0.4, easeOut(t * 2)))} fill="none" stroke="#A855F7" strokeWidth="3.8" />
          <line x1={mapXY(-3, 0, -4.5, 4.5, -4, 10).px} y1={mapXY(-3, 0, -4.5, 4.5, -4, 10).py} x2={mapXY(3, 0, -4.5, 4.5, -4, 10).px} y2={mapXY(3, 0, -4.5, 4.5, -4, 10).py} stroke="#10B981" strokeWidth="8" />
          <circle cx={mapXY(-3, 0, -4.5, 4.5, -4, 10).px} cy={mapXY(-3, 0, -4.5, 4.5, -4, 10).py} r="7" fill="#0A1324" stroke="#EF4444" strokeWidth="3" />
          <circle cx={mapXY(3, 0, -4.5, 4.5, -4, 10).px} cy={mapXY(3, 0, -4.5, 4.5, -4, 10).py} r="7" fill="#0A1324" stroke="#EF4444" strokeWidth="3" />
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="15" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
          (e) 9 − x² &gt; 0 (estrito!)  ⇒  D_q = (−3, 3)  (extremos abertos ○!)
        </text>
      </g>
    );
  }

  /* ==================== Q05: f(x) = x² - 3x + 2 & QUOCIENTE ==================== */
  if (q === 5) {
    if (sc === "evals" || sc === "solve-eq") {
      return (
        <g>
          <Axes xMin={-2} xMax={5} yMin={-1} yMax={7} yTicks={[{ v: 2 }, { v: 4 }, { v: 6 }]} clipId="q05Clip" />
          <g clipPath="url(#q05Clip)">
            <path d={buildCurve((x) => x * x - 3 * x + 2, -2, 5, -1, 7, Math.max(0.4, easeOut(t * 2)))} fill="none" stroke="#38BDF8" strokeWidth="3.6" />
            {sc === "solve-eq" && (
              <line x1={BOX.x + 8} y1={mapXY(0, 2, -2, 5, -1, 7).py} x2={BOX.x + BOX.w - 8} y2={mapXY(0, 2, -2, 5, -1, 7).py} stroke="#F59E0B" strokeWidth="2.4" strokeDasharray="6 4" />
            )}
            {[
              { x: -1, y: 6, lbl: "(−1, 6)", c: "#A855F7" },
              { x: 0, y: 2, lbl: "(0, 2)", c: "#F59E0B" },
              { x: 2, y: 0, lbl: "raiz (2, 0)", c: "#10B981" },
              { x: 3, y: 2, lbl: "(3, 2)", c: "#EF4444" },
            ].map((pt) => {
              const p = mapXY(pt.x, pt.y, -2, 5, -1, 7);
              return (
                <g key={pt.lbl}>
                  <circle cx={p.px} cy={p.py} r="6.5" fill={pt.c} stroke="#FFF" strokeWidth="2" />
                  <text x={p.px + 10} y={p.py - 8} fontSize="11.5" fontWeight="800" fill={pt.c} fontFamily="var(--font-mono), monospace">{pt.lbl}</text>
                </g>
              );
            })}
          </g>
          <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
            {sc === "evals"
              ? "f(−1) = 6  ·  f(0) = 2  ·  f(2) = 0 (raiz!)"
              : "f(x) = 2 ⇔ x² − 3x = 0 ⇔ x(x − 3) = 0  ⇒  x ∈ {0, 3}"}
          </text>
        </g>
      );
    }
    return (
      <StepBoard
        title={sc === "expand-fxh" ? "(b) Desenvolvimento Explícito de f(x + h)" : "(b) Simplificando [f(x + h) − f(x)] / h  (h ≠ 0)"}
        t={t}
        accent="#EF4444"
        lines={
          sc === "expand-fxh"
            ? [
                { tag: "Molde", expr: "f(□) = □² − 3·□ + 2", note: "Coloque (x + h) em TODA ocorrência de x!", color: "#38BDF8" },
                { tag: "Substitui", expr: "f(x+h) = (x + h)² − 3(x + h) + 2", note: "Atenção: (x+h)² = x² + 2xh + h² (não esqueça 2xh!)", color: "#F59E0B" },
                { tag: "Expandido", expr: "x² + 2xh + h² − 3x − 3h + 2", note: "Distribua −3 tanto em x quanto em h!", color: "#34D399" },
              ]
            : [
                { tag: "Subtrai f(x)", expr: "(x²+2xh+h²−3x−3h+2) − (x²−3x+2)", note: "Todos os termos SEM h cancelam exatamente!", color: "#38BDF8" },
                { tag: "Fatora h", expr: "= 2xh + h² − 3h = h · (2x + h − 3)", note: "Coloca h em evidência no numerador", color: "#F59E0B" },
                { tag: "Resultado", expr: "[f(x+h) − f(x)] / h = 2x + h − 3", note: "Spoiler P2: quando h → 0, nasce f'(x) = 2x − 3!", color: "#34D399" },
              ]
        }
      />
    );
  }

  /* ==================== Q06: (x²-1)/(x-1) vs x+1 ==================== */
  if (q === 6) {
    const hole = mapXY(1, 2, -3, 4, -2, 5);
    return (
      <g>
        <Axes xMin={-3} xMax={4} yMin={-2} yMax={5} clipId="q06Clip" />
        <g clipPath="url(#q06Clip)">
          <path d={buildCurve((x) => x + 1, -3, 4, -2, 5, Math.max(0.4, easeOut(t * 2)))} fill="none" stroke="#38BDF8" strokeWidth="4" />
          {/* Highlight hole vs solid */}
          <line x1={BOX.x + 10} y1={hole.py} x2={hole.px} y2={hole.py} stroke="#EF4444" strokeWidth="1.8" strokeDasharray="5 4" />
          <line x1={hole.px} y1={hole.py} x2={hole.px} y2={mapXY(1, 0, -3, 4, -2, 5).py} stroke="#EF4444" strokeWidth="1.8" strokeDasharray="5 4" />
          <circle cx={hole.px} cy={hole.py} r="9" fill="#0A1324" stroke="#EF4444" strokeWidth="3.5" />
          <text x={hole.px + 14} y={hole.py - 10} fontSize="13.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
            f: BURACO (1, 2) · g: cheio ●
          </text>
          {sc === "images" && (
            <circle cx={mapXY(0, 2, -3, 4, -2, 5).px} cy={hole.py} r="6.5" fill="#0A1324" stroke="#F59E0B" strokeWidth="3" />
          )}
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
          {sc === "domains"
            ? "(a) D_f = ℝ\\{1}, D_g = ℝ · f(x) = x + 1 somente para x ≠ 1!"
            : sc === "graphs-diff"
              ? "(b) Gráficos DIFERENTES: f perde (1, 2) pois dá 0/0!"
              : "(c) Im_g = ℝ   vs   Im_f = ℝ \\ {2}  (y = 2 nunca é atingido!)"}
        </text>
      </g>
    );
  }

  /* ==================== Q07: f, g, h com x -> x² ==================== */
  if (q === 7) {
    const p = Math.max(0.4, easeOut(t * 2));
    return (
      <g>
        <Axes xMin={-3} xMax={3} yMin={-1} yMax={5} yTicks={[{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }]} clipId="q07Clip" />
        <g clipPath="url(#q07Clip)">
          <path d={buildCurve((x) => x * x, -3, 3, -1, 5, p)} fill="none" stroke="#475569" strokeWidth="2.2" strokeDasharray="5 4" />
          {/* Highlight h on [-2, 1] */}
          <path d={buildCurve((x) => (x >= -2 && x <= 1 ? x * x : null), -3, 3, -1, 5, p)} fill="none" stroke="#10B981" strokeWidth="4.5" />
          {sc === "solve-4" && (
            <line x1={BOX.x + 8} y1={mapXY(0, 4, -3, 3, -1, 5).py} x2={BOX.x + BOX.w - 8} y2={mapXY(0, 4, -3, 3, -1, 5).py} stroke="#F59E0B" strokeWidth="2.4" strokeDasharray="6 4" />
          )}
          <circle cx={mapXY(-2, 4, -3, 3, -1, 5).px} cy={mapXY(-2, 4, -3, 3, -1, 5).py} r="7" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <circle cx={mapXY(0, 0, -3, 3, -1, 5).px} cy={mapXY(0, 0, -3, 3, -1, 5).py} r="6.5" fill="#38BDF8" stroke="#FFF" strokeWidth="2" />
          <circle cx={mapXY(1, 1, -3, 3, -1, 5).px} cy={mapXY(1, 1, -3, 3, -1, 5).py} r="6.5" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <circle cx={mapXY(2, 4, -3, 3, -1, 5).px} cy={mapXY(2, 4, -3, 3, -1, 5).py} r="7" fill="#0A1324" stroke="#EF4444" strokeWidth="3" />
          <text x={mapXY(2, 4, -3, 3, -1, 5).px - 10} y={mapXY(2, 4, -3, 3, -1, 5).py + 22} textAnchor="end" fontSize="11.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">x=+2 fora de h!</text>
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
          {sc === "compare-fg"
            ? "Im_f = Im_g = [0, ∞) · f não sobrejetora, g é sobrejetora!"
            : sc === "image-h"
              ? "h em [−2, 1]: vértice x = 0 dá mín 0, h(−2) = 4 ⇒ Im_h = [0, 4]!"
              : "y = 4: S_f = S_g = {−2, 2}   ·   S_h = {−2} (só −2 ∈ [−2, 1]!)"}
        </text>
      </g>
    );
  }

  /* ==================== Q08: GRÁFICO POR PARTES EXATO DA PÁGINA 2 ==================== */
  if (q === 8) {
    const pt = (x: number, y: number) => mapXY(x, y, -3.6, 4.6, -2.6, 3.6);
    const pA = pt(-3, -1);
    const pB = pt(-1, 3);
    const pC = pt(1, 1);
    const pD = pt(1, -2);
    const pE = pt(4, 1);
    const r1 = pt(-2.5, 0);
    const r2 = pt(3, 0);
    const y1 = pt(0, 1).py;
    const xAx = pt(0, 0).py;
    return (
      <g>
        <Axes xMin={-3.6} xMax={4.6} yMin={-2.6} yMax={3.6} clipId="q08Clip" />
        <g clipPath="url(#q08Clip)">
          {sc === "neg-region" && (
            <>
              <rect x={pA.px} y={xAx} width={r1.px - pA.px} height={BOX.y + BOX.h - xAx} fill="rgba(239,68,68,0.18)" />
              <rect x={pD.px} y={xAx} width={r2.px - pD.px} height={BOX.y + BOX.h - xAx} fill="rgba(239,68,68,0.18)" />
            </>
          )}
          {sc === "eq-1-trap" && (
            <line x1={BOX.x + 8} y1={y1} x2={BOX.x + BOX.w - 8} y2={y1} stroke="#F59E0B" strokeWidth="2.4" strokeDasharray="6 4" />
          )}
          {/* Exact 3 line segments from PDF page 2 */}
          <line x1={pA.px} y1={pA.py} x2={pB.px} y2={pB.py} stroke="#38BDF8" strokeWidth="3.8" />
          <line x1={pB.px} y1={pB.py} x2={pC.px} y2={pC.py} stroke="#38BDF8" strokeWidth="3.8" />
          <line x1={pD.px} y1={pD.py} x2={pE.px} y2={pE.py} stroke="#38BDF8" strokeWidth="3.8" />
          {/* Endpoints: ● filled vs ○ hollow */}
          <circle cx={pA.px} cy={pA.py} r="6.5" fill="#38BDF8" stroke="#FFF" strokeWidth="2" />
          <circle cx={pB.px} cy={pB.py} r="6.5" fill="#38BDF8" stroke="#FFF" strokeWidth="2" />
          <circle cx={pC.px} cy={pC.py} r="7.5" fill="#0A1324" stroke="#EF4444" strokeWidth="3.2" />
          <circle cx={pD.px} cy={pD.py} r="7" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <circle cx={pE.px} cy={pE.py} r="6.5" fill="#38BDF8" stroke="#FFF" strokeWidth="2" />
          {/* Highlight roots & y=1 hits */}
          <circle cx={r1.px} cy={r1.py} r="6" fill="#10B981" stroke="#FFF" strokeWidth="1.8" />
          <circle cx={r2.px} cy={r2.py} r="6" fill="#10B981" stroke="#FFF" strokeWidth="1.8" />
          {sc === "eq-1-trap" && (
            <>
              <circle cx={pt(-2, 1).px} cy={pt(-2, 1).py} r="7" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
              <circle cx={pE.px} cy={pE.py} r="7" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
              <text x={pC.px + 12} y={pC.py - 8} fontSize="11.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">(1,1) vazio ○ ✗</text>
            </>
          )}
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.2" fontWeight="800" fill="#F9A8D4" fontFamily="var(--font-mono), monospace">
          {sc === "anatomy"
            ? "(a) D = [−3, 4] · Im = [−2, 3] · f(−1) = 3 · f(1) = −2 (●)"
            : sc === "roots-eq0"
              ? "(b) f(x) = 0  ⇒  x = −5/2 (−2,5)  e  x = 3"
              : sc === "eq-1-trap"
                ? "(b) f(x) = 1  ⇒  x = −2 e x = 4  (x = 1 NÃO entra!)"
                : "(c) f(x) < 0  ⇒  x ∈ [−3, −5/2) ∪ [1, 3)"}
        </text>
      </g>
    );
  }

  /* ==================== Q09: EXISTÊNCIA E UNICIDADE ==================== */
  if (q === 9) {
    if (sc === "item-a") {
      const scanX = 0.6 + t * 3.2;
      const sx = mapXY(scanX, 0, -1, 5, -3, 3).px;
      return (
        <g>
          <Axes xMin={-1} xMax={5} yMin={-3} yMax={3} clipId="q09aClip" />
          <g clipPath="url(#q09aClip)">
            <path d={buildCurve((x) => (x >= 0 ? Math.sqrt(x) : null), -1, 5, -3, 3, 1)} fill="none" stroke="#F97316" strokeWidth="3.5" />
            <path d={buildCurve((x) => (x >= 0 ? -Math.sqrt(x) : null), -1, 5, -3, 3, 1)} fill="none" stroke="#F97316" strokeWidth="3.5" />
            <line x1={sx} y1={BOX.y + 8} x2={sx} y2={BOX.y + BOX.h - 8} stroke="#EF4444" strokeWidth="2.4" strokeDasharray="6 4" />
            <circle cx={sx} cy={mapXY(scanX, Math.sqrt(scanX), -1, 5, -3, 3).py} r="7" fill="#EF4444" stroke="#FFF" strokeWidth="2" />
            <circle cx={sx} cy={mapXY(scanX, -Math.sqrt(scanX), -1, 5, -3, 3).py} r="7" fill="#EF4444" stroke="#FFF" strokeWidth="2" />
          </g>
          <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
            (a) y² = x: corta em 2 pontos (+√x e −√x) ⇒ VIOLA UNICIDADE (NÃO é função!)
          </text>
        </g>
      );
    }
    if (sc === "item-b") {
      const scanX = -3.2 + t * 6.4;
      const sy = Math.cbrt(scanX);
      const pt = mapXY(scanX, sy);
      return (
        <g>
          <Axes clipId="q09bClip" />
          <g clipPath="url(#q09bClip)">
            <path d={buildCurve((x) => Math.cbrt(x), -4, 4, -3, 3, 1)} fill="none" stroke="#10B981" strokeWidth="3.8" />
            <line x1={pt.px} y1={BOX.y + 8} x2={pt.px} y2={BOX.y + BOX.h - 8} stroke="#38BDF8" strokeWidth="2.2" strokeDasharray="6 4" />
            <circle cx={pt.px} cy={pt.py} r="7.5" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          </g>
          <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
            (b) y³ = x ⇔ y = ∛x: exatamente 1 saída real por x ∈ ℝ ⇒ É FUNÇÃO ✓
          </text>
        </g>
      );
    }
    const fixed = sc === "item-c-fix";
    return (
      <g>
        <Axes xMin={-2} xMax={2} yMin={-1.6} yMax={1.6} clipId="q09cClip" />
        <g clipPath="url(#q09cClip)">
          <path d={buildCurve((x) => (Math.abs(x) <= 1 ? Math.sqrt(Math.max(0, 1 - x * x)) : null), -2, 2, -1.6, 1.6, 1)} fill="none" stroke="#10B981" strokeWidth="4.2" />
          <path
            d={buildCurve((x) => (Math.abs(x) <= 1 ? -Math.sqrt(Math.max(0, 1 - x * x)) : null), -2, 2, -1.6, 1.6, 1)}
            fill="none"
            stroke="#EF4444"
            strokeWidth={fixed ? 2 : 3.8}
            strokeDasharray={fixed ? "6 6" : undefined}
            opacity={fixed ? 0.3 : 1}
          />
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={fixed ? "#6EE7B7" : "#FCA5A5"} fontFamily="var(--font-mono), monospace">
          {fixed
            ? "Impondo y ≥ 0: y = √(1 − x²) em [−1, 1] (semicírculo superior = FUNÇÃO ✓!)"
            : "(c) x² + y² = 1: em x = 0 dá y = +1 e −1 ⇒ NÃO é função!"}
        </text>
      </g>
    );
  }

  /* ==================== Q10: AFIM f(x) = -2x + 2 ==================== */
  if (q === 10) {
    const p1 = mapXY(-1, 4, -2.5, 4.5, -5, 5);
    const p2 = mapXY(3, -4, -2.5, 4.5, -5, 5);
    const cY = mapXY(0, 2, -2.5, 4.5, -5, 5);
    const cX = mapXY(1, 0, -2.5, 4.5, -5, 5);
    return (
      <g>
        <Axes xMin={-2.5} xMax={4.5} yMin={-5} yMax={5} yTicks={[{ v: -4 }, { v: -2 }, { v: 2 }, { v: 4 }]} clipId="q10Clip" />
        <g clipPath="url(#q10Clip)">
          <path d={buildCurve((x) => -2 * x + 2, -2.5, 4.5, -5, 5, 1)} fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeOpacity={sc === "restricted-im" ? 0.35 : 1} />
          {sc === "restricted-im" && (
            <line x1={p1.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#10B981" strokeWidth="5" />
          )}
          <circle cx={p1.px} cy={p1.py} r="6.5" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
          <circle cx={p2.px} cy={p2.py} r="6.5" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
          <circle cx={cY.px} cy={cY.py} r="6" fill="#A855F7" stroke="#FFF" strokeWidth="2" />
          <circle cx={cX.px} cy={cX.py} r="6" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <text x={p1.px + 10} y={p1.py + 4} fontSize="11.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">(−1, 4)</text>
          <text x={p2.px - 10} y={p2.py - 8} textAnchor="end" fontSize="11.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">(3, −4)</text>
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
          {sc === "find-ab"
            ? "(a) f(x) = −2x + 2 · Corte Y (0, 2) · Corte X (1, 0)"
            : sc === "diff-quot"
              ? "(b) [f(x+h)−f(x)]/h = −2 (inclinação constante: desce 2 por +1 em x!)"
              : "(c) Decrescente em [−1, 3] ⇒ Im = [−4, 4]!"}
        </text>
      </g>
    );
  }

  /* ==================== Q11: q(x) = 2x² - 8x + 6 ==================== */
  if (q === 11) {
    const xV = mapXY(2, -2, -1, 5, -3, 7);
    const p0 = mapXY(0, 6, -1, 5, -3, 7);
    const p3 = mapXY(3, 0, -1, 5, -3, 7);
    return (
      <g>
        <Axes xMin={-1} xMax={5} yMin={-3} yMax={7} yTicks={[{ v: -2 }, { v: 2 }, { v: 4 }, { v: 6 }]} clipId="q11Clip" />
        <g clipPath="url(#q11Clip)">
          <line x1={xV.px} y1={BOX.y + 8} x2={xV.px} y2={BOX.y + BOX.h - 8} stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 4" />
          <path d={buildCurve((x) => 2 * (x - 2) * (x - 2) - 2, -1, 5, -3, 7, 1)} fill="none" stroke="#38BDF8" strokeWidth="3.2" strokeOpacity={sc === "restrict-03" ? 0.35 : 1} />
          {sc === "restrict-03" && (
            <path d={buildCurve((x) => (x >= 0 && x <= 3 ? 2 * (x - 2) * (x - 2) - 2 : null), -1, 5, -3, 7, 1)} fill="none" stroke="#10B981" strokeWidth="5" />
          )}
          <circle cx={xV.px} cy={xV.py} r="7" fill="#EF4444" stroke="#FFF" strokeWidth="2" />
          <circle cx={p0.px} cy={p0.py} r="6.5" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
          <circle cx={p3.px} cy={p3.py} r="6.5" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <circle cx={mapXY(1, 0, -1, 5, -3, 7).px} cy={mapXY(1, 0, -1, 5, -3, 7).py} r="6.5" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <text x={xV.px + 10} y={xV.py + 5} fontSize="12" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">V(2, −2)</text>
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">
          {sc === "complete-sq"
            ? "(a) q(x) = 2(x − 2)² − 2 · Vértice (2, −2) · Eixo x = 2"
            : sc === "roots-sign"
              ? "(b) Raízes {1, 3} · Negativa em (1, 3) · Im = [−2, +∞)"
              : "(c) Em [0, 3]: vértice (2, −2) está dentro! q(0) = 6 ⇒ Im = [−2, 6]"}
        </text>
      </g>
    );
  }

  /* ==================== Q12: 4 GRÁFICOS ELEMENTARES (x³, √x, 1/x, 1/x²) ==================== */
  if (q === 12) {
    if (sc === "cubic-sqrt") {
      const bL = { x: 86, y: 100, w: 300, h: 296 };
      const bR = { x: 412, y: 100, w: 300, h: 296 };
      return (
        <g>
          <Axes xMin={-2.5} xMax={2.5} yMin={-4} yMax={4} clipId="q12aClip" box={bL} />
          <g clipPath="url(#q12aClip)">
            <path d={buildCurve((x) => x * x * x, -2.5, 2.5, -4, 4, Math.max(0.4, easeOut(t * 2)), bL)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
          </g>
          <text x="236" y="424" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">(a) y = x³ · D = Im = ℝ</text>

          <Axes xMin={-1} xMax={5} yMin={-1} yMax={3} clipId="q12bClip" box={bR} />
          <g clipPath="url(#q12bClip)">
            <path d={buildCurve((x) => (x >= 0 ? Math.sqrt(x) : null), -1, 5, -1, 3, Math.max(0.4, easeOut(t * 2)), bR)} fill="none" stroke="#10B981" strokeWidth="3.5" />
          </g>
          <text x="562" y="424" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">(b) y = √x · D = Im = [0, ∞)</text>
        </g>
      );
    }
    const isSq = sc === "inv-x2";
    return (
      <g>
        <Axes xMin={-4} xMax={4} yMin={isSq ? -1 : -4} yMax={4} clipId="q12cdClip" />
        <g clipPath="url(#q12cdClip)">
          <path
            d={buildCurve((x) => (x < -0.15 ? (isSq ? 1 / (x * x) : 1 / x) : null), -4, 4, isSq ? -1 : -4, 4, Math.max(0.4, easeOut(t * 2)))}
            fill="none"
            stroke={isSq ? "#F59E0B" : "#38BDF8"}
            strokeWidth="3.8"
          />
          <path
            d={buildCurve((x) => (x > 0.15 ? (isSq ? 1 / (x * x) : 1 / x) : null), -4, 4, isSq ? -1 : -4, 4, Math.max(0.4, easeOut(t * 2)))}
            fill="none"
            stroke={isSq ? "#F59E0B" : "#38BDF8"}
            strokeWidth="3.8"
          />
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill={isSq ? "#FDE047" : "#7DD3FC"} fontFamily="var(--font-mono), monospace">
          {isSq
            ? "(d) y = 1/x²: x² > 0 sempre ⇒ 1º e 2º quadrantes · Im = (0, +∞)!"
            : "(c) y = 1/x: preserva o sinal de x ⇒ 1º e 3º quadrantes · Im = ℝ\\{0}"}
        </text>
      </g>
    );
  }

  /* ==================== Q13: CÍRCULO UNITÁRIO + SIN & COS EM [-π, π] ==================== */
  if (q === 13) {
    if (sc === "unit-circle" || sc === "period-2pi") {
      const ang = t * Math.PI * 2;
      const cx = 240;
      const cy = 250;
      const R = 108;
      const px = cx + R * Math.cos(ang);
      const py = cy - R * Math.sin(ang);
      return (
        <g>
          <text x="86" y="112" fontSize="20" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            {sc === "unit-circle" ? "(a) Círculo Unitário (r = 1) ⇒ cos x, sin x ∈ [−1, 1]" : "(b) Período 2π: +2π radianos = 1 Volta Completa!"}
          </text>
          <line x1={cx - 132} y1={cy} x2={cx + 132} y2={cy} stroke="#64748B" strokeWidth="1.8" />
          <line x1={cx} y1={cy - 132} x2={cx} y2={cy + 132} stroke="#64748B" strokeWidth="1.8" />
          <circle cx={cx} cy={cy} r={R} fill="rgba(168,85,247,0.1)" stroke="#A855F7" strokeWidth="3" />
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="#F59E0B" strokeWidth="3" />
          <line x1={px} y1={py} x2={px} y2={cy} stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="4 3" />
          <line x1={cx} y1={cy} x2={px} y2={cy} stroke="#10B981" strokeWidth="3" />
          <circle cx={px} cy={py} r="8" fill="#FDE047" stroke="#FFF" strokeWidth="2" />

          <rect x="404" y="156" width="308" height="196" rx="16" fill="#0A1324" stroke="#A855F7" strokeWidth="1.8" />
          <text x="426" y="192" fontSize="14.5" fontWeight="800" fill="#E9D5FF" fontFamily="var(--font-mono), monospace">P = (cos x, sin x)</text>
          <text x="426" y="224" fontSize="14" fontWeight="800" fill="#34D399" fontFamily="var(--font-mono), monospace">cos x = {Math.cos(ang).toFixed(2)} ∈ [−1, 1]</text>
          <text x="426" y="254" fontSize="14" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">sin x = {Math.sin(ang).toFixed(2)} ∈ [−1, 1]</text>
          <text x="426" y="292" fontSize="13" fill="#CBD5E1" fontFamily="var(--font-mono), monospace">cos²x + sin²x = 1</text>
          <text x="426" y="324" fontSize="12.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">
            {sc === "period-2pi" ? "sin(x+2π)=sin x · cos(x+2π)=cos x" : "Imagem exata = [−1, 1]!"}
          </text>
        </g>
      );
    }
    const isCos = sc === "sketch-cos";
    const pi = Math.PI;
    const xTicks = [
      { v: -pi, lbl: "−π" },
      { v: -pi / 2, lbl: "−π/2" },
      { v: pi / 2, lbl: "π/2" },
      { v: pi, lbl: "π" },
    ];
    const keyPts = isCos
      ? [
          { x: -pi, y: -1, c: "#EF4444" },
          { x: -pi / 2, y: 0, c: "#10B981" },
          { x: 0, y: 1, c: "#F59E0B" },
          { x: pi / 2, y: 0, c: "#10B981" },
          { x: pi, y: -1, c: "#EF4444" },
        ]
      : [
          { x: -pi, y: 0, c: "#10B981" },
          { x: -pi / 2, y: -1, c: "#EF4444" },
          { x: 0, y: 0, c: "#10B981" },
          { x: pi / 2, y: 1, c: "#F59E0B" },
          { x: pi, y: 0, c: "#10B981" },
        ];
    return (
      <g>
        <Axes xMin={-3.5} xMax={3.5} yMin={-1.5} yMax={1.5} xTicks={xTicks} yTicks={[{ v: -1 }, { v: 1 }]} clipId="q13gClip" />
        <g clipPath="url(#q13gClip)">
          <path
            d={buildCurve((x) => (Math.abs(x) <= pi ? (isCos ? Math.cos(x) : Math.sin(x)) : null), -3.5, 3.5, -1.5, 1.5, Math.max(0.4, easeOut(t * 2)))}
            fill="none"
            stroke={isCos ? "#A855F7" : "#38BDF8"}
            strokeWidth="4"
          />
          {keyPts.map((kp, i) => {
            const p = mapXY(kp.x, kp.y, -3.5, 3.5, -1.5, 1.5);
            return <circle key={i} cx={p.px} cy={p.py} r="7" fill={kp.c} stroke="#FFF" strokeWidth="2" />;
          })}
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14" fontWeight="800" fill={isCos ? "#E9D5FF" : "#7DD3FC"} fontFamily="var(--font-mono), monospace">
          {isCos
            ? "y = cos x: zeros ±π/2 · máx +1 em 0 · mín −1 em ±π"
            : "y = sin x: zeros −π, 0, π · máx +1 em π/2 · mín −1 em −π/2"}
        </text>
      </g>
    );
  }

  /* ==================== Q14: 4 TRANSFORMAÇÕES DE √x ==================== */
  if (q === 14) {
    const p = Math.max(0.45, easeOut(t * 2));
    return (
      <g>
        <Axes xMin={-5} xMax={6} yMin={-3} yMax={5} clipId="q14Clip" />
        <g clipPath="url(#q14Clip)">
          {/* Reference y = √x */}
          <path d={buildCurve((x) => (x >= 0 ? Math.sqrt(x) : null), -5, 6, -3, 5, 1)} fill="none" stroke="#94A3B8" strokeWidth="2.4" strokeDasharray="6 4" />
          {sc === "trans-ab" && (
            <>
              <path d={buildCurve((x) => (x >= 2 ? Math.sqrt(x - 2) : null), -5, 6, -3, 5, p)} fill="none" stroke="#38BDF8" strokeWidth="4" />
              <path d={buildCurve((x) => (x >= 0 ? Math.sqrt(x) + 2 : null), -5, 6, -3, 5, p)} fill="none" stroke="#10B981" strokeWidth="4" />
              <text x={mapXY(4.4, 1.1, -5, 6, -3, 5).px} y={mapXY(4.4, 1.1, -5, 6, -3, 5).py} fontSize="12" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">(a) √(x−2)</text>
              <text x={mapXY(2.2, 4.1, -5, 6, -3, 5).px} y={mapXY(2.2, 4.1, -5, 6, -3, 5).py} fontSize="12" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">(b) √x + 2</text>
            </>
          )}
          {sc === "trans-c" && (
            <path d={buildCurve((x) => (x >= 0 ? -Math.sqrt(x) : null), -5, 6, -3, 5, p)} fill="none" stroke="#EF4444" strokeWidth="4" />
          )}
          {sc === "trans-d" && (
            <path d={buildCurve((x) => (x <= 0 ? Math.sqrt(-x) : null), -5, 6, -3, 5, p)} fill="none" stroke="#A855F7" strokeWidth="4" />
          )}
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.2" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
          {sc === "trans-ab"
            ? "(a) √(x−2): 2 p/ direita (muda D) · (b) √x + 2: 2 p/ cima (muda Im)"
            : sc === "trans-c"
              ? "(c) y = −√x: reflexão no eixo X · D = [0, ∞), Im = (−∞, 0]"
              : "(d) y = √(−x): reflexão no eixo Y · D = (−∞, 0], Im = [0, ∞)"}
        </text>
      </g>
    );
  }

  /* ==================== Q15: r(x) = (x+2)/(x-1) = 1 + 3/(x-1) ==================== */
  if (q === 15) {
    const aV = mapXY(1, 0, -4, 6, -4, 6).px;
    const aH = mapXY(0, 1, -4, 6, -4, 6).py;
    return (
      <g>
        <Axes xMin={-4} xMax={6} yMin={-4} yMax={6} clipId="q15Clip" />
        <g clipPath="url(#q15Clip)">
          <line x1={aV} y1={BOX.y + 8} x2={aV} y2={BOX.y + BOX.h - 8} stroke="#EF4444" strokeWidth="2.4" strokeDasharray="6 4" />
          <line x1={BOX.x + 8} y1={aH} x2={BOX.x + BOX.w - 8} y2={aH} stroke="#F59E0B" strokeWidth="2.4" strokeDasharray="6 4" />
          <path d={buildCurve((x) => (x < 0.85 ? 1 + 3 / (x - 1) : null), -4, 6, -4, 6, 1)} fill="none" stroke="#38BDF8" strokeWidth="3.6" />
          <path d={buildCurve((x) => (x > 1.15 ? 1 + 3 / (x - 1) : null), -4, 6, -4, 6, 1)} fill="none" stroke={sc === "im-ineq" ? "#10B981" : "#38BDF8"} strokeWidth={sc === "im-ineq" ? 4.8 : 3.6} />
          <circle cx={mapXY(-2, 0, -4, 6, -4, 6).px} cy={mapXY(-2, 0, -4, 6, -4, 6).py} r="6.5" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <circle cx={mapXY(0, -2, -4, 6, -4, 6).px} cy={mapXY(0, -2, -4, 6, -4, 6).py} r="6.5" fill="#A855F7" stroke="#FFF" strokeWidth="2" />
          <text x={aV + 8} y={BOX.y + 28} fontSize="11.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">x = 1</text>
          <text x={BOX.x + BOX.w - 14} y={aH - 8} textAnchor="end" fontSize="11.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">y = 1</text>
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.2" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
          {sc === "basics"
            ? "(a) D = ℝ\\{1} · Raiz (−2, 0) · Corte Y (0, −2)"
            : sc === "decomp"
              ? "(b) r(x) = 1 + 3/(x − 1): assíntotas x = 1 e y = 1!"
              : "(c) Im = ℝ\\{1} · r(x) > 1 ⇔ 3/(x−1) > 0 ⇔ x ∈ (1, +∞)!"}
        </text>
      </g>
    );
  }

  /* ==================== Q16: m(x) = |x - 2| ==================== */
  if (q === 16) {
    if (sc === "distance") {
      const tk = [-2, -1, 0, 1, 2, 3, 4, 5, 6].map((v) => ({ v }));
      return (
        <g>
          <text x="86" y="114" fontSize="20" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            (c) Interpretação como Distância até o Centro x = 2!
          </text>
          <rect x="86" y="138" width="626" height="252" rx="18" fill="#0A1324" stroke="#F43F5E" strokeWidth="1.8" />
          <NumberLineRow y={214} label="|x − 2| = 3  ⇒  x = −1 e x = 5 (distância exata = 3 até 2)" color="#F59E0B" minV={-2.5} maxV={6.5} ticks={tk} segments={[{ lo: -1, hi: -1, cLo: true, cHi: true }, { lo: 5, hi: 5, cLo: true, cHi: true }]} />
          <NumberLineRow y={322} label="|x − 2| ≤ 3  ⇒  x ∈ [−1, 5] (distância ≤ 3 até o centro 2)" color="#10B981" minV={-2.5} maxV={6.5} ticks={tk} segments={[{ lo: -1, hi: 5, cLo: true, cHi: true }]} />
        </g>
      );
    }
    return (
      <g>
        <Axes xMin={-2} xMax={6} yMin={-1} yMax={5} clipId="q16Clip" />
        <g clipPath="url(#q16Clip)">
          <path d={buildCurve((x) => Math.abs(x - 2), -2, 6, -1, 5, Math.max(0.4, easeOut(t * 2)))} fill="none" stroke="#F43F5E" strokeWidth="4" />
          <circle cx={mapXY(2, 0, -2, 6, -1, 5).px} cy={mapXY(2, 0, -2, 6, -1, 5).py} r="7" fill="#FDE047" stroke="#FFF" strokeWidth="2" />
          <text x={mapXY(0, 2.5, -2, 6, -1, 5).px} y={mapXY(0, 2.5, -2, 6, -1, 5).py} fontSize="12" fontWeight="800" fill="#FDA4AF" fontFamily="var(--font-mono), monospace">x &lt; 2: 2 − x</text>
          <text x={mapXY(3.8, 2.5, -2, 6, -1, 5).px} y={mapXY(3.8, 2.5, -2, 6, -1, 5).py} fontSize="12" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">x ≥ 2: x − 2</text>
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#FDA4AF" fontFamily="var(--font-mono), monospace">
          m(x) = |x − 2| · Vértice (2, 0) · D = ℝ · Im = [0, +∞)
        </text>
      </g>
    );
  }

  /* ==================== Q17: MISTURA DE SAL C(v) = 2 + 8/(1+v) ==================== */
  if (q === 17) {
    const vAnim = t * 7;
    const cAnim = 2 + 8 / (1 + vAnim);
    if (sc === "deduce-cv") {
      const fillH = 44 + Math.min(100, vAnim * 14);
      return (
        <g>
          <text x="86" y="112" fontSize="20" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            (a) Tanque de Mistura Salina · Deduzindo C(v)
          </text>
          {/* Animated Salt Tank */}
          <rect x="116" y="170" width="160" height="190" rx="14" fill="#0A1324" stroke="#94A3B8" strokeWidth="3" />
          <rect x="120" y={356 - fillH} width="152" height={fillH} rx="10" fill="rgba(20,184,166,0.38)" />
          <text x="196" y="340" textAnchor="middle" fontSize="13" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">
            V = 1 + {vAnim.toFixed(1)} L
          </text>
          <text x="196" y="156" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
            + v litros (2 g/L) ↓
          </text>
          <rect x="316" y="158" width="396" height="212" rx="16" fill="#0A1324" stroke="#14B8A6" strokeWidth="1.8" />
          <text x="338" y="194" fontSize="14.5" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">Massa de sal: M(v) = 10 + 2v (g)</text>
          <text x="338" y="226" fontSize="14.5" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">Volume total: V(v) = 1 + v (L)</text>
          <text x="338" y="272" fontSize="16" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">C(v) = (10 + 2v)/(1 + v)</text>
          <text x="338" y="304" fontSize="16" fontWeight="800" fill="#34D399" fontFamily="var(--font-mono), monospace">     = 2 + 8/(1 + v)  g/L</text>
          <text x="338" y="344" fontSize="13" fill="#CBD5E1" fontFamily="var(--font-mono), monospace">Agora: C({vAnim.toFixed(1)}) = {cAnim.toFixed(2)} g/L</text>
        </g>
      );
    }
    const p0 = mapXY(0, 10, -0.5, 10, 0, 11.5);
    const p3 = mapXY(3, 4, -0.5, 10, 0, 11.5);
    const asym2 = mapXY(0, 2, -0.5, 10, 0, 11.5).py;
    return (
      <g>
        <Axes xMin={-0.5} xMax={10} yMin={0} yMax={11.5} xLabel="v (L)" yLabel="C (g/L)" xTicks={[{ v: 2 }, { v: 4 }, { v: 6 }, { v: 8 }]} yTicks={[{ v: 2 }, { v: 4 }, { v: 6 }, { v: 8 }, { v: 10 }]} clipId="q17Clip" />
        <g clipPath="url(#q17Clip)">
          <line x1={BOX.x + 8} y1={asym2} x2={BOX.x + BOX.w - 8} y2={asym2} stroke="#EF4444" strokeWidth="2.4" strokeDasharray="6 4" />
          <path d={buildCurve((v) => (v >= 0 ? 2 + 8 / (1 + v) : null), -0.5, 10, 0, 11.5, Math.max(0.4, easeOut(t * 2)))} fill="none" stroke="#14B8A6" strokeWidth="4" />
          <circle cx={p0.px} cy={p0.py} r="7" fill="#14B8A6" stroke="#FFF" strokeWidth="2" />
          <circle cx={p3.px} cy={p3.py} r="7" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
          <text x={p0.px + 12} y={p0.py + 4} fontSize="11.5" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">(0, 10)</text>
          <text x={p3.px + 10} y={p3.py - 8} fontSize="11.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">(3, 4)</text>
          <text x={BOX.x + BOX.w - 14} y={asym2 - 8} textAnchor="end" fontSize="11.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">Assíntota C = 2 g/L</text>
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="14.2" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">
          {sc === "phys-dom-im"
            ? "(b) D_fís = [0, +∞) · Im_C = (2, 10] (nunca zera 8/(1+v)!)"
            : sc === "solve-4-2"
              ? "(c) C(3) = 4 g/L · C(v) = 2 ⇒ 8 = 0 (IMPOSSÍVEL c/ v finito!)"
              : "(d) Diluição contínua: cai de 10 g/L rumo à assíntota C = 2 g/L"}
        </text>
      </g>
    );
  }

  /* ==================== Q18: ILUMINAÇÃO E(x) = K/(x²+9) ==================== */
  if (sc === "pythagoras") {
    const sx = -3 + t * 6;
    const pSrc = mapXY(0, 3, -5, 5, -0.5, 4);
    const pOrg = mapXY(0, 0, -5, 5, -0.5, 4);
    const pSen = mapXY(sx, 0, -5, 5, -0.5, 4);
    const rVal = Math.sqrt(sx * sx + 9);
    return (
      <g>
        <Axes xMin={-5} xMax={5} yMin={-0.5} yMax={4} xLabel="x (m)" yLabel="y (m)" clipId="q18aClip" />
        <g clipPath="url(#q18aClip)">
          <polygon points={`${pOrg.px},${pOrg.py} ${pSrc.px},${pSrc.py} ${pSen.px},${pSen.py}`} fill="rgba(251,191,36,0.18)" />
          <line x1={pSrc.px} y1={pSrc.py} x2={pSen.px} y2={pSen.py} stroke="#FBBF24" strokeWidth="3.5" />
          <circle cx={pSrc.px} cy={pSrc.py} r="10" fill="#FDE047" stroke="#FFF" strokeWidth="2.5" />
          <circle cx={pSen.px} cy={pSen.py} r="8" fill="#38BDF8" stroke="#FFF" strokeWidth="2" />
          <text x={pSrc.px + 14} y={pSrc.py + 5} fontSize="12.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">Fonte P(0, 3)</text>
          <text x={pSen.px} y={pSen.py - 12} textAnchor="middle" fontSize="12" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">Q({sx.toFixed(1)}, 0)</text>
          <text x={(pSrc.px + pSen.px) / 2 + 12} y={(pSrc.py + pSen.py) / 2} fontSize="12" fontWeight="800" fill="#FEF08A" fontFamily="var(--font-mono), monospace">r = {rVal.toFixed(2)} m</text>
        </g>
        <text x="399" y="432" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">
          (a) Pitágoras: r² = x² + 3² = x² + 9  ⇒  E(x) = K / (x² + 9)
        </text>
      </g>
    );
  }
  // Bell curve E(x) = 9/(x²+9) normalized so peak = 1 (= K/9)
  const peak = mapXY(0, 1, -7, 7, -0.1, 1.25);
  const hL = mapXY(-3, 0.5, -7, 7, -0.1, 1.25);
  const hR = mapXY(3, 0.5, -7, 7, -0.1, 1.25);
  return (
    <g>
      <Axes
        xMin={-7}
        xMax={7}
        yMin={-0.1}
        yMax={1.25}
        xLabel="x (m)"
        yLabel="E(x)"
        xTicks={[{ v: -6 }, { v: -3 }, { v: 3 }, { v: 6 }]}
        yTicks={[{ v: 0.5, lbl: "K/18" }, { v: 1, lbl: "K/9" }]}
        clipId="q18bClip"
      />
      <g clipPath="url(#q18bClip)">
        <path d={buildCurve((x) => 9 / (x * x + 9), -7, 7, -0.1, 1.25, Math.max(0.45, easeOut(t * 2)))} fill="none" stroke="#FBBF24" strokeWidth="4" />
        <line x1={hL.px} y1={hL.py} x2={hR.px} y2={hR.py} stroke="#38BDF8" strokeWidth="2" strokeDasharray="5 4" />
        <circle cx={peak.px} cy={peak.py} r="7.5" fill="#10B981" stroke="#FFF" strokeWidth="2" />
        <circle cx={hL.px} cy={hL.py} r="7" fill="#38BDF8" stroke="#FFF" strokeWidth="2" />
        <circle cx={hR.px} cy={hR.py} r="7" fill="#38BDF8" stroke="#FFF" strokeWidth="2" />
        <text x={peak.px + 12} y={peak.py - 4} fontSize="11.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">Máx (0, K/9)</text>
        <text x={hL.px - 8} y={hL.py - 10} textAnchor="end" fontSize="11.5" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">(−3, K/18)</text>
        <text x={hR.px + 8} y={hR.py - 10} fontSize="11.5" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">(+3, K/18)</text>
      </g>
      <text x="399" y="432" textAnchor="middle" fontSize="14.2" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">
        {sc === "max-image"
          ? "(b) D = ℝ · x² ≥ 0 ⇒ máx em x = 0 (K/9) · Im = (0, K/9]"
          : sc === "half-power"
            ? "(c) E(x) = K/18 ⇔ x² + 9 = 18 ⇔ x = −3 m ou x = +3 m!"
            : "(d) Simetria Par: E(−x) = E(x) — mesma distância da fonte P(0, 3)!"}
      </text>
    </g>
  );
}
