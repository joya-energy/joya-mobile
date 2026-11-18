"use client";

/**
 * Joya chart kit — SVG drawn at the element's real pixel size (no viewBox
 * scaling), so axis text stays legible. Shared by every dashboard chart.
 *
 * Rules: one y-axis, round ticks, recessive grid, 2.5px lines, 4px rounded bar
 * tops, selective direct labels (peak / now / average), hover crosshair + tooltip.
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import { ChartTooltip } from "./chart-tooltip";

/* ── Utilities ──────────────────────────────────────────────────────── */

/** Measures an element; callback ref so it also works when the node mounts late. */
export function useElementSize<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useCallback((el: T | null) => setNode(el), []);
  useEffect(() => {
    if (!node) return;
    const update = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return { ref, ...size };
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
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: digits })} ${unit}`;
}

const AXIS_TEXT = {
  fill: JOYA_CHART.axisText,
  fontFamily: JOYA_CHART.fontData,
  fontSize: 11,
} as const;

function textWidth(text: string, size = 11): number {
  return text.length * size * 0.62;
}

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
    <g>
      <rect
        x={left}
        y={y - h / 2}
        width={w}
        height={h}
        rx={10}
        fill={filled ? tone : "#fff"}
        stroke={filled ? "none" : tone}
        strokeWidth={filled ? 0 : 1.25}
      />
      <text
        x={left + w / 2}
        y={y + 4}
        textAnchor="middle"
        style={{ ...AXIS_TEXT, fill: filled ? "#fff" : tone, fontWeight: 600 }}
      >
        {text}
      </text>
    </g>
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
  ariaLabel: string;
  /** Index of the live / latest point (pulse + "Maintenant"). */
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
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const reactId = useId().replace(/:/g, "");
  const gradientId = `area-${reactId}`;
  const secondaryGradientId = `area-sec-${reactId}`;
  const [hover, setHover] = useState<number | null>(null);

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

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + pad.left;
    let best = -1;
    let dist = Infinity;
    const hoverTargets =
      secondaryKnown.length > 0
        ? [...known, ...secondaryKnown]
        : known;
    for (const p of hoverTargets) {
      const d = Math.abs(xAt(p.i) - x);
      if (d < dist) {
        dist = d;
        best = p.i;
      }
    }
    setHover(best >= 0 ? best : null);
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
    return (
      <div className={className ?? "absolute inset-0 min-h-0"}>
        <div className="flex h-full min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-line-strong bg-cream/60 px-4 text-center text-sm text-ink-muted">
          {emptyMessage}
        </div>
      </div>
    );
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

  const peakSeries =
    peakFromSecondary && secondaryKnown.length > 0 ? secondaryKnown : known;
  const peak = peakSeries.reduce((a, b) => (b.v > a.v ? b : a), peakSeries[0]);
  const tipValueAt = (i: number) =>
    peakFromSecondary && secondary
      ? secondary[i]
      : points[i]?.value;
  const tip =
    liveIndex != null && tipValueAt(liveIndex) != null ? liveIndex : null;
  const peakIsTip = tip != null && tip === peak.i;
  const hoverX = hover != null ? xAt(hover) : 0;
  const hoverValue =
    hover != null
      ? tipValueAt(hover) ?? points[hover]?.value
      : null;
  const tipYValue =
    tip != null ? (tipValueAt(tip) as number) : 0;

  return (
    <div className={className ?? "absolute inset-0 min-h-0"}>
      <div ref={ref} className="relative h-full w-full" onMouseLeave={() => setHover(null)}>
        {width > 0 && height > 0 ? (
          <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="70%" stopColor={color} stopOpacity={0.06} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={secondaryGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.28} />
                <stop offset="70%" stopColor={secondaryColor} stopOpacity={0.06} />
                <stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* unit */}
            <text x={pad.left - 8} y={14} textAnchor="end" style={{ ...AXIS_TEXT, fontSize: 10.5 }}>
              {unit}
            </text>

            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  stroke={t === 0 ? "rgba(23,59,94,0.18)" : JOYA_CHART.grid}
                  strokeDasharray={t === 0 ? undefined : "3 4"}
                />
                <text x={pad.left - 8} y={yAt(t) + 4} textAnchor="end" style={AXIS_TEXT}>
                  {formatAxis(t)}
                </text>
              </g>
            ))}

            {xTicks.map((i) => (
              <text key={i} x={xAt(i)} y={height - 7} textAnchor="middle" style={AXIS_TEXT}>
                {points[i].label}
              </text>
            ))}

            {area ? (
              <path key={`a-${n}`} d={area} fill={`url(#${gradientId})`} className="joya-fade-late" />
            ) : null}
            {secArea ? (
              <path
                key={`a-sec-${n}`}
                d={secArea}
                fill={`url(#${secondaryGradientId})`}
                className="joya-fade-late"
              />
            ) : null}
            {refPts.length > 1 ? (
              <path
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
              <path key={`l-${n}`} d={line} pathLength={1} className="joya-draw" fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            ) : null}
            {secLine ? (
              <path
                key={`l-sec-${n}`}
                d={secLine}
                pathLength={1}
                className="joya-draw"
                fill="none"
                stroke={secondaryColor}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}

            {showDots
              ? known.map((p) => (
                  <circle
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
              <circle
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
              <g aria-hidden>
                {showDots ? null : (
                  <>
                    <line x1={xAt(peak.i)} x2={xAt(peak.i)} y1={yAt(peak.v) - 8} y2={yAt(peak.v) - 2} stroke={color} />
                    <circle cx={xAt(peak.i)} cy={yAt(peak.v)} r={4} fill={color} stroke="#fff" strokeWidth={2} />
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
              </g>
            ) : null}

            {/* live endpoint */}
            {tip != null ? (
              <g aria-hidden>
                <circle cx={xAt(tip)} cy={yAt(tipYValue)} r={10} fill={peakFromSecondary ? secondaryColor : color} opacity={0.2}>
                  <animate attributeName="r" values="6;13;6" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle
                  cx={xAt(tip)}
                  cy={yAt(tipYValue)}
                  r={5}
                  fill={peakFromSecondary ? secondaryColor : color}
                  stroke="#fff"
                  strokeWidth={2}
                />
                {width >= 420 ? (
                <SvgPill
                  x={Math.min(Math.max(xAt(tip), pad.left + 72), width - pad.right - 8)}
                  y={Math.max(yAt(tipYValue) - 20, 12)}
                  text={
                    liveLabel
                      ? liveLabel(tip)
                      : `Maintenant ${formatValue(tipYValue, unit)}`
                  }
                  tone={JOYA_CHART.navyDark}
                  filled
                  anchor="end"
                />
                ) : null}
              </g>
            ) : null}

            {/* hover */}
            {hover != null && hoverValue != null ? (
              <g aria-hidden>
                <line x1={hoverX} x2={hoverX} y1={pad.top} y2={baseline} stroke={JOYA_CHART.navy} strokeOpacity={0.25} />
                <circle
                  cx={hoverX}
                  cy={yAt(hoverValue)}
                  r={5.5}
                  fill="#fff"
                  stroke={peakFromSecondary ? secondaryColor : color}
                  strokeWidth={2.5}
                />
              </g>
            ) : null}

            <rect
              x={pad.left}
              y={pad.top}
              width={innerW}
              height={innerH}
              fill="transparent"
              onMouseMove={onMove}
              style={{ cursor: "crosshair" }}
            />
          </svg>
        ) : null}
        <ChartTooltip
          visible={hover != null && hoverValue != null}
          x={hoverX}
          y={hoverValue != null ? yAt(hoverValue) : 0}
          placement={hoverValue != null && yAt(hoverValue) < 90 ? "below" : "above"}
        >
          {hover != null ? renderTooltip(hover) : null}
        </ChartTooltip>
      </div>
    </div>
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
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

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

  return (
    <div className={className ?? "absolute inset-0 min-h-0"}>
      <div ref={ref} className="relative h-full w-full" onMouseLeave={() => setHover(null)}>
        {width > 0 && height > 0 ? (
          <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
            <text x={pad.left - 8} y={14} textAnchor="end" style={{ ...AXIS_TEXT, fontSize: 10.5 }}>
              {unit}
            </text>
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  stroke={t === 0 ? "rgba(23,59,94,0.18)" : JOYA_CHART.grid}
                  strokeDasharray={t === 0 ? undefined : "3 4"}
                />
                <text x={pad.left - 8} y={yAt(t) + 4} textAnchor="end" style={AXIS_TEXT}>
                  {formatAxis(t)}
                </text>
              </g>
            ))}

            {highlightBand &&
            highlightBand.toIndex > highlightBand.fromIndex &&
            highlightBand.fromIndex >= 0 &&
            highlightBand.toIndex <= bars.length ? (
              <g aria-hidden>
                <rect
                  x={pad.left + band * highlightBand.fromIndex}
                  y={pad.top}
                  width={band * (highlightBand.toIndex - highlightBand.fromIndex)}
                  height={innerH}
                  rx={18}
                  fill="#EEEFF2"
                />
                {highlightBand.label ? (
                  <text
                    x={
                      pad.left +
                      band * (highlightBand.fromIndex + highlightBand.toIndex) / 2
                    }
                    y={pad.top + 16}
                    textAnchor="middle"
                    style={{ ...AXIS_TEXT, fill: JOYA_CHART.axisText, fontSize: 11 }}
                  >
                    {highlightBand.label}
                  </text>
                ) : null}
              </g>
            ) : null}

            {bars.map((b, i) => {
              const v = values[i];
              const dim = hover != null && hover !== i;
              const isPartial = i === partialIndex;
              return (
                <g key={`${b.label}-${i}`}>
                  {v > 0 ? (
                    <path
                      d={barPath(i, v)}
                      fill={b.color ?? color}
                      opacity={dim ? 0.35 : isPartial ? 0.45 : 1}
                      className="joya-grow"
                      style={{ transition: "opacity 150ms", animationDelay: `${Math.min(i, 30) * 25}ms` }}
                    />
                  ) : null}
                  {(xTickFilter ? xTickFilter(b.label, i) : true) && i % labelEvery === 0 ? (
                    <text
                      x={xCenter(i)}
                      y={height - 7}
                      textAnchor="middle"
                      style={{ ...AXIS_TEXT, fill: hover === i ? JOYA_CHART.navy : AXIS_TEXT.fill, fontWeight: hover === i ? 600 : 400 }}
                    >
                      {b.label}
                    </text>
                  ) : null}
                  <rect
                    x={pad.left + band * i}
                    y={pad.top}
                    width={band}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    style={{ cursor: "pointer" }}
                  />
                </g>
              );
            })}

            {/* best bar direct label */}
            {bestLabel && values[best] > 0 && hover == null && width >= 420 ? (
              <g aria-hidden pointerEvents="none">
                <SvgPill
                  x={Math.min(Math.max(xCenter(best), pad.left + 60), width - pad.right - 60)}
                  y={Math.max(yAt(values[best]) - 16, 12)}
                  text={`${bestLabel} ${formatValue(values[best], unit, 0)}`}
                  tone={color}
                />
              </g>
            ) : null}

            {showAverage && average > 0 ? (
              <g aria-hidden pointerEvents="none">
                <line
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
              </g>
            ) : null}
          </svg>
        ) : null}
        <ChartTooltip
          visible={hover != null}
          x={hover != null ? xCenter(hover) : 0}
          y={hover != null ? yAt(values[hover]) : 0}
          placement={hover != null && yAt(values[hover]) < 90 ? "below" : "above"}
        >
          {hover != null ? renderTooltip(hover) : null}
        </ChartTooltip>
      </div>
    </div>
  );
}

