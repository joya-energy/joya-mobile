import type { ReactNode } from "react";
import { Pressable, Text, View, type TextStyle } from "react-native";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import {
  JoyaAreaChart,
  JoyaBarChart,
  TooltipTitle,
  TooltipValue,
} from "@/components/client/dashboard/chart-kit";
import type { EdgeMetricPoint } from "@/lib/consumption/api";
import { JoyaMultiLineChart } from "./multi-line-chart";

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

export const TABULAR: TextStyle = { fontVariant: ["tabular-nums"] };

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

/** Card title with the coral accent bar (web `CardTitle` + span). */
export function AccentTitle({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-4 w-[3px] rounded-full bg-coral" />
      <Text
        className={cn(
          "min-w-0 shrink font-display text-navy",
          size === "lg"
            ? "text-[18px] font-bold tracking-tight"
            : "text-[15px] font-semibold",
        )}
      >
        {children}
      </Text>
    </View>
  );
}

export function ChartEmptyBox({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "items-center justify-center rounded-xl border border-dashed border-line-strong bg-cream/60 px-4",
        className,
      )}
    >
      <Text className="text-center text-sm text-ink-muted">{message}</Text>
    </View>
  );
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
    <View
      accessibilityRole="tablist"
      className="flex-row self-start rounded-full bg-cream-2 p-0.5"
    >
      {(["gen", "phase"] as const).map((mode) => {
        const active = value === mode;
        return (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(mode)}
            className={cn(
              "rounded-full px-3.5 py-1.5",
              active && "bg-white shadow-joya-xs",
            )}
          >
            <Text
              className={cn(
                "text-[12.5px] font-semibold",
                active ? "text-navy" : "text-slate-500",
              )}
            >
              {labels[mode]}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
    <View
      className={cn(
        "min-w-[104px] flex-1 overflow-hidden rounded-[16px] px-3.5 py-2.5",
        tone === "accent" ? "bg-blue-tint" : "bg-cream-2",
      )}
    >
      <Text className="text-[11px] font-medium text-ink-muted">{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        className="mt-0.5 font-display text-[15px] font-bold tracking-tight text-navy"
        style={TABULAR}
      >
        {value}
      </Text>
    </View>
  );
}

function stats(values: (number | null)[]) {
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
  const hasData = rows.some((r) =>
    mode === "gen"
      ? r.gen != null
      : r.l1 != null || r.l2 != null || r.l3 != null,
  );
  const genMode = mode === "gen" || !showPhaseToggle;

  return (
    <Card className="gap-3 rounded-[22px] border-line bg-white p-4 shadow-joya-sm">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="min-w-0 shrink">
          <AccentTitle>{title}</AccentTitle>
          <Text className="mt-0.5 text-[12.5px] text-ink-faint">
            {unit} · {subtitle}
          </Text>
        </View>
        {showPhaseToggle && onModeChange ? (
          <PhaseToggle value={mode} onChange={onModeChange} />
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {genMode ? (
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
      </View>

      {!hasData ? (
        <ChartEmptyBox
          className="h-52"
          message="Aucune donnée pour cette période"
        />
      ) : (
        <View className="relative h-60 w-full">
          {genMode ? (
            <JoyaAreaChart
              points={rows.map((r) => ({ label: r.label, value: r.gen }))}
              reference={
                genStats ? rows.map(() => genStats.avg) : undefined
              }
              color={color}
              unit={unit}
              ariaLabel={`${title}, ${unit}`}
              liveIndex={lastIndex ?? null}
              showPeak={false}
              minXTickSpacing={hourAxis ? 40 : 64}
              emptyMessage="Aucune donnée pour cette période"
              renderTooltip={(i) => (
                <>
                  <TooltipTitle>{rows[i]?.label}</TooltipTitle>
                  <TooltipValue color={color}>
                    {fmtMetric(rows[i]?.gen, decimals, unit)}
                  </TooltipValue>
                </>
              )}
            />
          ) : (
            <JoyaMultiLineChart
              rows={rows}
              series={[
                { key: "l1", label: "L1", color: EDGE_CHART_COLORS.l1 },
                { key: "l2", label: "L2", color: EDGE_CHART_COLORS.l2 },
                { key: "l3", label: "L3", color: EDGE_CHART_COLORS.l3 },
              ]}
              ariaLabel={`${title} par phase, ${unit}`}
              minXTickSpacing={hourAxis ? 40 : 56}
              formatTooltipValue={(v) => fmtMetric(v, decimals, unit)}
            />
          )}
        </View>
      )}
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
  const peak = data.reduce<SeriesRow | null>(
    (best, r) =>
      r.gen != null && (!best || r.gen > (best.gen ?? 0)) ? r : best,
    null,
  );

  return (
    <Card className="gap-3 rounded-[22px] border-line bg-white p-4 shadow-joya-sm">
      <View className="min-w-0">
        <AccentTitle>Consommation heure par heure</AccentTitle>
        <Text className="mt-0.5 text-[12.5px] text-ink-faint">
          kWh · moyenne par intervalle
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <StatBox
          tone="accent"
          label="Actuelle"
          value={fmtMetric(dayTotal, 2, "kWh")}
        />
        <StatBox
          label="Moyenne"
          value={fmtMetric(
            (() => {
              const xs = data
                .map((r) => r.gen)
                .filter((v): v is number => v != null && v > 0);
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
              ? `${fmtMetric(
                  Math.min(
                    ...data
                      .map((r) => r.gen ?? Infinity)
                      .filter((v) => Number.isFinite(v)),
                  ),
                  2,
                )} – ${fmtMetric(peak.gen, 2)}`
              : "—"
          }
        />
      </View>

      {!hasData ? (
        <ChartEmptyBox
          className="h-56"
          message="Aucune donnée horaire pour cette journée"
        />
      ) : (
        <View className="relative h-60 w-full">
          <JoyaBarChart
            bars={data.map((r) => ({ label: r.label, value: r.gen ?? 0 }))}
            color={EDGE_CHART_COLORS.gen}
            unit="kWh"
            bestLabel="Pic"
            ariaLabel={`Consommation par heure, ${dateLabel}`}
            renderTooltip={(i) => (
              <>
                <TooltipTitle>{data[i]?.label}</TooltipTitle>
                <TooltipValue color={EDGE_CHART_COLORS.gen}>
                  {fmtMetric(data[i]?.gen, 2, "kWh")}
                </TooltipValue>
              </>
            )}
          />
        </View>
      )}
    </Card>
  );
}
