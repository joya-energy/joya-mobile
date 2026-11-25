import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  consumptionApi,
  type ConsumptionHistoryGrain,
  type ConsumptionHistoryPoint,
  type EdgeConsumptionMonitorResponse,
  type EdgeMetricPoint,
} from "@/lib/consumption/api";
import {
  EDGE_CHART_COLORS,
  ChartEmptyBox,
  StatBox,
  fmtMetric,
  mean,
  sumPhases,
  type SeriesRow,
  type ViewMode,
} from "@/components/client/consumption/edge-consumption-charts";
import { mapDayMetricSeries, hourlyEnergyRows } from "@/lib/consumption/hourly-energy";
import {
  JoyaAreaChart,
  TooltipTitle,
  TooltipValue,
} from "@/components/client/dashboard/chart-kit";
import { PillSelect } from "@/components/client/onboarding-info/pill-select";
import { DatePill } from "@/components/client/consumption/date-pill";
import { JoyaMultiLineChart } from "@/components/client/consumption/multi-line-chart";
import { joyaColors } from "@/theme/colors";

type Period = "day" | "week" | "month" | "year" | "total" | "custom";
type HistParam = "active" | "voltage" | "current" | "energy";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Jour" },
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
  { id: "total", label: "Total" },
  { id: "custom", label: "Personnalisé" },
];

const PARAMS: { id: HistParam; label: string }[] = [
  { id: "active", label: "Puissance active (kW)" },
  { id: "voltage", label: "Tension (V)" },
  { id: "current", label: "Courant (A)" },
  { id: "energy", label: "Consommation (kWh)" },
];

function todayYmd(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Tunis",
  });
}

function ymdFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-CA", {
      timeZone: "Africa/Tunis",
    });
  } catch {
    return null;
  }
}

function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function shiftMonth(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1 + months, 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(d, last));
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function monthStart(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

function monthEnd(ymd: string, today: string): string {
  const [y, m] = ymd.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const end = `${ymd.slice(0, 7)}-${String(last).padStart(2, "0")}`;
  return end > today ? today : end;
}

function yearStart(ymd: string): string {
  return `${ymd.slice(0, 4)}-01-01`;
}

function yearEnd(ymd: string, today: string): string {
  const end = `${ymd.slice(0, 4)}-12-31`;
  return end > today ? today : end;
}

function formatHeading(from: string, to: string, period: Period): string {
  if (period === "total") return "Depuis l'installation";
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  if (period === "day") {
    return fromDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (period === "month") {
    return fromDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }
  if (period === "year") {
    return from.slice(0, 4);
  }
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const a = fromDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });
  const b = toDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${a} – ${b}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function resolveRange(
  period: Period,
  cursor: string,
  today: string,
  trackingSince: string | null,
  customFrom: string,
  customTo: string,
): { from: string; to: string; grain: ConsumptionHistoryGrain } {
  if (period === "day") {
    return { from: cursor, to: cursor, grain: "hour" };
  }
  if (period === "week") {
    return { from: shiftYmd(cursor, -6), to: cursor, grain: "day" };
  }
  if (period === "month") {
    return {
      from: monthStart(cursor),
      to: monthEnd(cursor, today),
      grain: "day",
    };
  }
  if (period === "year") {
    return {
      from: yearStart(cursor),
      to: yearEnd(cursor, today),
      grain: "month",
    };
  }
  if (period === "total") {
    const from = trackingSince && trackingSince < today ? trackingSince : today;
    const spanDays =
      (new Date(`${today}T12:00:00`).getTime() -
        new Date(`${from}T12:00:00`).getTime()) /
      86_400_000;
    return {
      from,
      to: today,
      grain: spanDays > 90 ? "month" : "day",
    };
  }
  const from = customFrom <= customTo ? customFrom : customTo;
  const to = customFrom <= customTo ? customTo : customFrom;
  const spanDays =
    (new Date(`${to}T12:00:00`).getTime() -
      new Date(`${from}T12:00:00`).getTime()) /
    86_400_000;
  return {
    from,
    to: to > today ? today : to,
    grain: spanDays > 62 ? "month" : "day",
  };
}

function paramConfig(param: HistParam) {
  if (param === "voltage") {
    return {
      title: "Tension",
      unit: "V",
      decimals: 0,
      hasPhase: true,
      pick: (p: EdgeMetricPoint) => ({
        gen: p.voltage_avg ?? mean(p.voltage_l1, p.voltage_l2, p.voltage_l3),
        l1: p.voltage_l1,
        l2: p.voltage_l2,
        l3: p.voltage_l3,
      }),
    };
  }
  if (param === "current") {
    return {
      title: "Courant",
      unit: "A",
      decimals: 2,
      hasPhase: true,
      pick: (p: EdgeMetricPoint) => ({
        gen: sumPhases(p.current_l1, p.current_l2, p.current_l3),
        l1: p.current_l1,
        l2: p.current_l2,
        l3: p.current_l3,
      }),
    };
  }
  return {
    title: "Puissance active",
    unit: "kW",
    decimals: 3,
    hasPhase: true,
    pick: (p: EdgeMetricPoint) => ({
      gen: p.active_power_total_kw,
      l1: p.active_power_l1_kw,
      l2:
        p.voltage_l2 != null && p.current_l2 != null
          ? (p.voltage_l2 * p.current_l2 * (p.power_factor ?? 0.97)) / 1000
          : null,
      l3:
        p.voltage_l3 != null && p.current_l3 != null
          ? (p.voltage_l3 * p.current_l3 * (p.power_factor ?? 0.97)) / 1000
          : null,
    }),
  };
}

function rowsFromMonitor(
  monitor: EdgeConsumptionMonitorResponse,
  param: HistParam,
): { rows: SeriesRow[]; resolution: "minute" | "hour" } {
  const cfg = paramConfig(param);
  const sameDayAsLive =
    monitor.today.date === monitor.history.date && monitor.today.points.length > 0;
  const points: EdgeMetricPoint[] = sameDayAsLive
    ? monitor.today.points
    : monitor.history.quarter_hour.length > 0
      ? monitor.history.quarter_hour
      : monitor.history.hourly;

  return mapDayMetricSeries(points, cfg.pick, { forceMinute: true });
}

function energyRows(points: ConsumptionHistoryPoint[]): SeriesRow[] {
  return points.map((p) => ({
    label: p.label,
    t: p.t,
    gen: p.kwh,
    l1: null,
    l2: null,
    l3: null,
  }));
}

function eachYmd(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    const next = shiftYmd(cur, 1);
    if (next === cur) break;
    cur = next;
    if (out.length > 400) break;
  }
  return out;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      out[i] = await fn(items[i]!);
    }
  }
  const n = Math.max(1, Math.min(limit, items.length || 1));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

