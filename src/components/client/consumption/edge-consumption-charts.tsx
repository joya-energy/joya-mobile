"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { JOYA_CHART, JOYA_RECHARTS } from "@/components/joya/chart-theme";
import { JoyaBarChart, TooltipTitle, TooltipValue, formatAxis } from "@/components/client/dashboard/chart-kit";
import type { EdgeMetricPoint } from "@/lib/consumption/api";

/** Consumption = navy (production is coral elsewhere); phases = navy / blue / coral. */
export const EDGE_CHART_COLORS = {
  l1: JOYA_CHART.navy,
  l2: JOYA_CHART.blue,
  l3: JOYA_CHART.coral,
  gen: JOYA_CHART.navy,
  pf: JOYA_CHART.blue,
  freq: JOYA_CHART.blue,
} as const;

export type ViewMode = "gen" | "phase";

export type SeriesRow = {
  label: string;
  t: string;
  gen: number | null;
  l1: number | null;
  l2: number | null;
  l3: number | null;
};

export function fmtMetric(
  v: number | null | undefined,
  decimals: number,
  unit = "",
): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const n = v.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return unit ? `${n} ${unit}` : n;
}

export function timeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Tunis",
    });
  } catch {
    return iso.slice(11, 16);
  }
}

export function mean(a: number | null, b: number | null, c: number | null): number | null {
  const xs = [a, b, c].filter((v): v is number => v != null && Number.isFinite(v));
  if (!xs.length) return null;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

export function sumPhases(a: number | null, b: number | null, c: number | null): number | null {
  const xs = [a, b, c].filter((v): v is number => v != null && Number.isFinite(v));
  if (!xs.length) return null;
  return xs.reduce((s, x) => s + x, 0);
}

export function mapMetric(
  points: EdgeMetricPoint[],
  pick: (p: EdgeMetricPoint) => {
    gen: number | null;
    l1: number | null;
    l2: number | null;
    l3: number | null;
  },
): SeriesRow[] {
  return points.map((p) => ({
    label: timeLabel(p.t),
    t: p.t,
    ...pick(p),
  }));
}

function chartTooltipStyle() {
  return JOYA_RECHARTS.tooltip;
}

export function PhaseToggle({
  value,
  onChange,
  labels = { gen: "Global", phase: "Par phase" },
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  labels?: { gen: string; phase: string };
}) {
  return (
    <div className="inline-flex rounded-pill bg-cream-2 p-0.5 text-[12.5px] font-semibold">
      {(["gen", "phase"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "rounded-pill px-3.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
            value === mode
              ? "bg-white text-navy shadow-joya-xs"
              : "text-slate-500 hover:text-navy",
          )}
        >
          {labels[mode]}
        </button>
      ))}
    </div>
  );
}

export function StatBox({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "accent" | "muted";
}) {
  return (
    <div
      className={cn(
        "relative min-w-[6.5rem] flex-1 overflow-hidden rounded-[16px] px-3.5 py-2.5",
        tone === "accent" ? "bg-blue-tint" : "bg-cream-2/90",
      )}
    >
      <div className="text-[11px] font-medium text-ink-muted">{label}</div>
      <div className="mt-0.5 font-display text-[15px] font-bold tabular-nums tracking-tight text-navy">
        {value}
      </div>
    </div>
  );
}

/** Navy pill on the average reference line (Recharts custom label). */
export function AveragePillLabel({
  viewBox,
  value,
}: {
  viewBox?: { x?: number; y?: number; width?: number };
  value?: string;
}) {
  if (!viewBox || !value) return null;
  const text = String(value);
  const w = text.length * 7.1 + 18;
  const h = 22;
  const x = (viewBox.x ?? 0) + (viewBox.width ?? 0) - w - 4;
  const y = (viewBox.y ?? 0) - h - 6;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={11}
        fill={JOYA_CHART.navyDark}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        fill="#fff"
        fontSize={11}
        fontWeight={600}
        fontFamily={JOYA_CHART.fontData}
      >
        {text}
      </text>
    </g>
  );
}

