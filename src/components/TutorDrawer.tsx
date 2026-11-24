"use client";

import React, { useEffect, useState } from "react";
import { GDPoint, NotationMode } from "@/lib/gd-math";
import { getMasteryRank, UserProgress } from "@/lib/storage";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { VoiceState } from "@/lib/voice";
import {
  Download,
  KeyRound,
  MessageSquare,
  Moon,
  Send,
  Settings,
  Sun,
  Trash2,
  Volume2,
  X,
} from "lucide-react";

interface TutorDrawerProps {
  open: boolean;
  initialTab?: "tutor" | "profile" | "settings";
  onClose: () => void;
  contextPoints: GDPoint[];
  progress: UserProgress;
  onUpdatePrefs: (patch: Partial<UserProgress["preferences"]>) => void;
  onLoadSnapshot: (pts: GDPoint[]) => void;
  onDeleteSnapshot: (id: string) => void;
  onResetProgress: () => void;
  voice: VoiceState;
}

const QUICK_QUESTIONS = [
  "Associar (x, y, z) vai me confundir na épura?",
  "Por que o afastamento positivo vai para BAIXO na épura?",
  "Qual é o segredo do Exercício 1 da UERJ?",
  "Por que o Exercício 2 da UERJ não forma um triângulo?",
  "Como decorar os 4 diedros sem errar?",
];

