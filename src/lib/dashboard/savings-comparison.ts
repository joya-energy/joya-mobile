import type {
  SavingsComparisonPoint,
  YearlySavingsComparisonSeries,
} from "@/types/dashboard";
import { clientDashboardChartNumber, clientDashboardText } from "./defaults";

export type SavingsComparisonMonthApiItem = {
  label?: string;
  real_euro?: number;
  realEuro?: number;
  estimated_euro?: number;
  estimatedEuro?: number;
};

export type SavingsComparisonByYearApiItem = {
  year?: number;
  months?: SavingsComparisonMonthApiItem[];
};

export function normalizeSavingsMonths(
  list: SavingsComparisonMonthApiItem[],
): SavingsComparisonPoint[] {
  return list.map((item, index) => ({
    label: clientDashboardText(item.label ?? `M${index + 1}`),
    realEuro: clientDashboardChartNumber(item.realEuro ?? item.real_euro),
    estimatedEuro: clientDashboardChartNumber(
      item.estimatedEuro ?? item.estimated_euro,
    ),
  }));
}

/** Newest year first. */
export function sortSavingsByYear(
  series: YearlySavingsComparisonSeries[],
): YearlySavingsComparisonSeries[] {
  return [...series].sort((a, b) => b.year - a.year);
}

export function getDefaultSavingsYear(
  series: YearlySavingsComparisonSeries[],
): number | null {
  return sortSavingsByYear(series)[0]?.year ?? null;
}

/** API returns only completed calendar months. */
export function getSavingsComparisonForYear(
  series: YearlySavingsComparisonSeries[],
  year: number,
): SavingsComparisonPoint[] {
  return series.find((s) => s.year === year)?.months ?? [];
}

const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Fév: 1,
  Mar: 2,
  Avr: 3,
  Mai: 4,
  Juin: 5,
  Juil: 6,
  Août: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Déc: 11,
};

const MONTH_FULL_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export function fullMonthLabelFr(shortLabel: string): string {
  const idx = MONTH_INDEX[shortLabel];
  return idx != null ? MONTH_FULL_FR[idx] : shortLabel;
}

export const SAVINGS_COMPARISON_CLOSED_MONTH_COUNT = 3;

/** Last fully closed calendar months (current month is omitted until it ends). */
export function takeLastClosedSavingsMonths(
  series: YearlySavingsComparisonSeries[],
  count = SAVINGS_COMPARISON_CLOSED_MONTH_COUNT,
  now = new Date(),
  timeZone = "Africa/Tunis",
): SavingsComparisonPoint[] {
  const ymd = now.toLocaleDateString("en-CA", { timeZone });
  const yearNow = Number(ymd.slice(0, 4));
  const monthNow = Number(ymd.slice(5, 7));
  let year = yearNow;
  let monthIdx = monthNow - 2;
  if (monthIdx < 0) {
    monthIdx += 12;
    year -= 1;
  }

  const wanted: Array<{ year: number; month: number }> = [];
  for (let i = 0; i < count; i += 1) {
    wanted.unshift({ year, month: monthIdx });
    monthIdx -= 1;
    if (monthIdx < 0) {
      monthIdx = 11;
      year -= 1;
    }
  }

  const byKey = new Map<string, SavingsComparisonPoint>();
  for (const entry of series) {
    for (const point of entry.months) {
      const mi = MONTH_INDEX[point.label];
      if (mi == null) continue;
      byKey.set(`${entry.year}-${mi}`, point);
    }
  }

  const closed = wanted.flatMap((slot) => {
    const existing = byKey.get(`${slot.year}-${slot.month}`);
    return existing ? [existing] : [];
  });
  const firstReal = closed.findIndex((point) => point.realEuro > 0);
  if (firstReal < 0) return [];
  return closed.slice(firstReal);
}
