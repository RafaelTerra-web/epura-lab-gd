"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EpisodeTimingsMap,
  VIDEO_EPISODES,
  VideoEpisode,
  VideoSceneCue,
} from "@/lib/video-episodes";
import { LipSyncMascot, MouthFrame } from "./LipSyncMascot";
import { sfx } from "@/lib/sfx";
import { getVideoSoundCues, MONGE_BEATS, playVideoSound, type VideoSound } from "@/lib/video-effects";
import { type BeatVisualFx, getNarrationBeats, type NarrationBeat } from "@/lib/video-narration-beats";
import {
  getEpisodePointExamples,
  type LabLaunchPayload,
  resolveVideoLabMoment,
} from "@/lib/video-lab-sync";
import styles from "./MotionVideoPlayer.module.css";
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
  Volume2,
  VolumeX,
} from "lucide-react";

interface MotionVideoPlayerProps {
  watchedEpisodes?: string[];
  onEpisodeWatched?: (episodeId: string) => void;
  onOpenInLab: (payload: LabLaunchPayload) => void;
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

function reactionPhase(at: number | undefined, seconds: number, length = 0.7) {
  if (at === undefined) return 0;
  return Math.max(0, Math.min(1, (seconds - at) / length));
}

function beatReaction(beats: NarrationBeat[], target: string, seconds: number, length = 0.85) {
  const at = beats.find((beat) => beat.target === target)?.at;
  const phase = reactionPhase(at, seconds, length);
  const pulse = Math.sin(phase * Math.PI);
  const wiggle = Math.sin(phase * 4 * Math.PI) * pulse;
  const scale = 1 + 0.065 * pulse;
  return { at, phase, pulse, wiggle, scale };
}

function popTransform(cx: number, cy: number, scale: number, rotateDeg = 0, dx = 0, dy = 0) {
  if (Math.abs(scale - 1) < 0.001 && Math.abs(rotateDeg) < 0.05 && Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
    return undefined;
  }
  return `translate(${(cx + dx).toFixed(2)} ${(cy + dy).toFixed(2)}) rotate(${rotateDeg.toFixed(2)}) scale(${scale.toFixed(4)}) translate(${-cx} ${-cy})`;
}

function renderVectorFly(x: number, y: number, flapPhase: number, scale = 1) {
  const wingSpread = 7.5 + 3.5 * Math.sin(flapPhase * 12);
  const wingLift = 6.5 + 3.2 * Math.cos(flapPhase * 12);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(3)})`}>
      <ellipse cx={-4.5} cy={-wingLift * 0.55} rx={wingSpread} ry={4.2} transform="rotate(-26)" fill="#E0F2FE" fillOpacity={0.78} stroke="#BAE6FD" strokeWidth="1" />
      <ellipse cx={4.5} cy={-wingLift * 0.55} rx={wingSpread} ry={4.2} transform="rotate(26)" fill="#E0F2FE" fillOpacity={0.78} stroke="#BAE6FD" strokeWidth="1" />
      <ellipse cx="0" cy="1" rx="6.2" ry="4.8" fill="url(#sphereGold)" stroke="#FFF7D6" strokeWidth="1.2" />
      <circle cx="0" cy="-4.2" r="2.8" fill="#1E293B" stroke="#FDE68A" strokeWidth="0.9" />
      <circle cx="-1" cy="-4.7" r="0.8" fill="#7DD3FC" />
      <circle cx="1" cy="-4.7" r="0.8" fill="#7DD3FC" />
    </g>
  );
}

function BeatEffect({
  fx = "draftingCrosshair",
  x,
  y,
  phase,
  accent,
}: {
  fx?: BeatVisualFx;
  x: number;
  y: number;
  phase: number;
  accent: string;
}) {
  const fade = Math.sin(Math.PI * phase);
  if (fade <= 0.01) return null;

  switch (fx) {
    case "wings": {
      const flap = Math.sin(phase * Math.PI * 6) * 8;
      return (
        <g opacity={fade * 0.9} transform={`translate(${x} ${y})`}>
          <path d={`M -12 -3 Q ${-22 - phase * 10} ${-14 - flap} -26 -2`} fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
          <path d={`M 12 -3 Q ${22 + phase * 10} ${-14 - flap} 26 -2`} fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
          <circle r={15 + phase * 14} fill="none" stroke="#FEF08A" strokeOpacity={0.45 * (1 - phase)} strokeWidth="1.2" strokeDasharray="3 4" />
        </g>
      );
    }
    case "sunbeam": {
      const sweep = phase * 22;
      return (
        <g opacity={fade * 0.85} transform={`translate(${x} ${y})`}>
          <line x1="-14" y1={-32 + sweep * 0.5} x2="-14" y2={4 + sweep} stroke="#FDE68A" strokeWidth="1.8" strokeDasharray="4 4" />
          <line x1="0" y1={-38 + sweep * 0.4} x2="0" y2={12 + sweep} stroke="#FEF08A" strokeWidth="2.4" strokeDasharray="5 4" />
          <line x1="14" y1={-32 + sweep * 0.5} x2="14" y2={4 + sweep} stroke="#FDE68A" strokeWidth="1.8" strokeDasharray="4 4" />
        </g>
      );
    }
    case "draftingCrosshair": {
      const span = 12 + phase * 12;
      return (
        <g opacity={fade * 0.9} transform={`translate(${x} ${y})`}>
          <line x1={-span} y1="0" x2={-5} y2="0" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <line x1={5} y1="0" x2={span} y2="0" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1={-span} x2="0" y2={-5} stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1={5} x2="0" y2={span} stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <circle r={8 + phase * 10} fill="none" stroke="#FDE68A" strokeWidth="1.6" />
        </g>
      );
    }
    case "rightAngleBracket": {
      const sz = 14 + phase * 6;
      return (
        <g opacity={fade * 0.9} transform={`translate(${x} ${y})`}>
          <path d={`M ${-sz} ${-sz * 0.4} V ${-sz} H ${-sz * 0.4}`} fill="none" stroke="#5EEAD4" strokeWidth="2.2" strokeLinecap="round" />
          <path d={`M ${sz} ${sz * 0.4} V ${sz} H ${sz * 0.4}`} fill="none" stroke="#5EEAD4" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    }
    case "hingeArc": {
      return (
        <g opacity={fade * 0.9} transform={`translate(${x} ${y})`}>
          <path d="M -22 0 A 22 22 0 0 1 0 -22" fill="none" stroke="#2DD4BF" strokeWidth="2.5" strokeDasharray="4 3" />
          <path d="M 22 0 A 22 22 0 0 1 0 22" fill="none" stroke="#7DD3FC" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle r={5 + phase * 6} fill="none" stroke="#FDE68A" strokeWidth="1.6" />
        </g>
      );
    }
    case "rulerMeasure": {
      const w = 16 + phase * 24;
      return (
        <g opacity={fade * 0.9} transform={`translate(${x} ${y})`}>
          <line x1={-w} y1="0" x2={w} y2="0" stroke="#7DD3FC" strokeWidth="2" strokeLinecap="round" />
          <line x1={-w} y1="-5" x2={-w} y2="5" stroke="#FDE68A" strokeWidth="2" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="#7DD3FC" strokeWidth="1.5" />
          <line x1={w} y1="-5" x2={w} y2="5" stroke="#FDE68A" strokeWidth="2" />
        </g>
      );
    }
    case "mirrorSweep": {
      return (
        <g opacity={fade * 0.88} transform={`translate(${x} ${y})`}>
          <line x1="-22" y1="22" x2="22" y2="-22" stroke="#DDD6FE" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx={-12 * (1 - phase * 0.4)} cy={-12 * (1 - phase * 0.4)} r="3.5" fill="#F87171" />
          <circle cx={12 * (1 - phase * 0.4)} cy={12 * (1 - phase * 0.4)} r="3.5" fill="#38BDF8" />
        </g>
      );
    }
    case "stampAlert": {
      const box = 18 + phase * 10;
      return (
        <g opacity={fade * 0.9} transform={`translate(${x} ${y})`}>
          <rect x={-box} y={-box * 0.55} width={box * 2} height={box * 1.1} rx="8" fill="none" stroke="#F87171" strokeWidth="2.4" />
        </g>
      );
    }
    case "axisTriad": {
      const len = 14 + phase * 10;
      return (
        <g opacity={fade * 0.9} transform={`translate(${x} ${y})`}>
          <line x1="0" y1="0" x2={len} y2="0" stroke="#2DD4BF" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2={-len} stroke="#F87171" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="0" y1="0" x2={-len * 0.7} y2={len * 0.55} stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    }
    case "cardSheen": {
      const sweep = -28 + phase * 56;
      return (
        <g opacity={fade * 0.72} transform={`translate(${x} ${y})`}>
          <line x1={sweep - 12} y1="-22" x2={sweep + 12} y2="22" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    }
    case "quadrantWave":
    default: {
      return (
        <g opacity={fade * 0.85} transform={`translate(${x} ${y})`}>
          <rect x={-14 - phase * 10} y={-14 - phase * 10} width={28 + phase * 20} height={28 + phase * 20} rx="9" fill="none" stroke={accent} strokeWidth="2" />
        </g>
      );
    }
  }
}

function DiagramLabel({ x, y, width, color, connector, children }: {
  x: number;
  y: number;
  width: number;
  color: string;
  connector?: string;
  children: React.ReactNode;
}) {
  return (
    <g fontFamily="var(--font-mono), monospace">
      {connector && <polyline points={connector} fill="none" stroke={color} strokeOpacity={0.72} strokeWidth="1.5" />}
      <rect x={x} y={y} width={width} height="30" rx="7" fill="#0B1525" stroke={color} strokeOpacity={0.65} />
      <text x={x + width / 2} y={y + 20} textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>
        {children}
      </text>
    </g>
  );
}

function MongeProjection({ time, seconds, beats }: { time: number; seconds: number; beats: NarrationBeat[] }) {
  const reveal = (target: keyof typeof MONGE_BEATS, lag = 0) => {
    const at = beats.find((beat) => beat.target === target)?.at;
    if (at === undefined) {
      const [edge0, edge1] = MONGE_BEATS[target];
      return smoothStep(edge0, edge1, time);
    }
    return smoothStep(at + lag, at + lag + 0.55, seconds);
  };
  const planesAt = beats.find((beat) => beat.target === "planes")?.at;
  const floorAt = beats.find((beat) => beat.target === "floor")?.at;
  const planes = reveal("planes");
  const planesPulse = Math.sin(reactionPhase(planesAt, seconds, 0.8) * Math.PI);
  const floorReveal = floorAt === undefined ? planes : smoothStep(floorAt - 0.12, floorAt + 0.45, seconds);
  const floorPulse = Math.sin(reactionPhase(floorAt, seconds, 0.85) * Math.PI);
  const angleRx = beatReaction(beats, "angle", seconds, 0.8);
  const pointRx = beatReaction(beats, "point", seconds, 0.85);
  const horizRx = beatReaction(beats, "horizontal", seconds, 0.85);
  const vertRx = beatReaction(beats, "vertical", seconds, 0.85);
  const point = reveal("point");
  const horizontal = reveal("horizontal");
  const vertical = reveal("vertical");
  const phLabel = reveal("horizontal", 0.22);
  const pvLabel = reveal("vertical", 0.22);

  return (
    <g opacity={planes}>
      {/* Vertical plane π' with subtle architectural perspective grid */}
      <path d="M218 72 558 112V252L218 212Z" fill="url(#verticalPlane)" stroke="#F87171" strokeWidth={2.2 + 2 * planesPulse} />
      {[0.25, 0.5, 0.75].map((u) => {
        const gx = 218 + 340 * u;
        const gyTop = 72 + 40 * u;
        const gyBot = 212 + 40 * u;
        return <line key={"vg" + u} x1={gx} y1={gyTop} x2={gx} y2={gyBot} stroke="#FCA5A5" strokeOpacity="0.14" strokeWidth="1" />;
      })}
      {[0.33, 0.66].map((v) => (
        <line key={"vh" + v} x1="218" y1={72 + 140 * v} x2="558" y2={112 + 140 * v} stroke="#FCA5A5" strokeOpacity="0.14" strokeWidth="1" />
      ))}

      {/* Horizontal plane π with perspective grid & 3D thickness edge */}
      <g opacity={floorReveal}>
        <polygon points="106,292 446,332 446,339 106,299" fill="#0F2A44" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="1" />
        <polygon points="446,332 558,252 558,259 446,339" fill="#0B1F35" stroke="#38BDF8" strokeOpacity="0.35" strokeWidth="1" />
        <path
          d="M218 212 558 252 446 332 106 292Z"
          fill="url(#horizontalPlane)"
          stroke={floorPulse > 0.05 ? "#BAE6FD" : "#38BDF8"}
          strokeWidth={2.2 + 2.4 * floorPulse}
        />
        {[0.25, 0.5, 0.75].map((u) => (
          <line
            key={"hgu" + u}
            x1={218 + 340 * u}
            y1={212 + 40 * u}
            x2={106 + 340 * u}
            y2={292 + 40 * u}
            stroke="#7DD3FC"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
        ))}
        {[0.33, 0.66].map((v) => (
          <line
            key={"hgv" + v}
            x1={218 - 112 * v}
            y1={212 + 80 * v}
            x2={558 - 112 * v}
            y2={252 + 80 * v}
            stroke="#7DD3FC"
            strokeOpacity="0.15"
            strokeWidth="1"
          />
        ))}
        {floorPulse > 0.05 && (
          <path
            d="M218 212 558 252 446 332 106 292Z"
            fill="none"
            stroke="#BAE6FD"
            strokeOpacity={0.5 * floorPulse}
            strokeWidth={6 * floorPulse}
          />
        )}
        <path d="M218 212 558 252" stroke="#2DD4BF" strokeWidth={3.4 + 1.4 * floorPulse} strokeLinecap="round" />
      </g>
      <path d="M490 244l11-9 14 2" fill="none" stroke={angleRx.pulse > 0.05 ? "#FDE68A" : "#5EEAD4"} strokeWidth={2 + 1.8 * angleRx.pulse} />
      <text
        x="510"
        y="225"
        fontSize="14"
        fontWeight="800"
        fill={angleRx.pulse > 0.05 ? "#FDE68A" : "#99F6E4"}
        transform={popTransform(522, 220, angleRx.scale)}
      >
        90°
      </text>
      <g transform={popTransform(116, 104, 1 + 0.04 * planesPulse)}>
        <DiagramLabel x={36} y={89} width={160} color="#FCA5A5" connector="196,104 208,104 218,112">
          π&apos; · Plano vertical
        </DiagramLabel>
      </g>
      <g opacity={floorReveal} transform={popTransform(491, 356, 1 + 0.04 * floorPulse)}>
        <DiagramLabel x={399} y={341} width={184} color="#7DD3FC" connector="485,304 501,329 501,341">
          π · Plano horizontal
        </DiagramLabel>
      </g>

      {/* Orthogonal projection prism edges connecting A -> foot on LT (424,256) -> A' */}
      {horizontal > 0 && vertical > 0 && (
        <g opacity={0.45 * Math.min(horizontal, vertical)}>
          <polyline points="333,282 424,256 424,140" fill="none" stroke="#2DD4BF" strokeWidth="1.4" strokeDasharray="3 4" />
          <circle cx="424" cy="256" r="3" fill="#2DD4BF" />
        </g>
      )}

      <g opacity={point} transform={popTransform(333, 166, pointRx.scale, 0, pointRx.wiggle * 4, -2 * pointRx.pulse)}>
        <circle cx="333" cy="166" r={17 + 4 * pointRx.pulse} fill="none" stroke="#FDE68A" strokeOpacity={0.47 + 0.35 * pointRx.pulse} strokeWidth={1.5 + 1.4 * pointRx.pulse} />
        <circle cx="333" cy="166" r={10 + 2.2 * pointRx.pulse} fill="url(#sphereGold)" stroke="#FFF7D6" strokeWidth="1.5" />
        <DiagramLabel x={245} y={131} width={59} color="#FDE68A" connector="304,146 314,146 321,155">(A)</DiagramLabel>
      </g>
      {horizontal > 0 && (
        <g>
          <ellipse cx="333" cy="285" rx={12 * horizontal} ry={5.5 * horizontal} fill="url(#floorShadowGrad)" opacity={0.6 * horizontal} />
          <path d={"M333 166V" + (166 + 116 * horizontal)} stroke={horizRx.pulse > 0.05 ? "#BAE6FD" : "#7DD3FC"} strokeWidth={2.5 + 1.8 * horizRx.pulse} strokeDasharray="5 4" />
          <circle cx="333" cy={166 + 116 * horizontal} r={6 + 2.5 * horizRx.pulse} fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1.5" />
          <circle cx="333" cy="282" r={9 + 13 * phLabel} fill="none" stroke="#7DD3FC" strokeOpacity={0.65 * (1 - phLabel)} />
          <g opacity={phLabel} transform={popTransform(134, 247, 1 + 0.045 * horizRx.pulse)}>
            <DiagramLabel x={61} y={232} width={147} color="#7DD3FC" connector="208,247 246,247 324,279">
              A · Horizontal
            </DiagramLabel>
          </g>
        </g>
      )}
      {vertical > 0 && (
        <g>
          <path d={"M333 166L" + (333 + 91 * vertical) + " " + (166 - 26 * vertical)} stroke={vertRx.pulse > 0.05 ? "#FEE2E2" : "#FCA5A5"} strokeWidth={2.5 + 1.8 * vertRx.pulse} strokeDasharray="5 4" />
          <circle cx={333 + 91 * vertical} cy={166 - 26 * vertical} r={6 + 2.5 * vertRx.pulse} fill="#F87171" stroke="#FEE2E2" strokeWidth="1.5" />
          <circle cx="424" cy="140" r={9 + 13 * pvLabel} fill="none" stroke="#FCA5A5" strokeOpacity={0.65 * (1 - pvLabel)} />
          <g opacity={pvLabel} transform={popTransform(609, 167, 1 + 0.045 * vertRx.pulse)}>
            <DiagramLabel x={536} y={152} width={147} color="#FCA5A5" connector="434,141 488,167 536,167">
              A&apos; · Vertical
            </DiagramLabel>
          </g>
        </g>
      )}
    </g>
  );
}
/**
 * Hand-choreographed 16:9 60fps Motion Graphics Renderer (viewBox 800 x 450)
 * Every single sceneId maps 1:1 to the EXACT spoken studio scene in `timings.json`!
 */
function MotionCanvas({
  episode,
  sceneId,
  localT,
  sceneSeconds,
  sceneLabel,
  sceneNumber,
  sceneCount,
}: {
  episode: VideoEpisode;
  sceneId: string;
  localT: number;
  sceneSeconds: number;
  sceneLabel: string;
  sceneNumber: number;
  sceneCount: number;
}) {
  const initialOpacity = sceneId === "intro" ? 0.65 : 0.16;
  const e = initialOpacity + (1 - initialOpacity) * easeOutCubic(sceneSeconds / 2.4);
  const eSlow = smoothStep(0.08, 0.78, localT);
  const cutFlash = sceneId === "intro" ? 0 : (1 - easeOutCubic(sceneSeconds / 0.34)) * 0.07;
  const beats = getNarrationBeats(episode.id, sceneId);

  // Helper for reusable animated Diedro profile + live Epura pair
  const renderDiedroFocus = (
    diedro: 1 | 2 | 3 | 4,
    showRuleFooter = false
  ) => {
    const labelReveal = smoothStep(0.45, 1.15, sceneSeconds);
    const activeTarget =
      diedro === 1 ? "first" : diedro === 2 ? "second" : diedro === 3 ? "third" : "fourth";
    const activeRx = beatReaction(beats, activeTarget, sceneSeconds, 0.9);
    const vertRx = beatReaction(beats, diedro === 4 ? "bothDown" : "vertical", sceneSeconds, 0.85);
    const horizRx = beatReaction(beats, diedro === 4 ? "bothDown" : "horizontal", sceneSeconds, 0.85);
    const pairRx = beatReaction(beats, "pair", sceneSeconds, 0.9);
    const evenRx = beatReaction(beats, "even", sceneSeconds, 0.9);
    const footerPulse = Math.max(pairRx.pulse, evenRx.pulse);
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
        ].map((q) => {
          const isThis = diedro === q.d;
          return (
            <g
              key={q.d}
              transform={isThis ? popTransform(q.x + q.w / 2, q.y + q.h / 2, 1 + 0.04 * activeRx.pulse) : undefined}
            >
              <rect
                x={q.x}
                y={q.y}
                width={q.w}
                height={q.h}
                rx="12"
                fill={q.col}
                fillOpacity={isThis ? 0.26 + 0.14 * activeRx.pulse : 0.04}
                stroke={isThis ? q.col : "rgba(255,255,255,0.12)"}
                strokeWidth={isThis ? 2.6 + 1.8 * activeRx.pulse : 1}
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
          );
        })}

        {/* Quadrant grid & 90° right-angle marker */}
        <path
          d={`M ${245 + (specs.dx > 0 ? 18 : -18)} 200 V ${200 + (specs.dy > 0 ? 18 : -18)} H 245`}
          fill="none"
          stroke="#5EEAD4"
          strokeOpacity="0.6"
          strokeWidth="1.6"
        />

        {/* π' and π axes */}
        <line x1="245" y1="62" x2="245" y2="338" stroke="#F87171" strokeWidth="3.5" />
        <line x1="88" y1="200" x2="402" y2="200" stroke="#38BDF8" strokeWidth="3.5" />
        <circle cx="245" cy="200" r="6" fill="url(#sphereTeal)" />

        {/* Projecting rays from (A) */}
        <line
          x1={245 + specs.dx}
          y1={200 + specs.dy}
          x2={245}
          y2={200 + specs.dy}
          stroke="#38BDF8"
          strokeDasharray="5 4"
          strokeWidth={2 + 1.4 * activeRx.pulse}
        />
        <line
          x1={245 + specs.dx}
          y1={200 + specs.dy}
          x2={245 + specs.dx}
          y2={200}
          stroke="#F87171"
          strokeDasharray="5 4"
          strokeWidth={2 + 1.4 * activeRx.pulse}
        />
        <g transform={popTransform(245 + specs.dx, 200 + specs.dy, activeRx.scale, 0, activeRx.wiggle * 3, -2 * activeRx.pulse)}>
          <circle
            cx={245 + specs.dx}
            cy={200 + specs.dy}
            r={11 + 2.5 * activeRx.pulse}
            fill="url(#sphereGold)"
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
        </g>
        <circle cx="245" cy={200 + specs.dy} r={6.5 + 2 * vertRx.pulse} fill="#F87171" />
        <circle cx={245 + specs.dx} cy="200" r={6.5 + 2 * horizRx.pulse} fill="#38BDF8" />

        {/* Right Card: Exact Épura 2D result */}
        <rect
          x="432"
          y="74"
          width="210"
          height="252"
          rx="18"
          fill="rgba(15,23,42,0.85)"
          stroke={specs.col}
          strokeWidth={2.2 + (diedro === 2 ? 1.8 * pairRx.pulse : 0)}
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
        <g transform={popTransform(505, 200 + specs.pvY * e, 1 + 0.06 * vertRx.pulse, 0, vertRx.wiggle * 3, 0)}>
          <circle cx="505" cy={200 + specs.pvY * e} r={8 + 2.5 * vertRx.pulse} fill="#F87171" />
          <text
            x="520"
            y={205 + specs.pvY * e}
            opacity={labelReveal}
            fontSize="12.5"
            fontWeight="800"
            fill="#FCA5A5"
            fontFamily="var(--font-mono), monospace"
          >
            {specs.pvTxt}
          </text>
        </g>
        <g transform={popTransform(505, 200 + specs.phY * e, 1 + 0.06 * horizRx.pulse, 0, horizRx.wiggle * 3, 0)}>
          <circle cx="505" cy={200 + specs.phY * e} r={8 + 2.5 * horizRx.pulse} fill="#38BDF8" />
          <text
            x="520"
            y={205 + specs.phY * e}
            opacity={labelReveal}
            fontSize="12.5"
            fontWeight="800"
            fill="#7DD3FC"
            fontFamily="var(--font-mono), monospace"
          >
            {specs.phTxt}
          </text>
        </g>

        <g transform={popTransform(371, 362, 1 + 0.04 * footerPulse)}>
          <rect
            x="100"
            y="344"
            width="542"
            height="36"
            rx="10"
            fill={showRuleFooter ? `rgba(245,158,11,${(0.22 + 0.16 * footerPulse).toFixed(2)})` : "rgba(30,41,59,0.85)"}
            stroke={specs.col}
            strokeWidth={1.5 + 1.8 * footerPulse}
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
            {specs.badge}
          </text>
        </g>
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 800 450"
      className="w-full h-full block select-none"
      preserveAspectRatio="xMidYMid meet"
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
        <clipPath id="sceneWindow">
          <rect x="-25" y="47" width="850" height="358" />
        </clipPath>
        <linearGradient id="verticalPlane" x2="1" y2="1">
          <stop stopColor="#F87171" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#C85E66" stopOpacity="0.18" />
          <stop offset="1" stopColor="#F87171" stopOpacity="0.09" />
        </linearGradient>
        <linearGradient id="horizontalPlane" x2="1" y2="1">
          <stop stopColor="#38BDF8" stopOpacity="0.32" />
          <stop offset="0.55" stopColor="#158CC1" stopOpacity="0.18" />
          <stop offset="1" stopColor="#38BDF8" stopOpacity="0.09" />
        </linearGradient>
        <radialGradient id="sphereGold" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="45%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
        <radialGradient id="sphereBlue" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </radialGradient>
        <radialGradient id="sphereRed" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FEE2E2" />
          <stop offset="50%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#991B1B" />
        </radialGradient>
        <radialGradient id="sphereTeal" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#CCFBF1" />
          <stop offset="50%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#0F766E" />
        </radialGradient>
        <radialGradient id="sphereViolet" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#EDE9FE" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#5B21B6" />
        </radialGradient>
        <linearGradient id="lightConeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.28" />
          <stop offset="65%" stopColor="#FDE68A" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id="floorShadowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#020617" stopOpacity="0.88" />
          <stop offset="70%" stopColor="#020617" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bisectorGoldGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.06" />
          <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="bisectorVioletGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.06" />
          <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="sceneFoot" x2="0" y2="1">
          <stop stopColor="#101C2D" />
          <stop offset="1" stopColor="#090F1B" />
        </linearGradient>
      </defs>

      <rect width="800" height="450" fill="url(#studioGlowV2)" />
      <rect width="800" height="450" fill="url(#studioGridV2)" />

      <g clipPath="url(#sceneWindow)" transform="translate(24 4) scale(.94)">
        {/* =================== EPISODE 01: MONGE =================== */}
        {episode.id === "ep01-monge" && (
          <>
            {sceneId === "intro" && (() => {
              const kbScale = 1.03 + localT * 0.08;
              const kbX = -localT * 18;
              const rx3d = beatReaction(beats, "3d", sceneSeconds, 0.85);
              const paperRx = beatReaction(beats, "paper", sceneSeconds, 0.9);
              const recRx = beatReaction(beats, "reconstruct", sceneSeconds, 0.95);
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
                    stroke={recRx.pulse > 0.05 ? "#5EEAD4" : "rgba(56,189,248,0.45)"}
                    strokeWidth={1.6 + 2.2 * recRx.pulse}
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
                  <text
                    x="108"
                    y="196"
                    fontSize="40"
                    fontWeight="800"
                    fill="#F8FAFC"
                    fontFamily="var(--font-display), serif"
                    transform={popTransform(280, 184, 1 + 0.045 * rx3d.pulse, rx3d.wiggle * 1.2)}
                  >
                    Do Espaço 3D para a
                  </text>
                  <text
                    x="108"
                    y="256"
                    fontSize="40"
                    fontWeight="800"
                    fill="#FDE68A"
                    fontFamily="var(--font-display), serif"
                    transform={popTransform(250, 244, 1 + 0.045 * paperRx.pulse, paperRx.wiggle * 1.4)}
                  >
                    Folha Plana 2D
                  </text>
                  <line
                    x1="108"
                    y1="282"
                    x2={108 + 410 * e}
                    y2="282"
                    stroke="#2DD4BF"
                    strokeWidth={4 + 2.2 * paperRx.pulse}
                    strokeLinecap="round"
                  />
                  <text
                    x="108"
                    y="314"
                    fontSize="14.5"
                    fill={recRx.pulse > 0.05 ? "#99F6E4" : "#E2E8F0"}
                    transform={popTransform(310, 310, 1 + 0.03 * recRx.pulse)}
                  >
                    Precisão exata para reconstruir qualquer ponto no espaço!
                  </text>
                </g>
              );
            })()}

            {sceneId === "ambiguous-shadow" && (() => {
              // Beat A (0..0.38): Unified 3D Isometric Glass Corner Room + animated vector fly
              // Beat B (0.34..1.0): Seamless dissolve of walls into analytical 1m vs 3m height ambiguity proof
              const cutProgress = smoothStep(0.32, 0.42, localT);
              const beatAOp = e * (1 - cutProgress);
              const beatBOp = e * cutProgress;
              const flyPhase = reactionPhase(beats.find((beat) => beat.target === "fly")?.at, sceneSeconds, 0.85);
              const flySwing = Math.sin(flyPhase * 4 * Math.PI) * Math.sin(flyPhase * Math.PI);
              const flyX = 445 + flySwing * 7;
              const flyY = 204 - Math.sin(flyPhase * Math.PI) * 5;
              const raysRx = beatReaction(beats, "rays", sceneSeconds, 0.9);
              const shadowRx = beatReaction(beats, "shadow", sceneSeconds, 0.9);
              const lowRx = beatReaction(beats, "lowFly", sceneSeconds, 0.85);
              const highRx = beatReaction(beats, "highFly", sceneSeconds, 0.85);
              const sameRx = beatReaction(beats, "sameShadow", sceneSeconds, 0.9);
              const lowX = 360 + lowRx.wiggle * 5;
              const lowY = 218 - 7 * lowRx.pulse;
              const highX = 360 + highRx.wiggle * 5;
              const highY = 112 - 9 * highRx.pulse;
              return (
                <g>
                  {/* BEAT A: 3D Isometric Glass Corner Room + Vector Fly */}
                  {beatAOp > 0.01 && (
                    <g opacity={beatAOp}>
                      {/* Isometric floor slab π with 3D bevel */}
                      <polygon points="305,282 445,336 445,346 305,292" fill="#0B2239" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="1" />
                      <polygon points="445,336 585,282 585,292 445,346" fill="#081A2C" stroke="#38BDF8" strokeOpacity="0.35" strokeWidth="1" />
                      <polygon points="445,232 585,282 445,336 305,282" fill="url(#horizontalPlane)" stroke="#38BDF8" strokeWidth="2" />
                      {[0.25, 0.5, 0.75].map((u) => (
                        <React.Fragment key={"rgrid" + u}>
                          <line x1={445 - 140 * u} y1={232 + 50 * u} x2={585 - 140 * u} y2={282 + 54 * u} stroke="#7DD3FC" strokeOpacity="0.16" strokeWidth="1" />
                          <line x1={445 + 140 * u} y1={232 + 50 * u} x2={305 + 140 * u} y2={282 + 54 * u} stroke="#7DD3FC" strokeOpacity="0.16" strokeWidth="1" />
                        </React.Fragment>
                      ))}

                      {/* Isometric room walls */}
                      <polygon points="305,282 445,232 445,92 305,142" fill="url(#verticalPlane)" stroke="#F87171" strokeOpacity="0.55" strokeWidth="1.6" />
                      <polygon points="445,232 585,282 585,142 445,92" fill="url(#horizontalPlane)" stroke="#64748B" strokeOpacity="0.45" strokeWidth="1.4" />
                      <line x1="445" y1="92" x2="445" y2="232" stroke="#2DD4BF" strokeOpacity="0.65" strokeWidth="1.8" />

                      {/* Overhead light cone + vertical light rays shimmer */}
                      <polygon points="424,78 466,78 482,292 408,292" fill="url(#lightConeGrad)" opacity={0.55 + 0.45 * raysRx.pulse} />
                      <ellipse cx="445" cy="78" rx="22" ry="6" fill="#FDE68A" fillOpacity={0.35 + 0.4 * raysRx.pulse} stroke="#FDE68A" strokeWidth="1.5" />
                      <g opacity={0.22 + 0.65 * raysRx.pulse}>
                        <line x1="429" y1="84" x2="429" y2="284" stroke="#FDE68A" strokeWidth={1.5 + 1.4 * raysRx.pulse} strokeDasharray="5 5" />
                        <line x1="445" y1="78" x2="445" y2="292" stroke="#FDE68A" strokeWidth={2 + 1.8 * raysRx.pulse} strokeDasharray="6 4" />
                        <line x1="461" y1="84" x2="461" y2="284" stroke="#FDE68A" strokeWidth={1.5 + 1.4 * raysRx.pulse} strokeDasharray="5 5" />
                      </g>

                      {/* Left editorial typography */}
                      <text x="58" y="138" fontSize="13" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
                        EXPERIÊNCIA MENTAL
                      </text>
                      <text x="58" y="182" fontSize="34" fontWeight="800" fill="#F8FAFC" fontFamily="var(--font-display), serif">
                        Imagine uma
                      </text>
                      <text
                        x="58"
                        y="222"
                        fontSize="34"
                        fontWeight="800"
                        fill="#FDE68A"
                        fontFamily="var(--font-display), serif"
                        transform={popTransform(170, 214, 1 + 0.045 * Math.sin(flyPhase * Math.PI))}
                      >
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

                      {/* Crisp vector golden fly + animated ring & callout */}
                      <ellipse cx="445" cy="294" rx="18" ry="8" fill="url(#floorShadowGrad)" opacity={0.85} />
                      <line x1={flyX} y1={flyY} x2="445" y2="292" stroke="#FDE68A" strokeWidth="1.8" strokeDasharray="4 4" />
                      <circle
                        cx={flyX}
                        cy={flyY}
                        r={17 + 6 * Math.sin(flyPhase * Math.PI)}
                        fill="none"
                        stroke="#FDE68A"
                        strokeWidth="2.4"
                        strokeDasharray="6 4"
                      />
                      {renderVectorFly(flyX, flyY, localT + flyPhase, 1 + 0.08 * Math.sin(flyPhase * Math.PI))}
                      <polyline
                        points={(flyX + 19) + "," + (flyY - 11) + " 532,144 644,144"}
                        fill="none"
                        stroke="#FDE68A"
                        strokeWidth="2.2"
                      />
                      <text x="536" y="136" fontSize="13.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                        Mosca (A) no 3D
                      </text>

                      {/* Callout pointing straight to the floor shadow */}
                      <polyline
                        points="445,292 528,292 638,292"
                        fill="none"
                        stroke={shadowRx.pulse > 0.05 ? "#BAE6FD" : "#38BDF8"}
                        strokeWidth={2.2 + 2.2 * shadowRx.pulse}
                        strokeDasharray="5 4"
                      />
                      <circle cx="445" cy="292" r={6 + 3.5 * shadowRx.pulse} fill="url(#sphereBlue)" />
                      <text
                        x="532"
                        y="284"
                        fontSize="13"
                        fontWeight="800"
                        fill="#7DD3FC"
                        fontFamily="var(--font-mono), monospace"
                        transform={popTransform(585, 280, 1 + 0.05 * shadowRx.pulse)}
                      >
                        Sombra no chão π
                      </text>
                    </g>
                  )}

                  {/* BEAT B: Analytical 1m vs 3m Height Ambiguity Proof */}
                  {beatBOp > 0.01 && (
                    <g opacity={beatBOp}>
                      {/* 3D isometric floor slab π with front bevel & perspective grid */}
                      <polygon points="110,300 480,350 480,360 110,310" fill="#0B2239" stroke="#38BDF8" strokeOpacity="0.45" strokeWidth="1" />
                      <polygon points="480,350 620,270 620,280 480,360" fill="#081A2C" stroke="#38BDF8" strokeOpacity="0.35" strokeWidth="1" />
                      <polygon
                        points="110,300 480,350 620,270 250,225"
                        fill="url(#horizontalPlane)"
                        stroke="#38BDF8"
                        strokeWidth="2.2"
                      />
                      {[0.25, 0.5, 0.75].map((u) => (
                        <React.Fragment key={"pgrid" + u}>
                          <line x1={110 + 370 * u} y1={300 + 50 * u} x2={250 + 370 * u} y2={225 + 45 * u} stroke="#7DD3FC" strokeOpacity="0.15" strokeWidth="1" />
                          <line x1={110 + 140 * u} y1={300 - 75 * u} x2={480 + 140 * u} y2={350 - 80 * u} stroke="#7DD3FC" strokeOpacity="0.15" strokeWidth="1" />
                        </React.Fragment>
                      ))}
                      {/* Volumetric light column & overhead ring */}
                      <polygon points="342,68 378,68 394,288 326,288" fill="url(#lightConeGrad)" opacity={0.7} />
                      <ellipse cx="360" cy="68" rx="18" ry="5" fill="#FDE68A" fillOpacity={0.35} stroke="#FDE68A" strokeWidth="1.2" />
                      <ellipse cx="360" cy="291" rx="22" ry="9" fill="url(#floorShadowGrad)" opacity={0.88} />

                      <DiagramLabel x={454} y={351} width={183} color="#7DD3FC" connector="527,324 547,340 547,351">π · Plano horizontal</DiagramLabel>
                      <line x1="360" y1="68" x2="360" y2="288" stroke="#FDE68A" strokeWidth="2.5" strokeDasharray="7 5" />
                      <polygon points="360,280 353,266 367,266" fill="#FDE68A" />
                      {/* Altitude gauge ticks */}
                      <line x1="342" y1="218" x2="360" y2="218" stroke="#FCA5A5" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="342" y1="112" x2="360" y2="112" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 3" />

                      <g transform={popTransform(430, 288, 1 + 0.05 * sameRx.pulse)}>
                        <circle cx="360" cy="288" r={11 + 4 * sameRx.pulse} fill="url(#sphereBlue)" stroke="#E0F2FE" strokeWidth="1.5" />
                        <text x="380" y="294" fontSize="16" fontWeight="800" fill={sameRx.pulse > 0.05 ? "#BAE6FD" : "#7DD3FC"} fontFamily="var(--font-mono), monospace">
                          Sombra A (idêntica!)
                        </text>
                      </g>
                      {renderVectorFly(lowX, lowY, localT + 0.2, 0.9 + 0.1 * lowRx.pulse)}
                      <circle cx={lowX} cy={lowY} r={10 + 3 * lowRx.pulse} fill="url(#sphereRed)" fillOpacity={0.45} stroke="#FCA5A5" strokeWidth="1.8" />
                      <text x={lowX + 22} y={lowY + 4} fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                        Mosca baixa (1m)
                      </text>
                      {renderVectorFly(highX, highY, localT + 0.7, 0.9 + 0.1 * highRx.pulse)}
                      <circle cx={highX} cy={highY} r={10 + 3 * highRx.pulse} fill="url(#sphereGold)" fillOpacity={0.45} stroke="#FDE68A" strokeWidth="1.8" />
                      <text x={highX + 22} y={highY + 4} fontSize="15" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                        Mosca alta (3m)
                      </text>
                      <g transform={popTransform(212, 91, 1 + 0.05 * sameRx.pulse, sameRx.wiggle * 2.2, sameRx.wiggle * 4, 0)}>
                        <rect x="86" y="68" width="246" height="46" rx="12" fill="rgba(239,68,68,0.24)" stroke="#F87171" strokeWidth={2 + 1.8 * sameRx.pulse} />
                        <polygon points="108,82 117,99 99,99" fill="none" stroke="#FDE68A" strokeWidth="1.8" strokeLinejoin="round" />
                        <line x1="108" y1="88" x2="108" y2="93" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
                        <circle cx="108" cy="96" r="1" fill="#FDE68A" />
                        <text x="219" y="96" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#FECACA" fontFamily="var(--font-mono), monospace">
                          1 PLANO PERDE A ALTURA!
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })()}

            {sceneId === "two-planes" && (() => {
              const planeMention = beats.find((beat) => beat.target === "planes")?.at;
              const [pStart, pEnd] = MONGE_BEATS.portrait;
              const cutProgress = planeMention === undefined
                ? smoothStep(pStart, pEnd, localT)
                : smoothStep(planeMention - 0.38, planeMention + 0.12, sceneSeconds);
              const portraitOp = e * (1 - cutProgress);
              const kbScale = 1.0 + localT * 0.08;
              const mongeRx = beatReaction(beats, "monge", sceneSeconds, 0.9);
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
                  {portraitOp > 0.01 && (
                    <g opacity={portraitOp}>
                      <line
                        x1="408"
                        y1="118"
                        x2={408 + 70 * e + 28 * mongeRx.pulse}
                        y2="118"
                        stroke="#F59E0B"
                        strokeWidth={4 + 2 * mongeRx.pulse}
                        strokeLinecap="round"
                      />
                      <text x="408" y="148" fontSize="13.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                        FRANÇA · 1746 – 1818
                      </text>
                      <text
                        x="408"
                        y="202"
                        fontSize="42"
                        fontWeight="800"
                        fill="#FFFFFF"
                        fontFamily="var(--font-display), serif"
                        transform={popTransform(520, 190, 1 + 0.04 * mongeRx.pulse)}
                      >
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

                  <MongeProjection time={localT} seconds={sceneSeconds} beats={beats} />
                </g>
              );
            })()}

            {sceneId === "lt-and-notation" && (() => {
              const ltRx = beatReaction(beats, "groundLine", sceneSeconds, 0.9);
              const cardTargets = ["spaceNotation", "horizontalNotation", "verticalNotation"] as const;
              return (
                <g opacity={e}>
                  {/* Bold Glowing Linha de Terra */}
                  <g transform={popTransform(360, 142, 1 + 0.03 * ltRx.pulse)}>
                    <line x1="100" y1="142" x2="620" y2="142" stroke={ltRx.pulse > 0.05 ? "#99F6E4" : "#2DD4BF"} strokeWidth={6 + 3.5 * ltRx.pulse} strokeLinecap="round" />
                    <line x1="104" y1="152" x2="142" y2="152" stroke="#2DD4BF" strokeWidth={3 + 1.5 * ltRx.pulse} />
                    <line x1="578" y1="152" x2="616" y2="152" stroke="#2DD4BF" strokeWidth={3 + 1.5 * ltRx.pulse} />
                    <text x="360" y="114" textAnchor="middle" fontSize="22" fontWeight="800" fill={ltRx.pulse > 0.05 ? "#99F6E4" : "#2DD4BF"} fontFamily="var(--font-mono), monospace">
                      LINHA DE TERRA (LT) — O &ldquo;RODAPÉ&rdquo;
                    </text>
                  </g>
                  {/* 3 Notation Cards */}
                  {[
                    { x: 92, col: "#FDE68A", sym: "(A)", name: "Ponto no Espaço", sub: "Sempre entre parênteses" },
                    { x: 274, col: "#38BDF8", sym: "A", name: "Proj. Horizontal", sub: "No chão π (sem linha)" },
                    { x: 456, col: "#F87171", sym: "A'", name: "Proj. Vertical", sub: "Na parede π' (com apóstrofo)" },
                  ].map((c, idx) => {
                    const rx = beatReaction(beats, cardTargets[idx], sceneSeconds, 0.85);
                    return (
                      <g
                        key={idx}
                        transform={popTransform(c.x + 83, 270, rx.scale, rx.wiggle * 2.2, 0, -4 * rx.pulse)}
                      >
                        <rect
                          x={c.x}
                          y="196"
                          width="166"
                          height="148"
                          rx="18"
                          fill={`rgba(15,23,42,${(0.85 + 0.1 * rx.pulse).toFixed(2)})`}
                          stroke={c.col}
                          strokeWidth={2.2 + 2.2 * rx.pulse}
                        />
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
                    );
                  })}
                </g>
              );
            })()}

            {sceneId === "takeaway" && (() => {
              const pairRx = beatReaction(beats, "pair", sceneSeconds, 0.9);
              const projARx = beatReaction(beats, "projA", sceneSeconds, 0.9);
              const projA2Rx = beatReaction(beats, "projA2", sceneSeconds, 0.9);
              const uniqRx = beatReaction(beats, "unique", sceneSeconds, 0.95);
              return (
                <g opacity={e}>
                  {/* Subtle drafting corner brackets */}
                  <path d="M 80 120 V 82 H 124 M 646 120 V 82 H 602 M 80 302 V 340 H 124 M 646 302 V 340 H 602" fill="none" stroke="#2DD4BF" strokeOpacity="0.45" strokeWidth="2.2" strokeLinecap="round" />
                  <g transform={popTransform(363, 211, 1 + 0.03 * pairRx.pulse)}>
                    <rect
                      x="98"
                      y="96"
                      width="530"
                      height="230"
                      rx="24"
                      fill="rgba(9,16,30,0.82)"
                      stroke={uniqRx.pulse > 0.05 ? "#5EEAD4" : "#2DD4BF"}
                      strokeWidth={2.4 + 2.4 * Math.max(pairRx.pulse, uniqRx.pulse)}
                    />
                    <circle cx="255" cy="143" r="9" fill="rgba(45,212,191,0.2)" stroke="#2DD4BF" strokeWidth="1.6" />
                    <path d="M 251 143 L 254 146 L 260 139" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="373" y="148" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                      RESUMO DO EPISÓDIO 01
                    </text>
                    <text
                      x="363"
                      y="210"
                      textAnchor="middle"
                      fontSize="32"
                      fontWeight="800"
                      fill="#FFFFFF"
                      fontFamily="var(--font-mono), monospace"
                      transform={popTransform(363, 202, 1 + 0.04 * pairRx.pulse)}
                    >
                      1 Ponto <tspan fill="#FDE68A">(A)</tspan> ⇄ 2 Projeções
                    </text>
                    <text
                      x="363"
                      y="256"
                      textAnchor="middle"
                      fontSize="22"
                      fontWeight="800"
                      fill="#CBD5E1"
                      fontFamily="var(--font-mono), monospace"
                      transform={popTransform(363, 250, 1 + 0.05 * Math.max(projARx.pulse, projA2Rx.pulse), (projARx.wiggle - projA2Rx.wiggle) * 1.4)}
                    >
                      <tspan fill={projARx.pulse > 0.05 ? "#BAE6FD" : "#38BDF8"}>A</tspan> (avanço/lado) + <tspan fill={projA2Rx.pulse > 0.05 ? "#FEE2E2" : "#F87171"}>A&apos;</tspan> (altura)
                    </text>
                    <text
                      x="363"
                      y="298"
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="700"
                      fill={uniqRx.pulse > 0.05 ? "#FDE68A" : "#99F6E4"}
                      transform={popTransform(363, 294, 1 + 0.045 * uniqRx.pulse)}
                    >
                      Posição 100% única e reconstruível no espaço 3D!
                    </text>
                  </g>
                </g>
              );
            })()}
          </>
        )}

        {/* =================== EPISODE 02: COORDENADAS =================== */}
        {episode.id === "ep02-coordenadas" && (
          <>
            {sceneId === "intro" && (() => {
              const c2 = beatReaction(beats, "coord2", sceneSeconds, 0.75);
              const c5 = beatReaction(beats, "coord5", sceneSeconds, 0.75);
              const c3 = beatReaction(beats, "coord3", sceneSeconds, 0.75);
              const cardTargets = ["abscissa", "afastamento", "cota"] as const;
              const formulaPulse = Math.max(c2.pulse, c5.pulse, c3.pulse);
              return (
                <g opacity={e}>
                  <text x="360" y="102" textAnchor="middle" fontSize="15" fontWeight="800" fill="#94A3B8" fontFamily="var(--font-mono), monospace">
                    CONVENÇÃO BRASILEIRA (UERJ) · ORDEM ALFABÉTICA
                  </text>
                  <text
                    x="360"
                    y="166"
                    textAnchor="middle"
                    fontSize="48"
                    fontWeight="800"
                    fill="#FFFFFF"
                    fontFamily="var(--font-mono), monospace"
                    transform={popTransform(360, 152, 1 + 0.045 * formulaPulse)}
                  >
                    (A)(<tspan fill={c2.pulse > 0.05 ? "#99F6E4" : "#2DD4BF"}>+2</tspan>; <tspan fill={c5.pulse > 0.05 ? "#BAE6FD" : "#38BDF8"}>+5</tspan>; <tspan fill={c3.pulse > 0.05 ? "#FEE2E2" : "#F87171"}>+3</tspan>)
                  </text>
                  {[
                    { x: 88, col: "#2DD4BF", k: "AB · 1º (X)", t: "Abscissa" },
                    { x: 274, col: "#38BDF8", k: "AF · 2º (Y)", t: "Afastamento" },
                    { x: 460, col: "#F87171", k: "CO · 3º (Z)", t: "Cota" },
                  ].map((b, i) => {
                    const rx = beatReaction(beats, cardTargets[i], sceneSeconds, 0.85);
                    return (
                      <g
                        key={i}
                        transform={popTransform(b.x + 86, 263, rx.scale, rx.wiggle * 2.1, 0, -4 * rx.pulse)}
                      >
                        <rect x={b.x} y="210" width="172" height="106" rx="16" fill="rgba(15,23,42,0.88)" stroke={b.col} strokeWidth={2.2 + 2.2 * rx.pulse} />
                        <text x={b.x + 86} y="250" textAnchor="middle" fontSize="15" fontWeight="800" fill={b.col} fontFamily="var(--font-mono), monospace">{b.k}</text>
                        <text x={b.x + 86} y="286" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FFFFFF">{b.t}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}

            {sceneId === "abscissa" && (() => {
              // Subtle B-roll reveal of UERJ drafting desk right as he mentions "lapiseira 0.5"
              const deskReveal = smoothStep(0.54, 0.72, localT);
              const originRx = beatReaction(beats, "origin", sceneSeconds, 0.85);
              const posRx = beatReaction(beats, "positive", sceneSeconds, 0.85);
              const negRx = beatReaction(beats, "negative", sceneSeconds, 0.85);
              const callRx = beatReaction(beats, "callLine", sceneSeconds, 0.9);
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
                  {[-3, -2, -1, 0, 1, 2, 3].map((v) => {
                    const rxPulse = v === 0 ? originRx.pulse : v === 2 ? posRx.pulse : v === -2 ? negRx.pulse : 0;
                    const cxTick = 360 + v * 68;
                    return (
                      <g key={v} transform={popTransform(cxTick, 224, 1 + 0.07 * rxPulse)}>
                        <line x1={cxTick} y1="205" x2={cxTick} y2="225" stroke={rxPulse > 0.05 ? "#FDE68A" : "#2DD4BF"} strokeWidth={(v === 0 ? 3.5 : 2) + 2 * rxPulse} />
                        <text
                          x={cxTick}
                          y="246"
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="800"
                          fill={v === 2 || rxPulse > 0.05 ? "#FDE68A" : "#94A3B8"}
                          fontFamily="var(--font-mono), monospace"
                        >
                          {v > 0 ? `+${v}` : v}
                        </text>
                      </g>
                    );
                  })}
                  {/* Negative direction shimmer */}
                  {negRx.pulse > 0.05 && (
                    <line x1="360" y1="215" x2={360 - 136 * negRx.pulse} y2="215" stroke="#38BDF8" strokeWidth={7 * negRx.pulse} strokeLinecap="round" opacity={0.85} />
                  )}
                  {/* Animated arrow from 0 to +2 */}
                  <line x1="360" y1="215" x2={360 + 136 * e} y2="215" stroke={posRx.pulse > 0.05 ? "#FDE68A" : "#F59E0B"} strokeWidth={8 + 3 * posRx.pulse} strokeLinecap="round" />
                  <circle cx="360" cy="215" r={4 + 5 * originRx.pulse} fill="#FDE68A" opacity={originRx.pulse} />
                  {/* Vertical Linha de Chamada */}
                  <g transform={popTransform(496, 215, 1 + 0.03 * callRx.pulse, 0, callRx.wiggle * 3, 0)}>
                    <line x1="496" y1={215 - 110 * e} x2="496" y2={215 + 115 * e} stroke={callRx.pulse > 0.05 ? "#FFF7D6" : "#FDE68A"} strokeWidth={2.5 + 2 * callRx.pulse} strokeDasharray="6 5" />
                    <text x="510" y="130" fontSize="14" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                      Linha de Chamada (0.5 HB)
                    </text>
                  </g>
                  <text x="360" y="346" textAnchor="middle" fontSize="14" fill="#CBD5E1">
                    Positivo (+) anda para a DIREITA · Negativo (−) anda para a ESQUERDA
                  </text>
                </g>
              );
            })()}

            {sceneId === "afastamento" && (() => {
              const wallRx = beatReaction(beats, "wall", sceneSeconds, 0.85);
              const plus5Rx = beatReaction(beats, "plus5", sceneSeconds, 0.9);
              const horizRx = beatReaction(beats, "horizontal", sceneSeconds, 0.9);
              const ax = 220 + 245 * e + plus5Rx.wiggle * 4;
              const ay = 172 - 3 * plus5Rx.pulse;
              const projY = 266;
              return (
                <g opacity={e}>
                  <text x="360" y="72" textAnchor="middle" fontSize="18" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">
                    2ª COORDENADA · AFASTAMENTO (Y = +5)
                  </text>
                  {/* Isometric 3D cutaway: π' wall + π gridded floor slab */}
                  <g transform={popTransform(216, 178, 1 + 0.03 * wallRx.pulse)}>
                    <polygon points="182,114 252,86 252,238 182,266" fill="url(#verticalPlane)" stroke="#F87171" strokeWidth={2.2 + 1.8 * wallRx.pulse} />
                    <line x1="217" y1="100" x2="217" y2="252" stroke="#FCA5A5" strokeOpacity="0.16" strokeWidth="1" />
                    <text x="168" y="192" textAnchor="end" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                      Parede π&apos;
                    </text>
                  </g>
                  <polygon points="182,266 520,286 520,295 182,275" fill="#0B2239" stroke="#38BDF8" strokeOpacity="0.4" strokeWidth="1" />
                  <polygon points="520,286 590,256 590,265 520,295" fill="#081A2C" stroke="#38BDF8" strokeOpacity="0.3" strokeWidth="1" />
                  <polygon points="182,266 252,238 590,256 520,286" fill="url(#horizontalPlane)" stroke="#38BDF8" strokeWidth="2.2" />
                  <line x1="182" y1="266" x2="252" y2="238" stroke="#2DD4BF" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M 218 232 L 218 252 L 242 254" fill="none" stroke="#5EEAD4" strokeWidth="1.8" />

                  {/* Caliper measurement arrow +5 */}
                  <line x1="220" y1="172" x2={ax} y2="172" stroke={plus5Rx.pulse > 0.05 ? "#BAE6FD" : "#38BDF8"} strokeWidth={5.5 + 2.5 * plus5Rx.pulse} strokeLinecap="round" />
                  <polygon points={`${ax - 10},166 ${ax},172 ${ax - 10},178`} fill="#BAE6FD" />
                  <ellipse cx={ax} cy={projY + 3} rx="14" ry="5.5" fill="url(#floorShadowGrad)" opacity={0.8} />
                  <line x1={ax} y1={ay} x2={ax} y2={projY} stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="2" />
                  <circle cx={ax} cy={ay} r={12 + 3 * plus5Rx.pulse} fill="url(#sphereGold)" stroke="#FFF7D6" strokeWidth="1.5" />
                  <text x={ax + 18} y={ay + 5} fontSize="17" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">(A)</text>

                  <g transform={popTransform(ax, projY, horizRx.scale)}>
                    <circle cx={ax} cy={projY} r={9 + 3.5 * horizRx.pulse} fill={horizRx.pulse > 0.05 ? "#BAE6FD" : "url(#sphereBlue)"} stroke="#E0F2FE" strokeWidth="1.4" />
                    <text x={ax} y="318" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                      Projeção A (afast. +5)
                    </text>
                  </g>
                  <text x="355" y="142" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                    ← Distância até π&apos; = +5 →
                  </text>
                </g>
              );
            })()}

            {sceneId === "cota" && (() => {
              const altRx = beatReaction(beats, "altitude", sceneSeconds, 0.85);
              const plus3Rx = beatReaction(beats, "plus3", sceneSeconds, 0.9);
              const vertRx = beatReaction(beats, "vertical", sceneSeconds, 0.9);
              const ptX = 410 + plus3Rx.wiggle * 4;
              const ptY = 278 - 144 * e - 3 * plus3Rx.pulse;
              return (
                <g opacity={e}>
                  <text x="360" y="72" textAnchor="middle" fontSize="18" fontWeight="800" fill="#F87171" fontFamily="var(--font-mono), monospace">
                    3ª COORDENADA · COTA (Z = +3)
                  </text>
                  {/* Isometric 3D cutaway: π gridded floor slab + π' wall */}
                  <polygon points="155,292 268,248 268,98 155,142" fill="url(#verticalPlane)" stroke="#F87171" strokeWidth="2.2" />
                  <polygon points="155,292 460,312 460,321 155,301" fill="#0B2239" stroke="#38BDF8" strokeOpacity="0.4" strokeWidth="1" />
                  <polygon points="460,312 572,268 572,277 460,321" fill="#081A2C" stroke="#38BDF8" strokeOpacity="0.3" strokeWidth="1" />
                  <polygon points="155,292 268,248 572,268 460,312" fill="url(#horizontalPlane)" stroke="#38BDF8" strokeWidth="2.2" />
                  <line x1="155" y1="292" x2="268" y2="248" stroke="#2DD4BF" strokeWidth="3.5" strokeLinecap="round" />
                  <text x="568" y="340" textAnchor="end" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                    Chão π (Cota = 0)
                  </text>
                  {/* Altitude vector rising +3 */}
                  <ellipse cx={ptX} cy="285" rx="14" ry="5.5" fill="url(#floorShadowGrad)" opacity={0.8} />
                  <line x1="410" y1="282" x2="410" y2={ptY} stroke={altRx.pulse > 0.05 ? "#FEE2E2" : "#F87171"} strokeWidth={5.5 + 2.5 * altRx.pulse} strokeLinecap="round" />
                  <polygon points={`404,${ptY + 12} 410,${ptY + 2} 416,${ptY + 12}`} fill="#FEE2E2" />
                  <circle cx={ptX} cy={ptY} r={12 + 3 * plus3Rx.pulse} fill="url(#sphereGold)" stroke="#FFF7D6" strokeWidth="1.5" />
                  <text x={ptX + 18} y={ptY + 5} fontSize="17" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">(A)</text>
                  <line x1={ptX} y1={ptY} x2="244" y2={ptY} stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="2" />
                  <g transform={popTransform(215, ptY, vertRx.scale)}>
                    <circle cx="244" cy={ptY} r={9 + 3.5 * vertRx.pulse} fill={vertRx.pulse > 0.05 ? "#FEE2E2" : "url(#sphereRed)"} stroke="#FEE2E2" strokeWidth="1.4" />
                    <text x="150" y={ptY + 5} textAnchor="end" fontSize="16" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                      A&apos; (cota +3)
                    </text>
                  </g>
                  <text
                    x="430"
                    y="218"
                    fontSize="16"
                    fontWeight="800"
                    fill="#FCA5A5"
                    fontFamily="var(--font-mono), monospace"
                    transform={popTransform(480, 212, 1 + 0.05 * altRx.pulse)}
                  >
                    ↑ ALTURA = +3
                  </text>
                </g>
              );
            })()}

            {sceneId === "trap-y" && (() => {
              const trapRx = beatReaction(beats, "trap", sceneSeconds, 0.9);
              const foldRx = beatReaction(beats, "fold", sceneSeconds, 0.85);
              const upRx = beatReaction(beats, "goUp", sceneSeconds, 0.85);
              const downRx = beatReaction(beats, "goDown", sceneSeconds, 0.85);
              const rUpRx = beatReaction(beats, "recapUp", sceneSeconds, 0.85);
              const rDownRx = beatReaction(beats, "recapDown", sceneSeconds, 0.85);
              const upPulse = Math.max(upRx.pulse, rUpRx.pulse);
              const downPulse = Math.max(downRx.pulse, rDownRx.pulse);
              return (
                <g opacity={e}>
                  <g transform={popTransform(360, 74, 1 + 0.045 * trapRx.pulse, trapRx.wiggle * 1.8, trapRx.wiggle * 4, 0)}>
                    <rect x="92" y="54" width="536" height="40" rx="11" fill={`rgba(245,158,11,${(0.22 + 0.16 * trapRx.pulse).toFixed(2)})`} stroke="#F59E0B" strokeWidth={1.6 + 2 * trapRx.pulse} />
                    <polygon points="116,66 124,81 108,81" fill="none" stroke="#FDE68A" strokeWidth="1.7" strokeLinejoin="round" />
                    <line x1="116" y1="71" x2="116" y2="75" stroke="#FDE68A" strokeWidth="1.7" strokeLinecap="round" />
                    <circle cx="116" cy="78" r="0.9" fill="#FDE68A" />
                    <text x="370" y="79" textAnchor="middle" fontSize="14.2" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">
                      A PEGADINHA #1: NA ÉPURA, +Y (AFASTAMENTO) DESCE!
                    </text>
                  </g>
                  <line x1="100" y1="215" x2="610" y2="215" stroke={foldRx.pulse > 0.05 ? "#99F6E4" : "#2DD4BF"} strokeWidth={4 + 2.8 * foldRx.pulse} />
                  <text x="618" y="220" fontSize="16" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">LT</text>
                  <line x1="360" y1="115" x2="360" y2="352" stroke="#94A3B8" strokeDasharray="6 5" strokeWidth="2" />
                  {/* Cota +3 UP */}
                  <g transform={popTransform(420, 215 - 88 * e, 1 + 0.055 * upPulse, 0, 0, -4 * upPulse)}>
                    <line x1="360" y1="215" x2="360" y2={215 - 88 * e} stroke="#F87171" strokeWidth={5.5 + 2.2 * upPulse} />
                    <circle cx="360" cy={215 - 88 * e} r={10 + 3 * upPulse} fill="#F87171" />
                    <text x="380" y={220 - 88 * e} fontSize="17" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                      A&apos; · Cota +3 SOBE ↑
                    </text>
                  </g>
                  {/* Afastamento +5 DOWN */}
                  <g transform={popTransform(420, 215 + 125 * e, 1 + 0.055 * downPulse, 0, downRx.wiggle * 3, 4 * downPulse)}>
                    <line x1="360" y1="215" x2="360" y2={215 + 125 * e} stroke="#38BDF8" strokeWidth={5.5 + 2.2 * downPulse} />
                    <circle cx="360" cy={215 + 125 * e} r={10 + 3 * downPulse} fill="#38BDF8" />
                    <text x="380" y={220 + 125 * e} fontSize="17" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                      A · Afast. +5 DESCE ↓
                    </text>
                  </g>
                </g>
              );
            })()}
          </>
        )}

        {/* =================== EPISODE 03: 4 DIEDROS =================== */}
        {episode.id === "ep03-diedros" && (
          <>
            {sceneId === "intro" && (() => {
              const fourRx = beatReaction(beats, "four", sceneSeconds, 0.85);
              const crossRx = beatReaction(beats, "cross", sceneSeconds, 0.85);
              const turnRx = beatReaction(beats, "turn", sceneSeconds, 0.9);
              return (
                <g opacity={e}>
                  <text x="360" y="66" textAnchor="middle" fontSize="17" fontWeight="800" fill="#F59E0B" fontFamily="var(--font-mono), monospace">
                    OS 4 DIEDROS · SENTIDO ANTI-HORÁRIO ↺
                  </text>
                  {/* 3D Isometric intersecting gridded planes π and π' */}
                  <polygon points="150,256 320,188 570,218 400,286" fill="url(#horizontalPlane)" stroke="#38BDF8" strokeOpacity="0.65" strokeWidth={1.8 + 1.4 * crossRx.pulse} />
                  <polygon points="318,92 402,102 402,354 318,344" fill="url(#verticalPlane)" stroke="#F87171" strokeOpacity="0.65" strokeWidth={1.8 + 1.4 * crossRx.pulse} />
                  <line x1="360" y1="92" x2="360" y2="368" stroke="#F87171" strokeWidth={3.6 + 2 * crossRx.pulse} />
                  <line x1="150" y1="230" x2="570" y2="230" stroke="#38BDF8" strokeWidth={3.6 + 2 * crossRx.pulse} />
                  <line x1="318" y1="222" x2="402" y2="238" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="360" cy="230" r={6 + 4 * crossRx.pulse} fill="url(#sphereTeal)" />
                  {/* Counter-clockwise orbital arc */}
                  <g transform={popTransform(360, 230, 1 + 0.04 * turnRx.pulse, -10 * turnRx.pulse)}>
                    <path
                      d="M 442 185 A 95 95 0 1 0 438 275"
                      fill="none"
                      stroke={turnRx.pulse > 0.05 ? "#FDE68A" : "#F59E0B"}
                      strokeWidth={3.5 + 2.5 * turnRx.pulse}
                      strokeDasharray="8 5"
                    />
                    <polygon points="432,179 448,185 438,195" fill="#FDE68A" />
                  </g>
                  <text x="476" y="152" fontSize="22" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace" transform={popTransform(499, 145, fourRx.scale)}>1º D</text>
                  <text x="195" y="152" fontSize="22" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace" transform={popTransform(218, 145, fourRx.scale)}>2º D</text>
                  <text x="195" y="316" fontSize="22" fontWeight="800" fill="#F87171" fontFamily="var(--font-mono), monospace" transform={popTransform(218, 309, fourRx.scale)}>3º D</text>
                  <text x="476" y="316" fontSize="22" fontWeight="800" fill="#F59E0B" fontFamily="var(--font-mono), monospace" transform={popTransform(499, 309, fourRx.scale)}>4º D</text>
                </g>
              );
            })()}
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
          const frontAt = beats.find((beat) => beat.target === "front")?.at;
          const backAt = beats.find((beat) => beat.target === "back")?.at;
          const landsAt = beats.find((beat) => beat.target === "lands")?.at;
          const frontPhase = reactionPhase(frontAt, sceneSeconds, 0.95);
          const backPhase = reactionPhase(backAt, sceneSeconds, 0.95);
          const landsPhase = reactionPhase(landsAt, sceneSeconds, 0.8);
          const frontPulse = Math.sin(frontPhase * Math.PI);
          const backPulse = Math.sin(backPhase * Math.PI);
          const landsPulse = Math.sin(landsPhase * Math.PI);
          const planesRx = beatReaction(beats, "planes", sceneSeconds, 0.85);
          const sqRx = beatReaction(beats, "square", sceneSeconds, 0.85);
          const mongeRx = beatReaction(beats, "monge", sceneSeconds, 0.9);
          const wallRx = beatReaction(beats, "wallFixed", sceneSeconds, 0.85);
          const hingeRx = beatReaction(beats, "hinge", sceneSeconds, 0.85);
          const turnRx = beatReaction(beats, "turn", sceneSeconds, 0.9);

          const foldDeg =
            sceneId === "intro" || sceneId === "hinge"
              ? 0
              : sceneId === "front-down"
                ? (frontAt !== undefined && landsAt !== undefined
                    ? smoothStep(Math.max(0, frontAt - 0.6), landsAt, sceneSeconds) * 90
                    : eSlow * 90)
                : sceneId === "back-up"
                  ? (backAt !== undefined && landsAt !== undefined
                      ? smoothStep(Math.max(0, backAt - 0.6), landsAt, sceneSeconds) * 90
                      : eSlow * 90)
                  : 90;
          const rad = (foldDeg * Math.PI) / 180;
          const frontX = cx + 96 * Math.cos(rad);
          const frontY = cy + 96 * Math.sin(rad);
          const backX = cx - 96 * Math.cos(rad);
          const backY = cy - 96 * Math.sin(rad);

          if (sceneId === "chamada") {
            const pARx = beatReaction(beats, "projA", sceneSeconds, 0.85);
            const pA2Rx = beatReaction(beats, "projA2", sceneSeconds, 0.85);
            const clRx = beatReaction(beats, "callLine", sceneSeconds, 0.95);
            return (
              <g opacity={e}>
                <text x="360" y="76" textAnchor="middle" fontSize="18" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                  ÉPURA PRONTA: A LINHA DE CHAMADA (90° À LT)
                </text>
                <line x1="110" y1="220" x2="610" y2="220" stroke="#2DD4BF" strokeWidth={4.5 + 1.5 * clRx.pulse} />
                <line x1="360" y1="118" x2="360" y2="338" stroke={clRx.pulse > 0.05 ? "#FFF7D6" : "#FDE68A"} strokeWidth={3.5 + 2.8 * clRx.pulse} strokeDasharray="7 5" />
                <rect x="360" y="200" width="20" height="20" fill={clRx.pulse > 0.05 ? "rgba(253,230,138,0.22)" : "none"} stroke="#FDE68A" strokeWidth={2 + 1.5 * clRx.pulse} />
                <g transform={popTransform(450, 128, pA2Rx.scale, pA2Rx.wiggle * 1.4)}>
                  <circle cx="360" cy="128" r={10 + 3 * pA2Rx.pulse} fill="#F87171" />
                  <text x="380" y="134" fontSize="18" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; (mesma abscissa X!)</text>
                </g>
                <g transform={popTransform(450, 326, pARx.scale, pARx.wiggle * 1.4)}>
                  <circle cx="360" cy="326" r={10 + 3 * pARx.pulse} fill="#38BDF8" />
                  <text x="380" y="332" fontSize="18" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (mesma abscissa X!)</text>
                </g>
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
                      <g
                        opacity={Math.min(0.85, (0.52 + 0.25 * mongeRx.pulse) * mongeReveal)}
                        transform={popTransform(100, 235, 1 + 0.04 * mongeRx.pulse)}
                      >
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
              {/* 3D axonometric glass planes extruding depth (+34, -18) behind π' and rotating π */}
              {(() => {
                const dx = 34;
                const dy = -18;
                const backEdgeX = cx - len * Math.cos(rad);
                const backEdgeY = cy - len * Math.sin(rad);
                const frontEdgeX = cx + len * Math.cos(rad);
                const frontEdgeY = cy + len * Math.sin(rad);
                return (
                  <g>
                    <polygon points={`${cx},88 ${cx + dx},${88 + dy} ${cx + dx},${362 + dy} ${cx},362`} fill="url(#verticalPlane)" stroke="#F87171" strokeOpacity="0.45" strokeWidth="1.4" />
                    <polygon points={`${backEdgeX},${backEdgeY} ${backEdgeX + dx},${backEdgeY + dy} ${cx + dx},${cy + dy} ${cx},${cy}`} fill="url(#horizontalPlane)" stroke="#2DD4BF" strokeOpacity="0.48" strokeWidth="1.4" />
                    <polygon points={`${cx},${cy} ${cx + dx},${cy + dy} ${frontEdgeX + dx},${frontEdgeY + dy} ${frontEdgeX},${frontEdgeY}`} fill="url(#horizontalPlane)" stroke="#38BDF8" strokeOpacity="0.52" strokeWidth="1.4" />
                    <line x1={cx} y1={cy} x2={cx + dx} y2={cy + dy} stroke="#2DD4BF" strokeWidth="3.2" strokeLinecap="round" />
                  </g>
                );
              })()}
              {/* Fixed PV */}
              <line x1={cx} y1="88" x2={cx} y2="362" stroke={Math.max(planesRx.pulse, wallRx.pulse) > 0.05 ? "#FEE2E2" : "#F87171"} strokeWidth={4.5 + 2.8 * Math.max(planesRx.pulse, wallRx.pulse)} />
              <text x={cx + 42} y="102" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">π&apos;S (Fixo)</text>
              <text x={cx + 12} y="356" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">π&apos;I (Fixo)</text>
              {sqRx.pulse > 0.05 && (
                <rect x={cx} y={cy - 22} width="22" height="22" fill="rgba(253,230,138,0.2)" stroke="#FDE68A" strokeWidth={2.2 * sqRx.pulse} opacity={sqRx.pulse} />
              )}
              {/* Folding PH (split into back and front halves so each half reacts directly to its spoken beat) */}
              <line
                x1={cx - len * Math.cos(rad)}
                y1={cy - len * Math.sin(rad)}
                x2={cx}
                y2={cy}
                stroke={Math.max(backPulse, planesRx.pulse, turnRx.pulse) > 0.05 ? "#99F6E4" : "#38BDF8"}
                strokeWidth={4.5 + 2.5 * Math.max(backPulse, planesRx.pulse, turnRx.pulse)}
              />
              <line
                x1={cx}
                y1={cy}
                x2={cx + len * Math.cos(rad)}
                y2={cy + len * Math.sin(rad)}
                stroke={Math.max(frontPulse, planesRx.pulse, turnRx.pulse) > 0.05 ? "#BAE6FD" : "#38BDF8"}
                strokeWidth={4.5 + 2.5 * Math.max(frontPulse, planesRx.pulse, turnRx.pulse)}
              />
              {/* Front compass arc + degree ticks */}
              <path
                d={`M ${cx + 96} ${cy} A 96 96 0 0 1 ${cx} ${cy + 96}`}
                fill="none"
                stroke={Math.max(frontPulse, turnRx.pulse) > 0.05 ? "#BAE6FD" : "#38BDF8"}
                strokeWidth={(sceneId === "front-down" ? 4 : 2) + 3 * Math.max(frontPulse, turnRx.pulse)}
                strokeDasharray="6 4"
              />
              {/* Back compass arc */}
              <path
                d={`M ${cx - 96} ${cy} A 96 96 0 0 1 ${cx} ${cy - 96}`}
                fill="none"
                stroke={Math.max(backPulse, turnRx.pulse) > 0.05 ? "#99F6E4" : "#2DD4BF"}
                strokeWidth={(sceneId === "back-up" ? 4 : 2) + 3 * Math.max(backPulse, turnRx.pulse)}
                strokeDasharray="6 4"
              />
              {/* LT Mechanical Hinge Collar */}
              <circle cx={cx} cy={cy} r={(sceneId === "hinge" ? 17 : 11) + 4 * Math.max(hingeRx.pulse, sqRx.pulse)} fill="none" stroke="#5EEAD4" strokeOpacity="0.45" strokeWidth="1.6" />
              <circle
                cx={cx}
                cy={cy}
                r={(sceneId === "hinge" ? 12 : 7.5) + 3.5 * Math.max(hingeRx.pulse, sqRx.pulse)}
                fill={hingeRx.pulse > 0.05 ? "url(#sphereGold)" : "url(#sphereTeal)"}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* Front point A (+Y) */}
              {frontPulse > 0.05 && (
                <circle
                  cx={frontX}
                  cy={frontY}
                  r={14 + 14 * frontPhase}
                  fill="none"
                  stroke="#BAE6FD"
                  strokeWidth="2.5"
                  strokeOpacity={0.75 * frontPulse}
                />
              )}
              <circle
                cx={frontX}
                cy={frontY}
                r={10 + 3.5 * frontPulse + 2.5 * (sceneId === "front-down" ? landsPulse : 0)}
                fill="url(#sphereBlue)"
                stroke="#E0F2FE"
                strokeWidth="1.4"
              />
              <text x={frontX + 14} y={frontY + 6} fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                πA (+Y desce!)
              </text>
              {/* Back point B (-Y) */}
              {backPulse > 0.05 && (
                <circle
                  cx={backX}
                  cy={backY}
                  r={14 + 14 * backPhase}
                  fill="none"
                  stroke="#99F6E4"
                  strokeWidth="2.5"
                  strokeOpacity={0.75 * backPulse}
                />
              )}
              <circle
                cx={backX}
                cy={backY}
                r={10 + 3.5 * backPulse + 2.5 * (sceneId === "back-up" ? landsPulse : 0)}
                fill="url(#sphereTeal)"
                stroke="#CCFBF1"
                strokeWidth="1.4"
              />
              <text x={backX - 14} y={backY - 8} textAnchor="end" fontSize="15" fontWeight="800" fill="#99F6E4" fontFamily="var(--font-mono), monospace">
                πP (−Y sobe!)
              </text>
            </g>
          );
        })()}

        {/* =================== EPISODE 05: BISSETORES =================== */}
        {episode.id === "ep05-bissetores" && (
          <g opacity={e}>
            {sceneId === "intro" && (() => {
              const zRx = beatReaction(beats, "zero", sceneSeconds, 0.85);
              const sRx = beatReaction(beats, "sameSize", sceneSeconds, 0.9);
              return (
                <>
                  <text x="360" y="130" textAnchor="middle" fontSize="16" fontWeight="800" fill="#A78BFA" fontFamily="var(--font-mono), monospace">
                    EPISÓDIO 05 · NÍVEL PROVA UERJ
                  </text>
                  <text
                    x="360"
                    y="196"
                    textAnchor="middle"
                    fontSize="38"
                    fontWeight="800"
                    fill="#FFFFFF"
                    fontFamily="var(--font-display), serif"
                    transform={popTransform(360, 186, 1 + 0.04 * sRx.pulse)}
                  >
                    Casos Especiais &amp; Bissetores
                  </text>
                  <text
                    x="360"
                    y="254"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="700"
                    fill={Math.max(zRx.pulse, sRx.pulse) > 0.05 ? "#FDE68A" : "#CBD5E1"}
                    fontFamily="var(--font-mono), monospace"
                    transform={popTransform(360, 248, 1 + 0.04 * zRx.pulse)}
                  >
                    Coordenada Zero · 1º Bissetor (β₁₃) · 2º Bissetor (β₂₄)
                  </text>
                </>
              );
            })()}

            {sceneId === "zero-cota" && (() => {
              const zCRx = beatReaction(beats, "zeroCota", sceneSeconds, 0.9);
              const zARx = beatReaction(beats, "zeroAfast", sceneSeconds, 0.9);
              const zBRx = beatReaction(beats, "zeroBoth", sceneSeconds, 0.9);
              return (
                <>
                  <text x="360" y="72" textAnchor="middle" fontSize="17" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">
                    QUANDO UMA COORDENADA VALE ZERO!
                  </text>
                  <line x1="100" y1="220" x2="620" y2="220" stroke="#2DD4BF" strokeWidth={4 + 1.8 * zBRx.pulse} />
                  {/* Left: Cota = 0 */}
                  <g transform={popTransform(210, 265, zCRx.scale, zCRx.wiggle * 1.6)}>
                    <line x1="210" y1="220" x2="210" y2="310" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="2" />
                    <circle cx="210" cy="220" r={9 + 3 * zCRx.pulse} fill="#F87171" />
                    <text x="210" y="196" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; na LT (Cota=0)</text>
                    <circle cx="210" cy="310" r={9 + 2.5 * zCRx.pulse} fill="#38BDF8" />
                    <text x="210" y="338" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (em π)</text>
                  </g>
                  {/* Center: LT */}
                  <g transform={popTransform(360, 228, zBRx.scale)}>
                    <circle cx="360" cy="220" r={11 + 4 * zBRx.pulse} fill="#FDE68A" />
                    <text x="360" y="256" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">Na LT (0;0)</text>
                  </g>
                  {/* Right: Afast = 0 */}
                  <g transform={popTransform(510, 175, zARx.scale, zARx.wiggle * 1.6)}>
                    <line x1="510" y1="130" x2="510" y2="220" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="2" />
                    <circle cx="510" cy="220" r={9 + 3 * zARx.pulse} fill="#38BDF8" />
                    <text x="510" y="250" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">C na LT (Afast.=0)</text>
                    <circle cx="510" cy="130" r={9 + 2.5 * zARx.pulse} fill="#F87171" />
                    <text x="510" y="110" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">C&apos; (em π&apos;)</text>
                  </g>
                </>
              );
            })()}

            {(sceneId === "bisectors-intro" || sceneId === "b13" || sceneId === "b24") && (() => {
              const biRx = beatReaction(beats, "bisector", sceneSeconds, 0.85);
              const angRx = beatReaction(beats, "angle", sceneSeconds, 0.85);
              const b13Rx = beatReaction(beats, "b13", sceneSeconds, 0.9);
              const symRx = beatReaction(beats, "symmetry", sceneSeconds, 0.95);
              const b24Rx = beatReaction(beats, "b24", sceneSeconds, 0.9);
              const coinRx = beatReaction(beats, "coincident", sceneSeconds, 0.95);
              const b13Glow = Math.max(biRx.pulse, b13Rx.pulse);
              const b24Glow = Math.max(biRx.pulse, b24Rx.pulse);
              return (
                <>
                  {/* 45° Bisector glass wedges & protractor arc */}
                  <polygon points="255,214 375,94 375,214" fill="url(#bisectorGoldGrad)" opacity={0.45 + 0.5 * b13Glow} />
                  <polygon points="255,214 135,334 135,214" fill="url(#bisectorGoldGrad)" opacity={0.45 + 0.5 * b13Glow} />
                  <polygon points="255,214 135,94 255,94" fill="url(#bisectorVioletGrad)" opacity={0.45 + 0.5 * b24Glow} />
                  <polygon points="255,214 375,334 255,334" fill="url(#bisectorVioletGrad)" opacity={0.45 + 0.5 * b24Glow} />
                  <path d="M 295 214 A 40 40 0 0 0 283 186" fill="none" stroke="#FDE68A" strokeWidth={1.8 + 1.5 * angRx.pulse} />
                  <line x1="255" y1="74" x2="255" y2="354" stroke="#F87171" strokeWidth="3" />
                  <line x1="115" y1="214" x2="395" y2="214" stroke="#38BDF8" strokeWidth="3" />
                  <line x1="135" y1="334" x2="375" y2="94" stroke={b13Glow > 0.05 ? "#FFF7D6" : "#F59E0B"} strokeWidth={(sceneId === "b13" ? 5.5 : 3) + 2.5 * b13Glow} strokeDasharray="8 5" />
                  <text x="375" y="76" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace" transform={popTransform(375, 72, 1 + 0.05 * Math.max(b13Glow, angRx.pulse))}>β₁₃ (45°)</text>
                  <line x1="135" y1="94" x2="375" y2="334" stroke={b24Glow > 0.05 ? "#F3E8FF" : "#A78BFA"} strokeWidth={(sceneId === "b24" ? 5.5 : 3) + 2.5 * b24Glow} strokeDasharray="8 5" />
                  <text x="108" y="90" fontSize="14" fontWeight="800" fill="#DDD6FE" fontFamily="var(--font-mono), monospace" transform={popTransform(138, 86, 1 + 0.05 * Math.max(b24Glow, angRx.pulse))}>β₂₄ (45°)</text>

                  <rect
                    x="445"
                    y="88"
                    width="195"
                    height="250"
                    rx="18"
                    fill="rgba(15,23,42,0.88)"
                    stroke={sceneId === "b24" ? "#A78BFA" : "#F59E0B"}
                    strokeWidth={2.4 + 2 * Math.max(angRx.pulse, symRx.pulse, coinRx.pulse)}
                  />
                  <line x1="468" y1="214" x2="618" y2="214" stroke="#2DD4BF" strokeWidth="3" />
                  {sceneId === "b13" && (
                    <g transform={popTransform(542, 214, 1 + 0.04 * symRx.pulse)}>
                      <text x="542" y="118" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">1º BISSETOR (+3; +3)</text>
                      <line x1="542" y1="146" x2="542" y2="282" stroke="#F59E0B" strokeDasharray="5 4" strokeWidth={2.5 + 1.8 * symRx.pulse} />
                      <circle cx="542" cy={146 - 4 * symRx.pulse} r={9 + 2.5 * symRx.pulse} fill="#F87171" />
                      <text x="560" y={151 - 4 * symRx.pulse} fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; (+3)</text>
                      <circle cx="542" cy={282 + 4 * symRx.pulse} r={9 + 2.5 * symRx.pulse} fill="#38BDF8" />
                      <text x="560" y={287 + 4 * symRx.pulse} fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (+3)</text>
                      <text x="542" y="320" textAnchor="middle" fontSize="12" fontWeight="800" fill={symRx.pulse > 0.05 ? "#FFF7D6" : "#FDE68A"}>SIMÉTRICOS NA LT!</text>
                    </g>
                  )}
                  {sceneId === "b24" && (
                    <g transform={popTransform(542, 180, 1 + 0.05 * coinRx.pulse, coinRx.wiggle * 1.5)}>
                      <text x="542" y="118" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#DDD6FE" fontFamily="var(--font-mono), monospace">2º BISSETOR (−3; +3)</text>
                      <line x1="542" y1="150" x2="542" y2="214" stroke="#A78BFA" strokeDasharray="5 4" strokeWidth={2.5 + 2 * coinRx.pulse} />
                      <circle cx="542" cy="150" r={15 + Math.sin(localT * 8) * 3 + 5 * coinRx.pulse} fill="rgba(167,139,250,0.28)" stroke="#A78BFA" strokeWidth={3 + 1.5 * coinRx.pulse} />
                      <circle cx="542" cy="150" r={8 + 2.5 * coinRx.pulse} fill="#F87171" />
                      <text x="542" y="264" textAnchor="middle" fontSize="19" fontWeight="800" fill={coinRx.pulse > 0.05 ? "#FFFFFF" : "#DDD6FE"} fontFamily="var(--font-mono), monospace">B ≡ B&apos; !</text>
                      <text x="542" y="294" textAnchor="middle" fontSize="12" fontWeight="700" fill="#E9D5FF">COINCIDENTES!</text>
                    </g>
                  )}
                  {sceneId === "bisectors-intro" && (
                    <g transform={popTransform(542, 214, 1 + 0.045 * Math.max(biRx.pulse, angRx.pulse))}>
                      <text x="542" y="160" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FDE68A" fontFamily="var(--font-mono), monospace">|Afast.| = |Cota|</text>
                      <text x="542" y="256" textAnchor="middle" fontSize="13" fill="#CBD5E1">Cortam os diedros</text>
                      <text x="542" y="278" textAnchor="middle" fontSize="13" fill="#CBD5E1">exatamente a 45°!</text>
                    </g>
                  )}
                </>
              );
            })()}
          </g>
        )}

        {/* =================== EPISODE 06: UERJ EX. 1 & EX. 2 =================== */}
        {episode.id === "ep06-uerj" && (
          <g opacity={e}>
            {sceneId === "intro" && (() => {
              const kbScale = 1.03 + localT * 0.07;
              const prRx = beatReaction(beats, "practice", sceneSeconds, 0.9);
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
                  <g transform={popTransform(357, 213, 1 + 0.035 * prRx.pulse)}>
                    <rect x="84" y="96" width="546" height="234" rx="24" fill="rgba(9,16,30,0.72)" stroke="#FB7185" strokeWidth={2 + 2.2 * prRx.pulse} />
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
                  </g>
                </>
              );
            })()}

            {(sceneId === "ex1-points" || sceneId === "ex1-line") && (() => {
              const pARx = beatReaction(beats, "pointA", sceneSeconds, 0.9);
              const pBRx = beatReaction(beats, "pointB", sceneSeconds, 0.9);
              const symRx = beatReaction(beats, "symmetric", sceneSeconds, 0.95);
              const orgRx = beatReaction(beats, "origin", sceneSeconds, 0.95);
              const crossRx = beatReaction(beats, "crossZero", sceneSeconds, 0.95);
              const originPulse = Math.max(orgRx.pulse, crossRx.pulse);
              const lineGlow = Math.max(symRx.pulse, crossRx.pulse);
              return (
                <>
                  <text x="350" y="68" textAnchor="middle" fontSize="15" fontWeight="800" fill="#FB7185" fontFamily="var(--font-mono), monospace">
                    EX. 1: (A)(+2; +5; +3) [1ºD] ⇄ (B)(−2; −5; −3) [3ºD]
                  </text>
                  <line x1="100" y1="218" x2="600" y2="218" stroke="#2DD4BF" strokeWidth={4 + 1.8 * originPulse} />
                  {sceneId === "ex1-line" && (
                    <>
                      <line x1="220" y1="288" x2={220 + 260 * e} y2={288 - 140 * e} stroke={crossRx.pulse > 0.05 ? "#FEE2E2" : "#F87171"} strokeWidth={4.5 + 2.5 * lineGlow} />
                      <line x1="220" y1="108" x2={220 + 260 * e} y2={108 + 220 * e} stroke={crossRx.pulse > 0.05 ? "#BAE6FD" : "#38BDF8"} strokeWidth={4.5 + 2.5 * lineGlow} />
                      <circle cx="350" cy="218" r={16 + Math.sin(localT * 8) * 4 + 6 * originPulse} fill="rgba(245,158,11,0.25)" stroke="#F59E0B" strokeWidth={3.2 + 2 * originPulse} />
                      <circle cx="350" cy="218" r={7 + 2.5 * originPulse} fill="#FDE68A" />
                      <g transform={popTransform(350, 363, 1 + 0.045 * originPulse)}>
                        <rect x="235" y="346" width="230" height="34" rx="10" fill={originPulse > 0.05 ? "#FBBF24" : "#F59E0B"} />
                        <text x="350" y="368" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1C1917" fontFamily="var(--font-mono), monospace">
                          r e r&apos; CRUZAM NA ORIGEM O!
                        </text>
                      </g>
                    </>
                  )}
                  <g transform={popTransform(480, 238, 1 + 0.045 * Math.max(pARx.pulse, symRx.pulse), pARx.wiggle * 1.5)}>
                    <line x1="480" y1="148" x2="480" y2="328" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1.8 + 1.4 * pARx.pulse} />
                    <circle cx="480" cy="148" r={8.5 + 3 * pARx.pulse} fill="#F87171" />
                    <text x="496" y="153" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">A&apos; (+3)</text>
                    <circle cx="480" cy="328" r={8.5 + 3 * pARx.pulse} fill="#38BDF8" />
                    <text x="496" y="333" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">A (+5)</text>
                  </g>
                  <g transform={popTransform(220, 198, 1 + 0.045 * Math.max(pBRx.pulse, symRx.pulse), pBRx.wiggle * 1.5)}>
                    <line x1="220" y1="108" x2="220" y2="288" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1.8 + 1.4 * pBRx.pulse} />
                    <circle cx="220" cy="288" r={8.5 + 3 * pBRx.pulse} fill="#F87171" />
                    <text x="202" y="293" textAnchor="end" fontSize="15" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">B&apos; (−3)</text>
                    <circle cx="220" cy="108" r={8.5 + 3 * pBRx.pulse} fill="#38BDF8" />
                    <text x="202" y="113" textAnchor="end" fontSize="15" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">B (−5)</text>
                  </g>
                </>
              );
            })()}

            {(sceneId === "ex2-points" || sceneId === "ex2-collinear") && (() => {
              const ptTargets = ["pointA", "pointB", "pointC"] as const;
              const noTriRx = beatReaction(beats, "noTriangle", sceneSeconds, 0.9);
              const colRx = beatReaction(beats, "collinear", sceneSeconds, 0.95);
              const parRx = beatReaction(beats, "parallel", sceneSeconds, 0.95);
              return (
                <>
                  <text x="355" y="68" textAnchor="middle" fontSize="15" fontWeight="800" fill="#34D399" fontFamily="var(--font-mono), monospace">
                    {sceneId === "ex2-points"
                      ? "EX. 2: (A)(1;2;3) · (B)(2;3;4) · (C)(3;4;5) — PASSO (+1;+1;+1)"
                      : "EX. 2 · PLOT TWIST: NÃO É TRIÂNGULO — SÃO COLINEARES!"}
                  </text>
                  <line x1="100" y1="224" x2="600" y2="224" stroke="#2DD4BF" strokeWidth="4" />
                  {sceneId === "ex2-collinear" && (
                    <>
                      <line x1="255" y1="176" x2="505" y2="92" stroke={colRx.pulse > 0.05 ? "#FEE2E2" : "#F87171"} strokeWidth={5 + 2.6 * colRx.pulse} />
                      <line x1="255" y1="272" x2="505" y2="356" stroke={colRx.pulse > 0.05 ? "#BAE6FD" : "#38BDF8"} strokeWidth={5 + 2.6 * colRx.pulse} />
                      <g transform={popTransform(188, 138, 1 + 0.045 * Math.max(noTriRx.pulse, parRx.pulse), noTriRx.wiggle * 2.2, noTriRx.wiggle * 4, 0)}>
                        <rect x="108" y="102" width="160" height="72" rx="14" fill="rgba(52,211,153,0.18)" stroke={parRx.pulse > 0.05 ? "#FDE68A" : "#34D399"} strokeWidth={2 + 2 * Math.max(noTriRx.pulse, parRx.pulse)} />
                        <path d="M 119 119 L 127 127 M 127 119 L 119 127" stroke="#FCA5A5" strokeWidth="2.2" strokeLinecap="round" />
                        <text x="195" y="128" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                          SEM TRIÂNGULO
                        </text>
                        <text x="188" y="154" textAnchor="middle" fontSize="12.5" fontWeight="800" fill={parRx.pulse > 0.05 ? "#FDE68A" : "#A7F3D0"} fontFamily="var(--font-mono), monospace">
                          RETA // AO β₁₃!
                        </text>
                      </g>
                    </>
                  )}
                  {[
                    { lbl: "A", x: 300, pvY: 162, phY: 286 },
                    { lbl: "B", x: 380, pvY: 135, phY: 313 },
                    { lbl: "C", x: 460, pvY: 108, phY: 340 },
                  ].map((pt, idx) => {
                    const ptRx = beatReaction(beats, ptTargets[idx], sceneSeconds, 0.85);
                    const grpPulse = Math.max(ptRx.pulse, colRx.pulse * 0.7);
                    return (
                      <g key={pt.lbl} transform={popTransform(pt.x, (pt.pvY + pt.phY) / 2, 1 + 0.05 * grpPulse, ptRx.wiggle * 1.4)}>
                        <line x1={pt.x} y1={pt.pvY} x2={pt.x} y2={pt.phY} stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={1.6 + 1.4 * grpPulse} />
                        <circle cx={pt.x} cy={pt.pvY} r={8.5 + 3 * grpPulse} fill="#F87171" />
                        <text x={pt.x - 16} y={pt.pvY - 8} fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">{pt.lbl}&apos;</text>
                        <circle cx={pt.x} cy={pt.phY} r={8.5 + 3 * grpPulse} fill="#38BDF8" />
                        <text x={pt.x - 16} y={pt.phY + 22} fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">{pt.lbl}</text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </g>
        )}

        {/* =================== EPISODE 07: Y-UP vs Z-UP =================== */}
        {episode.id === "ep07-yup-zup" && (
          <g opacity={e}>
            {sceneId === "intro" && (() => {
              const yRx = beatReaction(beats, "yUp", sceneSeconds, 0.9);
              const zRx = beatReaction(beats, "zUp", sceneSeconds, 0.9);
              return (
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
                  <g transform={popTransform(207, 214, yRx.scale, yRx.wiggle * 1.8)}>
                    <rect x="92" y="88" width="230" height="252" rx="20" fill="rgba(15,23,42,0.82)" stroke="#F87171" strokeWidth={2.2 + 2.4 * yRx.pulse} />
                    <text x="207" y="124" textAnchor="middle" fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">GAMES &amp; WEBGL (Y-UP)</text>
                    <text x="207" y="148" textAnchor="middle" fontSize="12" fill="#CBD5E1">Unity · Three.js · OpenGL</text>
                    <text x="207" y="198" textAnchor="middle" fontSize="32" fontWeight="800" fill="#F87171" fontFamily="var(--font-mono), monospace">Y = Altura ↑</text>
                    {/* Mini 3D isometric Y-Up axis gizmo + XZ floor */}
                    <polygon points="155,294 207,276 259,294 207,312" fill="rgba(248,113,113,0.16)" stroke="#FCA5A5" strokeOpacity="0.6" strokeWidth="1.2" />
                    <line x1="207" y1="294" x2="207" y2="236" stroke="#F87171" strokeWidth="3" strokeLinecap="round" />
                    <polygon points="203,242 207,233 211,242" fill="#F87171" />
                    <line x1="207" y1="294" x2="255" y2="294" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="207" y1="294" x2="178" y2="309" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="207" cy="294" r="3.5" fill="#FDE68A" />
                  </g>

                  <g transform={popTransform(358, 214, 1 + 0.08 * Math.max(yRx.pulse, zRx.pulse), 12 * Math.max(yRx.wiggle, zRx.wiggle))}>
                    <circle cx="358" cy="214" r="30" fill="url(#sphereGold)" stroke="#FFF7D6" strokeWidth="1.5" />
                    <text x="358" y="220" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1C1917" fontFamily="var(--font-mono), monospace">Y ⇄ Z</text>
                  </g>

                  <g transform={popTransform(509, 214, zRx.scale, zRx.wiggle * 1.8)}>
                    <rect x="394" y="88" width="230" height="252" rx="20" fill="rgba(15,23,42,0.82)" stroke="#38BDF8" strokeWidth={2.2 + 2.4 * zRx.pulse} />
                    <text x="509" y="124" textAnchor="middle" fontSize="14" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">UERJ / GD / CAD (Z-UP)</text>
                    <text x="509" y="148" textAnchor="middle" fontSize="12" fill="#CBD5E1">Monge · Blender · Engenharia</text>
                    <text x="509" y="198" textAnchor="middle" fontSize="32" fontWeight="800" fill="#38BDF8" fontFamily="var(--font-mono), monospace">Z = Cota ↑</text>
                    {/* Mini 3D isometric Z-Up axis gizmo + XY floor */}
                    <polygon points="457,294 509,276 561,294 509,312" fill="rgba(56,189,248,0.18)" stroke="#7DD3FC" strokeOpacity="0.6" strokeWidth="1.2" />
                    <line x1="509" y1="294" x2="509" y2="236" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
                    <polygon points="505,242 509,233 513,242" fill="#38BDF8" />
                    <line x1="509" y1="294" x2="557" y2="294" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="509" y1="294" x2="480" y2="309" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="509" cy="294" r="3.5" fill="#FDE68A" />
                  </g>
                </>
              );
            })()}

            {sceneId === "cg-origin" && (() => {
              const kbScale = 1.0 + localT * 0.08;
              const yRx = beatReaction(beats, "axisY", sceneSeconds, 0.9);
              const zRx = beatReaction(beats, "axisZ", sceneSeconds, 0.9);
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
                    <polygon points={`${120 + 160 * e},303 ${129 + 160 * e},308 ${120 + 160 * e},313`} fill="#2DD4BF" />
                    <text x="296" y="314" fontSize="14" fontWeight="800" fill="#2DD4BF" fontFamily="var(--font-mono), monospace">+X</text>
                    <g transform={popTransform(128, 240, 1 + 0.05 * yRx.pulse)}>
                      <line x1="128" y1="308" x2="128" y2={308 - 118 * e} stroke={yRx.pulse > 0.05 ? "#FEE2E2" : "#F87171"} strokeWidth={4.5 + 3 * yRx.pulse} strokeLinecap="round" />
                      <polygon points={`122,${316 - 118 * e} 128,${304 - 118 * e} 134,${316 - 118 * e}`} fill="#FCA5A5" />
                      <text x="128" y="176" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">+Y Altura</text>
                    </g>
                    <g transform={popTransform(105, 330, 1 + 0.05 * zRx.pulse)}>
                      <line x1="128" y1="308" x2={128 - 46 * e} y2={308 + 44 * e} stroke={zRx.pulse > 0.05 ? "#BAE6FD" : "#38BDF8"} strokeWidth={4.5 + 3 * zRx.pulse} strokeLinecap="round" />
                      <text x="64" y="370" fontSize="13" fontWeight="800" fill="#7DD3FC" fontFamily="var(--font-mono), monospace">
                        +Z Prof.
                      </text>
                    </g>
                    <circle cx="128" cy="308" r="5" fill="url(#sphereGold)" />
                  </g>
                  <path d="M 30 98 V 74 H 56 M 402 370 V 394 H 376" fill="none" stroke="#F87171" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />

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
                  <g transform={popTransform(537, 284, 1 + 0.04 * zRx.pulse)}>
                    <rect x="428" y="264" width="218" height="40" rx="12" fill="rgba(248,113,113,0.16)" stroke="#F87171" strokeWidth={1.5 + 1.8 * zRx.pulse} />
                    <text x="537" y="289" textAnchor="middle" fontSize="13" fontWeight="800" fill="#FECACA" fontFamily="var(--font-mono), monospace">
                      Unity · Three.js · OpenGL
                    </text>
                  </g>
                </>
              );
            })()}

            {sceneId === "gd-origin" && (() => {
              const kbScale = 1.0 + localT * 0.08;
              const flRx = beatReaction(beats, "floorXY", sceneSeconds, 0.9);
              const zRx = beatReaction(beats, "axisZ", sceneSeconds, 0.9);
              const cotaRx = beatReaction(beats, "cota", sceneSeconds, 0.9);
              const zGlow = Math.max(zRx.pulse, cotaRx.pulse);
              return (
                <>
                  {/* Integrated Documentary Zoom on the Z-Up Drafting Table & Rising Building half! */}
                  <g clipPath="url(#gdTableClip)">
                    <g
                      transform={`translate(215 235) scale(${(kbScale + 0.03 * flRx.pulse).toFixed(4)}) translate(-215 -235)`}
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
                    <g transform={popTransform(135, 220, 1 + 0.05 * zGlow)}>
                      <line x1="112" y1="305" x2="112" y2={305 - 175 * e} stroke={zGlow > 0.05 ? "#FEE2E2" : "#F87171"} strokeWidth={5.5 + 3 * zGlow} strokeLinecap="round" />
                      <polygon points={`112,${295 - 175 * e} 102,${312 - 175 * e} 122,${312 - 175 * e}`} fill="#F87171" />
                      <circle cx="112" cy="305" r="5" fill="url(#sphereGold)" />
                      <text x="128" y={310 - 175 * e} fontSize="14" fontWeight="800" fill="#FCA5A5" fontFamily="var(--font-mono), monospace">
                        +Z COTA ↑
                      </text>
                    </g>
                  </g>
                  <path d="M 56 80 V 56 H 82 M 396 380 V 404 H 370" fill="none" stroke="#38BDF8" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />

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
                  <g transform={popTransform(539, 284, 1 + 0.045 * zGlow)}>
                    <rect x="428" y="264" width="222" height="40" rx="12" fill="rgba(56,189,248,0.16)" stroke="#38BDF8" strokeWidth={1.5 + 2 * zGlow} />
                    <text x="539" y="289" textAnchor="middle" fontSize="13" fontWeight="800" fill="#BAE6FD" fontFamily="var(--font-mono), monospace">
                      Monge · Blender · AutoCAD
                    </text>
                  </g>
                </>
              );
            })()}

            {sceneId === "translator" && (() => {
              const swRx = beatReaction(beats, "swap", sceneSeconds, 0.9);
              const resRx = beatReaction(beats, "result", sceneSeconds, 0.95);
              return (
                <>
                  <text x="360" y="88" textAnchor="middle" fontSize="16" fontWeight="800" fill="#34D399" fontFamily="var(--font-mono), monospace">
                    TRADUÇÃO EM 1 SEGUNDO: MANTENHA X E TROQUE Y ⇄ Z!
                  </text>
                  <g transform={popTransform(360, 158, 1 + 0.035 * swRx.pulse)}>
                    <rect x="115" y="122" width="490" height="72" rx="16" fill="rgba(56,189,248,0.14)" stroke="#38BDF8" strokeWidth={2 + 1.8 * swRx.pulse} />
                    <text x="360" y="166" textAnchor="middle" fontSize="26" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">
                      GD (UERJ): (A)(<tspan fill="#2DD4BF">+2</tspan>; <tspan fill="#38BDF8">+5</tspan>; <tspan fill="#F87171">+3</tspan>)
                    </text>
                  </g>

                  <text
                    x="360"
                    y="232"
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="800"
                    fill="#FDE68A"
                    fontFamily="var(--font-mono), monospace"
                    transform={popTransform(360, 224, swRx.scale, swRx.wiggle * 2.2)}
                  >
                    ↓  5 e 3 trocam de lugar!  ↓
                  </text>

                  <g transform={popTransform(360, 292, resRx.scale)}>
                    <rect x="115" y="256" width="490" height="72" rx="16" fill={`rgba(52,211,153,${(0.16 + 0.14 * resRx.pulse).toFixed(2)})`} stroke={resRx.pulse > 0.05 ? "#6EE7B7" : "#34D399"} strokeWidth={2 + 2.4 * resRx.pulse} />
                    <text x="360" y="300" textAnchor="middle" fontSize="25" fontWeight="800" fill="#FFFFFF" fontFamily="var(--font-mono), monospace">
                      Three.js: Vector3(<tspan fill="#2DD4BF">+2</tspan>, <tspan fill="#F87171">+3</tspan>, <tspan fill="#38BDF8">+5</tspan>)
                    </text>
                  </g>
                </>
              );
            })()}
          </g>
        )}
        {beats.map((beat, index) => {
          const phase = reactionPhase(beat.at, sceneSeconds);
          if (!beat.mark || phase <= 0 || phase >= 1) return null;
          const [x, y] = beat.mark;
          return <BeatEffect key={index} fx={beat.fx} x={x} y={y} phase={phase} accent={episode.themeAccent} />;
        })}
      </g>

      {cutFlash > 0.005 && (
        <rect x="0" y="48" width="800" height="337" fill="#38BDF8" opacity={cutFlash} pointerEvents="none" />
      )}

      <rect width="800" height="48" fill="#0B1422" />
      <path d="M30 47H770" stroke="#263B53" />
      <path d={"M30 47H" + (30 + 740 * Math.max(0.06, localT))} stroke={episode.themeAccent} strokeWidth="2.5" strokeLinecap="round" />
      <text x="30" y="31" fontSize="13" fontWeight="800" fill={episode.themeAccent} fontFamily="var(--font-mono), monospace">{episode.number}</text>
      <text x="104" y="31" fontSize="14" fontWeight="700" fill="#E2E8F0" fontFamily="var(--font-body), sans-serif">{sceneLabel}</text>
      {Array.from({ length: sceneCount }, (_, index) => (
        <rect key={index} x={700 + index * 14} y="25" width="9" height="3" rx="1.5" fill={index === sceneNumber ? episode.themeAccent : "#34465E"} />
      ))}
      <rect y="385" width="800" height="65" fill="url(#sceneFoot)" />
      <path d="M30 385H770" stroke="#263B53" />
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
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [expandedFullscreen, setExpandedFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrubPreview, setScrubPreview] = useState<{
    ratio: number;
    time: number;
    sceneIndex: number;
    label: string;
    isTouch: boolean;
  } | null>(null);
  const isFullscreen = nativeFullscreen || expandedFullscreen;

  // Netflix-style Up-Next countdown at the end of each episode
  const [upNextVisible, setUpNextVisible] = useState(false);
  const [upNextProgress, setUpNextProgress] = useState(0); // 0 -> 1 over 6 seconds
  const idleCursor = isFullscreen && isPlaying && !controlsVisible && !upNextVisible;

  // Smoothed real-time lip-sync state (ZERO jitter!)
  const [mouth, setMouth] = useState<MouthFrame>("closed");
  const [energy, setEnergy] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const controlTimer = useRef<number | undefined>(undefined);
  const controlsHoverRef = useRef(false);
  const scrubbingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mixRef = useRef<GainNode | null>(null);
  const audioStep = useRef<number | null>(null);
  const videoLevel = isMuted ? 0 : volume;
  const videoLevelRef = useRef(videoLevel);
  videoLevelRef.current = videoLevel;
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
  const cues = useMemo(() => getVideoSoundCues(baseEp.id, scenes), [baseEp.id, scenes]);
  const cuesRef = useRef(cues);
  cuesRef.current = cues;
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
  const sceneSeconds = Math.max(0, currentTime - activeScene.startSec);
  const localT = Math.min(1, sceneSeconds / sceneSpan);

  const ensureAudioAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioCtxRef.current) return;
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
      const mix = ctx.createGain();
      mix.gain.value = videoLevelRef.current;
      analyser.connect(mix).connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      mixRef.current = mix;
      audio.volume = 1;
    } catch {
      // graceful fallback
    }
  }, []);

  const playSound = useCallback((sound: VideoSound) => {
    const ctx = audioCtxRef.current;
    const mix = mixRef.current;
    if (ctx && mix && videoLevelRef.current > 0 && sfx.isEnabled()) {
      playVideoSound(ctx, mix, sound);
    }
  }, []);

  useEffect(() => () => {
    void audioCtxRef.current?.close().catch(() => {});
  }, []);
  // 60fps Sync Loop with EMA smoothing + 85ms syllable hold (silky smooth lip-sync!)
  useEffect(() => {
    let rafId = 0;
    const dataBuf = new Uint8Array(128);

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const audio = audioRef.current;
      if (!audio) return;

      const time = audio.currentTime;
      setCurrentTime(time);
      const previous = audioStep.current;
      audioStep.current = audio.paused || audio.seeking ? null : time;
      if (audioStep.current !== null && previous !== null && time > previous && time - previous < 0.24) {
        for (const cue of cuesRef.current) {
          if (cue.at > previous && cue.at <= time) playSound(cue.sound);
        }
      }
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
  }, [playSound]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, epIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    const ctx = audioCtxRef.current;
    const mix = mixRef.current;
    if (ctx && mix) {
      mix.gain.setTargetAtTime(videoLevel, ctx.currentTime, 0.012);
    } else if (audio) {
      audio.volume = videoLevel;
    }
    if (audio) audio.muted = isMuted;
  }, [videoLevel, isMuted]);

  const startPlayback = useCallback((sound?: VideoSound) => {
    const audio = audioRef.current;
    if (!audio) return;
    ensureAudioAnalyser();
    const context = audioCtxRef.current;
    if (context?.state === "suspended") {
      void context.resume().then(() => {
        if (sound) playSound(sound);
      }).catch(() => {});
    } else if (sound) {
      playSound(sound);
    }
    void audio.play().catch(() => {});
  }, [ensureAudioAnalyser, playSound]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setUpNextVisible(false);
    if (audio.paused) {
      if (audio.ended) audio.currentTime = 0;
      startPlayback("click");
    } else {
      audio.pause();
      playSound("click");
    }
  }, [startPlayback, playSound]);

  const selectEpisode = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextIndex = (index + VIDEO_EPISODES.length) % VIDEO_EPISODES.length;
    const next = VIDEO_EPISODES[nextIndex];
    const source = timings[next.id]?.audioSrc ?? next.audioSrc;
    audio.pause();
    audioStep.current = null;
    setUpNextVisible(false);
    setUpNextProgress(0);
    setEpIndex(nextIndex);
    setCurrentTime(0);
    if (audio.getAttribute("src") === source) {
      audio.currentTime = 0;
    } else {
      setDuration(null);
      audio.src = source;
    }
    audio.playbackRate = playbackRate;
    startPlayback("click");
  }, [timings, playbackRate, startPlayback]);
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
        selectEpisode(epIndex + 1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [upNextVisible, epIndex, selectEpisode]);

  const seekToSeconds = useCallback((sec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    setUpNextVisible(false);
    const maxD = Number.isFinite(audio.duration) ? audio.duration : effectiveDuration;
    audioStep.current = null;
    audio.currentTime = Math.max(0, Math.min(maxD, sec));
    setCurrentTime(audio.currentTime);
  }, [effectiveDuration]);

  const revealControls = useCallback((keepOpen = false) => {
    setControlsVisible(true);
    window.clearTimeout(controlTimer.current);
    if (!keepOpen && !controlsHoverRef.current && !scrubbingRef.current) {
      controlTimer.current = window.setTimeout(() => setControlsVisible(false), 2600);
    }
  }, []);

  const updateScrubPreview = useCallback((clientX: number, isTouch: boolean) => {
    const el = timelineRef.current;
    if (!el || effectiveDuration <= 0) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = ratio * effectiveDuration;
    let idx = scenes.findIndex((s) => time >= s.startSec && time < s.endSec);
    if (idx === -1) idx = time >= (scenes[scenes.length - 1]?.startSec ?? 0) ? scenes.length - 1 : 0;
    const scene = scenes[idx] ?? scenes[0];
    setScrubPreview({
      ratio,
      time,
      sceneIndex: idx,
      label: scene.label,
      isTouch,
    });
  }, [effectiveDuration, scenes]);

  useEffect(() => {
    if (!isFullscreen || upNextVisible) {
      controlsHoverRef.current = false;
      scrubbingRef.current = false;
      lastPointerRef.current = null;
      return () => window.clearTimeout(controlTimer.current);
    }
    revealControls();
    const handlePointerMove = (event: MouseEvent | PointerEvent) => {
      const prev = lastPointerRef.current;
      if (prev && Math.abs(event.clientX - prev.x) <= 1 && Math.abs(event.clientY - prev.y) <= 1) {
        return;
      }
      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      revealControls();
    };
    const handleTouch = () => revealControls();
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchstart", handleTouch, { passive: true });
    return () => {
      window.clearTimeout(controlTimer.current);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchstart", handleTouch);
    };
  }, [isFullscreen, isPlaying, upNextVisible, revealControls]);

  useEffect(() => {
    const syncFullscreen = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setNativeFullscreen(
        document.fullscreenElement === stageRef.current ||
        doc.webkitFullscreenElement === stageRef.current,
      );
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!expandedFullscreen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
    };
  }, [expandedFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    const player = stageRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    }) | null;
    if (!player) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    if (expandedFullscreen) {
      setExpandedFullscreen(false);
    } else if (document.fullscreenElement === player || doc.webkitFullscreenElement === player) {
      if (document.exitFullscreen) await document.exitFullscreen().catch(() => {});
      else if (doc.webkitExitFullscreen) await Promise.resolve(doc.webkitExitFullscreen()).catch(() => {});
    } else {
      try {
        if (player.requestFullscreen) {
          await player.requestFullscreen();
        } else if (player.webkitRequestFullscreen) {
          await Promise.resolve(player.webkitRequestFullscreen());
        } else {
          setExpandedFullscreen(true);
        }
      } catch {
        setExpandedFullscreen(true);
      }
    }
  }, [expandedFullscreen]);
  // Pro Video Keyboard Shortcuts: Space (play/pause), ←/→ (±5s), M (mute), F (fullscreen)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedFullscreen) {
        e.preventDefault();
        setExpandedFullscreen(false);
        return;
      }
      if (isFullscreen && e.key === "Tab") revealControls();
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
        if (isFullscreen) revealControls();
        e.preventDefault();
        if (!e.repeat) void togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isFullscreen) revealControls();
        seekToSeconds((audioRef.current?.currentTime ?? 0) - 5);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isFullscreen) revealControls();
        seekToSeconds((audioRef.current?.currentTime ?? 0) + 5);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (isFullscreen) revealControls();
        setIsMuted((m) => !m);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (!e.repeat) void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedFullscreen, isFullscreen, revealControls, seekToSeconds, toggleFullscreen, togglePlay]);

  const nextEpisode =
    epIndex < VIDEO_EPISODES.length - 1 ? VIDEO_EPISODES[epIndex + 1] : null;
  const nextEpDur = nextEpisode ? timings[nextEpisode.id]?.duration : undefined;
  const finishedSeason = VIDEO_EPISODES.every((episode) => watchedEpisodes.includes(episode.id));
  const activeMoment = resolveVideoLabMoment(
    baseEp.id,
    activeScene.id,
    sceneSeconds,
    baseEp.labPreset
  );
  const episodeExamples = useMemo(
    () => getEpisodePointExamples(baseEp.id),
    [baseEp.id]
  );

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
      {/* LEFT: 16:9 CINEMATIC MOTION VIDEO PLAYER */}
      <div className="space-y-3">
        <div
          ref={stageRef}
          className={styles.player}
          data-video-player
          data-fullscreen={isFullscreen || undefined}
          data-expanded={expandedFullscreen || undefined}
          data-idle-cursor={idleCursor ? "true" : undefined}
          onTouchStart={isFullscreen ? () => revealControls() : undefined}
          onClick={isFullscreen ? (event) => {
            if (event.target === event.currentTarget) revealControls();
          } : undefined}
        >
          {/* Episode changes reuse the same audio element and Web Audio graph. */}
          <audio
            ref={audioRef}
            src={VIDEO_EPISODES[0].audioSrc}
            preload="metadata"
            playsInline
            onEnded={() => {
              setIsPlaying(false);
              setControlsVisible(false);
              setUpNextVisible(true);
              onEpisodeWatched?.(baseEp.id);
              playSound("resolve");
            }}
            onPause={() => setIsPlaying(false)}
            onSeeking={() => { audioStep.current = null; }}
            onPlay={() => {
              setIsPlaying(true);
              setUpNextVisible(false);
            }}
          />

          <div className={styles.frame} data-video-frame>
            <MotionCanvas
              episode={baseEp}
              sceneId={activeScene.id}
              localT={localT}
              sceneSeconds={sceneSeconds}
              sceneLabel={activeScene.label}
              sceneNumber={sceneIndex}
              sceneCount={scenes.length}
            />
            <div className={styles.presenter} data-video-presenter>
              <LipSyncMascot mouth={mouth} energy={energy} isPlaying={isPlaying} />
            </div>
            {showCaptions && (
              <div className={styles.captionBand}>
                <p className={styles.caption}>{activeScene.subtitle}</p>
              </div>
            )}
            {!upNextVisible && (
              <button
                type="button"
                aria-label={isFullscreen && isPlaying ? "Mostrar controles do vídeo" : isPlaying ? "Pausar no vídeo" : "Reproduzir vídeo"}
                onClick={() => {
                  if (isFullscreen && isPlaying) revealControls();
                  else togglePlay();
                }}
                className={`absolute inset-0 ${idleCursor ? "cursor-none" : "cursor-pointer"} focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-400`}
              >
                {!isPlaying && (
                  <span className={styles.playBadge}>
                    <Play className="fill-current" aria-hidden="true" />
                  </span>
                )}
              </button>
            )}
            {/* NETFLIX-STYLE "PRÓXIMO EPISÓDIO" AUTO-FILL OVERLAY */}
            {upNextVisible && (
              <div
                onClick={(event) => {
                  event.stopPropagation();
                  if (isFullscreen && event.target === event.currentTarget) revealControls();
                }}
                className="absolute inset-0 z-20 bg-slate-950/82 backdrop-blur-md flex items-center justify-center p-4 animate-fade-up"
              >
                {nextEpisode ? (
                  <div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/95 p-4 sm:p-5 shadow-2xl space-y-3.5 text-white">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-300">
                      <span className="inline-flex items-center gap-1.5">
                        <SkipForward className="w-3.5 h-3.5" />
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
                        onClick={() => selectEpisode(epIndex + 1)}
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
                          playSound("click");
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
                        onClick={() => onOpenInLab(activeMoment.payload)}
                        className="px-4 py-2 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold"
                      >
                        Abrir Lab 3D
                      </button>
                      <button
                        type="button"
                        onClick={() => selectEpisode(0)}
                        className="px-3.5 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-bold"
                      >
                        Rever EP. 01
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          <div
            className={styles.transport + " border-t border-white/10 px-3 py-2 sm:px-4"}
            data-video-controls
            data-visible={!isFullscreen || controlsVisible || (!isPlaying && !upNextVisible) || undefined}
            onPointerEnter={isFullscreen ? (event) => {
              if (event.pointerType === "mouse") {
                controlsHoverRef.current = true;
                revealControls(true);
              }
            } : undefined}
            onPointerLeave={isFullscreen ? (event) => {
              if (event.pointerType === "mouse") {
                controlsHoverRef.current = false;
                revealControls(false);
              }
            } : undefined}
            onFocusCapture={isFullscreen ? () => revealControls() : undefined}
          >
            <div className="space-y-1">
              <div
                ref={timelineRef}
                className={styles.timeline}
                onPointerMove={(event) => {
                  updateScrubPreview(event.clientX, event.pointerType !== "mouse");
                  if (isFullscreen) revealControls();
                }}
                onPointerLeave={() => {
                  if (!scrubbingRef.current) setScrubPreview(null);
                }}
              >
                {scrubPreview && (
                  <div
                    data-scrub-tooltip
                    data-touch={scrubPreview.isTouch ? "true" : undefined}
                    className={styles.scrubTooltip}
                    style={{ left: `${Math.min(90, Math.max(10, scrubPreview.ratio * 100))}%` }}
                  >
                    <span className="font-mono text-[10px] font-extrabold text-amber-300">
                      {scrubPreview.sceneIndex + 1}.
                    </span>
                    <span className="truncate text-[11px] font-bold text-white">
                      {scrubPreview.label}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-sky-300">
                      {formatTime(scrubPreview.time)}
                    </span>
                  </div>
                )}
                <div className={styles.track} aria-hidden="true">
                  {scenes.map((scene, idx) => {
                    const span = Math.max(0.2, scene.endSec - scene.startSec);
                    const widthPct = (span / Math.max(0.2, effectiveDuration)) * 100;
                    const playedInSeg = Math.max(0, Math.min(1, (currentTime - scene.startSec) / span)) * 100;
                    const hoveredTime = scrubPreview?.time ?? -1;
                    const hoverInSeg =
                      scrubPreview ? Math.max(0, Math.min(1, (hoveredTime - scene.startSec) / span)) * 100 : 0;
                    return (
                      <span
                        key={scene.id}
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
                  onPointerDown={(event) => {
                    scrubbingRef.current = true;
                    updateScrubPreview(event.clientX, event.pointerType !== "mouse");
                    if (isFullscreen) revealControls(true);
                  }}
                  onPointerUp={() => {
                    scrubbingRef.current = false;
                    setScrubPreview(null);
                    if (isFullscreen) revealControls(false);
                  }}
                  onPointerCancel={() => {
                    scrubbingRef.current = false;
                    setScrubPreview(null);
                    if (isFullscreen) revealControls(false);
                  }}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    seekToSeconds(Number(event.target.value) / 1000 * effectiveDuration);
                    if (isFullscreen) revealControls();
                  }}
                  aria-label="Linha do tempo do vídeo"
                  aria-valuetext={formatTime(currentTime) + " de " + formatTime(effectiveDuration)}
                  className={styles.scrubber}
                />
              </div>
              {/* Exact Scene Jump Pills */}
              <div className={styles.chapters + " flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"}>
                {scenes.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      playSound("click");
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
                  onClick={() => selectEpisode(epIndex - 1)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  title="Episódio anterior"
                  aria-label="Episódio anterior"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => selectEpisode(epIndex + 1)}
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

              <div className="flex items-center gap-1.5">
                {/* Volume Control (Mute toggle + Desktop Slider) */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="min-w-[26px] min-h-[26px] flex items-center justify-center text-slate-300 hover:text-white transition"
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
                    className="hidden sm:block w-16 sm:w-20 h-1.5 accent-sky-400 cursor-pointer rounded-lg"
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
                  aria-pressed={showCaptions}
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

        {/* Episode Info Card + Moment-Synced Lab 3D Presets */}
        <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 space-y-3 shadow-draft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              data-lab-moment-btn
              onClick={() => onOpenInLab(activeMoment.payload)}
              className="shrink-0 inline-flex flex-col items-center sm:items-end justify-center px-4 py-2 rounded-xl bg-ph hover:bg-ph-dark text-white transition shadow-sm"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold">
                <Compass className="w-4 h-4" /> Reproduzir este Momento no Lab 3D
              </span>
              <span className="font-mono text-[10px] text-sky-100/95 mt-0.5">
                {activeMoment.coordsLabel}
              </span>
            </button>
          </div>

          {episodeExamples.length > 0 && (
            <div className="pt-2.5 border-t border-paper-200 dark:border-blueprint-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[10.5px] font-mono font-bold text-ink-500 dark:text-slate-400">
                <span>PONTOS CITADOS NESTA AULA · REPRODUZIR NO LAB 3D:</span>
                <span className="hidden sm:inline text-ph dark:text-sky-400">
                  No vídeo: {activeMoment.chipLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {episodeExamples.map((ex) => {
                  const isActive = ex.id === activeMoment.id;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      data-example-id={ex.id}
                      data-active={isActive ? "true" : undefined}
                      onClick={() => onOpenInLab(ex.payload)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-left transition ${
                        isActive
                          ? "bg-ph/15 dark:bg-sky-500/20 border-ph dark:border-sky-400 text-ph dark:text-sky-200"
                          : "bg-paper-100/80 dark:bg-blueprint-950 border-paper-300/80 dark:border-blueprint-800 text-ink-700 dark:text-slate-300 hover:border-ph/60"
                      }`}
                    >
                      <span className="text-[11px] font-bold">{ex.chipLabel}</span>
                      <span className="font-mono text-[10px] opacity-80">{ex.coordsLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
