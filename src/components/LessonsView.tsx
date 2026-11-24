"use client";

import React, { useState } from "react";
import { LESSON_CHAPTERS, LessonChapter } from "@/lib/curriculum";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { TtsModelTier, VoiceState } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import { ConceptAnatomyStage } from "./ConceptAnatomyStage";
import { AxisParallelWidget } from "./AxisParallelWidget";
import { MotionVideoPlayer } from "./MotionVideoPlayer";
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Film,
  Lightbulb,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { GDPoint, GDSegment } from "@/lib/gd-math";

interface LessonsViewProps {
  dark: boolean;
  completedLessons: string[];
  watchedEpisodes: string[];
  onEpisodeWatched: (episodeId: string) => void;
  onToggleComplete: (id: string) => void;
  onOpenInLab: (payload: {
    points: GDPoint[];
    segments: GDSegment[];
    foldAngle: number;
    showBisectors?: boolean;
    showXYZ?: boolean;
  }) => void;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
  ttsModelTier: TtsModelTier;
}

type LessonSubTab = "video" | "anatomy" | "parallel" | "chapters";

const DIEDRO_MATRIX = [
  {
    name: "1º Diedro",
    signs: "(+; +)",
    space: "À frente de π' e acima de π",
    pv: "A' ACIMA da LT",
    ph: "A ABAIXO da LT",
    pattern: "Lados opostos (Padrão)",
    color: "border-ph/40 bg-ph-light/60 dark:bg-sky-950/30",
    badge: "bg-ph text-white",
  },
  {
    name: "2º Diedro",
    signs: "(−; +)",
    space: "Atrás de π' e acima de π",
    pv: "A' ACIMA da LT",
    ph: "A ACIMA da LT",
    pattern: "Ambas ACIMA da LT",
    color: "border-lt/40 bg-lt-light/60 dark:bg-teal-950/30",
    badge: "bg-lt text-white",
  },
  {
    name: "3º Diedro",
    signs: "(−; −)",
    space: "Atrás de π' e abaixo de π",
    pv: "A' ABAIXO da LT",
    ph: "A ACIMA da LT",
    pattern: "Lados opostos (Invertido)",
    color: "border-pv/40 bg-pv-light/60 dark:bg-red-950/30",
    badge: "bg-pv text-white",
  },
  {
    name: "4º Diedro",
    signs: "(+; −)",
    space: "À frente de π' e abaixo de π",
    pv: "A' ABAIXO da LT",
    ph: "A ABAIXO da LT",
    pattern: "Ambas ABAIXO da LT",
    color: "border-bisector/40 bg-bisector-light/60 dark:bg-amber-950/30",
    badge: "bg-bisector text-white",
  },
];

