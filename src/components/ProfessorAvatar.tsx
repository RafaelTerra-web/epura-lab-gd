"use client";

import React from "react";

interface ProfessorAvatarProps {
  professor: "monge" | "epura";
  size?: "sm" | "md" | "lg" | "xl";
  speaking?: boolean;
  mood?: "friendly" | "explaining" | "excited" | "thinking";
  className?: string;
}

export function ProfessorAvatar({
  professor,
  size = "md",
  speaking = false,
  className = "",
}: ProfessorAvatarProps) {
  const dims =
    size === "sm"
      ? "w-10 h-10"
      : size === "lg"
        ? "w-16 h-16"
        : size === "xl"
          ? "w-20 h-20"
          : "w-12 h-12";

  const ringColor =
    professor === "monge"
      ? "ring-ph/40 border-ph/45"
      : "ring-pv/40 border-pv/45";

  const src =
    professor === "monge"
      ? "/avatars/prof-monge.png"
      : "/avatars/profa-epura.png";

  return (
    <div
      className={`relative inline-flex shrink-0 ${dims} ${
        speaking ? "animate-avatar-talk" : ""
      } ${className}`}
    >
      {speaking && (
        <span
          className={`absolute -inset-1.5 rounded-full animate-ping opacity-35 ${
            professor === "monge" ? "bg-ph" : "bg-pv"
          }`}
        />
      )}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden border-2 shadow-sm bg-paper-100 transition-transform duration-300 ${ringColor} ${
          speaking ? "ring-4 scale-[1.04]" : "hover:scale-[1.03]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={professor === "monge" ? "Prof. Monge" : "Profa. Épura"}
          className="w-full h-full object-cover object-top"
        />
      </div>
      {speaking && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex items-end gap-[2px] h-4 px-1.5 py-0.5 rounded-full text-white shadow ${
            professor === "monge" ? "bg-ph" : "bg-pv"
          }`}
        >
          <span className="w-[2.5px] bg-white rounded-full animate-eq-1" />
          <span className="w-[2.5px] bg-white rounded-full animate-eq-2" />
          <span className="w-[2.5px] bg-white rounded-full animate-eq-3" />
        </span>
      )}
    </div>
  );
}
