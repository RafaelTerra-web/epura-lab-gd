"use client";

import React, { useState } from "react";
import { DRAWING_KIT_ITEMS, SET_SQUARE_ANGLES } from "@/lib/curriculum";
import { ProfessorAvatar } from "./ProfessorAvatar";
import { TtsModelTier, VoiceState } from "@/lib/voice";
import { Pencil, Ruler, Volume2, VolumeX } from "lucide-react";

interface DrawingKitViewProps {
  dark: boolean;
  voice: VoiceState;
  voiceRate: number;
  customApiKey?: string;
  ttsModelTier: TtsModelTier;
}

const GRAPHITES = [
  {
    grade: "2H",
    lead: "0.5 mm",
    use: "Linhas de construção ultra-leves e marcações iniciais",
    stroke: 0.9,
    opacity: 0.42,
    clay: 72,
  },
  {
    grade: "HB",
    lead: "0.5 mm",
    use: "Linhas de Chamada, projeções auxiliares e cotas (Aula 1 UERJ!)",
    stroke: 1.4,
    opacity: 0.72,
    clay: 50,
  },
  {
    grade: "2B",
    lead: "0.7 mm",
    use: "Linha de Terra (LT), segmentos finais e contornos principais",
    stroke: 3.0,
    opacity: 0.96,
    clay: 24,
  },
];

