import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Text,
  type StyleProp,
  type TextStyle,
} from "react-native";

/** Splits "12 480,5 kWh" into prefix / number / suffix (French formatting). */
function parse(text: string) {
  const match = text.match(/^([^\d-]*)(-?\d[\d\s\u00a0\u202f]*(?:,\d+)?)([\s\S]*)$/);
  if (!match) return null;
  const [, prefix, numeric, suffix] = match;
  const normalized = numeric.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  const decimals = numeric.includes(",") ? numeric.split(",")[1].length : 0;
  return { prefix, value, suffix, decimals };
}

type CountUpProps = {
  /** Pre-formatted value (e.g. "412,6 kWh"); non-numeric text renders as-is. */
  text: string;
  durationMs?: number;
  className?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Counts a formatted figure up from 0 on mount / when the text changes.
 * Always a leaf Text — do not nest inside another Text with NativeWind.
 */
export function CountUp({
  text,
  durationMs = 1100,
  className,
  style,
}: CountUpProps) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const parsed = parse(text);
    if (!parsed) {
      setDisplay(text);
      return;
    }

    let cancelled = false;
    let frame = 0;

    const format = (v: number) =>
      `${parsed.prefix}${v.toLocaleString("fr-FR", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}${parsed.suffix}`;

    const run = () => {
      let start = 0;
      setDisplay(format(0));
      const tick = (now: number) => {
        if (cancelled) return;
        if (!start) start = now;
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 4);
        setDisplay(t >= 1 ? text : format(parsed.value * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled) return;
        if (reduced) setDisplay(text);
        else run();
      })
      .catch(() => {
        if (!cancelled) run();
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [text, durationMs]);

  return (
    <Text className={className} style={style} accessibilityLabel={text}>
      {display}
    </Text>
  );
}
