"use client";

import React, { useMemo, useState } from "react";
import {
  ExerciseMode,
  GeneratedExercise,
  generateExercise,
} from "@/lib/exercises";
import {
  formatPointCoords,
  formatSigned,
  GDPoint,
  GDSegment,
  NotationMode,
  SCENE_PRESETS,
} from "@/lib/gd-math";
import { Epura2D } from "./Epura2D";
import { Scene3D } from "./Scene3D";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { VoiceState } from "@/lib/voice";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Flame,
  HelpCircle,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";

interface PracticeArenaProps {
  notation: NotationMode;
  dark: boolean;
  xp: number;
  streak: number;
  uerjChecklist: Record<string, boolean>;
  onToggleUerjItem: (key: string) => void;
  onRecordAnswer: (
    topicKey: GeneratedExercise["topicKey"],
    correct: boolean,
    xpEarned: number
  ) => void;
  onOpenInLab: (payload: {
    points: GDPoint[];
    segments: GDSegment[];
    foldAngle: number;
    showBisectors?: boolean;
  }) => void;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
}

type PracticeTab =
  | "uerj_sheet"
  | "draw_epura"
  | "read_epura"
  | "identify_diedro"
  | "special_cases"
  | "coord_order";

const UERJ_EXERCISES = [
  {
    id: "ex1",
    presetId: "uerj-ex1",
    badge: "EXERCÍCIO 1 · AULA 1 UERJ",
    coords: "(A)(+2; +5; +3)  e  (B)(−2; −5; −3)",
    steps: [
      {
        key: "ex1-1",
        text: "1. Faça a representação espacial dos pontos.",
        answer:
          "(A) está no 1º Diedro (+2 à direita na LT, +5 à frente de π', +3 acima de π). (B) está no 3º Diedro (−2 à esquerda na LT, −5 atrás de π', −3 abaixo de π).",
      },
      {
        key: "ex1-2",
        text: "2. Una os pontos e interprete o que acontece.",
        answer:
          "Como (B) = −(A), os pontos são simétricos em relação à origem O(0; 0; 0). O segmento (A)(B) atravessa exatamente a Linha de Terra na origem, indo direto do 1º para o 3º Diedro!",
      },
      {
        key: "ex1-3",
        text: "3. Crie a reta (r) que contém (A) e (B) e suas projeções.",
        answer:
          "A reta (r) é uma reta concorrente com a Linha de Terra em O(0; 0; 0). Sua projeção vertical r' une A' a B' e sua projeção horizontal r une A a B.",
      },
      {
        key: "ex1-4",
        text: "4. Faça a épura dos pontos, do segmento e da reta (r).",
        answer:
          "Em x=+2: A' sobe 3 e A desce 5. Em x=−2: B' desce 3 e B sobe 5. Na épura, as retas r' (A'–B') e r (A–B) cruzam a LT exatamente no ponto O(0; 0)!",
      },
    ],
    narration:
      "Vamos conferir o Exercício 1 da sua folha! Primeiro, localize A no primeiro diedro e B no terceiro diedro. Ao ligar A e B, note a simetria perfeita: a reta passa bem pela origem zero, zero, zero na Linha de Terra! Na épura, A linha fica 3 acima e A fica 5 abaixo; B linha fica 3 abaixo e B fica 5 acima. Quando você traça r linha e r com a régua, as duas linhas se cruzam exatamente no zero da Linha de Terra!",
  },
  {
    id: "ex2",
    presetId: "uerj-ex2",
    badge: "EXERCÍCIO 2 · AULA 1 UERJ",
    coords: "(A)(+1; +2; +3),  (B)(+2; +3; +4)  e  (C)(+3; +4; +5)",
    steps: [
      {
        key: "ex2-1",
        text: "1. Faça a representação espacial dos pontos.",
        answer:
          "Os três pontos possuem afastamento positivo e cota positiva: todos estão no 1º Diedro, subindo em escada regular de passo (+1; +1; +1).",
      },
      {
        key: "ex2-2",
        text: "2. Una os pontos e interprete o que acontece.",
        answer:
          "PEGADINHA CLÁSSICA! Como B − A = (+1; +1; +1) e C − B = (+1; +1; +1), os três pontos são COLINEARES! Eles NÃO formam um triângulo — formam um único segmento de reta no 1º Diedro com (B) no ponto médio de (A)(C)!",
      },
      {
        key: "ex2-3",
        text: "3. Faça a épura dos pontos e da figura formada.",
        answer:
          "Na épura: A', B', C' ficam alinhados a +45° acima da LT (cotas +3, +4, +5) e A, B, C ficam alinhados a −45° abaixo da LT (afastamentos +2, +3, +4). Bônus: como cota − afastamento = +1 constante, a reta é paralela ao 1º Bissetor (β₁₃)!",
      },
    ],
    narration:
      "Agora o Exercício 2 da sua folha! Todos os três pontos estão no primeiro diedro, e repare na diferença entre eles: de A para B somamos um em cada coordenada, e de B para C somamos um de novo! Por isso, ao unir os três pontos, eles não formam um triângulo — eles são perfeitamente colineares! Na épura, a projeção vertical sobe a 45 graus acima da Linha de Terra e a projeção horizontal desce a 45 graus abaixo, mostrando que essa reta é paralela ao primeiro bissetor!",
  },
];