function meanNums(xs: number[]): number | null {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function pointsForHistoryDay(
  monitor: EdgeConsumptionMonitorResponse,
  ymd: string,
): EdgeMetricPoint[] {
  if (monitor.today.date === ymd && monitor.today.points.length > 0) {
    return monitor.today.points;
  }
  if (monitor.history.quarter_hour.length > 0) return monitor.history.quarter_hour;
  return monitor.history.hourly;
}

function dayMetricRow(
  monitor: EdgeConsumptionMonitorResponse,
  ymd: string,
  pick: (p: EdgeMetricPoint) => {
    gen: number | null;
    l1: number | null;
    l2: number | null;
    l3: number | null;
  },
  label: string,
): SeriesRow {
  const gen: number[] = [];
  const l1: number[] = [];
  const l2: number[] = [];
  const l3: number[] = [];
  for (const p of pointsForHistoryDay(monitor, ymd)) {
    const v = pick(p);
    if (v.gen != null && Number.isFinite(v.gen)) gen.push(v.gen);
    if (v.l1 != null && Number.isFinite(v.l1)) l1.push(v.l1);
    if (v.l2 != null && Number.isFinite(v.l2)) l2.push(v.l2);
    if (v.l3 != null && Number.isFinite(v.l3)) l3.push(v.l3);
  }
  return {
    label,
    t: `${ymd}T12:00:00+01:00`,
    gen: meanNums(gen),
    l1: meanNums(l1),
    l2: meanNums(l2),
    l3: meanNums(l3),
  };
}

function dayTick(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}/${m}`;
}

function monthTick(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

function mergeRows(rows: SeriesRow[], label: string, t: string): SeriesRow {
  return {
    label,
    t,
    gen: meanNums(rows.flatMap((r) => (r.gen != null ? [r.gen] : []))),
    l1: meanNums(rows.flatMap((r) => (r.l1 != null ? [r.l1] : []))),
    l2: meanNums(rows.flatMap((r) => (r.l2 != null ? [r.l2] : []))),
    l3: meanNums(rows.flatMap((r) => (r.l3 != null ? [r.l3] : []))),
  };
}

function FilterLabel({ children }: { children: string }) {
  return (
    <Text className="font-data text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-400">
      {children}
    </Text>
  );
}

type ConsumptionHistorySectionProps = {
  deviceId: string | null;
  trackingSince?: string | null;
};

export function ConsumptionHistorySection({
  deviceId,
  trackingSince,
}: ConsumptionHistorySectionProps) {
  const today = todayYmd();
  const installYmd = ymdFromIso(trackingSince);
  const [period, setPeriod] = useState<Period>("day");
  const [cursor, setCursor] = useState(today);
  const [customFrom, setCustomFrom] = useState(shiftYmd(today, -13));
  const [customTo, setCustomTo] = useState(today);
  const [draftParam, setDraftParam] = useState<HistParam>("active");
  const [draftDate, setDraftDate] = useState(today);
  const [param, setParam] = useState<HistParam>("active");
  const [view, setView] = useState<ViewMode>("gen");
  const [energyPoints, setEnergyPoints] = useState<ConsumptionHistoryPoint[]>(
    [],
  );
  const [dayRows, setDayRows] = useState<SeriesRow[]>([]);
  const [dayResolution, setDayResolution] = useState<"minute" | "hour">(
    "minute",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const range = useMemo(
    () =>
      resolveRange(period, cursor, today, installYmd, customFrom, customTo),
    [cursor, customFrom, customTo, installYmd, period, today],
  );

  const useEnergySeries = param === "energy";
  const cfg = paramConfig(param);
  const effView = !useEnergySeries && cfg.hasPhase ? view : "gen";

  // Keep the draft date in sync when the cursor moves (prev / next arrows).
  const [prevCursor, setPrevCursor] = useState(cursor);
  if (prevCursor !== cursor) {
    setPrevCursor(cursor);
    setDraftDate(cursor);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!deviceId) {
          setEnergyPoints([]);
          setDayRows([]);
          setDayResolution("minute");
          return;
        }
        if (param === "energy") {
          if (period === "day") {
            const monitor = await consumptionApi.getMonitor(deviceId, {
              date: cursor,
            });
            const rows = hourlyEnergyRows(monitor.history.hourly) ?? [];
            if (!cancelled) {
              setEnergyPoints(
                rows.map((r, hour) => ({
                  key: String(hour).padStart(2, "0"),
                  label: r.label,
                  t: r.t,
                  kwh: r.gen,
                })),
              );
              setDayRows([]);
              setDayResolution("hour");
            }
            return;
          }
          const payload = await consumptionApi.getHistory(deviceId, range);
          if (!cancelled) {
            setEnergyPoints(payload.points);
            setDayRows([]);
            setDayResolution("hour");
          }
          return;
        }
        if (period === "day") {
          const monitor = await consumptionApi.getMonitor(deviceId, {
            date: cursor,
          });
          if (!cancelled) {
            const mapped = rowsFromMonitor(monitor, param);
            setDayRows(mapped.rows);
            setDayResolution(mapped.resolution);
            setEnergyPoints([]);
          }
          return;
        }

        const days = eachYmd(range.from, range.to);
        const pick = paramConfig(param).pick;
        const monitors = await mapPool(days, 6, async (ymd) => {
          try {
            return await consumptionApi.getMonitor(deviceId, { date: ymd });
          } catch {
            return null;
          }
        });
        const dailyRows: SeriesRow[] = [];
        for (let i = 0; i < days.length; i++) {
          const mon = monitors[i];
          const ymd = days[i]!;
          if (!mon) continue;
          dailyRows.push(dayMetricRow(mon, ymd, pick, dayTick(ymd)));
        }
        let nextRows = dailyRows;
        if (range.grain === "month") {
          const grouped = new Map<string, SeriesRow[]>();
          for (const row of dailyRows) {
            const ym = row.t.slice(0, 7);
            grouped.set(ym, [...(grouped.get(ym) ?? []), row]);
          }
          nextRows = [...grouped.entries()].map(([ym, rs]) =>
            mergeRows(rs, monthTick(ym), `${ym}-01T12:00:00+01:00`),
          );
        }
        if (!cancelled) {
          setDayRows(nextRows);
          setDayResolution("hour");
          setEnergyPoints([]);
        }
      } catch {
        if (!cancelled) {
          setEnergyPoints([]);
          setDayRows([]);
          setDayResolution("minute");
          setError("Impossible de charger l'historique.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [cursor, deviceId, param, period, range, reloadTick]);

  const rows = useEnergySeries ? energyRows(energyPoints) : dayRows;
  const unit = useEnergySeries ? "kWh" : cfg.unit;
  const decimals = useEnergySeries ? 2 : cfg.decimals;
  const title = useEnergySeries ? "Consommation" : cfg.title;
  const hourAxis =
    period === "day"
      ? param === "energy" || dayResolution === "hour"
      : false;

  const values = rows
    .flatMap((r) => (effView === "gen" ? [r.gen] : [r.l1, r.l2, r.l3]))
    .filter((v): v is number => v != null && Number.isFinite(v));
  const total = values.reduce((a, b) => a + b, 0);
  const avg = values.length ? total / values.length : null;
  const max = values.length ? Math.max(...values) : null;
  const min = values.length ? Math.min(...values) : null;
  const hasData = values.some((v) => v !== 0) || values.length > 0;

  const canNavigate =
    period === "day" || period === "week" || period === "month" || period === "year";
  const atMaxCursor =
    period === "day" || period === "week"
      ? cursor >= today
      : period === "month"
        ? monthEnd(cursor, today) >= today
        : period === "year"
          ? yearEnd(cursor, today) >= today
          : true;

  const goPrev = () => {
    if (period === "day") setCursor((c) => shiftYmd(c, -1));
    if (period === "week") setCursor((c) => shiftYmd(c, -7));
    if (period === "month") setCursor((c) => shiftMonth(c, -1));
    if (period === "year") setCursor((c) => shiftMonth(c, -12));
  };

  const goNext = () => {
    if (atMaxCursor) return;
    if (period === "day")
      setCursor((c) => (shiftYmd(c, 1) > today ? today : shiftYmd(c, 1)));
    if (period === "week")
      setCursor((c) => (shiftYmd(c, 7) > today ? today : shiftYmd(c, 7)));
    if (period === "month") {
      const next = shiftMonth(cursor, 1);
      setCursor(next > today ? today : next);
    }
    if (period === "year") {
      const next = shiftMonth(cursor, 12);
      setCursor(next > today ? today : next);
    }
  };

  const applyFilters = () => {
    setParam(draftParam);
    if (period === "day" || period === "week") {
      setCursor(draftDate > today ? today : draftDate);
    }
    setReloadTick((n) => n + 1);
  };

  const heading = capitalize(formatHeading(range.from, range.to, period));

  const statItems =
    period === "day"
      ? param === "energy"
        ? [
            { label: "Total", value: fmtMetric(values.length ? total : null, decimals, unit) },
            { label: "Moyenne", value: fmtMetric(avg, decimals, unit) },
            { label: "Maximum", value: fmtMetric(max, decimals, unit) },
          ]
        : [
            {
              label: "Moyenne du jour",
              value: fmtMetric(avg, decimals, unit),
            },
            {
              label: "Maximum",
              value: fmtMetric(max, decimals, unit),
            },
            {
              label: "Minimum",
              value: fmtMetric(min, decimals, unit),
            },
          ]
      : [
          {
            label: param === "energy" ? "Total" : "Moyenne",
            value: fmtMetric(
              param === "energy" ? (values.length ? total : null) : avg,
              decimals,
              unit,
            ),
          },
          { label: "Maximum", value: fmtMetric(max, decimals, unit) },
          {
            label: param === "energy" ? "Moyenne" : "Minimum",
            value: fmtMetric(param === "energy" ? avg : min, decimals, unit),
          },
        ];

  return (
    <Card className="rounded-[22px] border-line bg-white p-4 shadow-joya-sm">
      <View className="gap-3">
        <View>
          <Text className="font-display text-[18px] font-bold tracking-tight text-navy">
            Historique
          </Text>
          <Text className="mt-0.5 text-[13px] text-ink-muted">
            Consulter n&apos;importe quel jour, une période, ou depuis
            l&apos;installation
          </Text>
        </View>
        {canNavigate ? (
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Période précédente"
              hitSlop={8}
              onPress={goPrev}
              className="rounded-md p-1.5 active:bg-slate-100"
            >
              <ChevronLeft size={18} color={joyaColors.navy} />
            </Pressable>
            <Text
              numberOfLines={1}
              className="min-w-0 flex-1 text-center text-sm font-medium text-slate-700"
            >
              {heading}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Période suivante"
              accessibilityState={{ disabled: atMaxCursor }}
              hitSlop={8}
              disabled={atMaxCursor}
              onPress={goNext}
              className={cn(
                "rounded-md p-1.5 active:bg-slate-100",
                atMaxCursor && "opacity-30",
              )}
            >
              <ChevronRight size={18} color={joyaColors.navy} />
            </Pressable>
          </View>
        ) : (
          <Text className="text-sm font-medium text-slate-700">{heading}</Text>
        )}
      </View>

      <View className="mt-4 flex-row flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityState={{ selected: period === p.id }}
            onPress={() => setPeriod(p.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5",
              period === p.id ? "bg-navy shadow-joya-xs" : "bg-transparent",
            )}
          >
            <Text
              className={cn(
                "text-xs font-semibold",
                period === p.id ? "text-white" : "text-slate-500",
              )}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-4 gap-4 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-joya-sm">
        <View className="gap-1.5">
          <FilterLabel>Paramètre</FilterLabel>
          <PillSelect
            label="Paramètre"
            className="h-10 self-start border-slate-200 px-4"
            value={draftParam}
            options={PARAMS.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
            onChange={(v) => setDraftParam(v as HistParam)}
          />
        </View>

        {draftParam !== "energy" ? (
          <View className="gap-1.5">
            <FilterLabel>Vue</FilterLabel>
            <View className="flex-row items-center gap-1.5">
              {(
                [
                  ["gen", "Général"],
                  ["phase", "Par phase"],
                ] as const
              ).map(([id, label]) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: view === id }}
                  onPress={() => setView(id)}
                  className={cn(
                    "h-10 items-center justify-center rounded-full px-4",
                    view === id ? "bg-navy" : "border border-line bg-white",
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-semibold",
                      view === id ? "text-white" : "text-slate-600",
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View className="gap-1.5">
          <FilterLabel>Date</FilterLabel>
          <DatePill
            label="Date"
            value={draftDate}
            max={today}
            onChange={setDraftDate}
            className="border-slate-200"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={applyFilters}
          disabled={loading}
          className={cn(
            "h-10 items-center justify-center self-start rounded-full bg-coral px-6 shadow-joya-xs active:bg-coral-dark",
            loading && "opacity-60",
          )}
        >
          <Text className="text-sm font-semibold text-white">Afficher</Text>
        </Pressable>
      </View>

      {period === "custom" ? (
        <View className="mt-3 flex-row flex-wrap items-end gap-3">
          <View className="gap-1">
            <Text className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Du
            </Text>
            <DatePill
              label="Du"
              value={customFrom}
              max={today}
              onChange={setCustomFrom}
              className="border-slate-200"
            />
          </View>
          <View className="gap-1">
            <Text className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Au
            </Text>
            <DatePill
              label="Au"
              value={customTo}
              max={today}
              onChange={setCustomTo}
              className="border-slate-200"
            />
          </View>
        </View>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        {statItems.map((stat, index) => (
          <StatBox
            key={stat.label}
            tone={index === 0 ? "accent" : "muted"}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </View>

      <View
        key={`${period}-${param}-${range.from}-${range.to}-${effView}`}
        className="relative mt-4 h-64 w-full"
      >
        {loading ? (
          <View className="h-full flex-row items-center justify-center gap-2">
            <ActivityIndicator size="small" color={joyaColors.coral} />
            <Text className="text-sm text-slate-500">
              Chargement de l&apos;historique…
            </Text>
          </View>
        ) : error ? (
          <View className="h-full items-center justify-center gap-2">
            <Text className="text-sm text-slate-500">{error}</Text>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setReloadTick((n) => n + 1)}
            >
              Réessayer
            </Button>
          </View>
        ) : !hasData ? (
          <ChartEmptyBox
            className="h-full"
            message="Aucune donnée sur cette période"
          />
        ) : effView === "phase" ? (
          <JoyaMultiLineChart
            rows={rows}
            series={[
              { key: "l1", label: "L1", color: EDGE_CHART_COLORS.l1 },
              { key: "l2", label: "L2", color: EDGE_CHART_COLORS.l2 },
              { key: "l3", label: "L3", color: EDGE_CHART_COLORS.l3 },
            ]}
            ariaLabel={`${title} par phase, ${unit}`}
            minXTickSpacing={hourAxis ? 56 : 64}
            formatTooltipValue={(v) => fmtMetric(v, decimals, unit)}
          />
        ) : (
          <JoyaAreaChart
            points={rows.map((r) => ({ label: r.label, value: r.gen }))}
            reference={avg != null ? rows.map(() => avg) : undefined}
            color={EDGE_CHART_COLORS.gen}
            unit={unit}
            ariaLabel={`${title}, ${unit}`}
            showPeak={false}
            minXTickSpacing={hourAxis ? 56 : 64}
            emptyMessage="Aucune donnée sur cette période"
            renderTooltip={(i) => (
              <>
                <TooltipTitle>{rows[i]?.label}</TooltipTitle>
                <TooltipValue color={EDGE_CHART_COLORS.gen}>
                  {fmtMetric(rows[i]?.gen, decimals, unit)}
                </TooltipValue>
              </>
            )}
          />
        )}
      </View>
      <Text className="mt-2 text-[11px] text-slate-400">
        {title} — {period === "day" ? "journée" : "période"} sélectionnée.
      </Text>
    </Card>
  );
}
