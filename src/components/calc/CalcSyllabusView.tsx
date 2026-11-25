"use client";

import React, { useMemo, useState } from "react";
import { CALC_COURSE_INFO, CALC_SYLLABUS_UNITS } from "@/lib/calc-curriculum";
import { sfx } from "@/lib/sfx";
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  Calendar,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface CalcSyllabusViewProps {
  checklist: Record<string, boolean>;
  onToggleTopic: (id: string) => void;
}

export function CalcSyllabusView({
  checklist,
  onToggleTopic,
}: CalcSyllabusViewProps) {
  const [p1, setP1] = useState(7.0);
  const [p2, setP2] = useState(6.0);
  const [p3, setP3] = useState(6.5);
  const [pf, setPf] = useState(5.5);
  const [attendance, setAttendance] = useState(85);

  const totalTopics = useMemo(
    () => CALC_SYLLABUS_UNITS.reduce((acc, u) => acc + u.topics.length, 0),
    []
  );
  const doneTopics = useMemo(
    () =>
      CALC_SYLLABUS_UNITS.reduce(
        (acc, u) => acc + u.topics.filter((t) => checklist[t.id]).length,
        0
      ),
    [checklist]
  );

  const mp = (p1 + p2 + p3) / 3;
  const needsPF = mp >= 3 && mp < 7;
  const mf = (mp + pf) / 2;
  const minPfNeeded = Math.max(0, 10 - mp);
  const attendanceOk = attendance >= CALC_COURSE_INFO.minAttendancePct;

  let statusLabel = "";
  let statusColor = "";
  if (!attendanceOk) {
    statusLabel = "Reprovado por Falta (< 75% de presença)";
    statusColor = "bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/50";
  } else if (mp >= 7) {
    statusLabel = "Aprovado Direto (MP ≥ 7,0 — sem Prova Final!)";
    statusColor = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/50";
  } else if (mp < 3) {
    statusLabel = "Reprovado Direto (MP < 3,0 — sem direito à PF)";
    statusColor = "bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/50";
  } else if (mf >= 5) {
    statusLabel = `Aprovado na PF! (MF = ${mf.toFixed(2)} ≥ 5,0)`;
    statusColor = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/50";
  } else {
    statusLabel = `Em PF · Precisa de ≥ ${minPfNeeded.toFixed(2)} na PF (MF atual ${mf.toFixed(2)})`;
    statusColor = "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/50";
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-5 items-start">
      {/* LEFT: Official Syllabus Checklist (Prof. Mateus Spezia) */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono font-extrabold uppercase text-ph dark:text-sky-400">
                {CALC_COURSE_INFO.institution} · {CALC_COURSE_INFO.professor}
              </div>
              <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">
                Ementa Oficial &amp; Checklist de Estudo
              </h2>
            </div>
            <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-lt/15 text-lt dark:text-teal-300">
              {doneTopics}/{totalTopics} tópicos dominados
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-paper-200 dark:bg-blueprint-800 overflow-hidden">
            <div
              className="h-full bg-lt transition-all duration-300 rounded-full"
              style={{ width: `${Math.round((doneTopics / Math.max(1, totalTopics)) * 100)}%` }}
            />
          </div>

          <div className="space-y-3 pt-1">
            {CALC_SYLLABUS_UNITS.map((unit) => (
              <div
                key={unit.id}
                className="rounded-2xl border border-paper-200 dark:border-blueprint-800 bg-paper-100/70 dark:bg-blueprint-950 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs sm:text-sm font-extrabold text-ink-900 dark:text-white">
                    {unit.number}) {unit.title}
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-ph/15 dark:bg-sky-500/20 text-ph dark:text-sky-300 font-mono text-[10.5px] font-extrabold shrink-0">
                    {unit.exam}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {unit.topics.map((topic) => {
                    const checked = Boolean(checklist[topic.id]);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => {
                          sfx.tick();
                          onToggleTopic(topic.id);
                        }}
                        className="w-full flex items-center gap-2.5 text-left px-2.5 py-1.5 rounded-xl hover:bg-paper-200/70 dark:hover:bg-blueprint-800/70 transition"
                      >
                        {checked ? (
                          <CheckCircle2 className="w-4 h-4 text-lt shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-ink-400 dark:text-slate-500 shrink-0" />
                        )}
                        <span className="font-mono text-xs font-bold text-ph dark:text-sky-400 w-7 shrink-0">
                          {topic.code}
                        </span>
                        <span
                          className={`text-xs sm:text-sm ${
                            checked
                              ? "line-through text-ink-400 dark:text-slate-500"
                              : "text-ink-800 dark:text-slate-200 font-medium"
                          }`}
                        >
                          {topic.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Grade Simulator, Dates & Bibliography */}
      <div className="space-y-4">
        {/* Interactive MP/MF Grade Simulator */}
        <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-ph dark:text-sky-400">
            <Calculator className="w-4 h-4" /> Simulador de Média UERJ (MP &amp; MF)
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "P1", val: p1, set: setP1 },
              { label: "P2", val: p2, set: setP2 },
              { label: "P3", val: p3, set: setP3 },
            ].map((item) => (
              <label key={item.label} className="space-y-1">
                <span className="block font-mono text-[11px] font-bold text-ink-500 dark:text-slate-400">
                  {item.label} (0–10)
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={item.val}
                  onChange={(e) =>
                    item.set(Math.max(0, Math.min(10, Number(e.target.value) || 0)))
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl border border-paper-300 dark:border-blueprint-700 bg-paper-100 dark:bg-blueprint-950 font-mono text-sm font-extrabold text-ink-900 dark:text-white"
                />
              </label>
            ))}
          </div>

          {needsPF && (
            <label className="block space-y-1">
              <div className="flex justify-between font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
                <span>Simular nota da PF (20/04/2027)</span>
                <span>{pf.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={pf}
                onChange={(e) => setPf(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </label>
          )}

          <label className="block space-y-1">
            <div className="flex justify-between font-mono text-xs font-bold text-ink-700 dark:text-slate-300">
              <span>Presença nas aulas (mínimo 75%)</span>
              <span className={attendanceOk ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                {attendance}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={1}
              value={attendance}
              onChange={(e) => setAttendance(Number(e.target.value))}
              className="w-full accent-ph"
            />
          </label>

          <div className="p-3 rounded-2xl bg-paper-100 dark:bg-blueprint-950 border border-paper-200 dark:border-blueprint-800 font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-ink-500 dark:text-slate-400">MP = (P1 + P2 + P3) / 3</span>
              <strong className="text-ink-900 dark:text-white">{mp.toFixed(2)}</strong>
            </div>
            {needsPF && (
              <div className="flex justify-between">
                <span className="text-ink-500 dark:text-slate-400">MF = (MP + PF) / 2</span>
                <strong className="text-ink-900 dark:text-white">{mf.toFixed(2)}</strong>
              </div>
            )}
          </div>

          <div
            data-grade-status
            className={`p-3 rounded-2xl border text-xs font-extrabold text-center ${statusColor}`}
          >
            {statusLabel}
          </div>
        </div>

        {/* Exam Dates & Attendance Rule */}
        <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-pv dark:text-red-400">
            <Calendar className="w-4 h-4" /> Avaliações &amp; Datas Previstas
          </div>
          <div className="space-y-2">
            {CALC_COURSE_INFO.exams.map((ex) => (
              <div
                key={ex.code}
                className="flex items-start justify-between gap-2 text-xs border-b border-paper-200 dark:border-blueprint-800 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <span className="font-mono font-extrabold text-ink-900 dark:text-white mr-1.5">
                    {ex.code}
                  </span>
                  <span className="text-ink-600 dark:text-slate-300">{ex.title}</span>
                </div>
                <span className="font-mono font-bold text-ph dark:text-sky-400 shrink-0">
                  {ex.date}
                </span>
              </div>
            ))}
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800 text-[11px] font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Presença obrigatória ≥ 75% para aprovação!
          </div>
        </div>

        {/* Bibliography */}
        <div className="rounded-3xl border border-paper-300 dark:border-blueprint-700 bg-paper-50 dark:bg-blueprint-900 p-5 shadow-draft space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-lt dark:text-teal-400">
            <BookOpen className="w-4 h-4" /> Bibliografia Básica
          </div>
          {CALC_COURSE_INFO.bibliography.map((book) => (
            <div
              key={book.author}
              className="p-3 rounded-xl bg-paper-100 dark:bg-blueprint-950 border border-paper-200 dark:border-blueprint-800 space-y-0.5"
            >
              <div className="text-xs font-extrabold text-ink-900 dark:text-white">
                {book.author} — <em>{book.title}</em>
              </div>
              <div className="text-[11px] text-ink-500 dark:text-slate-400">
                {book.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
