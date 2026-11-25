"use client";

import React, { useEffect, useRef, useState } from "react";
import { GDPoint } from "@/lib/gd-math";
import { TutorApiResponse, TutorDirectorCommand } from "@/lib/director";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { TtsModelTier, VoiceState } from "@/lib/voice";
import {
  Crosshair,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

interface ChatEntry {
  id: string;
  role: "user" | "tutor";
  professor: "monge" | "epura";
  text: string;
  director?: TutorDirectorCommand;
  source?: string;
}

interface LiveProfessorSidebarProps {
  open: boolean;
  onClose: () => void;
  subject?: "gd" | "calc1";
  contextPoints: GDPoint[];
  onExecuteDirector: (cmd: TutorDirectorCommand) => void;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
  ttsModelTier: TtsModelTier;
}

const GD_LIVE_CHIPS = [
  { label: "Circula o afastamento!", q: "Circula o afastamento e mostra por que +Y desce na épura!" },
  { label: "2º Diedro ao vivo", q: "Mostra um ponto no 2º diedro e rebate para a épura!" },
  { label: "Circula a Linha de Terra", q: "Circula a Linha de Terra e explica o que ela faz" },
  { label: "UERJ Ex. 1 (Origem)", q: "Explica e destaca o Exercício 1 da UERJ" },
  { label: "UERJ Ex. 2 (Colinear)", q: "Explica e destaca o Exercício 2 da UERJ" },
  { label: "Ponto (P)(+3; -2; +4)", q: "Mostra o ponto (P)(+3; -2; +4) no lab e explica" },
  { label: "2º Bissetor (A ≡ A')", q: "Mostra o 2º bissetor onde as projeções coincidem" },
  { label: "Y-Up vs Cota Z", q: "Qual a diferença do Y-Up do Three.js para a cota Z?" },
];

const CALC_LIVE_CHIPS = [
  { label: "O que é Domínio Natural?", q: "O que é domínio natural de uma função e como achar?" },
  { label: "O que é a Raiz?", q: "O que é a raiz de uma função?" },
  { label: "[a, b] vs ]a, b[", q: "Qual a diferença entre intervalo fechado [a, b] e aberto ]a, b[?" },
  { label: "ℚ vs ℤ (Conjuntos)", q: "Qual a diferença entre naturais, inteiros, racionais e reais?" },
  { label: "Limite 0/0", q: "Por que o limite 0/0 pode existir mesmo tendo um buraco na função?" },
  { label: "Secante → Tangente", q: "Como a reta secante vira a derivada (reta tangente)?" },
  { label: "Regra da Cadeia", q: "Como aplicar a regra da cadeia sem errar na P2?" },
  { label: "Nota MP e PF", q: "Como funciona a média MP e a prova final PF em Cálculo 1?" },
];

export function LiveProfessorSidebar({
  open,
  onClose,
  subject = "gd",
  contextPoints,
  onExecuteDirector,
  voice,
  voiceRate,
  customApiKey,
  ttsModelTier,
}: LiveProfessorSidebarProps) {
  const chips = subject === "calc1" ? CALC_LIVE_CHIPS : GD_LIVE_CHIPS;
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const isCalc = subject === "calc1";
  const introText = isCalc
    ? "Estou conectado ao seu Lab de Cálculo 1 e Pré-Cálculo! Pergunte sobre Domínio Natural, Raízes, Intervalos, Limites, Derivadas, Integrais ou as notas MP/PF da UERJ."
    : "Estou conectado ao seu Laboratório 3D e 2D! Me pergunte qualquer dúvida (ou fale no microfone 🎙️) — eu explico em voz alta e circulo na hora no desenho o que estou falando!";

  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "intro-live",
      role: "tutor",
      professor: "monge",
      text: introText,
    },
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "intro-live") {
        return [{ ...prev[0], text: introText }];
      }
      return prev;
    });
  }, [introText]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendQuestion = async (rawText: string) => {
    const q = rawText.trim();
    if (!q || loading) return;

    const userEntry: ChatEntry = {
      id: `u-${Date.now()}`,
      role: "user",
      professor: "monge",
      text: q,
    };
    setMessages((prev) => [...prev, userEntry]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          subject,
          contextPoints: contextPoints.map((p) => ({
            label: p.label,
            x: p.x,
            y: p.y,
            z: p.z,
          })),
          customApiKey,
        }),
      });
      const data = (await res.json()) as TutorApiResponse;
      const msgId = `live-${Date.now()}`;
      const prof = "monge" as const;

      const tutorEntry: ChatEntry = {
        id: msgId,
        role: "tutor",
        professor: prof,
        text: data.answer,
        director: data.director,
        source: data.source,
      };
      setMessages((prev) => [...prev, tutorEntry]);

      // Execute live visual highlighting/circling/folding on the Lab!
      if (data.director) {
        onExecuteDirector(data.director);
      }

      // Speak automatically if Auto-Voz is ON!
      if (autoSpeak && data.answer) {
        void voice.speak(
          msgId,
          data.answer,
          prof,
          voiceRate,
          customApiKey,
          ttsModelTier
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "tutor",
          professor: "monge",
          text: "Tive uma pequena oscilação de rede — tente novamente que já circulo no laboratório para você!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: {
          results: ArrayLike<ArrayLike<{ transcript: string }>>;
        }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: {
          results: ArrayLike<ArrayLike<{ transcript: string }>>;
        }) => void;
        onend: () => void;
        onerror: () => void;
        start: () => void;
        stop: () => void;
      };
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setInput(
        isCalc
          ? "Qual o domínio natural de f(x) = √(x+1)?"
          : "Circula o afastamento e explica!"
      );
      return;
    }
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        void sendQuestion(transcript);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  if (!open) return null;

  const isTalking = Boolean(voice.speakingId?.startsWith("live-"));
  const currentProf =
    messages[messages.length - 1]?.role === "tutor"
      ? messages[messages.length - 1].professor
      : "monge";

  return (
    <aside
      aria-label="Chat lateral ao vivo com o professor"
      className="fixed lg:sticky bottom-[64px] lg:bottom-auto lg:top-[76px] inset-x-2 lg:inset-x-auto z-30 lg:z-20 lg:w-[348px] xl:w-[368px] shrink-0 h-[44vh] min-h-[290px] max-h-[420px] lg:h-[calc(100vh-96px)] lg:max-h-none rounded-2xl border-2 border-ph/35 dark:border-sky-600/50 bg-paper-50/98 dark:bg-blueprint-900/98 backdrop-blur-md shadow-2xl lg:shadow-draft flex flex-col overflow-hidden animate-fade-up"
    >
      {/* Top Studio Header */}
      <div className="px-3.5 py-2.5 border-b border-paper-200 dark:border-blueprint-800 bg-gradient-to-r from-ph-light/70 via-paper-50 to-paper-50 dark:from-sky-950/60 dark:via-blueprint-900 dark:to-blueprint-900 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <ProfessorAvatar
            professor={currentProf}
            size="sm"
            mood={isTalking ? "explaining" : "friendly"}
            speaking={isTalking}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-ink-900 dark:text-white truncate">
                Professor ao Vivo
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>
            <div className="text-[10px] font-mono text-ink-500 dark:text-slate-400 truncate">
              {voice.engine === "gemini-3.8"
                ? voice.modelUsed
                : isCalc
                  ? "Pré-Cálculo & Cálculo I (UERJ)"
                  : "Fala + Circula no Lab 3D/2D"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (autoSpeak && isTalking) voice.stop();
              setAutoSpeak((v) => !v);
            }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border transition ${
              autoSpeak
                ? "bg-ph text-white border-ph"
                : "bg-paper-100 dark:bg-blueprint-800 text-ink-500 border-paper-300 dark:border-blueprint-700"
            }`}
            title="Ler respostas automaticamente com voz"
          >
            {autoSpeak ? (
              <>
                <Volume2 className="w-3 h-3" /> Voz
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3" /> Mudo
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:bg-paper-200 dark:hover:bg-blueprint-800"
            aria-label="Minimizar chat ao vivo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Demo Action Chips */}
      <div className="px-3 py-2 border-b border-paper-200/80 dark:border-blueprint-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-paper-100/60 dark:bg-blueprint-950/60">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => void sendQuestion(chip.q)}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-paper-50 dark:bg-blueprint-900 border border-paper-300 dark:border-blueprint-700 text-ink-800 dark:text-slate-200 hover:border-ph hover:text-ph transition"
          >
            <MessageSquare className="w-2.5 h-2.5 text-ph" />
            {chip.label}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
      >
        {messages.map((m) => {
          const speakingThis = voice.speakingId === m.id;
          return (
            <div
              key={m.id}
              className={`flex flex-col gap-1 ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-ink-900 text-paper-50 dark:bg-sky-500 dark:text-blueprint-950 font-medium"
                    : "bg-paper-100 dark:bg-blueprint-950 border border-paper-300/90 dark:border-blueprint-700 text-ink-800 dark:text-slate-100"
                }`}
              >
                {m.text}
              </div>

              {m.role === "tutor" && (
                <div className="flex flex-wrap items-center gap-1.5 pl-1">
                  <button
                    type="button"
                    onClick={() =>
                      voice.speak(
                        m.id,
                        m.text,
                        m.professor,
                        voiceRate,
                        customApiKey,
                        ttsModelTier
                      )
                    }
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition ${
                      speakingThis
                        ? "bg-pv text-white"
                        : "bg-ph-light/80 dark:bg-sky-950 text-ph dark:text-sky-300 hover:bg-ph-light"
                    }`}
                  >
                    {speakingThis ? (
                      <>
                        <VolumeX className="w-3 h-3" /> Parar
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" /> Ouvir
                      </>
                    )}
                  </button>

                  {m.director && (
                    <button
                      type="button"
                      onClick={() => onExecuteDirector(m.director!)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-amber-100 dark:bg-amber-950/60 text-bisector dark:text-amber-300 hover:opacity-90 transition"
                    >
                      <Crosshair className="w-3 h-3" />
                      {m.director.spotlight?.caption
                        ? "Destacar no Lab"
                        : "Mostrar no Lab"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-bisector dark:text-amber-300 text-xs font-semibold animate-pulse">
            <Crosshair className="w-3.5 h-3.5 animate-spin" />
            Professor preparando o destaque no Lab...
          </div>
        )}
      </div>

      {/* Bottom Input + Mic Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendQuestion(input);
        }}
        className="p-2.5 border-t border-paper-200 dark:border-blueprint-800 bg-paper-50 dark:bg-blueprint-900 flex items-center gap-1.5"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2 rounded-xl border transition shrink-0 ${
            listening
              ? "bg-pv text-white border-pv animate-pulse"
              : "bg-paper-100 dark:bg-blueprint-950 border-paper-300 dark:border-blueprint-700 text-ink-700 dark:text-slate-200 hover:border-ph"
          }`}
          title="Falar dúvida pelo microfone (pt-BR)"
          aria-label="Falar pelo microfone"
        >
          {listening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            listening
              ? "Ouvindo sua dúvida..."
              : isCalc
                ? "Ex: Qual o domínio natural de √(x+1)?"
                : "Ex: Circula o afastamento de (P)(+2;-3;+4)"
          }
          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300 dark:border-blueprint-700 text-xs outline-none focus:border-ph"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-ph hover:bg-ph-dark text-white disabled:opacity-40 transition shrink-0"
          aria-label="Enviar dúvida"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}
