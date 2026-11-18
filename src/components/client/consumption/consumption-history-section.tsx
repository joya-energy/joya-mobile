"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  consumptionApi,
  type ConsumptionHistoryGrain,
  type ConsumptionHistoryPoint,
  type EdgeConsumptionMonitorResponse,
  type EdgeMetricPoint,
} from "@/lib/consumption/api";
import {
  AveragePillLabel,
  EDGE_CHART_COLORS,
  StatBox,
  fmtMetric,
  mean,
  sumPhases,
  type SeriesRow,
  type ViewMode,
} from "@/components/client/consumption/edge-consumption-charts";
import { mapDayMetricSeries, hourlyEnergyRows } from "@/lib/consumption/hourly-energy";
import { JOYA_CHART, JOYA_RECHARTS } from "@/components/joya/chart-theme";
import { formatAxis } from "@/components/client/dashboard/chart-kit";

type Period = "day" | "week" | "month" | "year" | "total" | "custom";
type HistParam = "active" | "voltage" | "current" | "energy";

const PERIODS: Array<{ id: Period; label: string }> = [
  { id: "day", label: "Jour" },
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
  { id: "total", label: "Total" },
  { id: "custom", label: "Personnalisé" },
];

const PARAMS: Array<{ id: HistParam; label: string }> = [
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

  useEffect(() => {
    setDraftDate(cursor);
  }, [cursor]);

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

  const heading = formatHeading(range.from, range.to, period);
  const chartTooltip = JOYA_RECHARTS.tooltip;

  return (
    <section className="rounded-[22px] border border-line bg-white p-4 shadow-joya-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-[1.15rem] font-bold tracking-tight text-navy">
            Historique
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Consulter n&apos;importe quel jour, une période, ou depuis
            l&apos;installation
          </p>
        </div>
        {canNavigate ? (
          <div className="flex items-center gap-1 self-end text-sm font-medium text-slate-700">
            <button
              type="button"
              className="rounded-md p-1 hover:bg-slate-100"
              onClick={goPrev}
              aria-label="Période précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[10rem] text-center capitalize">{heading}</span>
            <button
              type="button"
              className="rounded-md p-1 hover:bg-slate-100 disabled:opacity-30"
              onClick={goNext}
              disabled={atMaxCursor}
              aria-label="Période suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="self-end text-sm font-medium capitalize text-slate-700">
            {heading}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              period === p.id
                ? "bg-navy text-white shadow-joya-xs"
                : "bg-transparent text-slate-500 hover:bg-cream hover:text-navy",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
        <div className="flex min-w-[12rem] flex-col gap-1.5">
          <span className="font-data text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-400">
            Paramètre
          </span>
          <Select
            value={draftParam}
            onValueChange={(v) => setDraftParam(v as HistParam)}
          >
            <SelectTrigger className="h-10 w-[220px] rounded-full border-slate-200 bg-white px-4 text-sm font-medium shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARAMS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {draftParam !== "energy" ? (
          <div className="flex flex-col gap-1.5">
            <span className="font-data text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Vue
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  ["gen", "Général"],
                  ["phase", "Par phase"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={cn(
                    "h-10 rounded-full px-4 text-sm font-semibold transition-colors",
                    view === id
                      ? "bg-navy text-white"
                      : "border border-line bg-white text-slate-600 hover:border-line-strong",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <span className="font-data text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-400">
            Date
          </span>
          <label className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5">
            <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />
            <input
              type="date"
              value={draftDate}
              max={today}
              onChange={(e) => setDraftDate(e.target.value)}
              className="border-0 bg-transparent text-sm font-medium text-slate-800 outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={applyFilters}
          disabled={loading}
          className="h-10 rounded-pill bg-coral px-6 text-sm font-semibold text-white shadow-joya-xs transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:bg-coral-dark hover:shadow-joya-coral disabled:opacity-60"
        >
          Afficher
        </button>
      </div>

      {period === "custom" ? (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-slate-500">
              Du
            </Label>
            <input
              type="date"
              value={customFrom}
              max={today}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-slate-500">
              Au
            </Label>
            <input
              type="date"
              value={customTo}
              max={today}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {(period === "day"
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
            ]
        ).map((stat, index) => (
          <StatBox
            key={stat.label}
            tone={index === 0 ? "accent" : "muted"}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <div className="mt-4 h-64 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement de l&apos;historique…
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
            <p>{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadTick((n) => n + 1)}
            >
              Réessayer
            </Button>
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line-strong bg-cream/60 text-sm text-ink-muted">
            Aucune donnée sur cette période
          </div>
        ) : (
          <ResponsiveContainer
            key={`${period}-${param}-${range.from}-${range.to}-${effView}`}
            width="100%"
            height="100%"
          >
            {effView === "phase" ? (
              <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...JOYA_RECHARTS.grid} />
                <XAxis
                  dataKey="label"
                  tick={JOYA_RECHARTS.tick}
                  axisLine={JOYA_RECHARTS.axisLine}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={hourAxis ? 24 : 44}
                />
                <YAxis tick={JOYA_RECHARTS.tick} width={46} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatAxis(v)} />
                <Tooltip
                  formatter={(v: number) => [fmtMetric(v, decimals, unit), title]}
                  contentStyle={chartTooltip}
                  cursor={{ stroke: JOYA_CHART.navy, strokeOpacity: 0.25 }}
                />
                <Legend />
                <Line type="monotone" dataKey="l1" name="L1" stroke={EDGE_CHART_COLORS.l1} strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="l2" name="L2" stroke={EDGE_CHART_COLORS.l2} strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="l3" name="L3" stroke={EDGE_CHART_COLORS.l3} strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            ) : (
              <AreaChart data={rows} margin={{ top: 28, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="history-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EDGE_CHART_COLORS.gen} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={EDGE_CHART_COLORS.gen} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...JOYA_RECHARTS.grid} />
                <XAxis
                  dataKey="label"
                  tick={JOYA_RECHARTS.tick}
                  axisLine={JOYA_RECHARTS.axisLine}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={hourAxis ? 24 : 44}
                />
                <YAxis tick={JOYA_RECHARTS.tick} width={46} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatAxis(v)} />
                <Tooltip
                  formatter={(v: number) => [fmtMetric(v, decimals, unit), title]}
                  contentStyle={chartTooltip}
                  cursor={{ stroke: JOYA_CHART.navy, strokeOpacity: 0.25 }}
                />
                {avg != null ? (
                  <ReferenceLine
                    y={avg}
                    stroke={JOYA_CHART.navy}
                    strokeOpacity={0.4}
                    strokeDasharray="5 6"
                    label={
                      <AveragePillLabel
                        value={`Moy. ${fmtMetric(avg, decimals, unit)}`}
                      />
                    }
                  />
                ) : null}
                <Area
                  type="monotone"
                  dataKey="gen"
                  name={title}
                  stroke={EDGE_CHART_COLORS.gen}
                  fill="url(#history-area)"
                  strokeWidth={2.35}
                  dot={false}
                  activeDot={{ r: 5, fill: "#fff", stroke: EDGE_CHART_COLORS.gen, strokeWidth: 2.5 }}
                  connectNulls
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        {title} — {period === "day" ? "journée" : "période"} sélectionnée.
      </p>
    </section>
  );
}
