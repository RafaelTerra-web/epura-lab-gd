"use client";

import React from "react";
import type { AuthUser } from "@/lib/auth";
import { UserProgress } from "@/lib/storage";
import { VIDEO_EPISODES } from "@/lib/video-episodes";
import { CALC_SYLLABUS_UNITS } from "@/lib/calc-curriculum";
import { CALC_VIDEO_EPISODES } from "@/lib/calc-video-episodes";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { sfx } from "@/lib/sfx";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Compass,
  Film,
  GraduationCap,
  Layers,
  Moon,
  Sun,
  TrendingUp,
} from "lucide-react";

interface SubjectPortalProps {
  dark: boolean;
  onToggleTheme: () => void;
  progress: UserProgress;
  authUser: AuthUser | null;
  googleConfigured: boolean;
  authNotice: string | null;
  onDismissAuthNotice: () => void;
  onLogout: () => Promise<void>;
  onSelectGD: (section?: "lab" | "lessons" | "practice" | "kit") => void;
  onSelectCalc1: (section?: "lab" | "lessons" | "practice" | "syllabus") => void;
}

export function SubjectPortal({
  dark,
  onToggleTheme,
  progress,
  authUser,
  googleConfigured,
  authNotice,
  onDismissAuthNotice,
  onLogout,
  onSelectGD,
  onSelectCalc1,
}: SubjectPortalProps) {
  const totalCalcTopics = CALC_SYLLABUS_UNITS.reduce(
    (sum, u) => sum + u.topics.length,
    0
  );
  const doneCalcTopics = CALC_SYLLABUS_UNITS.reduce(
    (sum, u) => sum + u.topics.filter((t) => progress.calcChecklist[t.id]).length,
    0
  );

  return (
    <div className="min-h-screen drafting-bg flex flex-col">
      {/* Top Hub Header */}
      <header className="sticky top-0 z-30 border-b border-paper-300/90 dark:border-blueprint-800 bg-paper-50/90 dark:bg-blueprint-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-bold leading-none text-ink-900 dark:text-white">
                  ExatasLab
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-ph-light text-ph dark:bg-sky-950 dark:text-sky-300">
                  UERJ
                </span>
              </div>
              <div className="text-[11px] text-ink-500 dark:text-slate-400">
                Laboratório Interativo · Geometria Descritiva &amp; Cálculo I
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300/60 dark:border-amber-800 text-bisector dark:text-amber-300 text-xs font-mono font-extrabold">
              <Award className="w-3.5 h-3.5" /> {progress.xp} XP
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-100 dark:bg-blueprint-900 text-ink-700 dark:text-slate-200 hover:bg-paper-200 dark:hover:bg-blueprint-800 transition"
              aria-label="Alternar tema"
            >
              {dark ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <GoogleAuthButton
              user={authUser}
              googleConfigured={googleConfigured}
              onLogout={onLogout}
            />
          </div>
        </div>
      </header>

      {/* Main Portal Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {authNotice && (
          <div className="rounded-2xl border border-ph/30 bg-paper-50 dark:bg-blueprint-900 px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold text-ink-800 dark:text-slate-200">
            <span>{authNotice}</span>
            <button
              type="button"
              onClick={onDismissAuthNotice}
              className="text-ph dark:text-sky-400 font-bold hover:underline shrink-0"
            >
              Fechar
            </button>
          </div>
        )}

        <section className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ph/30 bg-ph-light/60 dark:bg-sky-950/50 text-ph dark:text-sky-300 font-mono text-[11px] font-extrabold">
            {authUser
              ? `OLÁ, ${authUser.name.split(" ")[0].toUpperCase()} · ESCOLHA SUA DISCIPLINA`
              : "PLATAFORMA DE ESTUDOS · ENGENHARIA & EXATAS (UERJ)"}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-ink-900 dark:text-white tracking-tight leading-tight">
            Escolha a disciplina para entrar no laboratório
          </h1>
          <p className="text-sm sm:text-base text-ink-600 dark:text-slate-300 leading-relaxed">
            Visualize conceitos complexos ao vivo: manipule projeções de Monge em 3D ou explore Pré-Cálculo, gráficos de funções, limites, derivadas e integrais de Cálculo I.
          </p>
        </section>

        {/* Two Hero Discipline Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARD 1: GEOMETRIA DESCRITIVA */}
          <div
            data-subject-card="gd"
            className="group rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-6 sm:p-7 shadow-draft hover:border-ph/70 transition flex flex-col justify-between gap-6"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-ph/15 dark:bg-sky-500/20 text-ph dark:text-sky-300 flex items-center justify-center">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-paper-200/80 dark:bg-blueprint-800 text-ink-700 dark:text-slate-300">
                  {progress.watchedEpisodes.length}/{VIDEO_EPISODES.length} vídeos vistos
                </span>
              </div>

              <div>
                <div className="font-mono text-xs font-extrabold uppercase tracking-wider text-ph dark:text-sky-400">
                  Disciplina 01 · Monge &amp; Épura
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white mt-1">
                  Geometria Descritiva
                </h2>
                <p className="text-sm text-ink-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  Laboratório 3D ↔ Épura 2D sincronizado, 7 aulas animadas com reprodução direta no Lab 3D, Exercícios 1 e 2 da UERJ, Bissetores e Kit de Desenho.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Lab 3D ↔ 2D", sec: "lab" as const, icon: Compass },
                  { label: "7 Aulas Motion", sec: "lessons" as const, icon: Film },
                  { label: "Praticar & UERJ", sec: "practice" as const, icon: GraduationCap },
                  { label: "Kit de Desenho", sec: "kit" as const, icon: BookOpen },
                ].map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        onSelectGD(pill.sec);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300/80 dark:border-blueprint-800 hover:border-ph text-xs font-bold text-ink-700 dark:text-slate-200 transition"
                    >
                      <Icon className="w-3.5 h-3.5 text-ph dark:text-sky-400" />
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              data-enter-gd
              onClick={() => {
                sfx.click();
                onSelectGD("lab");
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-ink-900 hover:bg-ink-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-paper-50 dark:text-blueprint-950 text-sm font-extrabold transition"
            >
              Entrar em Geometria Descritiva <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* CARD 2: CÁLCULO 1 */}
          <div
            data-subject-card="calc1"
            className="group rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-6 sm:p-7 shadow-draft hover:border-lt/70 transition flex flex-col justify-between gap-6"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-lt/15 dark:bg-teal-500/20 text-lt dark:text-teal-300 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-paper-200/80 dark:bg-blueprint-800 text-ink-700 dark:text-slate-300">
                  {progress.calcWatchedEpisodes.length}/{CALC_VIDEO_EPISODES.length} vídeos · {doneCalcTopics}/{totalCalcTopics} ementa
                </span>
              </div>

              <div>
                <div className="font-mono text-xs font-extrabold uppercase tracking-wider text-lt dark:text-teal-400">
                  Disciplina 02 · Prof. Mateus Spezia (UERJ)
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white mt-1">
                  Cálculo 1 &amp; Pré-Cálculo
                </h2>
                <p className="text-sm text-ink-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  5 Videoaulas animadas com Gemini TTS + Professor, Lab de Funções (Constante, Afim tg α = a, Domínio Natural √x e 1/(x−1), Quadro de Sinais x²+x−2≥0), Exercícios e Simulador P1–P3!
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Lab de Funções", sec: "lab" as const, icon: TrendingUp },
                  { label: "5 Videoaulas Motion", sec: "lessons" as const, icon: Film },
                  { label: "Praticar Exercícios", sec: "practice" as const, icon: GraduationCap },
                  { label: "Ementa & Notas", sec: "syllabus" as const, icon: Calendar },
                ].map((pill) => {
                  const Icon = pill.icon;
                  return (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        onSelectCalc1(pill.sec);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300/80 dark:border-blueprint-800 hover:border-lt text-xs font-bold text-ink-700 dark:text-slate-200 transition"
                    >
                      <Icon className="w-3.5 h-3.5 text-lt dark:text-teal-400" />
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              data-enter-calc1
              onClick={() => {
                sfx.click();
                onSelectCalc1("lab");
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-lt hover:bg-teal-700 dark:bg-teal-400 dark:hover:bg-teal-300 text-white dark:text-blueprint-950 text-sm font-extrabold transition"
            >
              Entrar em Cálculo 1 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
