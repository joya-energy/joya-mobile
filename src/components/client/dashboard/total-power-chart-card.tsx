"use client";

import { translateUserMessage } from "@/lib/user-messages";
import { CalendarDays, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIntradayPower } from "@/hooks/use-intraday-power";
import {
  DASHBOARD_CHART_CARD_MIN_HEIGHT,
  DASHBOARD_CHART_COLOR,
  DASHBOARD_INTRADAY_METRICS_BAND,
  DASHBOARD_PRODUCTION_CHART_PLOT,
} from "./constants";
import {
  ChartMetricLegend,
  DASHBOARD_POWER_LEGEND,
} from "./chart-metric-legend";
import { IntradayDailyTotalsRow } from "./intraday-daily-totals";
import { ProductionHourlyChart } from "./production-hourly-chart";

type TotalPowerChartCardProps = {
  companyId?: string;
  enabled?: boolean;
};

function formatDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function TotalPowerChartCard({
  companyId,
  enabled = true,
}: TotalPowerChartCardProps) {
  const { data, selectedDate, onDateChange, isLoading, error } = useIntradayPower({
    companyId,
    enabled,
  });

  const minDate = data?.dateRange.min;
  const maxDate = data?.dateRange.max;
  const subtitle = data
    ? `kW moy. / 15 min · ${formatDayLabel(data.date)} · fuseau ${data.timezone}`
    : "kW moy. / 15 min";

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
              Puissance
            </CardTitle>
            <CardDescription className="text-[12.5px] text-ink-faint">
              {subtitle}
            </CardDescription>
          </div>
          <label className="flex shrink-0 items-center gap-2 rounded-pill border border-line bg-white px-3 py-1.5 shadow-joya-xs transition-[border-color,box-shadow] focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20">
            <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden />
            <span className="sr-only">Jour à afficher</span>
            <input
              type="date"
              value={selectedDate}
              min={minDate}
              max={maxDate}
              disabled={isLoading && !data}
              onChange={(e) => onDateChange(e.target.value)}
              className="border-0 bg-transparent p-0 font-data text-xs font-medium text-navy outline-none [color-scheme:light] disabled:opacity-50"
            />
          </label>
        </div>
      </CardHeader>
      <CardContent className="relative flex flex-col gap-3 px-4 pb-3 pt-0 lg:min-h-0 lg:flex-1">
        <div
          className={cn(
            DASHBOARD_INTRADAY_METRICS_BAND,
            isLoading && !data && "opacity-40",
          )}
        >
          <IntradayDailyTotalsRow
            totals={
              data &&
              data.invertersConnected === false &&
              data.date ===
                new Date().toLocaleDateString("en-CA", {
                  timeZone: data.timezone,
                }) &&
              !data.series.some((point) => point.valueKw > 0 && !point.isLive)
                ? { productionKwh: 0, savingsTnd: 0, co2Kg: 0 }
                : data?.dailyTotals
            }
            className="w-full"
          />
        </div>
        <div className={cn(DASHBOARD_PRODUCTION_CHART_PLOT, "relative")}>
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/85 backdrop-blur-[1px]">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: DASHBOARD_CHART_COLOR }}
                aria-hidden
              />
              <p className="text-sm font-medium text-slate-600">
                Chargement de la courbe…
              </p>
              <p className="max-w-xs px-4 text-center text-xs text-slate-400">
                Récupération des mesures pour ce jour…
              </p>
            </div>
          ) : null}
          {error && !isLoading ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-danger">
              {translateUserMessage(
                error.message,
                "Impossible de charger la courbe de puissance.",
              )}
            </div>
          ) : (
            <ProductionHourlyChart
              series={data?.series ?? []}
              lastPointIndex={data?.lastPointIndex ?? null}
            />
          )}
        </div>

        <ChartMetricLegend items={DASHBOARD_POWER_LEGEND} />
      </CardContent>
    </Card>
  );
}
