"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { YearlyEnergySeries } from "@/types/dashboard";
import {
  getDefaultEnergyYear,
  getEnergyMonthsForYear,
  sortEnergyByYear,
} from "@/lib/dashboard/energy";
import {
  DASHBOARD_CHART_CARD_MIN_HEIGHT,
  DASHBOARD_CHART_COLOR,
  DASHBOARD_ENERGY_CHART_PLOT,
} from "./constants";
import { ChartMetricLegend } from "./chart-metric-legend";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import { EnergyBarChart } from "./energy-bar-chart";

type EnergyMonthlyChartCardProps = {
  energyByYear: YearlyEnergySeries[];
  onYearChange?: (year: number) => void;
};

export function EnergyMonthlyChartCard({
  energyByYear,
  onYearChange,
}: EnergyMonthlyChartCardProps) {
  const years = useMemo(
    () => sortEnergyByYear(energyByYear).map((s) => s.year),
    [energyByYear],
  );

  const defaultYear = getDefaultEnergyYear(energyByYear);
  const [selectedYear, setSelectedYear] = useState<number | null>(defaultYear);

  useEffect(() => {
    if (defaultYear !== null) {
      setSelectedYear(defaultYear);
    }
  }, [defaultYear]);

  const activeYear = selectedYear ?? defaultYear;
  const chartData =
    activeYear !== null ? getEnergyMonthsForYear(energyByYear, activeYear) : [];

  const handleYearChange = (value: string) => {
    const year = Number(value);
    setSelectedYear(year);
    onYearChange?.(year);
  };

  return (
    <Card
      className={`flex flex-col rounded-[22px] ${DASHBOARD_CHART_CARD_MIN_HEIGHT}`}
    >
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-3 space-y-0 px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="flex items-center gap-2 font-display text-[15px] font-semibold leading-tight text-navy sm:text-base">
            <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
            Production par mois
          </CardTitle>
          <CardDescription className="text-[12.5px] text-ink-faint">
            kWh · mois en cours en clair
          </CardDescription>
        </div>
        {years.length > 0 && activeYear !== null ? (
          <div className="w-fit shrink-0">
            <Select value={String(activeYear)} onValueChange={handleYearChange}>
              <SelectTrigger
                className="!h-9 !w-fit min-w-0 gap-1 rounded-pill px-3 py-1.5 font-data text-[13px] font-medium tabular-nums [&>span]:line-clamp-none"
                aria-label="Année"
              >
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4 pb-3 pt-0 sm:px-5 lg:min-h-0 lg:flex-1">
        <div className={DASHBOARD_ENERGY_CHART_PLOT}>
          {chartData.length > 0 ? (
            <EnergyBarChart
              data={chartData}
              year={activeYear ?? new Date().getFullYear()}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
              Aucune donnée pour cette année.
            </div>
          )}
        </div>

        <ChartMetricLegend
          items={[
            { label: "Production mensuelle", color: DASHBOARD_CHART_COLOR, variant: "square" },
            { label: "Moyenne mensuelle", color: JOYA_CHART.navy, variant: "dashed" },
          ]}
        />
      </CardContent>
    </Card>
  );
}

/** @deprecated Use EnergyMonthlyChartCard */
export const SavingsMonthlyChartCard = EnergyMonthlyChartCard;
