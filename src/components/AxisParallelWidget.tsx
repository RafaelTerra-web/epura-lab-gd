"use client";

import React, { useState } from "react";
import { formatPointCoords, formatSigned } from "@/lib/gd-math";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { TtsModelTier, VoiceState } from "@/lib/voice";
import { ArrowLeftRight, Code2, Compass, Minus, Plus, Volume2, VolumeX } from "lucide-react";

interface AxisParallelWidgetProps {
  dark: boolean;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
  ttsModelTier: TtsModelTier;
}

export function AxisParallelWidget({
  dark,
  voice,
  voiceRate,
  customApiKey,
  ttsModelTier,
}: AxisParallelWidgetProps) {
  const [world, setWorld] = useState<"gd" | "cg">("gd");
  const [x, setX] = useState(2);
  const [yAfast, setYAfast] = useState(5);
  const [zCota, setZCota] = useState(3);

  const speakId = "parallel-yup-zup";
  const isSpeaking = voice.speakingId === speakId;

  const dialogueScript = `Prof. Monge: Essa sua sacada é brilhante! Na computação gráfica, como Unity, Three.js e OpenGL, a altura costuma ser o eixo Y. Mas na Academia, na Geometria Descritiva da UERJ, na Arquitetura e até no Blender, a altura é o eixo Z, chamada de Cota!
Profa. Épura: Isso acontece porque no papel da engenharia a gente começa pela planta baixa no chão, com X e Y planos, e depois sobe as paredes na vertical no eixo Z! Já nas telas de computador, X e Y já eram a largura e a altura da tela, então empurraram o Z para a profundidade!
Prof. Monge: E no fundo, traduzir de um mundo para o outro é moleza: o X continua igual, e você só troca Y com Z! Por isso o ponto A mais dois, mais cinco, mais três da sua aula vira Vector3 dois, três, cinco em Three.js!`;

  const isGD = world === "gd";

  return (
    <section className="rounded-3xl border-2 border-ph/30 dark:border-sky-700/60 bg-paper-50 dark:bg-blueprint-900 p-4 sm:p-6 shadow-draft space-y-5 animate-fade-up">
      {/* Header + World Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-pv dark:text-red-400">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Paralelo Computação 3D (Y-Up) ⇄ Geometria Descritiva (Z-Up)
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-white">
            Sim! Na Academia a Altura (Cota) muda de Y para Z
          </h2>
          <p className="text-xs sm:text-sm text-ink-600 dark:text-slate-300 max-w-2xl">
            Alterne entre o sistema da <strong>Computação Gráfica / Games (Y-Up)</strong> e o sistema da{" "}
            <strong>Geometria Descritiva / UERJ / CAD (Z-Up)</strong> para ver exatamente o que troca de lugar!
          </p>
        </div>

        {/* 2-Professor Dialogue Audio Button (uses Gemini 3.8 Multi-Speaker TTS!) */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-paper-100 dark:bg-blueprint-950 border border-paper-300 dark:border-blueprint-700 shrink-0">
          <div className="flex -space-x-2">
            <ProfessorAvatar
              professor="monge"
              size="sm"
              speaking={isSpeaking && voice.activeSpeaker !== "epura"}
            />
            <ProfessorAvatar
              professor="epura"
              size="sm"
              speaking={isSpeaking && voice.activeSpeaker === "epura"}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              voice.speak(
                speakId,
                dialogueScript,
                "dialogue",
                voiceRate,
                customApiKey,
                ttsModelTier
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              isSpeaking
                ? "bg-pv text-white"
                : "bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950"
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" /> Parar
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" /> Diálogo em Áudio
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Switcher Pill */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-2xl bg-paper-200/80 dark:bg-blueprint-950 border border-paper-300 dark:border-blueprint-800">
        <button
          type="button"
          onClick={() => setWorld("gd")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            isGD
              ? "bg-paper-50 dark:bg-blueprint-800 text-ink-900 dark:text-white shadow-sm ring-1 ring-ph/30"
              : "text-ink-500 dark:text-slate-400"
          }`}
        >
          <Compass className="w-4 h-4 text-ph" />
          Geometria Descritiva · Z-Up (UERJ / Monge / Blender / CAD)
        </button>
        <button
          type="button"
          onClick={() => setWorld("cg")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            !isGD
              ? "bg-paper-50 dark:bg-blueprint-800 text-ink-900 dark:text-white shadow-sm ring-1 ring-pv/30"
              : "text-ink-500 dark:text-slate-400"
          }`}
        >
          <Code2 className="w-4 h-4 text-pv" />
          Computação 3D · Y-Up (Three.js / Unity / OpenGL / Maya)
        </button>
      </div>

      {/* Main Comparison Stage: Animated Gizmo + Live Translator */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4 items-stretch">
        {/* LEFT: Animated Axis Morph SVG Gizmo */}
        <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/85 dark:bg-blueprint-950 p-4 flex flex-col items-center justify-between gap-3">
          <svg
            key={world}
            viewBox="0 0 340 255"
            className="w-full max-w-[360px] h-auto select-none"
          >
            {/* Subtle ground plane floor */}
            <polygon
              points="170,192 288,162 192,126 74,156"
              fill={isGD ? "rgba(30,86,160,0.12)" : "rgba(15,118,110,0.11)"}
              stroke={isGD ? "#1E56A0" : "#0F766E"}
              strokeOpacity="0.4"
              strokeDasharray="4 3"
            />
            <text
              x="228"
              y="164"
              fontSize="9"
              fontWeight="700"
              fill={dark ? "#94A3B8" : "#64748B"}
              fontFamily="var(--font-mono), monospace"
            >
              {isGD ? "Chão = plano XY (π)" : "Chão = plano XZ"}
            </text>

            {/* Origin */}
            <circle cx="170" cy="158" r="5" fill={dark ? "#F8FAFC" : "#1C1917"} />

            {/* RIGHT AXIS (+X in both worlds!) */}
            <g className="animate-draw-stroke">
              <line
                x1="170"
                y1="158"
                x2="294"
                y2="136"
                stroke="#0F766E"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <polygon points="298,135 286,131 288,143" fill="#0F766E" />
            </g>
            <rect x="242" y="106" width="90" height="24" rx="7" fill="#0F766E" />
            <text
              x="287"
              y="122"
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              fill="#FFFFFF"
              fontFamily="var(--font-mono), monospace"
            >
              {isGD ? "+X Abscissa" : "+X Largura"}
            </text>

            {/* UP AXIS (HEIGHT): Z in GD, Y in CG! */}
            <g className="animate-draw-stroke">
              <line
                x1="170"
                y1="158"
                x2="170"
                y2="38"
                stroke="#C94032"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <polygon points="170,30 163,44 177,44" fill="#C94032" />
            </g>
            <g className="animate-float-gentle">
              <rect x="114" y="6" width="112" height="24" rx="8" fill="#C94032" />
              <text
                x="170"
                y="22"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="800"
                fill="#FFFFFF"
                fontFamily="var(--font-mono), monospace"
              >
                {isGD ? "+Z COTA (Altura)" : "+Y ALTURA (Up)"}
              </text>
            </g>

            {/* FRONT AXIS (DEPTH): Y in GD, Z in CG! */}
            <g className="animate-draw-stroke">
              <line
                x1="170"
                y1="158"
                x2="78"
                y2="210"
                stroke="#1E56A0"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <polygon points="71,214 85,213 78,202" fill="#1E56A0" />
            </g>
            <g className="animate-float-gentle">
              <rect x="12" y="218" width="142" height="24" rx="8" fill="#1E56A0" />
              <text
                x="83"
                y="234"
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill="#FFFFFF"
                fontFamily="var(--font-mono), monospace"
              >
                {isGD ? "+Y AFASTAM. (Frente)" : "+Z PROFUND. (Frente)"}
              </text>
            </g>

            {/* Curved Swap Indicator Arc between Up and Front */}
            <path
              d="M 148 76 Q 94 102 98 166"
              fill="none"
              stroke="#B45309"
              strokeWidth="2.2"
              strokeDasharray="5 3"
              className="animate-dash-flow"
            />
            <rect x="34" y="96" width="84" height="22" rx="7" fill="#FEF3C7" stroke="#B45309" />
            <text
              x="76"
              y="110"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="800"
              fill="#92400E"
              fontFamily="var(--font-mono), monospace"
            >
              Y ⇄ Z trocam!
            </text>
          </svg>

          <div className="w-full rounded-xl bg-paper-50 dark:bg-blueprint-900 border border-paper-200 dark:border-blueprint-800 p-3 text-xs text-ink-700 dark:text-slate-200 leading-relaxed">
            {isGD ? (
              <>
                <strong className="text-ph dark:text-sky-400">
                  Por que Engenharia &amp; Arquitetura usam Z-Up?
                </strong>{" "}
                Porque uma planta baixa na mesa já usa o plano <strong>XY</strong> (chão horizontal π); quando levantamos as paredes para cima, a altura nasce naturalmente no eixo <strong>Z (Cota)</strong>! (Blender, AutoCAD, Revit e Unreal também são Z-Up!)
              </>
            ) : (
              <>
                <strong className="text-pv dark:text-red-400">
                  Por que Jogos &amp; WebGL usam Y-Up?
                </strong>{" "}
                Porque a tela do monitor 2D já tinha <strong>X</strong> na horizontal e <strong>Y</strong> na vertical; ao evoluir para gráficos 3D (OpenGL, Unity, Three.js), criaram o <strong>Z</strong> saindo da tela para profundidade!
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Live Coordinate Translator (UERJ <-> Three.js / Unity <-> Épura 2D) */}
        <div className="flex flex-col justify-between gap-3.5">
          {/* Interactive Numbers */}
          <div className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-100/70 dark:bg-blueprint-950 p-4 space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink-500">
              Tradutor Ao Vivo · Mexa nos valores e compare os 3 mundos
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Abscissa", val: x, set: setX, color: "text-lt" },
                { label: "Afastam.", val: yAfast, set: setYAfast, color: "text-ph" },
                { label: "Cota", val: zCota, set: setZCota, color: "text-pv" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-paper-50 dark:bg-blueprint-900 border border-paper-200 dark:border-blueprint-800 p-2 text-center"
                >
                  <div className="text-[10px] font-bold text-ink-500">
                    {item.label}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => item.set((v) => Math.max(-5, v - 1))}
                      className="w-6 h-6 rounded-md bg-paper-200/80 dark:bg-blueprint-800 flex items-center justify-center"
                      aria-label={`Diminuir ${item.label}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={`font-mono text-sm font-extrabold w-7 ${item.color}`}>
                      {formatSigned(item.val)}
                    </span>
                    <button
                      type="button"
                      onClick={() => item.set((v) => Math.min(5, v + 1))}
                      className="w-6 h-6 rounded-md bg-paper-200/80 dark:bg-blueprint-800 flex items-center justify-center"
                      aria-label={`Aumentar ${item.label}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 3 Translated Cards */}
            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-xl bg-paper-50 dark:bg-blueprint-900 border-l-4 border-ph space-y-1">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-ph dark:text-sky-400">
                  <span>1. Caderno UERJ / GD (Z-Up)</span>
                  <span className="font-mono">(Abscissa ; Afast. ; Cota)</span>
                </div>
                <div className="font-mono text-sm font-extrabold text-ink-900 dark:text-white">
                  {formatPointCoords("A", x, yAfast, zCota)}
                </div>
                <div className="text-[11px] text-ink-500 dark:text-slate-400">
                  X = {formatSigned(x)} · Y = {formatSigned(yAfast)} (frente/trás) ·{" "}
                  <strong className="text-pv">Z = {formatSigned(zCota)} (altura)</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-paper-50 dark:bg-blueprint-900 border-l-4 border-pv space-y-1">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-pv dark:text-red-400">
                  <span>2. Engine 3D · Three.js / Unity (Y-Up)</span>
                  <span className="font-mono">Vector3(x, y, z)</span>
                </div>
                <div className="font-mono text-sm font-extrabold text-ink-900 dark:text-white">
                  new Vector3({formatSigned(x)},{" "}
                  <span className="text-pv underline decoration-2">
                    {formatSigned(zCota)}
                  </span>
                  ,{" "}
                  <span className="text-ph underline decoration-2">
                    {formatSigned(yAfast)}
                  </span>
                  )
                </div>
                <div className="text-[11px] text-ink-500 dark:text-slate-400">
                  É exatamente essa conversão <code className="font-mono">(x, z, y)</code> que o motor 3D deste site usa nos bastidores!
                </div>
              </div>

              <div className="p-3 rounded-xl bg-paper-50 dark:bg-blueprint-900 border-l-4 border-lt space-y-1">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-lt">
                  <span>3. Na Folha 2D (Épura Rebatida)</span>
                  <span className="font-mono">Eixo Y dobra p/ baixo!</span>
                </div>
                <div className="text-xs text-ink-700 dark:text-slate-200 leading-relaxed">
                  Linha de chamada em <strong className="font-mono text-lt">x = {formatSigned(x)}</strong>:{" "}
                  <strong className="text-pv">A&apos;</strong> vai{" "}
                  <strong>
                    {zCota === 0
                      ? "na LT"
                      : zCota > 0
                        ? `${zCota} ACIMA`
                        : `${Math.abs(zCota)} ABAIXO`}
                  </strong>{" "}
                  e <strong className="text-ph">A</strong> vai{" "}
                  <strong>
                    {yAfast === 0
                      ? "na LT"
                      : yAfast > 0
                        ? `${yAfast} ABAIXO`
                        : `${Math.abs(yAfast)} ACIMA`}
                  </strong>{" "}
                  da LT.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
