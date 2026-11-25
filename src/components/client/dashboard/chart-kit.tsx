/**
 * Joya chart kit (React Native) — react-native-svg drawn at the element's real
 * pixel size (measured with onLayout, no viewBox scaling), so axis text stays
 * legible. Shared by every dashboard chart.
 *
 * Rules: one y-axis, round ticks, recessive grid, 2.5px lines, pill bars,
 * selective direct labels (peak / now / average), tap / scrub crosshair + tooltip.
 *
 * Interaction: there is no hover on mobile — a transparent touch layer over the
 * plot area selects the nearest point / bar on touch start and while dragging.
 * Tapping the already selected point dismisses the tooltip.
 */
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { View, Text, type LayoutChangeEvent, type GestureResponderEvent } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import { ChartTooltip } from "./chart-tooltip";

/* ── Utilities ──────────────────────────────────────────────────────── */

/**
 * Measures a view via onLayout. Spread `onLayout` on the View to measure;
 * `ref` is returned for API compatibility with the web hook and may be unused.
 */
export function useElementSize<T = View>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height },
    );
  }, []);
  return { ref, onLayout, ...size };
}

/** Round axis ticks (steps of 1, 2, 2.5, 5 × 10ⁿ) covering [0, max]. */
export function niceTicks(max: number, target = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const raw = max / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

export function formatAxis(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}K`;
  }
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

export function formatValue(value: number, unit: string, digits = 1): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: digits })} ${unit}`;
}

/** Axis text props (no fontFamily: CSS `var()` families are invalid in RN SVG). */
const AXIS_FONT_SIZE = 11;
const AXIS_FILL = JOYA_CHART.axisText;

function textWidth(text: string, size = 11): number {
  return text.length * size * 0.62;
}

const GRID_ZERO = "rgba(23,59,94,0.18)";

/** Small pill label drawn in SVG (peak, now, average). */
function SvgPill({
  x,
  y,
  text,
  tone,
  anchor = "middle",
  filled = false,
}: {
  x: number;
  y: number;
  text: string;
  tone: string;
  anchor?: "start" | "middle" | "end";
  filled?: boolean;
}) {
  const w = textWidth(text, 11) + 14;
  const h = 20;
  const left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return (
    <G>
      <Rect
        x={left}
        y={y - h / 2}
        width={w}
        height={h}
        rx={10}
        fill={filled ? tone : "#fff"}
        stroke={filled ? undefined : tone}
        strokeWidth={filled ? 0 : 1.25}
      />
      <SvgText
        x={left + w / 2}
        y={y + 4}
        textAnchor="middle"
        fontSize={AXIS_FONT_SIZE}
        fontWeight="600"
        fill={filled ? "#fff" : tone}
      >
        {text}
      </SvgText>
    </G>
  );
}

/** Horizontal grid lines + y tick labels + unit caption (shared by area & bar). */
function YGrid({
  ticks,
  yAt,
  left,
  right,
  width,
  unit,
}: {
  ticks: number[];
  yAt: (v: number) => number;
  left: number;
  right: number;
  width: number;
  unit?: string;
}) {
  return (
    <>
      {unit ? (
        <SvgText x={left - 8} y={14} textAnchor="end" fontSize={10.5} fill={AXIS_FILL}>
          {unit}
        </SvgText>
      ) : null}
      {ticks.map((t) => (
        <G key={t}>
          <Line
            x1={left}
            x2={width - right}
            y1={yAt(t)}
            y2={yAt(t)}
            stroke={t === 0 ? GRID_ZERO : JOYA_CHART.grid}
            strokeDasharray={t === 0 ? undefined : "3 4"}
          />
          <SvgText x={left - 8} y={yAt(t) + 4} textAnchor="end" fontSize={AXIS_FONT_SIZE} fill={AXIS_FILL}>
            {formatAxis(t)}
          </SvgText>
        </G>
      ))}
    </>
  );
}

/**
 * Transparent touch layer over the plot area. Calls `onSelect(x)` with the
 * touch x relative to the layer; `isStart` is true for the initial touch.
 */
