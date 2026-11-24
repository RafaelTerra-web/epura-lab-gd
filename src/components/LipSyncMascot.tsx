"use client";

import React, { useEffect, useState } from "react";

export type MouthFrame = "closed" | "small" | "mid" | "open";

interface LipSyncMascotProps {
  mouth: MouthFrame;
  energy: number; // 0 to 1 smoothed RMS loudness
  isPlaying: boolean;
  label?: string;
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
  label = "Prof. Monge",
}: LipSyncMascotProps) {
  const [blinking, setBlinking] = useState(false);

  // Natural periodic eye blink ONLY while video is actively playing (stays still when paused!)
  useEffect(() => {
    if (!isPlaying) {
      setBlinking(false);
      return;
    }
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setBlinking(true);
      blinkTimeout = setTimeout(() => setBlinking(false), 145);
    }, 3600);
    return () => {
      clearInterval(interval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, [isPlaying]);

  const activeSprite: "closed" | "small" | "mid" | "open" | "blink" =
    blinking && mouth === "closed" ? "blink" : mouth;

  return (
    <div role="img" aria-label={label} className="flex flex-col items-center">
      <div
        className={
          "relative w-full aspect-square rounded-[1.3cqw] overflow-hidden border bg-[#FEF7E0] shadow-lg " +
          (isPlaying && energy > 0.06 ? "border-amber-300" : "border-white/25")
        }
      >
        {SPRITE_FRAMES.map((frame) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={frame.id}
            src={frame.src}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover scale-[1.05]"
            style={{ opacity: activeSprite === frame.id ? 1 : 0 }}
          />
        ))}
        <div aria-hidden="true" className="absolute inset-x-[16%] bottom-[5%] h-[11%] flex items-end justify-center gap-[5%]">
          {[0.45, 0.85, 0.65, 1, 0.55].map((level, index) => (
            <span key={index} className="w-[6%] rounded-full bg-ph/90" style={{ height: 22 + Math.min(64, energy * 160 * level) + "%" }} />
          ))}
        </div>
      </div>
      <span aria-hidden="true" className="mt-[0.3cqw] whitespace-nowrap rounded-full border border-white/15 bg-slate-950/85 px-[0.55cqw] py-[0.12cqw] font-mono text-[0.78cqw] leading-tight font-bold text-amber-200">
        {label}
      </span>
    </div>
  );
}
