"use client";

import React, { useMemo, useState } from "react";
import {
  CALC_EXERCISES,
  CalcExerciseTrack,
} from "@/lib/calc-exercises";
import { CalcLabState } from "@/lib/calc-math";
import { sfx } from "@/lib/sfx";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Flame,
  Lightbulb,
  XCircle,
} from "lucide-react";

interface CalcPracticeArenaProps {
  xp: number;
  streak: number;
  onRecordAnswer: (topicKey: string, correct: boolean, xpEarned: number) => void;
  onOpenInCalcLab: (state: CalcLabState) => void;
}

const TRACKS: Array<{ id: CalcExerciseTrack; label: string; sub: string }> = [
  { id: "precalc_sets", label: "Pré-Cálculo · Conjuntos", sub: "ℕ/ℤ/ℚ/ℝ, Intervalos & Inequações" },
  { id: "precalc_func", label: "Pré-Cálculo · Funções", sub: "Definição, Domínio Natural & Raiz" },
  { id: "calc_limits", label: "P1 · Limites & TVI", sub: "0/0, Laterais & Continuidade" },
  { id: "calc_derivatives", label: "P2 · Derivadas", sub: "Tangente, Cadeia & Bicos" },
  { id: "calc_integrals", label: "P3 · Integrais", sub: "Primitivas +C & ln|x|" },
];

export function CalcPracticeArena({
  xp,
  streak,
  onRecordAnswer,
  onOpenInCalcLab,
}: CalcPracticeArenaProps) {
  const [track, setTrack] = useState<CalcExerciseTrack>("precalc_sets");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const list = useMemo(
    () => CALC_EXERCISES.filter((e) => e.track === track),
    [track]
  );
  const exercise = list[qIndex % Math.max(1, list.length)] ?? CALC_EXERCISES[0];
  const answered = selected !== null;
  const isCorrect = selected === exercise.correctIndex;

  const choose = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    const ok = idx === exercise.correctIndex;
    if (ok) sfx.success();
    else sfx.tick();
    onRecordAnswer(exercise.track, ok, ok ? exercise.xp : 0);
  };

  const nextQuestion = () => {
    sfx.click();
    setSelected(null);
    setShowHint(false);
    setQIndex((prev) => (prev + 1) % list.length);
  };

  return (
    <div className="space-y-4">
      {/* Track Selector + XP Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TRACKS.map((t) => {
            const active = track === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  sfx.click();
                  setTrack(t.id);
                  setQIndex(0);
                  setSelected(null);
                  setShowHint(false);
                }}
                className={`px-3 py-2 rounded-xl border text-left transition ${
                  active
                    ? "bg-ink-900 text-paper-50 border-ink-900 dark:bg-sky-500 dark:text-blueprint-950"
                    : "bg-paper-50 dark:bg-blueprint-900 text-ink-700 dark:text-slate-300 border-paper-300 dark:border-blueprint-700"
                }`}
              >
                <div className="text-xs font-extrabold">{t.label}</div>
                <div className="text-[10px] opacity-75">{t.sub}</div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300/60 dark:border-amber-800 text-bisector dark:text-amber-300 font-mono text-xs font-extrabold">
            <Award className="w-3.5 h-3.5" /> {xp} XP
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-100/80 dark:bg-orange-950/40 border border-orange-300/60 dark:border-orange-800 text-orange-700 dark:text-orange-300 font-mono text-xs font-extrabold">
            <Flame className="w-3.5 h-3.5" /> {streak}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 sm:p-6 shadow-draft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-full bg-ph/15 dark:bg-sky-500/20 text-ph dark:text-sky-300 font-mono text-[11px] font-extrabold">
            {exercise.badge} · Questão {(qIndex % list.length) + 1}/{list.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold"
            >
              <Lightbulb className="w-3.5 h-3.5" /> Dica
            </button>
            {exercise.labState && (
              <button
                type="button"
                onClick={() => onOpenInCalcLab(exercise.labState!)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ph/15 dark:bg-sky-500/20 text-ph dark:text-sky-300 text-xs font-bold"
              >
                <Compass className="w-3.5 h-3.5" /> Ver no Lab
              </button>
            )}
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-ink-900 dark:text-white leading-snug">
          {exercise.prompt}
        </h3>

        {showHint && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-700 text-xs text-ink-700 dark:text-amber-100">
            <Lightbulb className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-amber-500" />
            <strong>Dica:</strong> {exercise.hint}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {exercise.options.map((opt, idx) => {
            const picked = selected === idx;
            const correct = idx === exercise.correctIndex;
            let cls =
              "bg-paper-100 dark:bg-blueprint-950 border-paper-300 dark:border-blueprint-700 hover:border-ph text-ink-800 dark:text-slate-100";
            if (answered) {
              if (correct) {
                cls =
                  "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200";
              } else if (picked && !correct) {
                cls =
                  "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200";
              } else {
                cls =
                  "bg-paper-100/50 dark:bg-blueprint-950/50 border-paper-200 dark:border-blueprint-800 opacity-60";
              }
            }
            return (
              <button
                key={idx}
                type="button"
                disabled={answered}
                onClick={() => choose(idx)}
                className={`p-3.5 rounded-2xl border text-left text-sm font-semibold transition flex items-start gap-2.5 ${cls}`}
              >
                <span className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isCorrect
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400/60"
                : "bg-red-50 dark:bg-red-950/30 border-red-400/60"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase ${
                  isCorrect
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Resposta Correta (+{exercise.xp} XP)
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Quase lá! Veja a resolução:
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={nextQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 text-xs font-extrabold"
              >
                Próxima <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-ink-800 dark:text-slate-100 leading-relaxed">
              {exercise.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