function stats(values: Array<number | null>) {
  const xs = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!xs.length) return null;
  return {
    min: Math.min(...xs),
    max: Math.max(...xs),
    avg: xs.reduce((a, b) => a + b, 0) / xs.length,
  };
}

export function MetricLinePanel({
  title,
  unit,
  decimals,
  rows,
  mode,
  onModeChange,
  showPhaseToggle = true,
  color = EDGE_CHART_COLORS.gen,
  subtitle = "moyenne par intervalle",
  hourAxis = false,
}: {
  title: string;
  unit: string;
  decimals: number;
  rows: SeriesRow[];
  mode: ViewMode;
  onModeChange?: (m: ViewMode) => void;
  showPhaseToggle?: boolean;
  color?: string;
  subtitle?: string;
  hourAxis?: boolean;
}) {
  const lastIndex = [...rows]
    .map((r, i) => ({ r, i }))
    .reverse()
    .find(({ r }) => r.gen != null)?.i;
  const lastNonNull = lastIndex != null ? rows[lastIndex] : undefined;
  const genStats = stats(rows.map((r) => r.gen));
  const gradientId = `edge-${title.replace(/[^a-z]/gi, "")}`;
  const hasData = rows.some((r) =>
    mode === "gen"
      ? r.gen != null
      : r.l1 != null || r.l2 != null || r.l3 != null,
  );

  return (
    <Card className="rounded-[22px] border-line bg-white shadow-joya-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 font-display text-[15px] font-semibold text-navy">
            <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
            {title}
          </CardTitle>
          <p className="mt-0.5 text-[12.5px] text-ink-faint">
            {unit} · {subtitle}
          </p>
        </div>
        {showPhaseToggle && onModeChange ? (
          <PhaseToggle value={mode} onChange={onModeChange} />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {mode === "gen" || !showPhaseToggle ? (
            <>
              <StatBox
                tone="accent"
                label="Actuelle"
                value={fmtMetric(lastNonNull?.gen, decimals, unit)}
              />
              <StatBox label="Moyenne" value={fmtMetric(genStats?.avg, decimals, unit)} />
              <StatBox
                label="Min – Max"
                value={
                  genStats
                    ? `${fmtMetric(genStats.min, decimals)} – ${fmtMetric(genStats.max, decimals)}`
                    : "—"
                }
              />
            </>
          ) : (
            <>
              <StatBox tone="accent" label="L1" value={fmtMetric(lastNonNull?.l1, decimals, unit)} />
              <StatBox label="L2" value={fmtMetric(lastNonNull?.l2, decimals, unit)} />
              <StatBox label="L3" value={fmtMetric(lastNonNull?.l3, decimals, unit)} />
            </>
          )}
        </div>
        {!hasData ? (
          <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-line-strong bg-cream/60 text-sm text-ink-muted">
            Aucune donnée pour cette période
          </div>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {mode === "gen" || !showPhaseToggle ? (
                <AreaChart data={rows} margin={{ top: 28, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...JOYA_RECHARTS.grid} />
                  <XAxis
                    dataKey="label"
                    tick={JOYA_RECHARTS.tick}
                    axisLine={JOYA_RECHARTS.axisLine}
                    tickLine={false}
                    interval={hourAxis ? 2 : "preserveStartEnd"}
                    minTickGap={hourAxis ? 8 : 40}
                  />
                  <YAxis
                    tick={JOYA_RECHARTS.tick}
                    width={46}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => formatAxis(v)}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    cursor={{ stroke: JOYA_CHART.navy, strokeOpacity: 0.25 }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div style={chartTooltipStyle()}>
                          <TooltipTitle>{label}</TooltipTitle>
                          <TooltipValue color={color}>{fmtMetric(payload[0].value as number, decimals, unit)}</TooltipValue>
                        </div>
                      ) : null
                    }
                  />
                  {genStats ? (
                    <ReferenceLine
                      y={genStats.avg}
                      stroke={JOYA_CHART.navy}
                      strokeOpacity={0.4}
                      strokeDasharray="5 6"
                      label={
                        <AveragePillLabel
                          value={`Moy. ${fmtMetric(genStats.avg, decimals, unit)}`}
                        />
                      }
                    />
                  ) : null}
                  <Area
                    type="monotone"
                    dataKey="gen"
                    stroke={color}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2.35}
                    dot={(props) => {
                      const { cx, cy, index, key } = props as {
                        cx?: number;
                        cy?: number;
                        index?: number;
                        key?: string;
                      };
                      if (index !== lastIndex || cx == null || cy == null) {
                        return <g key={key} />;
                      }
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={5.5}
                          fill="#fff"
                          stroke={JOYA_CHART.navyDark}
                          strokeWidth={2.4}
                        />
                      );
                    }}
                    activeDot={{ r: 5, fill: "#fff", stroke: color, strokeWidth: 2.5 }}
                    connectNulls
                  />
                </AreaChart>
              ) : (
                <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...JOYA_RECHARTS.grid} />
                  <XAxis
                    dataKey="label"
                    tick={JOYA_RECHARTS.tick}
                    axisLine={JOYA_RECHARTS.axisLine}
                    tickLine={false}
                    interval={hourAxis ? 2 : "preserveStartEnd"}
                    minTickGap={hourAxis ? 8 : 40}
                  />
                  <YAxis tick={JOYA_RECHARTS.tick} width={46} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatAxis(v)} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={chartTooltipStyle()} cursor={{ stroke: JOYA_CHART.navy, strokeOpacity: 0.25 }} />
                  <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, fontFamily: JOYA_CHART.fontBody, color: JOYA_CHART.axisText }} />
                  <Line type="monotone" dataKey="l1" name="L1" stroke={EDGE_CHART_COLORS.l1} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                  <Line type="monotone" dataKey="l2" name="L2" stroke={EDGE_CHART_COLORS.l2} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                  <Line type="monotone" dataKey="l3" name="L3" stroke={EDGE_CHART_COLORS.l3} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DailyEnergyBarChart({
  data,
  dateLabel,
  dayTotal,
}: {
  data: SeriesRow[];
  dateLabel: string;
  dayTotal: number | null;
}) {
  const hasData = data.some((r) => r.gen != null && r.gen > 0);
  const peak = data.reduce<SeriesRow | null>((best, r) => (r.gen != null && (!best || r.gen > (best.gen ?? 0)) ? r : best), null);

  return (
    <Card className="rounded-[22px] border-line bg-white shadow-joya-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 font-display text-[15px] font-semibold text-navy">
            <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
            Consommation heure par heure
          </CardTitle>
          <p className="mt-0.5 text-[12.5px] text-ink-faint">
            kWh · moyenne par intervalle
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <StatBox
            tone="accent"
            label="Actuelle"
            value={fmtMetric(dayTotal, 2, "kWh")}
          />
          <StatBox
            label="Moyenne"
            value={fmtMetric(
              (() => {
                const xs = data.map((r) => r.gen).filter((v): v is number => v != null && v > 0);
                return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
              })(),
              2,
              "kWh",
            )}
          />
          <StatBox
            label="Min – Max"
            value={
              peak?.gen
                ? `${fmtMetric(Math.min(...data.map((r) => r.gen ?? Infinity).filter((v) => Number.isFinite(v))), 2)} – ${fmtMetric(peak.gen, 2)}`
                : "—"
            }
          />
        </div>
        {!hasData ? (
          <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-line-strong bg-cream/60 text-sm text-ink-muted">
            Aucune donnée horaire pour cette journée
          </div>
        ) : (
          <div className="relative h-56 w-full">
            <JoyaBarChart
              bars={data.map((r) => ({ label: r.label, value: r.gen ?? 0 }))}
              color={EDGE_CHART_COLORS.gen}
              unit="kWh"
              bestLabel="Pic"
              ariaLabel={`Consommation par heure, ${dateLabel}`}
              renderTooltip={(i) => (
                <>
                  <TooltipTitle>{data[i].label}</TooltipTitle>
                  <TooltipValue color={EDGE_CHART_COLORS.gen}>{fmtMetric(data[i].gen, 2, "kWh")}</TooltipValue>
                </>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
