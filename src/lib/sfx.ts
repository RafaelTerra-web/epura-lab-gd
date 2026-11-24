"use client";

/**
 * Subtle, tactile Web Audio API sound effects for ÉpuraLab.
 * Low-gain, short-envelope drafting studio sounds with built-in anti-spam throttling.
 */
class StudioSfx {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private lastPlayedAt = 0;

  setEnabled(val: boolean) {
    this.enabled = val;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private canTrigger(minGapMs = 65): boolean {
    const now = performance.now();
    if (now - this.lastPlayedAt < minGapMs) return false;
    this.lastPlayedAt = now;
    return true;
  }

  /** Soft mechanical studio click for tabs, buttons, and episode changes */
  click() {
    if (!this.canTrigger(60)) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(760, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.024);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.026);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  /** Ultra-light wooden scale notch tick for toggles & steppers */
  tick() {
    if (!this.canTrigger(50)) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(290, t + 0.016);

    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.02);
  }

  /** Gentle paper-fold chime for Rebatimento 90° & professor highlights */
  fold() {
    if (!this.canTrigger(180)) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.11);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Warm pleasant two-note chime for correct answers & completed lessons */
  success() {
    if (!this.canTrigger(200)) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    [523.25, 783.99].forEach((freq, i) => {
      const start = t + i * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.06, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }
}

export const sfx = new StudioSfx();
