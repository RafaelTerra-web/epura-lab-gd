"use client";

import React from "react";

interface ProfessorAvatarProps {
  professor: "monge" | "epura";
  size?: "sm" | "md" | "lg";
  speaking?: boolean;
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
        : "w-12 h-12";

  const ringColor =
    professor === "monge"
      ? "ring-ph/40 border-ph/40"
      : "ring-pv/40 border-pv/40";

  return (
    <div className={`relative inline-flex shrink-0 ${dims} ${className}`}>
      {speaking && (
        <span
          className={`absolute -inset-1 rounded-full animate-ping opacity-35 ${
            professor === "monge" ? "bg-ph" : "bg-pv"
          }`}
        />
      )}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden border-2 shadow-sm bg-paper-100 ${ringColor} ${
          speaking ? "ring-4" : ""
        }`}
      >
        {professor === "monge" ? (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full"
            role="img"
            aria-label="Prof. Monge"
          >
            <defs>
              <linearGradient id="mongeBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDFCF8" />
                <stop offset="100%" stopColor="#E7F0FA" />
              </linearGradient>
            </defs>
            <rect width="120" height="120" fill="url(#mongeBg)" />
            {/* Architectural faint grid & projection diagonal */}
            <g opacity="0.22" stroke="#1E56A0" strokeWidth="1">
              <line x1="0" y1="30" x2="120" y2="30" />
              <line x1="0" y1="60" x2="120" y2="60" />
              <line x1="0" y1="90" x2="120" y2="90" />
              <line x1="30" y1="0" x2="30" y2="120" />
              <line x1="60" y1="0" x2="60" y2="120" />
              <line x1="90" y1="0" x2="90" y2="120" />
              <line x1="8" y1="108" x2="112" y2="12" strokeDasharray="3 3" />
            </g>
            {/* Shoulders - Tailored Cobalt Studio Overshirt */}
            <path
              d="M16 122 C20 90 39 82 60 82 C81 82 100 90 104 122 Z"
              fill="#1E56A0"
            />
            <path d="M46 84 L60 107 L74 84 Z" fill="#FAF8F3" />
            <path
              d="M46 84 L55 98 L48 102 Z M74 84 L65 98 L72 102 Z"
              fill="#153D75"
            />
            {/* Neck */}
            <rect x="52" y="70" width="16" height="17" rx="6" fill="#E6B89C" />
            {/* Ears */}
            <circle cx="37" cy="54" r="5" fill="#E6B89C" />
            <circle cx="83" cy="54" r="5" fill="#E6B89C" />
            {/* Hair volume */}
            <ellipse cx="60" cy="46" rx="26" ry="26" fill="#3F2E21" />
            {/* Face */}
            <ellipse cx="60" cy="52" rx="22" ry="24" fill="#F2C8AC" />
            {/* Styled swept hair with subtle silver temple */}
            <path
              d="M36 47 C38 22 82 20 84 47 C77 35 67 32 58 34 C49 35 42 38 36 47 Z"
              fill="#3F2E21"
            />
            <path
              d="M38 44 C41 37 46 35 51 35"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            {/* Warm beard */}
            <path
              d="M40 57 C41 74 51 80 60 80 C69 80 79 74 80 57 C75 66 68 69 60 69 C52 69 45 66 40 57 Z"
              fill="#4E3829"
            />
            {/* Eyebrows */}
            <path
              d="M44 43 Q50 40 55 43 M65 43 Q70 40 76 43"
              stroke="#3F2E21"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tortoiseshell Round Glasses */}
            <g
              stroke="#7C4A22"
              strokeWidth="2.5"
              fill="rgba(255,255,255,0.28)"
            >
              <circle cx="50" cy="52" r="7.5" />
              <circle cx="70" cy="52" r="7.5" />
              <line x1="57.5" y1="52" x2="62.5" y2="52" />
            </g>
            {/* Glint on glasses */}
            <line
              x1="46"
              y1="48"
              x2="49"
              y2="51"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            <line
              x1="66"
              y1="48"
              x2="69"
              y2="51"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Eyes */}
            <circle cx="50" cy="52" r="2.2" fill="#1C1917" />
            <circle cx="70" cy="52" r="2.2" fill="#1C1917" />
            {/* Smile / Speaking Mouth */}
            <path
              d={speaking ? "M53 63 Q60 72 67 63 Z" : "M53 63 Q60 69 67 63"}
              fill={speaking ? "#9B2C20" : "none"}
              stroke="#FAF8F3"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Brass Drafting Compass lapel emblem */}
            <g transform="translate(80, 95)">
              <path
                d="M6 2 L12 17 M6 2 L0 17"
                stroke="#F59E0B"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M2 11 Q6 14 10 11"
                stroke="#F59E0B"
                strokeWidth="1.4"
                fill="none"
              />
              <circle cx="6" cy="2" r="2.4" fill="#F59E0B" />
            </g>
          </svg>
        ) : (
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full"
            role="img"
            aria-label="Profa. Épura"
          >
            <defs>
              <linearGradient id="epuraBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FDFCF8" />
                <stop offset="100%" stopColor="#FBEAE8" />
              </linearGradient>
            </defs>
            <rect width="120" height="120" fill="url(#epuraBg)" />
            {/* Architectural drafting lines & set-square watermark */}
            <g opacity="0.22" stroke="#C94032" strokeWidth="1">
              <line x1="0" y1="60" x2="120" y2="60" />
              <line x1="60" y1="0" x2="60" y2="120" />
              <polygon points="10,104 42,104 10,72" fill="none" />
            </g>
            {/* High curly hair bun + studio pencil tucked in */}
            <circle cx="60" cy="22" r="14" fill="#321D14" />
            <circle cx="51" cy="20" r="8" fill="#321D14" />
            <circle cx="69" cy="20" r="8" fill="#321D14" />
            <line
              x1="40"
              y1="24"
              x2="82"
              y2="14"
              stroke="#D97706"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="82" cy="14" r="2.2" fill="#F472B6" />
            <ellipse cx="60" cy="50" rx="28" ry="26" fill="#321D14" />
            {/* Shoulders - Terracotta studio cardigan */}
            <path
              d="M16 122 C20 90 39 82 60 82 C81 82 100 90 104 122 Z"
              fill="#C94032"
            />
            <path
              d="M45 84 C52 100 68 100 75 84 L75 122 L45 122 Z"
              fill="#FAF8F3"
            />
            {/* Neck */}
            <rect x="52" y="70" width="16" height="16" rx="6" fill="#C98A63" />
            {/* Face */}
            <ellipse cx="60" cy="54" rx="21" ry="23" fill="#D99B75" />
            {/* Framing curly bangs */}
            <path
              d="M38 50 C42 29 78 29 82 50 C74 39 65 37 56 38 C47 39 42 43 38 50 Z"
              fill="#321D14"
            />
            {/* Eyebrows */}
            <path
              d="M45 46 Q51 43 56 46 M64 46 Q69 43 75 46"
              stroke="#321D14"
              strokeWidth="1.9"
              strokeLinecap="round"
              fill="none"
            />
            {/* Bright expressive eyes */}
            <circle cx="51" cy="53" r="2.6" fill="#1C1917" />
            <circle cx="69" cy="53" r="2.6" fill="#1C1917" />
            <circle cx="52" cy="52" r="0.9" fill="#FFFFFF" />
            <circle cx="70" cy="52" r="0.9" fill="#FFFFFF" />
            {/* Warm blush */}
            <ellipse cx="44" cy="59" rx="3.8" ry="2.2" fill="#C94032" opacity="0.22" />
            <ellipse cx="76" cy="59" rx="3.8" ry="2.2" fill="#C94032" opacity="0.22" />
            {/* Bright smile / speaking mouth */}
            <path
              d={speaking ? "M52 63 Q60 73 68 63 Z" : "M52 63 Q60 70 68 63"}
              fill={speaking ? "#FFFFFF" : "none"}
              stroke="#7C2D12"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Mini acrylic 45° drafting triangle held near collar */}
            <polygon
              points="78,116 99,116 99,95"
              fill="rgba(30,86,160,0.25)"
              stroke="#1E56A0"
              strokeWidth="1.8"
            />
            <polygon
              points="85,112 95,112 95,102"
              fill="none"
              stroke="#FAF8F3"
              strokeWidth="1.1"
            />
          </svg>
        )}
      </div>
      {speaking && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex items-center gap-[2px] px-1.5 py-0.5 rounded-full text-white shadow ${
            professor === "monge" ? "bg-ph" : "bg-pv"
          }`}
        >
          <span className="w-[2px] h-2 bg-white rounded-full animate-pulse" />
          <span className="w-[2px] h-3 bg-white rounded-full animate-bounce" />
          <span className="w-[2px] h-2 bg-white rounded-full animate-pulse" />
        </span>
      )}
    </div>
  );
}