export function LessonsView({
  dark,
  completedLessons,
  watchedEpisodes,
  onEpisodeWatched,
  onToggleComplete,
  onOpenInLab,
  voice,
  voiceRate,
  customApiKey,
  ttsModelTier,
}: LessonsViewProps) {
  const [subTab, setSubTab] = useState<LessonSubTab>("video");
  const [activeId, setActiveId] = useState<string>(LESSON_CHAPTERS[0].id);
  const active: LessonChapter =
    LESSON_CHAPTERS.find((c) => c.id === activeId) ?? LESSON_CHAPTERS[0];
  const isDone = completedLessons.includes(active.id);
  const speakId = `lesson-${active.id}`;
  const isSpeaking = voice.speakingId === speakId;

  return (
    <div className="space-y-5">
      {/* Top Interactive Sub-Mode Switcher for the Classroom */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-paper-200/80 dark:bg-blueprint-900 border border-paper-300 dark:border-blueprint-700">
        {(
          [
            {
              id: "video" as const,
              icon: Film,
              title: "Aulas em Vídeo",
              sub: "7 episódios Motion + Lip-Sync",
              accent: "text-bisector dark:text-amber-400",
            },
            {
              id: "anatomy" as const,
              icon: Sparkles,
              title: "O que é o quê?",
              sub: "Animações interativas dos 5 pilares",
              accent: "text-ph dark:text-sky-400",
            },
            {
              id: "parallel" as const,
              icon: ArrowLeftRight,
              title: "3D CG ⇄ GD",
              sub: "Por que altura muda de Y para Z",
              accent: "text-pv dark:text-red-400",
            },
            {
              id: "chapters" as const,
              icon: BookOpen,
              title: "Apostila (01–06)",
              sub: `${completedLessons.length}/${LESSON_CHAPTERS.length} capítulos · UERJ`,
              accent: "text-lt dark:text-teal-400",
            },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const selected = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sfx.click();
                setSubTab(item.id);
              }}
              className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl text-left transition-all ${
                selected
                  ? "bg-paper-50 dark:bg-blueprint-800 shadow-sm ring-1 ring-ink-900/10 dark:ring-sky-400/30"
                  : "hover:bg-paper-50/50 dark:hover:bg-blueprint-800/50 opacity-80 hover:opacity-100"
              }`}
            >
              <span
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  selected
                    ? "bg-ink-900 text-paper-50 dark:bg-sky-500 dark:text-blueprint-950"
                    : "bg-paper-100 dark:bg-blueprint-950 " + item.accent
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-ink-900 dark:text-white truncate">
                  {item.title}
                </div>
                <div className="text-[10.5px] sm:text-[11px] text-ink-500 dark:text-slate-400 truncate">
                  {item.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 0: CINEMATIC MOTION-DESIGN VIDEO THEATER WITH REAL-TIME LIP-SYNC MASCOT */}
      {subTab === "video" && (
        <MotionVideoPlayer
          watchedEpisodes={watchedEpisodes}
          onEpisodeWatched={onEpisodeWatched}
          onOpenInLab={onOpenInLab}
        />
      )}

      {/* SUB-TAB 1: ANIMATED CONCEPT EXPLORER ("O QUE É O QUÊ?") */}
      {subTab === "anatomy" && (
        <div className="space-y-4">
          <ConceptAnatomyStage
            dark={dark}
            voice={voice}
            voiceRate={voiceRate}
            customApiKey={customApiKey}
            ttsModelTier={ttsModelTier}
            onOpenLabWithPoint={(x, y, z) =>
              onOpenInLab({
                points: [{ id: "a", label: "A", x, y, z, color: "#1E56A0" }],
                segments: [],
                foldAngle: 0,
                showXYZ: true,
              })
            }
          />

          {/* Quick bridge card straight to Y-Up vs Z-Up */}
          <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ProfessorAvatar professor="monge" size="md" mood="excited" />
              <div>
                <div className="text-xs font-extrabold text-ink-900 dark:text-white">
                  Vem do 3D da Computação (Unity, Three.js, Games)?
                </div>
                <div className="text-xs text-ink-500 dark:text-slate-400">
                  Veja o comparador animado mostrando por que a Cota (altura) muda de Y para Z!
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubTab("parallel")}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-pv hover:bg-pv-dark text-white text-xs font-bold transition"
            >
              Ver Paralelo Y-Up ⇄ Z-Up <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CG 3D (Y-Up) vs ACADEMIC GD (Z-Up) PARALLEL */}
      {subTab === "parallel" && (
        <AxisParallelWidget
          dark={dark}
          voice={voice}
          voiceRate={voiceRate}
          customApiKey={customApiKey}
          ttsModelTier={ttsModelTier}
        />
      )}

      {/* SUB-TAB 3: FULL 6-CHAPTER SYLLABUS */}
      {subTab === "chapters" && (
        <div className="grid grid-cols-1 lg:grid-cols-[310px_1fr] gap-5 items-start animate-fade-up">
          {/* Chapter Index */}
          <aside className="space-y-3">
            <div className="hidden lg:block px-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                Trilha Guiada · Monge &amp; UERJ
              </div>
              <div className="text-sm font-bold text-ink-900 dark:text-white mt-0.5">
                {completedLessons.length} de {LESSON_CHAPTERS.length} capítulos concluídos
              </div>
              <div className="w-full h-2 rounded-full bg-paper-200 dark:bg-blueprint-800 mt-2 overflow-hidden">
                <div
                  className="h-full bg-lt transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.round(
                      (completedLessons.length / LESSON_CHAPTERS.length) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 no-scrollbar">
              {LESSON_CHAPTERS.map((chap) => {
                const selected = chap.id === active.id;
                const done = completedLessons.includes(chap.id);
                return (
                  <button
                    key={chap.id}
                    type="button"
                    onClick={() => setActiveId(chap.id)}
                    className={`shrink-0 w-[235px] lg:w-full text-left p-3 rounded-2xl border transition-all ${
                      selected
                        ? "bg-ink-900 text-paper-50 border-ink-900 shadow-draft dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                        : "bg-paper-50 dark:bg-blueprint-900 border-paper-300 dark:border-blueprint-700 hover:bg-paper-200/60 dark:hover:bg-blueprint-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono text-[11px] font-extrabold ${
                          selected
                            ? "text-amber-300 dark:text-blueprint-950/80"
                            : "text-ph dark:text-sky-400"
                        }`}
                      >
                        {chap.number} · {chap.tag}
                      </span>
                      {done && (
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            selected
                              ? "text-emerald-300 dark:text-blueprint-950"
                              : "text-lt"
                          }`}
                        />
                      )}
                    </div>
                    <div className="text-sm font-bold mt-1 leading-snug">
                      {chap.title}
                    </div>
                    <div
                      className={`text-[11px] mt-1 ${
                        selected
                          ? "text-paper-200/80 dark:text-blueprint-950/75"
                          : "text-ink-500 dark:text-slate-400"
                      }`}
                    >
                      {chap.duration} · Prof. Monge
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Chapter Reading & Interactive Experience */}
          <article className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 sm:p-7 shadow-draft space-y-6">
            <header className="space-y-3 border-b border-paper-200 dark:border-blueprint-800 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-ph-light text-ph dark:bg-sky-950 dark:text-sky-300">
                  <BookOpen className="w-3.5 h-3.5" />
                  Capítulo {active.number} · {active.tag}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenInLab({
                      points: active.interactivePreset.points,
                      segments: active.interactivePreset.segments,
                      foldAngle: active.interactivePreset.defaultFold,
                      showBisectors: active.interactivePreset.showBisectors,
                      showXYZ: active.interactivePreset.showXYZ,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <Compass className="w-3.5 h-3.5" />
                  {active.interactivePreset.ctaLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white tracking-tight">
                {active.title}
              </h2>
              <p className="text-sm sm:text-base text-ink-500 dark:text-slate-300">
                {active.subtitle}
              </p>

              {/* Professor Audio Briefing Card (Gemini 3.8 TTS) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-3.5 rounded-2xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300/80 dark:border-blueprint-800">
                <div className="flex items-center gap-3 flex-1">
                  <ProfessorAvatar
                    professor="monge"
                    size="md"
                    mood={isSpeaking ? "explaining" : "friendly"}
                    speaking={isSpeaking}
                  />
                  <div>
                    <div className="text-xs font-extrabold text-ink-900 dark:text-white">
                      Prof. Monge explica em voz alta
                    </div>
                    <div className="text-[11px] text-ink-500 dark:text-slate-400 font-mono">
                      Motor: {ttsModelTier} (com fallback pt-BR)
                    </div>
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
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                    isSpeaking
                      ? "bg-pv text-white"
                      : "bg-ink-900 text-paper-50 hover:bg-ink-700 dark:bg-sky-500 dark:text-blueprint-950"
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" /> Parar áudio
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" /> Ouvir explicação
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* Key Takeaways Checklist */}
            <section className="rounded-2xl bg-paper-100/90 dark:bg-blueprint-950 border border-paper-300/70 dark:border-blueprint-800 p-4 space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-lt dark:text-teal-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                O que você precisa dominar neste capítulo
              </div>
              <ul className="space-y-2">
                {active.keyTakeaways.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-slate-200"
                  >
                    <span className="mt-1 w-4 h-4 rounded-full bg-lt/15 text-lt font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Special XYZ vs GD Highlight Card */}
            {active.xyzNote && (
              <section className="rounded-2xl border-2 border-pv/35 bg-pv-light/50 dark:bg-red-950/25 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-pv dark:text-red-300">
                    ⚡ Respondendo sua dúvida da Aula 1: XYZ confunde?
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubTab("parallel")}
                    className="text-xs font-bold text-ph dark:text-sky-400 hover:underline"
                  >
                    Abrir comparador Y-Up ⇄ Z-Up →
                  </button>
                </div>
                <h3 className="text-base font-bold text-ink-900 dark:text-white">
                  {active.xyzNote.title}
                </h3>
                <p className="text-sm text-ink-700 dark:text-slate-200 leading-relaxed">
                  {active.xyzNote.body}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="rounded-xl bg-paper-50 dark:bg-blueprint-900 border border-lt/40 p-2.5 text-center">
                    <div className="font-mono text-sm font-extrabold text-lt">
                      1º · X
                    </div>
                    <div className="text-xs font-bold text-ink-900 dark:text-white">
                      Abscissa
                    </div>
                    <div className="text-[11px] text-ink-500 dark:text-slate-400">
                      Anda na LT
                    </div>
                  </div>
                  <div className="rounded-xl bg-paper-50 dark:bg-blueprint-900 border border-ph/40 p-2.5 text-center">
                    <div className="font-mono text-sm font-extrabold text-ph">
                      2º · Y
                    </div>
                    <div className="text-xs font-bold text-ink-900 dark:text-white">
                      Afastamento
                    </div>
                    <div className="text-[11px] text-ph font-semibold">
                      + DESCE na épura!
                    </div>
                  </div>
                  <div className="rounded-xl bg-paper-50 dark:bg-blueprint-900 border border-pv/40 p-2.5 text-center">
                    <div className="font-mono text-sm font-extrabold text-pv">
                      3º · Z
                    </div>
                    <div className="text-xs font-bold text-ink-900 dark:text-white">
                      Cota (Altura)
                    </div>
                    <div className="text-[11px] text-pv font-semibold">
                      + SOBE na épura!
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Special 4 Diedros Visual Matrix */}
            {active.id === "03-quatro-diedros" && (
              <section className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                  Mapa Visual dos 4 Diedros (Bússola de Sinais)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIEDRO_MATRIX.map((d) => (
                    <div
                      key={d.name}
                      className={`rounded-2xl border p-4 space-y-2 ${d.color}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${d.badge}`}
                        >
                          {d.name}
                        </span>
                        <span className="font-mono text-xs font-extrabold text-ink-900 dark:text-white">
                          (afast; cota) = {d.signs}
                        </span>
                      </div>
                      <p className="text-xs text-ink-700 dark:text-slate-200">
                        {d.space}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono font-bold pt-1">
                        <span className="px-2 py-1 rounded-lg bg-paper-50/90 dark:bg-blueprint-900 text-pv">
                          {d.pv}
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-paper-50/90 dark:bg-blueprint-900 text-ph">
                          {d.ph}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-ink-600 dark:text-slate-300">
                        ↳ {d.pattern}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mnemonic Tip Box */}
            {active.mnemonic && (
              <section className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-bisector shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-bisector dark:text-amber-300">
                    Macete Didático · {active.mnemonic.title}
                  </div>
                  <p className="text-sm text-ink-700 dark:text-slate-200 mt-1 leading-relaxed">
                    {active.mnemonic.body}
                  </p>
                </div>
              </section>
            )}

            {/* Prose Sections */}
            <div className="space-y-5">
              {active.sections.map((sec, idx) => (
                <section key={idx} className="space-y-2.5">
                  <h3 className="text-lg font-bold text-ink-900 dark:text-white">
                    {sec.heading}
                  </h3>
                  {sec.paragraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-sm sm:text-[15px] text-ink-700 dark:text-slate-200 leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
                  {sec.callout && (
                    <div className="p-3.5 rounded-xl border-l-4 border-ph bg-ph-light/60 dark:bg-sky-950/40 text-xs sm:text-sm font-medium text-ink-900 dark:text-slate-100">
                      {sec.callout}
                    </div>
                  )}
                </section>
              ))}
            </div>

                {/* Contextual Author / Editorial Illustration Card */}
                {(active.id === "01-problema-monge" ||
                  active.id === "04-rebatimento-epura" ||
                  active.id === "02-coordenadas-xyz" ||
                  active.id === "06-uerj-aula1-resolucao") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {(active.id === "01-problema-monge" ||
                      active.id === "04-rebatimento-epura") && (
                      <figure className="flex items-center gap-3 p-3 rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/80 dark:bg-blueprint-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/illustrations/gaspard-monge.png"
                          alt="Retrato de Gaspard Monge (1746–1818)"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-paper-300 dark:border-blueprint-700"
                        />
                        <figcaption className="text-xs space-y-0.5">
                          <div className="font-extrabold text-ink-900 dark:text-white">
                            Gaspard Monge (1746–1818)
                          </div>
                          <div className="text-[11px] text-ink-500 dark:text-slate-400 leading-snug">
                            Matemático francês criador da Geometria Descritiva (1799) — projetando 3D em 2 planos a 90°.
                          </div>
                        </figcaption>
                      </figure>
                    )}

                    {active.id === "01-problema-monge" && (
                      <figure className="flex items-center gap-3 p-3 rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/80 dark:bg-blueprint-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/illustrations/fly-room-3d.png"
                          alt="Ilustração da mosca no quarto com projeções em π e π'"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-paper-300 dark:border-blueprint-700"
                        />
                        <figcaption className="text-xs space-y-0.5">
                          <div className="font-extrabold text-ink-900 dark:text-white">
                            A Mosca na Sala (2 Projeções)
                          </div>
                          <div className="text-[11px] text-ink-500 dark:text-slate-400 leading-snug">
                            Sombra no chão (π) + sombra na parede (π&apos;) travam a posição espacial exata.
                          </div>
                        </figcaption>
                      </figure>
                    )}

                    {(active.id === "02-coordenadas-xyz" ||
                      active.id === "06-uerj-aula1-resolucao") && (
                      <figure className="flex items-center gap-3 p-3 rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/80 dark:bg-blueprint-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/illustrations/uerj-atelier.png"
                          alt="Prancheta de desenho técnico da UERJ"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-paper-300 dark:border-blueprint-700"
                        />
                        <figcaption className="text-xs space-y-0.5">
                          <div className="font-extrabold text-ink-900 dark:text-white">
                            Prancheta Clássica (UERJ)
                          </div>
                          <div className="text-[11px] text-ink-500 dark:text-slate-400 leading-snug">
                            Convenção de Príncipe Júnior &amp; Álvaro Rodrigues: (A) no espaço, A em π, A&apos; em π&apos;.
                          </div>
                        </figcaption>
                      </figure>
                    )}

                    {active.id === "02-coordenadas-xyz" && (
                      <figure className="flex items-center gap-3 p-3 rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/80 dark:bg-blueprint-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/illustrations/cg-vs-cad.png"
                          alt="Monitor 3D Y-Up comparado à prancheta Z-Up"
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-paper-300 dark:border-blueprint-700"
                        />
                        <figcaption className="text-xs space-y-0.5">
                          <div className="font-extrabold text-ink-900 dark:text-white">
                            3D Games (Y-Up) ⇄ GD (Z-Up)
                          </div>
                          <div className="text-[11px] text-ink-500 dark:text-slate-400 leading-snug">
                            Cota muda de Y para Z na Academia!
                          </div>
                        </figcaption>
                      </figure>
                    )}
                  </div>
                )}

                <footer className="pt-4 border-t border-paper-200 dark:border-blueprint-800 space-y-4">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                  Fontes Didáticas &amp; Bibliografia Clássica (UERJ / Brasil)
                </div>
                <ul className="mt-1.5 space-y-1">
                  {active.references.map((ref, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-ink-500 dark:text-slate-400"
                    >
                      • {ref}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isDone) sfx.success();
                    else sfx.tick();
                    onToggleComplete(active.id);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                    isDone
                      ? "bg-lt text-white border-lt"
                      : "bg-paper-100 dark:bg-blueprint-800 border-paper-300 dark:border-blueprint-700 text-ink-900 dark:text-white hover:bg-paper-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isDone
                    ? "Capítulo Concluído (+25 XP)"
                    : "Marcar como Concluído"}
                </button>

                {LESSON_CHAPTERS.findIndex((c) => c.id === active.id) <
                  LESSON_CHAPTERS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isDone) onToggleComplete(active.id);
                      const nextIdx =
                        LESSON_CHAPTERS.findIndex((c) => c.id === active.id) +
                        1;
                      setActiveId(LESSON_CHAPTERS[nextIdx].id);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 text-xs font-bold hover:opacity-90 transition"
                  >
                    Próximo Capítulo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
