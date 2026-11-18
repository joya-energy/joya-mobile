import type {
  IntradayDailyTotals,
  MonthlyDailyProductionChartData,
  MonthlyDailyProductionPoint,
} from "@/types/dashboard";

export type MonthlyDailyProductionApiResponse = {
  year: number;
  month: number;
  timezone: string;
  month_range: {
    min_year: number;
    min_month: number;
    max_year: number;
    max_month: number;
  };
  days_in_month: number;
  series_start_day?: number;
  series: Array<{
    day: number;
    date: string;
    label: string;
    production_kwh: number;
  }>;
  monthly_totals: {
    production_kwh: number;
    savings_tnd: number;
    co2_kg: number;
  };
};

function toMonthlyTotals(
  raw: MonthlyDailyProductionApiResponse["monthly_totals"],
): IntradayDailyTotals {
  return {
    productionKwh: raw.production_kwh,
    savingsTnd: raw.savings_tnd,
    co2Kg: raw.co2_kg,
  };
}

export function toMonthlyDailyProductionChartData(
  raw: MonthlyDailyProductionApiResponse,
): MonthlyDailyProductionChartData {
  const series: MonthlyDailyProductionPoint[] = raw.series.map((point) => ({
    day: point.day,
    date: point.date,
    label: point.label,
    productionKwh: point.production_kwh,
  }));

  return {
    year: raw.year,
    month: raw.month,
    timezone: raw.timezone,
    monthRange: {
      minYear: raw.month_range.min_year,
      minMonth: raw.month_range.min_month,
      maxYear: raw.month_range.max_year,
      maxMonth: raw.month_range.max_month,
    },
    daysInMonth: raw.days_in_month,
    seriesStartDay: raw.series_start_day ?? 1,
    series,
    monthlyTotals: toMonthlyTotals(raw.monthly_totals),
  };
}
