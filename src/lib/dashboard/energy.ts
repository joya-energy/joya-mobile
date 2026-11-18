import type {
  EnergyMonthApiItem,
  MonthlyEnergyPoint,
  YearlyEnergySeries,
} from "@/types/dashboard";
import { clientDashboardChartNumber, clientDashboardText } from "./defaults";

export function normalizeEnergyMonths(list: EnergyMonthApiItem[]): MonthlyEnergyPoint[] {
  return list.map((p) => ({
    label: clientDashboardText(p.label ?? p.month),
    valueKw: clientDashboardChartNumber(p.valueKw ?? p.value_kw),
  }));
}
/** Newest year first. */
export function sortEnergyByYear(series: YearlyEnergySeries[]): YearlyEnergySeries[] {
  return [...series].sort((a, b) => b.year - a.year);
}

export function getDefaultEnergyYear(series: YearlyEnergySeries[]): number | null {
  const sorted = sortEnergyByYear(series);
  return sorted[0]?.year ?? null;
}

export function getEnergyMonthsForYear(
  series: YearlyEnergySeries[],
  year: number,
): MonthlyEnergyPoint[] {
  return series.find((s) => s.year === year)?.months ?? [];
}
