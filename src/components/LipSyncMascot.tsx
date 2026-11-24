"use client";

import React, { useEffect, useState } from "react";

export type MouthFrame = "closed" | "small" | "mid" | "open";

interface LipSyncMascotProps {
  mouth: MouthFrame;
  energy: number; // 0 to 1 smoothed RMS loudness
  isPlaying: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SPRITE_FRAMES = [
  { id: "closed", src: "/avatars/chibi/closed.png" },
  { id: "small", src: "/avatars/chibi/small.png" },
  { id: "mid", src: "/avatars/chibi/mid.png" },
  { id: "open", src: "/avatars/chibi/open.png" },
  { id: "blink", src: "/avatars/chibi/blink.png" },
] as const;

export function LipSyncMascot({
  mouth,
  energy,
  isPlaying,
  label = "Prof. Mongezinho",
  size = "md",
  className = "",
}: LipSyncMascotProps) {
  const [blinking, setBlinking] = useState(false);

  // Natural periodic eye blink every ~3.8s when mouth is relaxed
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setBlinking(true);
      blinkTimeout = setTimeout(() => setBlinking(false), 145);
    }, 3800);
    return () => {
      clearInterval(interval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, []);

  const activeSprite: "closed" | "small" | "mid" | "open" | "blink" =
    blinking && mouth === "closed" ? "blink" : mouth;

  const boxSize =
    size === "sm"
      ? "w-16 h-16"
      : size === "lg"
        ? "w-32 h-32 sm:w-36 sm:h-36"
        : "w-24 h-24 sm:w-28 sm:h-28";

  const bars = [0.45, 0.85, 0.65, 1.0, 0.55];

  return (
    <div
      className={`relative select-none flex flex-col items-center ${className}`}
    >
      {/* Rock-solid steady PiP Mascot Frame — ZERO shaking/rotation! Only mouth & eyes animate! */}
      <div
        className={`relative ${boxSize} rounded-2xl overflow-hidden border-2 transition-colors duration-300 bg-[#FEF7E0] shadow-xl ${
          isPlaying && energy > 0.06
            ? "border-amber-400 shadow-amber-500/20"
            : "border-white/25"
        }`}
      >
        {SPRITE_FRAMES.map((frame) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={frame.id}
            src={frame.src}
            alt={label}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover scale-[1.05]"
            style={{
              opacity: activeSprite === frame.id ? 1 : 0,
            }}
          />
        ))}

        {/* Smooth audio level strip along bottom */}
        <div className="absolute bottom-1.5 inset-x-2 flex items-end justify-center gap-[3px] h-3 pointer-events-none">
          {bars.map((mult, idx) => {
            const h = isPlaying
              ? Math.max(2.5, Math.min(11, 2.5 + energy * 18 * mult))
              : 2.5;
            return (
              <span
                key={idx}
                className="w-[2.5px] rounded-full bg-ph/85"
                style={{
                  height: `${h.toFixed(1)}px`,
                  transition: "height 110ms ease-out",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Studio Nameplate */}
      <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-950/85 border border-white/15 text-[9.5px] font-mono font-bold text-amber-200 tracking-wide backdrop-blur-sm whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}
