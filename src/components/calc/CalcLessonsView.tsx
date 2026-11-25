"use client";

import React, { useState } from "react";
import { CALC_LESSONS, CalcLessonChapter } from "@/lib/calc-curriculum";
import { CalcLabState } from "@/lib/calc-math";
import { ProfessorAvatar } from "@/components/ProfessorAvatar";
import { TtsModelTier, VoiceState } from "@/lib/voice";
import { sfx } from "@/lib/sfx";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";

interface CalcLessonsViewProps {
  completedLessons: string[];
  onToggleComplete: (id: string) => void;
  onOpenInCalcLab: (state: CalcLabState) => void;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
  ttsModelTier: TtsModelTier;
}

export function CalcLessonsView({
  completedLessons,
  onToggleComplete,
  onOpenInCalcLab,
  voice,
  voiceRate,
  customApiKey,
  ttsModelTier,
}: CalcLessonsViewProps) {
  const [activeId, setActiveId] = useState<string>(CALC_LESSONS[0].id);
  const active: CalcLessonChapter =
    CALC_LESSONS.find((l) => l.id === activeId) ?? CALC_LESSONS[0];

  const isDone = completedLessons.includes(active.id);
  const speakId = `calc-lesson-${active.id}`;
  const isSpeaking = voice.speakingId === speakId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[310px_1fr] gap-5 items-start">
      {/* Chapter Index */}
      <aside className="space-y-3">
        <div className="hidden lg:block px-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
            Trilha Guiada · Cálculo I (UERJ)
          </div>
          <div className="text-sm font-bold text-ink-900 dark:text-white mt-0.5">
            {completedLessons.length} de {CALC_LESSONS.length} aulas concluídas
          </div>
          <div className="w-full h-2 rounded-full bg-paper-200 dark:bg-blueprint-800 mt-2 overflow-hidden">
            <div
              className="h-full bg-lt transition-all duration-500 rounded-full"
              style={{
                width: `${Math.round(
                  (completedLessons.length / CALC_LESSONS.length) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 no-scrollbar">
          {CALC_LESSONS.map((chap) => {
            const selected = chap.id === active.id;
            const done = completedLessons.includes(chap.id);
            return (
              <button
                key={chap.id}
                type="button"
                onClick={() => {
                  sfx.click();
                  setActiveId(chap.id);
                }}
                className={`shrink-0 w-[245px] lg:w-full text-left p-3 rounded-2xl border transition-all ${
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
                    {chap.number} · {chap.examBadge}
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
                  className={`text-[11px] mt-1 line-clamp-1 ${
                    selected
                      ? "text-paper-300 dark:text-blueprint-950/75"
                      : "text-ink-500 dark:text-slate-400"
                  }`}
                >
                  {chap.duration} · {chap.tag}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Active Lesson Content */}
      <article className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 sm:p-7 shadow-draft space-y-5">
        <header className="space-y-2.5 border-b border-paper-200 dark:border-blueprint-800 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ph/15 dark:bg-sky-500/20 text-ph dark:text-sky-300 font-mono text-[11px] font-extrabold">
              {active.number} · {active.tag}
            </span>
            {active.notebookRef && (
              <span className="text-[11px] font-mono text-ink-500 dark:text-slate-400">
                {active.notebookRef}
              </span>
            )}
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white leading-tight">
            {active.title}
          </h2>
          <p className="text-sm text-ink-600 dark:text-slate-300 leading-relaxed">
            {active.summary}
          </p>

          {/* Voice Narration Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <ProfessorAvatar professor="monge" size="sm" speaking={isSpeaking} />
              <div className="text-xs">
                <div className="font-extrabold text-ink-900 dark:text-white">
                  Explicação em Áudio · {active.duration}
                </div>
                <div className="text-ink-500 dark:text-slate-400">
                  Ouça o resumo falado enquanto acompanha os exemplos
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
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

        {/* Formulas Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {active.formulas.map((f) => (
            <div
              key={f.label}
              className="rounded-2xl border border-paper-300/80 dark:border-blueprint-700 bg-paper-100/80 dark:bg-blueprint-950 p-3.5 space-y-1"
            >
              <div className="text-[10px] font-mono font-extrabold uppercase text-ph dark:text-sky-400">
                {f.label}
              </div>
              <div className="font-mono text-xs sm:text-sm font-extrabold text-ink-900 dark:text-white">
                {f.expr}
              </div>
              <div className="text-[11px] text-ink-500 dark:text-slate-400">
                {f.note}
              </div>
            </div>
          ))}
        </section>

        {/* Key Takeaways */}
        <section className="rounded-2xl bg-paper-100/90 dark:bg-blueprint-950 border border-paper-300/70 dark:border-blueprint-800 p-4 space-y-2.5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-lt dark:text-teal-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            O que você precisa dominar nesta aula
          </div>
          <ul className="space-y-2">
            {active.keyTakeaways.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-slate-200"
              >
                <span className="mt-0.5 w-5 h-5 rounded-full bg-lt/15 text-lt font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Watch Out / Pitfall */}
        <section className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/30 p-4 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-bisector dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Pegadinha de Prova
          </div>
          <p className="text-sm text-ink-800 dark:text-amber-100 leading-relaxed">
            {active.watchOut}
          </p>
        </section>

        {/* Reproduce Examples Directly in Cálculo 1 Lab! */}
        <section className="space-y-2.5">
          <div className="text-xs font-mono font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
            Reproduzir Exemplos desta Aula no Lab de Funções:
          </div>
          <div className="flex flex-wrap gap-2">
            {active.examples.map((ex) => (
              <button
                key={ex.id}
                type="button"
                data-calc-example={ex.id}
                onClick={() => {
                  sfx.click();
                  onOpenInCalcLab(ex.labState);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold transition shadow-sm"
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>{ex.label}</span>
                <span className="font-mono text-[10.5px] bg-white/15 px-1.5 py-0.5 rounded-md">
                  {ex.formula}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Footer actions */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-paper-200 dark:border-blueprint-800">
          <button
            type="button"
            onClick={() => {
              sfx.success();
              onToggleComplete(active.id);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
              isDone
                ? "bg-emerald-600 text-white"
                : "bg-paper-200 dark:bg-blueprint-800 text-ink-900 dark:text-white hover:bg-paper-300/80"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isDone ? "Aula Concluída (+25 XP)" : "Marcar Aula como Concluída (+25 XP)"}
          </button>

          {(() => {
            const idx = CALC_LESSONS.findIndex((c) => c.id === active.id);
            const next = CALC_LESSONS[idx + 1];
            if (!next) return null;
            return (
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setActiveId(next.id);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 text-xs font-extrabold transition"
              >
                Próxima: {next.number} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            );
          })()}
        </footer>
      </article>
    </div>
  );
}
