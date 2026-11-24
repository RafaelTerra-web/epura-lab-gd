"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { VIDEO_EPISODES, VideoEpisode } from "@/lib/video-episodes";
import { LipSyncMascot, MouthFrame } from "./LipSyncMascot";
import { GDPoint, GDSegment } from "@/lib/gd-math";
import {
  Captions,
  Compass,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";

interface MotionVideoPlayerProps {
  onOpenInLab: (payload: {
    points: GDPoint[];
    segments: GDSegment[];
    foldAngle: number;
    showBisectors?: boolean;
    showXYZ?: boolean;
  }) => void;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

// Procedural 60fps 16:9 SVG Motion Graphics Renderer (viewBox 800 x 450)
function MotionCanvas({
  episode,
  progress,
  sceneIndex,
  localT,
}: {
  episode: VideoEpisode;
  progress: number;
  sceneIndex: number;
  localT: number;
}) {
  const e = easeOutCubic(Math.min(1, localT * 2.2));
  const kenBurns = 1 + progress * 0.045;

  return (
    <svg
      viewBox="0 0 800 450"
      className="w-full h-full block select-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="studioGlow" cx="45%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#182A4A" />
          <stop offset="100%" stopColor="#09101E" />
        </radialGradient>
        <pattern
          id="studioGrid"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 32 0 L 0 0 0 32"
            fill="none"
            stroke="rgba(148,163,184,0.09)"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* Cinema Studio Blueprint Backdrop */}
      <rect width="800" height="450" fill="url(#studioGlow)" />
      <rect width="800" height="450" fill="url(#studioGrid)" />

      {/* Subtle Corner Viewfinder Brackets (Video Edit Aesthetic) */}
      <g stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" fill="none">
        <path d="M22 44 V22 H44" />
        <path d="M778 44 V22 H756" />
        <path d="M22 406 V428 H44" />
      </g>

      {/* Main Kinetic Stage Group (gentle Ken Burns motion) */}
      <g
        transform={`translate(400 225) scale(${kenBurns.toFixed(4)}) translate(-400 -225)`}
      >
        {/* ================= EPISODE 01: PROBLEMA DE MONGE ================= */}
        {episode.id === "ep01-monge" && (
          <>
            {sceneIndex === 0 && (
              <g opacity={e}>
                <rect
                  x="130"
                  y="110"
                  width="460"
                  height="210"
                  rx="24"
                  fill="rgba(56,189,248,0.08)"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />
                <text
                  x="166"
                  y="158"
                  fontSize="16"
                  fontWeight="800"
                  fill="#38BDF8"
                  fontFamily="var(--font-mono), monospace"
                >
                  EPISÓDIO 01 · MÉTODO DE MONGE
                </text>
                <text
                  x="166"
                  y="214"
                  fontSize="40"
                  fontWeight="800"
                  fill="#F8FAFC"
                  fontFamily="var(--font-display), serif"
                >
                  Por que projetar
                </text>
                <text
                  x="166"
                  y="262"
                  fontSize="40"
                  fontWeight="800"
                  fill="#FDE68A"
                  fontFamily="var(--font-display), serif"
                >
                  3D em 2D?
                </text>
                <line
                  x1="166"
                  y1="286"
                  x2={166 + 340 * e}
                  y2="286"
                  stroke="#2DD4BF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            )}

            {sceneIndex === 1 && (
              <g>
                {/* Only Horizontal Floor π */}
                <polygon
                  points="130,300 470,350 610,270 270,225"
                  fill="rgba(56,189,248,0.16)"
                  stroke="#38BDF8"
                  strokeWidth="2"
                />
                <text
                  x="510"
                  y="316"
                  fontSize="16"
                  fontWeight="800"
                  fill="#38BDF8"
                  fontFamily="var(--font-mono), monospace"
                >
                  π (Chão)
                </text>
                {/* Single ambiguous vertical ray */}
                <line
                  x1="365"
                  y1="88"
                  x2="365"
                  y2="288"
                  stroke="#FDE68A"
                  strokeWidth="2.5"
                  strokeDasharray="7 5"
                />
                {/* Shadow on floor */}
                <circle cx="365" cy="288" r="10" fill="#38BDF8" />
                <text
                  x="384"
                  y="294"
                  fontSize="16"
                  fontWeight="800"
                  fill="#38BDF8"
                  fontFamily="var(--font-mono), monospace"
                >
                  Sombra A (igual!)
                </text>
                {/* Two points at different heights casting same shadow */}
                <circle
                  cx="365"
                  cy={195 - Math.sin(localT * Math.PI * 3) * 16}
                  r="11"
                  fill="#F87171"
                />
                <text
                  x="385"
                  y={198 - Math.sin(localT * Math.PI * 3) * 16}
                  fontSize="15"
                  fontWeight="800"
                  fill="#FCA5A5"
                  fontFamily="var(--font-mono), monospace"
                >
                  (A₁) altura baixa?
                </text>
                <circle
                  cx="365"
                  cy={115 + Math.sin(localT * Math.PI * 3) * 16}
                  r="11"
                  fill="#F59E0B"
                />
                <text
                  x="385"
                  y={119 + Math.sin(localT * Math.PI * 3) * 16}
                  fontSize="15"
                  fontWeight="800"
                  fill="#FDE68A"
                  fontFamily="var(--font-mono), monospace"
                >
                  (A₂) altura alta?
                </text>
                <rect
                  x="132"
                  y="72"
                  width="180"
                  height="42"
                  rx="12"
                  fill="rgba(239,68,68,0.22)"
                  stroke="#F87171"
                />
                <text
                  x="222"
                  y="98"
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="800"
                  fill="#FECACA"
                  fontFamily="var(--font-mono), monospace"
                >
                  1 PLANO = AMBÍGUO!
                </text>
              </g>
            )}

            {sceneIndex >= 2 && (
              <g>
                {/* Vertical Wall π' slides in */}
                <polygon
                  points={`240,${70 + (1 - e) * 40} 580,${115 + (1 - e) * 40} 580,275 240,230`}
                  fill="rgba(248,113,113,0.16)"
                  stroke="#F87171"
                  strokeWidth="2"
                />
                {/* Horizontal Floor π */}
                <polygon
                  points="240,230 580,275 450,355 110,310"
                  fill="rgba(56,189,248,0.16)"
                  stroke="#38BDF8"
                  strokeWidth="2"
                />
                {/* Linha de Terra LT */}
                <line
                  x1="225"
                  y1="228"
                  x2="595"
                  y2="277"
                  stroke="#2DD4BF"
                  strokeWidth={sceneIndex === 3 ? 5.5 : 3.5}
                />
                <text
                  x="602"
                  y="282"
                  fontSize="16"
                  fontWeight="800"
                  fill="#2DD4BF"
                  fontFamily="var(--font-mono), monospace"
                >
                  LT
                </text>
                {/* Spatial Point (A) locked by 2 orthogonal rays */}
                <line
                  x1="340"
                  y1="175"
                  x2="405"
                  y2="140"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
                <line
                  x1="340"
                  y1="175"
                  x2="340"
                  y2="290"
                  stroke="#F87171"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
                <line
                  x1="405"
                  y1="140"
                  x2="405"
                  y2="252"
                  stroke="#F87171"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <line
                  x1="340"
                  y1="290"
                  x2="405"
                  y2="252"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <circle cx="340" cy="175" r="11" fill="#FDE68A" />
                <text
                  x="302"
                  y="170"
                  fontSize="17"
                  fontWeight="800"
                  fill="#FDE68A"
                  fontFamily="var(--font-mono), monospace"
                >
                  (A)
                </text>
                <circle cx="405" cy="140" r="8" fill="#F87171" />
                <text
                  x="420"
                  y="142"
                  fontSize="16"
                  fontWeight="800"
                  fill="#FCA5A5"
                  fontFamily="var(--font-mono), monospace"
                >
                  A&apos; (em π&apos;)
                </text>
                <circle cx="340" cy="290" r="8" fill="#38BDF8" />
                <text
                  x="244"
                  y="302"
                  fontSize="16"
                  fontWeight="800"
                  fill="#7DD3FC"
                  fontFamily="var(--font-mono), monospace"
                >
                  A (em π)
                </text>
                {sceneIndex === 3 && (
                  <g>
                    <rect
                      x="110"
                      y="58"
                      width="330"
                      height="44"
                      rx="12"
                      fill="rgba(45,212,191,0.18)"
                      stroke="#2DD4BF"
                    />
                    <text
                      x="275"
                      y="85"
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="800"
                      fill="#99F6E4"
                      fontFamily="var(--font-mono), monospace"
                    >
                      1 PONTO (A) ⇄ 2 PROJEÇÕES (A e A&apos;)
                    </text>
                  </g>
                )}
              </g>
            )}
          </>
        )}

        {/* ================= EPISODE 02: COORDENADAS & XYZ ================= */}
        {episode.id === "ep02-coordenadas" && (
          <>
            {sceneIndex <= 1 && (
              <g>
                <text
                  x="360"
                  y="112"
                  textAnchor="middle"
                  fontSize="15"
                  fontWeight="800"
                  fill="#94A3B8"
                  fontFamily="var(--font-mono), monospace"
                >
                  CONVENÇÃO BRASILEIRA · ORDEM ALFABÉTICA (X ; Y ; Z)
                </text>
                <text
                  x="360"
                  y="168"
                  textAnchor="middle"
                  fontSize="44"
                  fontWeight="800"
                  fill="#F8FAFC"
                  fontFamily="var(--font-mono), monospace"
                >
                  (A)(
                  <tspan fill="#2DD4BF">+2</tspan>;{" "}
                  <tspan fill="#38BDF8">+5</tspan>;{" "}
                  <tspan fill="#F87171">+3</tspan>)
                </text>
                {[
                  {
                    x: 92,
                    col: "#2DD4BF",
                    num: "1º · X",
                    name: "ABSCISSA",
                    desc: "Anda sobre a LT",
                    delay: 0.0,
                  },
                  {
                    x: 280,
                    col: "#38BDF8",
                    num: "2º · Y",
                    name: "AFASTAMENTO",
                    desc: "Frente/trás de π'",
                    delay: 0.25,
                  },
                  {
                    x: 468,
                    col: "#F87171",
                    num: "3º · Z",
                    name: "COTA",
                    desc: "Altura acima de π",
                    delay: 0.5,
                  },
                ].map((card, i) => {
                  const op =
                    sceneIndex === 0
                      ? e
                      : easeOutCubic(Math.max(0, (localT - card.delay) * 2.5));
                  return (
                    <g
                      key={i}
                      opacity={op}
                      transform={`translate(0 ${(1 - op) * 22})`}
                    >
                      <rect
                        x={card.x}
                        y="206"
                        width="172"
                        height="122"
                        rx="16"
                        fill="rgba(15,23,42,0.75)"
                        stroke={card.col}
                        strokeWidth="2"
                      />
                      <text
                        x={card.x + 86}
                        y="240"
                        textAnchor="middle"
                        fontSize="16"
                        fontWeight="800"
                        fill={card.col}
                        fontFamily="var(--font-mono), monospace"
                      >
                        {card.num}
                      </text>
                      <text
                        x={card.x + 86}
                        y="272"
                        textAnchor="middle"
                        fontSize="17"
                        fontWeight="800"
                        fill="#FFFFFF"
                      >
                        {card.name}
                      </text>
                      <text
                        x={card.x + 86}
                        y="302"
                        textAnchor="middle"
                        fontSize="12"
                        fill="#CBD5E1"
                      >
                        {card.desc}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {sceneIndex >= 2 && (
              <g>
                {/* Live Animated Folding Trap Visual */}
                <line
                  x1="110"
                  y1="215"
                  x2="585"
                  y2="215"
                  stroke="#2DD4BF"
                  strokeWidth="4"
                />
                <text
                  x="595"
                  y="221"
                  fontSize="18"
                  fontWeight="800"
                  fill="#2DD4BF"
                  fontFamily="var(--font-mono), monospace"
                >
                  LT
                </text>
                {/* Linha de chamada at x = +2 */}
                <line
                  x1="360"
                  y1="115"
                  x2="360"
                  y2="345"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeDasharray="6 5"
                />
                {/* Cota +3 UP */}
                <line
                  x1="360"
                  y1="215"
                  x2="360"
                  y2={215 - 92 * e}
                  stroke="#F87171"
                  strokeWidth="5"
                />
                <circle cx="360" cy={215 - 92 * e} r="10" fill="#F87171" />
                <text
                  x="382"
                  y={220 - 92 * e}
                  fontSize="18"
                  fontWeight="800"
                  fill="#FCA5A5"
                  fontFamily="var(--font-mono), monospace"
                >
                  A&apos; · Cota +3 SOBE ↑
                </text>

                {/* Afastamento +5 DOWN */}
                <line
                  x1="360"
                  y1="215"
                  x2="360"
                  y2={215 + 122 * e}
                  stroke="#38BDF8"
                  strokeWidth="5"
                />
                <circle cx="360" cy={215 + 122 * e} r="10" fill="#38BDF8" />
                <text
                  x="382"
                  y={220 + 122 * e}
                  fontSize="18"
                  fontWeight="800"
                  fill="#7DD3FC"
                  fontFamily="var(--font-mono), monospace"
                >
                  A · Afast. +5 DESCE ↓
                </text>

                <rect
                  x="110"
                  y="62"
                  width="465"
                  height="38"
                  rx="10"
                  fill="rgba(245,158,11,0.18)"
                  stroke="#F59E0B"
                />
                <text
                  x="342"
                  y="86"
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="800"
                  fill="#FDE68A"
                  fontFamily="var(--font-mono), monospace"
                >
                  ⚡ A PEGADINHA: NA ÉPURA, +Y (AFASTAMENTO) VAI PARA BAIXO!
                </text>
              </g>
            )}
          </>
        )}

        {/* ================= EPISODE 03: OS 4 DIEDROS ================= */}
        {episode.id === "ep03-diedros" && (() => {
          const activeD =
            sceneIndex === 0
              ? 1
              : Math.min(4, Math.floor(localT * 4) + 1);
          const coords = [
            { d: 1, dx: 95, dy: -75, col: "#38BDF8", sign: "(+; +)", pvY: -55, phY: 55 },
            { d: 2, dx: -95, dy: -75, col: "#2DD4BF", sign: "(−; +)", pvY: -65, phY: -32 },
            { d: 3, dx: -95, dy: 75, col: "#F87171", sign: "(−; −)", pvY: 55, phY: -55 },
            { d: 4, dx: 95, dy: 75, col: "#F59E0B", sign: "(+; −)", pvY: 65, phY: 32 },
          ];
          const cur = coords[activeD - 1];
          return (
            <g>
              {/* Left: 4 Quadrant Cross */}
              {[
                { d: 1, x: 260, y: 78, w: 150, h: 132, col: "#38BDF8", lbl: "1º D (+;+)" },
                { d: 2, x: 110, y: 78, w: 150, h: 132, col: "#2DD4BF", lbl: "2º D (−;+)" },
                { d: 3, x: 110, y: 210, w: 150, h: 132, col: "#F87171", lbl: "3º D (−;−)" },
                { d: 4, x: 260, y: 210, w: 150, h: 132, col: "#F59E0B", lbl: "4º D (+;−)" },
              ].map((q) => (
                <g key={q.d}>
                  <rect
                    x={q.x}
                    y={q.y}
                    width={q.w}
                    height={q.h}
                    rx="12"
                    fill={q.col}
                    fillOpacity={activeD === q.d ? 0.24 : 0.05}
                    stroke={activeD === q.d ? q.col : "rgba(255,255,255,0.12)"}
                    strokeWidth={activeD === q.d ? 2.5 : 1}
                  />
                  <text
                    x={q.x + 75}
                    y={q.y + 30}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="800"
                    fill={q.col}
                    fontFamily="var(--font-mono), monospace"
                  >
                    {q.lbl}
                  </text>
                </g>
              ))}
              <line x1="260" y1="68" x2="260" y2="352" stroke="#F87171" strokeWidth="3.5" />
              <line x1="100" y1="210" x2="420" y2="210" stroke="#38BDF8" strokeWidth="3.5" />
              <circle cx={260 + cur.dx} cy={210 + cur.dy} r="11" fill={cur.col} />
              <text
                x={260 + cur.dx + 16}
                y={214 + cur.dy}
                fontSize="15"
                fontWeight="800"
                fill="#FFFFFF"
                fontFamily="var(--font-mono), monospace"
              >
                (A)
              </text>

              {/* Right: Live Epura Result */}
              <rect
                x="455"
                y="78"
                width="175"
                height="264"
                rx="16"
                fill="rgba(15,23,42,0.8)"
                stroke={cur.col}
                strokeWidth="2"
              />
              <text
                x="542"
                y="108"
                textAnchor="middle"
                fontSize="13"
                fontWeight="800"
                fill={cur.col}
                fontFamily="var(--font-mono), monospace"
              >
                ÉPURA · {activeD}º DIEDRO
              </text>
              <line x1="478" y1="210" x2="606" y2="210" stroke="#2DD4BF" strokeWidth="3" />
              <line
                x1="542"
                y1={210 + Math.min(0, cur.pvY, cur.phY)}
                x2="542"
                y2={210 + Math.max(0, cur.pvY, cur.phY)}
                stroke="#94A3B8"
                strokeDasharray="5 4"
                strokeWidth="2"
              />
              <circle cx="542" cy={210 + cur.pvY} r="8" fill="#F87171" />
              <text x="556" y={215 + cur.pvY} fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                A&apos;
              </text>
              <circle cx="542" cy={210 + cur.phY} r="8" fill="#38BDF8" />
              <text x="526" y={215 + cur.phY} textAnchor="end" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                A
              </text>
              <text
                x="542"
                y="324"
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="#E2E8F0"
              >
                {activeD % 2 === 1 ? "Lados OPOSTOS da LT" : "MESMO lado da LT"}
              </text>
            </g>
          );
        })()}

        {/* ================= EPISODE 04: REBATIMENTO 90° ================= */}
        {episode.id === "ep04-rebatimento" && (() => {
          const foldDeg =
            sceneIndex === 0 ? 0 : sceneIndex === 1 ? easeOutCubic(localT) * 90 : 90;
          const rad = (foldDeg * Math.PI) / 180;
          const cx = 330;
          const cy = 220;
          const len = 130;
          return (
            <g>
              <text
                x="330"
                y="62"
                textAnchor="middle"
                fontSize="18"
                fontWeight="800"
                fill="#2DD4BF"
                fontFamily="var(--font-mono), monospace"
              >
                REBATIMENTO CONTÍNUO: {Math.round(foldDeg)}°
              </text>
              {/* Fixed PV */}
              <line x1={cx} y1={85} x2={cx} y2={355} stroke="#F87171" strokeWidth="4.5" />
              <text x={cx + 12} y={98} fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                π&apos; (Fixo)
              </text>
              {/* Folding PH */}
              <line
                x1={cx - len * Math.cos(rad)}
                y1={cy - len * Math.sin(rad)}
                x2={cx + len * Math.cos(rad)}
                y2={cy + len * Math.sin(rad)}
                stroke="#38BDF8"
                strokeWidth="4.5"
              />
              {/* Compass Arcs */}
              <path
                d={`M ${cx + 92} ${cy} A 92 92 0 0 1 ${cx} ${cy + 92}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              <path
                d={`M ${cx - 92} ${cy} A 92 92 0 0 1 ${cx} ${cy - 92}`}
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              {/* LT hinge */}
              <circle cx={cx} cy={cy} r="9" fill="#2DD4BF" />
              {/* A' fixed */}
              <circle cx={cx} cy={cy - 78} r="9" fill="#F87171" />
              <text x={cx - 32} y={cy - 73} fontSize="16" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                A&apos;
              </text>
              {/* A swinging along compass arc! */}
              <circle
                cx={cx + 92 * Math.cos(rad)}
                cy={cy + 92 * Math.sin(rad)}
                r="10"
                fill="#38BDF8"
              />
              <text
                x={cx + 92 * Math.cos(rad) + 16}
                y={cy + 92 * Math.sin(rad) + 6}
                fontSize="16"
                fontWeight="800"
                fill="#7DD3FC"
                fontFamily="var(--font-mono), monospace"
              >
                A (+Y gira p/ baixo!)
              </text>
            </g>
          );
        })()}

        {/* ================= EPISODE 05: BISSETORES ================= */}
        {episode.id === "ep05-bissetores" && (
          <g>
            {/* Cross + 45° Bisectors */}
            <line x1="270" y1="75" x2="270" y2="355" stroke="#F87171" strokeWidth="3" />
            <line x1="125" y1="215" x2="415" y2="215" stroke="#38BDF8" strokeWidth="3" />
            {/* β13 */}
            <line
              x1="150"
              y1="335"
              x2="390"
              y2="95"
              stroke="#F59E0B"
              strokeWidth={sceneIndex === 1 ? 5 : 2.5}
              strokeDasharray="8 5"
            />
            <text x="396" y="96" fontSize="15" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
              β₁₃ (45°)
            </text>
            {/* β24 */}
            <line
              x1="150"
              y1="95"
              x2="390"
              y2="335"
              stroke="#A78BFA"
              strokeWidth={sceneIndex === 2 ? 5 : 2.5}
              strokeDasharray="8 5"
            />
            <text x="115" y="92" fontSize="15" fontWeight="800" fill="#DDD6FE" fontFamily="var(--font-mono), monospace">
              β₂₄ (45°)
            </text>

            {/* Right: Epura Signature */}
            <rect
              x="462"
              y="92"
              width="176"
              height="245"
              rx="18"
              fill="rgba(15,23,42,0.85)"
              stroke={sceneIndex === 2 ? "#A78BFA" : "#F59E0B"}
              strokeWidth="2.2"
            />
            <line x1="485" y1="215" x2="615" y2="215" stroke="#2DD4BF" strokeWidth="3" />
            {sceneIndex === 0 && (
              <>
                <circle cx="550" cy="215" r="9" fill="#F87171" />
                <circle cx="550" cy="285" r="9" fill="#38BDF8" />
                <text x="550" y="130" textAnchor="middle" fontSize="13" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-mono), monospace">
                  Cota = 0 → A&apos; na LT
                </text>
              </>
            )}
            {sceneIndex === 1 && (
              <>
                <line x1="550" y1="145" x2="550" y2="285" stroke="#F59E0B" strokeDasharray="5 4" strokeWidth="2.5" />
                <circle cx="550" cy="145" r="9" fill="#F87171" />
                <circle cx="550" cy="285" r="9" fill="#38BDF8" />
                <text x="550" y="122" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                  β₁₃ · SIMÉTRICOS!
                </text>
              </>
            )}
            {sceneIndex === 2 && (
              <>
                <circle
                  cx="550"
                  cy={152}
                  r={16 + Math.sin(localT * Math.PI * 4) * 3}
                  fill="rgba(167,139,250,0.3)"
                  stroke="#A78BFA"
                  strokeWidth="3"
                />
                <circle cx="550" cy="152" r="8" fill="#F87171" />
                <text x="550" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#DDD6FE" fontFamily="var(--font-mono), monospace">
                  β₂₄ · B ≡ B&apos; !
                </text>
              </>
            )}
          </g>
        )}

        {/* ================= EPISODE 06: UERJ EX. 1 E EX. 2 ================= */}
        {episode.id === "ep06-uerj" && (
          <g>
            {sceneIndex <= 1 ? (
              <>
                <text x="340" y="72" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FB7185" fontFamily="var(--font-mono), monospace">
                  EXERCÍCIO 1 UERJ · (A)(+2;+5;+3) e (B)(−2;−5;−3)
                </text>
                <line x1="110" y1="220" x2="570" y2="220" stroke="#2DD4BF" strokeWidth="4" />
                {/* r' and r crossing EXACTLY at origin (340, 220)! */}
                <line x1="220" y1="290" x2="460" y2="150" stroke="#F87171" strokeWidth="4" />
                <line x1="220" y1="110" x2="460" y2="330" stroke="#38BDF8" strokeWidth="4" />
                <circle cx="460" cy="150" r="8" fill="#F87171" />
                <text x="476" y="154" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; (+3)</text>
                <circle cx="460" cy="330" r="8" fill="#38BDF8" />
                <text x="476" y="334" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (+5)</text>
                <circle cx="220" cy="290" r="8" fill="#F87171" />
                <text x="150" y="294" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">B&apos; (−3)</text>
                <circle cx="220" cy="110" r="8" fill="#38BDF8" />
                <text x="150" y="114" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">B (−5)</text>
                {/* Explosive Origin Highlight */}
                <circle cx="340" cy="220" r={16 + e * 10} fill="rgba(245,158,11,0.22)" stroke="#F59E0B" strokeWidth="3" />
                <circle cx="340" cy="220" r="7" fill="#FDE68A" />
                <rect x="242" y="346" width="196" height="34" rx="10" fill="#F59E0B" />
                <text x="340" y="368" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1C1917" fontFamily="var(--font-mono), monospace">
                  CRUZA A LT NA ORIGEM O!
                </text>
              </>
            ) : (
              <>
                <text x="340" y="72" textAnchor="middle" fontSize="15" fontWeight="800" fill="#34D399" fontFamily="var(--font-mono), monospace">
                  EXERCÍCIO 2 UERJ · PLOT TWIST: 3 PONTOS COLINEARES!
                </text>
                <line x1="110" y1="225" x2="570" y2="225" stroke="#2DD4BF" strokeWidth="4" />
                {/* Collinear +45° above & -45° below */}
                <line x1="250" y1="175" x2="490" y2="95" stroke="#F87171" strokeWidth="4.5" />
                <line x1="250" y1="275" x2="490" y2="355" stroke="#38BDF8" strokeWidth="4.5" />
                {[
                  { lbl: "A", x: 290, pvY: 162, phY: 288 },
                  { lbl: "B", x: 370, pvY: 135, phY: 315 },
                  { lbl: "C", x: 450, pvY: 108, phY: 342 },
                ].map((pt) => (
                  <g key={pt.lbl}>
                    <line x1={pt.x} y1={pt.pvY} x2={pt.x} y2={pt.phY} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth="1.5" />
                    <circle cx={pt.x} cy={pt.pvY} r="8" fill="#F87171" />
                    <text x={pt.x - 16} y={pt.pvY - 8} fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                      {pt.lbl}&apos;
                    </text>
                    <circle cx={pt.x} cy={pt.phY} r="8" fill="#38BDF8" />
                    <text x={pt.x - 16} y={pt.phY + 20} fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                      {pt.lbl}
                    </text>
                  </g>
                ))}
                <rect x="125" y="102" width="135" height="60" rx="12" fill="rgba(52,211,153,0.18)" stroke="#34D399" />
                <text x="192" y="128" textAnchor="middle" fontSize="12" fontWeight="800" fill="#A7F3D0" fontFamily="var(--font-mono), monospace">
                  Δ = (+1;+1;+1)
                </text>
                <text x="192" y="148" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ECFDF5">
                  Reta // ao β₁₃!
                </text>
              </>
            )}
          </g>
        )}

        {/* ================= EPISODE 07: Y-UP vs Z-UP ================= */}
        {episode.id === "ep07-yup-zup" && (
          <g>
            {/* Left Card: Games Y-Up */}
            <rect
              x="95"
              y="88"
              width="225"
              height="250"
              rx="20"
              fill="rgba(248,113,113,0.12)"
              stroke="#F87171"
              strokeWidth="2"
            />
            <text x="207" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
              COMPUTAÇÃO 3D (Y-UP)
            </text>
            <text x="207" y="144" textAnchor="middle" fontSize="11" fill="#CBD5E1">
              Unity · Three.js · OpenGL
            </text>
            <line x1="207" y1="265" x2="207" y2="178" stroke="#F87171" strokeWidth="4.5" />
            <text x="207" y="170" textAnchor="middle" fontSize="15" fontWeight="800" fill="#F87171" fontFamily="var(--font-mono), monospace">
              +Y ALTURA ↑
            </text>
            <line x1="207" y1="265" x2="282" y2="255" stroke="#2DD4BF" strokeWidth="3.5" />
            <text x="286" y="250" fontSize="12" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">+X</text>
            <line x1="207" y1="265" x2="152" y2="305" stroke="#38BDF8" strokeWidth="4" />
            <text x="148" y="322" textAnchor="middle" fontSize="13" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
              +Z Profund.
            </text>

            {/* Center Swap Badge */}
            <circle cx="358" cy="212" r="28" fill="#F59E0B" />
            <text x="358" y="218" textAnchor="middle" fontSize="15" fontWeight="800" fill="#1C1917" fontFamily="var(--font-mono), monospace">
              Y ⇄ Z
            </text>

            {/* Right Card: GD Academic Z-Up */}
            <rect
              x="396"
              y="88"
              width="225"
              height="250"
              rx="20"
              fill="rgba(56,189,248,0.14)"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            <text x="508" y="122" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
              GD / UERJ / CAD (Z-UP)
            </text>
            <text x="508" y="144" textAnchor="middle" fontSize="11" fill="#CBD5E1">
              Monge · Blender · Engenharia
            </text>
            <line x1="508" y1="265" x2="508" y2="178" stroke="#F87171" strokeWidth="4.5" />
            <text x="508" y="170" textAnchor="middle" fontSize="15" fontWeight="800" fill="#F87171" fontFamily="var(--font-mono), monospace">
              +Z COTA ↑
            </text>
            <line x1="508" y1="265" x2="583" y2="255" stroke="#2DD4BF" strokeWidth="3.5" />
            <text x="587" y="250" fontSize="12" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">+X</text>
            <line x1="508" y1="265" x2="453" y2="305" stroke="#38BDF8" strokeWidth="4" />
            <text x="456" y="322" textAnchor="middle" fontSize="13" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
              +Y Afastam.
            </text>

            {sceneIndex === 2 && (
              <g>
                <rect x="135" y="354" width="446" height="36" rx="10" fill="rgba(52,211,153,0.2)" stroke="#34D399" />
                <text x="358" y="377" textAnchor="middle" fontSize="14" fontWeight="800" fill="#A7F3D0" fontFamily="var(--font-mono), monospace">
                  GD (A)(+2; +5; +3) ⟹ Three.js Vector3(+2, +3, +5)
                </text>
              </g>
            )}
          </g>
        )}
      </g>
    </svg>
  );
}

export function MotionVideoPlayer({ onOpenInLab }: MotionVideoPlayerProps) {
  const [epIndex, setEpIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real-time lip-sync state driven by Web Audio API AnalyserNode
  const [mouth, setMouth] = useState<MouthFrame>("closed");
  const [energy, setEnergy] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceAttachedRef = useRef(false);

  const episode = VIDEO_EPISODES[epIndex];
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const sceneIndex = Math.max(
    0,
    episode.scenes.findIndex((s) => progress >= s.start && progress < s.end)
  );
  const activeScene = episode.scenes[sceneIndex] ?? episode.scenes[0];
  const sceneSpan = Math.max(0.01, activeScene.end - activeScene.start);
  const localT = Math.max(
    0,
    Math.min(1, (progress - activeScene.start) / sceneSpan)
  );

  // Attach Web Audio API AnalyserNode on first user playback gesture
  const ensureAudioAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceAttachedRef.current) return;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.45;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceAttachedRef.current = true;
    } catch {
      // Fallback oscillator will still animate mouth cleanly
    }
  }, []);

  // 60fps Sync Loop: audio timeline + real-time amplitude -> lip-sync sprite frame!
  useEffect(() => {
    let rafId = 0;
    const dataBuf = new Uint8Array(128);

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const audio = audioRef.current;
      if (!audio) return;

      setCurrentTime(audio.currentTime || 0);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }

      if (audio.paused || audio.ended) {
        setMouth("closed");
        setEnergy(0);
        return;
      }

      let rms = 0;
      if (analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(dataBuf);
        let sumSq = 0;
        for (let i = 0; i < dataBuf.length; i++) {
          const norm = (dataBuf[i] - 128) / 128;
          sumSq += norm * norm;
        }
        rms = Math.sqrt(sumSq / dataBuf.length);
      } else {
        // Fallback natural syllable cadence if Web Audio unavailable
        rms =
          0.08 +
          Math.abs(Math.sin(now * 0.015)) * 0.14 +
          Math.abs(Math.sin(now * 0.027)) * 0.07;
      }

      const scaled = Math.min(1, rms * 3.8);
      setEnergy(scaled);

      // Quantize vocal amplitude to our 4 Gemini Image mouth sprites!
      if (scaled < 0.08) setMouth("closed");
      else if (scaled < 0.24) setMouth("small");
      else if (scaled < 0.48) setMouth("mid");
      else setMouth("open");
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Apply playbackRate whenever changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, epIndex]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    ensureAudioAnalyser();
    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume().catch(() => {});
    }
    if (audio.paused) {
      if (audio.ended) audio.currentTime = 0;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const selectEpisode = async (idx: number, autoStart = true) => {
    const clamped = (idx + VIDEO_EPISODES.length) % VIDEO_EPISODES.length;
    setEpIndex(clamped);
    setCurrentTime(0);
    setIsPlaying(false);
    setTimeout(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.load();
      audio.playbackRate = playbackRate;
      if (autoStart) {
        ensureAudioAnalyser();
        if (audioCtxRef.current?.state === "suspended") {
          await audioCtxRef.current.resume().catch(() => {});
        }
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    }, 60);
  };

  const seekToRatio = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, ratio * audio.duration));
    setCurrentTime(audio.currentTime);
  };

  const skipBy = (deltaSec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const maxD = Number.isFinite(audio.duration) ? audio.duration : duration;
    audio.currentTime = Math.max(0, Math.min(maxD, audio.currentTime + deltaSec));
    setCurrentTime(audio.currentTime);
  };

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start animate-fade-up">
      {/* LEFT: 16:9 CINEMATIC VIDEO PLAYER */}
      <div className="space-y-3">
        <div
          ref={stageRef}
          className="relative rounded-3xl overflow-hidden border-2 border-blueprint-700 bg-[#09101E] shadow-2xl"
        >
          {/* Hidden HTML5 Audio element powered by pre-generated Gemini 3.8 Flash TTS WAV */}
          <audio
            ref={audioRef}
            src={episode.audioSrc}
            preload="metadata"
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />

          {/* 16:9 Motion Graphics Stage */}
          <div
            onClick={() => void togglePlay()}
            className="relative aspect-video w-full cursor-pointer overflow-hidden"
          >
            <MotionCanvas
              episode={episode}
              progress={progress}
              sceneIndex={sceneIndex}
              localT={localT}
            />

            {/* Top Studio HUD Overlay */}
            <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/75 border border-white/15 backdrop-blur-md">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: episode.themeAccent }}
                />
                <span className="font-mono text-[10px] sm:text-[11px] font-extrabold text-white">
                  {episode.number} · {activeScene.label}
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/75 border border-white/15 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-md">
                <Sparkles className="w-3 h-3" /> MOTION · GEMINI 3.8 LIP-SYNC
              </span>
            </div>

            {/* DESKTOP/TABLET PICTURE-IN-PICTURE LIP-SYNCED MASCOT AVATAR (Bottom-Right) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:block absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10"
            >
              <LipSyncMascot
                mouth={mouth}
                energy={energy}
                isPlaying={isPlaying}
                size="md"
                label="Prof. Mongezinho"
              />
            </div>

            {/* DESKTOP/TABLET TIMED CLOSED CAPTIONS */}
            {showCaptions && (
              <div className="hidden sm:flex pointer-events-none absolute bottom-3 left-3 right-36 justify-center">
                <div className="px-3.5 py-2 rounded-xl bg-slate-950/85 border border-white/15 text-slate-100 text-xs font-semibold leading-snug max-w-xl shadow-lg backdrop-blur-md">
                  {activeScene.subtitle}
                </div>
              </div>
            )}

            {/* Big Play Overlay when paused at start */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 transition">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ph/95 hover:bg-ph text-white flex items-center justify-center shadow-2xl ring-4 ring-white/25 transition-transform hover:scale-105">
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-current" />
                </div>
              </div>
            )}
          </div>

          {/* MOBILE-ONLY PRESENTER STRIP (100% unobstructed 16:9 canvas + Prof. Mongezinho lip-sync right next to subtitles!) */}
          <div className="flex sm:hidden items-center gap-3 px-3 py-2.5 bg-slate-900/95 border-t border-white/10">
            <LipSyncMascot
              mouth={mouth}
              energy={energy}
              isPlaying={isPlaying}
              size="sm"
              label="Mongezinho"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono font-bold text-amber-300 uppercase">
                {activeScene.label}
              </div>
              <p className="text-xs text-slate-100 font-medium leading-snug mt-0.5">
                {showCaptions
                  ? activeScene.subtitle
                  : "Legendas ocultas — toque em CC para ativar."}
              </p>
            </div>
          </div>

          {/* PRO VIDEO TRANSPORT & CHAPTER SCRUBBER BAR */}
          <div className="bg-slate-950/95 border-t border-white/10 px-3 sm:px-4 py-3 space-y-2.5 text-slate-200">
            {/* Timeline Scrubber with Chapter Marker Dots */}
            <div className="space-y-1">
              <div className="relative h-5 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={Math.round(progress * 1000)}
                  onChange={(e) => seekToRatio(Number(e.target.value) / 1000)}
                  aria-label="Linha do tempo do vídeo"
                  className="w-full accent-sky-400 cursor-pointer h-1.5 rounded-lg relative z-10"
                />
                {/* Chapter marker ticks */}
                <div className="pointer-events-none absolute inset-x-0 flex items-center">
                  {episode.scenes.slice(1).map((sc) => (
                    <span
                      key={sc.id}
                      style={{ left: `${sc.start * 100}%` }}
                      className="absolute w-1.5 h-3 rounded-full bg-amber-400/90 -translate-x-1/2"
                    />
                  ))}
                </div>
              </div>

              {/* Clickable Scene Jump Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {episode.scenes.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => seekToRatio(sc.start + 0.005)}
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

            {/* Bottom Controls Row */}
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
                  onClick={() => skipBy(-5)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  title="Voltar 5s"
                  aria-label="Voltar 5 segundos"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void selectEpisode(epIndex - 1)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  title="Episódio anterior"
                  aria-label="Episódio anterior"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void selectEpisode(epIndex + 1)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  title="Próximo episódio"
                  aria-label="Próximo episódio"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] text-slate-400 pl-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Playback Speed Cycle */}
                <button
                  type="button"
                  onClick={() => {
                    const speeds = [0.85, 1.0, 1.25, 1.5];
                    const next =
                      speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
                    setPlaybackRate(next);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[11px] font-bold"
                  title="Velocidade de reprodução"
                >
                  {playbackRate}x
                </button>

                {/* CC Toggle */}
                <button
                  type="button"
                  onClick={() => setShowCaptions((v) => !v)}
                  className={`p-1.5 rounded-lg transition ${
                    showCaptions
                      ? "bg-amber-400/20 text-amber-300"
                      : "text-slate-400 hover:bg-white/10"
                  }`}
                  title="Ligar/desligar legendas"
                  aria-label="Legendas"
                >
                  <Captions className="w-4 h-4" />
                </button>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  title="Tela cheia"
                  aria-label="Tela cheia"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Below Player: Episode Title + Deep Link into Interactive 3D Lab */}
        <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-draft">
          <div>
            <div className="text-[11px] font-mono font-extrabold text-ph dark:text-sky-400">
              {episode.number} · {episode.tag} · Voz Gemini 3.8 Flash TTS + Lip-Sync Real
            </div>
            <h3 className="font-display text-xl font-bold text-ink-900 dark:text-white mt-0.5">
              {episode.title}
            </h3>
            <p className="text-xs text-ink-500 dark:text-slate-400 mt-0.5">
              {episode.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenInLab(episode.labPreset)}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold transition"
          >
            <Compass className="w-4 h-4" /> Praticar esta Cena no Lab 3D
          </button>
        </div>
      </div>

      {/* RIGHT: 7-EPISODE CHAPTER PLAYLIST */}
      <aside className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
            Temporada 1 · {VIDEO_EPISODES.length} Episódios
          </div>
          <span className="font-mono text-[10px] font-bold text-lt">
            Motion HD
          </span>
        </div>

        <div className="space-y-1.5">
          {VIDEO_EPISODES.map((ep, idx) => {
            const active = idx === epIndex;
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => void selectEpisode(idx, true)}
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
                      : "bg-paper-200 dark:bg-blueprint-800 text-ink-700 dark:text-slate-300"
                  }`}
                >
                  {active && isPlaying ? "▶" : idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-mono text-[10px] font-extrabold ${
                        active
                          ? "text-amber-300 dark:text-blueprint-950/80"
                          : "text-ph dark:text-sky-400"
                      }`}
                    >
                      {ep.number} · {ep.tag}
                    </span>
                    <span className="font-mono text-[10px] opacity-75">
                      {ep.durationHint}
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
