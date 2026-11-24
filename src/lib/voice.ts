"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TtsModelTier = "gemini-3.8-flash-tts" | "gemini-3.8-flash-lite-tts";

export interface VoiceState {
  speakingId: string | null;
  loadingId: string | null;
  activeSpeaker: "monge" | "epura" | null;
  engine: "gemini-3.8" | "browser" | null;
  modelUsed: string | null;
  fallbackReason: string | null;
  speak: (
    id: string,
    text: string,
    professor?: "monge" | "epura" | "dialogue",
    rate?: number,
    customApiKey?: string,
    modelTier?: TtsModelTier
  ) => Promise<void>;
  stop: () => void;
}

export function useProfessorVoice(): VoiceState {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<"monge" | "epura" | null>(
    null
  );
  const [engine, setEngine] = useState<"gemini-3.8" | "browser" | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, { dataUri: string; model: string }>>(
    new Map()
  );
  const cancelledRef = useRef(false);

  const stop = useCallback(() => {
    cancelledRef.current = true;
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
    setActiveSpeaker(null);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const speakWithBrowser = useCallback(
    (
      id: string,
      text: string,
      professor: "monge" | "epura" | "dialogue",
      rate: number
    ) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setSpeakingId(null);
        setActiveSpeaker(null);
        return;
      }
      window.speechSynthesis.cancel();
      cancelledRef.current = false;

      const voices = window.speechSynthesis.getVoices();
      const ptVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith("pt")
      );

      const pickVoice = (who: "monge" | "epura") => {
        if (ptVoices.length === 0) return undefined;
        const preferred =
          who === "epura"
            ? ptVoices.find((v) =>
                /francisca|maria|luciana|google|female|fem/i.test(v.name)
              )
            : ptVoices.find((v) =>
                /antonio|daniel|felipe|google|male|masc/i.test(v.name)
              );
        return preferred || ptVoices[0];
      };

      // Support dialogue lines like "Prof. Monge: ... \n Profa. Épura: ..."
      const turns: Array<{ who: "monge" | "epura"; line: string }> =
        professor === "dialogue"
          ? text
              .split(/\n+/)
              .map((l) => l.trim())
              .filter(Boolean)
              .map((line) => {
                if (/^profa\.?\s*[eé]pura\s*:/i.test(line)) {
                  return {
                    who: "epura" as const,
                    line: line.replace(/^profa\.?\s*[eé]pura\s*:/i, "").trim(),
                  };
                }
                return {
                  who: "monge" as const,
                  line: line.replace(/^prof\.?\s*monge\s*:/i, "").trim(),
                };
              })
          : [{ who: professor, line: text }];

      setEngine("browser");
      setModelUsed("pt-BR Web Speech");
      setSpeakingId(id);

      const speakIndex = (idx: number) => {
        if (cancelledRef.current || idx >= turns.length) {
          setSpeakingId(null);
          setActiveSpeaker(null);
          return;
        }
        const turn = turns[idx];
        setActiveSpeaker(turn.who);
        const u = new SpeechSynthesisUtterance(turn.line);
        u.lang = "pt-BR";
        u.rate = Math.max(0.75, Math.min(1.4, rate));
        u.pitch = turn.who === "epura" ? 1.09 : 0.93;
        const v = pickVoice(turn.who);
        if (v) u.voice = v;
        u.onend = () => speakIndex(idx + 1);
        u.onerror = () => {
          setSpeakingId(null);
          setActiveSpeaker(null);
        };
        window.speechSynthesis.speak(u);
      };

      speakIndex(0);
    },
    []
  );

  const speak = useCallback(
    async (
      id: string,
      text: string,
      professor: "monge" | "epura" | "dialogue" = "monge",
      rate = 1.0,
      customApiKey?: string,
      modelTier: TtsModelTier = "gemini-3.8-flash-tts"
    ) => {
      if (speakingId === id || loadingId === id) {
        stop();
        return;
      }
      stop();
      cancelledRef.current = false;
      setLoadingId(id);

      const cacheKey = `${modelTier}:${professor}:${text.slice(0, 120)}:${text.length}`;
      const cached = cacheRef.current.get(cacheKey);

      const playDataUri = async (dataUri: string, usedModel: string) => {
        if (cancelledRef.current) return;
        const audio = new Audio(dataUri);
        audio.playbackRate = Math.max(0.75, Math.min(1.4, rate));
        audioRef.current = audio;
        audio.onended = () => {
          setSpeakingId(null);
          setActiveSpeaker(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setLoadingId(null);
          speakWithBrowser(id, text, professor, rate);
        };
        setLoadingId(null);
        setEngine("gemini-3.8");
        setModelUsed(usedModel);
        setFallbackReason(null);
        setActiveSpeaker(professor === "epura" ? "epura" : "monge");
        setSpeakingId(id);
        await audio.play();
      };

      if (cached) {
        await playDataUri(cached.dataUri, cached.model);
        return;
      }

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, professor, customApiKey, modelTier }),
        });
        const data = (await res.json()) as {
          fallback?: boolean;
          reason?: string;
          audioBase64?: string;
          mimeType?: string;
          modelUsed?: string;
        };

        if (!data.fallback && data.audioBase64) {
          const dataUri = `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`;
          const used = data.modelUsed || modelTier;
          cacheRef.current.set(cacheKey, { dataUri, model: used });
          await playDataUri(dataUri, used);
          return;
        }
        if (data.reason) {
          setFallbackReason(data.reason);
        }
      } catch {
        setFallbackReason("network_error");
      }

      if (cancelledRef.current) return;
      setLoadingId(null);
      speakWithBrowser(id, text, professor, rate);
    },
    [loadingId, speakingId, speakWithBrowser, stop]
  );

  return {
    speakingId,
    loadingId,
    activeSpeaker,
    engine,
    modelUsed,
    fallbackReason,
    speak,
    stop,
  };
}
