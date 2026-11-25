/**
 * Three-phase (L1 / L2 / L3) line chart — react-native-svg replacement for the
 * recharts `LineChart` used on customer-web. Built on the dashboard chart-kit
 * helpers (`useElementSize`, `formatAxis`, tooltip) so it shares the same
 * visual language as `JoyaAreaChart`.
 */
import { useCallback, useMemo, useState } from "react";
import { Text, View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import { ChartTooltip } from "@/components/client/dashboard/chart-tooltip";
import {
  TooltipTitle,
  TooltipValue,
  formatAxis,
  useElementSize,
} from "@/components/client/dashboard/chart-kit";

export type PhaseKey = "l1" | "l2" | "l3";

export type MultiLineRow = { label: string } & Record<PhaseKey, number | null>;

export type MultiLineSeries = { key: PhaseKey; label: string; color: string };

type Props = {
  rows: MultiLineRow[];
  series: MultiLineSeries[];
  ariaLabel: string;
  emptyMessage?: string;
  /** Formats a value for the tooltip (unit included). */
  formatTooltipValue: (value: number) => string;
  /** Minimum horizontal space (px) between two x labels. */
  minXTickSpacing?: number;
};

const AXIS_FONT_SIZE = 11;
const AXIS_FILL = JOYA_CHART.axisText;

function textWidth(text: string, size = 11): number {
  return text.length * size * 0.62;
}

/** Round ticks covering [min, max] (auto domain, like recharts `["auto","auto"]`). */
function autoTicks(min: number, max: number, target = 4): number[] {
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) {
    const base = Number.isFinite(min) ? min : 0;
    const pad = Math.abs(base) > 1 ? Math.abs(base) * 0.05 : 1;
    return [base - pad, base, base + pad];
  }
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

function linePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length < 3) {
    return pts
      .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
  }
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export function JoyaMultiLineChart({
  rows,
  series,
  ariaLabel,
  emptyMessage = "Aucune donnée pour cette période",
  formatTooltipValue,
  minXTickSpacing = 56,
}: Props) {
  const { onLayout, width, height } = useElementSize();
  const [hover, setHover] = useState<number | null>(null);

  const allValues = useMemo(() => {
    const out: number[] = [];
    for (const row of rows) {
      for (const s of series) {
        const v = row[s.key];
        if (v != null && Number.isFinite(v)) out.push(v);
      }
    }
    return out;
  }, [rows, series]);

  const hasData = allValues.length > 0;
  const min = hasData ? Math.min(...allValues) : 0;
  const max = hasData ? Math.max(...allValues) : 1;
  const ticks = useMemo(() => autoTicks(min, max), [min, max]);
  const lo = ticks[0] ?? 0;
  const hi = ticks[ticks.length - 1] ?? 1;
  const span = hi - lo || 1;

  const yLabelW = Math.max(...ticks.map((t) => textWidth(formatAxis(t)))) + 10;
  const pad = { top: 12, right: 14, bottom: 26, left: Math.max(36, yLabelW) };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const n = rows.length;

  const xAt = useCallback(
    (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    [pad.left, n, innerW],
  );
  const yAt = (v: number) => pad.top + innerH - ((v - lo) / span) * innerH;
  const baseline = pad.top + innerH;

  const xTicks = useMemo(() => {
    const out: number[] = [];
    let lastX = -Infinity;
    rows.forEach((_, i) => {
      const x = xAt(i);
      if (x - lastX < minXTickSpacing) return;
      out.push(i);
      lastX = x;
    });
    return out;
  }, [rows, xAt, minXTickSpacing]);

  const onTouch = (localX: number, isStart: boolean) => {
    if (n === 0) return;
    const ratio = Math.min(1, Math.max(0, localX / innerW));
    const index = n <= 1 ? 0 : Math.round(ratio * (n - 1));
    setHover((prev) => (isStart && prev === index ? null : index));
  };

  const hoverValues =
    hover != null
      ? series.map((s) => ({ s, v: rows[hover]?.[s.key] ?? null }))
      : [];
  const hoverKnown = hoverValues.filter(
    (h): h is { s: MultiLineSeries; v: number } =>
      h.v != null && Number.isFinite(h.v),
  );
  const hoverTopY =
    hoverKnown.length > 0 ? Math.min(...hoverKnown.map((h) => yAt(h.v))) : 0;

  if (!hasData) {
    return (
      <View className="h-full min-h-[192px] items-center justify-center rounded-xl border border-dashed border-line-strong bg-cream/60 px-4">
        <Text className="text-center text-sm text-ink-muted">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="h-full w-full">
      <View
        className="relative flex-1"
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        {width > 0 && height > 0 ? (
          <Animated.View
            entering={FadeIn.duration(450)}
            style={{ width, height }}
            pointerEvents="none"
          >
            <Svg width={width} height={height}>
              {ticks.map((t) => (
                <G key={t}>
                  <Line
                    x1={pad.left}
                    x2={width - pad.right}
                    y1={yAt(t)}
                    y2={yAt(t)}
                    stroke={JOYA_CHART.grid}
                    strokeDasharray="3 4"
                  />
                  <SvgText
                    x={pad.left - 8}
                    y={yAt(t) + 4}
                    textAnchor="end"
                    fontSize={AXIS_FONT_SIZE}
                    fill={AXIS_FILL}
                  >
                    {formatAxis(t)}
                  </SvgText>
                </G>
              ))}
              <Line
                x1={pad.left}
                x2={width - pad.right}
                y1={baseline}
                y2={baseline}
                stroke="rgba(23,59,94,0.14)"
              />

              {xTicks.map((i) => (
                <SvgText
                  key={i}
                  x={xAt(i)}
                  y={height - 7}
                  textAnchor="middle"
                  fontSize={AXIS_FONT_SIZE}
                  fill={AXIS_FILL}
                >
                  {rows[i]?.label}
                </SvgText>
              ))}

              {series.map((s) => {
                const pts: { x: number; y: number }[] = [];
                rows.forEach((row, i) => {
                  const v = row[s.key];
                  if (v != null && Number.isFinite(v)) {
                    pts.push({ x: xAt(i), y: yAt(v) });
                  }
                });
                const d = linePath(pts);
                return d ? (
                  <Path
                    key={s.key}
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null;
              })}

              {hover != null ? (
                <G>
                  <Line
                    x1={xAt(hover)}
                    x2={xAt(hover)}
                    y1={pad.top}
                    y2={baseline}
                    stroke={JOYA_CHART.navy}
                    strokeOpacity={0.25}
                  />
                  {hoverKnown.map(({ s, v }) => (
                    <Circle
                      key={s.key}
                      cx={xAt(hover)}
                      cy={yAt(v)}
                      r={4.5}
                      fill="#fff"
                      stroke={s.color}
                      strokeWidth={2.25}
                    />
                  ))}
                </G>
              ) : null}
            </Svg>
          </Animated.View>
        ) : null}

        {width > 0 && height > 0 ? (
          <View
            style={{
              position: "absolute",
              left: pad.left,
              top: pad.top,
              width: innerW,
              height: innerH,
            }}
            onTouchStart={(e: GestureResponderEvent) =>
              onTouch(e.nativeEvent.locationX, true)
            }
            onTouchMove={(e: GestureResponderEvent) =>
              onTouch(e.nativeEvent.locationX, false)
            }
          />
        ) : null}

        <ChartTooltip
          visible={hover != null && hoverKnown.length > 0}
          x={hover != null ? xAt(hover) : 0}
          y={hoverTopY}
          containerWidth={width}
          placement={hoverTopY < 90 ? "below" : "above"}
        >
          {hover != null ? (
            <View>
              <TooltipTitle>{rows[hover]?.label}</TooltipTitle>
              {hoverKnown.map(({ s, v }) => (
                <TooltipValue key={s.key} color={s.color}>
                  {`${s.label} · ${formatTooltipValue(v)}`}
                </TooltipValue>
              ))}
            </View>
          ) : null}
        </ChartTooltip>
      </View>

      <View className="mt-1 flex-row items-center justify-center gap-4">
        {series.map((s) => (
          <View key={s.key} className="flex-row items-center gap-1.5">
            <View
              className="h-[3px] w-4 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <Text className="text-xs text-ink-muted">{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