/** Shared tooltip header + rows. */
export function TooltipTitle({ children }: { children: ReactNode }) {
  return <p className="font-data text-[11px] uppercase tracking-[0.06em] text-slate-500">{children}</p>;
}

export function TooltipValue({ color, children }: { color: string; children: ReactNode }) {
  return (
    <p className="mt-1 flex items-center gap-2 font-display text-base font-bold tabular-nums text-navy">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
      {children}
    </p>
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
  unit,
  ariaLabel,
  renderTooltip,
  className,
}: GroupedBarChartProps) {
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
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

  return (
    <div className={className ?? "absolute inset-0 min-h-0"}>
      <div ref={ref} className="relative h-full w-full" onMouseLeave={() => setHover(null)}>
        {width > 0 && height > 0 ? (
          <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={yAt(t)} y2={yAt(t)} stroke={t === 0 ? "rgba(23,59,94,0.14)" : "rgba(23,59,94,0.06)"} />
                <text x={pad.left - 12} y={yAt(t) + 4} textAnchor="end" style={{ ...AXIS_TEXT, fontFamily: JOYA_CHART.fontBody, fontSize: 12 }}>
                  {formatAxis(t)}
                </text>
              </g>
            ))}
            {labels.map((label, i) => {
              const x0 = pad.left + band * i + (band - groupW) / 2;
              const dim = hover != null && hover !== i;
              return (
                <g key={`${label}-${i}`}>
                  {hover === i ? (
                    <rect x={pad.left + band * i + 2} y={pad.top} width={band - 4} height={innerH} rx={12} fill="rgba(23,59,94,0.04)" />
                  ) : null}
                  {series.map((s, si) => {
                    const v = Math.max(0, s.values[i] ?? 0);
                    if (v <= 0) return null;
                    return (
                      <path
                        key={s.key}
                        d={pillPath(x0 + si * (barW + gap), yAt(v), barW, baseline - yAt(v))}
                        fill={s.color}
                        opacity={dim ? 0.35 : 1}
                        className="joya-grow"
                        style={{ transition: "opacity 150ms", animationDelay: `${Math.min(i, 31) * 45 + si * 90}ms` }}
                      />
                    );
                  })}
                  {i % labelEvery === 0 ? (
                    <text
                      x={pad.left + band * i + band / 2}
                      y={height - 8}
                      textAnchor="middle"
                      style={{ ...AXIS_TEXT, fontFamily: JOYA_CHART.fontBody, fontSize: 12.5, fill: hover === i ? JOYA_CHART.navy : AXIS_TEXT.fill, fontWeight: hover === i ? 600 : 400 }}
                    >
                      {label}
                    </text>
                  ) : null}
                  <rect
                    x={pad.left + band * i}
                    y={pad.top}
                    width={band}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    style={{ cursor: "pointer" }}
                  />
                </g>
              );
            })}
          </svg>
        ) : null}
        <ChartTooltip
          visible={hover != null}
          x={hover != null ? pad.left + band * hover + band / 2 : 0}
          y={hover != null ? yAt(Math.max(0, ...series.map((s) => s.values[hover] ?? 0))) : 0}
          placement={hover != null && yAt(Math.max(0, ...series.map((s) => s.values[hover] ?? 0))) < 90 ? "below" : "above"}
        >
          {hover != null ? renderTooltip(hover) : null}
        </ChartTooltip>
      </div>
    </div>
  );
}
