"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Splits "12 480,5 kWh" into prefix / number / suffix (French formatting). */
function parse(text: string) {
  const match = text.match(/^([^\d-]*)(-?\d[\d\s  ]*(?:,\d+)?)(.*)$/s);
  if (!match) return null;
  const [, prefix, numeric, suffix] = match;
  const normalized = numeric.replace(/[\s  ]/g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  const decimals = numeric.includes(",") ? numeric.split(",")[1].length : 0;
  return { prefix, value, suffix, decimals };
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type CountUpProps = {
  /** Pre-formatted value (e.g. "412,6 kWh"); non-numeric text renders as-is. */
  text: string;
  durationMs?: number;
};

/** Counts a formatted figure up from 0 once, when it first enters the viewport. */
export function CountUp({ text, durationMs = 1100 }: CountUpProps) {
  const parsed = parse(text);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);

  useIsoLayoutEffect(() => {
    if (!parsed || prefersReducedMotion()) {
      setDisplay(text);
      return;
    }
    const format = (v: number) =>
      `${parsed.prefix}${v.toLocaleString("fr-FR", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}${parsed.suffix}`;

    setDisplay(format(0));
    let frame = 0;
    let start = 0;
    const run = () => {
      const tick = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 4);
        setDisplay(t >= 1 ? text : format(parsed.value * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      run();
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span ref={ref} aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  );
}
