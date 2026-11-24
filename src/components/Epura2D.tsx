"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  formatSigned,
  GDPoint,
  GDSegment,
  getLineProjectionLabels,
  getProjectionLabels,
  NotationMode,
} from "@/lib/gd-math";
import { LabSpotlight } from "@/lib/director";

interface Epura2DProps {
  points: GDPoint[];
  segments?: GDSegment[];
  selectedPointId?: string | null;
  notation: NotationMode;
  showXYZ?: boolean;
  dark?: boolean;
  interactive?: boolean;
  spotlight?: LabSpotlight | null;
  onClearSpotlight?: () => void;
  onUpdatePoint?: (id: string, patch: Partial<Pick<GDPoint, "x" | "y" | "z">>) => void;
  onSelectPoint?: (id: string) => void;
  // Special mode for "Desenhe a Épura" interactive placement exercise:
  placementMode?: {
    label: string;
    activeTarget: "pv" | "ph";
    placedPv: { x: number; z: number } | null;
    placedPh: { x: number; y: number } | null;
    onPlace: (target: "pv" | "ph", coord: { x: number; val: number }) => void;
    revealPoint?: { x: number; y: number; z: number } | null;
  };
  className?: string;
}

const RANGE = 6; // -6 to +6
const VIEW_W = 560;
const VIEW_H = 480;
const PAD_X = 56;
const PAD_Y = 42;
const PLOT_W = VIEW_W - PAD_X * 2;
const PLOT_H = VIEW_H - PAD_Y * 2;
const ORIGIN_X = VIEW_W / 2;
const ORIGIN_Y = VIEW_H / 2;
const STEP_X = PLOT_W / (RANGE * 2);
const STEP_Y = PLOT_H / (RANGE * 2);

const toSvgX = (x: number) => ORIGIN_X + x * STEP_X;
// In Epura: positive vertical value goes UP (smaller SVG y)
// For A' (cota z): svgY = ORIGIN_Y - z * STEP_Y
// For A (afastamento y): svgY = ORIGIN_Y + y * STEP_Y  (because +y folds DOWN!)
const toSvgYForCota = (z: number) => ORIGIN_Y - z * STEP_Y;
const toSvgYForAfast = (y: number) => ORIGIN_Y + y * STEP_Y;

function clampSnap(val: number, step = 0.5): number {
  const clamped = Math.max(-5.5, Math.min(5.5, val));
  return Math.round(clamped / step) * step;
}

