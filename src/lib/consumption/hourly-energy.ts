import type { EdgeMetricPoint } from "@/lib/consumption/api";
import {
  mapMetric,
  timeLabel,
  type SeriesRow,
} from "@/components/client/consumption/edge-consumption-charts";

const TZ = "Africa/Tunis";

/**
 * Time span (hours) above which a single series should be rolled up to hourly
 * averages. A normal calendar day stays on minute / sample labels.
 */
export const HOURLY_FALLBACK_SPAN_HOURS = 36;

function tunisHour(iso: string): number | null {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(t)).find((p) => p.type === "hour")?.value,
  );
  return Number.isFinite(hour) ? hour : null;
}

function seriesSpanHours(points: EdgeMetricPoint[]): number {
  if (points.length < 2) return 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const p of points) {
    const t = new Date(p.t).getTime();
    if (!Number.isFinite(t)) continue;
    if (t < min) min = t;
    if (t > max) max = t;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return 0;
  return (max - min) / 3_600_000;
}

function intervalKwh(
  prev: EdgeMetricPoint | undefined,
  curr: EdgeMetricPoint,
): number | null {
  const tCurr = new Date(curr.t).getTime();
  const tPrev = prev ? new Date(prev.t).getTime() : tCurr - 15 * 60 * 1000;
  let dtH = (tCurr - tPrev) / 3_600_000;
  if (!Number.isFinite(dtH) || dtH <= 0) dtH = 0.25;
  if (dtH > 1) dtH = 1;

  if (
    curr.active_power_total_kw != null &&
    Number.isFinite(curr.active_power_total_kw)
  ) {
    return Math.max(0, curr.active_power_total_kw) * dtH;
  }
  if (
    prev &&
    curr.import_active_kwh != null &&
    prev.import_active_kwh != null &&
    Number.isFinite(curr.import_active_kwh) &&
    Number.isFinite(prev.import_active_kwh) &&
    curr.import_active_kwh >= prev.import_active_kwh
  ) {
    return curr.import_active_kwh - prev.import_active_kwh;
  }
  return null;
}

/** One bar per hour = Σ energy of every sample that fell in that hour. */
export function sumConsumptionByHour(points: EdgeMetricPoint[]): SeriesRow[] {
  const totals = Array.from({ length: 24 }, () => 0);
  const seen = Array.from({ length: 24 }, () => false);
  const sorted = [...points].sort(
    (a, b) => new Date(a.t).getTime() - new Date(b.t).getTime(),
  );

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i]!;
    const hour = tunisHour(curr.t);
    if (hour == null || hour < 0 || hour > 23) continue;
    const kwh = intervalKwh(sorted[i - 1], curr);
    if (kwh == null || !Number.isFinite(kwh)) continue;
    totals[hour] += kwh;
    seen[hour] = true;
  }

  return totals.map((kwh, hour) => ({
    label: `${String(hour).padStart(2, "0")}h`,
    t: "",
    gen: seen[hour] ? Math.round(kwh * 1000) / 1000 : null,
    l1: null,
    l2: null,
    l3: null,
  }));
}

/** Prefer API hourly energy (raw ∫P·dt) so the bar chart matches the day card. */
export function hourlyEnergyRows(
  hourly: Array<Pick<EdgeMetricPoint, "t" | "hour" | "energy_kwh">> | undefined,
): SeriesRow[] | null {
  if (!hourly?.length) return null;
  const hasEnergy = hourly.some(
    (p) => p.energy_kwh != null && Number.isFinite(p.energy_kwh),
  );
  if (!hasEnergy) return null;
  return Array.from({ length: 24 }, (_, hour) => {
    const point =
      hourly.find((p) => p.hour === hour) ??
      hourly.find((p) => tunisHour(p.t ?? "") === hour) ??
      hourly[hour];
    const kwh = point?.energy_kwh;
    return {
      label: `${String(hour).padStart(2, "0")}h`,
      t: point?.t ?? "",
      gen:
        kwh != null && Number.isFinite(kwh)
          ? Math.round(kwh * 1000) / 1000
          : null,
      l1: null,
      l2: null,
      l3: null,
    };
  });
}

function avg(xs: number[]): number | null {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export type DayMetricPick = (p: EdgeMetricPoint) => {
  gen: number | null;
  l1: number | null;
  l2: number | null;
  l3: number | null;
};

/** One point per hour = mean of samples in that hour (full 00h–23h range). */
export function averageByHour(
  points: EdgeMetricPoint[],
  pick: DayMetricPick,
): SeriesRow[] {
  const buckets = Array.from({ length: 24 }, () => ({
    gen: [] as number[],
    l1: [] as number[],
    l2: [] as number[],
    l3: [] as number[],
  }));

  for (const point of points) {
    const hour = tunisHour(point.t);
    if (hour == null || hour < 0 || hour > 23) continue;
    const v = pick(point);
    if (v.gen != null && Number.isFinite(v.gen)) buckets[hour].gen.push(v.gen);
    if (v.l1 != null && Number.isFinite(v.l1)) buckets[hour].l1.push(v.l1);
    if (v.l2 != null && Number.isFinite(v.l2)) buckets[hour].l2.push(v.l2);
    if (v.l3 != null && Number.isFinite(v.l3)) buckets[hour].l3.push(v.l3);
  }

  return buckets.map((b, hour) => ({
    label: `${String(hour).padStart(2, "0")}h`,
    t: "",
    gen: avg(b.gen),
    l1: avg(b.l1),
    l2: avg(b.l2),
    l3: avg(b.l3),
  }));
}

export type DaySeriesResolution = "minute" | "hour";

/**
 * Day / sample charts: always keep minute (or native sample) labels for a
 * normal day. Only roll up to hourly averages when the *time span* of the
 * series is wider than a day+ (multi-day range), not when a single day has
 * many samples.
 */
export function mapDayMetricSeries(
  points: EdgeMetricPoint[],
  pick: DayMetricPick,
  opts?: { forceMinute?: boolean },
): { rows: SeriesRow[]; resolution: DaySeriesResolution } {
  if (points.length === 0) {
    return { rows: [], resolution: "minute" };
  }

  const spanHours = seriesSpanHours(points);
  const useHourly =
    !opts?.forceMinute && spanHours > HOURLY_FALLBACK_SPAN_HOURS;

  if (useHourly) {
    return {
      rows: averageByHour(points, pick),
      resolution: "hour",
    };
  }

  return {
    rows: mapMetric(points, pick),
    resolution: "minute",
  };
}

/** Build minute-labelled rows without hourly collapse. */
export function mapMinuteMetricSeries(
  points: EdgeMetricPoint[],
  pick: DayMetricPick,
): SeriesRow[] {
  return points.map((p, idx) => {
    const picked = pick(p);
    const label =
      timeLabel(p.t) || `${String(p.hour ?? idx).padStart(2, "0")}h`;
    return { label, t: p.t, ...picked };
  });
}
