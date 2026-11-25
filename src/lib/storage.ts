import { GDPoint, NotationMode } from "./gd-math";
import { TtsModelTier } from "./voice";

export interface UserProgress {
  xp: number;
  streak: number;
  bestStreak: number;
  totalAnswered: number;
  totalCorrect: number;
  completedLessons: string[];
  watchedEpisodes: string[];
  uerjChecklist: Record<string, boolean>;
  calcCompletedLessons: string[];
  calcWatchedEpisodes: string[];
  calcChecklist: Record<string, boolean>;
  topicStats: Record<
    string,
    {
      attempts: number;
      correct: number;
    }
  >;
  savedSnapshots: Array<{
    id: string;
    name: string;
    createdAt: string;
    points: GDPoint[];
  }>;
  preferences: {
    notation: NotationMode;
    showXYZ: boolean;
    theme: "atelier" | "blueprint";
    voiceRate: number;
    ttsModelTier: TtsModelTier;
    soundEffects: boolean;
    customGeminiKey?: string;
  };
  updatedAt: string;
}

const LEGACY_STORAGE_KEY = "epuralab_uerj_progress_v1";

function getStorageKey(userId?: string | null): string {
  return userId ? `exataslab_progress_${userId}` : LEGACY_STORAGE_KEY;
}

export const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  completedLessons: [],
  watchedEpisodes: [],
  uerjChecklist: {},
  calcCompletedLessons: [],
  calcWatchedEpisodes: [],
  calcChecklist: {},
  topicStats: {
    diedros: { attempts: 0, correct: 0 },
    desenhar_epura: { attempts: 0, correct: 0 },
    ler_epura: { attempts: 0, correct: 0 },
    bissetores_planos: { attempts: 0, correct: 0 },
    ordem_xyz: { attempts: 0, correct: 0 },
    precalc_sets: { attempts: 0, correct: 0 },
    precalc_func: { attempts: 0, correct: 0 },
    calc_limits: { attempts: 0, correct: 0 },
    calc_derivatives: { attempts: 0, correct: 0 },
    calc_integrals: { attempts: 0, correct: 0 },
  },
  savedSnapshots: [],
  preferences: {
    notation: "uerj",
    showXYZ: true,
    theme: "atelier",
    voiceRate: 1.0,
    ttsModelTier: "gemini-3.8-flash-tts",
    soundEffects: true,
  },
  updatedAt: new Date().toISOString(),
};

export function loadProgress(userId?: string | null): UserProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const key = getStorageKey(userId);
    const raw =
      window.localStorage.getItem(key) ??
      (userId ? window.localStorage.getItem(LEGACY_STORAGE_KEY) : null);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      watchedEpisodes: Array.isArray(parsed.watchedEpisodes)
        ? parsed.watchedEpisodes
        : [],
      calcCompletedLessons: Array.isArray(parsed.calcCompletedLessons)
        ? parsed.calcCompletedLessons
        : [],
      calcWatchedEpisodes: Array.isArray(parsed.calcWatchedEpisodes)
        ? parsed.calcWatchedEpisodes
        : [],
      calcChecklist:
        parsed.calcChecklist && typeof parsed.calcChecklist === "object"
          ? parsed.calcChecklist
          : {},
      topicStats: {
        ...DEFAULT_PROGRESS.topicStats,
        ...(parsed.topicStats ?? {}),
      },
      preferences: {
        ...DEFAULT_PROGRESS.preferences,
        ...(parsed.preferences ?? {}),
      },
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(next: UserProgress, userId?: string | null): void {
  if (typeof window === "undefined") return;
  const payload: UserProgress = {
    ...next,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function getMasteryRank(xp: number): {
  title: string;
  level: number;
  nextXp: number;
  percent: number;
} {
  const tiers = [
    { min: 0, max: 100, title: "Calouro de Exatas" },
    { min: 100, max: 250, title: "Explorador UERJ" },
    { min: 250, max: 500, title: "Analista de Funções & Épuras" },
    { min: 500, max: 900, title: "Mestre do Cálculo & Espaço" },
    { min: 900, max: 1500, title: "Monitor de Exatas (UERJ)" },
  ];
  const idx = tiers.findIndex((t) => xp < t.max);
  const level = idx === -1 ? tiers.length : idx + 1;
  const tier = tiers[idx === -1 ? tiers.length - 1 : idx];
  const span = tier.max - tier.min;
  const percent =
    idx === -1 ? 100 : Math.min(100, Math.round(((xp - tier.min) / span) * 100));
  return { title: tier.title, level, nextXp: tier.max, percent };
}
