"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  EpisodeTimingsMap,
  VIDEO_EPISODES,
  VideoEpisode,
  VideoSceneCue,
} from "@/lib/video-episodes";
import { LipSyncMascot, MouthFrame } from "./LipSyncMascot";
import { GDPoint, GDSegment } from "@/lib/gd-math";
import { sfx } from "@/lib/sfx";
import {
  Captions,
  CheckCircle2,
  Compass,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

interface MotionVideoPlayerProps {
  watchedEpisodes?: string[];
  onEpisodeWatched?: (episodeId: string) => void;
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

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Hand-choreographed 16:9 60fps Motion Graphics Renderer (viewBox 800 x 450)
 * Every single sceneId maps 1:1 to the EXACT spoken studio scene in `timings.json`!
 */
function MotionCanvas({
  episode,
  sceneId,
  localT,
  progress,
}: {
  episode: VideoEpisode;
  sceneId: string;
  localT: number;
  progress: number;
}) {
  const e = easeOutCubic(Math.min(1, localT * 2.6));
  const eSlow = easeOutCubic(Math.min(1, localT * 1.15));
  const subtleZoom = 1 + progress * 0.025;

  // Helper for reusable animated Diedro profile + live Epura pair
  const renderDiedroFocus = (
    diedro: 1 | 2 | 3 | 4,
    showRuleFooter = false
  ) => {
    const specs = {
      1: {
        dx: 88,
        dy: -72,
        col: "#38BDF8",
        title: "1º DIEDRO (+ ; +)",
        pvY: -58,
        phY: 62,
        pvTxt: "A' ACIMA (+)",
        phTxt: "A ABAIXO (+)",
        badge: "Lados OPOSTOS · Observador aqui!",
      },
      2: {
        dx: -88,
        dy: -72,
        col: "#2DD4BF",
        title: "2º DIEDRO (− ; +)",
        pvY: -68,
        phY: -34,
        pvTxt: "A' ACIMA (+)",
        phTxt: "A ACIMA (−)",
        badge: "AMBAS ACIMA da Linha de Terra!",
      },
      3: {
        dx: -88,
        dy: 72,
        col: "#F87171",
        title: "3º DIEDRO (− ; −)",
        pvY: 58,
        phY: -62,
        pvTxt: "A' ABAIXO (−)",
        phTxt: "A ACIMA (−)",
        badge: "Espelho do 1º: A sobe e A' desce!",
      },
      4: {
        dx: 88,
        dy: 72,
        col: "#F59E0B",
        title: "4º DIEDRO (+ ; −)",
        pvY: 36,
        phY: 70,
        pvTxt: "A' ABAIXO (−)",
        phTxt: "A ABAIXO (+)",
        badge: "ÍMPARES = Opostos · PARES = Mesmo Lado!",
      },
    }[diedro];

    return (
      <g opacity={e}>
        {[
          { d: 1, x: 245, y: 74, w: 145, h: 126, col: "#38BDF8", lbl: "1º D (+;+)" },
          { d: 2, x: 100, y: 74, w: 145, h: 126, col: "#2DD4BF", lbl: "2º D (−;+)" },
          { d: 3, x: 100, y: 200, w: 145, h: 126, col: "#F87171", lbl: "3º D (−;−)" },
          { d: 4, x: 245, y: 200, w: 145, h: 126, col: "#F59E0B", lbl: "4º D (+;−)" },
        ].map((q) => (
          <g key={q.d}>
            <rect
              x={q.x}
              y={q.y}
              width={q.w}
              height={q.h}
              rx="12"
              fill={q.col}
              fillOpacity={diedro === q.d ? 0.26 : 0.04}
              stroke={diedro === q.d ? q.col : "rgba(255,255,255,0.12)"}
              strokeWidth={diedro === q.d ? 2.6 : 1}
            />
            <text
              x={q.x + 72}
              y={q.y + 28}
              textAnchor="middle"
              fontSize="13"
              fontWeight="800"
              fill={q.col}
              fontFamily="var(--font-mono), monospace"
            >
              {q.lbl}
            </text>
          </g>
        ))}

        {/* π' and π axes */}
        <line x1="245" y1="62" x2="245" y2="338" stroke="#F87171" strokeWidth="3.5" />
        <line x1="88" y1="200" x2="402" y2="200" stroke="#38BDF8" strokeWidth="3.5" />
        <circle cx="245" cy="200" r="6" fill="#2DD4BF" />

        {/* Projecting rays from (A) */}
        <line
          x1={245 + specs.dx}
          y1={200 + specs.dy}
          x2={245}
          y2={200 + specs.dy}
          stroke="#38BDF8"
          strokeDasharray="5 4"
          strokeWidth="2"
        />
        <line
          x1={245 + specs.dx}
          y1={200 + specs.dy}
          x2={245 + specs.dx}
          y2={200}
          stroke="#F87171"
          strokeDasharray="5 4"
          strokeWidth="2"
        />
        <circle
          cx={245 + specs.dx}
          cy={200 + specs.dy}
          r="11"
          fill={specs.col}
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <text
          x={245 + specs.dx + (specs.dx > 0 ? 16 : -34)}
          y={204 + specs.dy}
          fontSize="15"
          fontWeight="800"
          fill="#FFFFFF"
          fontFamily="var(--font-mono), monospace"
        >
          (A)
        </text>
        <circle cx="245" cy={200 + specs.dy} r="6.5" fill="#F87171" />
        <circle cx={245 + specs.dx} cy="200" r="6.5" fill="#38BDF8" />

        {/* Right Card: Exact Épura 2D result */}
        <rect
          x="432"
          y="74"
          width="210"
          height="252"
          rx="18"
          fill="rgba(15,23,42,0.85)"
          stroke={specs.col}
          strokeWidth="2.2"
        />
        <text
          x="537"
          y="104"
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill={specs.col}
          fontFamily="var(--font-mono), monospace"
        >
          {specs.title}
        </text>
        <line x1="452" y1="200" x2="622" y2="200" stroke="#2DD4BF" strokeWidth="3.2" />
        <text x="618" y="192" textAnchor="end" fontSize="11" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
          LT
        </text>
        <line
          x1="505"
          y1={200 + Math.min(0, specs.pvY, specs.phY)}
          x2="505"
          y2={200 + Math.max(0, specs.pvY, specs.phY)}
          stroke="#94A3B8"
          strokeDasharray="5 4"
          strokeWidth="2"
        />
        <circle cx="505" cy={200 + specs.pvY * e} r="8" fill="#F87171" />
        <text
          x="520"
          y={205 + specs.pvY * e}
          fontSize="12.5"
          fontWeight="800"
          fill="#FCA5A5"
          fontFamily="var(--font-mono), monospace"
        >
          {specs.pvTxt}
        </text>
        <circle cx="505" cy={200 + specs.phY * e} r="8" fill="#38BDF8" />
        <text
          x="520"
          y={205 + specs.phY * e}
          fontSize="12.5"
          fontWeight="800"
          fill="#7DD3FC"
          fontFamily="var(--font-mono), monospace"
        >
          {specs.phTxt}
        </text>

        <rect
          x="100"
          y="344"
          width="542"
          height="36"
          rx="10"
          fill={showRuleFooter ? "rgba(245,158,11,0.22)" : "rgba(30,41,59,0.85)"}
          stroke={specs.col}
        />
        <text
          x="371"
          y="367"
          textAnchor="middle"
          fontSize="13.5"
          fontWeight="800"
          fill="#FEF3C7"
          fontFamily="var(--font-mono), monospace"
        >
          ✦ {specs.badge}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 800 450"
      className="w-full h-full block select-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="studioGlowV2" cx="45%" cy="42%" r="68%">
          <stop offset="0%" stopColor="#172A4A" />
          <stop offset="100%" stopColor="#09101E" />
        </radialGradient>
        <pattern
          id="studioGridV2"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 32 0 L 0 0 0 32"
            fill="none"
            stroke="rgba(148,163,184,0.085)"
            strokeWidth="1"
          />
        </pattern>

        {/* Documentary Cinema Masks so artwork blends seamlessly into the video frame */}
        <linearGradient id="fadeRightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
          <stop offset="56%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="84%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
        <mask id="fadeRightMask" maskContentUnits="objectBoundingBox">
          <rect x="0" y="0" width="1" height="1" fill="url(#fadeRightGrad)" />
        </mask>

        <radialGradient id="radialFeatherGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="58%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <mask id="radialFeatherMask" maskContentUnits="objectBoundingBox">
          <rect x="0" y="0" width="1" height="1" fill="url(#radialFeatherGrad)" />
        </mask>

        <linearGradient id="cinemaVignette" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#070D19" stopOpacity="0.62" />
          <stop offset="55%" stopColor="#09101E" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#070D19" stopOpacity="0.90" />
        </linearGradient>

        <clipPath id="cgMonitorClip">
          <rect x="30" y="74" width="372" height="320" rx="26" />
        </clipPath>
        <clipPath id="gdTableClip">
          <rect x="56" y="56" width="340" height="348" rx="26" />
        </clipPath>
      </defs>

      <rect width="800" height="450" fill="url(#studioGlowV2)" />
      <rect width="800" height="450" fill="url(#studioGridV2)" />

      {/* Minimalist cinema crop marks */}
      <g stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" fill="none">
        <path d="M20 42 V20 H42" />
        <path d="M780 42 V20 H758" />
        <path d="M20 408 V430 H42" />
      </g>

      <g
        transform={`translate(400 225) scale(${subtleZoom.toFixed(4)}) translate(-400 -225)`}
      >
        {/* =================== EPISODE 01: MONGE =================== */}
        {episode.id === "ep01-monge" && (
          <>
            {sceneId === "intro" && (() => {
              const kbScale = 1.03 + localT * 0.08;
              const kbX = -localT * 18;
              return (
                <g opacity={e}>
                  {/* Integrated Full-Bleed Ken Burns Drafting Atelier B-Roll */}
                  <g
                    transform={`translate(${400 + kbX} 225) scale(${kbScale.toFixed(4)}) translate(-400 -225)`}
                    opacity={0.34 * e}
                  >
                    <image
                      href="/illustrations/uerj-atelier.png"
                      x="0"
                      y="-175"
                      width="800"
                      height="800"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  <rect width="800" height="450" fill="url(#cinemaVignette)" />

                  {/* Editorial Kinetic Title Overlay */}
                  <rect
                    x="74"
                    y="102"
                    width="548"
                    height="232"
                    rx="24"
                    fill="rgba(9,16,30,0.68)"
                    stroke="rgba(56,189,248,0.45)"
                    strokeWidth="1.6"
                  />
                  <line
                    x1="108"
                    y1="136"
                    x2={108 + 54 * e}
                    y2="136"
                    stroke="#F59E0B"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <text x="172" y="141" fontSize="13.5" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
                    EPISÓDIO 01 · GEOMETRIA DESCRITIVA · UERJ
                  </text>
                  <text x="108" y="204" fontSize="40" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
                    Do Espaço 3D para a
                  </text>
                  <text x="108" y="252" fontSize="40" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-display), serif">
                    Folha Plana 2D
                  </text>
                  <line
                    x1="108"
                    y1="278"
                    x2={108 + 410 * e}
                    y2="278"
                    stroke="#2DD4BF"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <text x="108" y="308" fontSize="14.5" fill="#E2E8F0">
                    Precisão exata para reconstruir qualquer ponto no espaço!
                  </text>
                </g>
              );
            })()}

            {sceneId === "ambiguous-shadow" && (() => {
              // Beat A (0..0.38): Seamless integrated Fly-in-Room 3D documentary plate + callouts
              // Beat B (0.34..1.0): Smooth cross-dissolve into crisp 1m vs 3m height ambiguity proof
              const cutProgress = smoothStep(0.32, 0.42, localT);
              const beatAOp = e * (1 - cutProgress);
              const beatBOp = e * cutProgress;
              const imgZoom = 1.0 + localT * 0.09;
              return (
                <g>
                  {/* Integrated Fly-in-Room Artwork (melts seamlessly into #09101E via radialFeatherMask!) */}
                  <g
                    opacity={e * (1 - cutProgress * 0.84)}
                    transform={`translate(${435 - cutProgress * 185} 215) scale(${imgZoom.toFixed(4)}) translate(-435 -215)`}
                  >
                    <image
                      href="/illustrations/fly-room-3d.png"
                      x="220"
                      y="2"
                      width="430"
                      height="430"
                      mask="url(#radialFeatherMask)"
                    />
                  </g>

                  {/* BEAT A: Editorial Callouts directly over the Fly-in-Room scene */}
                  {beatAOp > 0.01 && (
                    <g opacity={beatAOp}>
                      <text x="58" y="138" fontSize="13" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
                        EXPERIÊNCIA MENTAL
                      </text>
                      <text x="58" y="182" fontSize="34" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
                        Imagine uma
                      </text>
                      <text x="58" y="222" fontSize="34" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-display), serif">
                        Mosca na Sala
                      </text>
                      <line
                        x1="58"
                        y1="240"
                        x2={58 + 185 * e}
                        y2="240"
                        stroke="#2DD4BF"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <text x="58" y="268" fontSize="13.5" fill="#CBD5E1">
                        Iluminada lá de cima, ela projeta
                      </text>
                      <text x="58" y="288" fontSize="13.5" fill="#CBD5E1">
                        uma sombra vertical no chão (π).
                      </text>

                      {/* Animated callout arrow pointing straight to the glowing fly in the artwork */}
                      <circle
                        cx="435"
                        cy="206"
                        r={20 + Math.sin(localT * 10) * 3}
                        fill="none"
                        stroke="#FDE68A"
                        strokeWidth="2.4"
                        strokeDasharray="6 4"
                      />
                      <polyline
                        points="458,194 522,148 634,148"
                        fill="none"
                        stroke="#FDE68A"
                        strokeWidth="2.2"
                      />
                      <text x="526" y="140" fontSize="13.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                        Mosca (A) no 3D
                      </text>

                      {/* Callout pointing straight to the floor shadow */}
                      <polyline
                        points="435,288 518,288 628,288"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2.2"
                        strokeDasharray="5 4"
                      />
                      <circle cx="435" cy="288" r="6" fill="#38BDF8" />
                      <text x="522" y="280" fontSize="13" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                        Sombra no chão π
                      </text>
                    </g>
                  )}

                  {/* BEAT B: Analytical 1m vs 3m Height Ambiguity Proof */}
                  {beatBOp > 0.01 && (
                    <g opacity={beatBOp}>
                      <polygon
                        points="110,300 480,350 620,270 250,225"
                        fill="rgba(56,189,248,0.16)"
                        stroke="#38BDF8"
                        strokeWidth="2.2"
                      />
                      <text x="515" y="316" fontSize="15" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
                        π (Plano Horizontal)
                      </text>
                      <line x1="360" y1="68" x2="360" y2="288" stroke="#FDE68A" strokeWidth="2.5" strokeDasharray="7 5" />
                      <polygon points="360,280 353,266 367,266" fill="#FDE68A" />
                      <circle cx="360" cy="288" r="11" fill="#38BDF8" />
                      <text x="380" y="294" fontSize="16" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                        Sombra A (idêntica!)
                      </text>
                      <circle cx="360" cy={218 - Math.sin(localT * 10) * 8} r="11" fill="#F87171" />
                      <text x="382" y={222 - Math.sin(localT * 10) * 8} fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                        Mosca baixa (1m)
                      </text>
                      <circle cx="360" cy={112 + Math.sin(localT * 10) * 8} r="11" fill="#F59E0B" />
                      <text x="382" y={116 + Math.sin(localT * 10) * 8} fontSize="15" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                        Mosca alta (3m)
                      </text>
                      <rect x="98" y="68" width="228" height="46" rx="12" fill="rgba(239,68,68,0.24)" stroke="#F87171" strokeWidth="2" />
                      <text x="212" y="96" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FECACA" fontFamily="var(--font-mono), monospace">
                        1 PLANO PERDE A ALTURA!
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}

            {sceneId === "two-planes" && (() => {
              // Beat A (0..0.34): Full-height Documentary Portrait Cut of Gaspard Monge!
              // Beat B (0.30..1.0): Smooth cross-dissolve into the 90° Mongean 2-plane diagram!
              const cutProgress = smoothStep(0.28, 0.38, localT);
              const portraitOp = e * (1 - cutProgress * 0.88);
              const bioOp = e * (1 - cutProgress);
              const diagOp = e * cutProgress;
              const kbScale = 1.0 + localT * 0.08;
              return (
                <g>
                  {/* Full-height Seamless Feathered Portrait of Gaspard Monge */}
                  <g
                    opacity={portraitOp}
                    transform={`translate(215 225) scale(${kbScale.toFixed(4)}) translate(-215 -225)`}
                  >
                    <image
                      href="/illustrations/gaspard-monge.png"
                      x="-20"
                      y="-10"
                      width="470"
                      height="470"
                      preserveAspectRatio="xMidYMid slice"
                      mask="url(#fadeRightMask)"
                    />
                  </g>

                  {/* BEAT A: Museum Documentary Editorial Bio Card integrated right next to Monge */}
                  {bioOp > 0.01 && (
                    <g opacity={bioOp}>
                      <line
                        x1="408"
                        y1="118"
                        x2={408 + 70 * e}
                        y2="118"
                        stroke="#F59E0B"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <text x="408" y="148" fontSize="13.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                        FRANÇA · 1746 – 1818
                      </text>
                      <text x="408" y="202" fontSize="42" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-display), serif">
                        Gaspard Monge
                      </text>
                      <text x="408" y="236" fontSize="17" fontWeight="700" fill="#38BDF8">
                        Pai da Geometria Descritiva (1799)
                      </text>
                      <rect
                        x="408"
                        y="260"
                        width="229"
                        height="78"
                        rx="16"
                        fill="rgba(15,23,42,0.82)"
                        stroke="rgba(253,230,138,0.4)"
                        strokeWidth="1.5"
                      />
                      <text x="426" y="290" fontSize="13.5" fontWeight="700" fill="#F8FAFC" fontFamily="var(--font-mono), monospace">
                        2 planos a 90° (π e π&apos;)
                      </text>
                      <text x="426" y="318" fontSize="13" fill="#CBD5E1">
                        Chão + parede localizam o ponto.
                      </text>
                    </g>
                  )}

                  {/* BEAT B: 2-Plane 90° Orthogonal Projection Construction */}
                  {diagOp > 0.01 && (
                    <g opacity={diagOp}>
                      <polygon
                        points={`230,${65 + (1 - diagOp) * 26} 570,${110 + (1 - diagOp) * 26} 570,270 230,225`}
                        fill="rgba(248,113,113,0.16)"
                        stroke="#F87171"
                        strokeWidth="2.2"
                      />
                      <text x="246" y="102" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                        π&apos; (Plano Vertical)
                      </text>
                      <polygon
                        points="230,225 570,270 440,355 100,310"
                        fill="rgba(56,189,248,0.16)"
                        stroke="#38BDF8"
                        strokeWidth="2.2"
                      />
                      <text x="415" y="344" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                        π (Plano Horizontal)
                      </text>
                      <rect x="498" y="216" width="54" height="32" rx="8" fill="#0F172A" stroke="#2DD4BF" strokeWidth="2" />
                      <text x="525" y="237" textAnchor="middle" fontSize="14" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                        90°
                      </text>
                      <line x1="335" y1="168" x2="405" y2="132" stroke="#38BDF8" strokeWidth="3" strokeDasharray="6 4" />
                      <line x1="335" y1="168" x2="335" y2="288" stroke="#F87171" strokeWidth="3" strokeDasharray="6 4" />
                      <circle cx="335" cy="168" r="12" fill="#FDE68A" />
                      <text x="292" y="164" fontSize="18" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">(A)</text>
                      <circle cx="405" cy="132" r="9" fill="#F87171" />
                      <text x="422" y="137" fontSize="16" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; (Vertical)</text>
                      <circle cx="335" cy="288" r="9" fill="#38BDF8" />
                      <text x="218" y="296" fontSize="16" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (Horizontal)</text>
                    </g>
                  )}
                </g>
              );
            })()}

            {sceneId === "lt-and-notation" && (
              <g opacity={e}>
                {/* Bold Glowing Linha de Terra */}
                <line x1="100" y1="142" x2="620" y2="142" stroke="#2DD4BF" strokeWidth="6" strokeLinecap="round" />
                <line x1="104" y1="152" x2="142" y2="152" stroke="#2DD4BF" strokeWidth="3" />
                <line x1="578" y1="152" x2="616" y2="152" stroke="#2DD4BF" strokeWidth="3" />
                <text x="360" y="114" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                  LINHA DE TERRA (LT) — O &ldquo;RODAPÉ&rdquo;
                </text>
                {/* 3 Notation Cards */}
                {[
                  { x: 92, col: "#FDE68A", sym: "(A)", name: "Ponto no Espaço", sub: "Sempre entre parênteses" },
                  { x: 274, col: "#38BDF8", sym: "A", name: "Proj. Horizontal", sub: "No chão π (sem linha)" },
                  { x: 456, col: "#F87171", sym: "A'", name: "Proj. Vertical", sub: "Na parede π' (com apóstrofo)" },
                ].map((c, idx) => (
                  <g key={idx}>
                    <rect x={c.x} y="196" width="166" height="148" rx="18" fill="rgba(15,23,42,0.85)" stroke={c.col} strokeWidth="2.2" />
                    <text x={c.x + 83} y="246" textAnchor="middle" fontSize="36" fontWeight="800" fill={c.col} fontFamily="var(--font-mono), monospace">
                      {c.sym}
                    </text>
                    <text x={c.x + 83} y="286" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FFFFFF">
                      {c.name}
                    </text>
                    <text x={c.x + 83} y="312" textAnchor="middle" fontSize="11.5" fill="#CBD5E1">
                      {c.sub}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {sceneId === "takeaway" && (
              <g opacity={e}>
                <g opacity={0.28 * e}>
                  <image
                    href="/illustrations/fly-room-3d.png"
                    x="-40"
                    y="40"
                    width="340"
                    height="340"
                    mask="url(#radialFeatherMask)"
                  />
                </g>
                <rect x="98" y="96" width="530" height="230" rx="24" fill="rgba(9,16,30,0.78)" stroke="#2DD4BF" strokeWidth="2.4" />
                <text x="363" y="148" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                  RESUMO DO EPISÓDIO 01 ✓
                </text>
                <text x="363" y="210" textAnchor="middle" fontSize="32" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">
                  1 Ponto <tspan fill="#FDE68A">(A)</tspan> ⇄ 2 Projeções
                </text>
                <text x="363" y="256" textAnchor="middle" fontSize="22" fontWeight="800" fill="#CBD5E1" fontFamily="var(--font-mono), monospace">
                  <tspan fill="#38BDF8">A</tspan> (avanço/lado) + <tspan fill="#F87171">A&apos;</tspan> (altura)
                </text>
                <text x="363" y="298" textAnchor="middle" fontSize="15" fontWeight="700" fill="#99F6E4">
                  Posição 100% única e reconstruível no espaço 3D!
                </text>
              </g>
            )}
          </>
        )}

        {/* =================== EPISODE 02: COORDENADAS =================== */}
        {episode.id === "ep02-coordenadas" && (
          <>
            {sceneId === "intro" && (
              <g opacity={e}>
                <text x="360" y="102" textAnchor="middle" fontSize="15" fontWeight="800" fill="#94A3B8" fontFamily="var(--font-mono), monospace">
                  CONVENÇÃO BRASILEIRA (UERJ) · ORDEM ALFABÉTICA
                </text>
                <text x="360" y="166" textAnchor="middle" fontSize="48" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">
                  (A)(<tspan fill="#2DD4BF">+2</tspan>; <tspan fill="#38BDF8">+5</tspan>; <tspan fill="#F87171">+3</tspan>)
                </text>
                {[
                  { x: 88, col: "#2DD4BF", k: "AB · 1º (X)", t: "Abscissa" },
                  { x: 274, col: "#38BDF8", k: "AF · 2º (Y)", t: "Afastamento" },
                  { x: 460, col: "#F87171", k: "CO · 3º (Z)", t: "Cota" },
                ].map((b, i) => (
                  <g key={i}>
                    <rect x={b.x} y="210" width="172" height="106" rx="16" fill="rgba(15,23,42,0.85)" stroke={b.col} strokeWidth="2.2" />
                    <text x={b.x + 86} y="250" textAnchor="middle" fontSize="15" fontWeight="800" fill={b.col} fontFamily="var(--font-mono), monospace">{b.k}</text>
                    <text x={b.x + 86} y="286" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FFFFFF">{b.t}</text>
                  </g>
                ))}
              </g>
            )}

            {sceneId === "abscissa" && (() => {
              // Subtle B-roll reveal of UERJ drafting desk right as he mentions "lapiseira 0.5"
              const deskReveal = smoothStep(0.54, 0.72, localT);
              return (
                <g opacity={e}>
                  {deskReveal > 0.01 && (
                    <g opacity={0.24 * deskReveal}>
                      <image
                        href="/illustrations/uerj-atelier.png"
                        x="0"
                        y="-175"
                        width="800"
                        height="800"
                        preserveAspectRatio="xMidYMid slice"
                      />
                      <rect width="800" height="450" fill="url(#cinemaVignette)" />
                    </g>
                  )}
                  <text x="360" y="88" textAnchor="middle" fontSize="18" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                    1ª COORDENADA · ABSCISSA (X = +2)
                  </text>
                  {/* Ruler LT */}
                  <line x1="100" y1="215" x2="620" y2="215" stroke="#2DD4BF" strokeWidth="4" />
                  {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
                    <g key={v}>
                      <line x1={360 + v * 68} y1="205" x2={360 + v * 68} y2="225" stroke="#2DD4BF" strokeWidth={v === 0 ? 3.5 : 2} />
                      <text x={360 + v * 68} y="246" textAnchor="middle" fontSize="14" fontWeight="800" fill={v === 2 ? "#FDE68A" : "#94A3B8"} fontFamily="var(--font-mono), monospace">
                        {v > 0 ? `+${v}` : v}
                      </text>
                    </g>
                  ))}
                  {/* Animated arrow from 0 to +2 */}
                  <line x1="360" y1="215" x2={360 + 136 * e} y2="215" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
                  {/* Vertical Linha de Chamada */}
                  <line x1="496" y1={215 - 110 * e} x2="496" y2={215 + 115 * e} stroke="#FDE68A" strokeWidth="2.5" strokeDasharray="6 5" />
                  <text x="510" y="130" fontSize="14" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                    Linha de Chamada (0.5 HB)
                  </text>
                  <text x="360" y="346" textAnchor="middle" fontSize="14" fill="#CBD5E1">
                    Positivo (+) anda para a DIREITA · Negativo (−) anda para a ESQUERDA
                  </text>
                </g>
              );
            })()}

            {sceneId === "afastamento" && (
              <g opacity={e}>
                <text x="360" y="76" textAnchor="middle" fontSize="18" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
                  2ª COORDENADA · AFASTAMENTO (Y = +5)
                </text>
                {/* Wall π' fixed on left */}
                <rect x="195" y="110" width="18" height="225" rx="4" fill="#F87171" />
                <text x="180" y="226" textAnchor="end" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                  Parede π&apos;
                </text>
                {/* Floor line */}
                <line x1="120" y1="255" x2="600" y2="255" stroke="#38BDF8" strokeWidth="3" />
                {/* Elastic distance arrow stretching +5 forward */}
                <line x1="213" y1="185" x2={213 + 250 * e} y2="185" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" />
                <circle cx={213 + 250 * e} cy="185" r="12" fill="#FDE68A" />
                <text x={213 + 250 * e + 18} y="190" fontSize="17" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">(A)</text>
                <line x1={213 + 250 * e} y1="185" x2={213 + 250 * e} y2="255" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="2" />
                <circle cx={213 + 250 * e} cy="255" r="9" fill="#38BDF8" />
                <text x={213 + 250 * e} y="284" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                  Projeção A (afast. +5)
                </text>
                <text x="338" y="168" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                  ← Distância até π&apos; = +5 →
                </text>
              </g>
            )}

            {sceneId === "cota" && (
              <g opacity={e}>
                <text x="360" y="76" textAnchor="middle" fontSize="18" fontWeight="800" fill="#F87171" fontFamily="var(--font-mono), monospace">
                  3ª COORDENADA · COTA (Z = +3)
                </text>
                {/* Floor π */}
                <rect x="130" y="275" width="460" height="16" rx="4" fill="#38BDF8" />
                <text x="580" y="314" textAnchor="end" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                  Chão π (Cota = 0)
                </text>
                {/* Wall line */}
                <line x1="250" y1="100" x2="250" y2="355" stroke="#F87171" strokeWidth="3" />
                {/* Altitude vector rising +3 */}
                <line x1="410" y1="275" x2="410" y2={275 - 140 * e} stroke="#F87171" strokeWidth="6" strokeLinecap="round" />
                <circle cx="410" cy={275 - 140 * e} r="12" fill="#FDE68A" />
                <text x="428" y={280 - 140 * e} fontSize="17" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">(A)</text>
                <line x1="410" y1={275 - 140 * e} x2="250" y2={275 - 140 * e} stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="2" />
                <circle cx="250" cy={275 - 140 * e} r="9" fill="#F87171" />
                <text x="234" y={280 - 140 * e} textAnchor="end" fontSize="16" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                  A&apos; (cota +3)
                </text>
                <text x="430" y="218" fontSize="16" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                  ↑ ALTURA = +3
                </text>
              </g>
            )}

            {sceneId === "trap-y" && (
              <g opacity={e}>
                <rect x="98" y="54" width="524" height="40" rx="11" fill="rgba(245,158,11,0.22)" stroke="#F59E0B" />
                <text x="360" y="79" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                  ⚡ A PEGADINHA #1: NA ÉPURA, +Y (AFASTAMENTO) DESCE!
                </text>
                <line x1="100" y1="215" x2="610" y2="215" stroke="#2DD4BF" strokeWidth="4" />
                <text x="618" y="220" fontSize="16" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">LT</text>
                <line x1="360" y1="115" x2="360" y2="352" stroke="#94A3B8" strokeDasharray="6 5" strokeWidth="2" />
                {/* Cota +3 UP */}
                <line x1="360" y1="215" x2="360" y2={215 - 88 * e} stroke="#F87171" strokeWidth="5.5" />
                <circle cx="360" cy={215 - 88 * e} r="10" fill="#F87171" />
                <text x="380" y={220 - 88 * e} fontSize="17" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                  A&apos; · Cota +3 SOBE ↑
                </text>
                {/* Afastamento +5 DOWN */}
                <line x1="360" y1="215" x2="360" y2={215 + 125 * e} stroke="#38BDF8" strokeWidth="5.5" />
                <circle cx="360" cy={215 + 125 * e} r="10" fill="#38BDF8" />
                <text x="380" y={220 + 125 * e} fontSize="17" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                  A · Afast. +5 DESCE ↓
                </text>
              </g>
            )}
          </>
        )}

        {/* =================== EPISODE 03: 4 DIEDROS =================== */}
        {episode.id === "ep03-diedros" && (
          <>
            {sceneId === "intro" && (
              <g opacity={e}>
                <text x="360" y="66" textAnchor="middle" fontSize="17" fontWeight="800" fill="#F59E0B" fontFamily="var(--font-mono), monospace">
                  OS 4 DIEDROS · SENTIDO ANTI-HORÁRIO ↺
                </text>
                <line x1="360" y1="92" x2="360" y2="368" stroke="#F87171" strokeWidth="4" />
                <line x1="150" y1="230" x2="570" y2="230" stroke="#38BDF8" strokeWidth="4" />
                {/* Counter-clockwise arc arrow */}
                <path
                  d="M 440 185 A 95 95 0 1 0 438 275"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeDasharray="8 5"
                />
                <text x="462" y="152" fontSize="22" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">1º D</text>
                <text x="205" y="152" fontSize="22" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">2º D</text>
                <text x="205" y="316" fontSize="22" fontWeight="800" fill="#F87171" fontFamily="var(--font-mono), monospace">3º D</text>
                <text x="462" y="316" fontSize="22" fontWeight="800" fill="#F59E0B" fontFamily="var(--font-mono), monospace">4º D</text>
              </g>
            )}
            {sceneId === "d1" && renderDiedroFocus(1)}
            {sceneId === "d2" && renderDiedroFocus(2)}
            {sceneId === "d3" && renderDiedroFocus(3)}
            {sceneId === "d4-rule" && renderDiedroFocus(4, true)}
          </>
        )}

        {/* =================== EPISODE 04: REBATIMENTO 90° =================== */}
        {episode.id === "ep04-rebatimento" && (() => {
          const cx = 340;
          const cy = 225;
          const len = 135;
          const foldDeg =
            sceneId === "intro" || sceneId === "hinge"
              ? 0
              : sceneId === "front-down" || sceneId === "back-up"
                ? eSlow * 90
                : 90;
          const rad = (foldDeg * Math.PI) / 180;

          if (sceneId === "chamada") {
            return (
              <g opacity={e}>
                <text x="360" y="76" textAnchor="middle" fontSize="18" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                  ÉPURA PRONTA: A LINHA DE CHAMADA (90° À LT)
                </text>
                <line x1="110" y1="220" x2="610" y2="220" stroke="#2DD4BF" strokeWidth="4.5" />
                <line x1="360" y1="118" x2="360" y2="338" stroke="#FDE68A" strokeWidth="3.5" strokeDasharray="7 5" />
                <rect x="360" y="200" width="20" height="20" fill="none" stroke="#FDE68A" strokeWidth="2" />
                <circle cx="360" cy="128" r="10" fill="#F87171" />
                <text x="380" y="134" fontSize="18" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; (mesma abscissa X!)</text>
                <circle cx="360" cy="326" r="10" fill="#38BDF8" />
                <text x="380" y="332" fontSize="18" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (mesma abscissa X!)</text>
              </g>
            );
          }

          return (
            <g opacity={e}>
              {/* Integrated Ken Burns Drafting Sheet + Feathered Gaspard Monge cameo during intro */}
              {sceneId === "intro" && (() => {
                const mongeReveal = smoothStep(0.42, 0.58, localT);
                const kbScale = 1.02 + localT * 0.07;
                return (
                  <g>
                    <g
                      opacity={0.22 * e}
                      transform={`translate(400 225) scale(${kbScale.toFixed(4)}) translate(-400 -225)`}
                    >
                      <image
                        href="/illustrations/uerj-atelier.png"
                        x="0"
                        y="-175"
                        width="800"
                        height="800"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </g>
                    <rect width="800" height="450" fill="url(#cinemaVignette)" />
                    {mongeReveal > 0.01 && (
                      <g opacity={0.52 * mongeReveal}>
                        <image
                          href="/illustrations/gaspard-monge.png"
                          x="-55"
                          y="15"
                          width="310"
                          height="440"
                          preserveAspectRatio="xMidYMid slice"
                          mask="url(#fadeRightMask)"
                        />
                      </g>
                    )}
                  </g>
                );
              })()}
              <text x="340" y="62" textAnchor="middle" fontSize="17" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                {sceneId === "intro"
                  ? "NO ESPAÇO: π E π' FORMAM 90°"
                  : sceneId === "hinge"
                    ? "DOBRADIÇA NA LT · GIRO HORÁRIO DE 90°"
                    : sceneId === "front-down"
                      ? `PISO FRONTAL (πA) DESCENDO: ${Math.round(foldDeg)}°`
                      : `PISO TRASEIRO (πP) SUBINDO: ${Math.round(foldDeg)}°`}
              </text>
              {/* Fixed PV */}
              <line x1={cx} y1="88" x2={cx} y2="362" stroke="#F87171" strokeWidth="4.5" />
              <text x={cx + 12} y="102" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">π&apos;S (Fixo)</text>
              <text x={cx + 12} y="356" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">π&apos;I (Fixo)</text>
              {/* Folding PH */}
              <line
                x1={cx - len * Math.cos(rad)}
                y1={cy - len * Math.sin(rad)}
                x2={cx + len * Math.cos(rad)}
                y2={cy + len * Math.sin(rad)}
                stroke="#38BDF8"
                strokeWidth="4.5"
              />
              {/* Front compass arc */}
              <path
                d={`M ${cx + 96} ${cy} A 96 96 0 0 1 ${cx} ${cy + 96}`}
                fill="none"
                stroke="#38BDF8"
                strokeWidth={sceneId === "front-down" ? 4 : 2}
                strokeDasharray="6 4"
              />
              {/* Back compass arc */}
              <path
                d={`M ${cx - 96} ${cy} A 96 96 0 0 1 ${cx} ${cy - 96}`}
                fill="none"
                stroke="#2DD4BF"
                strokeWidth={sceneId === "back-up" ? 4 : 2}
                strokeDasharray="6 4"
              />
              {/* LT Hinge */}
              <circle cx={cx} cy={cy} r={sceneId === "hinge" ? 13 : 8} fill="#2DD4BF" stroke="#FFFFFF" strokeWidth="2" />
              {/* Front point A (+Y) */}
              <circle cx={cx + 96 * Math.cos(rad)} cy={cy + 96 * Math.sin(rad)} r="10" fill="#38BDF8" />
              <text x={cx + 96 * Math.cos(rad) + 14} y={cy + 96 * Math.sin(rad) + 6} fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                πA (+Y desce!)
              </text>
              {/* Back point B (-Y) */}
              <circle cx={cx - 96 * Math.cos(rad)} cy={cy - 96 * Math.sin(rad)} r="10" fill="#2DD4BF" />
              <text x={cx - 96 * Math.cos(rad) - 14} y={cy - 96 * Math.sin(rad) - 8} textAnchor="end" fontSize="15" fontWeight="800" fill="#99F6E4" fontFamily="var(--font-mono), monospace">
                πP (−Y sobe!)
              </text>
            </g>
          );
        })()}

        {/* =================== EPISODE 05: BISSETORES =================== */}
        {episode.id === "ep05-bissetores" && (
          <g opacity={e}>
            {sceneId === "intro" && (
              <>
                <text x="360" y="130" textAnchor="middle" fontSize="16" fontWeight="800" fill="#A78BFA" fontFamily="var(--font-mono), monospace">
                  EPISÓDIO 05 · NÍVEL PROVA UERJ
                </text>
                <text x="360" y="196" textAnchor="middle" fontSize="38" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-display), serif">
                  Casos Especiais &amp; Bissetores
                </text>
                <text x="360" y="254" textAnchor="middle" fontSize="18" fontWeight="700" fill="#CBD5E1" fontFamily="var(--font-mono), monospace">
                  Coordenada Zero · 1º Bissetor (β₁₃) · 2º Bissetor (β₂₄)
                </text>
              </>
            )}

            {sceneId === "zero-cota" && (
              <>
                <text x="360" y="72" textAnchor="middle" fontSize="17" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                  QUANDO UMA COORDENADA VALE ZERO!
                </text>
                <line x1="100" y1="220" x2="620" y2="220" stroke="#2DD4BF" strokeWidth="4" />
                {/* Left: Cota = 0 */}
                <line x1="210" y1="220" x2="210" y2="310" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="2" />
                <circle cx="210" cy="220" r="9" fill="#F87171" />
                <text x="210" y="196" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; na LT (Cota=0)</text>
                <circle cx="210" cy="310" r="9" fill="#38BDF8" />
                <text x="210" y="338" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (em π)</text>
                {/* Center: LT */}
                <circle cx="360" cy="220" r="11" fill="#FDE68A" />
                <text x="360" y="256" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">Na LT (0;0)</text>
                {/* Right: Afast = 0 */}
                <line x1="510" y1="130" x2="510" y2="220" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="2" />
                <circle cx="510" cy="220" r="9" fill="#38BDF8" />
                <text x="510" y="250" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">C na LT (Afast.=0)</text>
                <circle cx="510" cy="130" r="9" fill="#F87171" />
                <text x="510" y="110" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">C&apos; (em π&apos;)</text>
              </>
            )}

            {(sceneId === "bisectors-intro" || sceneId === "b13" || sceneId === "b24") && (
              <>
                <line x1="255" y1="74" x2="255" y2="354" stroke="#F87171" strokeWidth="3" />
                <line x1="115" y1="214" x2="395" y2="214" stroke="#38BDF8" strokeWidth="3" />
                <line x1="135" y1="334" x2="375" y2="94" stroke="#F59E0B" strokeWidth={sceneId === "b13" ? 5.5 : 3} strokeDasharray="8 5" />
                <text x="382" y="96" fontSize="14" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">β₁₃ (45°)</text>
                <line x1="135" y1="94" x2="375" y2="334" stroke="#A78BFA" strokeWidth={sceneId === "b24" ? 5.5 : 3} strokeDasharray="8 5" />
                <text x="108" y="90" fontSize="14" fontWeight="800" fill="#DDD6FE" fontFamily="var(--font-mono), monospace">β₂₄ (45°)</text>

                <rect x="445" y="88" width="195" height="250" rx="18" fill="rgba(15,23,42,0.88)" stroke={sceneId === "b24" ? "#A78BFA" : "#F59E0B"} strokeWidth="2.4" />
                <line x1="468" y1="214" x2="618" y2="214" stroke="#2DD4BF" strokeWidth="3" />
                {sceneId === "b13" && (
                  <>
                    <text x="542" y="118" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">1º BISSETOR (+3; +3)</text>
                    <line x1="542" y1="146" x2="542" y2="282" stroke="#F59E0B" strokeDasharray="5 4" strokeWidth="2.5" />
                    <circle cx="542" cy="146" r="9" fill="#F87171" />
                    <text x="560" y="151" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; (+3)</text>
                    <circle cx="542" cy="282" r="9" fill="#38BDF8" />
                    <text x="560" y="287" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (+3)</text>
                    <text x="542" y="320" textAnchor="middle" fontSize="12" fontWeight="800" fill="#FDE68A">SIMÉTRICOS NA LT!</text>
                  </>
                )}
                {sceneId === "b24" && (
                  <>
                    <text x="542" y="118" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#DDD6FE" fontFamily="var(--font-mono), monospace">2º BISSETOR (−3; +3)</text>
                    <line x1="542" y1="150" x2="542" y2="214" stroke="#A78BFA" strokeDasharray="5 4" strokeWidth="2.5" />
                    <circle cx="542" cy="150" r={15 + Math.sin(localT * 8) * 3} fill="rgba(167,139,250,0.28)" stroke="#A78BFA" strokeWidth="3" />
                    <circle cx="542" cy="150" r="8" fill="#F87171" />
                    <text x="542" y="264" textAnchor="middle" fontSize="19" fontWeight="800" fill="#DDD6FE" fontFamily="var(--font-mono), monospace">B ≡ B&apos; !</text>
                    <text x="542" y="294" textAnchor="middle" fontSize="12" fontWeight="700" fill="#E9D5FF">COINCIDENTES!</text>
                  </>
                )}
                {sceneId === "bisectors-intro" && (
                  <>
                    <text x="542" y="160" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">|Afast.| = |Cota|</text>
                    <text x="542" y="256" textAnchor="middle" fontSize="13" fill="#CBD5E1">Cortam os diedros</text>
                    <text x="542" y="278" textAnchor="middle" fontSize="13" fill="#CBD5E1">exatamente a 45°!</text>
                  </>
                )}
              </>
            )}
          </g>
        )}

        {/* =================== EPISODE 06: UERJ EX. 1 & EX. 2 =================== */}
        {episode.id === "ep06-uerj" && (
          <g opacity={e}>
            {sceneId === "intro" && (() => {
              const kbScale = 1.03 + localT * 0.07;
              return (
                <>
                  <g
                    opacity={0.32 * e}
                    transform={`translate(400 225) scale(${kbScale.toFixed(4)}) translate(-400 -225)`}
                  >
                    <image
                      href="/illustrations/uerj-atelier.png"
                      x="0"
                      y="-175"
                      width="800"
                      height="800"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                  <rect width="800" height="450" fill="url(#cinemaVignette)" />
                  <rect x="84" y="96" width="546" height="234" rx="24" fill="rgba(9,16,30,0.72)" stroke="#FB7185" strokeWidth="2" />
                  <text x="357" y="146" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FB7185" fontFamily="var(--font-mono), monospace">
                    SLIDE DA AULA 1 · UERJ
                  </text>
                  <text x="357" y="200" textAnchor="middle" fontSize="34" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-display), serif">
                    Resolução dos Exercícios 1 e 2
                  </text>
                  <text x="357" y="252" textAnchor="middle" fontSize="14.5" fontWeight="700" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                    Ex. 1: (A)(+2; +5; +3) e (B)(−2; −5; −3)
                  </text>
                  <text x="357" y="284" textAnchor="middle" fontSize="14.5" fontWeight="700" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                    Ex. 2: (A)(+1;+2;+3) · (B)(+2;+3;+4) · (C)(+3;+4;+5)
                  </text>
                </>
              );
            })()}

            {(sceneId === "ex1-points" || sceneId === "ex1-line") && (
              <>
                <text x="350" y="68" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FB7185" fontFamily="var(--font-mono), monospace">
                  EX. 1: (A)(+2; +5; +3) [1ºD] ⇄ (B)(−2; −5; −3) [3ºD]
                </text>
                <line x1="100" y1="218" x2="600" y2="218" stroke="#2DD4BF" strokeWidth="4" />
                {sceneId === "ex1-line" && (
                  <>
                    <line x1="220" y1="288" x2={220 + 260 * e} y2={288 - 140 * e} stroke="#F87171" strokeWidth="4.5" />
                    <line x1="220" y1="108" x2={220 + 260 * e} y2={108 + 220 * e} stroke="#38BDF8" strokeWidth="4.5" />
                    <circle cx="350" cy="218" r={16 + Math.sin(localT * 8) * 4} fill="rgba(245,158,11,0.25)" stroke="#F59E0B" strokeWidth="3.2" />
                    <circle cx="350" cy="218" r="7" fill="#FDE68A" />
                    <rect x="235" y="346" width="230" height="34" rx="10" fill="#F59E0B" />
                    <text x="350" y="368" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1C1917" fontFamily="var(--font-mono), monospace">
                      r e r&apos; CRUZAM NA ORIGEM O!
                    </text>
                  </>
                )}
                <line x1="480" y1="148" x2="480" y2="328" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth="1.8" />
                <line x1="220" y1="108" x2="220" y2="288" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth="1.8" />
                <circle cx="480" cy="148" r="8.5" fill="#F87171" />
                <text x="496" y="153" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; (+3)</text>
                <circle cx="480" cy="328" r="8.5" fill="#38BDF8" />
                <text x="496" y="333" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (+5)</text>
                <circle cx="220" cy="288" r="8.5" fill="#F87171" />
                <text x="148" y="293" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">B&apos; (−3)</text>
                <circle cx="220" cy="108" r="8.5" fill="#38BDF8" />
                <text x="148" y="113" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">B (−5)</text>
              </>
            )}

            {(sceneId === "ex2-points" || sceneId === "ex2-collinear") && (
              <>
                <text x="355" y="68" textAnchor="middle" fontSize="15" fontWeight="800" fill="#34D399" fontFamily="var(--font-mono), monospace">
                  {sceneId === "ex2-points"
                    ? "EX. 2: (A)(1;2;3) · (B)(2;3;4) · (C)(3;4;5) — PASSO (+1;+1;+1)"
                    : "EX. 2 · PLOT TWIST: NÃO É TRIÂNGULO — SÃO COLINEARES!"}
                </text>
                <line x1="100" y1="224" x2="600" y2="224" stroke="#2DD4BF" strokeWidth="4" />
                {sceneId === "ex2-collinear" && (
                  <>
                    <line x1="255" y1="176" x2="505" y2="92" stroke="#F87171" strokeWidth="5" />
                    <line x1="255" y1="272" x2="505" y2="356" stroke="#38BDF8" strokeWidth="5" />
                    <rect x="108" y="102" width="160" height="72" rx="14" fill="rgba(52,211,153,0.18)" stroke="#34D399" strokeWidth="2" />
                    <text x="188" y="128" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                      ✗ SEM TRIÂNGULO
                    </text>
                    <text x="188" y="154" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#A7F3D0" fontFamily="var(--font-mono), monospace">
                      RETA // AO β₁₃!
                    </text>
                  </>
                )}
                {[
                  { lbl: "A", x: 300, pvY: 162, phY: 286 },
                  { lbl: "B", x: 380, pvY: 135, phY: 313 },
                  { lbl: "C", x: 460, pvY: 108, phY: 340 },
                ].map((pt) => (
                  <g key={pt.lbl}>
                    <line x1={pt.x} y1={pt.pvY} x2={pt.x} y2={pt.phY} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth="1.6" />
                    <circle cx={pt.x} cy={pt.pvY} r="8.5" fill="#F87171" />
                    <text x={pt.x - 16} y={pt.pvY - 8} fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">{pt.lbl}&apos;</text>
                    <circle cx={pt.x} cy={pt.phY} r="8.5" fill="#38BDF8" />
                    <text x={pt.x - 16} y={pt.phY + 22} fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">{pt.lbl}</text>
                  </g>
                ))}
              </>
            )}
          </g>
        )}

        {/* =================== EPISODE 07: Y-UP vs Z-UP =================== */}
        {episode.id === "ep07-yup-zup" && (
          <g opacity={e}>
            {sceneId === "intro" && (
              <>
                <g opacity={0.22 * e}>
                  <image
                    href="/illustrations/cg-vs-cad.png"
                    x="0"
                    y="-175"
                    width="800"
                    height="800"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
                <rect width="800" height="450" fill="url(#cinemaVignette)" />
                <rect x="92" y="88" width="230" height="252" rx="20" fill="rgba(15,23,42,0.82)" stroke="#F87171" strokeWidth="2.2" />
                <text x="207" y="124" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">GAMES &amp; WEBGL (Y-UP)</text>
                <text x="207" y="148" textAnchor="middle" fontSize="12" fill="#CBD5E1">Unity · Three.js · OpenGL</text>
                <text x="207" y="232" textAnchor="middle" fontSize="34" fontWeight="800" fill="#F87171" fontFamily="var(--font-mono), monospace">Y = Altura ↑</text>

                <circle cx="358" cy="214" r="30" fill="#F59E0B" />
                <text x="358" y="220" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1C1917" fontFamily="var(--font-mono), monospace">Y ⇄ Z</text>

                <rect x="394" y="88" width="230" height="252" rx="20" fill="rgba(15,23,42,0.82)" stroke="#38BDF8" strokeWidth="2.2" />
                <text x="509" y="124" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">UERJ / GD / CAD (Z-UP)</text>
                <text x="509" y="148" textAnchor="middle" fontSize="12" fill="#CBD5E1">Monge · Blender · Engenharia</text>
                <text x="509" y="232" textAnchor="middle" fontSize="34" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">Z = Cota ↑</text>
              </>
            )}

            {sceneId === "cg-origin" && (() => {
              const kbScale = 1.0 + localT * 0.08;
              return (
                <>
                  {/* Integrated Documentary Zoom on the 3D Monitor half of cg-vs-cad.png! */}
                  <g clipPath="url(#cgMonitorClip)">
                    <g
                      transform={`translate(222 245) scale(${kbScale.toFixed(4)}) translate(-222 -245)`}
                      opacity={0.94 * e}
                    >
                      <image
                        href="/illustrations/cg-vs-cad.png"
                        x="25"
                        y="-150"
                        width="760"
                        height="760"
                      />
                    </g>
                    {/* Live animated RGB axes projected straight onto the monitor */}
                    <line x1="128" y1="308" x2={128 + 160 * e} y2="308" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" />
                    <text x="296" y="314" fontSize="14" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">+X</text>
                    <line x1="128" y1="308" x2="128" y2={308 - 118 * e} stroke="#F87171" strokeWidth="4.5" strokeLinecap="round" />
                    <text x="128" y="176" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">+Y Altura</text>
                    <line x1="128" y1="308" x2={128 - 46 * e} y2={308 + 44 * e} stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" />
                    <text x="64" y="370" fontSize="13" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">+Z Prof.</text>
                  </g>

                  {/* Right Integrated Motion Typography */}
                  <line x1="428" y1="106" x2={428 + 64 * e} y2="106" stroke="#F87171" strokeWidth="4" strokeLinecap="round" />
                  <text x="428" y="134" fontSize="13" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                    MUNDO MONITOR · GAMES &amp; WEBGL
                  </text>
                  <text x="428" y="182" fontSize="34" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-display), serif">
                    Padrão Y-Up
                  </text>
                  <text x="428" y="218" fontSize="14" fill="#E2E8F0">
                    Monitores 2D já usavam X e Y na tela.
                  </text>
                  <text x="428" y="242" fontSize="14" fill="#E2E8F0">
                    No 3D, empurraram Z p/ profundidade!
                  </text>
                  <rect x="428" y="264" width="218" height="40" rx="12" fill="rgba(248,113,113,0.16)" stroke="#F87171" strokeWidth="1.5" />
                  <text x="537" y="289" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FECACA" fontFamily="var(--font-mono), monospace">
                    Unity · Three.js · OpenGL
                  </text>
                </>
              );
            })()}

            {sceneId === "gd-origin" && (() => {
              const kbScale = 1.0 + localT * 0.08;
              return (
                <>
                  {/* Integrated Documentary Zoom on the Z-Up Drafting Table & Rising Building half! */}
                  <g clipPath="url(#gdTableClip)">
                    <g
                      transform={`translate(215 235) scale(${kbScale.toFixed(4)}) translate(-215 -235)`}
                      opacity={0.96 * e}
                    >
                      <image
                        href="/illustrations/cg-vs-cad.png"
                        x="-260"
                        y="-80"
                        width="640"
                        height="640"
                      />
                    </g>
                    {/* Live animated +Z Altitude Vector rising next to the building */}
                    <line x1="112" y1="305" x2="112" y2={305 - 175 * e} stroke="#F87171" strokeWidth="5.5" strokeLinecap="round" />
                    <polygon points={`112,${295 - 175 * e} 102,${312 - 175 * e} 122,${312 - 175 * e}`} fill="#F87171" />
                    <text x="128" y={310 - 175 * e} fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                      +Z COTA ↑
                    </text>
                  </g>

                  {/* Right Integrated Motion Typography */}
                  <line x1="428" y1="106" x2={428 + 64 * e} y2="106" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
                  <text x="428" y="134" fontSize="13" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                    MUNDO PRANCHETA · UERJ &amp; CAD
                  </text>
                  <text x="428" y="182" fontSize="34" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-display), serif">
                    Padrão Z-Up
                  </text>
                  <text x="428" y="218" fontSize="14" fill="#E2E8F0">
                    A planta baixa no chão usa X e Y (π).
                  </text>
                  <text x="428" y="242" fontSize="14" fill="#E2E8F0">
                    Ao subir paredes, a altura vira Z!
                  </text>
                  <rect x="428" y="264" width="222" height="40" rx="12" fill="rgba(56,189,248,0.16)" stroke="#38BDF8" strokeWidth="1.5" />
                  <text x="539" y="289" textAnchor="middle" fontSize="13" fontWeight="800" fill="#BAE6FD" fontFamily="var(--font-mono), monospace">
                    Monge · Blender · AutoCAD
                  </text>
                </>
              );
            })()}

            {sceneId === "translator" && (
              <>
                <text x="360" y="88" textAnchor="middle" fontSize="16" fontWeight="800" fill="#34D399" fontFamily="var(--font-mono), monospace">
                  TRADUÇÃO EM 1 SEGUNDO: MANTENHA X E TROQUE Y ⇄ Z!
                </text>
                <rect x="115" y="122" width="490" height="72" rx="16" fill="rgba(56,189,248,0.14)" stroke="#38BDF8" strokeWidth="2" />
                <text x="360" y="166" textAnchor="middle" fontSize="26" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">
                  GD (UERJ): (A)(<tspan fill="#2DD4BF">+2</tspan>; <tspan fill="#38BDF8">+5</tspan>; <tspan fill="#F87171">+3</tspan>)
                </text>

                <text x="360" y="232" textAnchor="middle" fontSize="22" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                  ↓  5 e 3 trocam de lugar!  ↓
                </text>

                <rect x="115" y="256" width="490" height="72" rx="16" fill="rgba(52,211,153,0.16)" stroke="#34D399" strokeWidth="2" />
                <text x="360" y="300" textAnchor="middle" fontSize="25" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">
                  Three.js: Vector3(<tspan fill="#2DD4BF">+2</tspan>, <tspan fill="#F87171">+3</tspan>, <tspan fill="#38BDF8">+5</tspan>)
                </text>
              </>
            )}
          </g>
        )}
      </g>
    </svg>
  );
}

export function MotionVideoPlayer({
  watchedEpisodes = [],
  onEpisodeWatched,
  onOpenInLab,
}: MotionVideoPlayerProps) {
  const [epIndex, setEpIndex] = useState(0);
  const [timings, setTimings] = useState<EpisodeTimingsMap>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.95);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Netflix-style Up-Next countdown at the end of each episode
  const [upNextVisible, setUpNextVisible] = useState(false);
  const [upNextProgress, setUpNextProgress] = useState(0); // 0 -> 1 over 6 seconds

  // Smoothed real-time lip-sync state (ZERO jitter!)
  const [mouth, setMouth] = useState<MouthFrame>("closed");
  const [energy, setEnergy] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceAttachedRef = useRef(false);
  const smoothEnergyRef = useRef(0);
  const lastMouthSwitchRef = useRef(0);
  const currentMouthRef = useRef<MouthFrame>("closed");

  // Load exact millisecond PCM-measured scene timings from public/audio/video/timings.json
  useEffect(() => {
    fetch("/audio/video/timings.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: EpisodeTimingsMap) => {
        if (data && typeof data === "object") setTimings(data);
      })
      .catch(() => {});
  }, []);

  const baseEp = VIDEO_EPISODES[epIndex];
  const timingEntry = timings[baseEp.id];
  const scenes: VideoSceneCue[] = timingEntry?.scenes ?? baseEp.scenes;
  const effectiveDuration = duration ?? timingEntry?.duration ?? 95;
  const progress =
    effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;

  // Match active scene by EXACT real seconds!
  let sceneIndex = scenes.findIndex(
    (s) => currentTime >= s.startSec && currentTime < s.endSec
  );
  if (sceneIndex === -1) {
    sceneIndex = currentTime >= (scenes[scenes.length - 1]?.startSec ?? 0)
      ? scenes.length - 1
      : 0;
  }
  const activeScene = scenes[sceneIndex] ?? scenes[0];
  const sceneSpan = Math.max(0.2, activeScene.endSec - activeScene.startSec);
  const localT = Math.max(
    0,
    Math.min(1, (currentTime - activeScene.startSec) / sceneSpan)
  );

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
      analyser.smoothingTimeConstant = 0.65;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceAttachedRef.current = true;
    } catch {
      // graceful fallback
    }
  }, []);

  // 60fps Sync Loop with EMA smoothing + 85ms syllable hold (silky smooth lip-sync!)
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
        smoothEnergyRef.current *= 0.7;
        setEnergy(0);
        if (currentMouthRef.current !== "closed") {
          currentMouthRef.current = "closed";
          setMouth("closed");
        }
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
        rms =
          0.06 +
          Math.abs(Math.sin(now * 0.011)) * 0.12 +
          Math.abs(Math.sin(now * 0.019)) * 0.06;
      }

      // Smooth EMA envelope so mouth never chatters violently
      const rawScaled = Math.min(1, rms * 3.4);
      smoothEnergyRef.current =
        smoothEnergyRef.current * 0.72 + rawScaled * 0.28;
      const smoothed = smoothEnergyRef.current;
      setEnergy(smoothed);

      // Quantize with 85ms hold between mouth frame switches
      let nextMouth: MouthFrame = "closed";
      if (smoothed < 0.075) nextMouth = "closed";
      else if (smoothed < 0.22) nextMouth = "small";
      else if (smoothed < 0.44) nextMouth = "mid";
      else nextMouth = "open";

      if (
        nextMouth !== currentMouthRef.current &&
        now - lastMouthSwitchRef.current >= 85
      ) {
        currentMouthRef.current = nextMouth;
        lastMouthSwitchRef.current = now;
        setMouth(nextMouth);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, epIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted, epIndex]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    sfx.tick();
    setUpNextVisible(false);
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
    sfx.click();
    setUpNextVisible(false);
    setUpNextProgress(0);
    setEpIndex(clamped);
    setDuration(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setTimeout(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.load();
      audio.playbackRate = playbackRate;
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
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

  // Netflix-style 6-second auto-advance animation loop when episode ends
  useEffect(() => {
    if (!upNextVisible || epIndex === VIDEO_EPISODES.length - 1) {
      setUpNextProgress(0);
      return;
    }
    const DURATION_MS = 6000;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION_MS);
      setUpNextProgress(p);
      if (p >= 1) {
        void selectEpisode(epIndex + 1, true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upNextVisible, epIndex]);

  const seekToSeconds = (sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    setUpNextVisible(false);
    const maxD = Number.isFinite(audio.duration) ? audio.duration : effectiveDuration;
    audio.currentTime = Math.max(0, Math.min(maxD, sec));
    setCurrentTime(audio.currentTime);
  };

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      await document.exitFullscreen?.().catch(() => {});
    } else {
      await el.requestFullscreen?.().catch(() => {});
    }
  };

  // Pro Video Keyboard Shortcuts: Space (play/pause), ←/→ (±5s), M (mute), F (fullscreen)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (
        e.defaultPrevented ||
        e.isComposing ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        target?.closest("input, textarea, select, [contenteditable], [role=dialog]")
      ) {
        return;
      }
      if (e.code === "Space") {
        if (target?.closest("button, a")) return;
        e.preventDefault();
        if (!e.repeat) void togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekToSeconds((audioRef.current?.currentTime ?? 0) - 5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seekToSeconds((audioRef.current?.currentTime ?? 0) + 5);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMuted((m) => !m);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!e.repeat) void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDuration, epIndex]);

  const nextEpisode =
    epIndex < VIDEO_EPISODES.length - 1 ? VIDEO_EPISODES[epIndex + 1] : null;
  const nextEpDur = nextEpisode ? timings[nextEpisode.id]?.duration : undefined;
  const finishedSeason = VIDEO_EPISODES.every((episode) => watchedEpisodes.includes(episode.id));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start animate-fade-up">
      {/* LEFT: 16:9 CINEMATIC MOTION VIDEO PLAYER */}
      <div className="space-y-3">
        <div
          ref={stageRef}
          className="relative rounded-3xl overflow-hidden border-2 border-blueprint-700 bg-[#09101E] shadow-2xl"
        >
          <audio
            ref={audioRef}
            src={timingEntry?.audioSrc ?? baseEp.audioSrc}
            preload="metadata"
            onEnded={() => {
              setIsPlaying(false);
              setUpNextVisible(true);
              onEpisodeWatched?.(baseEp.id);
              sfx.success();
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => {
              setIsPlaying(true);
              setUpNextVisible(false);
            }}
          />

          {/* 16:9 Motion Stage */}
          <div
            onClick={() => void togglePlay()}
            className="relative aspect-video w-full cursor-pointer overflow-hidden select-none"
          >
            <MotionCanvas
              episode={baseEp}
              sceneId={activeScene.id}
              localT={localT}
              progress={progress}
            />

            {/* Top HUD */}
            <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/75 border border-white/15 backdrop-blur-md">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: baseEp.themeAccent }}
                />
                <span className="font-mono text-[10px] sm:text-[11px] font-extrabold text-white">
                  {baseEp.number} · {activeScene.label}
                </span>
              </div>
            </div>

            {/* DESKTOP PiP Lip-Sync Mascot (100% STEADY FRAME, SMOOTH LIP-SYNC!) */}
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

            {/* DESKTOP Closed Captions */}
            {showCaptions && !upNextVisible && (
              <div className="hidden sm:flex pointer-events-none absolute bottom-3 left-3 right-36 justify-center">
                <div className="px-3.5 py-2 rounded-xl bg-slate-950/88 border border-white/15 text-slate-100 text-xs font-semibold leading-snug max-w-xl shadow-lg backdrop-blur-md">
                  {activeScene.subtitle}
                </div>
              </div>
            )}

            {/* NETFLIX-STYLE "PRÓXIMO EPISÓDIO" AUTO-FILL OVERLAY */}
            {upNextVisible && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 z-20 bg-slate-950/82 backdrop-blur-md flex items-center justify-center p-4 animate-fade-up"
              >
                {nextEpisode ? (
                  <div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/95 p-4 sm:p-5 shadow-2xl space-y-3.5 text-white">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        PRÓXIMO EPISÓDIO EM{" "}
                        {Math.max(1, Math.ceil((1 - upNextProgress) * 6))}S
                      </span>
                      <span className="text-slate-400">
                        {nextEpDur ? formatTime(nextEpDur) : nextEpisode.durationHint}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-mono font-bold text-sky-400">
                        {nextEpisode.number} · {nextEpisode.tag}
                      </div>
                      <h4 className="font-display text-lg sm:text-xl font-bold leading-snug mt-0.5">
                        {nextEpisode.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {nextEpisode.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {/* Netflix Filling Progress Button */}
                      <button
                        type="button"
                        onClick={() => void selectEpisode(epIndex + 1, true)}
                        className="relative flex-1 overflow-hidden rounded-xl bg-slate-700 hover:bg-slate-600 text-white py-2.5 px-4 text-xs font-extrabold transition"
                      >
                        <span
                          className="absolute inset-y-0 left-0 bg-ph transition-none"
                          style={{ width: `${Math.round(upNextProgress * 100)}%` }}
                        />
                        <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Assistir Agora
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sfx.tick();
                          setUpNextVisible(false);
                        }}
                        className="px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-bold text-slate-200 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-md rounded-2xl border border-emerald-400/35 bg-slate-900/95 p-5 shadow-2xl space-y-3 text-center text-white">
                    <div className="text-xs font-mono font-extrabold text-emerald-300 uppercase">
                      {finishedSeason ? "Temporada 1 concluída" : "Último episódio da temporada"}
                    </div>
                    <h4 className="font-display text-xl font-bold">
                      {finishedSeason
                        ? `Você completou todas as ${VIDEO_EPISODES.length} aulas!`
                        : "Agora é hora de praticar"}
                    </h4>
                    <p className="text-xs text-slate-300">
                      Explore a cena no Lab 3D ou reveja o primeiro episódio.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenInLab(baseEp.labPreset)}
                        className="px-4 py-2 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold"
                      >
                        Abrir Lab 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => void selectEpisode(0, true)}
                        className="px-3.5 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-bold"
                      >
                        Rever EP. 01
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Big Play Overlay when paused (hidden when Up-Next card is shown) */}
            {!isPlaying && !upNextVisible && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 transition">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ph/95 hover:bg-ph text-white flex items-center justify-center shadow-2xl ring-4 ring-white/25 transition-transform hover:scale-105">
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-current" />
                </div>
              </div>
            )}
          </div>

          {/* MOBILE-ONLY PRESENTER STRIP (100% unobstructed 16:9 canvas + steady Prof. Mongezinho!) */}
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

          {/* PRO VIDEO TRANSPORT & CHAPTER SCRUBBER */}
          <div className="bg-slate-950/95 border-t border-white/10 px-3 sm:px-4 py-3 space-y-2.5 text-slate-200">
            <div className="space-y-1.5">
              <div className="relative h-5 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={Math.round(progress * 1000)}
                  onChange={(e) =>
                    seekToSeconds((Number(e.target.value) / 1000) * effectiveDuration)
                  }
                  aria-label="Linha do tempo do vídeo"
                  className="w-full accent-sky-400 cursor-pointer h-1.5 rounded-lg relative z-10"
                />
                {/* Exact scene boundary ticks */}
                <div className="pointer-events-none absolute inset-x-0 flex items-center">
                  {scenes.slice(1).map((sc) => (
                    <span
                      key={sc.id}
                      style={{
                        left: `${Math.min(99, (sc.startSec / effectiveDuration) * 100)}%`,
                      }}
                      className="absolute w-1.5 h-3 rounded-full bg-amber-400/90 -translate-x-1/2"
                    />
                  ))}
                </div>
              </div>

              {/* Exact Scene Jump Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {scenes.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      sfx.tick();
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
                  {formatTime(currentTime)} / {formatTime(effectiveDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Volume Control (Mute toggle + Slider) */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="text-slate-300 hover:text-white transition"
                    title={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
                    aria-label={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
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
                    className="w-16 sm:w-20 h-1.5 accent-sky-400 cursor-pointer rounded-lg"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const speeds = [0.85, 1.0, 1.25, 1.5];
                    const next =
                      speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
                    setPlaybackRate(next);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[11px] font-bold"
                >
                  {playbackRate}x
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaptions((v) => !v)}
                  className={`p-1.5 rounded-lg transition ${
                    showCaptions
                      ? "bg-amber-400/20 text-amber-300"
                      : "text-slate-400 hover:bg-white/10"
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

        {/* Episode Info Card */}
        <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-draft">
          <div>
            <div className="text-[11px] font-mono font-extrabold text-ph dark:text-sky-400">
              {baseEp.number} · {baseEp.tag} · Aula Completa · Voz Masculina Gemini 3.8 TTS
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
            onClick={() => onOpenInLab(baseEp.labPreset)}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold transition"
          >
            <Compass className="w-4 h-4" /> Praticar esta Cena no Lab 3D
          </button>
        </div>
      </div>

      {/* RIGHT: 7-EPISODE PLAYLIST */}
      <aside className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
            Temporada 1 · {VIDEO_EPISODES.length} Aulas
          </div>
          <span className="font-mono text-[10px] font-bold text-lt dark:text-teal-300">
            {watchedEpisodes.length}/{VIDEO_EPISODES.length} vistos
          </span>
        </div>

        <div className="space-y-1.5">
          {VIDEO_EPISODES.map((ep, idx) => {
            const active = idx === epIndex;
            const watched = watchedEpisodes.includes(ep.id);
            const epDur = timings[ep.id]?.duration;
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
                      : watched
                        ? "bg-lt/15 text-lt dark:bg-teal-950 dark:text-teal-300"
                        : "bg-paper-200 dark:bg-blueprint-800 text-ink-700 dark:text-slate-300"
                  }`}
                >
                  {active && isPlaying ? (
                    "▶"
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
                          : "text-ph dark:text-sky-400"
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
        <div className="hidden sm:block pt-1 px-1 text-[10px] font-mono text-ink-500 dark:text-slate-400">
          Atalhos: Espaço (play) · ←/→ (±5s) · M (mudo) · F (tela cheia)
        </div>
      </aside>
    </section>
  );
}
