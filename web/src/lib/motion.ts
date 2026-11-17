"use client";

/**
 * Motion primitives for the Proof Studio chrome.
 * Signatures researched with designlang from stripe.com (12s ambient cycles,
 * multi-hue radial glows, hover stagger choreography) and liveblocks.io
 * (pointer-positioned radial spotlights, overshoot springs).
 * Everything degrades gracefully under prefers-reduced-motion.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Liveblocks-style cursor spotlight: tracks the pointer inside an element and
 * exposes --mx / --my (px) plus --spot-o (0..1) for a radial highlight.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--my", `${e.clientY - rect.top}px`);
        el.style.setProperty("--spot-o", "1");
      });
    };
    const leave = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      el.style.setProperty("--spot-o", "0");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

/**
 * Damped 3D tilt for proof thumbnails. Pointer position maps to a small
 * rotateX/rotateY; leaving springs back to rest. One rAF per element max.
 */
export function useTilt<T extends HTMLElement>(maxDeg = 7) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--tilt-x", `${(-py * maxDeg).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(px * maxDeg).toFixed(2)}deg`);
        el.style.setProperty("--tilt-lift", "1");
      });
    };
    const leave = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--tilt-lift", "0");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [maxDeg]);
  return ref;
}

/**
 * Stripe-style staged reveal: elements start hidden and rise in with a
 * stagger once they enter the viewport. Returns a ref for the container;
 * children marked [data-reveal] are observed.
 */
export function useReveal<T extends HTMLElement>(staggerMs = 70, watch: unknown = null) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (targets.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-revealed"));
      return;
    }
    let seen = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.setProperty("--reveal-delay", `${Math.min(seen, 10) * staggerMs}ms`);
          seen += 1;
          el.classList.add("is-revealed");
          io.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [staggerMs, watch]);
  return ref;
}

/** Animated count-up for sizes and counts; settles exactly on the target. */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced || durationMs <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 4); // out-quart, Stripe ease-out family
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);
  return value;
}

/**
 * Magnetic pull for the primary CTA: the button leans a few px toward the
 * pointer while hovered, springing home on leave.
 */
export function useMagnetic<T extends HTMLElement>(strength = 5) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        el.style.setProperty("--mag-x", `${(dx * strength).toFixed(2)}px`);
        el.style.setProperty("--mag-y", `${(dy * strength).toFixed(2)}px`);
      });
    };
    const leave = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      el.style.setProperty("--mag-x", "0px");
      el.style.setProperty("--mag-y", "0px");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);
  return ref;
}

/**
 * One shared, damped pointer-parallax driver for the ambient background.
 * Writes --par-x / --par-y (-1..1) on the document root inside a single rAF
 * loop with exponential smoothing; idles when the pointer is still and stops
 * when the tab is hidden. No per-frame React state.
 */
export function useAmbientParallax() {
  const enabledRef = useRef(false);
  const start = useCallback(() => {
    if (enabledRef.current) return;
    enabledRef.current = true;
    const root = document.documentElement;
    let targetX = 0, targetY = 0, x = 0, y = 0;
    let raf = 0;
    let lastMove = 0;
    const onMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
      lastMove = performance.now();
    };
    const loop = (now: number) => {
      raf = 0;
      if (document.hidden) return; // restarted by visibilitychange
      x += (targetX - x) * 0.055;
      y += (targetY - y) * 0.055;
      root.style.setProperty("--par-x", x.toFixed(4));
      root.style.setProperty("--par-y", y.toFixed(4));
      // Keep the loop alive only while there is motion to settle.
      if (Math.abs(targetX - x) > 0.001 || Math.abs(targetY - y) > 0.001 || now - lastMove < 1200) {
        raf = requestAnimationFrame(loop);
      }
    };
    const kick = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const onVis = () => { if (!document.hidden) { lastMove = performance.now(); kick(); } };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    kick();
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      if (raf) cancelAnimationFrame(raf);
      enabledRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stop = start();
    return stop;
  }, [start]);
}