"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceState {
  speakingId: string | null;
  loadingId: string | null;
  engine: "gemini" | "browser" | null;
  speak: (
    id: string,
    text: string,
    professor?: "monge" | "epura",
    rate?: number,
    customApiKey?: string
  ) => Promise<void>;
  stop: () => void;
}

export function useProfessorVoice(): VoiceState {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [engine, setEngine] = useState<"gemini" | "browser" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    setLoadingId(null);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const speakWithBrowser = useCallback(
    (id: string, text: string, professor: "monge" | "epura", rate: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = Math.max(0.75, Math.min(1.4, rate));
      utterance.pitch = professor === "epura" ? 1.08 : 0.94;

      const voices = window.speechSynthesis.getVoices();
      const ptVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith("pt")
      );
      if (ptVoices.length > 0) {
        const preferred =
          professor === "epura"
            ? ptVoices.find((v) =>
                /francisca|maria|luciana|google|female|fem/i.test(v.name)
              )
            : ptVoices.find((v) =>
                /antonio|daniel|felipe|google|male|masc/i.test(v.name)
              );
        utterance.voice = preferred || ptVoices[0];
      }

      utterance.onstart = () => {
        setEngine("browser");
        setSpeakingId(id);
      };
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      setEngine("browser");
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const speak = useCallback(
    async (
      id: string,
      text: string,
      professor: "monge" | "epura" = "monge",
      rate = 1.0,
      customApiKey?: string
    ) => {
      if (speakingId === id || loadingId === id) {
        stop();
        return;
      }
      stop();
      setLoadingId(id);

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, professor, customApiKey }),
        });
        const data = (await res.json()) as {
          fallback?: boolean;
          audioBase64?: string;
          mimeType?: string;
        };

        if (!data.fallback && data.audioBase64) {
          const audio = new Audio(
            `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`
          );
          audio.playbackRate = Math.max(0.75, Math.min(1.4, rate));
          audioRef.current = audio;
          audio.onended = () => {
            setSpeakingId(null);
            audioRef.current = null;
          };
          audio.onerror = () => {
            setLoadingId(null);
            speakWithBrowser(id, text, professor, rate);
          };
          setLoadingId(null);
          setEngine("gemini");
          setSpeakingId(id);
          await audio.play();
          return;
        }
      } catch {
        // fall through to browser speechSynthesis
      }

      setLoadingId(null);
      speakWithBrowser(id, text, professor, rate);
    },
    [loadingId, speakingId, speakWithBrowser, stop]
  );

  return { speakingId, loadingId, engine, speak, stop };
}
