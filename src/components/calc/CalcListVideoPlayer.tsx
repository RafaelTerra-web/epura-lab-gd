"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CALC_LIST_EPISODES,
  CalcListSceneCue,
  CalcListTimingsMap,
  resolveCalcListLabMoment,
} from "@/lib/calc-list-episodes";
import { CalcLabState } from "@/lib/calc-math";
import { CalcListSceneCanvas } from "./CalcListScenes";
import { LipSyncMascot, MouthFrame } from "@/components/LipSyncMascot";
import { playVideoSound, type VideoSound } from "@/lib/video-effects";
import { sfx } from "@/lib/sfx";
import styles from "@/components/MotionVideoPlayer.module.css";
import {
  Captions,
  CheckCircle2,
  ClipboardCheck,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";

interface CalcListVideoPlayerProps {
  watchedEpisodes?: string[];
  onEpisodeWatched?: (episodeId: string) => void;
  onOpenInCalcLab: (state: CalcLabState) => void;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export function CalcListVideoPlayer({
  watchedEpisodes = [],
  onEpisodeWatched,
  onOpenInCalcLab,
}: CalcListVideoPlayerProps) {
  const [epIndex, setEpIndex] = useState(0);
  const [timings, setTimings] = useState<CalcListTimingsMap>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [mouth, setMouth] = useState<MouthFrame>("closed");
  const [energy, setEnergy] = useState(0);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrubPreview, setScrubPreview] = useState<{
    ratio: number;
    time: number;
    label: string;
    sceneIndex: number;
  } | null>(null);

  const isFullscreen = nativeFullscreen || cssFullscreen;
  const playerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSceneIdRef = useRef<string | null>(null);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    fetch("/audio/calc-list/timings.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: CalcListTimingsMap) => setTimings(d || {}))
      .catch(() => {});
  }, []);

  const baseEp = CALC_LIST_EPISODES[epIndex] ?? CALC_LIST_EPISODES[0];
  const epTiming = timings[baseEp.id];

  const scenes: CalcListSceneCue[] = useMemo(() => {
    if (!epTiming?.scenes?.length) return baseEp.scenes;
    return baseEp.scenes.map((sc, idx) => {
      const timed = epTiming.scenes.find((ts) => ts.id === sc.id) ?? epTiming.scenes[idx];
      if (!timed) return sc;
      return { ...sc, startSec: timed.startSec, endSec: timed.endSec };
    });
  }, [baseEp.scenes, epTiming]);

  const effectiveDuration = Math.max(
    1,
    duration || epTiming?.duration || scenes[scenes.length - 1]?.endSec || 180
  );

  const sceneIndex = useMemo(() => {
    const idx = scenes.findIndex(
      (sc, i) =>
        currentTime >= sc.startSec &&
        (currentTime < sc.endSec || i === scenes.length - 1)
    );
    return idx >= 0 ? idx : 0;
  }, [scenes, currentTime]);

  const activeScene = scenes[sceneIndex] ?? scenes[0];
  const sceneSpan = Math.max(0.25, activeScene.endSec - activeScene.startSec);
  const sceneT = clamp01((currentTime - activeScene.startSec) / sceneSpan);
  const activeMoment = useMemo(
    () => resolveCalcListLabMoment(baseEp, activeScene),
    [baseEp, activeScene]
  );

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audioCtxRef.current) {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = new AudioCtor();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const sfxGain = ctx.createGain();
      sfxGain.gain.value = isMuted ? 0 : volume;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sfxGain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sfxGainRef.current = sfxGain;
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume().catch(() => {});
    }
  }, [isMuted, volume]);

  const playCueSound = useCallback(
    (sound: VideoSound) => {
      if (!sfx.isEnabled() || isMuted || volume <= 0.01) return;
      const ctx = audioCtxRef.current;
      const out = sfxGainRef.current;
      if (ctx && out && ctx.state === "running") {
        playVideoSound(ctx, out, sound);
      }
    },
    [isMuted, volume]
  );

  useEffect(() => {
    if (!isPlaying) {
      lastSceneIdRef.current = activeScene.id;
      return;
    }
    if (lastSceneIdRef.current !== activeScene.id) {
      lastSceneIdRef.current = activeScene.id;
      playCueSound(activeScene.soundCue ?? "whoosh");
    }
  }, [activeScene.id, activeScene.soundCue, isPlaying, playCueSound]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
      audio.muted = isMuted;
      audio.playbackRate = playbackRate;
    }
    if (sfxGainRef.current) {
      sfxGainRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, playbackRate]);

  const revealControls = useCallback(
    (pin = false) => {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (!pin && isFullscreen && isPlaying) {
        hideTimerRef.current = setTimeout(() => {
          if (!scrubbingRef.current) setControlsVisible(false);
        }, 2600);
      }
    },
    [isFullscreen, isPlaying]
  );

  useEffect(() => {
    if (!isFullscreen || !isPlaying) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      revealControls(false);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isFullscreen, isPlaying, revealControls]);

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setNativeFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = playerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    if (!el) return;
    if (isFullscreen) {
      setCssFullscreen(false);
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      return;
    }
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else {
        setCssFullscreen(true);
      }
    } catch {
      setCssFullscreen(true);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const bins = new Uint8Array(128);
    let smoothE = 0;

    const tick = () => {
      const audio = audioRef.current;
      if (audio) {
        setCurrentTime(audio.currentTime);
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      }
      if (isPlaying && analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(bins);
        let sum = 0;
        for (let i = 0; i < bins.length; i++) {
          const n = (bins[i] - 128) / 128;
          sum += n * n;
        }
        const rms = Math.sqrt(sum / bins.length);
        smoothE = smoothE * 0.65 + rms * 0.35;
        setEnergy(smoothE);
        setMouth(
          smoothE > 0.14
            ? "open"
            : smoothE > 0.08
              ? "mid"
              : smoothE > 0.032
                ? "small"
                : "closed"
        );
      } else {
        setEnergy(0);
        setMouth("closed");
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      ensureAudioGraph();
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  }, [ensureAudioGraph, isPlaying]);

  const seekToSeconds = useCallback(
    (sec: number) => {
      const clamped = Math.max(0, Math.min(effectiveDuration, sec));
      const audio = audioRef.current;
      if (audio) audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [effectiveDuration]
  );

  const selectEpisode = useCallback((idx: number) => {
    const safe =
      ((idx % CALC_LIST_EPISODES.length) + CALC_LIST_EPISODES.length) %
      CALC_LIST_EPISODES.length;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setMouth("closed");
    setEnergy(0);
    setEpIndex(safe);
    sfx.click();
  }, []);

  const updateScrubPreview = useCallback(
    (clientX: number) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      const ratio = clamp01((clientX - rect.left) / rect.width);
      const time = ratio * effectiveDuration;
      const idx = scenes.findIndex(
        (sc, i) => time >= sc.startSec && (time < sc.endSec || i === scenes.length - 1)
      );
      const safeIdx = idx >= 0 ? idx : 0;
      setScrubPreview({
        ratio,
        time,
        label: scenes[safeIdx]?.label ?? "",
        sceneIndex: safeIdx,
      });
    },
    [effectiveDuration, scenes]
  );

  const progress = clamp01(currentTime / effectiveDuration);
  const hideChrome = isFullscreen && !controlsVisible;
  const listWatchedCount = CALC_LIST_EPISODES.filter((e) =>
    watchedEpisodes.includes(e.id)
  ).length;

  return (
    <section
      data-calc-list-video-section
      className="grid grid-cols-1 xl:grid-cols-[1fr_322px] gap-4 items-start"
    >
      {/* LEFT: 16:9 VIDEO STAGE + GABARITO & LAB SYNC */}
      <div className="space-y-3">
        <div
          ref={playerRef}
          data-video-player
          data-fullscreen={isFullscreen ? "true" : undefined}
          data-expanded={cssFullscreen ? "true" : undefined}
          data-idle-cursor={hideChrome ? "true" : undefined}
          onPointerMove={() => revealControls(false)}
          onPointerDown={() => revealControls(false)}
          className={`${styles.player} text-white`}
        >
          <audio
            ref={audioRef}
            src={epTiming?.audioSrc || baseEp.audioSrc}
            preload="metadata"
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) setDuration(d);
            }}
            onEnded={() => {
              setIsPlaying(false);
              setMouth("closed");
              setEnergy(0);
              onEpisodeWatched?.(baseEp.id);
              playCueSound("resolve");
            }}
          />

          {/* 16:9 STAGE */}
          <div data-video-frame className={styles.frame} onClick={() => void togglePlay()}>
            <svg
              viewBox="0 0 960 540"
              className="w-full h-full block select-none"
              role="img"
              aria-label={`Resolução ${baseEp.number}: ${activeScene.label}`}
            >
              <defs>
                <radialGradient id="listStudioBg" cx="50%" cy="35%" r="75%">
                  <stop offset="0%" stopColor="#12213D" />
                  <stop offset="100%" stopColor="#060B17" />
                </radialGradient>
              </defs>
              <rect width="960" height="540" fill="url(#listStudioBg)" />
              {Array.from({ length: 19 }).map((_, i) => (
                <line key={`lvg-${i}`} x1={i * 52} y1="0" x2={i * 52} y2="540" stroke="rgba(148,163,184,0.045)" />
              ))}
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`lhg-${i}`} x1="0" y1={i * 52} x2="960" y2={i * 52} stroke="rgba(148,163,184,0.045)" />
              ))}

              {/* Top HUD */}
              <g>
                <rect x="28" y="20" width="904" height="44" rx="14" fill="rgba(15,23,42,0.75)" stroke="rgba(148,163,184,0.2)" />
                <circle cx="52" cy="42" r="5.5" fill={baseEp.themeAccent} />
                <text x="68" y="47" fontSize="13.5" fontWeight="800" fill={baseEp.themeAccent} fontFamily="var(--font-mono), monospace">
                  LISTA · {baseEp.number}
                </text>
                <text x="220" y="47" fontSize="13.8" fontWeight="700" fill="#F1F5F9">
                  {activeScene.label}
                </text>
                <text x="912" y="47" textAnchor="end" fontSize="12.5" fontWeight="700" fill="#94A3B8" fontFamily="var(--font-mono), monospace">
                  Parte {sceneIndex + 1}/{scenes.length}
                </text>
              </g>

              <CalcListSceneCanvas episode={baseEp} scene={activeScene} t={sceneT} />
            </svg>

            <div data-video-presenter className={styles.presenter}>
              <LipSyncMascot
                mouth={mouth}
                energy={energy}
                isPlaying={isPlaying}
                label="Prof. Exatas"
              />
            </div>

            {showCaptions && (
              <div className={styles.captionBand} aria-live="polite">
                <p className={styles.caption}>{activeScene.subtitle}</p>
              </div>
            )}

            {!isPlaying && currentTime < 0.25 && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-sky-500/95 text-slate-950 flex items-center justify-center shadow-2xl">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM CONTROLS BAR */}
          <div
            data-video-controls
            data-visible={controlsVisible ? "true" : undefined}
            className={`${styles.transport} px-3.5 py-2.5 border-t border-white/10 space-y-2`}
          >
            <div className="space-y-1">
              <div
                ref={timelineRef}
                className={styles.timeline}
                onPointerMove={(e) => updateScrubPreview(e.clientX)}
                onPointerLeave={() => {
                  if (!scrubbingRef.current) setScrubPreview(null);
                }}
              >
                {scrubPreview && (
                  <div
                    className={styles.scrubTooltip}
                    style={{
                      left: `${Math.max(10, Math.min(90, scrubPreview.ratio * 100))}%`,
                    }}
                  >
                    <span className="font-mono text-xs font-extrabold text-sky-300">
                      {formatTime(scrubPreview.time)}
                    </span>
                    <span className="text-xs font-bold truncate">{scrubPreview.label}</span>
                  </div>
                )}
                <div className={styles.track}>
                  {scenes.map((sc, idx) => {
                    const segStart = sc.startSec / effectiveDuration;
                    const segEnd = sc.endSec / effectiveDuration;
                    const widthPct = Math.max(2, (segEnd - segStart) * 100);
                    const playedInSeg =
                      clamp01((progress - segStart) / Math.max(0.001, segEnd - segStart)) * 100;
                    const hoverInSeg = scrubPreview
                      ? clamp01(
                          (scrubPreview.ratio - segStart) / Math.max(0.001, segEnd - segStart)
                        ) * 100
                      : 0;
                    return (
                      <span
                        key={sc.id}
                        className={styles.segment}
                        data-hovered={scrubPreview?.sceneIndex === idx ? "true" : undefined}
                        style={{ width: `${widthPct}%` }}
                      >
                        {hoverInSeg > 0 && (
                          <span className={styles.segmentHover} style={{ width: `${hoverInSeg}%` }} />
                        )}
                        <span className={styles.segmentPlayed} style={{ width: `${playedInSeg}%` }} />
                      </span>
                    );
                  })}
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={Math.round(progress * 1000)}
                  onPointerDown={(e) => {
                    scrubbingRef.current = true;
                    updateScrubPreview(e.clientX);
                    if (isFullscreen) revealControls(true);
                  }}
                  onPointerUp={() => {
                    scrubbingRef.current = false;
                    setScrubPreview(null);
                    if (isFullscreen) revealControls(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    seekToSeconds((Number(e.target.value) / 1000) * effectiveDuration);
                    if (isFullscreen) revealControls();
                  }}
                  aria-label="Linha do tempo da resolução da lista"
                  className={styles.scrubber}
                />
              </div>

              <div className={`${styles.chapters} flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1`}>
                {scenes.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      playCueSound("click");
                      seekToSeconds(sc.startSec + 0.05);
                    }}
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition ${
                      idx === sceneIndex
                        ? "bg-sky-500/25 text-sky-300 border border-sky-400/50"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {idx + 1}. {sc.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Assistir
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => seekToSeconds(currentTime - 10)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  title="Voltar 10s"
                  aria-label="Voltar 10 segundos"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => selectEpisode(epIndex - 1)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  aria-label="Questão anterior"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => selectEpisode(epIndex + 1)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  aria-label="Próxima questão"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] text-slate-400 pl-1">
                  {formatTime(currentTime)} / {formatTime(effectiveDuration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="min-w-[26px] min-h-[26px] flex items-center justify-center text-slate-300 hover:text-white"
                    aria-label={isMuted ? "Ativar som" : "Silenciar"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-sky-300" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : Math.round(volume * 100)}
                    onChange={(e) => {
                      const v = Number(e.target.value) / 100;
                      setVolume(v);
                      if (v > 0 && isMuted) setIsMuted(false);
                    }}
                    aria-label="Volume do vídeo"
                    className="hidden sm:block w-16 h-1.5 accent-sky-400 cursor-pointer rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const speeds = [0.85, 1, 1.25, 1.5];
                    setPlaybackRate(speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length]);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-mono text-[11px] font-bold"
                >
                  {playbackRate}x
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaptions((v) => !v)}
                  className={`p-1.5 rounded-lg transition ${
                    showCaptions ? "bg-amber-400/20 text-amber-300" : "text-slate-400 hover:bg-white/10"
                  }`}
                  aria-label="Legendas"
                >
                  <Captions className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300"
                  aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Question Summary + Gabarito + 1-Click Lab Sync */}
        <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 space-y-3 shadow-draft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono font-extrabold text-ph dark:text-sky-400">
                STEWART §§ 1.1–1.2 · {baseEp.number} · {baseEp.tag} · Resolução Completa Gemini TTS
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-ink-900 dark:text-white mt-0.5">
                {baseEp.title}
              </h3>
              <p className="text-xs text-ink-500 dark:text-slate-400 mt-0.5">
                {baseEp.subtitle}
              </p>
            </div>
            <button
              type="button"
              data-calc-list-lab-btn
              onClick={() => {
                sfx.click();
                onOpenInCalcLab(activeMoment.labState);
              }}
              className="shrink-0 inline-flex flex-col items-center sm:items-end justify-center px-4 py-2 rounded-xl bg-lt hover:opacity-90 text-white transition shadow-sm"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold">
                <TrendingUp className="w-4 h-4" /> Testar no Lab de Funções
              </span>
              <span className="font-mono text-[10px] text-teal-100/95 mt-0.5">
                {activeMoment.formulaLabel}
              </span>
            </button>
          </div>

          {/* Gabarito Final */}
          <div className="p-3 rounded-xl bg-paper-100/90 dark:bg-blueprint-950 border border-paper-300/80 dark:border-blueprint-800 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-extrabold uppercase text-lt dark:text-teal-300">
              <ClipboardCheck className="w-3.5 h-3.5" /> Gabarito Conferido · {baseEp.number}
            </div>
            <ul className="space-y-1 font-mono text-[11.5px] text-ink-800 dark:text-slate-200">
              {baseEp.gabarito.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          {baseEp.examples.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {baseEp.examples.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    onOpenInCalcLab(ex.labState);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/70 dark:bg-blueprint-950 text-xs font-bold text-ink-700 dark:text-slate-200 hover:border-lt transition"
                >
                  <span>{ex.chipLabel}</span>
                  <span className="font-mono text-[10px] opacity-75">{ex.formulaLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: 18-QUESTION SCROLLABLE PLAYLIST */}
      <aside className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-3.5 shadow-draft space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-ink-500 dark:text-slate-400">
            Lista Stewart · 18 Questões
          </div>
          <span className="font-mono text-[10px] font-bold text-lt dark:text-teal-300">
            {listWatchedCount}/{CALC_LIST_EPISODES.length} vistas
          </span>
        </div>

        <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
          {CALC_LIST_EPISODES.map((ep, idx) => {
            const active = idx === epIndex;
            const watched = watchedEpisodes.includes(ep.id);
            const epDur = timings[ep.id]?.duration;
            return (
              <button
                key={ep.id}
                type="button"
                data-calc-list-ep={ep.id}
                onClick={() => selectEpisode(idx)}
                className={`w-full text-left p-2.5 rounded-2xl border transition flex items-start gap-2.5 ${
                  active
                    ? "bg-ink-900 text-paper-50 border-ink-900 shadow-sm dark:bg-sky-500 dark:text-blueprint-950 dark:border-sky-400"
                    : "bg-paper-100/70 dark:bg-blueprint-950 border-paper-300/80 dark:border-blueprint-800 hover:bg-paper-200/70 dark:hover:bg-blueprint-800"
                }`}
              >
                <span
                  className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-mono text-[10px] font-extrabold ${
                    active
                      ? "bg-paper-50/20 text-white dark:bg-blueprint-950/20 dark:text-blueprint-950"
                      : watched
                        ? "bg-lt/15 text-lt dark:bg-teal-950 dark:text-teal-300"
                        : "bg-paper-200 dark:bg-blueprint-800 text-ink-700 dark:text-slate-300"
                  }`}
                >
                  {active && isPlaying ? (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  ) : watched ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    ep.qNum
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`font-mono text-[10px] font-extrabold ${
                        active
                          ? "text-amber-300 dark:text-blueprint-950/80"
                          : "text-ph dark:text-sky-400"
                      }`}
                    >
                      {ep.number} · {ep.tag}
                    </span>
                    <span className="font-mono text-[10px] opacity-75">
                      {epDur ? formatTime(epDur) : ep.durationHint}
                    </span>
                  </div>
                  <div className="text-xs font-bold leading-snug mt-0.5 truncate">
                    {ep.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </section>
  );
}