export function TutorDrawer({
  open,
  initialTab = "tutor",
  onClose,
  contextPoints,
  progress,
  onUpdatePrefs,
  onLoadSnapshot,
  onDeleteSnapshot,
  onResetProgress,
  voice,
}: TutorDrawerProps) {
  const [tab, setTab] = useState<"tutor" | "profile" | "settings">(initialTab);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);
  const [messages, setMessages] = useState<
    Array<{ id: string; role: "user" | "tutor"; text: string }>
  >([
    {
      id: "welcome",
      role: "tutor",
      text: "Olá! Sou o Prof. Monge. Pode me perguntar qualquer dúvida sobre épura, diedros, ordem (abscissa; afastamento; cota) ou sobre os exercícios da sua Aula 1 na UERJ!",
    },
  ]);

  if (!open) return null;

  const rank = getMasteryRank(progress.xp);
  const accuracy =
    progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : 0;

  const askTutor = async (qText: string) => {
    const q = qText.trim();
    if (!q || loading) return;
    const userMsg = { id: `u-${Date.now()}`, role: "user" as const, text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          contextPoints: contextPoints.map((p) => ({
            label: p.label,
            x: p.x,
            y: p.y,
            z: p.z,
          })),
          customApiKey: progress.preferences.customGeminiKey,
        }),
      });
      const data = (await res.json()) as { answer?: string };
      setMessages((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          role: "tutor",
          text:
            data.answer ||
            "Lembre-se sempre da ordem (abscissa; afastamento; cota): cota positiva sobe (A') e afastamento positivo desce (A)!",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          role: "tutor",
          text: "Sem conexão no momento, mas lembre: na épura, cota (+) sobe para A' e afastamento (+) desce para A!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "epura-lab-progresso.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const topicLabels: Record<string, string> = {
    diedros: "Identificação de Diedros",
    desenhar_epura: "Desenho de Épuras",
    ler_epura: "Leitura de Épuras",
    bissetores_planos: "Bissetores & Planos",
    ordem_xyz: "Ordem (x; y; z)",
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/45 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-paper-50 dark:bg-blueprint-900 border-l border-paper-300 dark:border-blueprint-700 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-paper-200 dark:border-blueprint-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <ProfessorAvatar
              professor="monge"
              size="sm"
              speaking={Boolean(voice.speakingId?.startsWith("chat-"))}
            />
            <div>
              <div className="text-sm font-extrabold text-ink-900 dark:text-white">
                Estúdio & Tutoria
              </div>
              <div className="text-[11px] text-ink-500 dark:text-slate-400">
                Prof. Monge · Progresso · Preferências
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-paper-200 dark:hover:bg-blueprint-800 text-ink-600 dark:text-slate-300"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 border-b border-paper-200 dark:border-blueprint-800 bg-paper-100/70 dark:bg-blueprint-950">
          {(
            [
              { id: "tutor", label: "Prof. Monge", icon: MessageSquare },
              { id: "profile", label: "Progresso", icon: Download },
              { id: "settings", label: "Ajustes", icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                  tab === item.id
                    ? "bg-paper-50 dark:bg-blueprint-800 text-ink-900 dark:text-white shadow-sm"
                    : "text-ink-500 dark:text-slate-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        {tab === "tutor" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-ink-900 text-paper-50 dark:bg-sky-500 dark:text-blueprint-950 font-medium"
                        : "bg-paper-100 dark:bg-blueprint-950 border border-paper-300 dark:border-blueprint-700 text-ink-800 dark:text-slate-100"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.role === "tutor" && (
                    <button
                      type="button"
                      onClick={() =>
                        voice.speak(
                          `chat-${m.id}`,
                          m.text,
                          "monge",
                          progress.preferences.voiceRate,
                          progress.preferences.customGeminiKey
                        )
                      }
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-ph dark:text-sky-400 hover:underline"
                    >
                      <Volume2 className="w-3 h-3" /> Ouvir resposta
                    </button>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-xs text-ink-500 animate-pulse">
                  Prof. Monge está desenhando a explicação...
                </div>
              )}

              {/* Suggested quick prompts */}
              <div className="pt-2 space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-ink-500">
                  Perguntas rápidas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => askTutor(q)}
                      className="text-left text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-paper-200/70 dark:bg-blueprint-800 hover:bg-paper-300/70 text-ink-800 dark:text-slate-200 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                askTutor(input);
              }}
              className="p-3 border-t border-paper-200 dark:border-blueprint-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre épura, diedros, XYZ..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300 dark:border-blueprint-700 text-xs sm:text-sm outline-none focus:border-ph"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-ph text-white disabled:opacity-40"
                aria-label="Enviar pergunta"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {tab === "profile" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="rounded-2xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300 dark:border-blueprint-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-ph dark:text-sky-400">
                  Nível {rank.level}
                </span>
                <span className="font-mono text-xs font-extrabold text-bisector">
                  {progress.xp} XP
                </span>
              </div>
              <div className="text-base font-extrabold text-ink-900 dark:text-white">
                {rank.title}
              </div>
              <div className="w-full h-2 rounded-full bg-paper-300 dark:bg-blueprint-800 overflow-hidden">
                <div
                  className="h-full bg-ph rounded-full transition-all"
                  style={{ width: `${rank.percent}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-paper-50 dark:bg-blueprint-900">
                  <div className="font-mono font-extrabold text-sm">
                    {accuracy}%
                  </div>
                  <div className="text-[10px] text-ink-500">Precisão</div>
                </div>
                <div className="p-2 rounded-xl bg-paper-50 dark:bg-blueprint-900">
                  <div className="font-mono font-extrabold text-sm">
                    {progress.bestStreak}x
                  </div>
                  <div className="text-[10px] text-ink-500">Melhor Seq.</div>
                </div>
                <div className="p-2 rounded-xl bg-paper-50 dark:bg-blueprint-900">
                  <div className="font-mono font-extrabold text-sm">
                    {progress.completedLessons.length}/6
                  </div>
                  <div className="text-[10px] text-ink-500">Aulas</div>
                </div>
              </div>
            </div>

            {/* Accuracy by topic */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500">
                Desempenho por Tópico
              </div>
              {Object.entries(progress.topicStats).map(([k, stat]) => {
                const pct =
                  stat.attempts > 0
                    ? Math.round((stat.correct / stat.attempts) * 100)
                    : 0;
                return (
                  <div
                    key={k}
                    className="p-2.5 rounded-xl border border-paper-200 dark:border-blueprint-800 bg-paper-100/60 dark:bg-blueprint-950 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">
                        {topicLabels[k] || k}
                      </span>
                      <span className="font-mono text-[11px] text-ink-500">
                        {stat.correct}/{stat.attempts} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-paper-200 dark:bg-blueprint-800 overflow-hidden">
                      <div
                        className="h-full bg-lt rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Saved Scenes */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500">
                Pranchas Salvas ({progress.savedSnapshots.length})
              </div>
              {progress.savedSnapshots.length === 0 ? (
                <p className="text-xs text-ink-500">
                  Salve suas configurações no Lab 3D/2D para revisá-las aqui!
                </p>
              ) : (
                progress.savedSnapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-100 dark:bg-blueprint-950"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onLoadSnapshot(snap.points);
                        onClose();
                      }}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="text-xs font-bold truncate">
                        {snap.name}
                      </div>
                      <div className="text-[10px] text-ink-500">
                        {snap.points.length} ponto(s) · Clique para abrir
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="p-1.5 text-ink-500 hover:text-pv"
                      aria-label="Excluir prancha salva"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={exportBackup}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950 text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Backup JSON
              </button>
              <button
                type="button"
                onClick={onResetProgress}
                className="px-3 py-2.5 rounded-xl border border-pv/40 text-pv text-xs font-bold hover:bg-pv-light/50"
              >
                Zerar
              </button>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Theme */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500">
                Tema da Prancheta
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdatePrefs({ theme: "atelier" })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold ${
                    progress.preferences.theme === "atelier"
                      ? "border-ph bg-ph-light text-ph"
                      : "border-paper-300 dark:border-blueprint-700"
                  }`}
                >
                  <Sun className="w-4 h-4" /> Atelier Claro
                </button>
                <button
                  type="button"
                  onClick={() => onUpdatePrefs({ theme: "blueprint" })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold ${
                    progress.preferences.theme === "blueprint"
                      ? "border-sky-400 bg-blueprint-800 text-sky-300"
                      : "border-paper-300 dark:border-blueprint-700"
                  }`}
                >
                  <Moon className="w-4 h-4" /> Blueprint Noturno
                </button>
              </div>
            </div>

            {/* Notation */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500">
                Convenção de Notação
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "uerj", label: "Clássica UERJ (A, A')" },
                    { id: "iso", label: "ISO Numérica (A₁, A₂)" },
                  ] as Array<{ id: NotationMode; label: string }>
                ).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onUpdatePrefs({ notation: n.id })}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-mono font-bold ${
                      progress.preferences.notation === n.id
                        ? "border-ph bg-ph-light text-ph dark:bg-sky-950 dark:text-sky-300"
                        : "border-paper-300 dark:border-blueprint-700"
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase tracking-wider text-ink-500">
                  Velocidade da Voz
                </span>
                <span className="font-mono font-bold text-ph">
                  {progress.preferences.voiceRate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.35}
                step={0.05}
                value={progress.preferences.voiceRate}
                onChange={(e) =>
                  onUpdatePrefs({ voiceRate: Number(e.target.value) })
                }
                className="w-full accent-ph"
              />
            </div>

            {/* Optional Gemini API key override */}
            <div className="space-y-2 rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/70 dark:bg-blueprint-950 p-3.5">
              <div className="text-xs font-extrabold flex items-center gap-1.5 text-ink-900 dark:text-white">
                <KeyRound className="w-3.5 h-3.5 text-ph" />
                Gemini API Key (Opcional · Voz Neural TTS)
              </div>
              <p className="text-[11px] text-ink-500 dark:text-slate-400 leading-relaxed">
                Por padrão o servidor usa a chave configurada em ambiente e, caso os créditos do AI Studio estejam esgotados, alterna automaticamente para a voz pt-BR nativa do seu dispositivo.
              </p>
              <input
                type="password"
                value={progress.preferences.customGeminiKey ?? ""}
                onChange={(e) =>
                  onUpdatePrefs({ customGeminiKey: e.target.value })
                }
                placeholder="Cole outra chave Gemini se quiser sobrescrever"
                className="w-full px-3 py-2 rounded-xl bg-paper-50 dark:bg-blueprint-900 border border-paper-300 dark:border-blueprint-700 text-xs font-mono outline-none focus:border-ph"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
