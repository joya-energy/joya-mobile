"use client";

import { translateUserMessage } from "@/lib/user-messages";
import { CalendarDays, Clock, Loader2, Sun, SunMedium } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIntradayIrradiation } from "@/hooks/use-intraday-irradiation";
import {
  DASHBOARD_CHART_CARD_MIN_HEIGHT,
  DASHBOARD_INTRADAY_METRICS_BAND,
  DASHBOARD_IRRADIATION_COLOR,
  DASHBOARD_IRRADIATION_TILTED_COLOR,
  DASHBOARD_PRODUCTION_CHART_PLOT,
} from "./constants";
import {
  ChartMetricLegend,
  type ChartMetricLegendItem,
} from "./chart-metric-legend";
import { DailyTotalBadge } from "./intraday-daily-totals";
import { IrradiationHourlyChart } from "./irradiation-hourly-chart";

type IrradiationChartCardProps = {
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

function formatWm2(v: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(v))}\u00a0W/m²`;
}

function formatKwhM2(v: number | null | undefined): string {
  if (v == null || !(v > 0)) return "—";
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}\u00a0kWh/m²`;
}

export function IrradiationChartCard({
  companyId,
  enabled = true,
}: IrradiationChartCardProps) {
  const { data, selectedDate, onDateChange, isLoading, error } =
    useIntradayIrradiation({
      companyId,
      enabled,
    });

  const minDate = data?.dateRange.min;
  const maxDate = data?.dateRange.max;
  const subtitle = data
    ? `W/m² · 15 min · ${formatDayLabel(data.date)} · fuseau ${data.timezone}`
    : "W/m² · 15 min · irradiation via Open-Meteo";

  const hasTilted = data?.source === "tilted";
  const peakSeriesKey = hasTilted ? "poaWm2" : "ghiWm2";
  const peakPoint = data?.series.reduce<{ label: string; v: number } | null>(
    (best, p) => {
      const v = p[peakSeriesKey];
      return v != null && (!best || v > best.v)
        ? { label: p.label, v }
        : best;
    },
    null,
  );
  const peakTime = peakPoint && peakPoint.v > 0 ? peakPoint.label : "—";
  const dailyWh =
    data?.series.reduce(
      (sum, p) => sum + ((hasTilted ? p.poaWm2 : p.ghiWm2) ?? 0) * 0.25,
      0,
    ) ?? 0;
  const dailyKwhM2 =
    dailyWh > 0
      ? `${(dailyWh / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}\u00a0kWh/m²`
      : "—";
  const peakLabel =
    data && data.peakWm2 > 0 ? formatWm2(data.peakWm2) : "—";

  const legendItems: ChartMetricLegendItem[] = [
    {
      label: `Plan horizontal${
        data && data.peakGhiWm2 > 0
          ? ` ${new Intl.NumberFormat("fr-FR").format(Math.round(data.peakGhiWm2))} W/m²`
          : ""
      }`,
      color: DASHBOARD_IRRADIATION_COLOR,
      variant: "solid",
    },
  ];
  if (hasTilted) {
    legendItems.push({
      label: `Plan incliné${
        data?.peakPoaWm2 != null && data.peakPoaWm2 > 0
          ? ` ${new Intl.NumberFormat("fr-FR").format(Math.round(data.peakPoaWm2))} W/m²`
          : ""
      }`,
      color: DASHBOARD_IRRADIATION_TILTED_COLOR,
      variant: "solid",
    });
  }

  const plane = data?.plane;
  const fetchedLabel = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card
      className={cn(
        "flex flex-col",
        DASHBOARD_CHART_CARD_MIN_HEIGHT,
      )}
    >
      <CardHeader className="shrink-0 space-y-2 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="font-display text-[15px] font-semibold leading-tight text-navy sm:text-base">
              Irradiation
            </CardTitle>
            <CardDescription className="text-[12.5px] text-ink-faint">
              {subtitle}
            </CardDescription>
          </div>
          <label className="flex shrink-0 items-center gap-2 rounded-pill border border-line bg-white px-3 py-1.5 shadow-joya-xs transition-[border-color,box-shadow] focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20">
            <CalendarDays className="h-4 w-4 text-sun" aria-hidden />
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
        {data?.warnings && data.warnings.length > 0 ? (
          <ul className="space-y-1 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-[12px] text-amber-950">
            {data.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
        <div
          className={cn(
            DASHBOARD_INTRADAY_METRICS_BAND,
            isLoading && !data && "opacity-40",
          )}
        >
          <div
            className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5"
            role="group"
            aria-label="Indicateurs d'irradiation du jour sélectionné"
          >
            <DailyTotalBadge
              label="Pic du jour"
              value={peakLabel}
              tone="sun"
              icon={<Sun className="h-4 w-4" />}
            />
            <DailyTotalBadge
              label="Heure du pic"
              value={peakTime}
              tone="coral"
              icon={<Clock className="h-4 w-4" />}
            />
            <DailyTotalBadge
              label="Ensoleillement cumulé"
              value={dailyKwhM2}
              tone="sun"
              icon={<SunMedium className="h-4 w-4" />}
            />
          </div>
        </div>
        <div className={cn(DASHBOARD_PRODUCTION_CHART_PLOT, "relative")}>
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/85 backdrop-blur-[1px]">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: DASHBOARD_IRRADIATION_COLOR }}
                aria-hidden
              />
              <p className="text-sm font-medium text-slate-600">
                Chargement de la courbe…
              </p>
            </div>
          ) : null}
          {error && !isLoading ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-danger">
              {translateUserMessage(
                error.message,
                "Impossible de charger la courbe d'irradiation.",
              )}
            </div>
          ) : (
            <IrradiationHourlyChart
              series={data?.series ?? []}
              lastPointIndex={data?.lastPointIndex ?? null}
              showTilted={hasTilted}
            />
          )}
        </div>

        <ChartMetricLegend items={legendItems} />

        {data ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-2 text-[11px] text-ink-muted">
            <span>
              Panneaux {formatKwhM2(data.totals.poaKwhM2)} · Plat{" "}
              {formatKwhM2(data.totals.ghiKwhM2)}
              {data.totals.ratio != null
                ? ` · ratio ${data.totals.ratio.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}`
                : ""}
            </span>
            {plane ? (
              <span>
                Inclinaison{" "}
                {plane.tilt != null ? `${plane.tilt}°` : "—"} · Azimut{" "}
                {plane.azimuth}°
              </span>
            ) : null}
            <span>
              Source {data.source}
              {data.provider !== "none" ? ` · ${data.provider}` : ""}
              {data.confidence ? ` · confiance ${data.confidence}` : ""}
              {fetchedLabel ? ` · maj ${fetchedLabel}` : ""}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