function TouchLayer({
  left,
  top,
  width,
  height,
  onSelect,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  onSelect: (x: number, isStart: boolean) => void;
}) {
  return (
    <View
      style={{ position: "absolute", left, top, width, height }}
      onTouchStart={(e: GestureResponderEvent) => onSelect(e.nativeEvent.locationX, true)}
      onTouchMove={(e: GestureResponderEvent) => onSelect(e.nativeEvent.locationX, false)}
    />
  );
}

/** Hover-equivalent state: tap selects, tapping the same index again clears. */
function useSelection() {
  const [selected, setSelected] = useState<number | null>(null);
  const select = useCallback((index: number | null, isStart: boolean) => {
    setSelected((prev) => {
      if (index == null) return null;
      if (isStart && prev === index) return null;
      return index;
    });
  }, []);
  return [selected, select] as const;
}

function ChartEmpty({ message, className }: { message: string; className?: string }) {
  return (
    <View className={className ?? "absolute inset-0"}>
      <View className="h-full min-h-[192px] items-center justify-center rounded-xl border border-dashed border-line-strong bg-cream/60 px-4">
        <Text className="text-center text-sm text-ink-muted">{message}</Text>
      </View>
    </View>
  );
}

/* ── Area / line chart ──────────────────────────────────────────────── */

export type SeriesPoint = { label: string; value: number | null };

type AreaChartProps = {
  points: SeriesPoint[];
  /** Optional dashed reference series (e.g. estimate), same length. */
  reference?: Array<number | null>;
  /** Optional second filled series (e.g. inclined irradiance), same length. */
  secondary?: Array<number | null>;
  color: string;
  referenceColor?: string;
  secondaryColor?: string;
  unit: string;
  /** Accessibility label for the chart. */
  ariaLabel: string;
  /** Index of the live / latest point ("Maintenant"). */
  liveIndex?: number | null;
  /** Override the live pill text (e.g. dual irradiation values). */
  liveLabel?: (index: number) => string;
  /** Peak annotation uses the secondary series when present. */
  peakFromSecondary?: boolean;
  showPeak?: boolean;
  peakLabel?: (point: SeriesPoint, index: number) => string;
  /** Which x labels may be shown (others are skipped). */
  xTickFilter?: (label: string, index: number) => boolean;
  minXTickSpacing?: number;
  smooth?: boolean;
  showDots?: boolean;
  renderTooltip: (index: number) => ReactNode;
  emptyMessage: string;
  className?: string;
};

