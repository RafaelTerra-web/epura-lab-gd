"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  analyzePointsGeometry,
  classifyPoint,
  formatPointCoords,
  formatSigned,
  GDPoint,
  GDSegment,
  getProjectionLabels,
  NotationMode,
  POINT_COLORS,
  SCENE_PRESETS,
  ScenePreset,
} from "@/lib/gd-math";
import { Scene3D } from "./Scene3D";
import { Epura2D } from "./Epura2D";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { TtsModelTier, VoiceState } from "@/lib/voice";
import { LabSpotlight } from "@/lib/director";
import {
  BookmarkPlus,
  Compass,
  Layers,
  Link2,
  Minus,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

interface LabStudioProps {
  points: GDPoint[];
  segments: GDSegment[];
  setPoints: React.Dispatch<React.SetStateAction<GDPoint[]>>;
  setSegments: React.Dispatch<React.SetStateAction<GDSegment[]>>;
  foldAngle: number;
  setFoldAngle: React.Dispatch<React.SetStateAction<number>>;
  notation: NotationMode;
  onToggleNotation: () => void;
  showXYZ: boolean;
  onToggleXYZ: () => void;
  showBisectors: boolean;
  setShowBisectors: React.Dispatch<React.SetStateAction<boolean>>;
  dark: boolean;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
  ttsModelTier: TtsModelTier;
  spotlight?: LabSpotlight | null;
  onClearSpotlight?: () => void;
  cameraCommand?: { preset: "iso" | "profile" | "front" | "top"; seq: number } | null;
  sidebarOpen?: boolean;
  onSaveSnapshot: (name: string, pts: GDPoint[]) => void;
  activePresetId: string | null;
  onLoadPreset: (preset: ScenePreset) => void;
}

export function LabStudio({
  points,
  segments,
  setPoints,
  setSegments,
  foldAngle,
  setFoldAngle,
  notation,
  onToggleNotation,
  showXYZ,
  onToggleXYZ,
  showBisectors,
  setShowBisectors,
  dark,
  voice,
  voiceRate,
  customApiKey,
  ttsModelTier,
  spotlight = null,
  onClearSpotlight,
  cameraCommand = null,
  sidebarOpen = false,
  onSaveSnapshot,
  activePresetId,
  onLoadPreset,
}: LabStudioProps) {
  const [selectedId, setSelectedId] = useState<string>(points[0]?.id ?? "");
  const [mobileView, setMobileView] = useState<"3d" | "2d" | "split">("3d");
  const [animatingFold, setAnimatingFold] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const foldDirRef = useRef<1 | -1>(1);

  useEffect(() => {
    if (!points.some((p) => p.id === selectedId) && points.length > 0) {
      setSelectedId(points[0].id);
    }
  }, [points, selectedId]);

  // Smooth 0° <-> 90° rebatimento animation
  useEffect(() => {
    if (!animatingFold) return;
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setFoldAngle((prev) => {
        const next = prev + foldDirRef.current * dt * 42;
        if (next >= 90) {
          setAnimatingFold(false);
          foldDirRef.current = -1;
          return 90;
        }
        if (next <= 0) {
          setAnimatingFold(false);
          foldDirRef.current = 1;
          return 0;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [animatingFold, setFoldAngle]);

  const togglePlayFold = () => {
    if (animatingFold) {
      setAnimatingFold(false);
      return;
    }
    foldDirRef.current = foldAngle >= 85 ? -1 : 1;
    setAnimatingFold(true);
  };

  const selectedPoint = useMemo(
    () => points.find((p) => p.id === selectedId) ?? points[0] ?? null,
    [points, selectedId]
  );

  const selectedInfo = useMemo(() => {
    if (!selectedPoint) return null;
    return classifyPoint(
      selectedPoint.x,
      selectedPoint.y,
      selectedPoint.z,
      selectedPoint.label,
      notation
    );
  }, [selectedPoint, notation]);

  const lineAnalysis = useMemo(() => analyzePointsGeometry(points), [points]);

  const updatePoint = (
    id: string,
    patch: Partial<Pick<GDPoint, "x" | "y" | "z">>
  ) => {
    setPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const addPoint = () => {
    if (points.length >= 6) return;
    const used = new Set(points.map((p) => p.label));
    const alphabet = ["A", "B", "C", "D", "E", "F", "P", "Q"];
    const nextLabel = alphabet.find((l) => !used.has(l)) || `P${points.length + 1}`;
    const nextPoint: GDPoint = {
      id: `pt-${Date.now()}`,
      label: nextLabel,
      x: Math.max(-4, Math.min(4, points.length * 1.5 - 2)),
      y: 3,
      z: 2,
      color: POINT_COLORS[points.length % POINT_COLORS.length],
    };
    setPoints((prev) => [...prev, nextPoint]);
    setSelectedId(nextPoint.id);
  };

  const removePoint = (id: string) => {
    if (points.length <= 1) return;
    setPoints((prev) => prev.filter((p) => p.id !== id));
    setSegments((prev) =>
      prev.filter((s) => s.fromId !== id && s.toId !== id)
    );
  };

  const toggleConnectFirstTwo = () => {
    if (points.length < 2) return;
    if (segments.length > 0) {
      setSegments([]);
      return;
    }
    const segs: GDSegment[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      segs.push({
        id: `seg-${i}`,
        fromId: points[i].id,
        toId: points[i + 1].id,
        label: i === 0 ? "r" : undefined,
        extendLine: i === 0,
      });
    }
    setSegments(segs);
  };

  const buildCurrentNarration = () => {
    const preset = SCENE_PRESETS.find((p) => p.id === activePresetId);
    if (preset && preset.points.length === points.length) {
      const same = preset.points.every(
        (pp, i) =>
          points[i] &&
          pp.x === points[i].x &&
          pp.y === points[i].y &&
          pp.z === points[i].z
      );
      if (same) return preset.narration;
    }
    if (!selectedPoint || !selectedInfo) {
      return "Arraste qualquer projeção na épura para explorar o sistema de Monge em tempo real.";
    }
    return `O ponto ${selectedPoint.label} tem abscissa ${formatSigned(selectedPoint.x)}, afastamento ${formatSigned(selectedPoint.y)} e cota ${formatSigned(selectedPoint.z)}. Ele está em ${selectedInfo.title}. ${selectedInfo.spatialDescription} ${selectedInfo.epuraDescription}`;
  };

  const speakId = "lab-current-scene";
  const isSpeaking = voice.speakingId === speakId;
  const labels = selectedPoint
    ? getProjectionLabels(selectedPoint.label, notation)
    : null;

  const handleSave = () => {
    const preset = SCENE_PRESETS.find((p) => p.id === activePresetId);
    const name =
      preset?.title ||
      (selectedPoint
        ? `Cena ${formatPointCoords(
            selectedPoint.label,
            selectedPoint.x,
            selectedPoint.y,
            selectedPoint.z
          )}`
        : "Minha Prancha");
    onSaveSnapshot(name, points);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Preset Scroller Bar — Horizontal swipe on mobile, clean strip on desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SCENE_PRESETS.map((preset) => {
          const active = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onLoadPreset(preset)}
              className={`shrink-0 text-left px-3.5 py-2 rounded-xl border transition-all ${
                active
                  ? "bg-ink-900 text-paper-50 border-ink-900 shadow-sm dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                  : "bg-paper-50/90 hover:bg-paper-200/70 border-paper-300 text-ink-900 dark:bg-blueprint-900 dark:border-blueprint-700 dark:text-slate-100 dark:hover:bg-blueprint-800"
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  active
                    ? "text-amber-300 dark:text-blueprint-950/80"
                    : "text-ph dark:text-sky-400"
                }`}
              >
                {preset.badge}
              </div>
              <div className="text-xs font-bold leading-snug mt-0.5">
                {preset.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* MOBILE-ONLY Segmented View Control (3D | Épura 2D | Dividido) */}
      <div className="flex lg:hidden items-center justify-between gap-2 bg-paper-200/80 dark:bg-blueprint-900 p-1 rounded-xl border border-paper-300 dark:border-blueprint-700">
        {(
          [
            { id: "3d", label: "Espaço 3D" },
            { id: "2d", label: "Épura 2D" },
            { id: "split", label: "Ambos" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileView(tab.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mobileView === tab.id
                ? "bg-paper-50 text-ink-900 shadow-sm dark:bg-blueprint-700 dark:text-white"
                : "text-ink-500 dark:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN WORKBENCH GRID: Adapts smoothly when the Live Professor Sidebar is docked open */}
      <div
        className={`grid grid-cols-1 gap-4 items-start ${
          sidebarOpen
            ? "2xl:grid-cols-[1fr_320px]"
            : "lg:grid-cols-[1fr_348px]"
        }`}
      >
        {/* LEFT COLUMN: 3D + 2D Synchronized Canvases + Rebatimento Bar */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {/* 3D Canvas */}
            <div
              className={`${
                mobileView === "2d" ? "hidden lg:block" : "block"
              }`}
            >
              <Scene3D
                points={points}
                segments={segments}
                selectedPointId={selectedPoint?.id}
                foldAngle={foldAngle}
                notation={notation}
                showXYZ={showXYZ}
                showBisectors={showBisectors}
                dark={dark}
                spotlight={spotlight}
                cameraCommand={cameraCommand}
                onSelectPoint={setSelectedId}
                className={
                  mobileView === "split"
                    ? "h-[265px] lg:h-[440px]"
                    : "h-[360px] sm:h-[420px] lg:h-[440px]"
                }
              />
            </div>

            {/* 2D Interactive Epura */}
            <div
              className={`${
                mobileView === "3d" ? "hidden lg:block" : "block"
              }`}
            >
              <Epura2D
                points={points}
                segments={segments}
                selectedPointId={selectedPoint?.id}
                notation={notation}
                showXYZ={showXYZ}
                dark={dark}
                interactive
                spotlight={spotlight}
                onClearSpotlight={onClearSpotlight}
                onSelectPoint={setSelectedId}
                onUpdatePoint={updatePoint}
                className="h-full"
              />
            </div>
          </div>

          {/* REBATIMENTO CONTROL BAR (The Star Pedagogical Feature!) */}
          <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={togglePlayFold}
                  className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  {animatingFold ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      {foldAngle >= 85 ? "Desdobrar 3D" : "Animar Épura"}
                    </>
                  )}
                </button>
                <div>
                  <div className="text-xs font-bold text-ink-900 dark:text-slate-100">
                    Rebatimento de Monge ({Math.round(foldAngle)}°)
                  </div>
                  <div className="text-[11px] text-ink-500 dark:text-slate-400">
                    Gire o Plano Horizontal (π) em 90° no sentido horário
                  </div>
                </div>
              </div>

              {/* Quick angle jump buttons */}
              <div className="flex items-center gap-1">
                {[
                  { deg: 0, label: "0° 3D" },
                  { deg: 45, label: "45°" },
                  { deg: 90, label: "90° Épura" },
                ].map((opt) => (
                  <button
                    key={opt.deg}
                    type="button"
                    onClick={() => {
                      setAnimatingFold(false);
                      setFoldAngle(opt.deg);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition ${
                      Math.abs(foldAngle - opt.deg) < 4
                        ? "bg-lt text-white border-lt"
                        : "bg-paper-100 dark:bg-blueprint-800 border-paper-300 dark:border-blueprint-700 text-ink-700 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={Math.round(foldAngle)}
              onChange={(e) => {
                setAnimatingFold(false);
                setFoldAngle(Number(e.target.value));
              }}
              aria-label="Ângulo de rebatimento do plano horizontal"
              className="w-full accent-ph cursor-pointer h-2 rounded-lg"
            />

            {/* Quick Visual Toggles */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={onToggleXYZ}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  showXYZ
                    ? "bg-lt-light text-lt border-lt/40 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700"
                    : "bg-paper-100 text-ink-500 border-paper-300 dark:bg-blueprint-800 dark:text-slate-400 dark:border-blueprint-700"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Eixos XYZ {showXYZ ? "ON" : "OFF"}
              </button>

              <button
                type="button"
                onClick={() => setShowBisectors((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  showBisectors
                    ? "bg-bisector-light text-bisector border-bisector/40 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700"
                    : "bg-paper-100 text-ink-500 border-paper-300 dark:bg-blueprint-800 dark:text-slate-400 dark:border-blueprint-700"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Bissetores β₁₃/β₂₄
              </button>

              <button
                type="button"
                onClick={onToggleNotation}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-paper-100 dark:bg-blueprint-800 border-paper-300 dark:border-blueprint-700 text-ink-700 dark:text-slate-200 hover:bg-paper-200 dark:hover:bg-blueprint-700 transition"
                title="Alternar notação clássica UERJ (A, A') vs ISO (A₁, A₂)"
              >
                Notação:{" "}
                <span className="font-mono font-bold text-ph dark:text-sky-400">
                  {notation === "uerj" ? "UERJ (A, A')" : "ISO (A₁, A₂)"}
                </span>
              </button>

              {points.length >= 2 && (
                <button
                  type="button"
                  onClick={toggleConnectFirstTwo}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    segments.length > 0
                      ? "bg-pv-light text-pv border-pv/40 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700"
                      : "bg-paper-100 text-ink-600 border-paper-300 dark:bg-blueprint-800 dark:text-slate-300 dark:border-blueprint-700"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {segments.length > 0 ? "Reta (r) ligada" : "Unir em Reta (r)"}
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-paper-100 dark:bg-blueprint-800 border-paper-300 dark:border-blueprint-700 text-ink-700 dark:text-slate-200 hover:bg-paper-200 transition"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                {savedFeedback ? "Salvo!" : "Salvar"}
              </button>
            </div>
          </div>

          {/* Line / Multi-point Geometric Insight Banner (UERJ Ex. 1 & Ex. 2 magic!) */}
          {lineAnalysis && segments.length > 0 && (
            <div className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/30 p-3.5 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-bisector shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wide text-bisector dark:text-amber-300">
                  Interpretação Geométrica · {lineAnalysis.summaryTitle}
                </div>
                <p className="text-xs sm:text-sm text-ink-700 dark:text-slate-200 leading-relaxed">
                  {lineAnalysis.summaryText}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT INSPECTOR SIDEBAR (Desktop) / CONTROL STACK (Mobile) */}
        <div className="space-y-3">
          {/* Narrator Card with Prof. Monge */}
          <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft">
            <div className="flex items-center gap-3">
              <ProfessorAvatar
                professor="monge"
                size="md"
                speaking={isSpeaking}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-ink-900 dark:text-white">
                  Prof. Monge · Narrador
                </div>
                <div className="text-[11px] text-ink-500 dark:text-slate-400">
                  {voice.engine === "gemini-3.8"
                    ? `✦ ${voice.modelUsed}`
                    : "Gemini 3.8 TTS · ouça a leitura da cena"}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  voice.speak(
                    speakId,
                    buildCurrentNarration(),
                    "monge",
                    voiceRate,
                    customApiKey,
                    ttsModelTier
                  )
                }
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  isSpeaking
                    ? "bg-pv text-white"
                    : "bg-ink-900 text-paper-50 hover:bg-ink-700 dark:bg-sky-500 dark:text-blueprint-950"
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
          </div>

          {/* Points Roster & Coordinate Editor */}
          <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                Pontos na Prancheta
              </div>
              <button
                type="button"
                onClick={addPoint}
                disabled={points.length >= 6}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-paper-200/80 dark:bg-blueprint-800 hover:bg-paper-300/70 text-xs font-bold text-ink-900 dark:text-slate-100 disabled:opacity-40 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Ponto
              </button>
            </div>

            {/* Point selector tabs */}
            <div className="flex flex-wrap gap-1.5">
              {points.map((pt) => {
                const active = pt.id === selectedPoint?.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setSelectedId(pt.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${
                      active
                        ? "bg-ink-900 text-paper-50 border-ink-900 dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                        : "bg-paper-100 dark:bg-blueprint-800 text-ink-700 dark:text-slate-200 border-paper-300 dark:border-blueprint-700"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: pt.color }}
                    />
                    ({pt.label})
                  </button>
                );
              })}
            </div>

            {selectedPoint && selectedInfo && labels && (
              <>
                {/* Mongean Coordinate Formula Display + Live CG Y-Up Bridge */}
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300/80 dark:border-blueprint-800">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                      GD (Z-Up): (Abscissa ; Afastamento ; Cota)
                    </div>
                    <div className="font-mono text-base font-extrabold text-ink-900 dark:text-white mt-0.5">
                      {formatPointCoords(
                        selectedPoint.label,
                        selectedPoint.x,
                        selectedPoint.y,
                        selectedPoint.z
                      )}
                    </div>
                    {showXYZ && (
                      <div className="text-[10.5px] font-mono text-ink-500 dark:text-slate-400 mt-0.5">
                        3D CG (Y-Up):{" "}
                        <span className="font-bold text-ink-700 dark:text-slate-200">
                          Vector3({formatSigned(selectedPoint.x)},{" "}
                          <span className="text-pv">{formatSigned(selectedPoint.z)}</span>,{" "}
                          <span className="text-ph">{formatSigned(selectedPoint.y)}</span>)
                        </span>
                      </div>
                    )}
                  </div>
                  {points.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePoint(selectedPoint.id)}
                      className="p-2 rounded-lg text-ink-500 hover:text-pv hover:bg-pv-light/70 transition"
                      title="Remover ponto"
                      aria-label="Remover ponto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Tactile Coordinate Sliders + Mobile-Friendly Steppers */}
                <div className="space-y-3">
                  {(
                    [
                      {
                        key: "x" as const,
                        name: "Abscissa",
                        axis: "X",
                        colorText: "text-lt dark:text-teal-400",
                        accent: "accent-lt",
                        helper: "Ao longo da Linha de Terra (LT)",
                      },
                      {
                        key: "y" as const,
                        name: "Afastamento",
                        axis: "Y",
                        colorText: "text-ph dark:text-sky-400",
                        accent: "accent-ph",
                        helper: `Distância a ${labels.pvShort} · Na épura: + desce (${labels.horizontal})`,
                      },
                      {
                        key: "z" as const,
                        name: "Cota",
                        axis: "Z",
                        colorText: "text-pv dark:text-red-400",
                        accent: "accent-pv",
                        helper: `Distância a ${labels.phShort} · Na épura: + sobe (${labels.vertical})`,
                      },
                    ] as const
                  ).map((field) => {
                    const val = selectedPoint[field.key];
                    return (
                      <div key={field.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-ink-900 dark:text-slate-100">
                            {field.name}{" "}
                            {showXYZ && (
                              <span
                                className={`font-mono ${field.colorText}`}
                              >
                                ({field.axis})
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updatePoint(selectedPoint.id, {
                                  [field.key]: Math.max(-5.5, val - 0.5),
                                })
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-paper-300 dark:border-blueprint-700 bg-paper-100 dark:bg-blueprint-800 hover:bg-paper-200"
                              aria-label={`Diminuir ${field.name}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`font-mono font-extrabold w-11 text-center ${field.colorText}`}
                            >
                              {formatSigned(val)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updatePoint(selectedPoint.id, {
                                  [field.key]: Math.min(5.5, val + 0.5),
                                })
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-paper-300 dark:border-blueprint-700 bg-paper-100 dark:bg-blueprint-800 hover:bg-paper-200"
                              aria-label={`Aumentar ${field.name}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={-5}
                          max={5}
                          step={0.5}
                          value={val}
                          onChange={(e) =>
                            updatePoint(selectedPoint.id, {
                              [field.key]: Number(e.target.value),
                            })
                          }
                          className={`w-full h-2 rounded-lg cursor-pointer ${field.accent}`}
                        />
                        <div className="text-[11px] text-ink-500 dark:text-slate-400">
                          {field.helper}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Diedro & Epura Diagnosis Card */}
                <div className="rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/80 dark:bg-blueprint-950 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-ph/15 text-ph dark:bg-sky-500/20 dark:text-sky-300">
                      {selectedInfo.title}
                    </span>
                    <span className="font-mono text-xs font-bold text-ink-500 dark:text-slate-400">
                      (afast; cota) = {selectedInfo.signPattern}
                    </span>
                  </div>

                  {selectedInfo.bisectorLabel && (
                    <div className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-bisector-light text-bisector dark:bg-amber-950/60 dark:text-amber-300">
                      ✦ {selectedInfo.bisectorLabel}
                    </div>
                  )}

                  <p className="text-xs text-ink-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-ink-900 dark:text-white">
                      No espaço 3D:
                    </strong>{" "}
                    {selectedInfo.spatialDescription}
                  </p>
                  <p className="text-xs text-ink-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-ink-900 dark:text-white">
                      Na épura 2D:
                    </strong>{" "}
                    {selectedInfo.epuraDescription}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