export function DrawingKitView({
  dark,
  voice,
  voiceRate,
  customApiKey,
  ttsModelTier,
}: DrawingKitViewProps) {
  const [angleIdx, setAngleIdx] = useState(4); // 75° default (45° + 30°)
  const [graphiteIdx, setGraphiteIdx] = useState(1); // HB 0.5mm

  const activeAngle = SET_SQUARE_ANGLES[angleIdx];
  const activeGraphite = GRAPHITES[graphiteIdx];
  const rad = (activeAngle.angle * Math.PI) / 180;
  const lineEndX = 180 + Math.cos(rad) * 125;
  const lineEndY = 175 - Math.sin(rad) * 125;

  const speakId = "kit-desenho";
  const isSpeaking = voice.speakingId === speakId;
  const kitScript =
    "O kit da sua primeira aula na UERJ foi escolhido para dar precisão cirúrgica às suas épuras! Com o par de esquadros de quarenta e cinco e trinta sessenta graus combinados, você traça qualquer ângulo de quinze em quinze graus e faz linhas de chamada perfeitamente perpendiculares à Linha de Terra. E lembre da dupla dinâmica de lapiseiras: zero ponto cinco com grafite HB para linhas finas auxiliares, e zero ponto sete com grafite dois B para destacar a Linha de Terra e a resposta final!";

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft flex flex-col sm:flex-row sm:items-center gap-4">
        <ProfessorAvatar professor="monge" size="lg" speaking={isSpeaking} />
        <div className="flex-1 space-y-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-pv">
            01 · Materiais · Baseado no Slide da sua Aula 1 (UERJ)
          </div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">
            O Kit de Desenho Técnico na Prática
          </h2>
          <p className="text-sm text-ink-600 dark:text-slate-300">
            Simule a combinação dos esquadros de 15° em 15°, compare espessuras de grafite HB vs 2B e confira o padrão ABNT de folha A4/A3 com legenda.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            voice.speak(
              speakId,
              kitScript,
              "monge",
              voiceRate,
              customApiKey,
              ttsModelTier
            )
          }
          className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            isSpeaking
              ? "bg-pv text-white"
              : "bg-ink-900 dark:bg-sky-500 text-paper-50 dark:text-blueprint-950"
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-4 h-4" /> Parar
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" /> Dica em áudio
            </>
          )}
        </button>
      </div>

      {/* TWO INTERACTIVE SIMULATORS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Simulator 1: Combinador de Esquadros (15° em 15°) */}
        <section className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-ph dark:text-sky-400 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" /> Simulador de Esquadros
              </div>
              <h3 className="text-base font-bold text-ink-900 dark:text-white">
                Ângulos de 15° em 15° (45°/90° + 30°/60°/90°)
              </h3>
            </div>
            <span className="font-mono text-2xl font-extrabold text-pv">
              {activeAngle.angle}°
            </span>
          </div>

          <div className="rounded-2xl border border-paper-200 dark:border-blueprint-800 bg-paper-100/80 dark:bg-blueprint-950 overflow-hidden">
            <svg viewBox="0 0 360 210" className="w-full h-auto block">
              {/* Baseline guide ruler (Esquadro-guia) */}
              <rect
                x="24"
                y="175"
                width="312"
                height="16"
                rx="3"
                fill={dark ? "#1E293B" : "#E4DDD0"}
                stroke={dark ? "#475569" : "#A8A29E"}
              />
              <text
                x="180"
                y="186"
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={dark ? "#94A3B8" : "#57534E"}
                fontFamily="var(--font-mono), monospace"
              >
                ESQUADRO-GUIA (APOIO NA LINHA DE TERRA)
              </text>

              {/* Protractor faint semicircle */}
              <path
                d="M 75 175 A 105 105 0 0 1 285 175"
                fill="none"
                stroke={dark ? "#334155" : "#D6CEC0"}
                strokeDasharray="4 4"
              />

              {/* Angle arc */}
              <path
                d={`M 235 175 A 55 55 0 0 0 ${180 + Math.cos(rad) * 55} ${175 - Math.sin(rad) * 55}`}
                fill="none"
                stroke="#C94032"
                strokeWidth="2.5"
              />

              {/* Translucent set-square visual triangle aligned along ray */}
              <polygon
                points={`180,175 ${lineEndX},${lineEndY} ${lineEndX - Math.sin(rad) * 48},${lineEndY - Math.cos(rad) * 48}`}
                fill="rgba(30,86,160,0.16)"
                stroke="#1E56A0"
                strokeWidth="1.5"
              />

              {/* Drawn line at exact angle */}
              <line
                x1="180"
                y1="175"
                x2={lineEndX}
                y2={lineEndY}
                stroke="#C94032"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="180" cy="175" r="4.5" fill="#0F766E" />
              <text
                x={180 + Math.cos(rad / 2) * 72}
                y={175 - Math.sin(rad / 2) * 72}
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                fill="#C94032"
                fontFamily="var(--font-mono), monospace"
              >
                {activeAngle.angle}°
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SET_SQUARE_ANGLES.map((item, idx) => (
              <button
                key={item.angle}
                type="button"
                onClick={() => setAngleIdx(idx)}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold border transition ${
                  idx === angleIdx
                    ? "bg-pv text-white border-pv"
                    : "bg-paper-100 dark:bg-blueprint-800 border-paper-300 dark:border-blueprint-700 text-ink-700 dark:text-slate-300"
                }`}
              >
                {item.angle}°
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-paper-100 dark:bg-blueprint-950 border border-paper-200 dark:border-blueprint-800 p-3 text-xs space-y-1">
            <div className="font-mono font-extrabold text-ph dark:text-sky-400">
              Combinação: {activeAngle.formula}
            </div>
            <div className="text-ink-600 dark:text-slate-300">
              {activeAngle.combo}
            </div>
          </div>
        </section>

        {/* Simulator 2: Grafites (H vs B) + Espessura de Traços + Folha ABNT */}
        <section className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft space-y-4">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-lt flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Hierarquia de Traços & Folha
            </div>
            <h3 className="text-base font-bold text-ink-900 dark:text-white">
              Grafite H vs B (0.5 HB × 0.7 2B) e Legenda A4/A3
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {GRAPHITES.map((g, idx) => (
              <button
                key={g.grade}
                type="button"
                onClick={() => setGraphiteIdx(idx)}
                className={`p-2.5 rounded-xl border text-center transition ${
                  idx === graphiteIdx
                    ? "bg-ink-900 text-paper-50 border-ink-900 dark:bg-sky-500 dark:text-blueprint-950"
                    : "bg-paper-100 dark:bg-blueprint-800 border-paper-300 dark:border-blueprint-700"
                }`}
              >
                <div className="font-mono text-sm font-extrabold">{g.grade}</div>
                <div className="text-[11px] opacity-80">{g.lead}</div>
              </button>
            ))}
          </div>

          {/* Live Paper Line Preview */}
          <div className="rounded-2xl border border-paper-200 dark:border-blueprint-800 bg-paper-50 dark:bg-blueprint-950 p-4 space-y-3">
            <svg viewBox="0 0 340 62" className="w-full h-auto">
              <line
                x1="12"
                y1="30"
                x2="328"
                y2="30"
                stroke={dark ? "#F8FAFC" : "#1C1917"}
                strokeWidth={activeGraphite.stroke}
                opacity={activeGraphite.opacity}
                strokeLinecap="round"
              />
              <text
                x="12"
                y="14"
                fontSize="10"
                fontWeight="700"
                fill={dark ? "#94A3B8" : "#78716C"}
                fontFamily="var(--font-mono), monospace"
              >
                TRAÇO {activeGraphite.lead} · GRAFITE {activeGraphite.grade}
              </text>
              <text
                x="12"
                y="52"
                fontSize="9.5"
                fill={dark ? "#94A3B8" : "#78716C"}
                fontFamily="var(--font-mono), monospace"
              >
                Argila: {activeGraphite.clay}% (dureza) · Grafite:{" "}
                {100 - activeGraphite.clay}% (escuridão)
              </text>
            </svg>
            <p className="text-xs text-ink-700 dark:text-slate-200">
              {activeGraphite.use}
            </p>
          </div>

          {/* ABNT A4/A3 Blueprint Mini Diagram */}
          <div className="rounded-2xl border border-paper-200 dark:border-blueprint-800 bg-paper-100/80 dark:bg-blueprint-950 p-3.5 flex items-center gap-4">
            <svg viewBox="0 0 150 106" className="w-36 shrink-0">
              <rect
                x="2"
                y="2"
                width="146"
                height="102"
                rx="3"
                fill={dark ? "#0B1220" : "#FAF8F3"}
                stroke={dark ? "#475569" : "#78716C"}
              />
              {/* 25mm left margin + 7mm outer margin */}
              <rect
                x="18"
                y="8"
                width="124"
                height="90"
                fill="none"
                stroke="#1E56A0"
                strokeWidth="1.2"
              />
              {/* Title block (Legenda) bottom-right */}
              <rect
                x="82"
                y="74"
                width="60"
                height="24"
                fill="rgba(201,64,50,0.16)"
                stroke="#C94032"
                strokeWidth="1.2"
              />
              <text
                x="112"
                y="88"
                textAnchor="middle"
                fontSize="7"
                fontWeight="800"
                fill="#C94032"
                fontFamily="var(--font-mono), monospace"
              >
                LEGENDA
              </text>
              <text
                x="10"
                y="56"
                textAnchor="middle"
                fontSize="6"
                fill="#1E56A0"
                transform="rotate(-90 10 56)"
                fontFamily="var(--font-mono), monospace"
              >
                25mm
              </text>
            </svg>
            <div className="text-xs space-y-1">
              <div className="font-bold text-ink-900 dark:text-white">
                Padrão de Folha A4 / A3
              </div>
              <p className="text-ink-600 dark:text-slate-300 leading-relaxed">
                Margem esquerda maior (25 mm) para arquivamento e{" "}
                <strong className="text-pv">legenda sempre no canto inferior direito</strong>{" "}
                com UERJ, disciplina, aluno, escala e data.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 6 Kit Cards matching the Classroom Slide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {DRAWING_KIT_ITEMS.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-4 shadow-draft space-y-2"
          >
            <div className="font-bold text-sm text-ink-900 dark:text-white">
              {item.name}
            </div>
            <div className="font-mono text-[11px] font-bold text-ph dark:text-sky-400">
              {item.spec}
            </div>
            <p className="text-xs text-ink-600 dark:text-slate-300 leading-relaxed">
              {item.summary}
            </p>
            <div className="pt-2 border-t border-paper-200 dark:border-blueprint-800 text-[11px] text-lt dark:text-teal-300 font-medium">
              Dica prática: {item.uerjTip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