export function PracticeArena({
  notation,
  dark,
  xp,
  streak,
  uerjChecklist,
  onToggleUerjItem,
  onRecordAnswer,
  onOpenInLab,
  voice,
  voiceRate,
  customApiKey,
}: PracticeArenaProps) {
  const [tab, setTab] = useState<PracticeTab>("uerj_sheet");
  const [difficulty, setDifficulty] = useState<1 | 2>(1);
  const [activeUerj, setActiveUerj] = useState<"ex1" | "ex2">("ex1");
  const [uerjFold, setUerjFold] = useState<number>(0);
  const [revealedSteps, setRevealedSteps] = useState<Record<string, boolean>>({});

  // Generated exercise state
  const [exercise, setExercise] = useState<GeneratedExercise>(() =>
    generateExercise("draw_epura", 1)
  );
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  // Multiple choice state
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Draw Epura interactive placement state
  const [activeTarget, setActiveTarget] = useState<"pv" | "ph">("pv");
  const [placedPv, setPlacedPv] = useState<{ x: number; z: number } | null>(null);
  const [placedPh, setPlacedPh] = useState<{ x: number; y: number } | null>(null);

  // Read Epura reverse input state
  const [guessX, setGuessX] = useState<number>(0);
  const [guessY, setGuessY] = useState<number>(0);
  const [guessZ, setGuessZ] = useState<number>(0);

  const loadNewExercise = (mode: ExerciseMode, diff: 1 | 2 = difficulty) => {
    setExercise(generateExercise(mode, diff));
    setShowHint(false);
    setResult(null);
    setSelectedChoice(null);
    setActiveTarget("pv");
    setPlacedPv(null);
    setPlacedPh(null);
    setGuessX(0);
    setGuessY(0);
    setGuessZ(0);
  };

  const handleTabSwitch = (nextTab: PracticeTab) => {
    setTab(nextTab);
    if (nextTab !== "uerj_sheet") {
      loadNewExercise(nextTab, difficulty);
    }
  };

  const checkChoice = (choiceId: string) => {
    if (result) return;
    setSelectedChoice(choiceId);
    const correct = choiceId === exercise.correctChoiceId;
    setResult({
      correct,
      message: correct ? "Perfeito! Visão espacial afiada." : "Quase! Veja o porquê abaixo:",
    });
    onRecordAnswer(exercise.topicKey, correct, correct ? 20 : 5);
  };

  const checkDrawEpura = () => {
    if (!placedPv || !placedPh || result) return;
    const p = exercise.point;
    const pvOk = placedPv.x === p.x && placedPv.z === p.z;
    const phOk = placedPh.x === p.x && placedPh.y === p.y;
    const correct = pvOk && phOk;

    let message = "Impecável! Tanto a cota quanto o afastamento (rebatido!) estão exatos na linha de chamada.";
    if (!correct) {
      const reasons: string[] = [];
      if (placedPv.x !== placedPh.x) {
        reasons.push("A' e A precisam estar na MESMA Linha de Chamada (mesma abscissa x).");
      } else if (placedPv.x !== p.x) {
        reasons.push(`A abscissa correta na LT é x = ${formatSigned(p.x)}.`);
      }
      if (placedPv.z !== p.z) {
        reasons.push(
          `Para ${p.label}', a cota é ${formatSigned(p.z)} (${p.z >= 0 ? "acima" : "abaixo"} da LT).`
        );
      }
      if (placedPh.y !== p.y) {
        if (placedPh.y === -p.y && p.y !== 0) {
          reasons.push(
            `Pegadinha clássica! Você inverteu o sinal do afastamento: lembre que +Y DESCE abaixo da LT e −Y SOBE acima da LT!`
          );
        } else {
          reasons.push(
            `Para ${p.label}, o afastamento é ${formatSigned(p.y)} (${p.y >= 0 ? "abaixo" : "acima"} da LT).`
          );
        }
      }
      message = reasons.join(" ");
    }

    setResult({ correct, message });
    onRecordAnswer("desenhar_epura", correct, correct ? 30 : 8);
  };

  const checkReadEpura = () => {
    if (result) return;
    const p = exercise.point;
    const correct = guessX === p.x && guessY === p.y && guessZ === p.z;
    let message = `Na mosca! ${formatPointCoords(p.label, p.x, p.y, p.z)} lido com 100% de precisão.`;
    if (!correct) {
      const issues: string[] = [];
      if (guessX !== p.x) issues.push(`abscissa correta é ${formatSigned(p.x)}`);
      if (guessY !== p.y)
        issues.push(
          guessY === -p.y
            ? `sinal do afastamento invertido (abaixo da LT é +, acima é −! O certo é ${formatSigned(p.y)})`
            : `afastamento correto é ${formatSigned(p.y)}`
        );
      if (guessZ !== p.z) issues.push(`cota correta é ${formatSigned(p.z)}`);
      message = `Quase lá! Confira: ${issues.join("; ")}.`;
    }
    setResult({ correct, message });
    onRecordAnswer("ler_epura", correct, correct ? 25 : 6);
  };

  const uerjSpec = useMemo(
    () => UERJ_EXERCISES.find((e) => e.id === activeUerj)!,
    [activeUerj]
  );
  const uerjPreset = useMemo(
    () => SCENE_PRESETS.find((p) => p.id === uerjSpec.presetId)!,
    [uerjSpec]
  );

  const quizPointObj: GDPoint = {
    id: "quiz-pt",
    label: exercise.point.label,
    x: exercise.point.x,
    y: exercise.point.y,
    z: exercise.point.z,
    color: "#1E56A0",
  };

  return (
    <div className="space-y-4">
      {/* Top Stats + Mode Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { id: "uerj_sheet", label: "Folha UERJ (Aula 1)" },
              { id: "draw_epura", label: "Desenhe a Épura" },
              { id: "read_epura", label: "Leia a Épura" },
              { id: "identify_diedro", label: "Qual Diedro?" },
              { id: "special_cases", label: "Bissetores & Planos" },
              { id: "coord_order", label: "Ordem (x;y;z)" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabSwitch(item.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                tab === item.id
                  ? "bg-ink-900 text-paper-50 border-ink-900 shadow-sm dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                  : "bg-paper-50 dark:bg-blueprint-900 text-ink-700 dark:text-slate-200 border-paper-300 dark:border-blueprint-700 hover:bg-paper-200/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/50 text-bisector dark:text-amber-300 text-xs font-mono font-extrabold">
            <Award className="w-3.5 h-3.5" /> {xp} XP
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-pv-light dark:bg-red-950/50 text-pv dark:text-red-300 text-xs font-mono font-extrabold">
            <Flame className="w-3.5 h-3.5" /> {streak}x
          </span>
        </div>
      </div>

      {/* ---- TAB 1: FOLHA DA AULA 1 UERJ (EXERCÍCIOS DA FOTO DO ALUNO) ---- */}
      {tab === "uerj_sheet" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {UERJ_EXERCISES.map((ex) => {
              const active = ex.id === activeUerj;
              const doneCount = ex.steps.filter(
                (s) => uerjChecklist[s.key]
              ).length;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    setActiveUerj(ex.id as "ex1" | "ex2");
                    setUerjFold(0);
                  }}
                  className={`text-left p-3.5 rounded-2xl border transition ${
                    active
                      ? "bg-paper-50 dark:bg-blueprint-900 border-ph ring-2 ring-ph/25 shadow-draft"
                      : "bg-paper-100/70 dark:bg-blueprint-900/60 border-paper-300 dark:border-blueprint-800 hover:bg-paper-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-ph dark:text-sky-400">
                      {ex.badge}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-lt">
                      {doneCount}/{ex.steps.length}
                    </span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-extrabold text-ink-900 dark:text-white mt-1 truncate">
                    {ex.coords}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4 items-start">
            {/* Left: Slide Checklist + Answers + Profa. Epura voice */}
            <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-pv">
                    {uerjSpec.badge}
                  </span>
                  <h3 className="font-mono text-base sm:text-lg font-extrabold text-ink-900 dark:text-white mt-1">
                    {uerjSpec.coords}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onOpenInLab({
                      points: uerjPreset.points,
                      segments: uerjPreset.segments,
                      foldAngle: 0,
                      showBisectors: uerjPreset.showBisectors,
                    })
                  }
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ph text-white text-xs font-bold hover:bg-ph-dark transition"
                >
                  <Compass className="w-3.5 h-3.5" /> Lab Full
                </button>
              </div>

              {/* Profa. Épura Audio Walkthrough */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300/80 dark:border-blueprint-800">
                <ProfessorAvatar
                  professor="epura"
                  size="sm"
                  speaking={voice.speakingId === `uerj-${uerjSpec.id}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-ink-900 dark:text-white">
                    Profa. Épura · Correção Guiada
                  </div>
                  <div className="text-[11px] text-ink-500 dark:text-slate-400">
                    Confira cada item da sua folha A4/A3
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    voice.speak(
                      `uerj-${uerjSpec.id}`,
                      uerjSpec.narration,
                      "epura",
                      voiceRate,
                      customApiKey
                    )
                  }
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    voice.speakingId === `uerj-${uerjSpec.id}`
                      ? "bg-pv text-white"
                      : "bg-ink-900 text-paper-50 dark:bg-sky-500 dark:text-blueprint-950"
                  }`}
                >
                  {voice.speakingId === `uerj-${uerjSpec.id}` ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  Ouvir
                </button>
              </div>

              {/* Step-by-step checkable items matching the slide */}
              <div className="space-y-2.5">
                {uerjSpec.steps.map((step) => {
                  const checked = !!uerjChecklist[step.key];
                  const shown = !!revealedSteps[step.key];
                  return (
                    <div
                      key={step.key}
                      className={`rounded-2xl border p-3.5 transition ${
                        checked
                          ? "border-lt/50 bg-lt-light/50 dark:bg-teal-950/25"
                          : "border-paper-300 dark:border-blueprint-700 bg-paper-100/60 dark:bg-blueprint-950/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => onToggleUerjItem(step.key)}
                          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                            checked
                              ? "bg-lt border-lt text-white"
                              : "border-ink-500/40 bg-paper-50 dark:bg-blueprint-900"
                          }`}
                          aria-label={`Marcar etapa: ${step.text}`}
                        >
                          {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1 space-y-2">
                          <div className="text-sm font-bold text-ink-900 dark:text-white">
                            {step.text}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedSteps((prev) => ({
                                ...prev,
                                [step.key]: !prev[step.key],
                              }))
                            }
                            className="text-xs font-bold text-ph dark:text-sky-400 hover:underline"
                          >
                            {shown ? "Ocultar gabarito" : "Ver interpretação & gabarito →"}
                          </button>
                          {shown && (
                            <p className="text-xs sm:text-sm text-ink-700 dark:text-slate-200 leading-relaxed bg-paper-50 dark:bg-blueprint-900 p-2.5 rounded-xl border border-paper-200 dark:border-blueprint-800">
                              {step.answer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live 3D + 2D verification for the UERJ Exercise */}
            <div className="space-y-3">
              <Scene3D
                points={uerjPreset.points}
                segments={uerjPreset.segments}
                foldAngle={uerjFold}
                notation={notation}
                showXYZ
                showBisectors={!!uerjPreset.showBisectors}
                dark={dark}
                className="h-[310px] sm:h-[340px]"
              />
              <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3 flex items-center gap-3">
                <span className="text-xs font-bold text-ink-700 dark:text-slate-200 shrink-0">
                  Rebater ({uerjFold}°)
                </span>
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={uerjFold}
                  onChange={(e) => setUerjFold(Number(e.target.value))}
                  className="flex-1 accent-ph"
                />
                <button
                  type="button"
                  onClick={() => setUerjFold((v) => (v >= 45 ? 0 : 90))}
                  className="px-2.5 py-1 rounded-lg bg-lt text-white text-xs font-bold"
                >
                  {uerjFold >= 45 ? "3D" : "Épura"}
                </button>
              </div>
              <Epura2D
                points={uerjPreset.points}
                segments={uerjPreset.segments}
                notation={notation}
                showXYZ
                dark={dark}
                interactive={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* ---- TABS 2–6: ACTIVE DRILL ARENA ---- */}
      {tab !== "uerj_sheet" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4 items-start">
          {/* Left: Prompt + Interactive Canvas or Choices */}
          <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDifficulty(1);
                    loadNewExercise(tab, 1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    difficulty === 1
                      ? "bg-lt text-white border-lt"
                      : "bg-paper-100 dark:bg-blueprint-800 border-paper-300 dark:border-blueprint-700 text-ink-600 dark:text-slate-300"
                  }`}
                >
                  Iniciante
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDifficulty(2);
                    loadNewExercise(tab, 2);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    difficulty === 2
                      ? "bg-pv text-white border-pv"
                      : "bg-paper-100 dark:bg-blueprint-800 border-paper-300 dark:border-blueprint-700 text-ink-600 dark:text-slate-300"
                  }`}
                >
                  4 Diedros (Prova)
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100/80 dark:bg-amber-950/50 text-bisector dark:text-amber-300"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Dica
                </button>
                <button
                  type="button"
                  onClick={() => loadNewExercise(tab, difficulty)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-paper-200/80 dark:bg-blueprint-800 text-ink-800 dark:text-slate-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Novo
                </button>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-ink-900 dark:text-white leading-snug">
              {exercise.prompt}
            </h3>

            {showHint && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-700 text-xs text-ink-700 dark:text-amber-100">
                💡 <strong>Dica:</strong> {exercise.hint}
              </div>
            )}

            {/* DRAW EPURA INTERACTIVE MODE */}
            {tab === "draw_epura" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTarget("pv")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition ${
                      activeTarget === "pv"
                        ? "border-pv bg-pv-light text-pv dark:bg-red-950/40 dark:text-red-300"
                        : "border-paper-300 dark:border-blueprint-700 text-ink-600 dark:text-slate-300"
                    }`}
                  >
                    1. Marcar {exercise.point.label}&apos; (Cota){" "}
                    {placedPv ? `✓ (x=${formatSigned(placedPv.x)}, z=${formatSigned(placedPv.z)})` : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTarget("ph")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition ${
                      activeTarget === "ph"
                        ? "border-ph bg-ph-light text-ph dark:bg-sky-950/40 dark:text-sky-300"
                        : "border-paper-300 dark:border-blueprint-700 text-ink-600 dark:text-slate-300"
                    }`}
                  >
                    2. Marcar {exercise.point.label} (Afast.){" "}
                    {placedPh ? `✓ (x=${formatSigned(placedPh.x)}, y=${formatSigned(placedPh.y)})` : ""}
                  </button>
                </div>

                <Epura2D
                  points={[]}
                  notation={notation}
                  showXYZ
                  dark={dark}
                  placementMode={{
                    label: exercise.point.label,
                    activeTarget,
                    placedPv,
                    placedPh,
                    revealPoint: result ? exercise.point : null,
                    onPlace: (target, coord) => {
                      if (result) return;
                      if (target === "pv") {
                        setPlacedPv({ x: coord.x, z: coord.val });
                        setActiveTarget("ph");
                      } else {
                        setPlacedPh({ x: coord.x, y: coord.val });
                      }
                    },
                  }}
                />

                {!result && (
                  <button
                    type="button"
                    disabled={!placedPv || !placedPh}
                    onClick={checkDrawEpura}
                    className="w-full py-3 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 font-bold text-sm disabled:opacity-40 hover:opacity-95 transition"
                  >
                    Corrigir minha Épura
                  </button>
                )}
              </div>
            )}

            {/* READ EPURA REVERSE ENGINEERING MODE */}
            {tab === "read_epura" && (
              <div className="space-y-4">
                <Epura2D
                  points={[quizPointObj]}
                  notation={notation}
                  showXYZ={false}
                  dark={dark}
                  interactive={false}
                />

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      label: "Abscissa (X)",
                      val: guessX,
                      set: setGuessX,
                      color: "text-lt",
                    },
                    {
                      label: "Afastamento (Y)",
                      val: guessY,
                      set: setGuessY,
                      color: "text-ph",
                    },
                    {
                      label: "Cota (Z)",
                      val: guessZ,
                      set: setGuessZ,
                      color: "text-pv",
                    },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/80 dark:bg-blueprint-950 p-2.5 text-center space-y-2"
                    >
                      <div className="text-[11px] font-bold text-ink-600 dark:text-slate-300">
                        {f.label}
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          disabled={!!result}
                          onClick={() => f.set((v) => Math.max(-5, v - 1))}
                          className="w-8 h-8 rounded-lg bg-paper-50 dark:bg-blueprint-800 border border-paper-300 dark:border-blueprint-700 flex items-center justify-center"
                          aria-label={`Diminuir ${f.label}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`font-mono text-base font-extrabold w-9 ${f.color}`}
                        >
                          {formatSigned(f.val)}
                        </span>
                        <button
                          type="button"
                          disabled={!!result}
                          onClick={() => f.set((v) => Math.min(5, v + 1))}
                          className="w-8 h-8 rounded-lg bg-paper-50 dark:bg-blueprint-800 border border-paper-300 dark:border-blueprint-700 flex items-center justify-center"
                          aria-label={`Aumentar ${f.label}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!result && (
                  <button
                    type="button"
                    onClick={checkReadEpura}
                    className="w-full py-3 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 font-bold text-sm hover:opacity-95 transition"
                  >
                    Conferir Coordenadas{" "}
                    {formatPointCoords(exercise.point.label, guessX, guessY, guessZ)}
                  </button>
                )}
              </div>
            )}

            {/* MULTIPLE CHOICE MODES (DIEDRO / SPECIAL CASES / ORDER) */}
            {exercise.choices && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {exercise.choices.map((ch) => {
                  const isPicked = selectedChoice === ch.id;
                  const isRight = ch.id === exercise.correctChoiceId;
                  let style =
                    "bg-paper-100/70 dark:bg-blueprint-950 border-paper-300 dark:border-blueprint-700 hover:border-ph";
                  if (result) {
                    if (isRight) {
                      style =
                        "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/25";
                    } else if (isPicked && !isRight) {
                      style =
                        "bg-red-50 dark:bg-red-950/40 border-pv ring-2 ring-pv/25";
                    }
                  }
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      disabled={!!result}
                      onClick={() => checkChoice(ch.id)}
                      className={`text-left p-3.5 rounded-2xl border transition ${style}`}
                    >
                      <div className="text-sm font-extrabold text-ink-900 dark:text-white">
                        {ch.label}
                      </div>
                      {ch.sub && (
                        <div className="text-xs font-mono text-ink-500 dark:text-slate-400 mt-0.5">
                          {ch.sub}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* FEEDBACK BANNER */}
            {result && (
              <div
                className={`rounded-2xl p-4 border space-y-2.5 ${
                  result.correct
                    ? "bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-400/70"
                    : "bg-red-50/90 dark:bg-red-950/35 border-pv/50"
                }`}
              >
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  {result.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-pv" />
                  )}
                  <span className="text-ink-900 dark:text-white">
                    {result.message}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-700 dark:text-slate-200 leading-relaxed">
                  {exercise.explanation}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => loadNewExercise(tab, difficulty)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 text-xs font-bold"
                  >
                    Próximo Desafio <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      voice.speak(
                        `ex-${exercise.id}`,
                        exercise.explanation,
                        "epura",
                        voiceRate,
                        customApiKey
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-paper-50 dark:bg-blueprint-800 border border-paper-300 dark:border-blueprint-700 text-xs font-bold text-ink-800 dark:text-slate-200"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Ouvir explicação
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: 3D Visual Verification Companion (Reveals after answer!) */}
          <div className="space-y-3">
            {result ? (
              <>
                <Scene3D
                  points={[quizPointObj]}
                  segments={[]}
                  foldAngle={0}
                  notation={notation}
                  showXYZ
                  showBisectors={tab === "special_cases"}
                  dark={dark}
                  className="h-[310px] sm:h-[360px]"
                />
                <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 flex items-center justify-between gap-2">
                  <div className="text-xs text-ink-700 dark:text-slate-200">
                    <strong>Prova Real em 3D:</strong>{" "}
                    <span className="font-mono font-bold">
                      {formatPointCoords(
                        exercise.point.label,
                        exercise.point.x,
                        exercise.point.y,
                        exercise.point.z
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenInLab({
                        points: [quizPointObj],
                        segments: [],
                        foldAngle: 0,
                        showBisectors: tab === "special_cases",
                      })
                    }
                    className="text-xs font-bold text-ph dark:text-sky-400 hover:underline shrink-0"
                  >
                    Abrir no Lab →
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-paper-300 dark:border-blueprint-700 bg-paper-100/70 dark:bg-blueprint-900/50 p-6 text-center space-y-4">
                <ProfessorAvatar professor="epura" size="lg" className="mx-auto" />
                <div className="space-y-1.5">
                  <div className="text-sm font-extrabold text-ink-900 dark:text-white flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pv" />
                    Prova Real 3D Bloqueada
                  </div>
                  <p className="text-xs text-ink-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Tente imaginar primeiro mentalmente onde o ponto está no espaço! Assim que você enviar sua resposta, o modelo 3D aparece aqui para confirmar sua intuição.
                  </p>
                </div>
                <div className="rounded-2xl bg-paper-50 dark:bg-blueprint-950 border border-paper-200 dark:border-blueprint-800 p-3 text-left text-[11px] font-mono space-y-1 text-ink-700 dark:text-slate-300">
                  <div className="font-bold text-ink-900 dark:text-white">
                    Cola Rápida de Sinais:
                  </div>
                  <div>• Ordem: (Abscissa ; Afastamento ; Cota)</div>
                  <div className="text-pv">• Cota (+Z) SOBE · Cota (−Z) DESCE</div>
                  <div className="text-ph">• Afast. (+Y) DESCE · Afast. (−Y) SOBE</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
