"use client";

/**
 * The studio's living atmosphere: Stripe-style drifting multi-hue aurora
 * fields plus ghost slide outlines — the subject itself floating at depth —
 * with damped pointer parallax (one shared rAF driver, no React state).
 * Purely decorative: pointer-events none, aria-hidden, fully static under
 * prefers-reduced-motion.
 */
import { useAmbientParallax } from "@/lib/motion";

const GHOSTS = [
  { top: "9%", left: "3%", w: 250, depth: 22, dur: "19s", delay: "0s", rot: "-2deg", hue: "var(--ultra)" },
  { top: "16%", right: "4%", w: 300, depth: 30, dur: "23s", delay: "-6s", rot: "1.5deg", hue: "var(--verm)" },
  { top: "46%", left: "-2%", w: 200, depth: 14, dur: "17s", delay: "-3s", rot: "2deg", hue: "var(--teal)" },
  { top: "58%", right: "-1%", w: 240, depth: 18, dur: "21s", delay: "-11s", rot: "-1.5deg", hue: "var(--plum)" },
  { bottom: "6%", left: "12%", w: 280, depth: 26, dur: "24s", delay: "-8s", rot: "1deg", hue: "var(--ultra)" },
  { bottom: "12%", right: "16%", w: 190, depth: 12, dur: "18s", delay: "-14s", rot: "-2.5deg", hue: "var(--verm)" },
] as const;

function GhostSlide({ g }: { g: (typeof GHOSTS)[number] }) {
  const pos: React.CSSProperties = { width: g.w };
  if ("top" in g && g.top) pos.top = g.top;
  if ("bottom" in g && g.bottom) pos.bottom = g.bottom;
  if ("left" in g && g.left) pos.left = g.left;
  if ("right" in g && g.right) pos.right = g.right;
  return (
    <div
      className="ghost-parallax absolute"
      style={{ ...pos, "--depth": `${g.depth}px` } as React.CSSProperties}
    >
      <div
        className="ghost-float aspect-video rounded-lg border border-ink/[0.07] bg-elev/50 p-[7%] shadow-xs backdrop-blur-[1px]"
        style={{ "--dur": g.dur, "--delay": g.delay, "--rot": g.rot } as React.CSSProperties}
      >
        <div className="flex h-full flex-col justify-center gap-[6%]">
          <div className="h-[7%] w-[26%] rounded-full" style={{ background: g.hue, opacity: 0.35 }} />
          <div className="h-[9%] w-[72%] rounded-sm bg-ink/[0.10]" />
          <div className="h-[5%] w-[88%] rounded-sm bg-ink/[0.06]" />
          <div className="h-[5%] w-[64%] rounded-sm bg-ink/[0.06]" />
          <div className="mt-[2%] flex gap-[4%]">
            <div className="h-[14px] flex-1 rounded-sm" style={{ background: g.hue, opacity: 0.12 }} />
            <div className="h-[14px] flex-1 rounded-sm bg-ink/[0.05]" />
            <div className="h-[14px] flex-1 rounded-sm bg-ink/[0.05]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AmbientBackground() {
  useAmbientParallax();
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Drifting aurora fields — multi-hue radials on long Stripe-style cycles */}
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      {/* Ghost slides: the subject itself, floating at depth */}
      {GHOSTS.map((g, i) => (
        <GhostSlide key={i} g={g} />
      ))}
    </div>
  );
}