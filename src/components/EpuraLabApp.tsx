"use client";

import React, { useEffect, useState } from "react";
import {
  GDPoint,
  GDSegment,
  POINT_COLORS,
  SCENE_PRESETS,
  ScenePreset,
} from "@/lib/gd-math";
import { LabSpotlight, TutorDirectorCommand } from "@/lib/director";
import {
  DEFAULT_PROGRESS,
  getMasteryRank,
  loadProgress,
  saveProgress,
  UserProgress,
} from "@/lib/storage";
import { useProfessorVoice } from "@/lib/voice";
import { LabStudio } from "./LabStudio";
import { LessonsView } from "./LessonsView";
import { PracticeArena } from "./PracticeArena";
import { DrawingKitView } from "./DrawingKitView";
import { TutorDrawer } from "./TutorDrawer";
import { LiveProfessorSidebar } from "./LiveProfessorSidebar";
import { ProfessorAvatar } from "./ProfessorAvatar";
import {
  Award,
  BookOpen,
  Compass,
  GraduationCap,
  MessageSquare,
  Moon,
  Ruler,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

type SectionId = "lab" | "lessons" | "practice" | "kit";

export function EpuraLabApp() {
  const [section, setSection] = useState<SectionId>("lab");
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  // Active Lab scene state (starts on UERJ Exercise 1 or Single Point? Let's start on Single 1st Diedro with instant 1-tap UERJ Ex 1 & Ex 2 buttons!)
  const [activePresetId, setActivePresetId] = useState<string | null>("uerj-ex1");
  const [points, setPoints] = useState<GDPoint[]>(SCENE_PRESETS[0].points);
  const [segments, setSegments] = useState<GDSegment[]>(
    SCENE_PRESETS[0].segments
  );
  const [foldAngle, setFoldAngle] = useState<number>(0);
  const [showBisectors, setShowBisectors] = useState<boolean>(false);

  const [showIntroTip, setShowIntroTip] = useState(true);
  const [liveChatOpen, setLiveChatOpen] = useState(false);
  const [spotlight, setSpotlight] = useState<LabSpotlight | null>(null);
  const [cameraCommand, setCameraCommand] = useState<{
    preset: "iso" | "profile" | "front" | "top";
    seq: number;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"tutor" | "profile" | "settings">(
    "settings"
  );

  const voice = useProfessorVoice();

  // Hydrate user progress from localStorage + open live sidebar by default on wide desktop
  useEffect(() => {
    const loaded = loadProgress();
    setProgress(loaded);
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      setLiveChatOpen(true);
    }
    setHydrated(true);
  }, []);

  // Sync dark class onto <html>
  const dark = progress.preferences.theme === "blueprint";
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", dark);
  }, [dark, hydrated]);

  // Persist progress changes
  const updateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  };

  const updatePrefs = (patch: Partial<UserProgress["preferences"]>) => {
    updateProgress((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...patch },
    }));
  };

  const handleLoadPreset = (preset: ScenePreset) => {
    setActivePresetId(preset.id);
    setPoints(preset.points.map((p) => ({ ...p })));
    setSegments(preset.segments.map((s) => ({ ...s })));
    setShowBisectors(Boolean(preset.showBisectors));
    setFoldAngle(0);
    setSpotlight(null);
  };

  const handleExecuteDirector = (cmd: TutorDirectorCommand) => {
    // Switch to Lab view so the student immediately watches the 3D/2D circling!
    setSection("lab");

    if (cmd.presetId) {
      const preset = SCENE_PRESETS.find((p) => p.id === cmd.presetId);
      if (preset) {
        setActivePresetId(preset.id);
        setPoints(preset.points.map((p) => ({ ...p })));
        setSegments(preset.segments.map((s) => ({ ...s })));
        setShowBisectors(Boolean(preset.showBisectors));
      }
    } else if (cmd.points && cmd.points.length > 0) {
      setActivePresetId(null);
      const nextPts: GDPoint[] = cmd.points.slice(0, 5).map((p, idx) => ({
        id: `dir-${idx}-${p.label}`,
        label: p.label || String.fromCharCode(65 + idx),
        x: Math.max(-5, Math.min(5, p.x)),
        y: Math.max(-5, Math.min(5, p.y)),
        z: Math.max(-5, Math.min(5, p.z)),
        color: POINT_COLORS[idx % POINT_COLORS.length],
      }));
      setPoints(nextPts);
      if (cmd.connectLine && nextPts.length >= 2) {
        setSegments([
          {
            id: "dir-r",
            fromId: nextPts[0].id,
            toId: nextPts[1].id,
            label: "r",
            extendLine: true,
          },
        ]);
      } else {
        setSegments([]);
      }
    }

    if (typeof cmd.showBisectors === "boolean") {
      setShowBisectors(cmd.showBisectors);
    }
    if (typeof cmd.showXYZ === "boolean") {
      updatePrefs({ showXYZ: cmd.showXYZ });
    }
    if (typeof cmd.foldAngle === "number") {
      setFoldAngle(Math.max(0, Math.min(90, cmd.foldAngle)));
    }
    if (cmd.cameraPreset) {
      setCameraCommand((prev) => ({
        preset: cmd.cameraPreset!,
        seq: (prev?.seq ?? 0) + 1,
      }));
    }
    if (cmd.spotlight) {
      setSpotlight({ ...cmd.spotlight });
    }
  };

  const handleOpenInLab = (payload: {
    points: GDPoint[];
    segments: GDSegment[];
    foldAngle: number;
    showBisectors?: boolean;
    showXYZ?: boolean;
  }) => {
    setActivePresetId(null);
    setPoints(payload.points.map((p) => ({ ...p })));
    setSegments(payload.segments.map((s) => ({ ...s })));
    setFoldAngle(payload.foldAngle);
    if (typeof payload.showBisectors === "boolean") {
      setShowBisectors(payload.showBisectors);
    }
    if (typeof payload.showXYZ === "boolean") {
      updatePrefs({ showXYZ: payload.showXYZ });
    }
    setSection("lab");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleToggleLesson = (id: string) => {
    updateProgress((prev) => {
      const exists = prev.completedLessons.includes(id);
      return {
        ...prev,
        completedLessons: exists
          ? prev.completedLessons.filter((l) => l !== id)
          : [...prev.completedLessons, id],
        xp: exists ? prev.xp : prev.xp + 25,
      };
    });
  };

  const handleToggleUerjItem = (key: string) => {
    updateProgress((prev) => {
      const nextVal = !prev.uerjChecklist[key];
      return {
        ...prev,
        uerjChecklist: { ...prev.uerjChecklist, [key]: nextVal },
        xp: nextVal ? prev.xp + 15 : prev.xp,
      };
    });
  };

  const handleRecordAnswer = (
    topicKey: string,
    correct: boolean,
    xpEarned: number
  ) => {
    updateProgress((prev) => {
      const nextStreak = correct ? prev.streak + 1 : 0;
      const prevStat = prev.topicStats[topicKey] || { attempts: 0, correct: 0 };
      return {
        ...prev,
        xp: prev.xp + xpEarned,
        streak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        totalAnswered: prev.totalAnswered + 1,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        topicStats: {
          ...prev.topicStats,
          [topicKey]: {
            attempts: prevStat.attempts + 1,
            correct: prevStat.correct + (correct ? 1 : 0),
          },
        },
      };
    });
  };

  const handleSaveSnapshot = (name: string, pts: GDPoint[]) => {
    updateProgress((prev) => ({
      ...prev,
      savedSnapshots: [
        {
          id: `snap-${Date.now()}`,
          name,
          createdAt: new Date().toISOString(),
          points: pts.map((p) => ({ ...p })),
        },
        ...prev.savedSnapshots.slice(0, 14),
      ],
    }));
  };

  const handleDeleteSnapshot = (id: string) => {
    updateProgress((prev) => ({
      ...prev,
      savedSnapshots: prev.savedSnapshots.filter((s) => s.id !== id),
    }));
  };

  const openDrawer = (tab: "tutor" | "profile" | "settings") => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const rank = getMasteryRank(progress.xp);

  const navItems: Array<{
    id: SectionId;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "lab", label: "Lab 3D ↔ 2D", shortLabel: "Lab 3D", icon: Compass },
    { id: "lessons", label: "Aulas Guiadas", shortLabel: "Aulas", icon: BookOpen },
    {
      id: "practice",
      label: "Praticar & UERJ",
      shortLabel: "Praticar",
      icon: GraduationCap,
    },
    { id: "kit", label: "Kit de Desenho", shortLabel: "Kit", icon: Ruler },
  ];

  return (
    <div className="min-h-screen drafting-bg flex flex-col">
      {/* ---- TOP STUDIO HEADER (Adapted for Desktop & Compact Mobile) ---- */}
      <header className="sticky top-0 z-30 border-b border-paper-300/90 dark:border-blueprint-800 bg-paper-50/90 dark:bg-blueprint-950/90 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 lg:h-16 flex items-center justify-between gap-3">
          {/* Brand Emblem */}
          <button
            type="button"
            onClick={() => setSection("lab")}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-bold leading-none text-ink-900 dark:text-white">
                  ÉpuraLab
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-ph-light text-ph dark:bg-sky-950 dark:text-sky-300">
                  GD · UERJ
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-ink-500 dark:text-slate-400 leading-tight whitespace-nowrap">
                <span className="sm:hidden">GD 3D ⇄ Épura 2D</span>
                <span className="hidden sm:inline">
                  Geometria Descritiva 3D ⇄ Épura 2D
                </span>
              </div>
            </div>
          </button>

          {/* DESKTOP Primary Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-paper-200/75 dark:bg-blueprint-900 p-1 rounded-2xl border border-paper-300/80 dark:border-blueprint-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    active
                      ? "bg-paper-50 dark:bg-blueprint-700 text-ink-900 dark:text-white shadow-sm"
                      : "text-ink-600 dark:text-slate-400 hover:text-ink-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* XP / Progress Pill */}
            <button
              type="button"
              onClick={() => openDrawer("profile")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300/60 dark:border-amber-800 text-bisector dark:text-amber-300 text-xs font-mono font-extrabold hover:opacity-90 transition"
              title={`${rank.title} (${progress.xp} XP)`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{progress.xp}</span>
              <span className="hidden sm:inline text-[10px] font-sans font-bold opacity-80">
                XP
              </span>
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={() =>
                updatePrefs({ theme: dark ? "atelier" : "blueprint" })
              }
              className="p-2 rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-100 dark:bg-blueprint-900 text-ink-700 dark:text-slate-200 hover:bg-paper-200 dark:hover:bg-blueprint-800 transition"
              title={
                dark ? "Mudar para Atelier Claro" : "Mudar para Blueprint Noturno"
              }
              aria-label="Alternar tema"
            >
              {dark ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Settings Button (Desktop) */}
            <button
              type="button"
              onClick={() => openDrawer("settings")}
              className="hidden sm:inline-flex p-2 rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-100 dark:bg-blueprint-900 text-ink-700 dark:text-slate-200 hover:bg-paper-200 dark:hover:bg-blueprint-800 transition"
              title="Ajustes de Notação, Voz e API"
              aria-label="Ajustes"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Live Professor Chat Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setLiveChatOpen((v) => !v)}
              className={`inline-flex items-center gap-2 p-1 sm:pl-1 sm:pr-3.5 rounded-full border text-xs font-bold transition ${
                liveChatOpen
                  ? "border-ph bg-ph text-white shadow-sm"
                  : "border-ph/30 bg-ph-light/80 dark:bg-sky-950/60 hover:bg-ph-light text-ph dark:text-sky-300"
              }`}
              title="Abrir/fechar Chat ao Vivo com o Professor"
            >
              <ProfessorAvatar professor="monge" size="sm" className="w-7 h-7" />
              <span className="hidden sm:inline">
                {liveChatOpen ? "Chat ao Vivo ●" : "Chat ao Vivo"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ---- MAIN CONTENT WORKSPACE + DOCKED LIVE PROFESSOR SIDEBAR ---- */}
      <div className="flex-1 max-w-[1620px] w-full mx-auto px-3 sm:px-6 pt-4 pb-24 lg:pb-10 flex items-start gap-4">
        <main className="flex-1 min-w-0 space-y-4">
        {/* Welcome / Quick-Start Banner (Dismissible) */}
        {showIntroTip && section === "lab" && (
          <div className="rounded-2xl border border-ph/25 bg-gradient-to-r from-paper-50 via-ph-light/50 to-paper-50 dark:from-blueprint-900 dark:via-sky-950/40 dark:to-blueprint-900 p-3.5 sm:p-4 shadow-draft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-ph/15 text-ph dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-extrabold text-ink-900 dark:text-white">
                  Sua Aula 1 da UERJ em 3D + Épura ao vivo!
                </div>
                <p className="text-xs text-ink-600 dark:text-slate-300 leading-relaxed">
                  Arraste <strong className="text-pv">A&apos;</strong> ou{" "}
                  <strong className="text-ph">A</strong> na Épura 2D, gire o espaço 3D ou clique em{" "}
                  <strong>Animar Épura</strong> para ver o chão (π) rebater 90° em torno da Linha de Terra.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSection("lessons")}
                className="px-3 py-1.5 rounded-xl bg-ph hover:bg-ph-dark text-white text-xs font-bold transition"
              >
                ▶ Aulas em Vídeo (Motion)
              </button>
              <button
                type="button"
                onClick={() => setSection("practice")}
                className="px-3 py-1.5 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 text-xs font-bold"
              >
                Resolver Folha UERJ
              </button>
              <button
                type="button"
                onClick={() => setShowIntroTip(false)}
                className="p-1.5 rounded-lg text-ink-500 hover:bg-paper-200 dark:hover:bg-blueprint-800"
                aria-label="Dispensar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {section === "lab" && (
          <LabStudio
            points={points}
            segments={segments}
            setPoints={(updater) => {
              setActivePresetId(null);
              setPoints(updater);
            }}
            setSegments={setSegments}
            foldAngle={foldAngle}
            setFoldAngle={setFoldAngle}
            notation={progress.preferences.notation}
            onToggleNotation={() =>
              updatePrefs({
                notation:
                  progress.preferences.notation === "uerj" ? "iso" : "uerj",
              })
            }
            showXYZ={progress.preferences.showXYZ}
            onToggleXYZ={() =>
              updatePrefs({ showXYZ: !progress.preferences.showXYZ })
            }
            showBisectors={showBisectors}
            setShowBisectors={setShowBisectors}
            dark={dark}
            voice={voice}
            voiceRate={progress.preferences.voiceRate}
            customApiKey={progress.preferences.customGeminiKey}
            ttsModelTier={progress.preferences.ttsModelTier}
            spotlight={spotlight}
            onClearSpotlight={() => setSpotlight(null)}
            cameraCommand={cameraCommand}
            sidebarOpen={liveChatOpen}
            onSaveSnapshot={handleSaveSnapshot}
            activePresetId={activePresetId}
            onLoadPreset={handleLoadPreset}
          />
        )}

        {section === "lessons" && (
          <LessonsView
            dark={dark}
            completedLessons={progress.completedLessons}
            onToggleComplete={handleToggleLesson}
            onOpenInLab={handleOpenInLab}
            voice={voice}
            voiceRate={progress.preferences.voiceRate}
            customApiKey={progress.preferences.customGeminiKey}
            ttsModelTier={progress.preferences.ttsModelTier}
          />
        )}

        {section === "practice" && (
          <PracticeArena
            notation={progress.preferences.notation}
            dark={dark}
            xp={progress.xp}
            streak={progress.streak}
            uerjChecklist={progress.uerjChecklist}
            onToggleUerjItem={handleToggleUerjItem}
            onRecordAnswer={handleRecordAnswer}
            onOpenInLab={handleOpenInLab}
            voice={voice}
            voiceRate={progress.preferences.voiceRate}
            customApiKey={progress.preferences.customGeminiKey}
            ttsModelTier={progress.preferences.ttsModelTier}
          />
        )}

        {section === "kit" && (
          <DrawingKitView
            dark={dark}
            voice={voice}
            voiceRate={progress.preferences.voiceRate}
            customApiKey={progress.preferences.customGeminiKey}
            ttsModelTier={progress.preferences.ttsModelTier}
          />
        )}
        </main>

        {/* DOCKED LIVE PROFESSOR CHAT SIDEBAR (Side-by-side on Desktop, Non-blocking Half-Sheet on Mobile) */}
        <LiveProfessorSidebar
          open={liveChatOpen}
          onClose={() => setLiveChatOpen(false)}
          contextPoints={points}
          onExecuteDirector={handleExecuteDirector}
          voice={voice}
          voiceRate={progress.preferences.voiceRate}
          customApiKey={progress.preferences.customGeminiKey}
          ttsModelTier={progress.preferences.ttsModelTier}
        />
      </div>

      {/* ---- MOBILE-ONLY NATIVE BOTTOM TAB BAR ---- */}
      <nav
        aria-label="Navegação principal mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-paper-300 dark:border-blueprint-800 bg-paper-50/95 dark:bg-blueprint-950/95 backdrop-blur-md shadow-sheet safe-pb"
      >
        <div className="grid grid-cols-5 px-1 pt-1.5 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition ${
                  active
                    ? "text-ph dark:text-sky-400 font-extrabold"
                    : "text-ink-500 dark:text-slate-400 font-semibold"
                }`}
              >
                <span
                  className={`px-3 py-1 rounded-full transition ${
                    active ? "bg-ph-light dark:bg-sky-950" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] leading-none">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}

          {/* 5th Mobile Tab: Live Professor Chat */}
          <button
            type="button"
            onClick={() => setLiveChatOpen((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition ${
              liveChatOpen
                ? "text-ph dark:text-sky-400 font-extrabold"
                : "text-ink-500 dark:text-slate-400 font-semibold"
            }`}
          >
            <span
              className={`px-3 py-1 rounded-full transition ${
                liveChatOpen ? "bg-ph-light dark:bg-sky-950" : ""
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </span>
            <span className="text-[10px] leading-none">Prof.</span>
          </button>
        </div>
      </nav>

      {/* ---- TUTOR, PROGRESS & SETTINGS DRAWER ---- */}
      <TutorDrawer
        open={drawerOpen}
        initialTab={drawerTab}
        onClose={() => setDrawerOpen(false)}
        contextPoints={points}
        progress={progress}
        onUpdatePrefs={updatePrefs}
        onLoadSnapshot={(pts) => {
          setActivePresetId(null);
          setPoints(pts.map((p) => ({ ...p })));
          setSegments([]);
          setFoldAngle(0);
          setSection("lab");
        }}
        onDeleteSnapshot={handleDeleteSnapshot}
        onResetProgress={() => {
          setProgress(DEFAULT_PROGRESS);
          saveProgress(DEFAULT_PROGRESS);
        }}
        voice={voice}
      />
    </div>
  );
}
