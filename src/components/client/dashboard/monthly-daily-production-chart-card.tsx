"use client";

import { translateUserMessage } from "@/lib/user-messages";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMonthlyDailyProduction } from "@/hooks/use-monthly-daily-production";
import {
  DASHBOARD_CHART_CARD_MIN_HEIGHT,
  DASHBOARD_CHART_COLOR,
  DASHBOARD_PRODUCTION_CHART_PLOT,
} from "./constants";
import {
  ChartMetricLegend,
  type ChartMetricLegendItem,
} from "./chart-metric-legend";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import { DailyProductionBarChart } from "./daily-production-bar-chart";
import { IntradayDailyTotalsRow } from "./intraday-daily-totals";

const MONTHLY_TOTAL_LABELS = {
  energy: "Écon. énergétiques mensuelles",
  savings: "Écon. financières mensuelles",
  co2: "CO₂ évité mensuellement",
} as const;

const MONTHLY_DAILY_METRIC_LEGEND: ChartMetricLegendItem[] = [
  { label: "Production du jour", color: DASHBOARD_CHART_COLOR, variant: "square" },
  { label: "Moyenne du mois", color: JOYA_CHART.navy, variant: "dashed" },
];

type MonthlyDailyProductionChartCardProps = {
  companyId?: string;
  enabled?: boolean;
};

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function formatMonthYearLabel(year: number, month: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function formatMonthSubtitle(year: number, month: number, timezone: string): string {
  const date = new Date(year, month - 1, 1);
  const monthName = date.toLocaleDateString("fr-FR", { month: "long" });
  return `kWh · ${monthName} ${year} · fuseau ${timezone}`;
}

export function MonthlyDailyProductionChartCard({
  companyId,
  enabled = true,
}: MonthlyDailyProductionChartCardProps) {
  const {
    data,
    selectedYear,
    selectedMonth,
    onMonthChange,
    isLoading,
    error,
  } = useMonthlyDailyProduction({ companyId, enabled });

  const monthRange = data?.monthRange;
  const canGoPrev =
    monthRange != null &&
    monthIndex(selectedYear, selectedMonth) >
      monthIndex(monthRange.minYear, monthRange.minMonth);
  const canGoNext =
    monthRange != null &&
    monthIndex(selectedYear, selectedMonth) <
      monthIndex(monthRange.maxYear, monthRange.maxMonth);

  const handlePrev = () => {
    if (!canGoPrev) return;
    const next = shiftMonth(selectedYear, selectedMonth, -1);
    onMonthChange(next.year, next.month);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    const next = shiftMonth(selectedYear, selectedMonth, 1);
    onMonthChange(next.year, next.month);
  };

  const handleMonthInput = (value: string) => {
    const [yearPart, monthPart] = value.split("-").map(Number);
    if (!yearPart || !monthPart) return;
    onMonthChange(yearPart, monthPart);
  };

  return (
    <Card
      className={cn(
        "flex flex-col rounded-[22px]",
        DASHBOARD_CHART_CARD_MIN_HEIGHT,
      )}
    >
      <CardHeader className="shrink-0 space-y-2 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="flex items-center gap-2 font-display text-[15px] font-semibold leading-tight text-navy sm:text-base">
              <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
              Production par jour
            </CardTitle>
            <CardDescription className="text-[12.5px] text-ink-faint">
              {data
                ? formatMonthSubtitle(data.year, data.month, data.timezone)
                : "kWh — production par jour"}
            </CardDescription>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-pill border border-line bg-white p-1 shadow-joya-xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev || (isLoading && !data)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-cream hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>

            <label className="relative min-w-[4.5rem] text-center">
              <span className="sr-only">Mois et année</span>
              <span className="pointer-events-none font-data text-xs font-medium tabular-nums text-navy">
                {formatMonthYearLabel(selectedYear, selectedMonth)}
              </span>
              <input
                type="month"
                value={`${selectedYear}-${String(selectedMonth).padStart(2, "0")}`}
                min={
                  monthRange
                    ? `${monthRange.minYear}-${String(monthRange.minMonth).padStart(2, "0")}`
                    : undefined
                }
                max={
                  monthRange
                    ? `${monthRange.maxYear}-${String(monthRange.maxMonth).padStart(2, "0")}`
                    : undefined
                }
                disabled={isLoading && !data}
                onChange={(e) => handleMonthInput(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </label>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext || (isLoading && !data)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-cream hover:text-navy disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-col gap-2 px-4 pb-3 pt-0 lg:min-h-0 lg:flex-1">
        <IntradayDailyTotalsRow
          totals={data?.monthlyTotals}
          labels={MONTHLY_TOTAL_LABELS}
          className={cn(isLoading && !data && "opacity-40")}
        />

        <div className={cn(DASHBOARD_PRODUCTION_CHART_PLOT, "relative min-h-0")}>
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/85 backdrop-blur-[1px]">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: DASHBOARD_CHART_COLOR }}
                aria-hidden
              />
              <p className="text-sm font-medium text-slate-600">
                Chargement du mois…
              </p>
            </div>
          ) : null}

          {error && !isLoading ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-danger">
              {translateUserMessage(
                error.message,
                "Impossible de charger la production mensuelle.",
              )}
            </div>
          ) : data && data.series.length > 0 ? (
            <DailyProductionBarChart data={data.series} />
          ) : !isLoading ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center text-sm text-slate-500">
              Aucune donnée pour ce mois.
            </div>
          ) : null}
        </div>

        <ChartMetricLegend items={MONTHLY_DAILY_METRIC_LEGEND} />
      </CardContent>
    </Card>
  );
}