export function Epura2D({
  points,
  segments = [],
  selectedPointId,
  notation,
  showXYZ = true,
  dark = false,
  interactive = true,
  spotlight = null,
  onClearSpotlight,
  onUpdatePoint,
  onSelectPoint,
  placementMode,
  className = "",
}: Epura2DProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    kind: "pv" | "ph";
  } | null>(null);
  const [hoverGrid, setHoverGrid] = useState<{ x: number; svgVal: number } | null>(null);

  const clientToGrid = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * VIEW_W;
    const sy = ((clientY - rect.top) / rect.height) * VIEW_H;
    const gx = (sx - ORIGIN_X) / STEP_X;
    const gyUp = (ORIGIN_Y - sy) / STEP_Y; // + above LT, - below LT
    return { gx, gyUp };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const coord = clientToGrid(e.clientX, e.clientY);
    if (!coord) return;

    if (placementMode) {
      setHoverGrid({
        x: Math.max(-5, Math.min(5, Math.round(coord.gx))),
        svgVal: Math.max(-5, Math.min(5, Math.round(coord.gyUp))),
      });
      return;
    }

    if (!dragging || !onUpdatePoint) return;
    const snappedX = clampSnap(coord.gx, 0.5);
    if (dragging.kind === "pv") {
      // Cota z: + is above LT (same sign as gyUp)
      const snappedZ = clampSnap(coord.gyUp, 0.5);
      onUpdatePoint(dragging.id, { x: snappedX, z: snappedZ });
    } else {
      // Afastamento y: + is BELOW LT (opposite sign of gyUp!)
      const snappedY = clampSnap(-coord.gyUp, 0.5);
      onUpdatePoint(dragging.id, { x: snappedX, y: snappedY });
    }
  };

  const handlePointerUp = () => {
    setDragging(null);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!placementMode) return;
    const coord = clientToGrid(e.clientX, e.clientY);
    if (!coord) return;
    const snappedX = Math.max(-5, Math.min(5, Math.round(coord.gx)));
    const snappedUp = Math.max(-5, Math.min(5, Math.round(coord.gyUp)));
    if (placementMode.activeTarget === "pv") {
      // val is cota z
      placementMode.onPlace("pv", { x: snappedX, val: snappedUp });
    } else {
      // val is afastamento y (inverted!)
      placementMode.onPlace("ph", { x: snappedX, val: -snappedUp });
    }
  };

  const sample = getProjectionLabels("A", notation);
  const gridMajor = dark ? "rgba(148,163,184,0.18)" : "rgba(30,86,160,0.13)";
  const gridMinor = dark ? "rgba(148,163,184,0.08)" : "rgba(30,86,160,0.06)";
  const ink = dark ? "#E2E8F0" : "#1C1917";
  const muted = dark ? "#94A3B8" : "#78716C";
  const pvCol = dark ? "#F87171" : "#C94032";
  const phCol = dark ? "#60A5FA" : "#1E56A0";
  const ltCol = dark ? "#2DD4BF" : "#0F766E";

  const pointMap = new Map(points.map((p) => [p.id, p]));

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden select-none ${
        dark
          ? "bg-blueprint-950 border-blueprint-700"
          : "bg-paper-50 border-paper-300"
      } ${className}`}
    >
      {/* Header strip */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b text-[11px] font-semibold ${
          dark
            ? "bg-blueprint-900/90 border-blueprint-800 text-slate-300"
            : "bg-paper-100/90 border-paper-200 text-ink-700"
        }`}
      >
        <span className="flex items-center gap-1.5 uppercase tracking-wide">
          <span className="w-2 h-2 rounded-full bg-pv" />
          Épura 2D (Projeção Plana)
        </span>
        <span className="font-mono font-normal text-[11px] text-ink-500 dark:text-slate-400">
          {placementMode
            ? `Clique na grade para marcar ${
                placementMode.activeTarget === "pv"
                  ? `${placementMode.label}' (cota)`
                  : `${placementMode.label} (afast.)`
              }`
            : interactive
              ? "Arraste as projeções na folha"
              : "Leitura da Épura"}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={`w-full h-auto block ${
          placementMode ? "cursor-crosshair" : dragging ? "cursor-grabbing" : ""
        }`}
        style={{ touchAction: dragging || placementMode ? "none" : "pan-y" }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setDragging(null);
          setHoverGrid(null);
        }}
        onClick={handleSvgClick}
      >
        {/* Subtle drafting paper tint bands */}
        <rect
          x={PAD_X}
          y={PAD_Y}
          width={PLOT_W}
          height={PLOT_H / 2}
          fill={dark ? "rgba(248,113,113,0.035)" : "rgba(201,64,50,0.025)"}
        />
        <rect
          x={PAD_X}
          y={ORIGIN_Y}
          width={PLOT_W}
          height={PLOT_H / 2}
          fill={dark ? "rgba(96,165,250,0.035)" : "rgba(30,86,160,0.025)"}
        />

        {/* Grid lines */}
        {Array.from({ length: RANGE * 2 + 1 }, (_, idx) => {
          const v = idx - RANGE;
          const x = toSvgX(v);
          const y = ORIGIN_Y - v * STEP_Y;
          return (
            <g key={v}>
              <line
                x1={x}
                y1={PAD_Y}
                x2={x}
                y2={VIEW_H - PAD_Y}
                stroke={v === 0 ? ltCol : gridMajor}
                strokeWidth={v === 0 ? 1.2 : 1}
                strokeDasharray={v === 0 ? "4 4" : undefined}
                opacity={v === 0 ? 0.45 : 1}
              />
              {v !== 0 && (
                <line
                  x1={PAD_X}
                  y1={y}
                  x2={VIEW_W - PAD_X}
                  y2={y}
                  stroke={gridMajor}
                  strokeWidth={1}
                />
              )}
              {/* Minor half-grid lines */}
              {v < RANGE && (
                <>
                  <line
                    x1={x + STEP_X / 2}
                    y1={PAD_Y}
                    x2={x + STEP_X / 2}
                    y2={VIEW_H - PAD_Y}
                    stroke={gridMinor}
                    strokeWidth={0.75}
                  />
                  <line
                    x1={PAD_X}
                    y1={y - STEP_Y / 2}
                    x2={VIEW_W - PAD_X}
                    y2={y - STEP_Y / 2}
                    stroke={gridMinor}
                    strokeWidth={0.75}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Outer frame */}
        <rect
          x={PAD_X}
          y={PAD_Y}
          width={PLOT_W}
          height={PLOT_H}
          fill="none"
          stroke={dark ? "#334155" : "#D6CEC0"}
          strokeWidth={1.2}
          rx={4}
        />

        {/* Semiplane Watermarks */}
        <text
          x={PAD_X + 10}
          y={PAD_Y + 18}
          fontSize="11"
          fontWeight="700"
          fill={pvCol}
          opacity="0.72"
          fontFamily="var(--font-mono), monospace"
        >
          {sample.pvShort}S · {sample.phShort}P
        </text>
        <text
          x={PAD_X + 10}
          y={VIEW_H - PAD_Y - 10}
          fontSize="11"
          fontWeight="700"
          fill={phCol}
          opacity="0.72"
          fontFamily="var(--font-mono), monospace"
        >
          {sample.phShort}A · {sample.pvShort}I
        </text>

        {/* Margin direction arrows: Cota (left) & Afastamento (right) */}
        <g fontSize="10" fontWeight="700" fontFamily="var(--font-mono), monospace">
          {/* Left: Cota */}
          <text x={12} y={PAD_Y + 26} fill={pvCol}>
            +Z
          </text>
          <text x={12} y={PAD_Y + 39} fill={pvCol} fontSize="9" opacity="0.85">
            cota↑
          </text>
          <text x={12} y={VIEW_H - PAD_Y - 22} fill={pvCol}>
            −Z
          </text>
          <text x={12} y={VIEW_H - PAD_Y - 10} fill={pvCol} fontSize="9" opacity="0.85">
            cota↓
          </text>

          {/* Right: Afastamento (INVERTED — the key insight!) */}
          <text x={VIEW_W - 48} y={PAD_Y + 26} fill={phCol}>
            −Y
          </text>
          <text x={VIEW_W - 50} y={PAD_Y + 39} fill={phCol} fontSize="8.5" opacity="0.85">
            afast↑
          </text>
          <text x={VIEW_W - 48} y={VIEW_H - PAD_Y - 22} fill={phCol}>
            +Y
          </text>
          <text x={VIEW_W - 50} y={VIEW_H - PAD_Y - 10} fill={phCol} fontSize="8.5" opacity="0.85">
            afast↓
          </text>
        </g>

        {/* ---- LINHA DE TERRA (LT) ---- */}
        <line
          x1={PAD_X - 18}
          y1={ORIGIN_Y}
          x2={VIEW_W - PAD_X + 18}
          y2={ORIGIN_Y}
          stroke={ltCol}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
        {/* Classic Mongean double-dashes under ends of LT */}
        <line
          x1={PAD_X - 16}
          y1={ORIGIN_Y + 6}
          x2={PAD_X + 4}
          y2={ORIGIN_Y + 6}
          stroke={ltCol}
          strokeWidth={1.8}
        />
        <line
          x1={VIEW_W - PAD_X - 4}
          y1={ORIGIN_Y + 6}
          x2={VIEW_W - PAD_X + 16}
          y2={ORIGIN_Y + 6}
          stroke={ltCol}
          strokeWidth={1.8}
        />
        <text
          x={VIEW_W - PAD_X + 20}
          y={ORIGIN_Y + 4}
          fontSize="12"
          fontWeight="800"
          fill={ltCol}
          fontFamily="var(--font-mono), monospace"
        >
          LT
        </text>

        {/* Abscissa ruler ticks along LT */}
        {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((tick) => {
          const tx = toSvgX(tick);
          return (
            <g key={tick}>
              <line
                x1={tx}
                y1={ORIGIN_Y - 4}
                x2={tx}
                y2={ORIGIN_Y + 4}
                stroke={ltCol}
                strokeWidth={tick === 0 ? 2 : 1.2}
              />
              <text
                x={tx}
                y={ORIGIN_Y + 15}
                textAnchor="middle"
                fontSize="9.5"
                fill={tick === 0 ? ltCol : muted}
                fontWeight={tick === 0 ? "700" : "500"}
                fontFamily="var(--font-mono), monospace"
              >
                {tick === 0 ? "0" : tick > 0 ? `+${tick}` : tick}
              </text>
            </g>
          );
        })}

        {/* Vertical axis numeric markers on left inner margin */}
        {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((tick) => {
          const ty = ORIGIN_Y - tick * STEP_Y;
          return (
            <text
              key={tick}
              x={PAD_X - 8}
              y={ty + 3.5}
              textAnchor="end"
              fontSize="9"
              fill={muted}
              fontFamily="var(--font-mono), monospace"
            >
              {Math.abs(tick)}
            </text>
          );
        })}

        {/* Optional +X Abscissa label */}
        {showXYZ && (
          <text
            x={VIEW_W - PAD_X - 4}
            y={ORIGIN_Y - 8}
            textAnchor="end"
            fontSize="10"
            fontWeight="700"
            fill={ltCol}
            fontFamily="var(--font-mono), monospace"
          >
            +X (Abscissa) →
          </text>
        )}

        {/* ---- SEGMENTS & EXTENDED LINES IN EPURA ---- */}
        {segments.map((seg) => {
          const a = pointMap.get(seg.fromId);
          const b = pointMap.get(seg.toId);
          if (!a || !b) return null;
          const ax = toSvgX(a.x);
          const bx = toSvgX(b.x);
          const aPvY = toSvgYForCota(a.z);
          const bPvY = toSvgYForCota(b.z);
          const aPhY = toSvgYForAfast(a.y);
          const bPhY = toSvgYForAfast(b.y);

          const extendSvg = (x1: number, y1: number, x2: number, y2: number) => {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy);
            if (len < 1) return null;
            const ux = dx / len;
            const uy = dy / len;
            return {
              x1: x1 - ux * 110,
              y1: y1 - uy * 110,
              x2: x2 + ux * 110,
              y2: y2 + uy * 110,
            };
          };

          const extPv = seg.extendLine ? extendSvg(ax, aPvY, bx, bPvY) : null;
          const extPh = seg.extendLine ? extendSvg(ax, aPhY, bx, bPhY) : null;
          const lLabels = seg.label
            ? getLineProjectionLabels(seg.label, notation)
            : null;

          return (
            <g key={seg.id}>
              {extPv && (
                <line
                  x1={extPv.x1}
                  y1={extPv.y1}
                  x2={extPv.x2}
                  y2={extPv.y2}
                  stroke={pvCol}
                  strokeWidth={1.4}
                  strokeDasharray="6 4"
                  opacity={0.62}
                />
              )}
              {extPh && (
                <line
                  x1={extPh.x1}
                  y1={extPh.y1}
                  x2={extPh.x2}
                  y2={extPh.y2}
                  stroke={phCol}
                  strokeWidth={1.4}
                  strokeDasharray="6 4"
                  opacity={0.62}
                />
              )}
              <line
                x1={ax}
                y1={aPvY}
                x2={bx}
                y2={bPvY}
                stroke={pvCol}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
              <line
                x1={ax}
                y1={aPhY}
                x2={bx}
                y2={bPhY}
                stroke={phCol}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
              {lLabels && (
                <>
                  <text
                    x={(ax + bx) / 2 + 12}
                    y={(aPvY + bPvY) / 2 - 8}
                    fontSize="12"
                    fontWeight="800"
                    fill={pvCol}
                    fontFamily="var(--font-mono), monospace"
                  >
                    {lLabels.vertical}
                  </text>
                  <text
                    x={(ax + bx) / 2 - 18}
                    y={(aPhY + bPhY) / 2 + 16}
                    fontSize="12"
                    fontWeight="800"
                    fill={phCol}
                    fontFamily="var(--font-mono), monospace"
                  >
                    {lLabels.horizontal}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* ---- POINTS & LINHAS DE CHAMADA ---- */}
        {!placementMode &&
          points.map((pt) => {
            const labels = getProjectionLabels(pt.label, notation);
            const sx = toSvgX(pt.x);
            const pvY = toSvgYForCota(pt.z);
            const phY = toSvgYForAfast(pt.y);
            const isSelected = pt.id === selectedPointId;
            const coincident = Math.abs(pvY - phY) < 4;

            const topY = Math.min(ORIGIN_Y, pvY, phY);
            const botY = Math.max(ORIGIN_Y, pvY, phY);

            return (
              <g key={pt.id}>
                {/* Linha de Chamada perpendicular à LT */}
                <line
                  x1={sx}
                  y1={topY}
                  x2={sx}
                  y2={botY}
                  stroke={isSelected ? ink : muted}
                  strokeWidth={isSelected ? 1.5 : 1.15}
                  strokeDasharray="4 3"
                  opacity={0.78}
                />

                {/* Abscissa tick highlight on LT */}
                <circle cx={sx} cy={ORIGIN_Y} r={3.2} fill={ltCol} />

                {/* Coincident projections (2nd Bisector or LT!) */}
                {coincident ? (
                  <g
                    className={interactive ? "cursor-grab" : ""}
                    onPointerDown={(e) => {
                      if (!interactive) return;
                      e.stopPropagation();
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                      onSelectPoint?.(pt.id);
                      setDragging({ id: pt.id, kind: "pv" });
                    }}
                  >
                    <circle
                      cx={sx}
                      cy={pvY}
                      r={10}
                      fill="none"
                      stroke={phCol}
                      strokeWidth={2.2}
                    />
                    <circle
                      cx={sx}
                      cy={pvY}
                      r={6}
                      fill={pvCol}
                      stroke={dark ? "#0B1220" : "#FAF8F3"}
                      strokeWidth={1.5}
                    />
                    <rect
                      x={sx + 12}
                      y={pvY - 11}
                      width={52}
                      height={22}
                      rx={6}
                      fill={dark ? "#182540" : "#FEF3C7"}
                      stroke="#B45309"
                      strokeWidth={1.2}
                    />
                    <text
                      x={sx + 38}
                      y={pvY + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="800"
                      fill={dark ? "#FDE68A" : "#92400E"}
                      fontFamily="var(--font-mono), monospace"
                    >
                      {labels.horizontal}≡{labels.vertical}
                    </text>
                  </g>
                ) : (
                  <>
                    {/* Vertical Projection A' (Cota) */}
                    <g
                      className={interactive ? "cursor-grab active:cursor-grabbing" : ""}
                      onPointerDown={(e) => {
                        if (!interactive) return;
                        e.stopPropagation();
                        (e.target as Element).setPointerCapture?.(e.pointerId);
                        onSelectPoint?.(pt.id);
                        setDragging({ id: pt.id, kind: "pv" });
                      }}
                    >
                      {/* Invisible large hit target for thumb/finger dragging on mobile */}
                      <circle cx={sx} cy={pvY} r={18} fill="transparent" />
                      {isSelected && (
                        <circle
                          cx={sx}
                          cy={pvY}
                          r={11}
                          fill={pvCol}
                          opacity={0.18}
                        />
                      )}
                      <circle
                        cx={sx}
                        cy={pvY}
                        r={6.5}
                        fill={pvCol}
                        stroke={dark ? "#0B1220" : "#FAF8F3"}
                        strokeWidth={2}
                      />
                      <text
                        x={sx + 11}
                        y={pvY + 4}
                        fontSize="13"
                        fontWeight="800"
                        fill={pvCol}
                        fontFamily="var(--font-mono), monospace"
                      >
                        {labels.vertical}
                      </text>
                    </g>

                    {/* Horizontal Projection A (Afastamento) */}
                    <g
                      className={interactive ? "cursor-grab active:cursor-grabbing" : ""}
                      onPointerDown={(e) => {
                        if (!interactive) return;
                        e.stopPropagation();
                        (e.target as Element).setPointerCapture?.(e.pointerId);
                        onSelectPoint?.(pt.id);
                        setDragging({ id: pt.id, kind: "ph" });
                      }}
                    >
                      <circle cx={sx} cy={phY} r={18} fill="transparent" />
                      {isSelected && (
                        <circle
                          cx={sx}
                          cy={phY}
                          r={11}
                          fill={phCol}
                          opacity={0.18}
                        />
                      )}
                      <circle
                        cx={sx}
                        cy={phY}
                        r={6.5}
                        fill={phCol}
                        stroke={dark ? "#0B1220" : "#FAF8F3"}
                        strokeWidth={2}
                      />
                      <text
                        x={sx - 12}
                        y={phY + 4}
                        textAnchor="end"
                        fontSize="13"
                        fontWeight="800"
                        fill={phCol}
                        fontFamily="var(--font-mono), monospace"
                      >
                        {labels.horizontal}
                      </text>
                    </g>
                  </>
                )}
              </g>
            );
          })}

        {/* ---- LIVE PROFESSOR SPOTLIGHT / HAND-DRAWN CIRCLING LAYER ---- */}
        {!placementMode && spotlight && spotlight.target !== "none" && (() => {
          const tPt =
            points.find((p) => p.label === spotlight.pointLabel) ?? points[0];
          const hlStroke = "#EA580C";
          const hlGlow = "rgba(245, 158, 11, 0.22)";

          // Hand-sketched organic double loop ellipse helper
          const renderChalkCircle = (
            cx: number,
            cy: number,
            rx: number,
            ry: number,
            keyStr: string
          ) => (
            <g key={keyStr} pointerEvents="none">
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx + 5}
                ry={ry + 5}
                fill={hlGlow}
                className="animate-radar"
              />
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="none"
                stroke={hlStroke}
                strokeWidth={3.4}
                strokeLinecap="round"
                transform={`rotate(-4 ${cx} ${cy})`}
                className="animate-draw-stroke"
              />
              <ellipse
                cx={cx + 1.5}
                cy={cy - 1}
                rx={rx + 3}
                ry={ry + 2}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={1.6}
                strokeDasharray="10 6"
                transform={`rotate(5 ${cx} ${cy})`}
                opacity={0.9}
              />
            </g>
          );

          let calloutX = ORIGIN_X;
          let calloutY = PAD_Y + 32;
          const shapes: React.ReactNode[] = [];

          if (spotlight.target === "lt") {
            shapes.push(
              <rect
                key="lt-band"
                x={PAD_X - 14}
                y={ORIGIN_Y - 12}
                width={PLOT_W + 28}
                height={24}
                rx={12}
                fill={hlGlow}
                stroke={hlStroke}
                strokeWidth={3}
                className="animate-draw-stroke"
              />
            );
            calloutX = ORIGIN_X;
            calloutY = ORIGIN_Y - 38;
          } else if (spotlight.target === "origin") {
            shapes.push(renderChalkCircle(ORIGIN_X, ORIGIN_Y, 26, 26, "orig"));
            calloutX = ORIGIN_X;
            calloutY = ORIGIN_Y - 52;
          } else if (spotlight.target === "line" && points.length >= 2) {
            const a = points[0];
            const b = points[points.length - 1];
            shapes.push(
              <g key="line-hl" pointerEvents="none">
                <line
                  x1={toSvgX(a.x)}
                  y1={toSvgYForCota(a.z)}
                  x2={toSvgX(b.x)}
                  y2={toSvgYForCota(b.z)}
                  stroke="#F59E0B"
                  strokeWidth={8}
                  strokeLinecap="round"
                  opacity={0.45}
                  className="animate-draw-stroke"
                />
                <line
                  x1={toSvgX(a.x)}
                  y1={toSvgYForAfast(a.y)}
                  x2={toSvgX(b.x)}
                  y2={toSvgYForAfast(b.y)}
                  stroke="#F59E0B"
                  strokeWidth={8}
                  strokeLinecap="round"
                  opacity={0.45}
                  className="animate-draw-stroke"
                />
              </g>
            );
            calloutX = (toSvgX(a.x) + toSvgX(b.x)) / 2;
            calloutY = PAD_Y + 34;
          } else if (tPt) {
            const sx = toSvgX(tPt.x);
            const pvY = toSvgYForCota(tPt.z);
            const phY = toSvgYForAfast(tPt.y);

            if (spotlight.target === "abscissa") {
              const topY = Math.min(ORIGIN_Y, pvY, phY) - 14;
              const botY = Math.max(ORIGIN_Y, pvY, phY) + 14;
              shapes.push(
                <line
                  key="abs-bar"
                  x1={ORIGIN_X}
                  y1={ORIGIN_Y}
                  x2={sx}
                  y2={ORIGIN_Y}
                  stroke={hlStroke}
                  strokeWidth={6}
                  strokeLinecap="round"
                  opacity={0.85}
                  className="animate-draw-stroke"
                />
              );
              shapes.push(
                renderChalkCircle(
                  sx,
                  (topY + botY) / 2,
                  22,
                  Math.max(30, (botY - topY) / 2),
                  "lc-oval"
                )
              );
              calloutX = sx;
              calloutY = Math.max(PAD_Y + 28, topY - 18);
            } else if (spotlight.target === "cota") {
              shapes.push(
                <line
                  key="cota-bar"
                  x1={sx}
                  y1={ORIGIN_Y}
                  x2={sx}
                  y2={pvY}
                  stroke={hlStroke}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  opacity={0.8}
                  className="animate-draw-stroke"
                />
              );
              shapes.push(renderChalkCircle(sx, pvY, 24, 22, "cota-ring"));
              calloutX = sx;
              calloutY = pvY < ORIGIN_Y ? Math.max(PAD_Y + 26, pvY - 40) : Math.min(VIEW_H - PAD_Y - 26, pvY + 42);
            } else if (spotlight.target === "afastamento") {
              shapes.push(
                <line
                  key="afast-bar"
                  x1={sx}
                  y1={ORIGIN_Y}
                  x2={sx}
                  y2={phY}
                  stroke={hlStroke}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  opacity={0.8}
                  className="animate-draw-stroke"
                />
              );
              shapes.push(renderChalkCircle(sx, phY, 24, 22, "afast-ring"));
              calloutX = sx;
              calloutY = phY > ORIGIN_Y ? Math.min(VIEW_H - PAD_Y - 24, phY + 42) : Math.max(PAD_Y + 26, phY - 40);
            } else if (spotlight.target === "coincident") {
              shapes.push(renderChalkCircle(sx, pvY, 34, 26, "coinc-ring"));
              calloutX = sx;
              calloutY = Math.max(PAD_Y + 28, pvY - 46);
            } else if (spotlight.target === "point_space") {
              shapes.push(renderChalkCircle(sx, pvY, 21, 21, "sp-pv"));
              shapes.push(renderChalkCircle(sx, phY, 21, 21, "sp-ph"));
              calloutX = sx;
              calloutY = PAD_Y + 32;
            }
          }

          const clampedX = Math.max(PAD_X + 125, Math.min(VIEW_W - PAD_X - 125, calloutX));
          const clampedY = Math.max(PAD_Y + 22, Math.min(VIEW_H - PAD_Y - 18, calloutY));

          return (
            <g key={`${spotlight.target}-${spotlight.caption}`}>
              {shapes}
              <g pointerEvents="none" className="animate-fade-up">
                <rect
                  x={clampedX - 122}
                  y={clampedY - 14}
                  width={244}
                  height={28}
                  rx={10}
                  fill="#1C1917"
                  stroke="#F59E0B"
                  strokeWidth={1.8}
                />
                <text
                  x={clampedX}
                  y={clampedY + 4}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="800"
                  fill="#FEF3C7"
                  fontFamily="var(--font-sans), sans-serif"
                >
                  {spotlight.caption.slice(0, 36)}
                </text>
              </g>
            </g>
          );
        })()}

        {/* ---- INTERACTIVE PLACEMENT MODE (DESENHE A ÉPURA) ---- */}
        {placementMode && (
          <g>
            {/* Hover ghost reticle */}
            {hoverGrid && (
              <g pointerEvents="none">
                <line
                  x1={toSvgX(hoverGrid.x)}
                  y1={PAD_Y}
                  x2={toSvgX(hoverGrid.x)}
                  y2={VIEW_H - PAD_Y}
                  stroke={
                    placementMode.activeTarget === "pv" ? pvCol : phCol
                  }
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.45}
                />
                <circle
                  cx={toSvgX(hoverGrid.x)}
                  cy={ORIGIN_Y - hoverGrid.svgVal * STEP_Y}
                  r={7}
                  fill={placementMode.activeTarget === "pv" ? pvCol : phCol}
                  opacity={0.35}
                />
                <text
                  x={toSvgX(hoverGrid.x) + 10}
                  y={ORIGIN_Y - hoverGrid.svgVal * STEP_Y - 8}
                  fontSize="10.5"
                  fontWeight="700"
                  fill={placementMode.activeTarget === "pv" ? pvCol : phCol}
                  fontFamily="var(--font-mono), monospace"
                >
                  x={formatSigned(hoverGrid.x)},{" "}
                  {placementMode.activeTarget === "pv"
                    ? `z=${formatSigned(hoverGrid.svgVal)}`
                    : `y=${formatSigned(-hoverGrid.svgVal)}`}
                </text>
              </g>
            )}

            {/* User placed A' */}
            {placementMode.placedPv && (
              <g>
                <line
                  x1={toSvgX(placementMode.placedPv.x)}
                  y1={ORIGIN_Y}
                  x2={toSvgX(placementMode.placedPv.x)}
                  y2={toSvgYForCota(placementMode.placedPv.z)}
                  stroke={pvCol}
                  strokeDasharray="4 3"
                  strokeWidth={1.4}
                />
                <circle
                  cx={toSvgX(placementMode.placedPv.x)}
                  cy={toSvgYForCota(placementMode.placedPv.z)}
                  r={7.5}
                  fill={pvCol}
                  stroke="#FAF8F3"
                  strokeWidth={2}
                />
                <text
                  x={toSvgX(placementMode.placedPv.x) + 12}
                  y={toSvgYForCota(placementMode.placedPv.z) + 4}
                  fontSize="13"
                  fontWeight="800"
                  fill={pvCol}
                  fontFamily="var(--font-mono), monospace"
                >
                  {placementMode.label}&apos;
                </text>
              </g>
            )}

            {/* User placed A */}
            {placementMode.placedPh && (
              <g>
                <line
                  x1={toSvgX(placementMode.placedPh.x)}
                  y1={ORIGIN_Y}
                  x2={toSvgX(placementMode.placedPh.x)}
                  y2={toSvgYForAfast(placementMode.placedPh.y)}
                  stroke={phCol}
                  strokeDasharray="4 3"
                  strokeWidth={1.4}
                />
                <circle
                  cx={toSvgX(placementMode.placedPh.x)}
                  cy={toSvgYForAfast(placementMode.placedPh.y)}
                  r={7.5}
                  fill={phCol}
                  stroke="#FAF8F3"
                  strokeWidth={2}
                />
                <text
                  x={toSvgX(placementMode.placedPh.x) - 12}
                  y={toSvgYForAfast(placementMode.placedPh.y) + 4}
                  textAnchor="end"
                  fontSize="13"
                  fontWeight="800"
                  fill={phCol}
                  fontFamily="var(--font-mono), monospace"
                >
                  {placementMode.label}
                </text>
              </g>
            )}

            {/* Correct answer reveal overlay */}
            {placementMode.revealPoint && (
              <g>
                <line
                  x1={toSvgX(placementMode.revealPoint.x)}
                  y1={Math.min(
                    ORIGIN_Y,
                    toSvgYForCota(placementMode.revealPoint.z),
                    toSvgYForAfast(placementMode.revealPoint.y)
                  )}
                  x2={toSvgX(placementMode.revealPoint.x)}
                  y2={Math.max(
                    ORIGIN_Y,
                    toSvgYForCota(placementMode.revealPoint.z),
                    toSvgYForAfast(placementMode.revealPoint.y)
                  )}
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                />
                <circle
                  cx={toSvgX(placementMode.revealPoint.x)}
                  cy={toSvgYForCota(placementMode.revealPoint.z)}
                  r={10}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.5}
                />
                <circle
                  cx={toSvgX(placementMode.revealPoint.x)}
                  cy={toSvgYForAfast(placementMode.revealPoint.y)}
                  r={10}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.5}
                />
              </g>
            )}
          </g>
        )}
      </svg>
      {/* Active Spotlight Clear Pill */}
      {spotlight && spotlight.target !== "none" && onClearSpotlight && (
        <button
          type="button"
          onClick={onClearSpotlight}
          className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-ink-900/90 text-amber-200 border border-amber-400/60 text-[10.5px] font-bold shadow hover:bg-ink-900 transition"
        >
          Limpar destaque ✕
        </button>
      )}
    </div>
  );
}