function linePath(pts: Array<{ x: number; y: number }>, smooth: boolean): string {
  if (pts.length === 0) return "";
  if (!smooth || pts.length < 3) return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
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

export function JoyaAreaChart({
  points,
  reference,
  secondary,
  color,
  referenceColor = JOYA_CHART.navy,
  secondaryColor = JOYA_CHART.coral,
  unit,
  ariaLabel,
  liveIndex = null,
  liveLabel,
  peakFromSecondary = false,
  showPeak = true,
  peakLabel,
  xTickFilter,
  minXTickSpacing = 64,
  smooth = true,
  showDots = false,
  renderTooltip,
  emptyMessage,
  className,
}: AreaChartProps) {
  const { onLayout, width, height } = useElementSize();
  const reactId = useId().replace(/:/g, "");
  const gradientId = `area-${reactId}`;
  const secondaryGradientId = `area-sec-${reactId}`;
  const [hover, select] = useSelection();

  const known = points
    .map((p, i) => ({ i, v: p.value }))
    .filter((p): p is { i: number; v: number } => p.v != null && Number.isFinite(p.v));
  const secondaryKnown = (secondary ?? [])
    .map((v, i) => ({ i, v }))
    .filter((p): p is { i: number; v: number } => p.v != null && Number.isFinite(p.v));
  const refValues = (reference ?? []).filter((v): v is number => v != null);
  const maxValue = Math.max(
    0,
    ...known.map((p) => p.v),
    ...secondaryKnown.map((p) => p.v),
    ...refValues,
  );
  const ticks = niceTicks(maxValue * 1.05);
  const top = ticks[ticks.length - 1] || 1;

  const yLabelW = Math.max(...ticks.map((t) => textWidth(formatAxis(t)))) + 10;
  const pad = { top: 34, right: 14, bottom: 26, left: Math.max(36, yLabelW) };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const n = points.length;
  const xAt = useCallback(
    (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    [pad.left, n, innerW],
  );
  const yAt = (v: number) => pad.top + innerH - (v / top) * innerH;

  const onTouch = (localX: number, isStart: boolean) => {
    const x = localX + pad.left;
    let best = -1;
    let dist = Infinity;
    const hoverTargets = secondaryKnown.length > 0 ? [...known, ...secondaryKnown] : known;
    for (const p of hoverTargets) {
      const d = Math.abs(xAt(p.i) - x);
      if (d < dist) {
        dist = d;
        best = p.i;
      }
    }
    select(best >= 0 ? best : null, isStart);
  };

  const xTicks = useMemo(() => {
    const out: number[] = [];
    let lastX = -Infinity;
    points.forEach((p, i) => {
      if (xTickFilter && !xTickFilter(p.label, i)) return;
      const x = xAt(i);
      if (x - lastX < minXTickSpacing) return;
      out.push(i);
      lastX = x;
    });
    return out;
  }, [points, xTickFilter, xAt, minXTickSpacing]);

  if (known.length === 0 && secondaryKnown.length === 0) {
    return <ChartEmpty message={emptyMessage} className={className} />;
  }

  const linePts = known.map((p) => ({ x: xAt(p.i), y: yAt(p.v) }));
  const line = linePath(linePts, smooth);
  const baseline = pad.top + innerH;
  const area =
    linePts.length > 0
      ? `${line} L${linePts[linePts.length - 1].x.toFixed(1)},${baseline} L${linePts[0].x.toFixed(1)},${baseline} Z`
      : "";
  const secPts = secondaryKnown.map((p) => ({ x: xAt(p.i), y: yAt(p.v) }));
  const secLine = linePath(secPts, smooth);
  const secArea =
    secPts.length > 0
      ? `${secLine} L${secPts[secPts.length - 1].x.toFixed(1)},${baseline} L${secPts[0].x.toFixed(1)},${baseline} Z`
      : "";
  const refPts = (reference ?? [])
    .map((v, i) => (v != null ? { x: xAt(i), y: yAt(v) } : null))
    .filter((p): p is { x: number; y: number } => p != null);

  const peakSeries = peakFromSecondary && secondaryKnown.length > 0 ? secondaryKnown : known;
  const peak = peakSeries.reduce((a, b) => (b.v > a.v ? b : a), peakSeries[0]);
  const tipValueAt = (i: number) => (peakFromSecondary && secondary ? secondary[i] : points[i]?.value);
  const tip = liveIndex != null && tipValueAt(liveIndex) != null ? liveIndex : null;
  const peakIsTip = tip != null && tip === peak.i;
  const hoverX = hover != null ? xAt(hover) : 0;
  const hoverValue = hover != null ? tipValueAt(hover) ?? points[hover]?.value : null;
  const tipYValue = tip != null ? (tipValueAt(tip) as number) : 0;
  const liveColor = peakFromSecondary ? secondaryColor : color;

  return (
    <View className={className ?? "absolute inset-0"}>
      <View
        className="relative h-full w-full"
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        {width > 0 && height > 0 ? (
          <Animated.View entering={FadeIn.duration(450)} style={{ width, height }} pointerEvents="none">
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <Stop offset="70%" stopColor={color} stopOpacity={0.06} />
                  <Stop offset="100%" stopColor={color} stopOpacity={0} />
                </LinearGradient>
                <LinearGradient id={secondaryGradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={secondaryColor} stopOpacity={0.28} />
                  <Stop offset="70%" stopColor={secondaryColor} stopOpacity={0.06} />
                  <Stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
                </LinearGradient>
              </Defs>

              <YGrid ticks={ticks} yAt={yAt} left={pad.left} right={pad.right} width={width} unit={unit} />

              {xTicks.map((i) => (
                <SvgText
                  key={i}
                  x={xAt(i)}
                  y={height - 7}
                  textAnchor="middle"
                  fontSize={AXIS_FONT_SIZE}
                  fill={AXIS_FILL}
                >
                  {points[i].label}
                </SvgText>
              ))}

              {area ? <Path d={area} fill={`url(#${gradientId})`} /> : null}
              {secArea ? <Path d={secArea} fill={`url(#${secondaryGradientId})`} /> : null}
              {refPts.length > 1 ? (
                <Path
                  d={linePath(refPts, smooth)}
                  fill="none"
                  stroke={referenceColor}
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                  opacity={0.75}
                />
              ) : null}
              {line ? (
                <Path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              ) : null}
              {secLine ? (
                <Path
                  d={secLine}
                  fill="none"
                  stroke={secondaryColor}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}

              {showDots
                ? known.map((p) => (
                    <Circle
                      key={p.i}
                      cx={xAt(p.i)}
                      cy={yAt(p.v)}
                      r={p.i === peak.i ? 5 : 3.5}
                      fill="#fff"
                      stroke={color}
                      strokeWidth={2}
                    />
                  ))
                : null}
              {showDots && refPts.length > 0 ? (
                <Circle
                  cx={refPts[refPts.length - 1].x}
                  cy={refPts[refPts.length - 1].y}
                  r={4}
                  fill={referenceColor}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ) : null}

              {/* peak annotation */}
              {showPeak && peak && !peakIsTip && peak.v > 0 ? (
                <G>
                  {showDots ? null : (
                    <>
                      <Line
                        x1={xAt(peak.i)}
                        x2={xAt(peak.i)}
                        y1={yAt(peak.v) - 8}
                        y2={yAt(peak.v) - 2}
                        stroke={color}
                      />
                      <Circle cx={xAt(peak.i)} cy={yAt(peak.v)} r={4} fill={color} stroke="#fff" strokeWidth={2} />
                    </>
                  )}
                  <SvgPill
                    x={Math.min(Math.max(xAt(peak.i), pad.left + 70), width - pad.right - 70)}
                    y={Math.max(yAt(peak.v) - 22, 12)}
                    text={
                      peakLabel
                        ? peakLabel(points[peak.i] ?? { label: "", value: peak.v }, peak.i)
                        : `Pic ${formatValue(peak.v, unit)}`
                    }
                    tone={color}
                  />
                </G>
              ) : null}

              {/* live endpoint (static halo — no SMIL animation in RN) */}
              {tip != null ? (
                <G>
                  <Circle cx={xAt(tip)} cy={yAt(tipYValue)} r={10} fill={liveColor} opacity={0.2} />
                  <Circle cx={xAt(tip)} cy={yAt(tipYValue)} r={5} fill={liveColor} stroke="#fff" strokeWidth={2} />
                  {width >= 420 ? (
                    <SvgPill
                      x={Math.min(Math.max(xAt(tip), pad.left + 72), width - pad.right - 8)}
                      y={Math.max(yAt(tipYValue) - 20, 12)}
                      text={liveLabel ? liveLabel(tip) : `Maintenant ${formatValue(tipYValue, unit)}`}
                      tone={JOYA_CHART.navyDark}
                      filled
                      anchor="end"
                    />
                  ) : null}
                </G>
              ) : null}

              {/* selection crosshair */}
              {hover != null && hoverValue != null ? (
                <G>
                  <Line
                    x1={hoverX}
                    x2={hoverX}
                    y1={pad.top}
                    y2={baseline}
                    stroke={JOYA_CHART.navy}
                    strokeOpacity={0.25}
                  />
                  <Circle cx={hoverX} cy={yAt(hoverValue)} r={5.5} fill="#fff" stroke={liveColor} strokeWidth={2.5} />
                </G>
              ) : null}
            </Svg>
          </Animated.View>
        ) : null}

        {width > 0 && height > 0 ? (
          <TouchLayer left={pad.left} top={pad.top} width={innerW} height={innerH} onSelect={onTouch} />
        ) : null}

        <ChartTooltip
          visible={hover != null && hoverValue != null}
          x={hoverX}
          y={hoverValue != null ? yAt(hoverValue) : 0}
          containerWidth={width}
          placement={hoverValue != null && yAt(hoverValue) < 90 ? "below" : "above"}
        >
          {hover != null ? renderTooltip(hover) : null}
        </ChartTooltip>
      </View>
    </View>
  );
}

/** Pill bar (fully rounded ends) — the landing / reference chart style. */
export function pillPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(w / 2, h / 2);
  if (h <= 0) return "";
  return `M${x},${y + r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x},${y + h - r} Z`;
}

/* ── Bar chart ──────────────────────────────────────────────────────── */

type BarChartProps = {
  bars: Array<{ label: string; value: number; color?: string }>;
  color: string;
  unit: string;
  ariaLabel: string;
  /** Dashed average line over non-empty bars. */
  showAverage?: boolean;
  /** Index drawn as "in progress" (lighter, e.g. current day/month). */
  partialIndex?: number | null;
  xTickFilter?: (label: string, index: number) => boolean;
  /** Direct label on the highest bar. */
  bestLabel?: string;
  /** Grey band behind a contiguous hour range (e.g. heures de fonctionnement). */
  highlightBand?: { fromIndex: number; toIndex: number; label?: string };
  /** Fraction of the category slot used by the bar (default 0.38). */
  barWidthRatio?: number;
  renderTooltip: (index: number) => ReactNode;
  className?: string;
};

export function JoyaBarChart({
  bars,
  color,
  unit,
  ariaLabel,
  showAverage = true,
  partialIndex = null,
  xTickFilter,
  bestLabel = "Record",
  highlightBand,
  barWidthRatio = 0.38,
  renderTooltip,
  className,
}: BarChartProps) {
  const { onLayout, width, height } = useElementSize();
  const [hover, select] = useSelection();

  const values = bars.map((b) => Math.max(0, b.value));
  const filled = values.filter((v, i) => v > 0 && i !== partialIndex);
  const average = filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : 0;
  const best = values.reduce((bi, v, i) => (v > values[bi] ? i : bi), 0);
  const ticks = niceTicks(Math.max(...values, 0) * 1.08);
  const top = ticks[ticks.length - 1] || 1;

  const yLabelW = Math.max(...ticks.map((t) => textWidth(formatAxis(t)))) + 10;
  const pad = { top: 34, right: 14, bottom: 26, left: Math.max(36, yLabelW) };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const band = innerW / Math.max(1, bars.length);
  const barW = Math.max(6, Math.min(40, band * barWidthRatio));
  const xCenter = (i: number) => pad.left + band * i + band / 2;
  const yAt = (v: number) => pad.top + innerH - (v / top) * innerH;
  const baseline = pad.top + innerH;
  const minLabelSpacing = 34;
  const labelEvery = Math.max(1, Math.ceil(minLabelSpacing / band));

  const barPath = (i: number, v: number) => pillPath(xCenter(i) - barW / 2, yAt(v), barW, baseline - yAt(v));

  const onTouch = (localX: number, isStart: boolean) => {
    if (bars.length === 0) return;
    const i = Math.min(bars.length - 1, Math.max(0, Math.floor(localX / band)));
    select(i, isStart);
  };

  return (
    <View className={className ?? "absolute inset-0"}>
      <View
        className="relative h-full w-full"
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        {width > 0 && height > 0 ? (
          <Animated.View
            key={bars.length}
            entering={FadeIn.duration(450)}
            style={{ width, height }}
            pointerEvents="none"
          >
            <Svg width={width} height={height}>
              <YGrid ticks={ticks} yAt={yAt} left={pad.left} right={pad.right} width={width} unit={unit} />

              {highlightBand &&
              highlightBand.toIndex > highlightBand.fromIndex &&
              highlightBand.fromIndex >= 0 &&
              highlightBand.toIndex <= bars.length ? (
                <G>
                  <Rect
                    x={pad.left + band * highlightBand.fromIndex}
                    y={pad.top}
                    width={band * (highlightBand.toIndex - highlightBand.fromIndex)}
                    height={innerH}
                    rx={18}
                    fill="#EEEFF2"
                  />
                  {highlightBand.label ? (
                    <SvgText
                      x={pad.left + (band * (highlightBand.fromIndex + highlightBand.toIndex)) / 2}
                      y={pad.top + 16}
                      textAnchor="middle"
                      fontSize={11}
                      fill={AXIS_FILL}
                    >
                      {highlightBand.label}
                    </SvgText>
                  ) : null}
                </G>
              ) : null}

              {bars.map((b, i) => {
                const v = values[i];
                const dim = hover != null && hover !== i;
                const isPartial = i === partialIndex;
                return (
                  <G key={`${b.label}-${i}`}>
                    {v > 0 ? (
                      <Path
                        d={barPath(i, v)}
                        fill={b.color ?? color}
                        opacity={dim ? 0.35 : isPartial ? 0.45 : 1}
                      />
                    ) : null}
                    {(xTickFilter ? xTickFilter(b.label, i) : true) && i % labelEvery === 0 ? (
                      <SvgText
                        x={xCenter(i)}
                        y={height - 7}
                        textAnchor="middle"
                        fontSize={AXIS_FONT_SIZE}
                        fontWeight={hover === i ? "600" : "400"}
                        fill={hover === i ? JOYA_CHART.navy : AXIS_FILL}
                      >
                        {b.label}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}

              {/* best bar direct label */}
              {bestLabel && values[best] > 0 && hover == null && width >= 420 ? (
                <SvgPill
                  x={Math.min(Math.max(xCenter(best), pad.left + 60), width - pad.right - 60)}
                  y={Math.max(yAt(values[best]) - 16, 12)}
                  text={`${bestLabel} ${formatValue(values[best], unit, 0)}`}
                  tone={color}
                />
              ) : null}

              {showAverage && average > 0 ? (
                <G>
                  <Line
                    x1={pad.left}
                    x2={width - pad.right}
                    y1={yAt(average)}
                    y2={yAt(average)}
                    stroke={JOYA_CHART.navy}
                    strokeWidth={1.5}
                    strokeDasharray="6 5"
                    opacity={0.7}
                  />
                  <SvgPill
                    x={width - pad.right}
                    y={yAt(average) - 13}
                    text={`Moy. ${formatValue(average, unit, 0)}`}
                    tone={JOYA_CHART.navy}
                    filled
                    anchor="end"
                  />
                </G>
              ) : null}
            </Svg>
          </Animated.View>
        ) : null}

        {width > 0 && height > 0 ? (
          <TouchLayer left={pad.left} top={pad.top} width={innerW} height={innerH} onSelect={onTouch} />
        ) : null}

        <ChartTooltip
          visible={hover != null}
          x={hover != null ? xCenter(hover) : 0}
          y={hover != null ? yAt(values[hover] ?? 0) : 0}
          containerWidth={width}
          placement={hover != null && yAt(values[hover] ?? 0) < 90 ? "below" : "above"}
        >
          {hover != null ? renderTooltip(hover) : null}
        </ChartTooltip>
      </View>
    </View>
  );
}

/** Shared tooltip header + rows. */
export function TooltipTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="font-data text-[11px] uppercase tracking-[0.06em] text-slate-500">{children}</Text>
  );
}

export function TooltipValue({ color, children }: { color: string; children: ReactNode }) {
  return (
    <View className="mt-1 flex-row items-center gap-2">
      <View className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
      <Text className="font-display text-base font-bold text-navy" style={{ fontVariant: ["tabular-nums"] }}>
        {children}
      </Text>
    </View>
  );
}

/* ── Grouped pill bars (e.g. consumed vs produced) ──────────────────── */

export type GroupedSeries = { key: string; label: string; color: string; values: number[] };

type GroupedBarChartProps = {
  labels: string[];
  series: GroupedSeries[];
  unit: string;
  ariaLabel: string;
  renderTooltip: (index: number) => ReactNode;
  className?: string;
};

export function JoyaGroupedBarChart({
  labels,
  series,
  unit: _unit,
  ariaLabel,
  renderTooltip,
  className,
}: GroupedBarChartProps) {
  const { onLayout, width, height } = useElementSize();
  const [hover, select] = useSelection();
  const all = series.flatMap((s) => s.values);
  const ticks = niceTicks(Math.max(0, ...all) * 1.08);
  const top = ticks[ticks.length - 1] || 1;
  const yLabelW = Math.max(...ticks.map((t) => textWidth(formatAxis(t)))) + 12;
  const pad = { top: 12, right: 8, bottom: 30, left: Math.max(36, yLabelW) };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const band = innerW / Math.max(1, labels.length);
  const gap = Math.max(3, Math.min(6, band * 0.06));
  const barW = Math.max(8, Math.min(36, (band * 0.84 - gap * (series.length - 1)) / series.length));
  const groupW = barW * series.length + gap * (series.length - 1);
  const yAt = (v: number) => pad.top + innerH - (v / top) * innerH;
  const baseline = pad.top + innerH;
  const labelEvery = Math.max(1, Math.ceil(32 / band));

  const hoverTopY =
    hover != null ? yAt(Math.max(0, ...series.map((s) => s.values[hover] ?? 0))) : 0;

  const onTouch = (localX: number, isStart: boolean) => {
    if (labels.length === 0) return;
    const i = Math.min(labels.length - 1, Math.max(0, Math.floor(localX / band)));
    select(i, isStart);
  };

  return (
    <View className={className ?? "absolute inset-0"}>
      <View
        className="relative h-full w-full"
        onLayout={onLayout}
        accessible
        accessibilityRole="image"
        accessibilityLabel={ariaLabel}
      >
        {width > 0 && height > 0 ? (
          <Animated.View
            key={labels.length}
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
                    stroke={t === 0 ? "rgba(23,59,94,0.14)" : "rgba(23,59,94,0.06)"}
                  />
                  <SvgText x={pad.left - 12} y={yAt(t) + 4} textAnchor="end" fontSize={12} fill={AXIS_FILL}>
                    {formatAxis(t)}
                  </SvgText>
                </G>
              ))}
              {labels.map((label, i) => {
                const x0 = pad.left + band * i + (band - groupW) / 2;
                const dim = hover != null && hover !== i;
                return (
                  <G key={`${label}-${i}`}>
                    {hover === i ? (
                      <Rect
                        x={pad.left + band * i + 2}
                        y={pad.top}
                        width={Math.max(0, band - 4)}
                        height={innerH}
                        rx={12}
                        fill="rgba(23,59,94,0.04)"
                      />
                    ) : null}
                    {series.map((s, si) => {
                      const v = Math.max(0, s.values[i] ?? 0);
                      if (v <= 0) return null;
                      return (
                        <Path
                          key={s.key}
                          d={pillPath(x0 + si * (barW + gap), yAt(v), barW, baseline - yAt(v))}
                          fill={s.color}
                          opacity={dim ? 0.35 : 1}
                        />
                      );
                    })}
                    {i % labelEvery === 0 ? (
                      <SvgText
                        x={pad.left + band * i + band / 2}
                        y={height - 8}
                        textAnchor="middle"
                        fontSize={12.5}
                        fontWeight={hover === i ? "600" : "400"}
                        fill={hover === i ? JOYA_CHART.navy : AXIS_FILL}
                      >
                        {label}
                      </SvgText>
                    ) : null}
                  </G>
                );
              })}
            </Svg>
          </Animated.View>
        ) : null}

        {width > 0 && height > 0 ? (
          <TouchLayer left={pad.left} top={pad.top} width={innerW} height={innerH} onSelect={onTouch} />
        ) : null}

        <ChartTooltip
          visible={hover != null}
          x={hover != null ? pad.left + band * hover + band / 2 : 0}
          y={hoverTopY}
          containerWidth={width}
          placement={hover != null && hoverTopY < 90 ? "below" : "above"}
        >
          {hover != null ? renderTooltip(hover) : null}
        </ChartTooltip>
      </View>
    </View>
  );
}
