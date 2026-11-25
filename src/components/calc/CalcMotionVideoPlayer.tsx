"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CALC_VIDEO_EPISODES,
  CalcEpisodeTimingsMap,
  CalcVideoEpisode,
  CalcVideoSceneCue,
  resolveCalcVideoLabMoment,
} from "@/lib/calc-video-episodes";
import { CalcLabState } from "@/lib/calc-math";
import { LipSyncMascot, MouthFrame } from "@/components/LipSyncMascot";
import { playVideoSound, type VideoSound } from "@/lib/video-effects";
import { sfx } from "@/lib/sfx";
import styles from "@/components/MotionVideoPlayer.module.css";
import {
  Captions,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";

interface CalcMotionVideoPlayerProps {
  watchedEpisodes?: string[];
  onEpisodeWatched?: (episodeId: string) => void;
  onOpenInCalcLab: (state: CalcLabState) => void;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function easeOut(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

function smooth(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(1e-4, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function buildSvgPolyline(
  fn: (x: number) => number | null,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  box: { x: number; y: number; w: number; h: number },
  progress = 1,
  steps = 120
): string {
  const maxStep = Math.max(1, Math.floor(steps * clamp01(progress)));
  const pts: string[] = [];
  for (let i = 0; i <= maxStep; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = fn(x);
    if (y === null || !Number.isFinite(y) || y < yMin - 1 || y > yMax + 1) continue;
    const px = box.x + ((x - xMin) / (xMax - xMin)) * box.w;
    const py = box.y + box.h - ((y - yMin) / (yMax - yMin)) * box.h;
    pts.push(`${pts.length === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return pts.join(" ");
}

/* ==================== 24 BESPOKE ANIMATED CALCULO 1 MOTION SCENES ==================== */
function CalcSceneCanvas({
  episode,
  scene,
  t,
}: {
  episode: CalcVideoEpisode;
  scene: CalcVideoSceneCue;
  t: number; // 0..1 progress inside active scene
}) {
  const epId = episode.id;
  const scId = scene.id;
  const accent = episode.themeAccent;

  // Helper Cartesian box positioned cleanly away from top header, subtitle bar, and bottom-right Professor
  const BOX = { x: 96, y: 92, w: 610, h: 318 };
  const mapXY = (x: number, y: number, xMin = -4, xMax = 4, yMin = -3, yMax = 3) => ({
    px: BOX.x + ((x - xMin) / (xMax - xMin)) * BOX.w,
    py: BOX.y + BOX.h - ((y - yMin) / (yMax - yMin)) * BOX.h,
  });

  const renderAxes = (xMin = -4, xMax = 4, yMin = -3, yMax = 3) => {
    const o = mapXY(0, 0, xMin, xMax, yMin, yMax);
    const ticksX: number[] = [];
    for (let xi = Math.ceil(xMin); xi <= Math.floor(xMax); xi++) ticksX.push(xi);
    const ticksY: number[] = [];
    for (let yi = Math.ceil(yMin); yi <= Math.floor(yMax); yi++) ticksY.push(yi);
    return (
      <g>
        <defs>
          <clipPath id="calcPlotClip">
            <rect x={BOX.x + 2} y={BOX.y + 2} width={BOX.w - 4} height={BOX.h - 4} rx="16" />
          </clipPath>
        </defs>
        <rect
          x={BOX.x}
          y={BOX.y}
          width={BOX.w}
          height={BOX.h}
          rx="18"
          fill="#0B1426"
          stroke="rgba(148,163,184,0.22)"
          strokeWidth="1.5"
        />
        {ticksX.map((xi) => {
          const { px } = mapXY(xi, 0, xMin, xMax, yMin, yMax);
          return (
            <g key={`gx-${xi}`}>
              <line x1={px} y1={BOX.y + 8} x2={px} y2={BOX.y + BOX.h - 8} stroke="rgba(148,163,184,0.1)" />
              {xi !== 0 && (
                <text x={px} y={o.py + 16} textAnchor="middle" fontSize="11" fill="#94A3B8" fontFamily="var(--font-mono), monospace">
                  {xi}
                </text>
              )}
            </g>
          );
        })}
        {ticksY.map((yi) => {
          const { py } = mapXY(0, yi, xMin, xMax, yMin, yMax);
          return (
            <g key={`gy-${yi}`}>
              <line x1={BOX.x + 8} y1={py} x2={BOX.x + BOX.w - 8} y2={py} stroke="rgba(148,163,184,0.1)" />
              {yi !== 0 && (
                <text x={o.px - 10} y={py + 4} textAnchor="end" fontSize="11" fill="#94A3B8" fontFamily="var(--font-mono), monospace">
                  {yi}
                </text>
              )}
            </g>
          );
        })}
        <line x1={BOX.x + 10} y1={o.py} x2={BOX.x + BOX.w - 10} y2={o.py} stroke="#CBD5E1" strokeWidth="1.8" />
        <line x1={o.px} y1={BOX.y + 10} x2={o.px} y2={BOX.y + BOX.h - 10} stroke="#CBD5E1" strokeWidth="1.8" />
        <text x={BOX.x + BOX.w - 18} y={o.py - 8} fontSize="13" fontWeight="800" fill="#E2E8F0" fontFamily="var(--font-mono), monospace">x</text>
        <text x={o.px + 10} y={BOX.y + 22} fontSize="13" fontWeight="800" fill="#E2E8F0" fontFamily="var(--font-mono), monospace">y</text>
      </g>
    );
  };

  /* ---------------- EP 01: CONJUNTOS & NÚMEROS REAIS ---------------- */
  if (epId === "calc-ep01-conjuntos") {
    if (scId === "intro") {
      const lineP = easeOut(t * 2.2);
      const lensX = 180 + smooth(0.25, 0.85, t) * 440;
      return (
        <g>
          <text x="96" y="128" fontSize="28" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            O que é um Número Real (ℝ)?
          </text>
          <text x="96" y="156" fontSize="14.5" fill="#94A3B8">
            Cálculo I estuda funções reais em uma reta 100% contínua — sem buracos!
          </text>

          {/* Animated Real Line */}
          <line
            x1="96"
            y1="268"
            x2={96 + lineP * 620}
            y2="268"
            stroke="#38BDF8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {[-3, -2, -1, 0, 1, 2, 3].map((n, i) => {
            const px = 140 + i * 88;
            const op = smooth(0.08 * i, 0.08 * i + 0.2, t);
            return (
              <g key={n} opacity={op}>
                <line x1={px} y1="256" x2={px} y2="280" stroke="#E2E8F0" strokeWidth="2.2" />
                <text x={px} y="302" textAnchor="middle" fontSize="14" fontWeight="800" fill="#E2E8F0" fontFamily="var(--font-mono), monospace">
                  {n}
                </text>
              </g>
            );
          })}

          {/* Magnifying lens revealing continuous points */}
          <g transform={`translate(${lensX.toFixed(1)}, 268)`} opacity={smooth(0.2, 0.35, t)}>
            <circle r="36" fill="rgba(56,189,248,0.16)" stroke="#FDE047" strokeWidth="2.8" />
            <line x1="25" y1="25" x2="46" y2="46" stroke="#FDE047" strokeWidth="5" strokeLinecap="round" />
            <text y="5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#FEF08A" fontFamily="var(--font-mono), monospace">
              ∞ pontos
            </text>
          </g>

          {/* Floating Calculus Cards */}
          {[
            { label: "f: A ⊆ ℝ → ℝ", x: 110, d: 0.45, color: "#38BDF8" },
            { label: "lim f(x)", x: 325, d: 0.58, color: "#2DD4BF" },
            { label: "f'(x) & ∫ f(x)dx", x: 500, d: 0.72, color: "#F59E0B" },
          ].map((c) => {
            const p = easeOut((t - c.d) * 3);
            return (
              <g key={c.label} transform={`translate(${c.x}, ${360 - p * 18})`} opacity={p}>
                <rect width="185" height="44" rx="12" fill="rgba(15,23,42,0.9)" stroke={c.color} strokeWidth="1.8" />
                <text x="92" y="27" textAnchor="middle" fontSize="14" fontWeight="800" fill={c.color} fontFamily="var(--font-mono), monospace">
                  {c.label}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    if (scId === "hierarchy") {
      const pN = easeOut(t * 4);
      const pZ = easeOut((t - 0.16) * 4);
      const pQ = easeOut((t - 0.34) * 4);
      const pR = easeOut((t - 0.56) * 3.5);
      return (
        <g>
          <text x="96" y="106" fontSize="22" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-mono), monospace">
            ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ
          </text>
          {/* Concentric set diagram */}
          <g opacity={pR}>
            <rect x="96" y="124" width="600" height="278" rx="28" fill="rgba(56,189,248,0.08)" stroke="#38BDF8" strokeWidth="2.5" />
            <text x="676" y="152" textAnchor="end" fontSize="16" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
              ℝ (Reais = ℚ ∪ 𝕀)
            </text>
          </g>
          <g opacity={pQ}>
            <ellipse cx="320" cy="268" rx={198 * pQ} ry={116 * pQ} fill="rgba(45,212,191,0.12)" stroke="#2DD4BF" strokeWidth="2.4" />
            <text x="150" y="184" fontSize="14" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
              ℚ = &#123;a/b, b≠0&#125;
            </text>
            <text x="435" y="218" fontSize="13" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">
              1/2 · −3/4 · 0.25
            </text>
          </g>
          <g opacity={pZ}>
            <ellipse cx="288" cy="278" rx={128 * pZ} ry={78 * pZ} fill="rgba(251,191,36,0.14)" stroke="#FBBF24" strokeWidth="2.2" />
            <text x="186" y="232" fontSize="13.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">
              ℤ (...,−2,−1,0)
            </text>
          </g>
          <g opacity={pN}>
            <ellipse cx="268" cy="294" rx={68 * pN} ry={42 * pN} fill="rgba(168,85,247,0.28)" stroke="#C084FC" strokeWidth="2.2" />
            <text x="268" y="290" textAnchor="middle" fontSize="14" fontWeight="800" fill="#F3E8FF" fontFamily="var(--font-mono), monospace">
              ℕ
            </text>
            <text x="268" y="309" textAnchor="middle" fontSize="11.5" fill="#E9D5FF" fontFamily="var(--font-mono), monospace">
              1, 2, 3...
            </text>
          </g>
          {/* Irrationals side block */}
          <g opacity={pR}>
            <rect x="536" y="182" width="140" height="196" rx="18" fill="rgba(244,63,94,0.14)" stroke="#FB7185" strokeWidth="2" strokeDasharray="6 4" />
            <text x="606" y="214" textAnchor="middle" fontSize="16" fontWeight="800" fill="#FDA4AF" fontFamily="var(--font-mono), monospace">
              𝕀 (Irracionais)
            </text>
            <text x="606" y="256" textAnchor="middle" fontSize="18" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">
              √2 · π · e
            </text>
            <text x="606" y="288" textAnchor="middle" fontSize="11" fill="#FECDD3">
              Não viram a/b!
            </text>
          </g>
          {/* Alert callout */}
          <g opacity={smooth(0.55, 0.72, t)}>
            <rect x="96" y="410" width="540" height="32" rx="10" fill="rgba(245,158,11,0.2)" stroke="#F59E0B" strokeWidth="1.5" />
            <text x="112" y="431" fontSize="12.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
              ⚡ Cuidado no caderno: &#123; a/b | a,b ∈ ℤ, b ≠ 0 &#125; é ℚ (Racionais), não ℤ!
            </text>
          </g>
        </g>
      );
    }

    if (scId === "irrationals") {
      const approxStep = Math.min(3, Math.floor(t * 4));
      const approx = [
        { lbl: "1.4", x: 350 },
        { lbl: "1.41", x: 420 },
        { lbl: "1.414", x: 472 },
        { lbl: "1.4142...", x: 505 },
      ];
      return (
        <g>
          <text x="96" y="120" fontSize="24" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            Irracionais (𝕀) &amp; Aproximação por Racionais
          </text>
          <text x="96" y="148" fontSize="13.5" fill="#94A3B8">
            Não existe fração exata para √2, mas sempre aproximamos tão perto quanto quisermos!
          </text>
          <rect x="96" y="176" width="600" height="190" rx="20" fill="#0B1426" stroke="rgba(148,163,184,0.22)" strokeWidth="1.5" />
          <line x1="140" y1="274" x2="656" y2="274" stroke="#64748B" strokeWidth="3" />
          <circle cx="516" cy="274" r={9 + Math.sin(t * 14) * 2} fill="#FB7185" stroke="#FFFFFF" strokeWidth="2.5" />
          <text x="516" y="244" textAnchor="middle" fontSize="16" fontWeight="800" fill="#FDA4AF" fontFamily="var(--font-mono), monospace">
            √2 ≈ 1.4142135... ∈ 𝕀
          </text>
          {approx.slice(0, approxStep + 1).map((a, idx) => (
            <g key={a.lbl}>
              <circle cx={a.x} cy="274" r="6" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.8" />
              <text x={a.x} y={310 + (idx % 2) * 18} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                {a.lbl} ∈ ℚ
              </text>
            </g>
          ))}
          <text x="396" y="405" textAnchor="middle" fontSize="16" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
            ℝ = ℚ ∪ 𝕀   (Reta Real Completa!)
          </text>
        </g>
      );
    }

    // conventions
    return (
      <g>
        <text x="96" y="122" fontSize="24" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
          Convenções Oficiais do Caderno (UERJ)
        </text>
        {[
          { sym: "A, B, X, Y", desc: "Conjuntos usam LETRA MAIÚSCULA", color: "#38BDF8", y: 158, d: 0.08 },
          { sym: "x, y, a, b, p", desc: "Elementos usam letra minúscula", color: "#2DD4BF", y: 236, d: 0.3 },
          { sym: "⇔", desc: "Lê-se 'se e somente se' (equivalência)", color: "#F59E0B", y: 314, d: 0.54 },
        ].map((row) => {
          const p = easeOut((t - row.d) * 3.5);
          return (
            <g key={row.sym} transform={`translate(${96 + (1 - p) * 28}, ${row.y})`} opacity={p}>
              <rect width="590" height="62" rx="16" fill="#0B1426" stroke={row.color} strokeWidth="2" />
              <text x="26" y="38" fontSize="20" fontWeight="800" fill={row.color} fontFamily="var(--font-mono), monospace">
                {row.sym}
              </text>
              <text x="225" y="37" fontSize="15" fontWeight="700" fill="#F1F5F9">
                {row.desc}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  /* ---------------- EP 02: INTERVALOS, VENN & DESIGUALDADES ---------------- */
  if (epId === "calc-ep02-intervalos") {
    if (scId === "types") {
      const rows = [
        { y: 156, label: "Fechado: [a, b] = { x ∈ ℝ / a ≤ x ≤ b }", c1: true, c2: true, infL: false, infR: false, color: "#38BDF8", d: 0.05 },
        { y: 226, label: "Aberto: ]a, b[ = { x ∈ ℝ / a < x < b }", c1: false, c2: false, infL: false, infR: false, color: "#A855F7", d: 0.25 },
        { y: 296, label: "Semiaberto: ]a, b]  ou  [a, b[", c1: false, c2: true, infL: false, infR: false, color: "#2DD4BF", d: 0.45 },
        { y: 366, label: "Ilimitado: ]−∞, a]  e  [a, +∞[  (∞ sempre aberto!)", c1: false, c2: true, infL: true, infR: false, color: "#F59E0B", d: 0.65 },
      ];
      return (
        <g>
          <text x="96" y="112" fontSize="23" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            Tipos de Intervalos de Reta (I)
          </text>
          {rows.map((r) => {
            const p = easeOut((t - r.d) * 3.5);
            return (
              <g key={r.label} opacity={p}>
                <text x="96" y={r.y - 16} fontSize="13.5" fontWeight="800" fill={r.color} fontFamily="var(--font-mono), monospace">
                  {r.label}
                </text>
                <line x1="96" y1={r.y + 8} x2="670" y2={r.y + 8} stroke="#475569" strokeWidth="2" />
                <line
                  x1={r.infL ? 110 : 250}
                  y1={r.y + 8}
                  x2={r.infL ? 110 + p * 330 : 250 + p * 260}
                  y2={r.y + 8}
                  stroke={r.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                {!r.infL && (
                  <circle cx="250" cy={r.y + 8} r="7" fill={r.c1 ? r.color : "#0B1426"} stroke={r.color} strokeWidth="2.8" />
                )}
                <circle cx={r.infL ? 440 : 510} cy={r.y + 8} r="7" fill={r.c2 ? r.color : "#0B1426"} stroke={r.color} strokeWidth="2.8" />
              </g>
            );
          })}
        </g>
      );
    }

    if (scId === "venn") {
      const showInter = t > 0.5;
      return (
        <g>
          <text x="96" y="114" fontSize="23" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            Blocos Construtores · União (∪) vs Interseção (∩)
          </text>
          <defs>
            <clipPath id="calcVennClip">
              <circle cx="315" cy="250" r="88" />
            </clipPath>
          </defs>
          {!showInter ? (
            <>
              <circle cx="315" cy="250" r="88" fill="#10B981" fillOpacity="0.34" />
              <circle cx="435" cy="250" r="88" fill="#10B981" fillOpacity="0.34" />
            </>
          ) : (
            <circle cx="435" cy="250" r="88" fill="#F59E0B" fillOpacity="0.55" clipPath="url(#calcVennClip)" />
          )}
          <circle cx="315" cy="250" r="88" fill="none" stroke="#38BDF8" strokeWidth="3.2" />
          <circle cx="435" cy="250" r="88" fill="none" stroke="#A855F7" strokeWidth="3.2" />
          <text x="270" y="256" textAnchor="middle" fontSize="22" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">X</text>
          <text x="480" y="256" textAnchor="middle" fontSize="22" fontWeight="800" fill="#C084FC" fontFamily="var(--font-mono), monospace">Y</text>

          <rect x="96" y="366" width="590" height="58" rx="16" fill="#0B1426" stroke={showInter ? "#F59E0B" : "#10B981"} strokeWidth="2" />
          <text x="391" y="392" textAnchor="middle" fontSize="16" fontWeight="800" fill={showInter ? "#FDE047" : "#6EE7B7"} fontFamily="var(--font-mono), monospace">
            {showInter
              ? "X ∩ Y = { p t.q. p ∈ X  E  p ∈ Y }  (só a faixa comum!)"
              : "X ∪ Y = { p t.q. p ∈ X  OU  p ∈ Y }  (junta os dois blocos!)"}
          </text>
          <text x="391" y="414" textAnchor="middle" fontSize="12" fill="#94A3B8" fontFamily="var(--font-mono), monospace">
            A = ⋃ Iᵢ  ·  B = ⋂ Iᵢ  (intervalos constroem domínios e soluções!)
          </text>
        </g>
      );
    }

    if (scId === "ineq-linear") {
      const s1 = smooth(0.05, 0.25, t);
      const s2 = smooth(0.28, 0.48, t);
      const s3 = smooth(0.52, 0.72, t);
      const ray = easeOut((t - 0.5) * 2.5);
      return (
        <g>
          <text x="96" y="114" fontSize="22" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            Ex 1 do Caderno · Desigualdade do 1º Grau
          </text>
          <rect x="96" y="136" width="590" height="145" rx="18" fill="#0B1426" stroke="#38BDF8" strokeWidth="1.8" />
          <text x="126" y="176" fontSize="19" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace" opacity={s1}>
            A = &#123; x ∈ ℝ / 2x − 1 ≤ 0 &#125;
          </text>
          <text x="126" y="216" fontSize="18" fontWeight="700" fill="#E2E8F0" fontFamily="var(--font-mono), monospace" opacity={s2}>
            2x − 1 ≤ 0   ⇔   2x ≤ 1   ⇔   x ≤ 1/2
          </text>
          <text x="126" y="256" fontSize="19" fontWeight="800" fill="#10B981" fontFamily="var(--font-mono), monospace" opacity={s3}>
            ⇒  A = ]−∞, 1/2]
          </text>

          {/* Animated solution ray */}
          <line x1="110" y1="336" x2="670" y2="336" stroke="#475569" strokeWidth="2.5" />
          <line x1={430 - ray * 310} y1="336" x2="430" y2="336" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
          <circle cx="430" cy="336" r="8" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
          <text x="430" y="366" textAnchor="middle" fontSize="14" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
            1/2 (● fechado)
          </text>

          <g opacity={smooth(0.7, 0.88, t)}>
            <rect x="96" y="388" width="590" height="36" rx="10" fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1.5" />
            <text x="391" y="411" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
              ⚠️ Regra de ouro: dividiu por NEGATIVO? O sinal INVERTE (≤ vira ≥)!
            </text>
          </g>
        </g>
      );
    }

    if (scId === "ineq-quad") {
      const c1 = Math.max(0.35, smooth(0.06, 0.26, t));
      const c2 = Math.max(0.35, smooth(0.3, 0.5, t));
      const c3 = Math.max(0.35, smooth(0.54, 0.74, t));
      return (
        <g>
          <text x="96" y="108" fontSize="22" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            Ex 2 do Caderno · Fatoração + Quadro de Sinais
          </text>
          <text x="96" y="140" fontSize="17" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
            x² + x − 2 ≥ 0   ⇔   (x + 2)(x − 1) ≥ 0
          </text>

          {/* Animated Sign Table */}
          <rect x="96" y="160" width="594" height="222" rx="18" fill="#0B1426" stroke="#334155" strokeWidth="2" />
          {/* Header */}
          <rect x="96" y="160" width="594" height="44" rx="16" fill="#1E293B" />
          <text x="168" y="188" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#CBD5E1" fontFamily="var(--font-mono), monospace">Fator</text>
          <text x="322" y="188" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">x &lt; −2</text>
          <text x="468" y="188" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">−2 &lt; x &lt; 1</text>
          <text x="614" y="188" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">x &gt; 1</text>

          {/* Row 1: (x+2) */}
          <text x="168" y="236" textAnchor="middle" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">(x + 2)</text>
          <text x="322" y="236" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FB7185" opacity={c1}>−</text>
          <text x="468" y="236" textAnchor="middle" fontSize="20" fontWeight="800" fill="#34D399" opacity={c2}>+</text>
          <text x="614" y="236" textAnchor="middle" fontSize="20" fontWeight="800" fill="#34D399" opacity={c3}>+</text>

          {/* Row 2: (x-1) */}
          <line x1="112" y1="258" x2="674" y2="258" stroke="#1E293B" strokeWidth="1.5" />
          <text x="168" y="294" textAnchor="middle" fontSize="15" fontWeight="800" fill="#C084FC" fontFamily="var(--font-mono), monospace">(x − 1)</text>
          <text x="322" y="294" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FB7185" opacity={c1}>−</text>
          <text x="468" y="294" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FB7185" opacity={c2}>−</text>
          <text x="614" y="294" textAnchor="middle" fontSize="20" fontWeight="800" fill="#34D399" opacity={c3}>+</text>

          {/* Product Row */}
          <line x1="112" y1="316" x2="674" y2="316" stroke="#F59E0B" strokeWidth="2" />
          <text x="168" y="356" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">Produto</text>
          <g opacity={c1}>
            <rect x="260" y="330" width="124" height="36" rx="10" fill="rgba(16,185,129,0.22)" stroke="#10B981" strokeWidth="1.8" />
            <text x="322" y="354" textAnchor="middle" fontSize="16" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">(+) ✓</text>
          </g>
          <g opacity={c2}>
            <rect x="406" y="330" width="124" height="36" rx="10" fill="rgba(239,68,68,0.16)" stroke="#EF4444" strokeWidth="1.5" />
            <text x="468" y="354" textAnchor="middle" fontSize="16" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">(−) ✗</text>
          </g>
          <g opacity={c3}>
            <rect x="552" y="330" width="124" height="36" rx="10" fill="rgba(16,185,129,0.22)" stroke="#10B981" strokeWidth="1.8" />
            <text x="614" y="354" textAnchor="middle" fontSize="16" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">(+) ✓</text>
          </g>

          <text x="393" y="416" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace" opacity={c3}>
            (−)·(−) = (+)  e  (+)·(+) = (+)  ⇒  B = ]−∞, −2] ∪ [1, +∞[
          </text>
        </g>
      );
    }

    // takeaway
    const p = Math.max(0.35, easeOut(t * 2));
    return (
      <g>
        {renderAxes(-4, 4, -3, 4)}
        <g clipPath="url(#calcPlotClip)">
          <path
            d={buildSvgPolyline((x) => x * x + x - 2, -4, 4, -3, 4, BOX, p)}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3.5"
          />
          {/* Highlight solution rays on X axis */}
          <line x1={BOX.x + 10} y1={mapXY(0, 0, -4, 4, -3, 4).py} x2={mapXY(-2, 0, -4, 4, -3, 4).px} y2={mapXY(0, 0, -4, 4, -3, 4).py} stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
          <line x1={mapXY(1, 0, -4, 4, -3, 4).px} y1={mapXY(0, 0, -4, 4, -3, 4).py} x2={BOX.x + BOX.w - 10} y2={mapXY(0, 0, -4, 4, -3, 4).py} stroke="#10B981" strokeWidth="7" strokeLinecap="round" />
          <circle cx={mapXY(-2, 0, -4, 4, -3, 4).px} cy={mapXY(-2, 0, -4, 4, -3, 4).py} r="7" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <circle cx={mapXY(1, 0, -4, 4, -3, 4).px} cy={mapXY(1, 0, -4, 4, -3, 4).py} r="7" fill="#10B981" stroke="#FFF" strokeWidth="2" />
        </g>
        <text x="401" y="432" textAnchor="middle" fontSize="16" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
          B = ]−∞, −2] ∪ [1, +∞[  (curva acima ou no eixo X!)
        </text>
      </g>
    );
  }

  /* ---------------- EP 03: DEFINIÇÃO DE FUNÇÃO, DOMÍNIO NATURAL & RAIZ ---------------- */
  if (epId === "calc-ep03-funcoes") {
    if (scId === "arrows") {
      const aCount = Math.min(4, Math.floor(t * 5));
      const aY = [180, 232, 284, 336];
      const bY = [176, 228, 280, 332];
      const pairs = [
        [0, 2],
        [1, 1],
        [2, 0],
        [3, 1],
      ];
      return (
        <g>
          <text x="96" y="108" fontSize="22" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            f: A → B  (Domínio D_f · Contradomínio B · Imagem Im_f)
          </text>
          <ellipse cx="220" cy="260" rx="84" ry="120" fill="rgba(56,189,248,0.12)" stroke="#38BDF8" strokeWidth="2.8" />
          <ellipse cx="556" cy="260" rx="96" ry="126" fill="rgba(45,212,191,0.1)" stroke="#2DD4BF" strokeWidth="2.8" />
          <ellipse cx="556" cy="230" rx="64" ry="74" fill="rgba(16,185,129,0.18)" stroke="#10B981" strokeWidth="2" strokeDasharray="5 4" opacity={smooth(0.5, 0.75, t)} />
          <text x="220" y="128" textAnchor="middle" fontSize="14" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">Domínio D_f (sai)</text>
          <text x="556" y="124" textAnchor="middle" fontSize="14" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">Contradomínio B (vai)</text>
          <text x="556" y="324" textAnchor="middle" fontSize="12" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace" opacity={smooth(0.55, 0.75, t)}>Im_f ⊆ B</text>

          {pairs.slice(0, aCount).map(([fi, ti], idx) => (
            <path
              key={idx}
              d={`M 238 ${aY[fi]} C 340 ${aY[fi]}, 420 ${bY[ti]}, 534 ${bY[ti]}`}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          {[-2, -1, 0, 1].map((v, i) => (
            <g key={`dom-${v}`}>
              <circle cx="220" cy={aY[i]} r="16" fill="#1E56A0" stroke="#FFF" strokeWidth="2" />
              <text x="220" y={aY[i] + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#FFF" fontFamily="var(--font-mono), monospace">{v}</text>
            </g>
          ))}
          {[0, 1, 4, 9].map((v, i) => (
            <g key={`cod-${v}`}>
              <circle cx="556" cy={bY[i]} r="16" fill={i < 3 ? "#0F766E" : "#334155"} stroke={i < 3 ? "#5EEAD4" : "#94A3B8"} strokeWidth="2" />
              <text x="556" y={bY[i] + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#FFF" fontFamily="var(--font-mono), monospace">{v}</text>
            </g>
          ))}
          <text x="390" y="422" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
            Regra: cada x ∈ D_f dispara 1 e SOMENTE 1 flecha!
          </text>
        </g>
      );
    }

    if (scId === "graph-test") {
      const scanX = -3 + t * 6;
      const scanY = 0.25 * scanX * scanX - 0.8;
      const pt = mapXY(scanX, scanY);
      return (
        <g>
          {renderAxes()}
          <path d={buildSvgPolyline((x) => 0.25 * x * x - 0.8, -4, 4, -3, 3, BOX, 1)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
          <line x1={pt.px} y1={BOX.y + 8} x2={pt.px} y2={BOX.y + BOX.h - 8} stroke="#F59E0B" strokeWidth="2.4" strokeDasharray="6 4" />
          <circle cx={pt.px} cy={pt.py} r="7.5" fill="#10B981" stroke="#FFF" strokeWidth="2.5" />
          <text x="401" y="434" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">
            Teste da Reta Vertical: corta Gr_f em no máximo 1 ponto ✓
          </text>
        </g>
      );
    }

    if (scId === "dom-sqrt") {
      const p = easeOut(t * 2.2);
      const o = mapXY(0, 0, -2, 6, -1, 3.5);
      return (
        <g>
          {renderAxes(-2, 6, -1, 3.5)}
          {/* Forbidden x < 0 zone */}
          <rect x={BOX.x + 8} y={BOX.y + 8} width={o.px - BOX.x - 8} height={BOX.h - 16} fill="rgba(239,68,68,0.14)" />
          <text x={(BOX.x + o.px) / 2} y={BOX.y + 52} textAnchor="middle" fontSize="13" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
            x &lt; 0 ✗
          </text>
          {/* Domain highlight on X axis */}
          <line x1={o.px} y1={o.py} x2={BOX.x + BOX.w - 10} y2={o.py} stroke="#38BDF8" strokeWidth="6" />
          <path d={buildSvgPolyline((x) => (x >= 0 ? Math.sqrt(x) : null), -2, 6, -1, 3.5, BOX, p)} fill="none" stroke="#10B981" strokeWidth="4" />
          <circle cx={o.px} cy={o.py} r="7" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <text x="401" y="434" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
            Ex 1 Caderno: f(x) = √x  ⇒  D_f = [0, +∞[
          </text>
        </g>
      );
    }

    if (scId === "dom-rat") {
      const p = Math.max(0.4, easeOut(t * 2));
      const asym = mapXY(1, 0, -3, 5, -3, 3);
      return (
        <g>
          {renderAxes(-3, 5, -3, 3)}
          <g clipPath="url(#calcPlotClip)">
            <line x1={asym.px} y1={BOX.y + 8} x2={asym.px} y2={BOX.y + BOX.h - 8} stroke="#EF4444" strokeWidth="3" strokeDasharray="7 5" />
            <text x={asym.px + 10} y={BOX.y + 34} fontSize="13" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
              x = 1 proibido (1/0!)
            </text>
            <path d={buildSvgPolyline((x) => (x < 0.88 ? 1 / (x - 1) : null), -3, 5, -3, 3, BOX, p)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
            <path d={buildSvgPolyline((x) => (x > 1.12 ? 1 / (x - 1) : null), -3, 5, -3, 3, BOX, p)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
            <circle cx={asym.px} cy={asym.py} r="7" fill="#0B1426" stroke="#EF4444" strokeWidth="3" />
          </g>
          <text x="401" y="434" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
            Ex 2 Caderno: f(x) = 1/(x−1)  ⇒  D_f = ]−∞, 1[ ∪ ]1, +∞[
          </text>
        </g>
      );
    }

    // roots
    const p = Math.max(0.4, easeOut(t * 2));
    const r1 = mapXY(-2, 0, -4, 4, -3, 4);
    const r2 = mapXY(1, 0, -4, 4, -3, 4);
    const pulseR = 10 + Math.sin(t * 14) * 5;
    return (
      <g>
        {renderAxes(-4, 4, -3, 4)}
        <g clipPath="url(#calcPlotClip)">
          <path d={buildSvgPolyline((x) => x * x + x - 2, -4, 4, -3, 4, BOX, p)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
          <circle cx={r1.px} cy={r1.py} r={pulseR} fill="none" stroke="#10B981" strokeWidth="2.5" opacity="0.65" />
          <circle cx={r2.px} cy={r2.py} r={pulseR} fill="none" stroke="#10B981" strokeWidth="2.5" opacity="0.65" />
          <circle cx={r1.px} cy={r1.py} r="7" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <circle cx={r2.px} cy={r2.py} r="7" fill="#10B981" stroke="#FFF" strokeWidth="2" />
          <text x={r1.px} y={r1.py - 16} textAnchor="middle" fontSize="13" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">raiz −2</text>
          <text x={r2.px} y={r2.py - 16} textAnchor="middle" fontSize="13" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">raiz +1</text>
        </g>
        <text x="401" y="434" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
          Raiz da Função: todo x com f(x) = 0 (corte no eixo X!)
        </text>
      </g>
    );
  }

  /* ---------------- EP 04: FUNÇÕES ELEMENTARES ---------------- */
  if (epId === "calc-ep04-elementares") {
    if (scId === "constant") {
      const p = Math.max(0.35, easeOut(t * 2.2));
      const yLine = mapXY(0, 2).py;
      const o = mapXY(0, 0);
      return (
        <g>
          {renderAxes()}
          <g clipPath="url(#calcPlotClip)">
            <line x1={BOX.x + 12} y1={yLine} x2={BOX.x + 12 + p * (BOX.w - 24)} y2={yLine} stroke="#A855F7" strokeWidth="4.2" />
            <circle cx={o.px} cy={yLine} r="8" fill="#F59E0B" stroke="#FFF" strokeWidth="2.5" />
            <text x={o.px + 14} y={yLine - 10} fontSize="14" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">
              c = 2 (Im_f = &#123; 2 &#125;)
            </text>
          </g>
          <text x="401" y="434" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#E9D5FF" fontFamily="var(--font-mono), monospace">
            0) Função Constante: f(x) = c  ·  D_f = ℝ  ·  Im_f = &#123; c &#125;
          </text>
        </g>
      );
    }

    if (scId === "afim-slope") {
      const a = t < 0.65 ? 1 : -1;
      const p1 = mapXY(0, 1);
      const p2 = mapXY(2, a * 2 + 1);
      return (
        <g>
          {renderAxes()}
          <g clipPath="url(#calcPlotClip)">
            <path d={buildSvgPolyline((x) => a * x + 1, -4, 4, -3, 3, BOX, 1)} fill="none" stroke="#38BDF8" strokeWidth="3.8" />
            {/* Slope right triangle Δx, Δy, α */}
            <polygon points={`${p1.px},${p1.py} ${p2.px},${p1.py} ${p2.px},${p2.py}`} fill="#F59E0B" fillOpacity="0.22" />
            <line x1={p1.px} y1={p1.py} x2={p2.px} y2={p1.py} stroke="#F59E0B" strokeWidth="2.8" strokeDasharray="6 4" />
            <line x1={p2.px} y1={p1.py} x2={p2.px} y2={p2.py} stroke="#EF4444" strokeWidth="2.8" strokeDasharray="6 4" />
            <text x={(p1.px + p2.px) / 2} y={p1.py + (a > 0 ? 18 : -10)} textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">Δx</text>
            <text x={p2.px + 12} y={(p1.py + p2.py) / 2 + 5} fontSize="13.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">Δy</text>
          </g>
          <text x="401" y="434" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">
            1) Afim: tg α = Δy/Δx = a = {a > 0 ? "+1 (subindo ↗)" : "−1 (descendo ↘)"}
          </text>
        </g>
      );
    }

    if (scId === "afim-proof") {
      const targetY = -1.5 + Math.sin(t * Math.PI * 2) * 1.4;
      const targetX = targetY - 1;
      const pyPt = mapXY(0, targetY);
      const curvePt = mapXY(targetX, targetY);
      const pxPt = mapXY(targetX, 0);
      const rootPt = mapXY(-1, 0);
      return (
        <g>
          {renderAxes()}
          <g clipPath="url(#calcPlotClip)">
            <path d={buildSvgPolyline((x) => x + 1, -4, 4, -3, 3, BOX, 1)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
            {/* Live bounce y -> (x,y) -> x=(y-b)/a */}
            <line x1={pyPt.px} y1={pyPt.py} x2={curvePt.px} y2={curvePt.py} stroke="#2DD4BF" strokeWidth="2.4" strokeDasharray="5 4" />
            <line x1={curvePt.px} y1={curvePt.py} x2={pxPt.px} y2={pxPt.py} stroke="#F59E0B" strokeWidth="2.4" strokeDasharray="5 4" />
            <circle cx={curvePt.px} cy={curvePt.py} r="7" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
            <circle cx={rootPt.px} cy={rootPt.py} r="6.5" fill="#10B981" stroke="#FFF" strokeWidth="2" />
            <text x={rootPt.px} y={rootPt.py + 22} textAnchor="middle" fontSize="12" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">raiz −b/a</text>
          </g>
          <text x="401" y="434" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">
            Prova Im_f = ℝ: para todo y, x = (y − b)/a ⇒ f((y − b)/a) = y!
          </text>
        </g>
      );
    }

    if (scId === "composed") {
      const ballX = 120 + (t * 530);
      return (
        <g>
          <text x="96" y="122" fontSize="24" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
            Função Composta: (f ∘ g)(x) = f(g(x))
          </text>
          <line x1="120" y1="265" x2="660" y2="265" stroke="#475569" strokeWidth="4" strokeDasharray="8 6" />
          <rect x="215" y="210" width="145" height="110" rx="22" fill="rgba(56,189,248,0.18)" stroke="#38BDF8" strokeWidth="3" />
          <text x="287" y="258" textAnchor="middle" fontSize="22" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">g(x)</text>
          <text x="287" y="286" textAnchor="middle" fontSize="12" fill="#CBD5E1">1ª máquina</text>
          <rect x="445" y="210" width="145" height="110" rx="22" fill="rgba(168,85,247,0.2)" stroke="#A855F7" strokeWidth="3" />
          <text x="517" y="258" textAnchor="middle" fontSize="22" fontWeight="800" fill="#E9D5FF" fontFamily="var(--font-mono), monospace">f(u)</text>
          <text x="517" y="286" textAnchor="middle" fontSize="12" fill="#CBD5E1">2ª máquina</text>
          <circle cx={ballX} cy="265" r="14" fill="#F59E0B" stroke="#FFF" strokeWidth="2.5" />
          <text x="395" y="388" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
            x  ⟶  g(x)  ⟶  f(g(x))   (base da Regra da Cadeia!)
          </text>
        </g>
      );
    }

    // inverse
    const p1 = Math.max(0.45, easeOut(t * 2.2));
    const p2 = Math.max(0.35, easeOut((t - 0.35) * 2.2));
    return (
      <g>
        {renderAxes(-3, 4, -3, 4)}
        <g clipPath="url(#calcPlotClip)">
          <line x1={mapXY(-3, -3, -3, 4, -3, 4).px} y1={mapXY(-3, -3, -3, 4, -3, 4).py} x2={mapXY(4, 4, -3, 4, -3, 4).px} y2={mapXY(4, 4, -3, 4, -3, 4).py} stroke="#94A3B8" strokeWidth="2" strokeDasharray="7 5" />
          <path d={buildSvgPolyline((x) => Math.exp(0.7 * x), -3, 4, -3, 4, BOX, p1)} fill="none" stroke="#38BDF8" strokeWidth="3.8" />
          <path d={buildSvgPolyline((x) => (x > 0.05 ? Math.log(x) / 0.7 : null), -3, 4, -3, 4, BOX, p2)} fill="none" stroke="#C084FC" strokeWidth="3.8" />
        </g>
        <text x="401" y="434" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#E9D5FF" fontFamily="var(--font-mono), monospace">
          Inversa f⁻¹: espelho perfeito na reta y = x  (e^x ⇄ ln x)
        </text>
      </g>
    );
  }

  /* ---------------- EP 05: MAPA DO SEMESTRE (LIMITES, DERIVADAS, INTEGRAIS) ---------------- */
  if (scId === "limits") {
    const gap = Math.max(0.08, (1 - t) * 1.6);
    const hole = mapXY(1, 2, -2, 4, -1, 4);
    const leftB = mapXY(1 - gap, 2 - gap, -2, 4, -1, 4);
    const rightB = mapXY(1 + gap, 2 + gap, -2, 4, -1, 4);
    return (
      <g>
        {renderAxes(-2, 4, -1, 4)}
        <g clipPath="url(#calcPlotClip)">
          <path d={buildSvgPolyline((x) => x + 1, -2, 4, -1, 4, BOX, 1)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
          <circle cx={hole.px} cy={hole.py} r="8.5" fill="#0B1426" stroke="#EF4444" strokeWidth="3.2" />
          <circle cx={leftB.px} cy={leftB.py} r="6.5" fill="#2DD4BF" stroke="#FFF" strokeWidth="2" />
          <circle cx={rightB.px} cy={rightB.py} r="6.5" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
          <text x={hole.px + 14} y={hole.py - 10} fontSize="13.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">buraco (1, 2)</text>
        </g>
        <text x="401" y="434" textAnchor="middle" fontSize="15" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">
          P1 · lim x→1 (x²−1)/(x−1) = 2  (mesmo sem f(1) existir!)
        </text>
      </g>
    );
  }

  if (scId === "deriv-secant") {
    const h = Math.max(0.06, 2.2 * (1 - easeOut(t * 1.1)));
    const x0 = 0.8;
    const f = (x: number) => 0.45 * x * x - 1;
    const y0 = f(x0);
    const y1 = f(x0 + h);
    const m = (y1 - y0) / h;
    const pA = mapXY(-3, y0 + m * (-3 - x0));
    const pB = mapXY(4, y0 + m * (4 - x0));
    const pt0 = mapXY(x0, y0);
    const pt1 = mapXY(x0 + h, y1);
    return (
      <g>
        {renderAxes()}
        <g clipPath="url(#calcPlotClip)">
          <path d={buildSvgPolyline(f, -4, 4, -3, 3, BOX, 1)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
          <line x1={pA.px} y1={pA.py} x2={pB.px} y2={pB.py} stroke={h < 0.2 ? "#EF4444" : "#F59E0B"} strokeWidth="3.2" />
          <circle cx={pt0.px} cy={pt0.py} r="7" fill="#EF4444" stroke="#FFF" strokeWidth="2" />
          <circle cx={pt1.px} cy={pt1.py} r="6" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
        </g>
        <text x="401" y="434" textAnchor="middle" fontSize="15" fontWeight="800" fill={h < 0.2 ? "#FCA5A5" : "#FDE047"} fontFamily="var(--font-mono), monospace">
          P2 · h = {h.toFixed(2)} → 0  ·  Secante vira Tangente f&apos;(x₀)!
        </text>
      </g>
    );
  }

  if (scId === "deriv-apps") {
    const f = (x: number) => 0.35 * x * x * x - 1.8 * x;
    const p = Math.max(0.45, easeOut(t * 2));
    const xCrit = Math.sqrt(1.8 / (3 * 0.35));
    const maxPt = mapXY(-xCrit, f(-xCrit));
    const minPt = mapXY(xCrit, f(xCrit));
    const infPt = mapXY(0, 0);
    return (
      <g>
        {renderAxes()}
        <g clipPath="url(#calcPlotClip)">
          <path d={buildSvgPolyline(f, -4, 4, -3, 3, BOX, p)} fill="none" stroke="#38BDF8" strokeWidth="3.5" />
          <g opacity={Math.max(0.35, smooth(0.35, 0.55, t))}>
            <line x1={maxPt.px - 32} y1={maxPt.py} x2={maxPt.px + 32} y2={maxPt.py} stroke="#F59E0B" strokeWidth="2.8" />
            <circle cx={maxPt.px} cy={maxPt.py} r="7" fill="#F59E0B" stroke="#FFF" strokeWidth="2" />
            <text x={maxPt.px} y={maxPt.py - 14} textAnchor="middle" fontSize="12" fontWeight="800" fill="#FDE047" fontFamily="var(--font-mono), monospace">Máx (f&apos;=0)</text>
          </g>
          <g opacity={Math.max(0.35, smooth(0.5, 0.7, t))}>
            <line x1={minPt.px - 32} y1={minPt.py} x2={minPt.px + 32} y2={minPt.py} stroke="#10B981" strokeWidth="2.8" />
            <circle cx={minPt.px} cy={minPt.py} r="7" fill="#10B981" stroke="#FFF" strokeWidth="2" />
            <text x={minPt.px} y={minPt.py + 22} textAnchor="middle" fontSize="12" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">Mín (f&apos;=0)</text>
          </g>
          <g opacity={Math.max(0.35, smooth(0.68, 0.85, t))}>
            <circle cx={infPt.px} cy={infPt.py} r="7" fill="#EC4899" stroke="#FFF" strokeWidth="2" />
            <text x={infPt.px + 14} y={infPt.py - 10} fontSize="12" fontWeight="800" fill="#F9A8D4" fontFamily="var(--font-mono), monospace">Inflexão (f&apos;&apos;=0)</text>
          </g>
        </g>
        <text x="401" y="434" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
          P2 · f&apos;(x) = 0 acha extremos · f&apos;&apos;(x) = 0 acha inflexão!
        </text>
      </g>
    );
  }

  if (scId === "integrals") {
    const liveC = -1.6 + Math.sin(t * Math.PI * 2) * 1.4;
    return (
      <g>
        {renderAxes()}
        <g clipPath="url(#calcPlotClip)">
          {[-2, -1, 0, 1, 2].map((cVal) => (
            <path
              key={cVal}
              d={buildSvgPolyline((x) => 0.35 * x * x + cVal, -4, 4, -3, 3, BOX, 1)}
              fill="none"
              stroke="#2DD4BF"
              strokeOpacity="0.28"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
          ))}
          <path
            d={buildSvgPolyline((x) => 0.35 * x * x + liveC, -4, 4, -3, 3, BOX, 1)}
            fill="none"
            stroke="#2DD4BF"
            strokeWidth="4.2"
          />
        </g>
        <text x="401" y="434" textAnchor="middle" fontSize="15.5" fontWeight="800" fill="#5EEAD4" fontFamily="var(--font-mono), monospace">
          P3 · ∫ f(x) dx = F(x) + C   (C atual = {liveC >= 0 ? "+" : ""}{liveC.toFixed(1)})
        </text>
      </g>
    );
  }

  // uerj-roadmap
  const cards = [
    { t: "P1", sub: "Funções, Limites & TVI", color: "#38BDF8", x: 96, d: 0.05 },
    { t: "P2", sub: "Derivadas & Aplicações", color: "#F59E0B", x: 298, d: 0.25 },
    { t: "P3", sub: "Integração Indefinida", color: "#2DD4BF", x: 500, d: 0.45 },
  ];
  return (
    <g>
      <text x="96" y="122" fontSize="24" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
        Roteiro de Aprovação · Prof. Mateus Spezia (UERJ)
      </text>
      {cards.map((c) => {
        const p = easeOut((t - c.d) * 3.5);
        return (
          <g key={c.t} transform={`translate(${c.x}, ${160 - p * 12})`} opacity={p}>
            <rect width="186" height="114" rx="18" fill="#0B1426" stroke={c.color} strokeWidth="2.4" />
            <text x="93" y="48" textAnchor="middle" fontSize="26" fontWeight="800" fill={c.color} fontFamily="var(--font-mono), monospace">{c.t}</text>
            <text x="93" y="84" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#E2E8F0">{c.sub}</text>
          </g>
        );
      })}
      <g opacity={smooth(0.58, 0.78, t)}>
        <rect x="96" y="302" width="590" height="106" rx="18" fill="rgba(16,185,129,0.14)" stroke="#10B981" strokeWidth="2" />
        <text x="391" y="338" textAnchor="middle" fontSize="18" fontWeight="800" fill="#6EE7B7" fontFamily="var(--font-mono), monospace">
          MP = (P1 + P2 + P3) / 3  ≥  7,0  ⇒  Aprovado Direto!
        </text>
        <text x="391" y="370" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#E2E8F0" fontFamily="var(--font-mono), monospace">
          Presença ≥ 75%  ·  PR: 13/04/2027  ·  PF: 20/04/2027 (MF ≥ 5)
        </text>
        <text x="391" y="394" textAnchor="middle" fontSize="12" fill="#94A3B8">
          Bibliografia: Stewart Vol. 1 · Guidorizzi Vol. 1
        </text>
      </g>
      <circle cx="96" cy="96" r="0" fill={accent} />
    </g>
  );
}

/* ==================== MAIN CALC MOTION VIDEO PLAYER ==================== */
export function CalcMotionVideoPlayer({
  watchedEpisodes = [],
  onEpisodeWatched,
  onOpenInCalcLab,
}: CalcMotionVideoPlayerProps) {
  const [epIndex, setEpIndex] = useState(0);
  const [timings, setTimings] = useState<CalcEpisodeTimingsMap>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(90);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [mouth, setMouth] = useState<MouthFrame>("closed");
  const [energy, setEnergy] = useState(0);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrubPreview, setScrubPreview] = useState<{
    ratio: number;
    time: number;
    label: string;
    sceneIndex: number;
  } | null>(null);

  const isFullscreen = nativeFullscreen || cssFullscreen;
  const playerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSceneIdRef = useRef<string | null>(null);
  const scrubbingRef = useRef(false);

  // Hydrate studio timings.json
  useEffect(() => {
    fetch("/audio/calc-video/timings.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: CalcEpisodeTimingsMap) => setTimings(d || {}))
      .catch(() => {});
  }, []);

  const baseEp = CALC_VIDEO_EPISODES[epIndex] ?? CALC_VIDEO_EPISODES[0];
  const epTiming = timings[baseEp.id];

  const scenes: CalcVideoSceneCue[] = useMemo(() => {
    if (!epTiming?.scenes?.length) return baseEp.scenes;
    return baseEp.scenes.map((sc, idx) => {
      const timed = epTiming.scenes.find((ts) => ts.id === sc.id) ?? epTiming.scenes[idx];
      if (!timed) return sc;
      return {
        ...sc,
        startSec: timed.startSec,
        endSec: timed.endSec,
      };
    });
  }, [baseEp.scenes, epTiming]);

  const effectiveDuration = Math.max(
    1,
    duration || epTiming?.duration || scenes[scenes.length - 1]?.endSec || 90
  );

  const sceneIndex = useMemo(() => {
    const idx = scenes.findIndex(
      (sc, i) =>
        currentTime >= sc.startSec &&
        (currentTime < sc.endSec || i === scenes.length - 1)
    );
    return idx >= 0 ? idx : 0;
  }, [scenes, currentTime]);

  const activeScene = scenes[sceneIndex] ?? scenes[0];
  const sceneSpan = Math.max(0.25, activeScene.endSec - activeScene.startSec);
  const sceneT = clamp01((currentTime - activeScene.startSec) / sceneSpan);
  const activeMoment = useMemo(
    () => resolveCalcVideoLabMoment(baseEp, activeScene),
    [baseEp, activeScene]
  );

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audioCtxRef.current) {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = new AudioCtor();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const sfxGain = ctx.createGain();
      sfxGain.gain.value = isMuted ? 0 : volume;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sfxGain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sfxGainRef.current = sfxGain;
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume().catch(() => {});
    }
  }, [isMuted, volume]);

  const playCueSound = useCallback(
    (sound: VideoSound) => {
      if (!sfx.isEnabled() || isMuted || volume <= 0.01) return;
      const ctx = audioCtxRef.current;
      const out = sfxGainRef.current;
      if (ctx && out && ctx.state === "running") {
        playVideoSound(ctx, out, sound);
      }
    },
    [isMuted, volume]
  );

  // Fire reactive sound cue when entering a new scene during playback
  useEffect(() => {
    if (!isPlaying) {
      lastSceneIdRef.current = activeScene.id;
      return;
    }
    if (lastSceneIdRef.current !== activeScene.id) {
      lastSceneIdRef.current = activeScene.id;
      playCueSound(activeScene.soundCue ?? "whoosh");
    }
  }, [activeScene.id, activeScene.soundCue, isPlaying, playCueSound]);

  // Sync audio volume/mute/speed
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
      audio.playbackRate = playbackRate;
    }
    if (sfxGainRef.current) {
      sfxGainRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, playbackRate]);

  // Fullscreen auto-hide controls + cursor
  const revealControls = useCallback(
    (pin = false) => {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (!pin && isFullscreen && isPlaying) {
        hideTimerRef.current = setTimeout(() => {
          if (!scrubbingRef.current) setControlsVisible(false);
        }, 2600);
      }
    },
    [isFullscreen, isPlaying]
  );

  useEffect(() => {
    if (!isFullscreen || !isPlaying) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      revealControls(false);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isFullscreen, isPlaying, revealControls]);

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setNativeFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = playerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    if (!el) return;
    if (isFullscreen) {
      setCssFullscreen(false);
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      return;
    }
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else {
        setCssFullscreen(true);
      }
    } catch {
      setCssFullscreen(true);
    }
  }, [isFullscreen]);

  // 60fps audio clock + WebAudio RMS LipSync loop
  useEffect(() => {
    const bins = new Uint8Array(128);
    let smoothE = 0;

    const tick = () => {
      const audio = audioRef.current;
      if (audio) {
        setCurrentTime(audio.currentTime);
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      }
      if (isPlaying && analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(bins);
        let sum = 0;
        for (let i = 0; i < bins.length; i++) {
          const n = (bins[i] - 128) / 128;
          sum += n * n;
        }
        const rms = Math.sqrt(sum / bins.length);
        smoothE = smoothE * 0.65 + rms * 0.35;
        setEnergy(smoothE);
        setMouth(
          smoothE > 0.14
            ? "open"
            : smoothE > 0.08
              ? "mid"
              : smoothE > 0.032
                ? "small"
                : "closed"
        );
      } else {
        setEnergy(0);
        setMouth("closed");
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      ensureAudioGraph();
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  }, [ensureAudioGraph, isPlaying]);

  const seekToSeconds = useCallback(
    (sec: number) => {
      const clamped = Math.max(0, Math.min(effectiveDuration, sec));
      const audio = audioRef.current;
      if (audio) audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [effectiveDuration]
  );

  const selectEpisode = useCallback((idx: number) => {
    const safe = ((idx % CALC_VIDEO_EPISODES.length) + CALC_VIDEO_EPISODES.length) % CALC_VIDEO_EPISODES.length;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setMouth("closed");
    setEnergy(0);
    setEpIndex(safe);
    sfx.click();
  }, []);

  const updateScrubPreview = useCallback(
    (clientX: number) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      const ratio = clamp01((clientX - rect.left) / rect.width);
      const time = ratio * effectiveDuration;
      const idx = scenes.findIndex(
        (sc, i) => time >= sc.startSec && (time < sc.endSec || i === scenes.length - 1)
      );
      const safeIdx = idx >= 0 ? idx : 0;
      setScrubPreview({
        ratio,
        time,
        label: scenes[safeIdx]?.label ?? "",
        sceneIndex: safeIdx,
      });
    },
    [effectiveDuration, scenes]
  );

  const progress = clamp01(currentTime / effectiveDuration);
  const hideChrome = isFullscreen && !controlsVisible;

  return (
    <section
      data-calc-video-section
      className="grid grid-cols-1 xl:grid-cols-[1fr_308px] gap-4 items-start"
    >
      {/* LEFT: 16:9 MOTION STAGE + MOMENT LAB SYNC CARD */}
      <div className="space-y-3">
        <div
          ref={playerRef}
          data-video-player
          data-fullscreen={isFullscreen ? "true" : undefined}
          data-expanded={cssFullscreen ? "true" : undefined}
          data-idle-cursor={hideChrome ? "true" : undefined}
          onPointerMove={() => revealControls(false)}
          onPointerDown={() => revealControls(false)}
          className={`${styles.player} text-white`}
        >
          <audio
            ref={audioRef}
            src={epTiming?.audioSrc || baseEp.audioSrc}
            preload="metadata"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) setDuration(d);
            }}
            onEnded={() => {
              setIsPlaying(false);
              setMouth("closed");
              setEnergy(0);
              onEpisodeWatched?.(baseEp.id);
              playCueSound("resolve");
            }}
          />

          {/* 16:9 STAGE */}
          <div data-video-frame className={styles.frame} onClick={() => void togglePlay()}>
            <svg
              viewBox="0 0 960 540"
              className="w-full h-full block select-none"
              role="img"
              aria-label={`${baseEp.number}: ${activeScene.label}`}
            >
              <defs>
                <radialGradient id="calcStudioBg" cx="50%" cy="35%" r="75%">
                  <stop offset="0%" stopColor="#12213D" />
                  <stop offset="100%" stopColor="#060B17" />
                </radialGradient>
              </defs>
              <rect width="960" height="540" fill="url(#calcStudioBg)" />

              {/* Subtle Blueprint Grid */}
              {Array.from({ length: 19 }).map((_, i) => (
                <line
                  key={`vg-${i}`}
                  x1={i * 52}
                  y1="0"
                  x2={i * 52}
                  y2="540"
                  stroke="rgba(148,163,184,0.05)"
                />
              ))}
              {Array.from({ length: 11 }).map((_, i) => (
                <line
                  key={`hg-${i}`}
                  x1="0"
                  y1={i * 52}
                  x2="960"
                  y2={i * 52}
                  stroke="rgba(148,163,184,0.05)"
                />
              ))}

              {/* Top Episode & Chapter HUD Bar */}
              <g>
                <rect x="28" y="20" width="904" height="44" rx="14" fill="rgba(15,23,42,0.72)" stroke="rgba(148,163,184,0.18)" />
                <circle cx="52" cy="42" r="5.5" fill={baseEp.themeAccent} />
                <text x="68" y="47" fontSize="13.5" fontWeight="800" fill={baseEp.themeAccent} fontFamily="var(--font-mono), monospace">
                  {baseEp.number} · CÁLCULO I
                </text>
                <text x="275" y="47" fontSize="14" fontWeight="700" fill="#F1F5F9">
                  {activeScene.label}
                </text>
                <text x="912" y="47" textAnchor="end" fontSize="12.5" fontWeight="700" fill="#94A3B8" fontFamily="var(--font-mono), monospace">
                  Cena {sceneIndex + 1}/{scenes.length}
                </text>
              </g>

              {/* Active Animated Scene */}
              <CalcSceneCanvas episode={baseEp} scene={activeScene} t={sceneT} />
            </svg>

            {/* Compact Professor Mascot (Bottom-Right Corner, 50% proportion) */}
            <div data-video-presenter className={styles.presenter}>
              <LipSyncMascot
                mouth={mouth}
                energy={energy}
                isPlaying={isPlaying}
                label="Prof. Exatas"
              />
            </div>

            {/* Captions Band matching GD MotionVideoPlayer */}
            {showCaptions && (
              <div className={styles.captionBand} aria-live="polite">
                <p className={styles.caption}>{activeScene.subtitle}</p>
              </div>
            )}

            {/* Big Play Overlay when paused at t = 0 */}
            {!isPlaying && currentTime < 0.25 && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-sky-500/95 text-slate-950 flex items-center justify-center shadow-2xl">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM CONTROLS BAR */}
          <div
            data-video-controls
            data-visible={controlsVisible ? "true" : undefined}
            className={`${styles.transport} px-3.5 py-2.5 border-t border-white/10 space-y-2`}
          >
            {/* Segmented YouTube-style Timeline */}
            <div className="space-y-1">
              <div
                ref={timelineRef}
                className={styles.timeline}
                onPointerMove={(e) => updateScrubPreview(e.clientX)}
                onPointerLeave={() => {
                  if (!scrubbingRef.current) setScrubPreview(null);
                }}
              >
                {scrubPreview && (
                  <div
                    className={styles.scrubTooltip}
                    style={{
                      left: `${Math.max(10, Math.min(90, scrubPreview.ratio * 100))}%`,
                    }}
                  >
                    <span className="font-mono text-xs font-extrabold text-sky-300">
                      {formatTime(scrubPreview.time)}
                    </span>
                    <span className="text-xs font-bold truncate">{scrubPreview.label}</span>
                  </div>
                )}
                <div className={styles.track}>
                  {scenes.map((sc, idx) => {
                    const segStart = sc.startSec / effectiveDuration;
                    const segEnd = sc.endSec / effectiveDuration;
                    const widthPct = Math.max(2, (segEnd - segStart) * 100);
                    const playedInSeg =
                      clamp01((progress - segStart) / Math.max(0.001, segEnd - segStart)) * 100;
                    const hoverInSeg = scrubPreview
                      ? clamp01(
                          (scrubPreview.ratio - segStart) / Math.max(0.001, segEnd - segStart)
                        ) * 100
                      : 0;
                    return (
                      <span
                        key={sc.id}
                        className={styles.segment}
                        data-hovered={scrubPreview?.sceneIndex === idx ? "true" : undefined}
                        style={{ width: `${widthPct}%` }}
                      >
                        {hoverInSeg > 0 && (
                          <span className={styles.segmentHover} style={{ width: `${hoverInSeg}%` }} />
                        )}
                        <span className={styles.segmentPlayed} style={{ width: `${playedInSeg}%` }} />
                      </span>
                    );
                  })}
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={Math.round(progress * 1000)}
                  onPointerDown={(e) => {
                    scrubbingRef.current = true;
                    updateScrubPreview(e.clientX);
                    if (isFullscreen) revealControls(true);
                  }}
                  onPointerUp={() => {
                    scrubbingRef.current = false;
                    setScrubPreview(null);
                    if (isFullscreen) revealControls(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    seekToSeconds((Number(e.target.value) / 1000) * effectiveDuration);
                    if (isFullscreen) revealControls();
                  }}
                  aria-label="Linha do tempo do vídeo de Cálculo 1"
                  className={styles.scrubber}
                />
              </div>

              {/* Scene Jump Pills */}
              <div className={`${styles.chapters} flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1`}>
                {scenes.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      playCueSound("click");
                      seekToSeconds(sc.startSec + 0.05);
                    }}
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition ${
                      idx === sceneIndex
                        ? "bg-sky-500/25 text-sky-300 border border-sky-400/50"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {idx + 1}. {sc.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Assistir
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => seekToSeconds(currentTime - 5)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  aria-label="Voltar 5 segundos"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => selectEpisode(epIndex - 1)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  aria-label="Episódio anterior"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => selectEpisode(epIndex + 1)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  aria-label="Próximo episódio"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] text-slate-400 pl-1">
                  {formatTime(currentTime)} / {formatTime(effectiveDuration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="min-w-[26px] min-h-[26px] flex items-center justify-center text-slate-300 hover:text-white"
                    aria-label={isMuted ? "Ativar som" : "Silenciar"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-sky-300" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : Math.round(volume * 100)}
                    onChange={(e) => {
                      const v = Number(e.target.value) / 100;
                      setVolume(v);
                      if (v > 0 && isMuted) setIsMuted(false);
                    }}
                    aria-label="Volume do vídeo"
                    className="hidden sm:block w-16 h-1.5 accent-sky-400 cursor-pointer rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const speeds = [0.85, 1, 1.25, 1.5];
                    setPlaybackRate(speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length]);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[11px] font-bold"
                >
                  {playbackRate}x
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaptions((v) => !v)}
                  className={`p-1.5 rounded-lg transition ${
                    showCaptions ? "bg-amber-400/20 text-amber-300" : "text-slate-400 hover:bg-white/10"
                  }`}
                  aria-label="Legendas"
                >
                  <Captions className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Episode Info Card + Moment-Synced "Reproduzir no Lab de Funções" */}
        <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 space-y-3 shadow-draft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono font-extrabold text-lt dark:text-teal-300">
                {baseEp.number} · {baseEp.tag} · Voz Masculina Gemini 3.8 TTS
              </div>
              <h3 className="font-display text-xl font-bold text-ink-900 dark:text-white mt-0.5">
                {baseEp.title}
              </h3>
              <p className="text-xs text-ink-500 dark:text-slate-400 mt-0.5">
                {baseEp.subtitle}
              </p>
            </div>
            <button
              type="button"
              data-calc-video-lab-btn
              onClick={() => {
                sfx.click();
                onOpenInCalcLab(activeMoment.labState);
              }}
              className="shrink-0 inline-flex flex-col items-center sm:items-end justify-center px-4 py-2 rounded-xl bg-lt hover:opacity-90 text-white transition shadow-sm"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold">
                <TrendingUp className="w-4 h-4" /> Reproduzir no Lab de Funções
              </span>
              <span className="font-mono text-[10px] text-teal-100/95 mt-0.5">
                {activeMoment.formulaLabel}
              </span>
            </button>
          </div>

          {baseEp.examples.length > 0 && (
            <div className="pt-2.5 border-t border-paper-200 dark:border-blueprint-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[10.5px] font-mono font-bold text-ink-500 dark:text-slate-400">
                <span>EXEMPLOS CITADOS NESTA AULA · ABRIR NO LAB:</span>
                <span className="hidden sm:inline text-lt dark:text-teal-300">
                  No vídeo: {activeMoment.chipLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {baseEp.examples.map((ex) => {
                  const isAct = ex.id === activeMoment.id;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      data-calc-video-example={ex.id}
                      onClick={() => {
                        sfx.click();
                        onOpenInCalcLab(ex.labState);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-left transition ${
                        isAct
                          ? "bg-lt/15 dark:bg-teal-500/20 border-lt dark:border-teal-400 text-lt dark:text-teal-200"
                          : "bg-paper-100/80 dark:bg-blueprint-950 border-paper-300/80 dark:border-blueprint-800 text-ink-700 dark:text-slate-300 hover:border-lt/60"
                      }`}
                    >
                      <span className="text-[11px] font-bold">{ex.chipLabel}</span>
                      <span className="font-mono text-[10px] opacity-80">{ex.formulaLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: 5-EPISODE PLAYLIST */}
      <aside className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
            Cálculo I · {CALC_VIDEO_EPISODES.length} Videoaulas
          </div>
          <span className="font-mono text-[10px] font-bold text-lt dark:text-teal-300">
            {watchedEpisodes.length}/{CALC_VIDEO_EPISODES.length} vistos
          </span>
        </div>

        <div className="space-y-1.5">
          {CALC_VIDEO_EPISODES.map((ep, idx) => {
            const active = idx === epIndex;
            const watched = watchedEpisodes.includes(ep.id);
            const epDur = timings[ep.id]?.duration;
            return (
              <button
                key={ep.id}
                type="button"
                data-calc-episode-btn={ep.id}
                onClick={() => selectEpisode(idx)}
                className={`w-full text-left p-2.5 rounded-2xl border transition flex items-start gap-2.5 ${
                  active
                    ? "bg-ink-900 text-paper-50 border-ink-900 shadow-sm dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                    : "bg-paper-100/70 dark:bg-blueprint-950 border-paper-300/80 dark:border-blueprint-800 hover:bg-paper-200/70 dark:hover:bg-blueprint-800"
                }`}
              >
                <span
                  className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-mono text-[10px] font-extrabold ${
                    active
                      ? "bg-paper-50/20 text-white dark:bg-blueprint-950/20 dark:text-blueprint-950"
                      : watched
                        ? "bg-lt/15 text-lt dark:bg-teal-950 dark:text-teal-300"
                        : "bg-paper-200 dark:bg-blueprint-800 text-ink-700 dark:text-slate-300"
                  }`}
                >
                  {active && isPlaying ? (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  ) : watched ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-mono text-[10px] font-extrabold ${
                        active
                          ? "text-amber-300 dark:text-blueprint-950/80"
                          : "text-lt dark:text-teal-400"
                      }`}
                    >
                      {ep.number} · {ep.tag}
                    </span>
                    <span className="font-mono text-[10px] opacity-75">
                      {epDur ? formatTime(epDur) : ep.durationHint}
                    </span>
                  </div>
                  <div className="text-xs font-bold leading-snug mt-0.5 truncate">
                    {ep.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </section>
  );
}
