"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { YearlySavingsComparisonSeries } from "@/types/dashboard";
import {
  fullMonthLabelFr,
  takeLastClosedSavingsMonths,
} from "@/lib/dashboard/savings-comparison";
import { formatTnd } from "@/lib/format/currency";
import { JoyaEmptyState } from "@/components/joya";
import { ChartMetricLegend } from "./chart-metric-legend";
import {
  DASHBOARD_CHART_CARD_MIN_HEIGHT,
  DASHBOARD_SAVINGS_CHART_PLOT,
  DASHBOARD_SAVINGS_ESTIMATED_COLOR,
  DASHBOARD_SAVINGS_REAL_COLOR,
} from "./constants";
import { SavingsComparisonChart } from "./savings-comparison-chart";

type SavingsComparisonChartCardProps = {
  savingsComparisonByYear: YearlySavingsComparisonSeries[];
  onYearChange?: (year: number) => void;
};

export function SavingsComparisonChartCard({
  savingsComparisonByYear,
}: SavingsComparisonChartCardProps) {
  const chartData = useMemo(
    () => takeLastClosedSavingsMonths(savingsComparisonByYear),
    [savingsComparisonByYear],
  );

  const summary = useMemo(() => {
    if (!chartData.length) return null;
    const best = chartData.reduce((a, b) => (b.realEuro > a.realEuro ? b : a));
    const months = chartData.length;
    return {
      bestFull: fullMonthLabelFr(best.label),
      realTotal: chartData.reduce((sum, p) => sum + p.realEuro, 0),
      estimatedTotal: chartData.reduce((sum, p) => sum + p.estimatedEuro, 0),
      months,
    };
  }, [chartData]);

  return (
    <Card className={`flex flex-col rounded-[22px] lg:col-span-2 ${DASHBOARD_CHART_CARD_MIN_HEIGHT}`}>
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-3 space-y-0 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="flex items-center gap-2 font-display text-[15px] font-semibold leading-tight text-navy sm:text-base">
            <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
            Économie réelle vs économie estimée
          </CardTitle>
          <CardDescription className="text-[12.5px] text-ink-faint">
            {chartData.length > 0
              ? "TND · 3 derniers mois clôturés · réel vs étude"
              : "TND · en attente du premier mois clôturé"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-4 pb-4 pt-0 sm:px-5 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:gap-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1 lg:min-h-0">
          <div className={DASHBOARD_SAVINGS_CHART_PLOT}>
            {chartData.length > 0 ? (
              <SavingsComparisonChart data={chartData} />
            ) : (
              <JoyaEmptyState
                compact
                className="absolute inset-0 py-0"
                icon={Calendar}
                title="Moins d’un mois d’inscription"
                description="Les économies réelle vs estimée s’affichent après un mois calendaire complet."
              />
            )}
          </div>

          <ChartMetricLegend
            className="border-t-0 pt-1"
            items={[
              {
                label: "Économie réelle",
                color: DASHBOARD_SAVINGS_REAL_COLOR,
                variant: "solid",
              },
              {
                label: "Économie estimée (étude)",
                color: DASHBOARD_SAVINGS_ESTIMATED_COLOR,
                variant: "dashed",
              },
            ]}
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-[13.5rem] lg:flex-col">
          <div className="flex-1 rounded-[16px] bg-coral-soft px-4 py-3.5">
            <p className="text-[12px] font-medium text-ink-muted">Meilleur mois</p>
            <p className="mt-1 font-display text-[1.35rem] font-bold leading-none tracking-tight text-navy">
              {summary?.bestFull ?? "—"}
            </p>
            <p className="mt-2 text-[12.5px] font-semibold text-coral">
              Économie réelle la plus élevée
            </p>
          </div>
          <div className="flex-1 rounded-[16px] bg-cream-2 px-4 py-3.5">
            <p className="text-[12px] font-medium text-ink-muted">
              Réel cumulé · {summary?.months ?? 0} mois
            </p>
            <p className="mt-1.5 font-display text-[1.2rem] font-bold tabular-nums tracking-tight text-navy">
              {formatTnd(Math.round(summary?.realTotal ?? 0))}
            </p>
          </div>
          <div className="flex-1 rounded-[16px] bg-cream-2 px-4 py-3.5">
            <p className="text-[12px] font-medium text-ink-muted">
              Estimé cumulé · {summary?.months ?? 0} mois
            </p>
            <p className="mt-1.5 font-display text-[1.2rem] font-bold tabular-nums tracking-tight text-navy">
              {formatTnd(Math.round(summary?.estimatedTotal ?? 0))}
            </p>
          </div>
        </aside>
      </CardContent>
    </Card>
  );
}
